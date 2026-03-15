/* THEMELI — Scroll reveal animations */

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
