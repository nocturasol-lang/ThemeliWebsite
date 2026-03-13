/**
 * THEMELI — Monumental Brutalism interactions
 */

// ========== I18N ==========
const LANG = window.location.pathname.includes('/el/') ? 'el' : 'en';
const BASE = window.location.pathname.match(/\/(en|el)\//) ? '../' : '';

const I18N = {
  en: {
    projects: 'Projects', project: 'Project',
    copied: 'Copied!', copyAddress: 'Copy Address', copyNumber: 'Copy Number',
    subsData: {
      kalami: { name: 'kalami', subtitle: 'real estate', logo: BASE + 'assets/kalami.svg', desc: 'Kalami has a 3rd class certification for Public Works since 2006, sufficient for participation in tenders for public or private works in all categories. Recently completed projects: [1] Construction of sewage pipe (microtunnel) for the Water Supply and Sewage Company of Athens (EYDAP) in the areas of Geraka and Amarousio. [2] Construction of a Sanitary Landfill Area in Chios island — in joint venture. Kalami owns a 2,25 hectares seaside land in Samos island.' },
      themos: { name: 'themos', subtitle: 'concrete prefabrication', logo: BASE + 'assets/themos.svg', desc: 'Themos is a Greek company founded in 2005 by Themeli S.A. to cover the needs of miscellaneous railway type sleepers. The construction was commissioned to the Italian company Plan Srl. aided by the expertise of German company Leonhard Moll Betonwerke GmbH & Co KG. Themos has produced 120.000 sleepers, TBS 1000 type, for metric line (Gauge 1000 mm), which are already placed in the railway net of Peloponnese and 100.000 sleepers, B-70 type, for normal line (1435 mm gauge) for the railway in the rest of the country.' },
      thermis: { name: 'thermis', subtitle: 'wind farms', logo: BASE + 'assets/thermis.svg', desc: 'Thermis was founded for the development of wind farms and aims to make a dynamic entry into the field of renewable power resources. The main effort is directed towards the development of 7,6 MW Bauza wind farm, at the municipality of Erineo, Achaia. At the same time, the daughter companies of Xirovouni Platanou SA and Perganti-Akarnaniko SA are managing the homonymous parks.' },
      tetrapolis: { name: 'tetrapolis', subtitle: 'residence complex', logo: BASE + 'assets/tetrapolis.svg', desc: 'Tetrapolis Keos a summer residence complex in Ioulida, Kea. Built in 2016 and fully equipped with all necessary facilities, the complex consists of six independent residences, ranging from 82sq to 137sq, which share a swimming pool with a view over the harbor.' }
    }
  },
  el: {
    projects: 'Έργα', project: 'Έργο',
    copied: 'Αντιγράφηκε!', copyAddress: 'Αντιγραφή Διεύθυνσης', copyNumber: 'Αντιγραφή Αριθμού',
    subsData: {
      kalami: { name: 'kalami', subtitle: 'ακίνητα', logo: BASE + 'assets/kalami.svg', desc: 'Η Kalami διαθέτει πιστοποίηση 3ης τάξης για Δημόσια Έργα από το 2006, επαρκή για συμμετοχή σε διαγωνισμούς δημοσίων ή ιδιωτικών έργων σε όλες τις κατηγορίες. Πρόσφατα ολοκληρωμένα έργα: [1] Κατασκευή αγωγού αποχέτευσης (microtunnel) για την ΕΥΔΑΠ στις περιοχές Γέρακα και Αμαρουσίου. [2] Κατασκευή ΧΥΤΑ στη Χίο — σε κοινοπραξία. Η Kalami κατέχει παραθαλάσσιο οικόπεδο 2,25 εκταρίων στη Σάμο.' },
      themos: { name: 'themos', subtitle: 'προκατασκευές σκυροδέματος', logo: BASE + 'assets/themos.svg', desc: 'Η Themos είναι ελληνική εταιρεία που ιδρύθηκε το 2005 από τη Θεμέλη Α.Ε. για την κάλυψη αναγκών σε σιδηροδρομικούς στρωτήρες. Η κατασκευή ανατέθηκε στην ιταλική Plan Srl. με την τεχνογνωσία της γερμανικής Leonhard Moll Betonwerke GmbH & Co KG. Η Themos έχει παράγει 120.000 στρωτήρες τύπου TBS 1000 για μετρική γραμμή (1000 mm) και 100.000 στρωτήρες τύπου B-70 για κανονική γραμμή (1435 mm).' },
      thermis: { name: 'thermis', subtitle: 'αιολικά πάρκα', logo: BASE + 'assets/thermis.svg', desc: 'Η Thermis ιδρύθηκε για την ανάπτυξη αιολικών πάρκων και στοχεύει σε δυναμική είσοδο στον τομέα των ανανεώσιμων πηγών ενέργειας. Η κύρια προσπάθεια κατευθύνεται στην ανάπτυξη του αιολικού πάρκου 7,6 MW Bauza, στον δήμο Ερινεού, Αχαΐα. Παράλληλα, οι θυγατρικές Ξηροβούνι Πλατάνου Α.Ε. και Περγαντί-Ακαρνανικό Α.Ε. διαχειρίζονται τα ομώνυμα πάρκα.' },
      tetrapolis: { name: 'tetrapolis', subtitle: 'συγκρότημα κατοικιών', logo: BASE + 'assets/tetrapolis.svg', desc: 'Η Tetrapolis Keos είναι ένα θερινό συγκρότημα κατοικιών στην Ιουλίδα, Κέα. Κατασκευασμένο το 2016 και πλήρως εξοπλισμένο, το συγκρότημα αποτελείται από έξι ανεξάρτητες κατοικίες, από 82τμ έως 137τμ, που μοιράζονται πισίνα με θέα στο λιμάνι.' }
    }
  }
};
const T = I18N[LANG];

// Language switcher
const langSwitch = document.querySelector('[data-lang-switch]');
if (langSwitch) {
  const otherLang = LANG === 'en' ? 'el' : 'en';
  const currentPath = window.location.pathname;
  const newPath = currentPath.replace('/' + LANG + '/', '/' + otherLang + '/');
  langSwitch.href = newPath + window.location.search;
}

// ========== MENU ==========
const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('navOverlay');

if (hamburger && navOverlay) {
  hamburger.addEventListener('click', () => {
    const isOpening = !navOverlay.classList.contains('is-open');
    hamburger.classList.toggle('is-active');
    navOverlay.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', isOpening);
    document.body.style.overflow = isOpening ? 'hidden' : '';
  });

  navOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('is-active');
      navOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) {
      hamburger.classList.remove('is-active');
      navOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

// ========== SCROLL REVEAL ==========
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px'
});

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .timeline-bar').forEach(el => {
  revealObserver.observe(el);
});

