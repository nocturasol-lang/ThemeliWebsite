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

      // Hide filters/chips/pagination on map view
      const filterToggle = document.getElementById('projFilterToggle');
      const chips = document.getElementById('projChips');
      const filters = document.getElementById('projFilters');
      const pagination = document.getElementById('projPagination');
      const isMap = target === 'map';
      const projCount = document.getElementById('projCount');
      if (filterToggle) filterToggle.style.display = isMap ? 'none' : '';
      if (projCount) projCount.style.display = isMap ? 'none' : '';
      if (chips) chips.style.display = isMap ? 'none' : '';
      if (filters && isMap) { filters.classList.remove('is-open'); filters.style.display = 'none'; }
      if (filters && !isMap) filters.style.display = '';
      if (pagination) pagination.style.display = isMap ? 'none' : '';
    });
  });
}

// ========== PROJECTS PAGINATION (20 per page) ==========
const projPagination = document.getElementById('projPagination');
const PAGE_SIZE = 20;
let currentPage = 1;

function applyPagination() {
  if (!projGridView) return;

  const cards = Array.from(projGridView.querySelectorAll('.proj-card'));
  const rows = projListView ? Array.from(projListView.querySelectorAll('.proj-row:not(.proj-row-header)')) : [];

  const visibleCards = cards.filter(c => !c.classList.contains('is-hidden'));
  const visibleRows = rows.filter(r => !r.classList.contains('is-hidden'));

  const totalItems = visibleCards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  // Grid: show only items in current page window
  visibleCards.forEach((el, i) => el.classList.toggle('is-paged-out', i < start || i >= end));
  cards.filter(c => c.classList.contains('is-hidden')).forEach(el => el.classList.remove('is-paged-out'));

  // List: same
  visibleRows.forEach((el, i) => el.classList.toggle('is-paged-out', i < start || i >= end));
  rows.filter(r => r.classList.contains('is-hidden')).forEach(el => el.classList.remove('is-paged-out'));

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (!projPagination) return;
  projPagination.innerHTML = '';
  if (totalPages <= 1) return;

  const prevLabel = (typeof T !== 'undefined' && T.prev) || '‹';
  const nextLabel = (typeof T !== 'undefined' && T.next) || '›';

  function makeBtn(label, page, { active = false, disabled = false, aria = '' } = {}) {
    const b = document.createElement('button');
    b.className = 'proj-page-btn' + (active ? ' is-active' : '');
    b.textContent = label;
    if (aria) b.setAttribute('aria-label', aria);
    if (active) b.setAttribute('aria-current', 'page');
    if (disabled) { b.disabled = true; return b; }
    b.addEventListener('click', () => {
      currentPage = page;
      applyPagination();
      // Scroll the new page's first card into view, leaving the toolbar
      // (filter + view toggles) visible above. Must also clear the fixed
      // site header (`--menu-height`, default 100px) so content isn't
      // tucked underneath the logo/nav.
      const visible = (el) => el && window.getComputedStyle(el).display !== 'none';
      const activeView = [projGridView, projListView].find(visible);
      if (activeView) {
        const toolbar = document.querySelector('.proj-toolbar');
        const toolbarH = toolbar ? toolbar.getBoundingClientRect().height : 0;
        const menuH = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--menu-height')) || 100;
        const gridTop = activeView.getBoundingClientRect().top + window.scrollY;
        const targetY = Math.max(0, gridTop - menuH - toolbarH - 24);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    });
    return b;
  }

  // Prev
  projPagination.appendChild(makeBtn(prevLabel, currentPage - 1, { disabled: currentPage === 1, aria: 'Previous page' }));

  // Page numbers (with ellipsis when many)
  const pages = [];
  const add = n => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (currentPage > 3) add('…');
    const from = Math.max(2, currentPage - 1);
    const to = Math.min(totalPages - 1, currentPage + 1);
    for (let i = from; i <= to; i++) add(i);
    if (currentPage < totalPages - 2) add('…');
    add(totalPages);
  }
  pages.forEach(p => {
    if (p === '…') {
      const s = document.createElement('span');
      s.className = 'proj-page-ellipsis';
      s.textContent = '…';
      projPagination.appendChild(s);
    } else {
      projPagination.appendChild(makeBtn(String(p), p, { active: p === currentPage }));
    }
  });

  // Next
  projPagination.appendChild(makeBtn(nextLabel, currentPage + 1, { disabled: currentPage === totalPages, aria: 'Next page' }));
}

// Run pagination after initial render + whenever filters change.
// 08-projects-render.js appends cards asynchronously; wait for them.
function waitForCardsThenPaginate() {
  if (!projGridView) return;
  if (projGridView.querySelector('.proj-card')) {
    applyPagination();
  } else {
    const obs = new MutationObserver(() => {
      if (projGridView.querySelector('.proj-card')) {
        obs.disconnect();
        applyPagination();
      }
    });
    obs.observe(projGridView, { childList: true });
  }
}
waitForCardsThenPaginate();
window._projApplyPagination = applyPagination;
window._projResetPage = () => { currentPage = 1; };


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

    // Reset to page 1 and re-paginate
    currentPage = 1;
    applyPagination();
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

    // Reset to page 1 after sort
    currentPage = 1;
    applyPagination();
  });
}
