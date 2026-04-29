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
const SITE_URL = 'https://themeli.gr';

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
  '404.html',
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
    try { fs.copyFileSync(src, dest); } catch (_) { /* skip locked files */ }
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

function cleanHref(file) {
  if (file === 'index.html') return './';
  return file.replace(/\.html$/, '');
}

function buildNav(lang, activeFile) {
  const items = NAV_ITEMS[lang];
  const lis = items.map(item => {
    const cls = item.file === activeFile ? ' class="active"' : '';
    return `      <li><a href="${cleanHref(item.file)}"${cls}>${item.label}</a></li>`;
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
    const { execSync } = require('child_process');
    const tmpIn = path.join(__dirname, '.tmp-terser-in.js');
    fs.writeFileSync(tmpIn, js);
    const result = execSync(`npx terser "${tmpIn}" --compress passes=1 --mangle`, { encoding: 'utf8' });
    fs.unlinkSync(tmpIn);
    return result;
  } catch (e) {
    console.warn('  terser minification failed, using unminified JS:', e.message);
    return js;
  }
}

/* ── Build function ────────────────────────────────────────── */

function build() {
  const start = Date.now();

  /* ── Clean dist (preserving runtime data: SQLite + uploaded images) ── */
  // Anything inside dist/uploads or dist/api/data is written by the live PHP
  // backend and must survive a rebuild. dist/projects-data.js is rewritten
  // by /api/publish.php (admin "Δημοσίευση" action) and likewise must persist.
  const PRESERVE = ['uploads', path.join('api', 'data'), 'projects-data.js'];
  function isPreserved(rel) {
    return PRESERVE.some(p => rel === p || rel.startsWith(p + path.sep));
  }
  function cleanExcept(dir, baseRel = '') {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = baseRel ? path.join(baseRel, entry.name) : entry.name;
      const abs = path.join(dir, entry.name);
      if (isPreserved(rel)) continue;
      try {
        if (entry.isDirectory()) {
          cleanExcept(abs, rel);
          // Only remove the dir itself if it is now empty
          try { fs.rmdirSync(abs); } catch (_) { /* not empty (preserved child) */ }
        } else {
          fs.unlinkSync(abs);
        }
      } catch (_) { /* skip locked files */ }
    }
  }
  cleanExcept(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  /* ── Copy static files from public/ → dist/ ─────────────── */
  copyRecursive(PUB, DIST);

  /* ── Concatenate CSS from src/css/ ──────────────────────── */
  let css = concatDir(path.join(SRC, 'css'), '.css');
  if (PROD) css = minifyCSS(css);

  const cssFilename = PROD ? `styles.${shortHash(css)}.css` : 'styles.css';
  try { fs.writeFileSync(path.join(DIST, cssFilename), css); } catch (_) { console.warn('Warning: could not write ' + cssFilename); }

  /* ── Concatenate JS from src/js/ ────────────────────────── */
  let js = concatDir(path.join(SRC, 'js'), '.js');
  if (PROD) js = minifyJS(js);

  const jsFilename = PROD ? `script.${shortHash(js)}.js` : 'script.js';
  try { fs.writeFileSync(path.join(DIST, jsFilename), js); } catch (_) { console.warn('Warning: could not write ' + jsFilename); }

  /* ── Copy data files → dist/ ─────────────────────────────
   * src/projects-data.js is only used as a SEED for the database. Once the
   * PHP backend's publish.php has written dist/projects-data.js, leave it
   * alone — it's the live artifact reflecting current admin edits. */
  for (const file of ['projects-data.js']) {
    const srcFile = path.join(SRC, file);
    const destFile = path.join(DIST, file);
    if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
      try { fs.copyFileSync(srcFile, destFile); } catch (_) { console.warn('Warning: could not copy ' + file); }
    }
  }

  /* ── Emit i18n data bundle → dist/i18n-data.js ───────────── */
  {
    const stringsRaw = fs.readFileSync(path.join(SRC, 'i18n', 'strings.json'), 'utf8');
    const i18nJS = `/* Generated from src/i18n/strings.json — do not edit. */\nwindow.I18N_STRINGS = ${stringsRaw.trim()};\n`;
    fs.writeFileSync(path.join(DIST, 'i18n-data.js'), i18nJS);
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
        .replace('{{langSwitchHref}}', (() => {
          const otherLang = lang === 'en' ? 'el' : 'en';
          const slug = pageName === 'index.html' ? '' : pageName.replace(/\.html$/, '');
          return `../${otherLang}/${slug}`;
        })())
        .replace(/\{\{homeLink\}\}/g, './')
        .replace('{{footerAddressLabel}}', s.footerAddressLabel)
        .replace('{{footerAddressBody}}', s.footerAddressBody)
        .replace('{{footerInfoLabel}}', s.footerInfoLabel)
        .replace('{{footerSendEmail}}', s.footerSendEmail)
        .replace('{{footerCopyAddress}}', s.footerCopyAddress)
        .replace('{{footerCall}}', s.footerCall)
        .replace('{{footerCopyNumber}}', s.footerCopyNumber)
        .replace('{{footerSocialsLabel}}', s.footerSocialsLabel)
        .replace('{{footerCopyright}}', s.footerCopyright)
        .replace(/\{\{title\}\}/g, meta.title || '')
        .replace(/\{\{description\}\}/g, meta.description || '')
        .replace(/\{\{pageName\}\}/g, pageName === 'index.html' ? '' : pageName.replace(/\.html$/, ''))
        .replace('{{nav}}', nav)
        .replace('{{mainAttrs}}', mainAttrs)
        .replace('{{content}}', content.replace(/\n$/, ''))
        .replace('{{scripts}}', scripts);

      // Replace asset filenames with hashed versions in production
      if (PROD) {
        html = html.replace('../styles.css', `../${cssFilename}`);
        html = html.replace('../script.js', `../${jsFilename}`);
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
    const target = page === 'index' ? 'en/' : `en/${page}`;
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${target}"><script>window.location.replace('${target}'+window.location.search)</script></head></html>\n`;
    fs.writeFileSync(path.join(DIST, `${page}.html`), html);
    count++;
  }

  /* ── Root .htaccess for 301 redirects (Apache/Hostinger) ──── */
  const htaccessRules = [
    '# Custom error pages (default to English; localized via JS on the page)',
    'ErrorDocument 404 /en/404.html',
    'ErrorDocument 403 /en/404.html',
    '',
    'RewriteEngine On',
    '',
    '# Strip .html from extensionless friendly URLs (301) — only on the original request',
    '# (THE_REQUEST is not modified by internal rewrites, so this won\'t loop)',
    'RewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]',
    'RewriteRule ^ /%1 [R=301,L]',
    '',
    '# Language redirect: root pages → /en/ (301)',
    'RewriteRule ^index/?$ /en/ [R=301,L]',
    ...REDIRECT_PAGES.filter(p => p !== 'index').map(page =>
      `RewriteRule ^${page}/?$ /en/${page} [R=301,L]`
    ),
    '',
    '# Bare domain → /en/',
    'RewriteRule ^$ /en/ [R=301,L]',
    '',
    '# Serve file with .html extension when extensionless URL is requested',
    '# (skip if URL already ends in .html to avoid name.html.html… loop on missing pages)',
    'RewriteCond %{REQUEST_FILENAME} !-f',
    'RewriteCond %{REQUEST_FILENAME} !-d',
    'RewriteCond %{REQUEST_URI} !\\.html$',
    'RewriteRule ^(.+?)/?$ $1.html [L]',
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(DIST, '.htaccess'), htaccessRules);
  count++;

  /* ── Auto-generate sitemap.xml ─────────────────────────────── */
  const today = new Date().toISOString().split('T')[0];
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  sitemap += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const pageName of PAGES) {
    if (pageName === 'project.html') continue;
    const slug = pageName === 'index.html' ? '' : pageName.replace(/\.html$/, '');
    for (const lang of LANGUAGES) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${SITE_URL}/${lang}/${slug}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      const priority = pageName === 'index.html' ? '1.0' : '0.8';
      sitemap += `    <priority>${priority}</priority>\n`;
      for (const altLang of LANGUAGES) {
        sitemap += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${SITE_URL}/${altLang}/${slug}"/>\n`;
      }
      sitemap += '  </url>\n';
    }
  }

  // Add individual project URLs from projects-data.js
  const projectsDataPath = path.join(SRC, 'projects-data.js');
  if (fs.existsSync(projectsDataPath)) {
    const projRaw = fs.readFileSync(projectsDataPath, 'utf8');
    const idMatches = [...projRaw.matchAll(/id:\s*(\d+)/g)];
    for (const m of idMatches) {
      const id = m[1];
      for (const lang of LANGUAGES) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${SITE_URL}/${lang}/project?id=${id}</loc>\n`;
        sitemap += `    <lastmod>${today}</lastmod>\n`;
        sitemap += `    <priority>0.6</priority>\n`;
        for (const altLang of LANGUAGES) {
          sitemap += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${SITE_URL}/${altLang}/project?id=${id}"/>\n`;
        }
        sitemap += '  </url>\n';
      }
    }
  }

  sitemap += '</urlset>\n';
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  count++;

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
