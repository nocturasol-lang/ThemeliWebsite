/* THEMELI — Scroll utilities */

// ========== PAGE HEADER SCROLL FADE ==========
const pageHeader = document.querySelector('.page-header');
if (pageHeader) {
  let phTicking = false;
  let phLastScrollY = 0;
  window.addEventListener('scroll', () => {
    if (!phTicking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY <= 80) {
          pageHeader.classList.remove('is-hidden');
        } else if (currentY < phLastScrollY) {
          pageHeader.classList.remove('is-hidden');
        } else {
          pageHeader.classList.add('is-hidden');
        }
        phLastScrollY = currentY;
        phTicking = false;
      });
      phTicking = true;
    }
  }, { passive: true });
}

// ========== SCROLL TO TOP ==========
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: themeliScrollBehavior() });
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
