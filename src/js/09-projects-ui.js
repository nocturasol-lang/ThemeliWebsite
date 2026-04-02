/* THEMELI — Projects view switching, map, filter */

// ========== PROJECTS VIEW SWITCHING ==========
const projViewToggles = document.getElementById('projViewToggles');

if (projViewToggles && projGridView) {
  const viewBtns = projViewToggles.querySelectorAll('.proj-view-btn');
  const views = { grid: projGridView, list: projListView, map: projMapView };

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      viewBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      Object.entries(views).forEach(([key, el]) => {
        if (el) el.style.display = key === target ? '' : 'none';
      });
      if (window._resetMapZoom) window._resetMapZoom();

      // Hide filters/chips on map view
      const filterToggle = document.getElementById('projFilterToggle');
      const chips = document.getElementById('projChips');
      const filters = document.getElementById('projFilters');
      const isMap = target === 'map';
      const projCount = document.getElementById('projCount');
      if (filterToggle) filterToggle.style.display = isMap ? 'none' : '';
      if (projCount) projCount.style.display = isMap ? 'none' : '';
      if (chips) chips.style.display = isMap ? 'none' : '';
      if (filters && isMap) { filters.classList.remove('is-open'); filters.style.display = 'none'; }
      if (filters && !isMap) filters.style.display = '';
    });
  });
}

// ========== MAP ZOOM & PAN ==========
const mapViewport = document.getElementById('mapViewport');
const mapZoomIn = document.getElementById('mapZoomIn');
const mapZoomOut = document.getElementById('mapZoomOut');

if (mapViewport && mapInner) {
  const MIN_SCALE = 1;
  const MAX_SCALE = 3;
  const ZOOM_STEP = 0.5;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let touchMoved = false;
  let lastTouchEnd = 0;

  // Pinch state
  let initialPinchDist = 0;
  let initialPinchScale = 1;

  function applyTransform(smooth) {
    mapInner.style.transition = smooth ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    mapInner.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    mapViewport.classList.toggle('is-zoomed', scale > 1);
    // Counter-scale dots so they don't grow with zoom, but keep them tappable
    const cs = Math.max(0.5, 1 / scale);
    mapViewport.style.setProperty('--map-counter-scale', cs);
    // Tooltip must undo BOTH dot counter-scale AND parent map zoom
    // Effective inherited scale on tooltip = scale * cs
    // To get tooltip back to 1.0: multiply by 1 / (scale * cs)
    mapViewport.style.setProperty('--map-tooltip-restore', 1 / (scale * cs));
  }

  function clampPan() {
    if (scale <= 1) { panX = 0; panY = 0; return; }
    const rect = mapViewport.getBoundingClientRect();
    const maxPanX = (rect.width * (scale - 1)) / 2;
    const maxPanY = (rect.height * (scale - 1)) / 2;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  }

  function zoomTo(newScale, centerX, centerY, smooth) {
    const prev = scale;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    if (centerX !== undefined && centerY !== undefined) {
      const rect = mapViewport.getBoundingClientRect();
      const cx = centerX - rect.left - rect.width / 2;
      const cy = centerY - rect.top - rect.height / 2;
      panX = panX - cx * (scale / prev - 1);
      panY = panY - cy * (scale / prev - 1);
    }
    if (scale <= 1) { panX = 0; panY = 0; }
    clampPan();
    applyTransform(smooth !== false);
  }

  // Button zoom
  mapZoomIn.addEventListener('click', () => { zoomTo(scale + ZOOM_STEP); });
  mapZoomOut.addEventListener('click', () => { zoomTo(scale - ZOOM_STEP); });

  // Double-click zoom
  mapViewport.addEventListener('dblclick', (e) => {
    if (scale > 1) {
      zoomTo(1);
    } else {
      zoomTo(2, e.clientX, e.clientY);
    }
  });

  // Expose reset
  window._resetMapZoom = function() {
    if (scale > 1) { scale = 1; panX = 0; panY = 0; applyTransform(true); }
  };

  // ── Mouse pan ──
  mapViewport.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    clampPan();
    applyTransform(false);
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // ── Touch pan + pinch zoom ──
  function getTouchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  mapViewport.addEventListener('touchstart', (e) => {
    touchMoved = false;
    if (e.touches.length === 2) {
      // Pinch start
      isDragging = false;
      initialPinchDist = getTouchDist(e);
      initialPinchScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      // Single-finger pan (only when zoomed)
      isDragging = true;
      startX = e.touches[0].clientX - panX;
      startY = e.touches[0].clientY - panY;
    }
  }, { passive: true });

  mapViewport.addEventListener('touchmove', (e) => {
    touchMoved = true;
    if (e.touches.length === 2 && initialPinchDist) {
      // Pinch zoom
      const dist = getTouchDist(e);
      const ratio = dist / initialPinchDist;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomTo(initialPinchScale * ratio, midX, midY, false);
      e.preventDefault();
    } else if (isDragging && e.touches.length === 1) {
      // Pan
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      clampPan();
      applyTransform(false);
      e.preventDefault();
    }
  }, { passive: false });

  mapViewport.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) initialPinchDist = 0;
    if (e.touches.length === 0) isDragging = false;
    lastTouchEnd = Date.now();
  }, { passive: true });

  // ── Focus + line visibility helpers ──
  function showLineForDot(dot) {
    if (!dot) return;
    mapInner.classList.add('has-focus');
    const id = dot.dataset.id;
    if (id) {
      // Show the line
      const line = mapInner.querySelector(`.proj-map-line[data-project="${id}"]`);
      if (line) line.classList.add('is-active');
      // Activate ALL dots for this project (both endpoints)
      mapInner.querySelectorAll(`.proj-map-dot[data-id="${id}"]`).forEach(d => d.classList.add('is-active'));
    }
  }
  function hideAllLines() {
    mapInner.classList.remove('has-focus');
    mapInner.querySelectorAll('.proj-map-line.is-active').forEach(l => l.classList.remove('is-active'));
    mapInner.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
  }

  // ── Desktop click → toggle focus + line ──
  mapViewport.addEventListener('click', (e) => {
    if (Date.now() - lastTouchEnd < 300) return; // handled by touch
    const dot = e.target.closest('.proj-map-dot');
    if (!dot) {
      mapViewport.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
      hideAllLines();
      return;
    }
    if (dot.classList.contains('is-active')) {
      window.location.href = dot.href;
      return;
    }
    e.preventDefault();
    mapViewport.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
    hideAllLines();
    dot.classList.add('is-active');
    showLineForDot(dot);
  });

  // ── Touch dot interaction (tap-to-preview) ──
  mapViewport.addEventListener('touchend', (e) => {
    if (touchMoved || e.touches.length > 0) return;
    const dot = e.target.closest('.proj-map-dot');
    if (!dot) {
      mapViewport.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
      hideAllLines();
      return;
    }
    if (dot.classList.contains('is-active')) {
      window.location.href = dot.href;
      return;
    }
    e.preventDefault();
    mapViewport.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
    hideAllLines();
    dot.classList.add('is-active');
    showLineForDot(dot);
  });

  // Block click on touch devices (touchend handles dots)
  mapViewport.addEventListener('click', (e) => {
    const dot = e.target.closest('.proj-map-dot');
    if (dot && Date.now() - lastTouchEnd < 300) e.preventDefault();
  });
}

