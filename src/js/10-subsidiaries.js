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

  // Where each subsidiary's photos sit inside its text, in the manner of the
  // Timeline. "before" counts the top-level blocks of the description (same
  // structure in both languages), or of a text column when "column" is set.
  // "size" is s, m or wide; "duo" pairs two photos of unequal width.
  const SUB_PHOTO_LAYOUT = {
    themos: [
      { before: 0, size: 'm', side: 'right', photo: 0 },
      { before: 3, size: 'wide', photo: 1 },
      { before: 6, size: 'm', side: 'left', photo: 2 },
      { before: 10, size: 'm', side: 'right', photo: 3 },
    ],
    thermis: [
      { column: 0, before: 1, size: 'wide', photo: 0 },
      { column: 0, before: 2, size: 's', side: 'right', photo: 1 },
      { column: 1, before: 1, size: 'wide', photo: 2 },
      { column: 1, before: 2, size: 's', side: 'right', photo: 3 },
    ],
    tetrapolis: [
      { before: 0, size: 'm', side: 'right', photo: 0 },
      { before: 3, duo: [2, 3] },
      { before: 3, size: 's', side: 'left', photo: 1 },
    ],
  };

  // A flat photo list; grouped subsidiaries keep each group's full gallery.
  function subPhotos(data) {
    if (data.featuredGroups) {
      return data.featuredGroups.flatMap(group => {
        const gallery = group.gallery || group.items.filter(f => f.img).map(f => f.img);
        return group.items.map(f => ({ ...f, gallery }));
      });
    }
    const gallery = (data.featured || []).filter(f => f.img).map(f => f.img);
    return (data.featured || []).map(f => ({ ...f, gallery }));
  }

  function subPhotoFigure(photo, className) {
    const figure = document.createElement('figure');
    figure.className = className;
    // A real <button> so the gallery is keyboard-operable; the visible caption
    // names the photo.
    figure.innerHTML = `<button type="button" class="sub-photo-open" aria-label="${photo.name}"><img src="${photo.img}" alt="" loading="lazy"></button>
      <figcaption class="sub-photo-caption">${photo.name}</figcaption>`;
    figure.querySelector('button').addEventListener('click', () => {
      openGallery(photo.gallery, Math.max(0, photo.gallery.indexOf(photo.img)));
    });
    return figure;
  }

  function placeSubPhotos(key, data) {
    const photos = subPhotos(data);
    const columns = subDesc.querySelectorAll('.sub-desc-col');
    // Resolve every anchor first: inserted photos must not shift the counts.
    const placements = (SUB_PHOTO_LAYOUT[key] || []).map(place => {
      const parent = place.column === undefined ? subDesc : columns[place.column];
      return { ...place, parent, anchor: parent ? parent.children[place.before] : null };
    });
    placements.forEach(({ parent, anchor, size, side, photo, duo }) => {
      if (!parent) return;
      let node;
      if (duo) {
        node = document.createElement('div');
        node.className = 'sub-photo-duo';
        duo.forEach(i => { if (photos[i] && photos[i].img) node.appendChild(subPhotoFigure(photos[i], 'sub-photo')); });
      } else {
        if (!photos[photo] || !photos[photo].img) return;
        const sideClass = side ? ` sub-photo--${side}` : '';
        node = subPhotoFigure(photos[photo], `sub-photo sub-photo--${size}${sideClass}`);
      }
      parent.insertBefore(node, anchor || null);
    });
  }

  // The logo button that opened the current detail view; focus returns to it
  // when the grid comes back (the button is display:none while the detail is
  // open, so focus would otherwise be lost).
  let lastLogoTrigger = null;

  // Show subsidiary detail view
  function showSubDetail(key, pushHistory, moveFocus) {
    const data = subsData[key];
    if (!data) return;
    lastLogoTrigger = subsGrid.querySelector(`[data-sub="${key}"]`);

    subName.textContent = data.name;
    subSubtitle.textContent = data.subtitle;
    subDesc.innerHTML = data.desc;
    subLogo.setAttribute('data-sub', key);
    // Decorative here: the adjacent <h1> already carries the name.
    subLogo.innerHTML = `<img src="${data.logo}" alt="">`;

    placeSubPhotos(key, data);

    // Transition: hide grid, show detail
    subsGrid.classList.add('is-hidden');
    subDetail.classList.add('is-active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        subDetail.classList.add('is-visible');
      });
    });

    window.scrollTo({ top: 0, behavior: themeliScrollBehavior() });

    // Move focus to the detail heading (tabindex="-1") so keyboard and screen
    // reader users continue from the new content; the page scroll above
    // handles the viewport, so do not scroll again here.
    if (moveFocus) subName.focus({ preventScroll: true });

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
      // Return focus to the logo that opened the detail view
      if (lastLogoTrigger && subsGrid.contains(lastLogoTrigger)) {
        lastLogoTrigger.focus({ preventScroll: true });
      }
    }, 400);
  }

  // Click on a subsidiary logo
  subsGrid.querySelectorAll('[data-sub]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-sub');
      showSubDetail(key, true, true);
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
      showSubDetail(hash, false, true);
    } else {
      showSubGrid();
    }
  });

  // Handle initial load with hash
  if (window.location.hash) {
    const key = window.location.hash.slice(1);
    if (subsData[key]) {
      showSubDetail(key, false, false);
    }
  }
}
