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

  // Gallery viewer is provided by src/js/09a-photoswipe.js as window.openGallery.
  const openGallery = (images, startIndex) => window.openGallery(images, startIndex || 0);

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
