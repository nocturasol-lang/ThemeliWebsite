/* THEMELI — Leaflet projects map (replaces PNG-based map) */

(async function initProjectsLeafletMap() {
  const mapEl = document.getElementById('projLeafletMap');
  if (!mapEl) return;
  if (typeof L === 'undefined') { console.warn('[map] Leaflet not loaded'); return; }
  if (typeof GREECE_PREFECTURES === 'undefined') { console.warn('[map] greece-prefectures.js not loaded'); return; }

  const PIN_COLOR = '#FF731E';

  // ---------- Map ----------
  const map = L.map(mapEl, {
    zoomControl: false,
    attributionControl: false,
    minZoom: 6,
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
  function fitToGreece(animate) {
    map.invalidateSize();
    map.fitBounds(greeceBounds, { padding: [0, 0], animate: !!animate });
  }
  map.setMaxBounds(greeceBounds.pad(0.3));
  // Defer initial fit until the container is actually sized — it starts display:none.
  if (mapEl.offsetWidth > 0 && mapEl.offsetHeight > 0) fitToGreece(false);

  // ---------- State ----------
  let activeProject = null;
  let viewBeforeProject = null;
  const projectLayer = L.layerGroup().addTo(map);

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

  // ---------- Pin icon ----------
  function pinIcon(isActive) {
    const size = isActive ? 16 : 10;
    const r = (size / 2) - 1;
    return L.divIcon({
      className: 'proj-leaflet-pin',
      html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${isActive ? `<circle cx="${size/2}" cy="${size/2}" r="${r + 1.5}" fill="none" stroke="${PIN_COLOR}" stroke-width="1.5" opacity="0.5"/>` : ''}
        <circle cx="${size/2}" cy="${size/2}" r="${isActive ? r - 2.5 : r}" fill="${PIN_COLOR}" stroke="#0a0d13" stroke-width="1"/>
      </svg>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  // ---------- i18n helpers (global T, LANG from 02-i18n.js) ----------
  function lName(p) { return (typeof LANG !== 'undefined' && LANG === 'en') ? (p.name_en || p.name) : p.name; }
  function lDesc(p) { return (typeof LANG !== 'undefined' && LANG === 'en') ? (p.description_en || p.description || '') : (p.description || ''); }
  function tTyp(v) { return (typeof T !== 'undefined' && T.typ && T.typ[v]) || v; }
  function tLoc(v) { return (typeof T !== 'undefined' && T.loc && T.loc[v]) || v; }

  // ---------- Projects ----------
  const all = (await fetchProjects()) || [];
  const pinnable = all.filter(p => p.lat != null && p.lng != null);

  function projectPoints(p) {
    if (Array.isArray(p.points) && p.points.length >= 2) return p.points;
    return [[p.lat, p.lng]];
  }

  function renderPins() {
    projectLayer.clearLayers();
    for (const p of pinnable) {
      const isActive = activeProject && activeProject.id === p.id;
      const pts = projectPoints(p);
      const isSegment = pts.length >= 2;

      if (isSegment && isActive) {
        const halo = L.polyline(pts, { color: PIN_COLOR, weight: 14, opacity: 0.2, lineCap: 'round' }).addTo(projectLayer);
        const core = L.polyline(pts, { color: PIN_COLOR, weight: 2.5, opacity: 1 }).addTo(projectLayer);
        halo.on('click', ev => { L.DomEvent.stopPropagation(ev); openProject(p); });
        core.on('click', ev => { L.DomEvent.stopPropagation(ev); openProject(p); });
      }

      const endpoints = isSegment ? [pts[0], pts[pts.length - 1]] : [pts[0]];
      for (const pt of endpoints) {
        const m = L.marker(pt, { icon: pinIcon(isActive), keyboard: false }).addTo(projectLayer);
        m.on('click', ev => { L.DomEvent.stopPropagation(ev); openProject(p); });
      }
    }
  }

  // ---------- Card open/close ----------
  function openProject(project) {
    activeProject = project;
    if (card) {
      card.classList.add('is-open');
      document.body.classList.add('proj-map-card-open'); // scroll lock on mobile
      if (cardKind) cardKind.textContent = projectPoints(project).length >= 2 ? '● ── ●' : '●';
      if (cardTitle) cardTitle.textContent = lName(project);
      if (cardYear) cardYear.textContent = project.year || '';
      if (cardLocation) cardLocation.textContent = tLoc(project.location || '');
      if (cardDesc) cardDesc.textContent = lDesc(project);
      if (cardPhoto) cardPhoto.style.backgroundImage = project.image ? `url("${project.image}")` : '';
      if (cardTag) cardTag.textContent = tTyp(project.typology || '');
      if (cardCta) {
        const base = (typeof BASE !== 'undefined' ? BASE : '');
        cardCta.href = base + 'project?id=' + project.id;
      }
    }

    if (!viewBeforeProject) viewBeforeProject = { center: map.getCenter(), zoom: map.getZoom() };

    const pts = projectPoints(project);
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const sheetH = isMobile ? Math.floor(window.innerHeight * 0.55) + 20 : 40;
    const rightPad = isMobile ? 20 : 420;

    map.stop();
    if (pts.length >= 2) {
      const bounds = L.latLngBounds(pts).pad(0.4);
      map.flyToBounds(bounds, {
        paddingTopLeft: [20, 20],
        paddingBottomRight: [rightPad, sheetH],
        duration: 0.45
      });
    } else if (isMobile) {
      // Single pin on mobile: shift center down (in map coords) so the pin
      // sits in the top third of the viewport, above the bottom sheet.
      const targetZoom = Math.max(map.getZoom(), 9);
      const point = map.project(L.latLng(pts[0]), targetZoom);
      const offsetY = window.innerHeight * 0.275; // push center down → pin appears higher on screen
      const shifted = map.unproject([point.x, point.y + offsetY], targetZoom);
      map.flyTo(shifted, targetZoom, { duration: 0.45 });
    } else {
      map.flyTo(pts[0], Math.max(map.getZoom(), 9), { duration: 0.45 });
    }
    renderPins();
  }

  function closeProject(restore = true) {
    if (!activeProject) return;
    activeProject = null;
    if (card) card.classList.remove('is-open');
    document.body.classList.remove('proj-map-card-open');
    if (restore && viewBeforeProject) {
      map.stop();
      map.flyTo(viewBeforeProject.center, viewBeforeProject.zoom, { duration: 0.35 });
      viewBeforeProject = null;
    }
    renderPins();
  }

  if (cardClose) cardClose.addEventListener('click', () => closeProject(true));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeProject) closeProject(true);
  });

  map.on('click', () => { if (activeProject) closeProject(true); });

  // ---------- View toggle integration ----------
  // Leaflet needs invalidateSize() when its container becomes visible.
  const mapViewContainer = document.getElementById('projMapView');
  if (mapViewContainer) {
    const observer = new MutationObserver(() => {
      if (mapViewContainer.style.display !== 'none' && mapViewContainer.offsetWidth > 0) {
        setTimeout(() => {
          map.invalidateSize();
          if (!activeProject) fitToGreece(false);
        }, 50);
      }
    });
    observer.observe(mapViewContainer, { attributes: true, attributeFilter: ['style'] });
  }

  // Expose a reset hook for the view-toggle code that calls window._resetMapZoom()
  window._resetMapZoom = function () {
    if (activeProject) closeProject(false);
    map.stop();
    fitToGreece(false);
  };

  renderPins();
})();
