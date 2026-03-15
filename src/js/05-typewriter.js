/* THEMELI — Typewriter effect */

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
        const speed = 14; // ms per batch
        const batchSize = 2; // reveal 2 chars per tick
        const tick = () => {
          if (i < chars.length) {
            for (let b = 0; b < batchSize && i < chars.length; b++, i++) {
              chars[i].classList.add('tw-visible');
            }
            requestAnimationFrame(() => setTimeout(tick, speed));
          }
        };
        tick();
      }
    });
  }, { threshold: 0.1 });

  twObserver.observe(el);
});
