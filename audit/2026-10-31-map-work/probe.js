async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mapEl = document.getElementById('projLeafletMap');
  const r = mapEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  function stats(f) {
    const avg = f.reduce((a, b) => a + b, 0) / f.length;
    return { frames: f.length, avg: +avg.toFixed(1), worst: +Math.max(...f).toFixed(1), over34: f.filter(x => x > 34).length };
  }
  function startFrames() {
    const frames = []; let last = null; let run = true;
    function tick(t) { if (last != null) frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
    return () => { run = false; return stats(frames); };
  }
  function wheel(dy) { mapEl.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, deltaMode: 0, clientX: cx, clientY: cy, bubbles: true, cancelable: true })); }
  // --- zoom (wheel in, then out) ---
  let stop = startFrames();
  for (let i = 0; i < 8; i++) { wheel(-120); await sleep(120); }
  await sleep(300);
  for (let i = 0; i < 8; i++) { wheel(120); await sleep(120); }
  await sleep(500);
  const zoom = stop();
  // --- pan (drag) ---
  stop = startFrames();
  mapEl.dispatchEvent(new MouseEvent('mousedown', { clientX: cx, clientY: cy, button: 0, buttons: 1, bubbles: true }));
  for (let i = 1; i <= 30; i++) {
    mapEl.dispatchEvent(new MouseEvent('mousemove', { clientX: cx + i * 6, clientY: cy + i * 3, button: 0, buttons: 1, bubbles: true }));
    await sleep(16);
  }
  mapEl.dispatchEvent(new MouseEvent('mouseup', { clientX: cx + 180, clientY: cy + 90, button: 0, bubbles: true }));
  await sleep(500);
  const pan = stop();
  // --- pin click (window.__probeClickPin provided by caller) ---
  stop = startFrames();
  const t0 = performance.now();
  await window.__probeClickPin();
  const clickSync = +(performance.now() - t0).toFixed(1);
  await sleep(1500);
  const click = stop();
  const title = document.getElementById('projMapCardTitle').textContent;
  return { zoom, pan, click, clickSync, title };
}
