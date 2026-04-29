/* THEMELI — Project data rendering */

// ========== PROJECTS: DATA-DRIVEN RENDERING ==========
const projGridView = document.getElementById('projGridView');
const projListView = document.getElementById('projListView');
const projMapView = document.getElementById('projMapView');

// Load and render projects
if (projGridView) {
(async function renderProjects() {
const projectData = (await fetchProjects()).sort((a, b) => {
  const aIP = a.status === 'In Progress' ? 1 : 0;
  const bIP = b.status === 'In Progress' ? 1 : 0;
  if (aIP !== bIP) return bIP - aIP;
  return Math.max(b.year || 0, b.yearStart || 0) - Math.max(a.year || 0, a.yearStart || 0);
});
if (!projectData.length) {
  const msg = (T && T.projectsEmpty) || 'No projects to show right now.';
  projGridView.insertAdjacentHTML('beforeend', `<p class="proj-empty">${msg}</p>`);
  projGridView.classList.add('is-visible');
  return;
}
  // Escape HTML entities
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Helper: translate typology for display
  function tTyp(v) { return T.typ[v] || v; }
  // Helper: translate location for display
  function tLoc(v) { return (T.loc && T.loc[v]) || v; }
  // Helper: pick localized name/description
  function lName(p) { return LANG === 'el' ? p.name : (p.name_en || p.name); }
  function lDesc(p) { return LANG === 'el' ? (p.description || '') : (p.description_en || p.description || ''); }

  // Helper: status badge for in-progress projects
  function statusBadge(p) {
    if (p.status !== 'In Progress') return '';
    const label = LANG === 'el' ? 'Σε Εξέλιξη' : 'In Progress';
    return `<span class="proj-card-status">${label}</span>`;
  }

  const PLACEHOLDER = '/assets/placeholder.svg';

  // Render grid cards
  projectData.forEach(p => {
    const imgStyle = ` style="background-image:url('${esc(p.image || PLACEHOLDER)}')"`;
    projGridView.insertAdjacentHTML('beforeend',
      `<a class="proj-card" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" href="project?id=${p.id}">
        <div class="proj-card-img"${imgStyle}>${statusBadge(p)}</div>
        <div class="proj-card-info"><span class="proj-card-name">${esc(lName(p))}</span><span class="proj-card-year">${p.year}</span></div>
        <span class="proj-card-tag">${esc(tTyp(p.typology))}</span>
      </a>`
    );
  });

  // Render list rows
  if (projListView) {
    projectData.forEach(p => {
      projListView.insertAdjacentHTML('beforeend',
        `<a class="proj-row" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" href="project?id=${p.id}"><span class="proj-col proj-col-name">${esc(lName(p))}</span><span class="proj-col proj-col-type">${esc(tTyp(p.typology))}</span><span class="proj-col proj-col-loc">${esc(tLoc(p.location))}</span><span class="proj-col proj-col-year">${p.year}</span></a>`
      );
    });
  }

  // (Map rendering now handled by 10-leaflet-map.js)

  // Update initial count
  const projCount = document.getElementById('projCount');
  if (projCount) {
    projCount.textContent = projectData.length + ' ' + (projectData.length !== 1 ? T.projects : T.project);
  }

  // Reveal the grid now that cards have been injected
  projGridView.classList.add('is-visible');
})();
}
