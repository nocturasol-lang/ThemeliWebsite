const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* ── CLI flags ─────────────────────────────────────────────── */
const PROD  = process.argv.includes('--prod');
const WATCH = process.argv.includes('--watch');

/* ── Paths ──────────────────────────────────────────────────── */
const SRC  = path.join(__dirname, 'src');
const PUB  = path.join(__dirname, 'public');
const DIST = path.join(__dirname, 'dist');

/* ── Navigation items per language ────────────────────────────── */
const NAV_ITEMS = {
  en: [
    { file: 'index.html', label: 'Home' },
    { file: 'timeline.html', label: 'Timeline' },
    { file: 'subsidiaries.html', label: 'Subsidiaries' },
    { file: 'projects.html', label: 'Projects' },
    { file: 'about.html', label: 'About' },
    { file: 'contact.html', label: 'Contact' },
  ],
  el: [
    { file: 'index.html', label: 'Αρχική' },
    { file: 'timeline.html', label: 'Χρονολόγιο' },
    { file: 'subsidiaries.html', label: 'Θυγατρικές' },
    { file: 'projects.html', label: 'Έργα' },
    { file: 'about.html', label: 'Σχετικά' },
    { file: 'contact.html', label: 'Επικοινωνία' },
  ],
};

const LANGUAGES = ['en', 'el'];
const PAGES = [
  'index.html', 'timeline.html', 'subsidiaries.html',
  'projects.html', 'project.html', 'about.html', 'contact.html',
];

/* ── Helpers ──────────────────────────────────────────────────── */

const COPY_EXCLUDE = ['src-images'];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (COPY_EXCLUDE.includes(path.basename(src))) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function parseFrontmatter(raw) {
  // Normalize to LF for consistent parsing
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^<!--\n([\s\S]*?)\n-->\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Missing frontmatter block');
  }
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = val;
  });
  return { meta, content: match[2] };
}

function buildNav(lang, activeFile) {
  const items = NAV_ITEMS[lang];
  const lis = items.map(item => {
    const cls = item.file === activeFile ? ' class="active"' : '';
    return `      <li><a href="${item.file}"${cls}>${item.label}</a></li>`;
  }).join('\n');
  return `  <nav class="nav-overlay" id="navOverlay">\n    <ul>\n${lis}\n    </ul>\n  </nav>`;
}

function buildMainAttrs(meta) {
  let attrs = '';
  if (meta.mainClass) attrs += ` class="${meta.mainClass}"`;
  if (meta.mainId) attrs += ` id="${meta.mainId}"`;
  return attrs;
}

function buildExtraScripts(meta) {
  if (!meta.scripts) return '';
  return meta.scripts
    .split(',')
    .map(s => `  <script src="${s.trim()}"></script>\n`)
    .join('');
}

function shortHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

/* ── Concatenate files from a directory ────────────────────── */

function concatDir(dir, ext) {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .sort();
  return files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
}

/* ── Minification (optional, production only) ──────────────── */

function minifyCSS(css) {
  try {
    const csso = require('csso');
    return csso.minify(css).css;
  } catch {
    console.warn('  csso not found, skipping CSS minification');
    return css;
  }
}

function minifyJS(js) {
  try {
    const { minify } = require('terser');
    // terser.minify is async but we run it synchronously via execSync workaround
    // Instead, use terser's sync-compatible approach
    let result;
    minify(js, { compress: { passes: 1 }, mangle: false }).then(r => { result = r; });
    // Since we can't easily do async in this build script, write unminified for now
    // and use terser CLI in npm script instead
    return js;
  } catch {
    console.warn('  terser not found, skipping JS minification');
    return js;
  }
}

/* ── Build function ────────────────────────────────────────── */

