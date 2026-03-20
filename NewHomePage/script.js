/* ============================================
   THEMELI S.A. - Homepage Scripts
   Faulty Terminal Background + Interactions
   ============================================ */

// ---- Faulty Terminal Background ----
(function initTerminalBackground() {
  const canvas = document.getElementById('terminal-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  const tintR = 255, tintG = 115, tintB = 30; // --accent #FF731E

  // ---- Logo block-fly assembly animation ----
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 94" fill="none">
    <path d="M139.831 0H0V18.7278H139.831V0Z" fill="white"/>
    <path d="M104.012 93.668H139.831V74.7873H111.717L69.9588 32.7759L28.2832 74.7873H0V93.668H36.0783L70.0247 59.5446L104.012 93.668Z" fill="white"/>
  </svg>`;
  const logoImg = new Image();
  let logoBlocks = null; // array of block objects
  const blockSize = 5;
  let logoGridW = 0, logoGridH = 0;
  const logoBuildDelay = 1500;
  const logoBuildDuration = 5000;
  let logoBuildStartTime = 0;

  logoImg.onload = () => {
    const offW = 280, offH = 188;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = offW;
    offCanvas.height = offH;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(logoImg, 0, 0, offW, offH);
    const imgData = offCtx.getImageData(0, 0, offW, offH);

    logoGridW = Math.floor(offW / blockSize);
    logoGridH = Math.floor(offH / blockSize);
    logoBlocks = [];

    for (let row = 0; row < logoGridH; row++) {
      for (let col = 0; col < logoGridW; col++) {
        const px = Math.floor(col * blockSize + blockSize / 2);
        const py = Math.floor(row * blockSize + blockSize / 2);
        const idx = (py * offW + px) * 4;
        if (imgData.data[idx + 3] <= 128) continue;

        // Each block gets a random origin, delay, and travel duration
        const rowFromBottom = logoGridH - 1 - row;
        // Bottom blocks arrive first, top blocks last — with randomness
        const baseDelay = (rowFromBottom / logoGridH) * 0.3;
        const randomSpread = Math.random() * 0.35;
        const startTime = baseDelay + randomSpread; // 0..0.65 normalized

        // Random origin: scattered around edges and below
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 500;
        const originOffX = Math.cos(angle) * dist;
        const originOffY = Math.sin(angle) * dist + 200; // bias downward

        logoBlocks.push({
          row, col,
          startTime,          // normalized 0-0.65 (when this block starts moving)
          travelDuration: 0.2 + Math.random() * 0.15, // how long it takes to arrive
          originOffX,
          originOffY,
          rotation: (Math.random() - 0.5) * Math.PI * 2, // starting spin
        });
      }
    }

    logoBuildStartTime = performance.now() + logoBuildDelay;
  };
  logoImg.src = 'data:image/svg+xml;base64,' + btoa(logoSvg);

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(64, 64, 65, 1)'; // --gray-01
    ctx.fillRect(0, 0, width, height);

    // ---- Draw logo: blocks fly in + unified 3D extrusion ----
    if (logoBlocks && performance.now() > logoBuildStartTime) {
      const elapsed = performance.now() - logoBuildStartTime;
      const globalProgress = Math.min(elapsed / logoBuildDuration, 1);

      const logoDrawW = logoGridW * blockSize;
      const logoDrawH = logoGridH * blockSize;
      const scale = Math.min(width * 0.7 / logoDrawW, height * 0.65 / logoDrawH, 3.5);
      const offsetX = (width - logoDrawW * scale) / 2;
      const offsetY = (height - logoDrawH * scale) / 2;
      const bSize = blockSize * scale;
      const gap = scale * 0.8;
      const halfBlock = (bSize - gap * 2) / 2;

      // 3D extrusion settings (isometric direction: right and up)
      const extrudeDepth = 12;  // number of layers
      const exStepX = 1.2;     // px offset per layer (right)
      const exStepY = -1.0;    // px offset per layer (up)

      // Pre-compute each block's current state
      const blockStates = [];
      for (let i = 0; i < logoBlocks.length; i++) {
        const b = logoBlocks[i];
        if (globalProgress < b.startTime) {
          blockStates.push(null);
          continue;
        }

        const localRaw = Math.min((globalProgress - b.startTime) / b.travelDuration, 1);
        const t = 1 - Math.pow(1 - localRaw, 3);
        const landed = localRaw >= 1;

        const finalX = offsetX + b.col * bSize;
        const finalY = offsetY + b.row * bSize;
        const currentX = finalX + b.originOffX * (1 - t);
        const currentY = finalY + b.originOffY * (1 - t);
        const currentRot = b.rotation * (1 - t);
        const alpha = Math.min(t * 1.5, 1) * 0.35;

        blockStates.push({ currentX, currentY, currentRot, alpha, landed, t });
      }

      // Pass 1: Draw extrusion layers (back to front) for landed blocks
      for (let layer = extrudeDepth; layer >= 1; layer--) {
        const lx = layer * exStepX;
        const ly = layer * exStepY;
        // Darker for deeper layers
        const layerBrightness = 1 - (layer / extrudeDepth) * 0.7;
        const r = Math.floor(160 * layerBrightness);
        const g = Math.floor(65 * layerBrightness);
        const b2 = Math.floor(10 * layerBrightness);

        for (let i = 0; i < logoBlocks.length; i++) {
          const s = blockStates[i];
          if (!s || !s.landed) continue;

          const x = s.currentX + gap + halfBlock + lx;
          const y = s.currentY + gap + halfBlock + ly;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b2}, ${(s.alpha * 0.9).toFixed(3)})`;
          ctx.fillRect(x - halfBlock, y - halfBlock, halfBlock * 2, halfBlock * 2);
        }
      }

      // Pass 2: Draw front face for landed blocks (on top of extrusion)
      for (let i = 0; i < logoBlocks.length; i++) {
        const s = blockStates[i];
        if (!s || !s.landed) continue;

        const cx = s.currentX + gap + halfBlock;
        const cy = s.currentY + gap + halfBlock;

        // Front face highlight gradient: brighter at top-left
        const row = logoBlocks[i].row;
        const col = logoBlocks[i].col;
        const highlight = 1 + (1 - row / logoGridH) * 0.2 + (1 - col / logoGridW) * 0.1;
        const fr = Math.min(Math.floor(255 * highlight), 255);
        const fg = Math.min(Math.floor(115 * highlight), 170);
        const fb = Math.min(Math.floor(30 * highlight), 70);

        ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${s.alpha.toFixed(3)})`;
        ctx.fillRect(cx - halfBlock, cy - halfBlock, halfBlock * 2, halfBlock * 2);
      }

      // Pass 3: Draw in-flight blocks (still spinning, with per-block 3D)
      for (let i = 0; i < logoBlocks.length; i++) {
        const s = blockStates[i];
        if (!s || s.landed) continue;

        const depth = halfBlock * 0.5;

        ctx.save();
        ctx.translate(s.currentX + gap + halfBlock, s.currentY + gap + halfBlock);
        ctx.rotate(s.currentRot);

        // Right face
        ctx.fillStyle = `rgba(160, 70, 15, ${s.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(halfBlock, -halfBlock);
        ctx.lineTo(halfBlock + depth * 0.5, -halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock + depth * 0.5, halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock, halfBlock);
        ctx.closePath();
        ctx.fill();

        // Top face
        ctx.fillStyle = `rgba(255, 150, 60, ${(s.alpha * 0.8).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-halfBlock, -halfBlock);
        ctx.lineTo(-halfBlock + depth * 0.5, -halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock + depth * 0.5, -halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock, -halfBlock);
        ctx.closePath();
        ctx.fill();

        // Front face
        ctx.fillStyle = `rgba(255, 115, 30, ${s.alpha.toFixed(3)})`;
        ctx.fillRect(-halfBlock, -halfBlock, halfBlock * 2, halfBlock * 2);

        ctx.restore();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();


// ---- Scroll Reveal ----
function setupReveal() {
  const reveals = document.querySelectorAll(
    '.project-card, .timeline-item, .section-label, .section-heading, .body-lead, .stats-row'
  );

  reveals.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));

  // Timeline items
  document.querySelectorAll('.timeline-item').forEach(el => {
    observer.observe(el);
  });
}

setupReveal();

// ---- Counter Animation ----
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target);

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = target;
          }
        }

        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

animateCounters();

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
