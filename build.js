const fs = require('fs');
const path = require('path');

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

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
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

/* ── Clean dist ─────────────────────────────────────────────── */

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

/* ── Copy static files from public/ → dist/ ─────────────────── */

copyRecursive(PUB, DIST);

/* ── Copy source CSS/JS → dist/ ─────────────────────────────── */

for (const file of ['styles.css', 'script.js', 'projects-data.js', 'supabase-config.js']) {
  fs.copyFileSync(path.join(SRC, file), path.join(DIST, file));
}

/* ── Load layout & i18n strings ─────────────────────────────── */

const layout = fs.readFileSync(path.join(SRC, 'layouts', 'base.html'), 'utf8');
const strings = JSON.parse(
  fs.readFileSync(path.join(SRC, 'i18n', 'strings.json'), 'utf8')
);

/* ── Build pages ─────────────────────────────────────────────── */

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

    const outDir = path.join(DIST, lang);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, pageName), html);
    count++;
  }
}

/* ── Root redirect pages ─────────────────────────────────────── */

const REDIRECT_PAGES = ['index', 'about', 'contact', 'project', 'projects', 'subsidiaries', 'timeline'];

for (const page of REDIRECT_PAGES) {
  const target = `en/${page}.html`;
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${target}"><script>window.location.replace('${target}'+window.location.search)</script></head></html>\n`;
  fs.writeFileSync(path.join(DIST, `${page}.html`), html);
  count++;
}

console.log(`Build complete: ${count} files written.`);
