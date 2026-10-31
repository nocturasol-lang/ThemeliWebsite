/* THEMELI — Leaflet projects map
 *
 * Leaflet, the prefecture GeoJSON and the location table are NOT in the page
 * head: they are fetched on first use (hover/focus of the Map view button
 * prefetches, showing the Map view initialises). Until then the view toggle
 * only shows the empty map box, and window._resetMapZoom is a safe no-op.
 *
 * Pins are vector circles on a single <canvas> (no DOM per project); only the
 * active project's pin/segment is touched on open/close.
 */

(function () {
  const mapEl = document.getElementById('projLeafletMap');
  if (!mapEl) return;

  const PIN_COLOR = '#FF731E';
  const PIN_STROKE = '#0a0d13';
  const base = (typeof BASE !== 'undefined') ? BASE : '';
  const ASSET_CSS = base + 'assets/vendor/leaflet/leaflet.css';
  const ASSET_JS = [
    base + 'assets/vendor/leaflet/leaflet.js',
    base + 'assets/greece-prefectures.js',
    base + 'assets/map-locations.js'
  ];

  const mapBtn = document.querySelector('#projViewToggles .proj-view-btn[data-view="map"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Lazy loading ----------
  let assetsPromise = null;
  let initPromise = null;
  let api = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  function loadStyle(href) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('link[href="' + href + '"]');
      if (existing) { resolve(); return; }
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.onload = resolve;
      l.onerror = () => reject(new Error('Failed to load ' + href));
      document.head.appendChild(l);
    });
  }

  function ensureAssets() {
    if (!assetsPromise) {
      assetsPromise = Promise.all([loadStyle(ASSET_CSS), ...ASSET_JS.map(loadScript)])
        .catch(err => { assetsPromise = null; throw err; });
    }
    return assetsPromise;
  }

  function isVisible() {
    return mapEl.offsetWidth > 0 && mapEl.offsetHeight > 0;
  }

  function startInit() {
    if (initPromise) return initPromise;
    initPromise = ensureAssets()
      .then(createMap)
      .then(created => {
        api = created;
        mapEl._projMap = created; // devtools / test handle (not used by the site)
      })
      .catch(err => {
        initPromise = null;
        console.warn('[map] could not initialise the projects map:', err && err.message ? err.message : err);
      });
    return initPromise;
  }

  // Prefetch on intent: the first hover/focus/touch of the Map button starts
  // the downloads so the click that follows finds them in cache.
  if (mapBtn) {
    const prefetch = () => { ensureAssets().catch(() => {}); };
    mapBtn.addEventListener('pointerenter', prefetch, { once: true });
    mapBtn.addEventListener('focus', prefetch, { once: true });
    mapBtn.addEventListener('touchstart', prefetch, { once: true, passive: true });
  }

  // Called by 09-projects-ui.js on every view/filter toggle. Before the map
  // exists it only kicks off loading when the map box is actually on screen.
  window._resetMapZoom = function () {
    if (api) { api.reset(); return; }
    if (isVisible()) startInit();
  };

  // ---------- i18n helpers (global T, LANG from 02-i18n.js) ----------
  const isEn = () => (typeof LANG !== 'undefined' && LANG === 'en');
  function lName(p) { return isEn() ? (p.name_en || p.name) : p.name; }
  function lDesc(p) { return isEn() ? (p.description_en || p.description || '') : (p.description || ''); }
  function tTyp(v) { return (typeof T !== 'undefined' && T.typ && T.typ[v]) || v; }
  function tLoc(v) { return (typeof T !== 'undefined' && T.loc && T.loc[v]) || v; }

  // ---------- Coordinates ----------
  function projectPoints(p) {
    if (Array.isArray(p.points) && p.points.length >= 2) return p.points;
    return [[p.lat, p.lng]];
  }

  // Projects with real lat/lng keep them. The rest are placed at their
  // location's centre; projects sharing a centre are spread on a small ring
  // (1.5–3 km, by index in the group) so they separate when zoomed in.
  function placeProjects(all) {
    const LOC = window.MAP_LOCATIONS || {};
    const REG = window.MAP_REGIONS || {};
    const entries = [];
    const groups = new Map();

    for (const p of all) {
      if (p.lat != null && p.lng != null) {
        entries.push({ p, pts: projectPoints(p), approx: false });
        continue;
      }
      const loc = (p.location || '').trim();
      let key = null, anchor = null;
      if (loc && LOC[loc]) { key = 'loc:' + loc; anchor = LOC[loc]; }
      else if (p.region && REG[p.region]) { key = 'region:' + p.region; anchor = REG[p.region]; }
      if (!anchor) continue; // abroad / unknown / empty → not on the map
      const e = { p, pts: null, approx: true, key, anchor };
      entries.push(e);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }

    for (const members of groups.values()) {
      members.sort((a, b) => (a.p.id || 0) - (b.p.id || 0));
      const n = members.length;
      if (n === 1) { members[0].pts = [members[0].anchor.slice()]; continue; }
      const radiusKm = Math.max(1.5, Math.min(3, 0.18 * n));
      const dLat = radiusKm / 111.32;
      members.forEach((e, i) => {
        const [lat, lng] = e.anchor;
        const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const dLng = dLat / Math.cos(lat * Math.PI / 180);
        e.pts = [[lat + dLat * Math.sin(a), lng + dLng * Math.cos(a)]];
      });
    }
    return entries;
  }

  // ---------- Map ----------
  async function createMap() {
    if (typeof L === 'undefined') throw new Error('Leaflet not loaded');
    if (typeof GREECE_PREFECTURES === 'undefined') throw new Error('greece-prefectures.js not loaded');

    const map = L.map(mapEl, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 11,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120
    });

    const regionLayer = L.geoJSON(GREECE_PREFECTURES, {
      style: () => ({ fillColor: '#e7e7ea', color: '#2a2d34', weight: 0.6, fillOpacity: 0.94 }),
      interactive: false
    }).addTo(map);
    const greeceBounds = regionLayer.getBounds();

    // leaflet.css stacks <canvas> (z 100) under <svg> (z 200) inside one pane,
    // so the pin canvas lives in the marker pane (z 600), above the prefectures.
    const renderer = L.canvas({ padding: 0.5, tolerance: 4, pane: 'markerPane' });
    const pinLayer = L.layerGroup().addTo(map);
    const activeLayer = L.layerGroup().addTo(map);

    const animate = () => !reduceMotion.matches;
    function isAnimating() {
      return !!(map._flyToFrame || map._animatingZoom || (map._panAnim && map._panAnim._inProgress));
    }
    function stopAnim() { if (isAnimating()) map.stop(); }

    // ---------- Fit ----------
    let needsFit = true;
    function fitToGreece() {
      if (!isVisible()) { needsFit = true; return; }
      needsFit = false;
      stopAnim();
      map.invalidateSize({ animate: false });
      // Let the fit pick the zoom freely, then lock min zoom / max bounds
      // around the result so the centred view is always allowed.
      map.setMaxBounds(null);
      map.setMinZoom(3);
      map.fitBounds(greeceBounds, { padding: [0, 0], animate: false });
      map.setMinZoom(Math.min(6, map.getZoom()));
      map.setMaxBounds(greeceBounds.pad(0.3).extend(map.getBounds()));
    }

    // ---------- State ----------
    let activeProject = null;
    let activeEntry = null;
    let viewBeforeProject = null;
    let lastFocus = null;

    // ---------- Card DOM refs ----------
    const card = document.getElementById('projMapCard');
    const cardClose = document.getElementById('projMapCardClose');
    const cardKind = document.getElementById('projMapCardKind');
    const cardPhoto = document.getElementById('projMapCardPhoto');
    const cardTag = document.getElementById('projMapCardTag');
    const cardTitle = document.getElementById('projMapCardTitle');
    const cardYear = document.getElementById('projMapCardYear');
    const cardLocation = document.getElementById('projMapCardLocation');
    const cardDesc = document.getElementById('projMapCardDesc');
    const cardCta = document.getElementById('projMapCardCta');

    // ---------- Pins ----------
    const PIN = { renderer, radius: 4, fillColor: PIN_COLOR, fillOpacity: 1, color: PIN_STROKE, weight: 1, opacity: 1, bubblingMouseEvents: false };
    const PIN_ACTIVE_RADIUS = 4.5;
    const RING = { renderer, radius: 7.25, fill: false, color: PIN_COLOR, weight: 1.5, opacity: 0.5, interactive: false };

    const all = (await fetchProjects()) || [];
    const entries = placeProjects(all);

    for (const e of entries) {
      const pts = e.pts;
      const isSegment = pts.length >= 2;
      const endpoints = isSegment ? [pts[0], pts[pts.length - 1]] : [pts[0]];
      e.markers = endpoints.map(pt => {
        const m = L.circleMarker(pt, PIN).addTo(pinLayer);
        m.on('click', ev => openProject(e, ev));
        return m;
      });
      e.shown = true;
    }

    // Show only the pins that match the projects filters.
    function applyFilters() {
      const matches = window._projMatchesFilters || (() => true);
      for (const e of entries) {
        const show = matches(e.p);
        if (show === e.shown) continue;
        e.shown = show;
        e.markers.forEach(m => { if (show) m.addTo(pinLayer); else pinLayer.removeLayer(m); });
      }
      if (activeEntry && !activeEntry.shown) closeProject(false);
    }
    window._applyMapFilters = applyFilters;

    function setActive(entry) {
      if (activeEntry) {
        activeEntry.markers.forEach(m => m.setRadius(PIN.radius));
        activeLayer.clearLayers();
      }
      activeEntry = entry;
      if (!entry) return;
      const pts = entry.pts;
      if (pts.length >= 2) {
        const halo = L.polyline(pts, { renderer, color: PIN_COLOR, weight: 14, opacity: 0.2, lineCap: 'round', bubblingMouseEvents: false }).addTo(activeLayer);
        const core = L.polyline(pts, { renderer, color: PIN_COLOR, weight: 2.5, opacity: 1, bubblingMouseEvents: false }).addTo(activeLayer);
        halo.on('click', ev => openProject(entry, ev));
        core.on('click', ev => openProject(entry, ev));
      }
      entry.markers.forEach(m => {
        L.circleMarker(m.getLatLng(), RING).addTo(activeLayer);
        m.setRadius(PIN_ACTIVE_RADIUS);
        m.bringToFront();
      });
    }

    // ---------- Card photo (decode off the main thread before swapping) ----------
    let photoToken = 0;
    function setPhoto(project) {
      if (!cardPhoto) return;
      const url = project.image || '';
      const token = ++photoToken;
      if (cardPhoto.dataset.src === url) return;
      cardPhoto.dataset.src = '';
      cardPhoto.style.backgroundImage = '';
      if (!url) return;
      const img = new Image();
      img.src = url;
      const apply = () => {
        if (token !== photoToken) return;
        cardPhoto.dataset.src = url;
        cardPhoto.style.backgroundImage = 'url("' + url + '")';
      };
      (img.decode ? img.decode() : Promise.resolve()).then(apply, apply);
    }

    function fillCard(project, isSegment) {
      if (cardKind) cardKind.textContent = isSegment ? '● ── ●' : '●';
      if (cardTitle) cardTitle.textContent = lName(project);
      if (cardYear) cardYear.textContent = project.year || '';
      if (cardLocation) cardLocation.textContent = tLoc(project.location || '');
      if (cardDesc) cardDesc.textContent = lDesc(project);
      if (cardTag) cardTag.textContent = tTyp(project.typology || '');
      if (cardCta) cardCta.href = base + 'project?id=' + project.id;
      setPhoto(project);
    }

    function wasKeyboard(ev) {
      const oe = ev && ev.originalEvent;
      if (!oe) return false;
      if (typeof KeyboardEvent !== 'undefined' && oe instanceof KeyboardEvent) return true;
      return oe.type === 'click' && oe.detail === 0 && !oe.pointerType;
    }

    // ---------- Open / close ----------
    function openProject(entry, ev) {
      const project = entry.p;
      const pts = entry.pts;
      const isSegment = pts.length >= 2;
      const viaKeyboard = wasKeyboard(ev);

      if (!activeProject) {
        lastFocus = document.activeElement;
        viewBeforeProject = { center: map.getCenter(), zoom: map.getZoom() };
      }
      activeProject = project;

      if (card) {
        fillCard(project, isSegment);
        card.classList.add('is-open');
        card.removeAttribute('aria-hidden');
        card.inert = false;
        document.body.classList.add('proj-map-card-open'); // scroll lock on mobile
        if (viaKeyboard && cardClose) cardClose.focus({ preventScroll: true });
      }

      setActive(entry);

      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      const sheetH = isMobile ? Math.floor(window.innerHeight * 0.55) + 20 : 40;
      const rightPad = isMobile ? 20 : 420;
      const a = animate();

      stopAnim();
      if (isSegment) {
        map.flyToBounds(L.latLngBounds(pts).pad(0.4), {
          paddingTopLeft: [20, 20],
          paddingBottomRight: [rightPad, sheetH],
          duration: 0.45,
          animate: a
        });
      } else if (isMobile) {
        // Bottom sheet covers the lower 55% of the viewport: land the pin in
        // the middle of the part of the map that stays visible above it.
        const targetZoom = Math.max(map.getZoom(), 9);
        const rect = mapEl.getBoundingClientRect();
        const visTop = Math.max(rect.top, 0);
        const visBottom = Math.min(rect.bottom, window.innerHeight * 0.45);
        const targetY = visBottom > visTop + 80 ? (visTop + visBottom) / 2 : rect.top + 60;
        const offsetY = (rect.top + rect.height / 2) - targetY; // >0 → pin sits above centre
        const point = map.project(L.latLng(pts[0]), targetZoom);
        const shifted = map.unproject([point.x, point.y + offsetY], targetZoom);
        map.flyTo(shifted, targetZoom, { duration: 0.45, animate: a });
      } else {
        map.flyTo(pts[0], Math.max(map.getZoom(), 9), { duration: 0.45, animate: a });
      }
    }

    function closeProject(restore) {
      if (!activeProject) return;
      activeProject = null;

      // Only move focus if it would otherwise be stranded inside the hidden card.
      const focusWasInside = !!card && card.contains(document.activeElement);
      if (card) {
        card.classList.remove('is-open');
        card.setAttribute('aria-hidden', 'true');
        card.inert = true;
      }
      document.body.classList.remove('proj-map-card-open');
      if (focusWasInside) {
        const target = (lastFocus && lastFocus.isConnected && lastFocus !== document.body) ? lastFocus : mapBtn;
        if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      }
      lastFocus = null;

      setActive(null);

      if (restore && viewBeforeProject) {
        stopAnim();
        map.flyTo(viewBeforeProject.center, viewBeforeProject.zoom, { duration: 0.35, animate: animate() });
      }
      viewBeforeProject = null;
    }

    if (cardClose) cardClose.addEventListener('click', () => closeProject(true));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && activeProject) closeProject(true);
    });
    map.on('click', () => { if (activeProject) closeProject(true); });

    // Re-fit on viewport changes while no project is open (debounced).
    let resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!activeProject && isVisible()) fitToGreece();
      }, 150);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    applyFilters(); // filters may have been chosen before the map loaded

    // First fit: the container is sized when the map view is on screen,
    // otherwise it is done by reset() the moment the view is shown.
    if (isVisible()) fitToGreece();

    return {
      reset() {
        if (activeProject) closeProject(false);
        if (isVisible()) fitToGreece();
        else needsFit = true;
      },
      open(id) {
        const e = entries.find(x => x.p.id === id);
        if (e) openProject(e);
        return !!e;
      },
      close() { closeProject(true); },
      map,
      entries
    };
  }
})();