// ========== TYPEWRITER EFFECT ==========
document.querySelectorAll('.timeline-opener').forEach(el => {
  const origHTML = el.innerHTML;
  el.classList.add('typewriter');

  // Parse original HTML into a temp container
  const temp = document.createElement('div');
  temp.innerHTML = origHTML;

  const walkAndWrap = (node) => {
    const frag = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split('').forEach(ch => {
          const span = document.createElement('span');
          span.className = 'tw-char';
          span.textContent = ch;
          frag.appendChild(span);
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = child.cloneNode(false);
        clone.appendChild(walkAndWrap(child));
        frag.appendChild(clone);
      }
    });
    return frag;
  };

  el.innerHTML = '';
  el.appendChild(walkAndWrap(temp));

  // Gather all tw-char spans in order
  const chars = el.querySelectorAll('.tw-char');

  // Observe for scroll reveal
  const twObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        twObserver.unobserve(el);
        el.classList.add('typing');
        let i = 0;
        const speed = 22; // ms per character
        const tick = () => {
          if (i < chars.length) {
            chars[i].classList.add('tw-visible');
            i++;
            setTimeout(tick, speed);
          }
        };
        tick();
      }
    });
  }, { threshold: 0.1 });

  twObserver.observe(el);
});

// ========== SCROLL TO TOP ==========
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  let stTicking = false;
  window.addEventListener('scroll', () => {
    if (!stTicking) {
      requestAnimationFrame(() => {
        scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
        stTicking = false;
      });
      stTicking = true;
    }
  });
}

