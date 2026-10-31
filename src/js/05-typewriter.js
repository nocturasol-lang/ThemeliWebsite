/* THEMELI — Typewriter effect */

// ========== TYPEWRITER EFFECT ==========
// The opener is typed out character by character. The original text is kept
// in a visually hidden copy so assistive tech reads whole words (the animated
// per-character copy is aria-hidden). Under prefers-reduced-motion the text is
// left untouched and shows at once.
document.querySelectorAll('.timeline-opener').forEach(el => {
  if (THEMELI_REDUCED_MOTION.matches) return;

  const origHTML = el.innerHTML;
  el.classList.add('typewriter');

  // Parse original HTML into a temp container
  const temp = document.createElement('div');
  temp.innerHTML = origHTML;

  const wrapChars = (text, into) => {
    text.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'tw-char';
      span.textContent = ch;
      into.appendChild(span);
    });
  };

  // Top-level text runs and elements get aria-hidden; nested content inherits it.
  const walkAndWrap = (node, topLevel) => {
    const frag = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        let into = frag;
        if (topLevel) {
          into = document.createElement('span');
          into.setAttribute('aria-hidden', 'true');
          frag.appendChild(into);
        }
        wrapChars(child.textContent, into);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = child.cloneNode(false);
        if (topLevel) clone.setAttribute('aria-hidden', 'true');
        clone.appendChild(walkAndWrap(child, false));
        frag.appendChild(clone);
      }
    });
    return frag;
  };

  const srCopy = document.createElement('span');
  srCopy.className = 'sr-only';
  srCopy.innerHTML = origHTML;

  el.innerHTML = '';
  el.appendChild(srCopy);
  el.appendChild(walkAndWrap(temp, true));

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
