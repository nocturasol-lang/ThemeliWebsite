/* THEMELI — Project data rendering */

// ========== PROJECTS: DATA-DRIVEN RENDERING ==========
const projGridView = document.getElementById('projGridView');
const projListView = document.getElementById('projListView');
const projMapView = document.getElementById('projMapView');
const mapInner = document.getElementById('mapInner');

// Load projects from Supabase (async) with PROJECTS fallback
if (projGridView) {
(async function renderProjects() {
const projectData = await fetchProjects();
if (!projectData.length) return;
  // Escape HTML entities
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Render grid cards
  projectData.forEach(p => {
    const imgStyle = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';
    projGridView.insertAdjacentHTML('beforeend',
      `<a class="proj-card" data-typology="${esc(p.typology)}" href="project.html#${p.id}">
        <div class="proj-card-img"${imgStyle}></div>
        <div class="proj-card-info"><span class="proj-card-name">${esc(p.name)}</span><span class="proj-card-year">${p.year}</span></div>
        <span class="proj-card-tag">${esc(p.typology)}</span>
      </a>`
    );
  });

  // Render list rows
  if (projListView) {
    projectData.forEach(p => {
      projListView.insertAdjacentHTML('beforeend',
        `<a class="proj-row" data-typology="${esc(p.typology)}" href="project.html#${p.id}"><span class="proj-col proj-col-name">${esc(p.name)}</span><span class="proj-col proj-col-type">${esc(p.typology)}</span><span class="proj-col proj-col-loc">${esc(p.location)}</span><span class="proj-col proj-col-year">${p.year}</span></a>`
      );
    });
  }

  // Render map dots with tooltip cards
  if (mapInner) {
    projectData.forEach(p => {
      if (p.mapX == null || p.mapY == null) return;
      const tooltipImg = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';
      mapInner.insertAdjacentHTML('beforeend',
        `<a class="proj-map-dot" style="left:${p.mapX}%;top:${p.mapY}%" data-typology="${esc(p.typology)}" href="project.html#${p.id}">
          <div class="proj-map-tooltip">
            <div class="proj-map-tooltip-img"${tooltipImg}></div>
            <div class="proj-map-tooltip-body">
              <span class="proj-map-tooltip-name">${esc(p.name)}</span>
              <span class="proj-map-tooltip-year">${p.year}</span>
            </div>
            <span class="proj-map-tooltip-tag">${esc(p.typology)}</span>
          </div>
        </a>`
      );
    });
  }

  // Update initial count
  const projCount = document.getElementById('projCount');
  if (projCount) {
    projCount.textContent = projectData.length + ' ' + (projectData.length !== 1 ? T.projects : T.project);
  }
})();
}