// ========== PROJECTS FILTER (multi-category with chips) ==========
const projFilterToggle = document.getElementById('projFilterToggle');
const projFilters = document.getElementById('projFilters');
const projChips = document.getElementById('projChips');
const projApply = document.getElementById('projApply');
const projClearAll = document.getElementById('projClearAll');

if (projFilterToggle && projFilters) {
  // Active filters: { status: Set, typology: Set, region: Set }
  const activeFilters = { status: new Set(), typology: new Set(), region: new Set() };

  // Toggle filter panel (reset zoom to avoid overlap)
  projFilterToggle.addEventListener('click', () => {
    projFilters.classList.toggle('is-open');
    projFilterToggle.classList.toggle('is-active');
    if (window._resetMapZoom) window._resetMapZoom();
  });

  // Close filter panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!projFilters.contains(e.target) && !projFilterToggle.contains(e.target) && projFilters.classList.contains('is-open')) {
      projFilters.classList.remove('is-open');
      projFilterToggle.classList.remove('is-active');
    }
  });

  // Toggle filter buttons on click and apply immediately
  projFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.proj-filter-btn');
    if (!btn) return;
    btn.classList.toggle('is-active');
    applyFilters();
  });

  // Apply filters
  function applyFilters() {
    // Read active buttons into filter sets
    activeFilters.status.clear();
    activeFilters.typology.clear();
    activeFilters.region.clear();
    projFilters.querySelectorAll('.proj-filter-btn.is-active').forEach(btn => {
      const cat = btn.getAttribute('data-category');
      const val = btn.getAttribute('data-filter');
      if (activeFilters[cat]) activeFilters[cat].add(val);
    });

    let visibleCount = 0;
    const hasFilters = activeFilters.status.size || activeFilters.typology.size || activeFilters.region.size;

    function matchesFilters(el) {
      if (!hasFilters) return true;
      if (activeFilters.status.size && !activeFilters.status.has(el.getAttribute('data-status'))) return false;
      if (activeFilters.typology.size && !activeFilters.typology.has(el.getAttribute('data-typology'))) return false;
      if (activeFilters.region.size && !activeFilters.region.has(el.getAttribute('data-region'))) return false;
      return true;
    }

    // Filter grid cards
    document.querySelectorAll('.proj-card').forEach(card => {
      const match = matchesFilters(card);
      card.classList.toggle('is-hidden', !match);
      if (match) visibleCount++;
    });

    // Filter list rows
    document.querySelectorAll('.proj-row:not(.proj-row-header)').forEach(row => {
      row.classList.toggle('is-hidden', !matchesFilters(row));
    });

    // Filter map dots (clear active tooltips on hidden dots)
    document.querySelectorAll('.proj-map-dot').forEach(dot => {
      const hidden = !matchesFilters(dot);
      dot.classList.toggle('is-hidden', hidden);
      if (hidden) dot.classList.remove('is-active');
    });

    // Filter map lines
    document.querySelectorAll('.proj-map-line').forEach(line => {
      line.classList.toggle('is-hidden', !matchesFilters(line));
    });

    // Update count
    const projCount = document.getElementById('projCount');
    if (projCount) {
      projCount.textContent = visibleCount + ' ' + (visibleCount !== 1 ? T.projects : T.project);
    }

    // Update filter toggle state
    projFilterToggle.classList.toggle('is-active', hasFilters || projFilters.classList.contains('is-open'));

    renderChips();
  }

  // Render chips
  function renderChips() {
    if (!projChips) return;
    projChips.innerHTML = '';
    const hasAny = activeFilters.status.size || activeFilters.typology.size || activeFilters.region.size;
    if (!hasAny) return;

    // Create chip for each active filter
    for (const [cat, values] of Object.entries(activeFilters)) {
      values.forEach(val => {
        // Use the button's visible text for the chip label
        const btn = projFilters.querySelector(`.proj-filter-btn[data-category="${cat}"][data-filter="${val}"]`);
        const label = btn ? btn.textContent : val;
        const chip = document.createElement('button');
        chip.className = 'proj-chip';
        chip.innerHTML = `<span class="proj-chip-x">&times;</span> ${label}`;
        chip.addEventListener('click', () => {
          activeFilters[cat].delete(val);
          if (btn) btn.classList.remove('is-active');
          applyFilters();
        });
        projChips.appendChild(chip);
      });
    }

    // Clear All chip
    const clearBtn = document.createElement('button');
    clearBtn.className = 'proj-chips-clear';
    clearBtn.textContent = '\u2014 ' + (T.clearAll || 'Clear All');
    clearBtn.addEventListener('click', clearAllFilters);
    projChips.appendChild(clearBtn);
  }

  // Clear all filters
  function clearAllFilters() {
    activeFilters.status.clear();
    activeFilters.typology.clear();
    activeFilters.region.clear();
    projFilters.querySelectorAll('.proj-filter-btn.is-active').forEach(b => b.classList.remove('is-active'));
    applyFilters();
  }

  // Apply button
  if (projApply) projApply.addEventListener('click', applyFilters);

  // Clear All button (in filter panel)
  if (projClearAll) projClearAll.addEventListener('click', clearAllFilters);
}