function build() {
  const start = Date.now();

  /* ── Clean dist ─────────────────────────────────────────── */
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  /* ── Copy static files from public/ → dist/ ─────────────── */
  copyRecursive(PUB, DIST);

  /* ── Concatenate CSS from src/css/ ──────────────────────── */
  let css = concatDir(path.join(SRC, 'css'), '.css');
  if (PROD) css = minifyCSS(css);

  const cssFilename = PROD ? `styles.${shortHash(css)}.css` : 'styles.css';
  fs.writeFileSync(path.join(DIST, cssFilename), css);

  /* ── Concatenate JS from src/js/ ────────────────────────── */
  let js = concatDir(path.join(SRC, 'js'), '.js');
  // In production, minify with terser CLI post-build (async API not suitable here)

  const jsFilename = PROD ? `script.${shortHash(js)}.css` : 'script.js';
  // Fix: JS files should have .js extension
  const jsFilenameFixed = PROD ? `script.${shortHash(js)}.js` : 'script.js';
  fs.writeFileSync(path.join(DIST, jsFilenameFixed), js);

  /* ── Copy data files → dist/ ────────────────────────────── */
  for (const file of ['projects-data.js', 'supabase-config.js']) {
    const srcFile = path.join(SRC, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(DIST, file));
    }
  }

  /* ── Generate subsidiaries data → dist/ ─────────────────── */
  const subsDataDir = path.join(SRC, 'data');
  const subsEn = path.join(subsDataDir, 'subsidiaries-en.json');
  const subsEl = path.join(subsDataDir, 'subsidiaries-el.json');
  if (fs.existsSync(subsEn) && fs.existsSync(subsEl)) {
    const enData = fs.readFileSync(subsEn, 'utf8');
    const elData = fs.readFileSync(subsEl, 'utf8');
    const subsJS = `/* Generated from src/data/subsidiaries-*.json */\nwindow.SUBS_DATA = {\n  en: ${enData},\n  el: ${elData}\n};\n`;
    fs.writeFileSync(path.join(DIST, 'subsidiaries-data.js'), subsJS);
  }

  /* ── Load layout & i18n strings ─────────────────────────── */
  const layout = fs.readFileSync(path.join(SRC, 'layouts', 'base.html'), 'utf8');
  const strings = JSON.parse(
    fs.readFileSync(path.join(SRC, 'i18n', 'strings.json'), 'utf8')
  );

  /* ── Build pages ─────────────────────────────────────────── */
  let count = 0;

  for (const lang of LANGUAGES) {
    const s = strings[lang];

    for (const pageName of PAGES) {
      const pagePath = path.join(SRC, 'pages', lang, pageName);
      if (!fs.existsSync(pagePath)) {
        console.warn(`  skip: src/pages/${lang}/${pageName} (not found)`);
        continue;
      }

      const raw = fs.readFileSync(pagePath, 'utf8');
      const { meta, content } = parseFrontmatter(raw);
      const nav = buildNav(lang, pageName);
      const mainAttrs = buildMainAttrs(meta);
      const scripts = buildExtraScripts(meta);

      let html = layout
        .replace('{{lang}}', s.lang)
        .replace(/\{\{langCode\}\}/g, s.langCode || s.lang)
        .replace('{{ogLocale}}', s.ogLocale || 'en_US')
        .replace('{{langSwitch}}', s.langSwitch)
        .replace('{{footerAddressLabel}}', s.footerAddressLabel)
        .replace('{{footerAddressBody}}', s.footerAddressBody)
        .replace('{{footerInfoLabel}}', s.footerInfoLabel)
        .replace('{{footerSendEmail}}', s.footerSendEmail)
        .replace('{{footerCopyAddress}}', s.footerCopyAddress)
        .replace('{{footerCall}}', s.footerCall)
        .replace('{{footerCopyNumber}}', s.footerCopyNumber)
        .replace('{{footerSocialsLabel}}', s.footerSocialsLabel)
        .replace('{{footerCopyright}}', s.footerCopyright)
        .replace('{{title}}', meta.title || '')
        .replace('{{description}}', meta.description || '')
        .replace(/\{\{pageName\}\}/g, pageName)
        .replace('{{nav}}', nav)
        .replace('{{mainAttrs}}', mainAttrs)
        .replace('{{content}}', content.replace(/\n$/, ''))
        .replace('{{scripts}}', scripts);

      // Replace asset filenames with hashed versions in production
      if (PROD) {
        html = html.replace('../styles.css', `../${cssFilename}`);
        html = html.replace('../script.js', `../${jsFilenameFixed}`);
      }

      const outDir = path.join(DIST, lang);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, pageName), html);
      count++;
    }
  }

  /* ── Root redirect pages ─────────────────────────────────── */
  const REDIRECT_PAGES = ['index', 'about', 'contact', 'project', 'projects', 'subsidiaries', 'timeline'];

  for (const page of REDIRECT_PAGES) {
    const target = `en/${page}.html`;
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${target}"><script>window.location.replace('${target}'+window.location.search)</script></head></html>\n`;
    fs.writeFileSync(path.join(DIST, `${page}.html`), html);
    count++;
  }

  const elapsed = Date.now() - start;
  console.log(`Build complete: ${count} files written (${elapsed}ms)${PROD ? ' [production]' : ''}`);
}

/* ── Run ───────────────────────────────────────────────────── */

build();

/* ── Watch mode ────────────────────────────────────────────── */

if (WATCH) {
  try {
    const chokidar = require('chokidar');
    let debounceTimer;

    const watcher = chokidar.watch([
      path.join(SRC, '**/*'),
      path.join(PUB, '**/*'),
    ], {
      ignoreInitial: true,
      ignored: /node_modules/,
    });

    watcher.on('all', (event, filePath) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const rel = path.relative(__dirname, filePath);
        console.log(`\n  ${event}: ${rel}`);
        try {
          build();
        } catch (err) {
          console.error('  Build error:', err.message);
        }
      }, 100);
    });

    console.log('Watching src/ and public/ for changes... (Ctrl+C to stop)');
  } catch {
    console.error('chokidar not found. Install with: npm i -D chokidar');
    process.exit(1);
  }
}
