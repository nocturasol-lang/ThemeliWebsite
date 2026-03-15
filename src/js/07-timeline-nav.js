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
