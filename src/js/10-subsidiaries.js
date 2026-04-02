/* THEMELI — Subsidiaries detail & lightbox */

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

  // Gallery lightbox function
  const openGallery = (images, startIndex) => {
    let idx = startIndex || 0;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-arrow lightbox-prev" aria-label="Previous">&lsaquo;</button>
      <img class="lightbox-img" src="${images[idx]}" alt="">
      <button class="lightbox-arrow lightbox-next" aria-label="Next">&rsaquo;</button>
      <div class="lightbox-counter">${idx + 1} / ${images.length}</div>`;
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';

    const img = lb.querySelector('.lightbox-img');
    const counter = lb.querySelector('.lightbox-counter');
    const updateArrows = () => {
      lb.querySelector('.lightbox-prev').style.visibility = images.length > 1 ? 'visible' : 'hidden';
      lb.querySelector('.lightbox-next').style.visibility = images.length > 1 ? 'visible' : 'hidden';
    };
    const show = () => {
      img.src = images[idx];
      counter.textContent = (idx + 1) + ' / ' + images.length;
    };
    updateArrows();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => lb.classList.add('is-visible'));
    });

    function handler(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + images.length) % images.length; show(); }
      if (e.key === 'ArrowRight') { idx = (idx + 1) % images.length; show(); }
    }

    const close = () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      lb.classList.remove('is-visible');
      setTimeout(() => lb.remove(), 300);
    };
    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.querySelector('.lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      idx = (idx - 1 + images.length) % images.length;
      show();
    });
    lb.querySelector('.lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      idx = (idx + 1) % images.length;
      show();
    });
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', handler);
  };

  // Show subsidiary detail view
  function showSubDetail(key, pushHistory) {
    const data = subsData[key];
    if (!data) return;

    subName.textContent = data.name;
    subSubtitle.textContent = data.subtitle;
    subDesc.innerHTML = data.desc;
    subLogo.setAttribute('data-sub', key);
    subLogo.innerHTML = `<img src="${data.logo}" alt="${data.name}">`;

    // Populate featured grid
    const subFeatured = document.getElementById('subFeatured');
    if (subFeatured) {
      const renderCard = (f) => {
        const hasImg = f.img && f.img !== '';
        const imgTag = hasImg
          ? `<img class="sub-featured-img" src="${f.img}" alt="${f.name}" loading="lazy">`
          : `<div class="sub-featured-img sub-featured-img--empty"></div>`;
        return `<div class="sub-featured-card"${hasImg ? ` data-lightbox="${f.img}"` : ''}>
          ${imgTag}
          <div class="sub-featured-info">
            <span class="sub-featured-name">${f.name}</span>
          </div>
        </div>`;
      };

      if (data.featuredGroups && data.featuredGroups.length) {
        subFeatured.innerHTML = data.featuredGroups.map((group, i) => {
          const divider = i > 0 ? '<div class="sub-featured-divider"></div>' : '';
          return `${divider}<div class="sub-featured-group">
            <div class="sub-featured-group-header">
              <h3 class="sub-featured-group-title">${group.title}</h3>
              <span class="sub-featured-group-subtitle">${group.subtitle}</span>
            </div>
            <div class="sub-featured-group-cards">
              ${group.items.map(renderCard).join('')}
            </div>
          </div>`;
        }).join('');
        subFeatured.classList.add('sub-featured-grid--grouped');
        subFeatured.classList.remove('sub-featured-grid');
      } else if (data.featured && data.featured.length) {
        subFeatured.innerHTML = data.featured.map(renderCard).join('');
        subFeatured.classList.add('sub-featured-grid');
        subFeatured.classList.remove('sub-featured-grid--grouped');
      } else {
        subFeatured.innerHTML = '';
        subFeatured.classList.remove('sub-featured-grid', 'sub-featured-grid--grouped');
      }

      // Attach lightbox to grouped cards (with gallery)
      if (data.featuredGroups) {
        data.featuredGroups.forEach((group, gi) => {
          const gallery = group.gallery || group.items.filter(f => f.img).map(f => f.img);
          const groupEl = subFeatured.querySelectorAll('.sub-featured-group')[gi];
          if (groupEl) {
            groupEl.querySelectorAll('[data-lightbox]').forEach(card => {
              card.addEventListener('click', () => {
                const src = card.getAttribute('data-lightbox');
                const startIdx = gallery.indexOf(src);
                openGallery(gallery, startIdx >= 0 ? startIdx : 0);
              });
            });
          }
        });
      }

      // Attach lightbox to simple featured cards
      if (data.featured) {
        const allImgs = data.featured.filter(f => f.img).map(f => f.img);
        subFeatured.querySelectorAll('[data-lightbox]').forEach(card => {
          card.addEventListener('click', () => {
            const src = card.getAttribute('data-lightbox');
            const startIdx = allImgs.indexOf(src);
            openGallery(allImgs, startIdx >= 0 ? startIdx : 0);
          });
        });
      }
    }

    // Transition: hide grid, show detail
    subsGrid.classList.add('is-hidden');
    subDetail.classList.add('is-active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        subDetail.classList.add('is-visible');
      });
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL hash
    if (pushHistory) {
      window.history.pushState({ sub: key }, '', '#' + key);
    }
  }

  // Show logo grid
  function showSubGrid() {
    subDetail.classList.remove('is-visible');
    setTimeout(() => {
      subDetail.classList.remove('is-active');
      subsGrid.classList.remove('is-hidden');
    }, 400);
  }

  // Click on a subsidiary logo
  document.querySelectorAll('[data-sub]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-sub');
      showSubDetail(key, true);
    });
  });

  // Back button
  if (subBack) {
    subBack.addEventListener('click', () => {
      window.history.back();
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1);
    if (hash && subsData[hash]) {
      showSubDetail(hash, false);
    } else {
      showSubGrid();
    }
  });

  // Handle initial load with hash
  if (window.location.hash) {
    const key = window.location.hash.slice(1);
    if (subsData[key]) {
      showSubDetail(key, false);
    }
  }
}
