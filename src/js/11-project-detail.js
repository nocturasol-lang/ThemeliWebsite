/* THEMELI — Project detail page */

// ========== PROJECT DETAIL PAGE ==========
const pdetDetail = document.getElementById('projectDetail');

if (pdetDetail) {
  // Support both ?id=X (direct) and #X (clean URL fallback)
  const params = new URLSearchParams(window.location.search);
  const projectId = parseInt(params.get('id'), 10) || parseInt(window.location.hash.replace('#', ''), 10);

  // Sanitise a string for use inside a CSS url()
  function cssUrl(str) {
    return str ? str.replace(/['"\\()]/g, '\\$&') : '';
  }

  // Load data from Supabase (async)
  (async function() {
  const allProjects = await fetchProjects();
  const currentIdx = allProjects.findIndex(p => Number(p.id) === projectId);
  const project = currentIdx !== -1 ? allProjects[currentIdx] : null;

  if (project) {
    // Set page title
    document.title = `THEMELI — ${project.name}`;

    // Hero image
    const heroImg = document.getElementById('pdetHeroImg');
    if (project.image) {
      heroImg.style.backgroundImage = `url('${cssUrl(project.image)}')`;
      heroImg.classList.add('has-image');
    }

    // Content
    document.getElementById('pdetTag').textContent = project.typology;
    document.getElementById('pdetTitle').textContent = project.name;
    document.getElementById('pdetYear').textContent = project.year;
    document.getElementById('pdetLocation').textContent = project.location || '—';
    document.getElementById('pdetTypology').textContent = project.typology;
    document.getElementById('pdetDesc').textContent = project.description || '';

    // Info board
    const archEl = document.getElementById('pdetArchitect');
    const sizeEl = document.getElementById('pdetSize');
    const statusEl = document.getElementById('pdetStatus');
    const dateCompEl = document.getElementById('pdetDateCompleted');
    const infoLocEl = document.getElementById('pdetInfoLocation');
    const infoTypEl = document.getElementById('pdetInfoTypology');

    archEl.textContent = project.architect || '—';
    sizeEl.textContent = project.size || '—';
    statusEl.textContent = project.status || 'Completed';
    dateCompEl.textContent = project.dateCompleted || String(project.year);
    infoLocEl.textContent = project.location || '—';
    infoTypEl.textContent = project.typology;

    // Hide empty optional rows
    if (!project.architect) document.getElementById('pdetInfoArchitect').style.display = 'none';
    if (!project.size) document.getElementById('pdetInfoSize').style.display = 'none';

    // Related projects — same typology, excluding current
    const related = allProjects
      .filter(p => p.typology === project.typology && p.id !== project.id)
      .slice(0, 4);

    const relatedGrid = document.getElementById('pdetRelatedGrid');
    const relatedSection = document.getElementById('pdetRelated');

    if (related.length > 0 && relatedGrid) {
      related.forEach(p => {
        const imgStyle = p.image ? `background-image:url('${cssUrl(p.image)}')` : '';
        relatedGrid.insertAdjacentHTML('beforeend',
          `<a class="pdet-related-card" href="project.html#${p.id}">
            <div class="pdet-related-card-img" style="${imgStyle}"></div>
            <div class="pdet-related-card-body">
              <span class="pdet-related-card-name">${p.name}</span>
              <span class="pdet-related-card-meta">${p.typology} &middot; ${p.location || ''}</span>
            </div>
          </a>`
        );
      });
    } else if (relatedSection) {
      relatedSection.style.display = 'none';
    }

    // Adjacent project navigation
    const prevProject = currentIdx > 0 ? allProjects[currentIdx - 1] : null;
    const nextProject = currentIdx < allProjects.length - 1 ? allProjects[currentIdx + 1] : null;

    const prevLink = document.getElementById('pdetPrev');
    const nextLink = document.getElementById('pdetNext');
    const prevName = document.getElementById('pdetPrevName');
    const nextName = document.getElementById('pdetNextName');

    if (prevProject) {
      prevLink.href = `project.html#${prevProject.id}`;
      prevName.textContent = prevProject.name;
    } else {
      prevLink.style.visibility = 'hidden';
    }

    if (nextProject) {
      nextLink.href = `project.html#${nextProject.id}`;
      nextName.textContent = nextProject.name;
    } else {
      nextLink.style.visibility = 'hidden';
    }

    // Staggered reveal animation
    requestAnimationFrame(() => {
      pdetDetail.classList.add('is-loaded');
    });
  } else {
    // Project not found — redirect back
    window.location.href = 'projects.html';
  }
  })();
}
