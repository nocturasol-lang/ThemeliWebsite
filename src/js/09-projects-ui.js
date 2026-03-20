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
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform(smooth) {
    mapInner.style.transition = smooth ? 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    mapInner.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    mapViewport.classList.toggle('is-zoomed', scale > 1);
    const cs = Math.max(0.35, 1 / scale);
    mapViewport.style.setProperty('--map-counter-scale', cs);
    mapViewport.style.setProperty('--map-tooltip-restore', 1 / cs);
  }

  function clampPan() {
    if (scale <= 1) { panX = 0; panY = 0; return; }
    const rect = mapViewport.getBoundingClientRect();
    const maxPan = (rect.width * (scale - 1)) / 2;
    panX = Math.max(-maxPan, Math.min(maxPan, panX));
    panY = Math.max(-maxPan, Math.min(maxPan, panY));
  }

  mapZoomIn.addEventListener('click', () => {
    if (scale < 2) { scale = 2; clampPan(); applyTransform(true); }
  });

  mapZoomOut.addEventListener('click', () => {
    scale = 1; panX = 0; panY = 0; applyTransform(true);
  });

  // Expose reset for other components (filters, view switching)
  window._resetMapZoom = function() {
    if (scale > 1) { scale = 1; panX = 0; panY = 0; applyTransform(true); }
  };

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

  mapViewport.addEventListener('touchstart', (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    isDragging = true;
    startX = e.touches[0].clientX - panX;
    startY = e.touches[0].clientY - panY;
  }, { passive: true });

  mapViewport.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    panX = e.touches[0].clientX - startX;
    panY = e.touches[0].clientY - startY;
    clampPan();
    applyTransform(false);
    e.preventDefault();
  }, { passive: false });

  mapViewport.addEventListener('touchend', () => { isDragging = false; });

  mapViewport.addEventListener('dblclick', (e) => {
    if (scale > 1) {
      scale = 1; panX = 0; panY = 0;
    } else {
      scale = 2;
      const rect = mapViewport.getBoundingClientRect();
      panX = -(e.clientX - rect.left - rect.width / 2);
      panY = -(e.clientY - rect.top - rect.height / 2);
      clampPan();
    }
    applyTransform(true);
  });
}

// ========== MAP DOTS: TAP-TO-PREVIEW ON TOUCH ==========
if (mapViewport) {
  let touchMoved = false;

  mapViewport.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
  mapViewport.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });

  mapViewport.addEventListener('touchend', (e) => {
    if (touchMoved) return; // Was a drag, not a tap

    const dot = e.target.closest('.proj-map-dot');

    // Tap on map background — close any active tooltip
    if (!dot) {
      mapViewport.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
      return;
    }

    // If this dot is already active, navigate
    if (dot.classList.contains('is-active')) {
      window.location.href = dot.href;
      return;
    }

    // First tap: show tooltip, block navigation
    e.preventDefault();
    mapViewport.querySelectorAll('.proj-map-dot.is-active').forEach(d => d.classList.remove('is-active'));
    dot.classList.add('is-active');
  });

  // On touch devices, block click events on dots (touchend handles navigation)
  let lastTouchEnd = 0;
  mapViewport.addEventListener('click', (e) => {
    const dot = e.target.closest('.proj-map-dot');
    if (dot && Date.now() - lastTouchEnd < 500) {
      e.preventDefault();
    }
  });

  // Track when touch events happen
  mapViewport.addEventListener('touchend', function() {
    lastTouchEnd = Date.now();
  }, { passive: true, capture: true });
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

    // Filter map dots
    document.querySelectorAll('.proj-map-dot').forEach(dot => {
      dot.classList.toggle('is-hidden', !matchesFilters(dot));
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