// ========== SMOOTH PARALLAX ON HERO ==========
const hero = document.querySelector('.hero');
const heroEst = document.querySelector('.hero-est');

if (hero && heroEst) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        if (scrollY < heroHeight) {
          const progress = scrollY / heroHeight;
          heroEst.style.transform = `translateY(calc(-50% + ${scrollY * 0.3}px))`;
          heroEst.style.opacity = 1 - progress * 1.5;
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ========== TIMELINE NAV ==========
const timelineNav = document.getElementById('timelineNav');
if (timelineNav) {
  const navButtons = timelineNav.querySelectorAll('.timeline-nav-year');
  const progressBar = document.getElementById('timelineNavProgress');

  // Click to scroll
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (target) {
        const offset = 120;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Track active era on scroll
  const eraIds = Array.from(navButtons).map(btn => btn.getAttribute('data-target'));
  const eraElements = eraIds.map(id => document.getElementById(id)).filter(Boolean);

  function updateActiveYear() {
    const scrollY = window.scrollY + 200;
    let activeIndex = 0;

    eraElements.forEach((el, i) => {
      if (el.offsetTop <= scrollY) {
        activeIndex = i;
      }
    });

    navButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === activeIndex);
    });

    // Update progress bar
    if (progressBar && navButtons.length > 1) {
      const pct = (activeIndex / (navButtons.length - 1)) * 100;
      progressBar.style.width = pct + '%';
    }
  }

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(() => {
        updateActiveYear();
        navTicking = false;
      });
      navTicking = true;
    }
  });

  updateActiveYear();
}

// ========== PROJECTS: DATA-DRIVEN RENDERING ==========
const projGridView = document.getElementById('projGridView');
const projListView = document.getElementById('projListView');
const projMapView = document.getElementById('projMapView');
const mapInner = document.getElementById('mapInner');

// Load from localStorage (admin-published) or fall back to default PROJECTS
function loadProjectData() {
  const saved = localStorage.getItem('themeli_projects');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* fall through */ }
  }
  return typeof PROJECTS !== 'undefined' ? PROJECTS : [];
}

const projectData = loadProjectData();

if (projGridView && projectData.length) {
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
      `<a class="proj-card" data-typology="${esc(p.typology)}" href="project.html?id=${p.id}">
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
        `<a class="proj-row" data-typology="${esc(p.typology)}" href="project.html?id=${p.id}"><span class="proj-col proj-col-name">${esc(p.name)}</span><span class="proj-col proj-col-type">${esc(p.typology)}</span><span class="proj-col proj-col-loc">${esc(p.location)}</span><span class="proj-col proj-col-year">${p.year}</span></a>`
      );
    });
  }

  // Render map dots with tooltip cards
  if (mapInner) {
    projectData.forEach(p => {
      if (p.mapX == null || p.mapY == null) return;
      const tooltipImg = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';
      mapInner.insertAdjacentHTML('beforeend',
        `<a class="proj-map-dot" style="left:${p.mapX}%;top:${p.mapY}%" data-typology="${esc(p.typology)}" href="project.html?id=${p.id}">
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
}

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

// ========== SUBSIDIARIES REACTIVE DETAIL ==========
const subsData = T.subsData;

