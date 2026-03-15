/**
 * Image Optimization Script
 *
 * Processes source images from public/assets/src-images/
 * and generates optimized WebP + JPG fallbacks in public/assets/images/
 *
 * Usage:
 *   npm run images          # Process all images
 *   npm run images:clean    # Delete output and reprocess
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'assets', 'src-images');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'images');

/* ── Processing rules by directory/file pattern ───────────── */

const RULES = {
  // Subsidiary galleries: 800 + 400 WebP, 800 JPG fallback
  'themos/':              { widths: [800, 400], quality: 80, jpgFallbackWidth: 800 },
  'thermis-xirovouni/':   { widths: [800, 400], quality: 80, jpgFallbackWidth: 800 },
  'thermis-perganti/':    { widths: [800, 400], quality: 80, jpgFallbackWidth: 800 },
  'tetrapolis/':          { widths: [800, 400], quality: 80, jpgFallbackWidth: 800 },

  // Timeline photos: 1200 + 600 WebP, 1200 JPG fallback
  'timeline/':            { widths: [1200, 600], quality: 80, jpgFallbackWidth: 1200 },

  // Wind park (full-width on about page): 2000 + 1000 WebP, 2000 JPG
  'wind-park':            { widths: [2000, 1000], quality: 80, jpgFallbackWidth: 2000 },

  // Equipment photo: 1600 WebP, 1600 JPG
  'equipment':            { widths: [1600], quality: 80, jpgFallbackWidth: 1600 },

  // Video poster: 1920 + 960 WebP, 1920 JPG
  'landing-poster':       { widths: [1920, 960], quality: 80, jpgFallbackWidth: 1920 },

  // Greece map: 900 WebP, 900 JPG (higher quality for line art)
  'greece-map':           { widths: [900], quality: 90, jpgFallbackWidth: 900 },
};

/* ── Helpers ──────────────────────────────────────────────── */

function getRule(relPath) {
  // Match by directory prefix or filename prefix
  for (const [pattern, rule] of Object.entries(RULES)) {
    if (relPath.startsWith(pattern) || relPath.startsWith(path.basename(relPath).replace(/\.[^.]+$/, '').split('-').slice(0, -1).join('-') === pattern.replace('/', ''))) {
      return rule;
    }
    // Simple prefix match for files
    const baseName = path.basename(relPath, path.extname(relPath));
    if (pattern.endsWith('/') && relPath.startsWith(pattern)) {
      return rule;
    }
    if (!pattern.endsWith('/') && baseName.startsWith(pattern)) {
      return rule;
    }
  }
  // Default: moderate optimization
  return { widths: [1200], quality: 80, jpgFallbackWidth: 1200 };
}

function stripExt(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

function collectImages(dir, base) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relPath = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectImages(fullPath, relPath));
    } else if (/\.(jpe?g|png)$/i.test(entry)) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  const clean = process.argv.includes('--clean');

  if (clean && fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    console.log('Cleaned output directory');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const images = collectImages(SRC_DIR);
  if (images.length === 0) {
    console.log('No images found in', SRC_DIR);
    return;
  }

  console.log(`Processing ${images.length} images...\n`);

  const manifest = {};
  let totalSrcSize = 0;
  let totalOutSize = 0;

  for (const { fullPath, relPath } of images) {
    const rule = getRule(relPath);
    const srcSize = fs.statSync(fullPath).size;
    totalSrcSize += srcSize;

    const dir = path.dirname(relPath);
    const baseName = stripExt(path.basename(relPath));
    const manifestKey = dir !== '.' ? `${dir}/${baseName}` : baseName;

    // Ensure output subdirectory exists
    const outSubDir = path.join(OUT_DIR, dir);
    fs.mkdirSync(outSubDir, { recursive: true });

    const metadata = await sharp(fullPath).metadata();
    const sizes = [];

    for (const targetWidth of rule.widths) {
      // Don't upscale: use original width if smaller
      const width = Math.min(targetWidth, metadata.width);
      const resized = sharp(fullPath).resize(width, null, { withoutEnlargement: true });

      // WebP output
      const webpName = `${baseName}-${targetWidth}.webp`;
      const webpPath = path.join(outSubDir, webpName);
      const webpInfo = await resized.clone().webp({ quality: rule.quality }).toFile(webpPath);
      totalOutSize += webpInfo.size;

      sizes.push({
        width: webpInfo.width,
        height: webpInfo.height,
        format: 'webp',
        file: dir !== '.' ? `${dir}/${webpName}` : webpName,
      });

      // JPG fallback (only for the designated fallback width)
      if (targetWidth === rule.jpgFallbackWidth) {
        const jpgName = `${baseName}-${targetWidth}.jpg`;
        const jpgPath = path.join(outSubDir, jpgName);
        const jpgInfo = await resized.clone().jpeg({ quality: rule.quality, mozjpeg: true }).toFile(jpgPath);
        totalOutSize += jpgInfo.size;

        sizes.push({
          width: jpgInfo.width,
          height: jpgInfo.height,
          format: 'jpg',
          file: dir !== '.' ? `${dir}/${jpgName}` : jpgName,
        });
      }
    }

    manifest[manifestKey] = {
      sizes,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    };

    const saving = ((1 - (sizes.reduce((sum, s) => {
      const f = path.join(OUT_DIR, s.file);
      return sum + (fs.existsSync(f) ? fs.statSync(f).size : 0);
    }, 0) / srcSize)) * 100).toFixed(0);

    console.log(`  ${relPath} (${(srcSize / 1024).toFixed(0)}KB) → ${sizes.length} variants (${saving}% smaller)`);
  }

  // Write manifest
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nDone!`);
  console.log(`  Source: ${(totalSrcSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Output: ${(totalOutSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Saving: ${((1 - totalOutSize / totalSrcSize) * 100).toFixed(0)}%`);
  console.log(`  Manifest: ${manifestPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
