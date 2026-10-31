/* THEMELI — "At a glance" 3D infographic (About page)
   Extruded pie charts drawn on canvas. The percentages and labels live in the
   HTML list, so the canvas is decoration for assistive tech (aria-hidden). */

(function () {
  const section = document.querySelector('.ig');
  if (!section) return;

  const TAU = Math.PI * 2;
  const ELEVATION = 0.72;      // camera height over the chart, radians
  const FACET = TAU / 72;      // curve resolution
  const INTRO_MS = 1700;
  const SLICE_MS = 900;
  const BG = [64, 64, 65];     // --gray-01: dimmed slices fade towards the page

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (c, d, k) => c.map((v, i) => v + (d[i] - v) * k);
  const css = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const reduced = () => THEMELI_REDUCED_MOTION.matches;

  function pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function createChart(fig) {
    const stage = fig.querySelector('.ig-stage');
    const canvas = stage.querySelector('canvas');
    const tip = stage.querySelector('.ig-tip');
    const ctx = canvas.getContext('2d');

    let angle = 0;
    const slices = [...fig.querySelectorAll('.ig-item')].map(li => {
      const value = +li.dataset.value;
      const span = value / 100 * TAU;
      li.style.setProperty('--ig-color', li.dataset.color);
      const s = {
        li, value, span, a0: angle, a1: angle + span, mid: angle + span / 2,
        r: +li.dataset.r, h: 16 + value * 0.9, rgb: hexRgb(li.dataset.color),
        pct: li.querySelector('.ig-pct'), label: li.querySelector('.ig-label').textContent,
        focus: 0, dim: 0,
      };
      angle += span;
      return s;
    });
    const maxR = Math.max(...slices.map(s => s.r));

    let width = 0, height = 0, scale = 1;
    let started = false, startTime = 0, delay = 0, intro = 0;
    let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0;
    let active = null, raf = 0, last = 0, hits = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = stage.clientWidth;
      height = stage.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = width / (maxR * 2.42);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      hits = [];
      if (!started) return;

      const view = yaw - (1 - easeOut(intro)) * 1.1;
      const elev = ELEVATION + pitch;
      const sinE = Math.sin(elev), cosE = Math.cos(elev);
      const cx = width / 2, cy = height * 0.53;
      const near = a => -Math.cos(a + view);

      const project = (x, y, z) => {
        const c = Math.cos(view), s = Math.sin(view);
        const rx = x * c + y * s, ry = y * c - x * s;
        const p = 1 - ry * cosE / (maxR * 9);
        return [cx + rx * scale * p, cy - (ry * sinE + z * cosE) * scale * p];
      };

      const facets = [];
      slices.forEach((s, i) => {
        const p = reduced() ? 1 : easeOut(clamp((intro * INTRO_MS - i * 70) / SLICE_MS, 0, 1));
        if (p <= 0) return;
        s.drawR = s.r * p;
        s.drawH = s.h * p;
        const n = Math.max(1, Math.ceil(s.span / FACET));
        for (let k = 0; k < n; k++) {
          const a = s.a0 + s.span * k / n, b = s.a0 + s.span * (k + 1) / n;
          facets.push({ s, a, b, first: k === 0, last: k === n - 1, depth: near((a + b) / 2) });
        }
      });
      facets.sort((f, g) => f.depth - g.depth);

      const fill = (pts, rgb) => {
        const color = css(rgb);
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;   // hides the hairline between facets
        ctx.lineWidth = 0.6;
        ctx.fill();
        ctx.stroke();
      };

      facets.forEach(f => {
        const s = f.s;
        const ox = Math.sin(s.mid) * s.focus * 16, oy = Math.cos(s.mid) * s.focus * 16;
        const base = s.focus * 12, top = base + s.drawH + s.focus * 10;
        const r = s.drawR;
        const at = (ang, rad, z) => project(ox + Math.sin(ang) * rad, oy + Math.cos(ang) * rad, z);
        const color = mix(s.rgb, BG, s.dim * 0.62);
        const shade = k => mix(color, [20, 12, 10], k);

        const wall = [at(f.a, r, base), at(f.b, r, base), at(f.b, r, top), at(f.a, r, top)];
        const face = [at(0, 0, top), at(f.a, r, top), at(f.b, r, top)];
        if (f.depth > -0.08) fill(wall, shade(0.42 - 0.26 * Math.max(0, f.depth)));
        if (f.first && near(s.a0 - Math.PI / 2) > 0) {
          fill([at(0, 0, base), at(s.a0, r, base), at(s.a0, r, top), at(0, 0, top)], shade(0.5));
        }
        if (f.last && near(s.a1 + Math.PI / 2) > 0) {
          fill([at(0, 0, base), at(s.a1, r, base), at(s.a1, r, top), at(0, 0, top)], shade(0.34));
        }
        fill(face, color);
        hits.push({ s, poly: [at(0, 0, base), ...wall, ...face] });
      });

      if (active && !tip.hidden) {
        const s = active, mr = s.r * (s.r > 120 ? 0.62 : 0.9);
        const [x, y] = project(Math.sin(s.mid) * (mr + 16), Math.cos(s.mid) * (mr + 16), s.h + 22);
        const w = tip.offsetWidth, h = tip.offsetHeight;
        const tx = clamp(x - w / 2, 0, Math.max(0, width - w));
        const ty = clamp(y - h - 10, 0, Math.max(0, height - h));
        tip.style.transform = `translate(${tx}px, ${ty}px)`;
      }
    }

    function tick(now) {
      raf = 0;
      const dt = Math.min(50, now - (last || now));
      last = now;
      let busy = false;

      if (started && intro < 1) {
        intro = clamp((now - startTime - delay) / INTRO_MS, 0, 1);
        const done = easeOut(intro);
        slices.forEach(s => { s.pct.textContent = Math.round(s.value * done) + '%'; });
        busy = true;
      }

      const k = 1 - Math.exp(-dt * 0.012);
      const approach = (cur, target) => {
        if (Math.abs(target - cur) < 0.001) return target;
        busy = true;
        return cur + (target - cur) * k;
      };
      yaw = approach(yaw, targetYaw);
      pitch = approach(pitch, targetPitch);
      slices.forEach(s => {
        s.focus = approach(s.focus, s === active ? 1 : 0);
        s.dim = approach(s.dim, active && s !== active ? 1 : 0);
      });

      draw();
      if (busy) schedule(); else last = 0;
    }

    function schedule() {
      if (!started) return;
      if (reduced()) {
        intro = 1;
        yaw = pitch = targetYaw = targetPitch = 0;
        slices.forEach(s => {
          s.focus = s === active ? 1 : 0;
          s.dim = active && s !== active ? 1 : 0;
        });
        draw();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function setActive(s) {
      if (s === active) return;
      if (active) active.li.classList.remove('is-active');
      active = s;
      fig.classList.toggle('has-active', !!s);
      tip.hidden = !s;
      if (s) {
        s.li.classList.add('is-active');
        tip.textContent = '';
        const big = document.createElement('strong');
        big.textContent = s.value + '%';
        tip.append(big, s.label);
      }
      schedule();
    }

    function sliceAt(e) {
      const box = canvas.getBoundingClientRect();
      const x = e.clientX - box.left, y = e.clientY - box.top;
      for (let i = hits.length - 1; i >= 0; i--) {
        if (pointInPoly(x, y, hits[i].poly)) return hits[i].s;
      }
      return null;
    }

    stage.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || intro < 1) return;
      const box = stage.getBoundingClientRect();
      targetYaw = ((e.clientX - box.left) / box.width - 0.5) * 0.5;
      targetPitch = ((e.clientY - box.top) / box.height - 0.5) * 0.14;
      setActive(sliceAt(e));
      schedule();
    });
    stage.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      targetYaw = targetPitch = 0;
      setActive(null);
      schedule();
    });
    // Touch has no hover: a tap highlights, a second tap clears.
    stage.addEventListener('click', e => {
      if (e.pointerType === 'mouse') return;
      const s = sliceAt(e);
      setActive(s === active ? null : s);
    });
    slices.forEach(s => {
      s.li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setActive(s); });
      s.li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setActive(null); });
      s.li.addEventListener('click', e => {
        if (e.pointerType !== 'mouse') setActive(s === active ? null : s);
      });
    });

    if (!reduced()) slices.forEach(s => { s.pct.textContent = '0%'; });
    new ResizeObserver(resize).observe(stage);

    return {
      el: stage,
      start(wait) {
        if (started) return;
        started = true;
        delay = wait;
        startTime = performance.now();
        schedule();
      },
    };
  }

  // Faint flowing contour lines, after the original infographic's background.
  function addWaves() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ig-waves');
    svg.setAttribute('viewBox', '0 0 1400 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 26; i++) {
      let d = '';
      for (let x = 0; x <= 1400; x += 40) {
        const y = 60 + i * 36
          + Math.sin(x / 230 + i * 0.12) * (46 + i * 2)
          + Math.sin(x / 90 + i * 0.3) * 9;
        d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
      }
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    }
    section.prepend(svg);
  }

  function countStaff() {
    const el = section.querySelector('.ig-staff-num');
    if (!el || reduced()) return;
    const end = +el.dataset.count;
    const t0 = performance.now();
    const step = now => {
      const t = clamp((now - t0) / 1500, 0, 1);
      el.textContent = Math.round(end * easeOut(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  addWaves();
  const charts = [...section.querySelectorAll('.ig-chart')].map(createChart);

  const observer = new IntersectionObserver(entries => {
    let wait = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      charts.find(c => c.el === entry.target).start(wait);
      wait += 180;
    });
  }, { threshold: 0.35 });
  charts.forEach(c => observer.observe(c.el));

  // The list counts up with its chart, so reaching it first (a jump or a fast
  // scroll past the chart) must start the chart too: it may never read 0%.
  const legendObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      legendObserver.unobserve(entry.target);
      charts.find(c => c.el.parentElement === entry.target.parentElement).start(0);
    });
  });
  section.querySelectorAll('.ig-legend').forEach(l => legendObserver.observe(l));

  const head = section.querySelector('.ig-head');
  const headObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    headObserver.disconnect();
    countStaff();
  }, { threshold: 0.5 });
  headObserver.observe(head);
})();
