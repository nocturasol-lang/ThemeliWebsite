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

// ========== PROJECTS FILTER (event delegation) ==========
const projFilterToggle = document.getElementById('projFilterToggle');
const projFilters = document.getElementById('projFilters');

if (projFilterToggle && projFilters) {
  projFilterToggle.addEventListener('click', () => {
    projFilters.classList.toggle('is-open');
    projFilterToggle.classList.toggle('is-active');
  });

  projFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.proj-filter-btn');
    if (!btn) return;

    projFilters.querySelectorAll('.proj-filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const filter = btn.getAttribute('data-filter');
    let visibleCount = 0;

    // Filter all three views using event delegation
    document.querySelectorAll('.proj-row:not(.proj-row-header)').forEach(row => {
      const match = filter === 'all' || row.getAttribute('data-typology') === filter;
      row.classList.toggle('is-hidden', !match);
      if (match) visibleCount++;
    });

    document.querySelectorAll('.proj-card').forEach(card => {
      card.classList.toggle('is-hidden', filter !== 'all' && card.getAttribute('data-typology') !== filter);
    });

    document.querySelectorAll('.proj-map-dot').forEach(dot => {
      dot.classList.toggle('is-hidden', filter !== 'all' && dot.getAttribute('data-typology') !== filter);
    });

    const projCount = document.getElementById('projCount');
    if (projCount) {
      projCount.textContent = visibleCount + ' ' + (visibleCount !== 1 ? T.projects : T.project);
    }
  });
}
