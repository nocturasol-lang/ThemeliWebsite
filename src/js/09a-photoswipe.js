/* THEMELI — Shared PhotoSwipe helper
 *
 * Replaces the old custom lightbox (previously duplicated in subsidiaries
 * and project-detail JS). Lazy-loads PhotoSwipe on first open so pages
 * without galleries don't pay the ~70 KB cost.
 *
 * Usage:
 *   openGallery(['url1.jpg', 'url2.jpg', ...], startIndex);
 *
 * PhotoSwipe wants image dimensions up front. We probe each image on
 * first open via an Image() preload; this is quick because the source
 * thumbnails are already in the browser cache.
 */

(function () {
  var pswpLoading = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.async = true;
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadStyle(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  // BASE is a top-level const from 00-core.js — accessible in our IIFE
  // because the bundle shares one script scope. It's either "../" (inside
  // /en/ or /el/) or "" (root-level pages).
  function assetUrl(path) {
    var base = (typeof BASE !== 'undefined') ? BASE : '';
    return base + path;
  }

  function ensurePhotoSwipe() {
    if (window.PhotoSwipe && window.PhotoSwipeLightbox) return Promise.resolve();
    if (pswpLoading) return pswpLoading;
    loadStyle(assetUrl('assets/vendor/photoswipe.css'));
    pswpLoading = Promise.all([
      loadScript(assetUrl('assets/vendor/photoswipe.umd.js')),
      loadScript(assetUrl('assets/vendor/photoswipe-lightbox.umd.js')),
    ]);
    return pswpLoading;
  }

  function probeDims(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve({ src: src, width: img.naturalWidth || 1600, height: img.naturalHeight || 1200 });
      };
      img.onerror = function () {
        resolve({ src: src, width: 1600, height: 1200 });
      };
      img.src = src;
    });
  }

  window.openGallery = async function (images, startIndex) {
    if (!images || !images.length) return;
    startIndex = startIndex || 0;

    try {
      await ensurePhotoSwipe();
    } catch (_) {
      return; // PhotoSwipe failed to load; fail quietly
    }

    // Resolve all dimensions in parallel. Already-cached images return instantly.
    var dataSource = await Promise.all(images.map(probeDims));

    var pswp = new window.PhotoSwipe({
      dataSource: dataSource,
      index: startIndex,
      showHideAnimationType: 'fade',
      bgOpacity: 0.92,
      // Keep UI minimal to match site aesthetic
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
    });
    pswp.init();
  };
})();
