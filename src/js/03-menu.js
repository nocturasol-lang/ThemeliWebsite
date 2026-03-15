/* THEMELI — Menu & navigation */

// ========== MENU ==========
const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('navOverlay');

if (hamburger && navOverlay) {
  const mainContent = document.querySelector('main');
  const footer = document.querySelector('footer');

  function openMenu() {
    hamburger.classList.add('is-active');
    navOverlay.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Focus trap: make main/footer inert
    if (mainContent) mainContent.setAttribute('inert', '');
    if (footer) footer.setAttribute('inert', '');
  }

  function closeMenu() {
    hamburger.classList.remove('is-active');
    navOverlay.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Remove focus trap
    if (mainContent) mainContent.removeAttribute('inert');
    if (footer) footer.removeAttribute('inert');
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    if (navOverlay.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) {
      closeMenu();
    }
  });
}
