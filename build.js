const fs = require('fs');
const path = require('path');

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

/* ── Build pages ─────────────────────────────────────────────── */

let count = 0;

for (const lang of LANGUAGES) {
  const layoutPath = path.join(__dirname, 'src', 'layouts', `base.${lang}.html`);
  const layout = fs.readFileSync(layoutPath, 'utf8');

  for (const pageName of PAGES) {
    const pagePath = path.join(__dirname, 'src', 'pages', lang, pageName);
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
      .replace('{{title}}', meta.title || '')
      .replace('{{description}}', meta.description || '')
      .replace(/\{\{pageName\}\}/g, pageName)
      .replace('{{nav}}', nav)
      .replace('{{mainAttrs}}', mainAttrs)
      .replace('{{content}}', content.replace(/\n$/, ''))
      .replace('{{scripts}}', scripts);

    const outDir = path.join(__dirname, lang);
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
  fs.writeFileSync(path.join(__dirname, `${page}.html`), html);
  count++;
}

console.log(`Build complete: ${count} files written.`);
