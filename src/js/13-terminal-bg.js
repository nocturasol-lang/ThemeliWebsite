/* THEMELI — Home portal (time-based particle logo)
   Progress runs from 0 → 1 over ANIM_DURATION ms once particles spawn:

     progress 0.00 – 0.55  formation: each particle lerps from a random
                           scattered spawn point to its logo target
     progress 0.40 – 0.75  ambient layer: per-particle wobble + whole-
                           logo drift + subtle breathing scale ramp in
     progress 0.55 – 0.85  logo lifts upward to clear room for copy
     progress 0.62 – 0.94  headline + CTAs fade in
*/

(function initHomePortal() {
  const canvas = document.getElementById('terminal-bg');
  const stage = document.querySelector('.portal-stage');
  const contentInner = document.querySelector('.portal-content-inner');
  const hintEl = document.querySelector('.portal-hint');
  if (!canvas || !stage || !contentInner) return;

  const ctx = canvas.getContext('2d');

  const SVG_LOGO =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 94">' +
    '<path d="M139.831 0H0V18.7278H139.831V0Z" fill="#fff"/>' +
    '<path d="M104.012 93.668H139.831V74.7873H111.717L69.9588 32.7759L28.2832 74.7873H0V93.668H36.0783L70.0247 59.5446L104.012 93.668Z" fill="#fff"/>' +
    '</svg>';

  const STRIDE = 3;
  const SPRING_K = 0.018;
  const DAMPING = 0.84;
  const FLOW_STRENGTH = 0.35;
  const WOBBLE_AMP = 1.6;
  const DRIFT_X = 14;
  const DRIFT_Y = 8;
  const DRIFT_FREQ_X = 0.18;
  const DRIFT_FREQ_Y = 0.13;
  const BREATHE_AMT = 0.015;
  const BREATHE_FREQ = 0.22;
  const ANIM_DURATION = 4000;  // ms from spawn to fully-formed + copy in

  let W, H, dpr;
  let particles = [];
  let logoCx = 0, logoCy = 0;
  let startT = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    logoCx = W / 2;
    logoCy = H * 0.42;
  }
  resize();

  window.addEventListener('resize', function () {
    const prevCx = logoCx, prevCy = logoCy;
    resize();
    const ddx = logoCx - prevCx, ddy = logoCy - prevCy;
    for (let i = 0; i < particles.length; i++) {
      particles[i].tx += ddx;
      particles[i].ty += ddy;
    }
  });

  function flow(x, y, t) {
    return {
      x: Math.sin(x * 0.005 + t * 0.3) + Math.cos(y * 0.006 - t * 0.2),
      y: Math.cos(x * 0.004 - t * 0.25) + Math.sin(y * 0.005 + t * 0.3)
    };
  }

  function smoothstep(x) {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

  function getProgress() {
    if (!startT) return 0;
    return Math.max(0, Math.min(1, (performance.now() - startT) / ANIM_DURATION));
  }

  function spawn() {
    const targetW = Math.min(W * 0.82, H * 0.62);
    const targetH = targetW * (94 / 140);
    const offW = Math.ceil(targetW);
    const offH = Math.ceil(targetH);

    const off = document.createElement('canvas');
    off.width = offW;
    off.height = offH;
    const octx = off.getContext('2d');

    const img = new Image();
    img.onload = function () {
      octx.drawImage(img, 0, 0, offW, offH);
      const data = octx.getImageData(0, 0, offW, offH).data;

      const baseX = logoCx - offW / 2;
      const baseY = logoCy - offH / 2;
      particles = [];

      for (let y = 0; y < offH; y += STRIDE) {
        for (let x = 0; x < offW; x += STRIDE) {
          const idx = (y * offW + x) * 4;
          if (data[idx + 3] < 128) continue;

          const tx = baseX + x, ty = baseY + y;
          const ang = Math.random() * Math.PI * 2;
          const dist = Math.max(W, H) * (0.45 + Math.random() * 0.4);
          const spawnX = W / 2 + Math.cos(ang) * dist;
          const spawnY = H / 2 + Math.sin(ang) * dist;

          particles.push({
            tx: tx, ty: ty,
            spawnX: spawnX, spawnY: spawnY,
            x: spawnX, y: spawnY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            phase: Math.random() * Math.PI * 2,
            freq: 0.4 + Math.random() * 0.6,
            radius: 0.5 + Math.random() * 0.8,
            hue: Math.random() < 0.2
          });
        }
      }

      startT = performance.now();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(SVG_LOGO);
  }

  function draw() {
    ctx.fillStyle = 'rgba(64, 64, 65, 0.35)';
    ctx.fillRect(0, 0, W, H);

    if (!particles.length) {
      requestAnimationFrame(draw);
      return;
    }

    const t = (performance.now() - startT) / 1000;
    const p = getProgress();

    const formProg  = smoothstep(p / 0.55);
    const flowScale = Math.max(0, 1 - p / 0.4);
    const wobbleSc  = smoothstep((p - 0.40) / 0.35);
    const driftSc   = smoothstep((p - 0.45) / 0.3);
    const shiftSc   = smoothstep((p - 0.55) / 0.30);
    const contentSc = smoothstep((p - 0.62) / 0.32);
    const hintSc    = 1 - smoothstep((p - 0.10) / 0.20);

    const driftX   = Math.sin(t * DRIFT_FREQ_X) * DRIFT_X * driftSc;
    const driftY   = Math.cos(t * DRIFT_FREQ_Y) * DRIFT_Y * driftSc;
    const breathe  = 1 + Math.sin(t * BREATHE_FREQ) * BREATHE_AMT * driftSc;
    const LOGO_LIFT = H * 0.08;
    const liftY    = -LOGO_LIFT * shiftSc;

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const baseLogoX = logoCx + (pt.tx - logoCx) * breathe + driftX;
      const baseLogoY = logoCy + (pt.ty - logoCy) * breathe + driftY + liftY;

      let tgtX = pt.spawnX + (baseLogoX - pt.spawnX) * formProg;
      let tgtY = pt.spawnY + (baseLogoY - pt.spawnY) * formProg;

      if (wobbleSc > 0) {
        tgtX += Math.sin(t * pt.freq + pt.phase) * WOBBLE_AMP * pt.radius * wobbleSc;
        tgtY += Math.cos(t * pt.freq * 1.15 + pt.phase * 0.8) * WOBBLE_AMP * pt.radius * wobbleSc;
      }

      const dx = tgtX - pt.x;
      const dy = tgtY - pt.y;
      const dist2 = dx * dx + dy * dy;

      pt.vx += dx * SPRING_K;
      pt.vy += dy * SPRING_K;

      if (flowScale > 0 && dist2 > 400) {
        const f = flow(pt.x, pt.y, t);
        pt.vx += f.x * FLOW_STRENGTH * flowScale;
        pt.vy += f.y * FLOW_STRENGTH * flowScale;
      }

      pt.vx *= DAMPING;
      pt.vy *= DAMPING;
      pt.x += pt.vx;
      pt.y += pt.vy;

      const v = Math.min(Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy) / 5, 1);
      if (pt.hue) {
        ctx.fillStyle = 'rgba(255, 220, 180, ' + (0.6 + v * 0.4) + ')';
      } else {
        const g = Math.floor(115 + v * 60);
        const b = Math.floor(30 + v * 40);
        ctx.fillStyle = 'rgba(255, ' + g + ', ' + b + ', ' + (0.7 + v * 0.3) + ')';
      }
      ctx.fillRect(pt.x, pt.y, 2, 2);
    }

    if (hintEl) hintEl.style.opacity = hintSc.toFixed(3);
    contentInner.style.opacity = contentSc.toFixed(3);
    contentInner.style.setProperty('--portal-shift', (28 - 28 * contentSc).toFixed(1) + 'px');
    if (contentSc > 0.7) contentInner.classList.add('is-ready');
    else contentInner.classList.remove('is-ready');

    requestAnimationFrame(draw);
  }

  spawn();
  draw();
})();