const subsGrid = document.getElementById('subsGrid');
const subDetail = document.getElementById('subDetail');
const subBack = document.getElementById('subBack');
const subName = document.getElementById('subName');
const subSubtitle = document.getElementById('subSubtitle');
const subDesc = document.getElementById('subDesc');
const subLogo = document.getElementById('subLogo');

if (subsGrid && subDetail) {
  // Click on a subsidiary logo
  document.querySelectorAll('[data-sub]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-sub');
      const data = subsData[key];
      if (!data) return;

      // Populate detail
      subName.textContent = data.name;
      subSubtitle.textContent = data.subtitle;
      subDesc.textContent = data.desc;
      subLogo.setAttribute('data-sub', key);
      subLogo.innerHTML = `<img src="${data.logo}" alt="${data.name}">`;

      // Transition: hide grid, show detail
      subsGrid.classList.add('is-hidden');
      subDetail.classList.add('is-active');

      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          subDetail.classList.add('is-visible');
        });
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Back button
  if (subBack) {
    subBack.addEventListener('click', () => {
      subDetail.classList.remove('is-visible');

      setTimeout(() => {
        subDetail.classList.remove('is-active');
        subsGrid.classList.remove('is-hidden');
      }, 400);
    });
  }

  // Handle URL hash for direct linking
  if (window.location.hash) {
    const key = window.location.hash.slice(1);
    const trigger = document.querySelector(`[data-sub="${key}"]`);
    if (trigger) trigger.click();
  }
}

// ========== PROJECT DETAIL PAGE ==========
const pdetDetail = document.getElementById('projectDetail');

if (pdetDetail) {
  const params = new URLSearchParams(window.location.search);
  const projectId = parseInt(params.get('id'), 10);

  // Sanitise a string for use inside a CSS url()
  function cssUrl(str) {
    return str ? str.replace(/['"\\()]/g, '\\$&') : '';
  }

  // Load data
  function loadPdetData() {
    const saved = localStorage.getItem('themeli_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fall through */ }
    }
    return typeof PROJECTS !== 'undefined' ? PROJECTS : [];
  }

  const allProjects = loadPdetData();
  const currentIdx = allProjects.findIndex(p => p.id === projectId);
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
          `<a class="pdet-related-card" href="project.html?id=${encodeURIComponent(p.id)}">
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
      prevLink.href = `project.html?id=${prevProject.id}`;
      prevName.textContent = prevProject.name;
    } else {
      prevLink.style.visibility = 'hidden';
    }

    if (nextProject) {
      nextLink.href = `project.html?id=${nextProject.id}`;
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
}

// ========== EMAIL POPUP ==========
document.querySelectorAll('.email-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest('.email-wrapper');
    // Close any other open popups
    document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
      if (w !== wrapper) w.classList.remove('active');
    });
    wrapper.classList.toggle('active');
  });
});

document.querySelectorAll('.email-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const email = btn.dataset.email;
    navigator.clipboard.writeText(email).then(() => {
      btn.textContent = T.copied;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = T.copyAddress;
        btn.classList.remove('copied');
        btn.closest('.email-wrapper').classList.remove('active');
      }, 1500);
    });
  });
});

// ========== PHONE POPUP ==========
document.querySelectorAll('.phone-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest('.phone-wrapper');
    document.querySelectorAll('.phone-wrapper.active, .email-wrapper.active').forEach(w => {
      if (w !== wrapper) w.classList.remove('active');
    });
    wrapper.classList.toggle('active');
  });
});

document.querySelectorAll('.phone-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const phone = btn.dataset.phone;
    navigator.clipboard.writeText(phone).then(() => {
      btn.textContent = T.copied;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = T.copyNumber;
        btn.classList.remove('copied');
        btn.closest('.phone-wrapper').classList.remove('active');
      }, 1500);
    });
  });
});

// Close popups when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.email-wrapper') && !e.target.closest('.phone-wrapper')) {
    document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
      w.classList.remove('active');
    });
  }
});
