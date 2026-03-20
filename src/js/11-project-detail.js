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

  // Load project data
  (async function() {
  const allProjects = await fetchProjects();
  const currentIdx = allProjects.findIndex(p => Number(p.id) === projectId);
  const project = currentIdx !== -1 ? allProjects[currentIdx] : null;

  if (project) {
    // Set page title
    document.title = `THEMELI — ${pName}`;

    // Hero image
    const heroImg = document.getElementById('pdetHeroImg');
    if (project.image) {
      heroImg.style.backgroundImage = `url('${cssUrl(project.image)}')`;
      heroImg.classList.add('has-image');
    }

    // Content
    const tTyp = v => (T.typ[v] || v);
    const pName = LANG === 'el' ? project.name : (project.name_en || project.name);
    const pDesc = LANG === 'el' ? (project.description || '') : (project.description_en || project.description || '');
    document.getElementById('pdetTag').textContent = tTyp(project.typology);
    document.getElementById('pdetTitle').textContent = pName;
    document.getElementById('pdetYear').textContent = project.year;
    document.getElementById('pdetLocation').textContent = project.location || '—';
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
    statusEl.textContent = project.status || 'Completed';
    dateCompEl.textContent = project.dateCompleted || String(project.year);
    infoLocEl.textContent = project.location || '—';
    infoTypEl.textContent = tTyp(project.typology);

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
              <span class="pdet-related-card-name">${LANG === 'el' ? p.name : (p.name_en || p.name)}</span>
              <span class="pdet-related-card-meta">${tTyp(p.typology)} &middot; ${p.location || ''}</span>
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

    prevLink.href = `project.html#${prevProject.id}`;
    prevName.textContent = LANG === 'el' ? prevProject.name : (prevProject.name_en || prevProject.name);

    nextLink.href = `project.html#${nextProject.id}`;
    nextName.textContent = LANG === 'el' ? nextProject.name : (nextProject.name_en || nextProject.name);

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

// ========== GALLERY LIGHTBOX ==========
function openGalleryLightbox(images, startIndex) {
  let idx = startIndex;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `
    <button class="lightbox-close">&times;</button>
    ${images.length > 1 ? '<button class="lightbox-arrow lightbox-prev">&#8249;</button>' : ''}
    <img class="lightbox-img" src="${images[idx]}" alt="">
    ${images.length > 1 ? '<button class="lightbox-arrow lightbox-next">&#8250;</button>' : ''}
    ${images.length > 1 ? '<div class="lightbox-counter">' + (idx + 1) + ' / ' + images.length + '</div>' : ''}
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const img = overlay.querySelector('.lightbox-img');
  const counter = overlay.querySelector('.lightbox-counter');

  function show(i) {
    idx = (i + images.length) % images.length;
    img.src = images[idx];
    if (counter) counter.textContent = (idx + 1) + ' / ' + images.length;
  }

  function close() {
    overlay.classList.remove('is-visible');
    setTimeout(() => overlay.remove(), 300);
  }

  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  const prev = overlay.querySelector('.lightbox-prev');
  const next = overlay.querySelector('.lightbox-next');
  if (prev) prev.addEventListener('click', () => show(idx - 1));
  if (next) next.addEventListener('click', () => show(idx + 1));
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
    if (e.key === 'ArrowLeft' && prev) show(idx - 1);
    if (e.key === 'ArrowRight' && next) show(idx + 1);
  });
}
