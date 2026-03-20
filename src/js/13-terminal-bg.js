/* THEMELI — Canvas Terminal Background
   3D block-fly logo assembly animation (homepage only) */

(function initTerminalBackground() {
  const canvas = document.getElementById('terminal-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;

  /* ── Logo block-fly assembly ── */
  const logoSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 94" fill="none">' +
    '<path d="M139.831 0H0V18.7278H139.831V0Z" fill="white"/>' +
    '<path d="M104.012 93.668H139.831V74.7873H111.717L69.9588 32.7759L28.2832 74.7873H0V93.668H36.0783L70.0247 59.5446L104.012 93.668Z" fill="white"/>' +
    '</svg>';
  const logoImg = new Image();
  let logoBlocks = null;
  const blockSize = 5;
  let logoGridW = 0, logoGridH = 0;
  const logoBuildDelay = 1500;
  const logoBuildDuration = 5000;
  let logoBuildStartTime = 0;

  logoImg.onload = function () {
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

        var rowFromBottom = logoGridH - 1 - row;
        var baseDelay = (rowFromBottom / logoGridH) * 0.3;
        var randomSpread = Math.random() * 0.35;
        var startTime = baseDelay + randomSpread;

        var angle = Math.random() * Math.PI * 2;
        var dist = 300 + Math.random() * 500;
        var originOffX = Math.cos(angle) * dist;
        var originOffY = Math.sin(angle) * dist + 200;

        logoBlocks.push({
          row: row, col: col,
          startTime: startTime,
          travelDuration: 0.2 + Math.random() * 0.15,
          originOffX: originOffX,
          originOffY: originOffY,
          rotation: (Math.random() - 0.5) * Math.PI * 2
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
    ctx.fillStyle = 'rgba(64, 64, 65, 1)';
    ctx.fillRect(0, 0, width, height);

    if (logoBlocks && performance.now() > logoBuildStartTime) {
      var elapsed = performance.now() - logoBuildStartTime;
      var globalProgress = Math.min(elapsed / logoBuildDuration, 1);

      var logoDrawW = logoGridW * blockSize;
      var logoDrawH = logoGridH * blockSize;
      var scale = Math.min(width * 0.7 / logoDrawW, height * 0.65 / logoDrawH, 3.5);
      var offsetX = (width - logoDrawW * scale) / 2;
      var offsetY = (height - logoDrawH * scale) / 2;
      var bSize = blockSize * scale;
      var gap = scale * 0.8;
      var halfBlock = (bSize - gap * 2) / 2;

      var extrudeDepth = 12;
      var exStepX = 1.2;
      var exStepY = -1.0;

      /* Pre-compute block states */
      var blockStates = [];
      for (var i = 0; i < logoBlocks.length; i++) {
        var b = logoBlocks[i];
        if (globalProgress < b.startTime) {
          blockStates.push(null);
          continue;
        }

        var localRaw = Math.min((globalProgress - b.startTime) / b.travelDuration, 1);
        var t = 1 - Math.pow(1 - localRaw, 3);
        var landed = localRaw >= 1;

        var finalX = offsetX + b.col * bSize;
        var finalY = offsetY + b.row * bSize;
        var currentX = finalX + b.originOffX * (1 - t);
        var currentY = finalY + b.originOffY * (1 - t);
        var currentRot = b.rotation * (1 - t);
        var alpha = Math.min(t * 1.5, 1) * 0.35;

        blockStates.push({
          currentX: currentX, currentY: currentY,
          currentRot: currentRot, alpha: alpha,
          landed: landed, t: t
        });
      }

      /* Pass 1: Extrusion layers for landed blocks */
      for (var layer = extrudeDepth; layer >= 1; layer--) {
        var lx = layer * exStepX;
        var ly = layer * exStepY;
        var layerBrightness = 1 - (layer / extrudeDepth) * 0.7;
        var r = Math.floor(160 * layerBrightness);
        var g = Math.floor(65 * layerBrightness);
        var b2 = Math.floor(10 * layerBrightness);

        for (var j = 0; j < logoBlocks.length; j++) {
          var s = blockStates[j];
          if (!s || !s.landed) continue;

          var x = s.currentX + gap + halfBlock + lx;
          var y = s.currentY + gap + halfBlock + ly;

          ctx.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b2 + ', ' + (s.alpha * 0.9).toFixed(3) + ')';
          ctx.fillRect(x - halfBlock, y - halfBlock, halfBlock * 2, halfBlock * 2);
        }
      }

      /* Pass 2: Front face for landed blocks */
      for (var k = 0; k < logoBlocks.length; k++) {
        var s2 = blockStates[k];
        if (!s2 || !s2.landed) continue;

        var cx = s2.currentX + gap + halfBlock;
        var cy = s2.currentY + gap + halfBlock;

        var rowN = logoBlocks[k].row;
        var colN = logoBlocks[k].col;
        var highlight = 1 + (1 - rowN / logoGridH) * 0.2 + (1 - colN / logoGridW) * 0.1;
        var fr = Math.min(Math.floor(255 * highlight), 255);
        var fg = Math.min(Math.floor(115 * highlight), 170);
        var fb = Math.min(Math.floor(30 * highlight), 70);

        ctx.fillStyle = 'rgba(' + fr + ', ' + fg + ', ' + fb + ', ' + s2.alpha.toFixed(3) + ')';
        ctx.fillRect(cx - halfBlock, cy - halfBlock, halfBlock * 2, halfBlock * 2);
      }

      /* Pass 3: In-flight blocks */
      for (var m = 0; m < logoBlocks.length; m++) {
        var s3 = blockStates[m];
        if (!s3 || s3.landed) continue;

        var depth = halfBlock * 0.5;

        ctx.save();
        ctx.translate(s3.currentX + gap + halfBlock, s3.currentY + gap + halfBlock);
        ctx.rotate(s3.currentRot);

        ctx.fillStyle = 'rgba(160, 70, 15, ' + s3.alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(halfBlock, -halfBlock);
        ctx.lineTo(halfBlock + depth * 0.5, -halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock + depth * 0.5, halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock, halfBlock);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 150, 60, ' + (s3.alpha * 0.8).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(-halfBlock, -halfBlock);
        ctx.lineTo(-halfBlock + depth * 0.5, -halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock + depth * 0.5, -halfBlock - depth * 0.4);
        ctx.lineTo(halfBlock, -halfBlock);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 115, 30, ' + s3.alpha.toFixed(3) + ')';
        ctx.fillRect(-halfBlock, -halfBlock, halfBlock * 2, halfBlock * 2);

        ctx.restore();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
