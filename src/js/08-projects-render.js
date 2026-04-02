/* THEMELI — Project data rendering */

// ========== PROJECTS: DATA-DRIVEN RENDERING ==========
const projGridView = document.getElementById('projGridView');
const projListView = document.getElementById('projListView');
const projMapView = document.getElementById('projMapView');
const mapInner = document.getElementById('mapInner');

// Load and render projects
if (projGridView) {
(async function renderProjects() {
const projectData = (await fetchProjects()).sort((a, b) => (b.year || 0) - (a.year || 0));
if (!projectData.length) return;
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

  // Render grid cards
  projectData.forEach(p => {
    const imgStyle = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';
    projGridView.insertAdjacentHTML('beforeend',
      `<a class="proj-card" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" href="project.html?id=${p.id}">
        <div class="proj-card-img"${imgStyle}></div>
        <div class="proj-card-info"><span class="proj-card-name">${esc(lName(p))}</span><span class="proj-card-year">${p.year}</span></div>
        <span class="proj-card-tag">${esc(tTyp(p.typology))}</span>
      </a>`
    );
  });

  // Render list rows
  if (projListView) {
    projectData.forEach(p => {
      projListView.insertAdjacentHTML('beforeend',
        `<a class="proj-row" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" href="project.html?id=${p.id}"><span class="proj-col proj-col-name">${esc(lName(p))}</span><span class="proj-col proj-col-type">${esc(tTyp(p.typology))}</span><span class="proj-col proj-col-loc">${esc(tLoc(p.location))}</span><span class="proj-col proj-col-year">${p.year}</span></a>`
      );
    });
  }

  // Render map dots and lines with tooltip cards
  if (mapInner) {
    const LINEAR_TYPES = ['Railways', 'Tunnels', 'Roadworks'];

    projectData.forEach(p => {
      if (p.mapX == null || p.mapY == null) return;
      // Skip international projects (coords outside Greece map bounds)
      if (p.mapX < 10 || p.mapX > 95 || p.mapY < 10 || p.mapY > 98) return;

      // Determine if this is a linear project with route points
      const hasPolyline = Array.isArray(p.mapPoints) && p.mapPoints.length >= 2;
      const isLinear = hasPolyline || (LINEAR_TYPES.includes(p.typology) && p.mapX2 != null && p.mapY2 != null);
      const tooltipImg = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';

      if (isLinear) {
        // Linear projects: draw polyline + two clickable endpoint dots (no middle dot)
        const points = hasPolyline ? p.mapPoints : [[p.mapX, p.mapY], [p.mapX2, p.mapY2]];
        const ptsStr = points.map(pt => `${pt[0]},${pt[1]}`).join(' ');
        const first = points[0];
        const last = points[points.length - 1];

        // SVG polyline (hidden until activated)
        mapInner.insertAdjacentHTML('beforeend',
          `<svg class="proj-map-line" data-typology="${esc(p.typology)}" data-region="${esc(p.region || '')}" data-status="${esc(p.status || '')}" data-project="${p.id}" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="${ptsStr}" fill="none" stroke="rgba(255,115,30,0.6)" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
        );

        // First endpoint (has the tooltip)
        mapInner.insertAdjacentHTML('beforeend',
          `<a class="proj-map-dot has-line${first[0] > 50 ? ' tooltip-left' : ''}" style="left:${first[0]}%;top:${first[1]}%" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" data-id="${p.id}" href="project.html?id=${p.id}">
            <div class="proj-map-tooltip">
              <div class="proj-map-tooltip-img"${tooltipImg}></div>
              <div class="proj-map-tooltip-body">
                <span class="proj-map-tooltip-name">${esc(lName(p))}</span>
                <span class="proj-map-tooltip-year">${p.year}</span>
              </div>
              <span class="proj-map-tooltip-tag">${esc(tTyp(p.typology))}</span>
            </div>
          </a>`
        );

        // Second endpoint (clickable, links to same project, no tooltip)
        mapInner.insertAdjacentHTML('beforeend',
          `<a class="proj-map-dot has-line" style="left:${last[0]}%;top:${last[1]}%" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" data-id="${p.id}" href="project.html?id=${p.id}"></a>`
        );
      } else {
        // Point projects: single dot with tooltip
        const dotX = p.mapX;
        const dotY = p.mapY;
        mapInner.insertAdjacentHTML('beforeend',
          `<a class="proj-map-dot${dotX > 50 ? ' tooltip-left' : ''}" style="left:${dotX}%;top:${dotY}%" data-typology="${esc(p.typology)}" data-status="${esc(p.status || '')}" data-region="${esc(p.region || '')}" data-id="${p.id}" href="project.html?id=${p.id}">
            <div class="proj-map-tooltip">
              <div class="proj-map-tooltip-img"${tooltipImg}></div>
              <div class="proj-map-tooltip-body">
                <span class="proj-map-tooltip-name">${esc(lName(p))}</span>
                <span class="proj-map-tooltip-year">${p.year}</span>
              </div>
              <span class="proj-map-tooltip-tag">${esc(tTyp(p.typology))}</span>
            </div>
          </a>`
        );
      }
    });

  }

  // Update initial count
  const projCount = document.getElementById('projCount');
  if (projCount) {
    projCount.textContent = projectData.length + ' ' + (projectData.length !== 1 ? T.projects : T.project);
  }

  // Reveal the grid now that cards have been injected
  projGridView.classList.add('is-visible');
})();
}
