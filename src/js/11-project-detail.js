/* THEMELI — Project detail page */

// ========== PROJECT DETAIL PAGE ==========
const pdetDetail = document.getElementById('projectDetail');

if (pdetDetail) {
  // Support both ?id=X (direct) and #X (legacy fallback)
  const params = new URLSearchParams(window.location.search);
  const hashId = window.location.hash.replace('#', '');

  // Normalize hash-based URLs to query params for SEO
  if (hashId && !params.get('id')) {
    window.history.replaceState(null, '', `project?id=${hashId}`);
  }

  const projectId = parseInt(params.get('id'), 10) || parseInt(hashId, 10);

  // Sanitise a string for use inside a CSS url()
  function cssUrl(str) {
    return str ? str.replace(/['"\\()]/g, '\\$&') : '';
  }

  // Load project data
  (async function() {
  const allProjects = (await fetchProjects()).sort((a, b) => {
    const aIP = a.status === 'In Progress' ? 1 : 0;
    const bIP = b.status === 'In Progress' ? 1 : 0;
    if (aIP !== bIP) return bIP - aIP;
    return Math.max(b.year || 0, b.yearStart || 0) - Math.max(a.year || 0, a.yearStart || 0);
  });
  const currentIdx = allProjects.findIndex(p => Number(p.id) === projectId);
  const project = currentIdx !== -1 ? allProjects[currentIdx] : null;

  if (project) {
    // Content
    const tTyp = v => (T.typ[v] || v);
    const tLoc = v => (T.loc && T.loc[v]) || v;
    const pName = LANG === 'el' ? project.name : (project.name_en || project.name);
    const pDesc = LANG === 'el' ? (project.description || '') : (project.description_en || project.description || '');

    // Set page title and update meta tags for SEO
    document.title = `THEMELI — ${pName}`;
    const canonicalUrl = window.location.origin + window.location.pathname + '?id=' + project.id;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = pDesc;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = pDesc;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonicalUrl;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
    if (project.image) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) {
        // OG images require absolute URLs for social sharing
        const imgUrl = project.image.startsWith('http') ? project.image : window.location.origin + '/' + project.image.replace(/^\.\.\//, '');
        ogImg.content = imgUrl;
      }
    }

    // Hero image
    const heroImg = document.getElementById('pdetHeroImg');
    const PLACEHOLDER = '/assets/placeholder.svg';
    heroImg.style.backgroundImage = `url('${cssUrl(project.image || PLACEHOLDER)}')`;
    if (project.image) heroImg.classList.add('has-image');
    document.getElementById('pdetTag').textContent = tTyp(project.typology);
    document.getElementById('pdetTitle').textContent = pName;
    document.getElementById('pdetYear').textContent = project.year;
    document.getElementById('pdetLocation').textContent = tLoc(project.location) || '—';
    document.getElementById('pdetTypology').textContent = tTyp(project.typology);
    document.getElementById('pdetDesc').textContent = pDesc;

    // Gallery
    const galleryEl = document.getElementById('pdetGallery');
    const galleryImgs = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
    if (galleryImgs.length && galleryEl) {
      galleryImgs.forEach((url, i) => {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'pdet-gallery-img';
        img.alt = project.name + ' — ' + (i + 1);
        img.loading = 'lazy';
        img.addEventListener('click', () => openGalleryLightbox(galleryImgs, i));
        galleryEl.appendChild(img);
      });
    }

    // Info board
    const archEl = document.getElementById('pdetArchitect');
    const sizeEl = document.getElementById('pdetSize');
    const statusEl = document.getElementById('pdetStatus');
    const dateCompEl = document.getElementById('pdetDateCompleted');
    const infoLocEl = document.getElementById('pdetInfoLocation');
    const infoTypEl = document.getElementById('pdetInfoTypology');

    archEl.textContent = project.architect || '—';
    sizeEl.textContent = project.size || '—';
    const tStat = v => (T.stat && T.stat[v]) || v;
    statusEl.textContent = tStat(project.status || 'Completed');
    dateCompEl.textContent = project.dateCompleted || String(project.year);
    infoLocEl.textContent = tLoc(project.location) || '—';
    infoTypEl.textContent = tTyp(project.typology);

    // Hide empty optional rows
    if (!project.architect) document.getElementById('pdetInfoArchitect').style.display = 'none';
    if (!project.size) document.getElementById('pdetInfoSize').style.display = 'none';

    // Related projects — excluding current, sorted: in-progress first then newest
    const related = allProjects
      .filter(p => p.id !== project.id)
      .sort((a, b) => {
        const aIP = a.status === 'In Progress' ? 1 : 0;
        const bIP = b.status === 'In Progress' ? 1 : 0;
        if (aIP !== bIP) return bIP - aIP;
        return Math.max(b.year || 0, b.yearStart || 0) - Math.max(a.year || 0, a.yearStart || 0);
      })
      .slice(0, 4);

    const relatedGrid = document.getElementById('pdetRelatedGrid');
    const relatedSection = document.getElementById('pdetRelated');

    if (related.length > 0 && relatedGrid) {
      related.forEach(p => {
        const imgStyle = `background-image:url('${cssUrl(p.image || PLACEHOLDER)}')`;
        relatedGrid.insertAdjacentHTML('beforeend',
          `<a class="pdet-related-card" href="project?id=${p.id}">
            <div class="pdet-related-card-img" style="${imgStyle}"></div>
            <div class="pdet-related-card-body">
              <span class="pdet-related-card-name">${LANG === 'el' ? p.name : (p.name_en || p.name)}</span>
              <span class="pdet-related-card-meta">${tTyp(p.typology)} &middot; ${tLoc(p.location) || ''}</span>
            </div>
          </a>`
        );
      });
    } else if (relatedSection) {
      relatedSection.style.display = 'none';
    }

    // Adjacent project navigation (loops around)
    const prevProject = allProjects[(currentIdx - 1 + allProjects.length) % allProjects.length];
    const nextProject = allProjects[(currentIdx + 1) % allProjects.length];

    const prevLink = document.getElementById('pdetPrev');
    const nextLink = document.getElementById('pdetNext');
    const prevName = document.getElementById('pdetPrevName');
    const nextName = document.getElementById('pdetNextName');

    prevLink.href = `project?id=${prevProject.id}`;
    prevName.textContent = LANG === 'el' ? prevProject.name : (prevProject.name_en || prevProject.name);

    nextLink.href = `project?id=${nextProject.id}`;
    nextName.textContent = LANG === 'el' ? nextProject.name : (nextProject.name_en || nextProject.name);

    // Staggered reveal animation
    requestAnimationFrame(() => {
      pdetDetail.classList.add('is-loaded');
    });
  } else {
    // Project not found — surface a brief message, then redirect back to the list.
    const msg = (T && T.projectNotFound) || 'Project not found.';
    pdetDetail.innerHTML = `<div class="pdet-missing"><p>${msg}</p></div>`;
    pdetDetail.classList.add('is-loaded');
    setTimeout(() => { window.location.href = 'projects'; }, 1200);
  }
  })();
}

// ========== GALLERY LIGHTBOX (delegates to shared PhotoSwipe helper) ==========
function openGalleryLightbox(images, startIndex) {
  if (typeof window.openGallery === 'function') {
    window.openGallery(images, startIndex || 0);
  }
}