// ========== LIST VIEW SORTING ==========
if (projListView) {
  const colMap = {
    name: '.proj-col-name',
    typology: '.proj-col-type',
    location: '.proj-col-loc',
    year: '.proj-col-year'
  };
  let currentSort = null;
  let sortDesc = false;

  projListView.addEventListener('click', (e) => {
    const btn = e.target.closest('.proj-sort-btn');
    if (!btn) return;

    const key = btn.getAttribute('data-sort');

    // Toggle direction or switch column
    if (currentSort === key) {
      sortDesc = !sortDesc;
    } else {
      currentSort = key;
      sortDesc = false;
    }

    // Update button states
    projListView.querySelectorAll('.proj-sort-btn').forEach(b => {
      b.classList.remove('is-sorted', 'is-desc');
    });
    btn.classList.add('is-sorted');
    if (sortDesc) btn.classList.add('is-desc');

    // Get all data rows (not the header)
    const rows = Array.from(projListView.querySelectorAll('.proj-row:not(.proj-row-header)'));
    const selector = colMap[key];

    rows.sort((a, b) => {
      const aVal = a.querySelector(selector)?.textContent.trim() || '';
      const bVal = b.querySelector(selector)?.textContent.trim() || '';

      // Numeric sort for year
      if (key === 'year') {
        return sortDesc ? (parseInt(bVal) - parseInt(aVal)) : (parseInt(aVal) - parseInt(bVal));
      }
      // Alphabetical for text columns
      const cmp = aVal.localeCompare(bVal);
      return sortDesc ? -cmp : cmp;
    });

    // Re-append rows in sorted order
    rows.forEach(row => projListView.appendChild(row));
  });
}
