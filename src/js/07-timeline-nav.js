/* THEMELI — Timeline navigation */

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
        // Hand keyboard focus to the era so the next Tab continues from there;
        // the scroll below takes care of positioning.
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        window.scrollTo({ top, behavior: themeliScrollBehavior() });
      }
    });
  });

  // Track active era on scroll
  const eraIds = Array.from(navButtons).map(btn => btn.getAttribute('data-target'));
  const eraElements = eraIds.map(id => document.getElementById(id)).filter(Boolean);
  let activeIndex = -1;

  function updateActiveYear() {
    const scrollY = window.scrollY + 200;
    let index = 0;

    eraElements.forEach((el, i) => {
      if (el.offsetTop <= scrollY) {
        index = i;
      }
    });

    if (index === activeIndex) return;
    activeIndex = index;

    navButtons.forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });

    // Update progress bar
    if (progressBar && navButtons.length > 1) {
      const pct = (index / (navButtons.length - 1)) * 100;
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
