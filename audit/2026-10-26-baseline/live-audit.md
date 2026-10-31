# themeli.gr live-site baseline audit (2026-10-26)

Read-only runtime audit of https://themeli.gr. No source files edited, nothing deployed, no forms submitted, no admin login.

**Labels used below**
- **[M] Measured**: observed directly with DevTools MCP (Lighthouse, trace, evaluate_script, snapshot) or with curl against the live site.
- **[I] Inferred**: my reasoning from measured data. Not directly verified.

**Environment and caveats**
- Google Chrome is not installed on this machine, so the DevTools MCP had nothing to attach to on `127.0.0.1:9222`. I launched the locally installed **Brave Browser** (Chromium 155) headless, with `--remote-debugging-port=9222` and a throwaway profile in the session scratchpad. Nothing was downloaded.
- Brave Shields were on by default. On the contact page they blocked one Google Maps telemetry request (`gen_204`, `ERR_BLOCKED_BY_CLIENT`). That is a browser artifact, not a site bug.
- Lighthouse 13.5.0 ran through `lighthouse_audit`. In this MCP the tool **excludes the Performance category**, so there are no Lighthouse Performance scores. Performance was measured with performance traces instead (section 3).
- No CrUX field data exists for any page ("no data for this page in CrUX"). All Core Web Vitals here are lab values.

Artifacts (all under `audit/2026-10-26-baseline/`):
- `screenshots/`: 54 PNGs
- `lighthouse/<page>-<device>/report.{html,json}`: 10 reports
- `traces/en-home-mobile-throttled.json.gz`, `traces/en-projects-mobile-throttled.json.gz`
- `a11y-tree/`: accessibility snapshots (`en-projects.txt`, `en-timeline.txt`) and focus-state screenshots

---

## 1. Baseline screenshots [M]

Page list taken from https://themeli.gr/sitemap.xml (14 URLs: 7 page types × 2 languages). The project detail page used is `project?id=122` (Natural Gas Network, Florina, Phase B).

- **Naming:** `<lang>-<page>-<width>.png`
- **Widths:** 375 (mobile emulation, DPR 1), 768 (mobile/touch, DPR 1), 1440 (desktop, DPR 1)
- **Format:** all full-page captures
- **Pages:** home, timeline, subsidiaries, projects, projects-map (extra), project-detail, about, contact, 404
- **Count:** 9 page variants × 2 languages × 3 widths = **54 files**

How each capture was settled before screenshotting: wait 2.5–3.5 s, scroll the full page in 70%-viewport steps (to fire scroll-reveal observers), return to the top, then wait another 2–2.5 s.

Stability notes:
- **Home hero canvas:** the particle logo animates continuously at about 60 fps and never settles (see 4.4). Each capture is a single moment, so particle positions will differ between any two captures. Pixel diffs need a mask over the canvas region, or a run under `prefers-reduced-motion: reduce`. The intro choreography takes about 2.5 s before the headline appears, and the settle wait covers that.
- **Projects map:** the map view is hidden by default (grid view is the default), so the default projects screenshots contain no map. Separate `*-projects-map-*` captures were taken after clicking the "Map view" toggle. The map is a Leaflet GeoJSON layer (55 prefecture paths, 7 markers) with **no tile layer**, so there was no tile-loading instability. At 375 px the west of Greece is cropped at the left edge (see `en-projects-map-375.png`). That is current design, recorded as baseline.
- **Project card photos:** these are CSS background images of several MB each (see 3.2). They loaded in time on the unthrottled capture connection. On a slow connection the cards would show `placeholder.svg`.
- **404:** `en-404-*` was captured from a real unknown URL (`/en/does-not-exist`, HTTP 404). `el-404-*` was captured from `/el/404`, because an unknown `/el/...` URL returns the **English** 404 page (see SEO findings).
- **Timeline:** very tall pages (15,066 px at 375 wide, 12,660 px at 1440 wide). The sticky year-nav appears once at the top of the full-page capture.
- **Horizontal overflow:** none measured at any width (`scrollWidth == innerWidth` on every page).

---

## 2. Lighthouse scores [M]

Lighthouse 13.5.0 through DevTools MCP, navigation mode. Performance shows "n/a" because the MCP tool excludes it; see section 3.

| Page | Device | Perf | A11y | Best Practices | SEO | Agentic Browsing |
|---|---|---|---|---|---|---|
| EN home `/en/` | mobile | n/a | 98 | 100 | 100 | 100 |
| EN home `/en/` | desktop | n/a | 98 | 100 | 100 | 100 |
| EL home `/el/` | mobile | n/a | 98 | 100 | 100 | 100 |
| EL home `/el/` | desktop | n/a | 98 | 100 | 100 | 100 |
| EN projects | mobile | n/a | 94 | 100 | 100 | 100 |
| EN projects | desktop | n/a | 94 | 100 | 100 | 100 |
| EN project detail `?id=122` | mobile | n/a | 92 | 100 | 100 | 100 |
| EN project detail `?id=122` | desktop | n/a | 92 | 100 | 100 | 100 |
| EN contact | mobile | n/a | 95 | 100 | 100 | 100 |
| EN contact | desktop | n/a | 95 | 100 | 100 | 100 |

### Failing audits

- **`heading-order`** (all pages): the footer column titles are `<h4>` (Address / General Information / Socials) and follow `h1`/`h2` with no `h3`. On contact, the info-group `<h3>` (ADDRESS, PHONE…) also follows the `h1` directly.
- **`color-contrast`** (projects: 54 nodes; project detail: 15; contact: 16):

  | Element | Colors | Ratio | Size |
  |---|---|---|---|
  | `.proj-card-status` "IN PROGRESS" | #fff on #ff731e | 2.71:1 | 10 px |
  | `.cf-pill` (selected), `.cf-submit` button | #fff on #ff731e | 2.71:1 | — |
  | `.proj-card-year`, `.proj-card-tag` | #9a9a9a on #373738 | 4.22:1 | 10–13 px |
  | `#projCount`, `.pdet-meta-label`, `.pdet-info-label`, `.pdet-related-card-meta`, `.pdet-nav-dir`, `h2.pdet-related-title` | #9a9a9a on #404041 | 3.68:1 | — |
  | `#pdetTag`, contact `h3` labels | #ff731e on #404041 | 3.8:1 | 11 px |
  | contact `.cf-label`, `legend` | #a9a9aa on #404041 | 4.41:1 | — |
  | `.cf-optional` | #838384 on #404041 | 2.73:1 | — |

- **`skip-link`** (project detail only): "Skip to content" points to `#main-content`, but on `project` pages the `<main>` has `id="projectDetail"`, so the skip link has no target.

Best Practices, SEO and Agentic Browsing: no failures.

The SEO score of 100 is misleading, because Lighthouse does not validate JSON-LD syntax or project-page canonicals. See section 5.

---

## 3. Performance traces [M]

**Conditions:** mobile emulation (412×915, DPR 2.625), **Slow 4G**, **4× CPU throttling**, cold cache.

### 3.1 EN home (`/en/`)

Trace file: `traces/en-home-mobile-throttled.json.gz`

| Metric | Value |
|---|---|
| **LCP** | **5,604 ms** (poor, >4 s) |
| LCP element | `<h1 class="portal-headline">THEMELI</h1>`: text, no network resource |
| **CLS** | **0.00** |
| FCP | 2,604 ms |
| DOMContentLoaded | 3,086 ms |
| load | 3,684 ms |

**LCP breakdown** (debug-optimize-lcp method; there is no resource, so only 2 subparts):

| Subpart | Time | Share of LCP |
|---|---|---|
| TTFB | 49 ms | 0.9% |
| Resource load delay | n/a (text) | — |
| Resource load duration | n/a (text) | — |
| **Element render delay** | **5,555 ms** | **99.1%** |

**Diagnosis:**
- [M] All network work (CSS, JS, fonts) finishes by 3.68 s, yet the headline paints at 5.6 s.
- [M] The same page unthrottled on desktop still has LCP at 2,560 ms.
- [M] Under `prefers-reduced-motion: reduce`, LCP is **92 ms**.
- [I] Therefore at least about 2 s of the render delay is the intro choreography: the canvas particle animation runs first, and the headline is revealed when `.portal-content-inner` gets `is-ready`. Network and CSS account for the rest.
- [I] Fixing it means changing when the headline appears. That is an animation-timing change, so **design-visible**.

Other insights:
- **RenderBlocking:**
  - `styles.a15bd1f0.css` (77 KB, uncompressed): 1.9 s on Slow 4G
  - `i18n-data.js`: 0.75 s; this is a sync script in `<head>`
- **NetworkDependencyTree:** critical chain is HTML → CSS → `CFModGrotesk-MedExtExp.woff2` / `BoldExtExpanded.woff2`, with max critical-path latency **3,682 ms**. The bold headline font is discovered only after the CSS arrives. The preload covers the *Regular* weight, not the Bold used by the LCP headline. No preconnects (none needed: everything is first-party).
- **Home downloads data it doesn't use** [M]: `projects-data.js` (133 KB) and `subsidiaries-data.js` (25 KB) load on the home page, and on every other page too (also seen on contact, about and timeline).
- **Cache:** every static asset is served with **no `Cache-Control`/`Expires`**, so the TTL is 0. That is 430 KB per repeat view on home. Hashed files (`styles.a15bd1f0.css`, `script.92c3530b.js`) could be cached for a year as immutable.
- **DocumentLatency / compression** [M via curl with `Accept-Encoding: br, gzip`]: **no gzip/brotli on any text asset**.

  | File | Size (uncompressed, as served) |
  |---|---|
  | HTML | 6.8 KB |
  | CSS | 77 KB |
  | `projects-data.js` | 133 KB |
  | `leaflet.js` | 148 KB |
  | `greece-prefectures.js` | 138 KB |
  | `script.js` | 36 KB |

- **ForcedReflow:** 43 ms, unattributed. Minor.
- **INP:** no interaction during the load trace. See 3.3.

### 3.2 EN projects (`/en/projects`)

Trace file: `traces/en-projects-mobile-throttled.json.gz`. The trace was stopped manually at about 65 s because the page **never reached `load` within 100 s** on Slow 4G; `performance_start_trace` with auto-stop timed out twice.

| Metric | Value |
|---|---|
| **LCP** | **5,775 ms** (poor) |
| LCP element | `div.proj-card-img` background `assets/placeholder.svg` |
| **CLS** | **0.00** |
| FCP | 3,676 ms |
| DOMContentLoaded | 5,209 ms |
| load | not reached after 65 s |

**LCP breakdown:**

| Subpart | Time | Share of LCP |
|---|---|---|
| TTFB | 190 ms | 3% |
| **Resource load delay** | **5,006 ms** | **87%** |
| Resource load duration | 572 ms | 10% |
| Element render delay | 7 ms | 0% |

**Diagnosis:**
- [M] The card image is a CSS `background-image` set by JS after the data scripts run. It is not discoverable in the HTML and has no `fetchpriority` (the LCPDiscovery insight failed the fetchpriority check).
- [M] The placeholder SVG was the LCP candidate only because the real photos had not arrived. One card photo finished at 33 s. [I] Once real photos render, a later and larger LCP candidate is likely, so real-world LCP on slow mobile is probably far worse than 5.8 s.

**Heavy resources** [M, unthrottled cold load, 412 px mobile]:
- **Total transfer: 31.4 MB.** CSS-initiated background images alone are 30.0 MB, for the 20 visible cards.
- Card thumbnails are **original camera files** served at about 170 px wide:

  | File | Size |
  |---|---|
  | `uploads/projects/112/DSC057510_8b764bd5.png` | **7.4 MB** |
  | `82/-_caf055c1.png` | 6.0 MB |
  | `103/IMG_3600…jpg` | 3.7 MB |
  | `113/DJI_0739…jpg` | 2.9 MB |
  | `109/…jpg` | 2.6 MB |
  | `116/…webp` | 2.5 MB |
  | `120/…jpg` | 1.9 MB |
  | `115/…jpg` | 1.7 MB |
  | `118/…jpg` | 1.3 MB |

- Scripts on projects: `leaflet.js` 144 KB, `greece-prefectures.js` 135 KB, `projects-data.js` 131 KB, `script.js` 35 KB, `subsidiaries-data.js` 25 KB, `i18n-data.js` 7 KB, for **477 KB of JS, all uncompressed**. Leaflet and the GeoJSON load even though the map view is hidden by default.
- Fonts: 3 × about 49 KB woff2 (Regular, Medium, Bold), `font-display: swap`, no font-swap CLS measured.
- DOM: 1,560 elements. All 122 cards are rendered into the DOM, and 20 are visible per page.

**Project detail** (`?id=113`, spot check, unthrottled):
- 15.3 MB total
- Hero is a **2.9 MB** `background-image` with no text alternative
- Gallery `<img>`s are 4,000–5,472 px wide, displayed at 337 px, `loading="lazy"`, with no width/height attributes
- The console flagged "Lazy-loaded images should have explicit dimensions (count 7)" on about/timeline
- LCP 1.0 s unthrottled, CLS 0.000

### 3.3 INP-related [M]

Measured on projects, 4× CPU, with an Event Timing observer and real clicks:

| Interaction | Duration |
|---|---|
| Toggle filters | 24 ms |
| Map view | 32 ms |
| Grid view | 24 ms |
| **Pagination "2"** | **200 ms** (input delay 22 ms) |
| Hamburger | 16 ms |

[I] Pagination sits right at the 200 ms good/needs-improvement threshold. It re-renders the grid and starts new multi-MB background downloads. Everything else is fine. No CrUX INP data exists.

---

## 4. Runtime accessibility [M]

### 4.1 Keyboard: menu, language switch, timeline

- **Focus visibility is good everywhere tested:** a 2 px #ff731e outline on links and buttons, and a 3 px outline on hero CTAs.
- **Skip link** appears on focus at the top-left. It works on all pages except project detail (no `#main-content`).
- **No keyboard trap.** Escape closes the menu and returns focus to the hamburger.
- **Closed menu links are focusable and exposed to AT (high impact):**
  - `nav#navOverlay` is hidden only with `clip-path: circle(0px …)`. It has no `visibility:hidden`, `inert` or `aria-hidden`.
  - On every page the first Tab after the skip link lands on **6 invisible links** (HOME…CONTACT) before reaching the logo.
  - Evidence: `a11y-tree/focus-2.png` shows focus on the hidden "HOME" with nothing visible.
- **Open menu does not contain focus:**
  - Tab from the hamburger goes to "Back to top", then the skip link (behind the overlay), then the menu links, then the logo and language switch.
  - The overlay has no `role="dialog"`/`aria-modal`, and the hamburger has no `aria-controls`.
  - The hamburger does have a correct `aria-expanded` (false/true).
- **Language switch:** a plain link (EN↔EL) that keeps the current path and `?id=`. It is focusable and has a visible focus ring.
- **Timeline:** 8 year buttons (`.timeline-nav-year`) are Tab-reachable with a visible outline, and Enter scrolls to the section.
  - The active year is shown only through the `.is-active` class, with no `aria-current`.
  - Focus stays on the nav and is not moved to the section.
- **Projects toolbar state is not exposed:**
  - Grid/List/Map view buttons and filter pills have no `aria-pressed`.
  - "Toggle filters" has no `aria-expanded`.
  - The collapsed filter panel's ~20 buttons are present in the accessibility tree (`a11y-tree/en-projects.txt`).

### 4.2 Landmarks, headings, alt text

- **Landmarks** (all pages): one each of `header`(banner), `nav`, `main`, `footer`.
- **Headings:**
  - One `h1` per page, except project detail, which has **two `h1`s** ("Project" and the project title).
  - Footer `h4`s skip levels.
  - Timeline `h2`s concatenate words across `<br>` in `textContent` ("Establishmentand historical…"). The accessible names in the snapshot are fine; this is only a scraper/textContent issue.
- **Alt text:**
  - Logos have `alt="Themeli"`.
  - Equipment images on About have `alt=""`; they are decorative, which is acceptable.
  - Timeline photos have descriptive alt text.
  - Project card and hero photos are CSS backgrounds with no text alternative. The card's link text carries the title, which is acceptable for cards. The detail hero has nothing.
  - **EN project gallery alt text is Greek** (e.g. "Επέκταση Αεροδρομίου Χίου «Όμηρος» — 1" on `/en/project?id=113`).
- **Contact form:** all inputs are labelled (no orphaned inputs) and have correct `autocomplete` on name/email/tel. A honeypot field `website` has `autocomplete=off`. The Google Maps iframe is `loading=lazy` with a title.

### 4.3 Color contrast (from Lighthouse)

See the table in section 2. The failing pairs come from three palette choices:
- grey #9a9a9a on dark grey (3.68–4.22)
- white on orange #ff731e (2.71)
- orange text on #404041 (3.8)

Every fix changes a visible color, so all are **design-visible** and need options, not silent edits (per CLAUDE.md).

### 4.4 prefers-reduced-motion

Emulated with `emulate prefersReducedMotion=reduce`:
- [M] **The home intro is skipped:** the headline is visible immediately (LCP 92 ms vs 2,560 ms). `document.getAnimations()` was empty.
- [M] **The hero canvas still animates:** 121 `requestAnimationFrame` calls in 2 s, and canvas pixels change between samples. This was identical with no-preference: 120 rAF per 2 s, still running 8 s after load.
- [I] So reduced motion is only partly honoured. The ambient particle motion continues, and the rAF loop never idles (a CPU/battery cost on every device).

---

## 5. SEO / i18n [M]

### 5.1 hreflang, x-default, canonical (static HTML via curl, plus runtime via evaluate_script)

- **Static pages** (home, timeline, subsidiaries, projects, about, contact, 404):
  - Each has a self-referencing canonical plus `en`, `el` and `x-default` (→ EN) alternates.
  - Return tags are reciprocal and codes are valid ISO 639-1.
  - The sitemap's `xhtml:link` alternates match, but the **sitemap omits `x-default`**. That is a minor inconsistency.
- **Project detail pages:**
  - Static HTML: canonical = `https://themeli.gr/en/project` (no `?id`), `og:url` is the same, hreflang points to `/en/project` and `/el/project`, and the title is "THEMELI — Project". Non-JS crawlers see **all 122 projects as one duplicate generic page**.
  - At runtime, JS rewrites title, description, canonical and `og:url` to include `?id=122`, but **hreflang alternates stay `/en/project` and `/el/project`**. The self-reference does not match the canonical, so Google would ignore the hreflang set.
  - **Project URLs are not in the sitemap.**
  - `/en/project?id=99999` and `/en/project` (no id) return **HTTP 200** (soft 404).
- **404 handling:**
  - `/en/404` and `/el/404` are **listed in the sitemap**, return **200**, carry `robots: index, follow`, and have hreflang pairs.
  - Unknown URLs correctly return **404**, but `/el/does-not-exist` serves the **English** 404 (`lang="en"`).
  - The 404 response has canonical `https://themeli.gr/en/404` and `index, follow`.
- **Host duplicates:**
  - `www.themeli.gr` serves 200 (no redirect to the apex), though its canonical points to the apex.
  - `/en/index.html` 301-redirects to `/en/index`, which returns 200 (a duplicate of home).
  - `/` 301s to `/en/` (no language negotiation; acceptable with x-default = EN).
  - `http://` 301s to `https://`.

### 5.2 Titles and descriptions

All pages have a unique title and description per language. Lengths:
- Titles: 14–25 chars, which is short. Subpages are "THEMELI — <Page>".
- Descriptions: 35–148 chars.

Issues:
- **Greek brand spelling is inconsistent.**
  - "ΘΕΜΕΛΗ Α.Ε." appears in: EL home title and description, contact description, JSON-LD `alternateName`.
  - "ΘΕΜΕΛΙ Α.Ε." appears in: about, projects, subsidiaries, timeline and project descriptions.
  - EL subpage titles use Latin "THEMELI", while the EL home title uses "ΘΕΜΕΛΗ".
- Project detail static title and description are generic (fixed at runtime only).
- 404 pages are indexable (see above).
- `og:image` is the same 529 KB `wind-park-2000.jpg` on every page.
- `og:locale` is set, but there is no `og:locale:alternate`.

### 5.3 JSON-LD

- [M] **Invalid on every page.** Read with `evaluate_script` + `JSON.parse`: "Expected double-quoted property name … line 33". Confirmed with Python as "Illegal trailing comma before end of object: line 32".
- The single `ConstructionCompany` block ends `"contactPoint": {...},` followed by `}`, i.e. a **trailing comma**.
- Search engines will drop the whole block, so the Organization rich data is currently lost.
- No `sameAs` (LinkedIn/Facebook/Instagram exist in the footer).
- No `WebSite`/`BreadcrumbList`.

### 5.4 robots.txt and sitemap

- `robots.txt`: `Allow: /` plus a Sitemap line. It is consistent with the sitemap.
- The sitemap has 14 URLs with identical `lastmod` 2026-10-26 (the build date). It includes the 2 × 404 pages and excludes all 122 project pages.

### 5.5 Are the Greek pages Greek?

Yes, for the body content: every `/el/` page has `lang="el"` and Greek copy (e.g. 7,862 Greek characters vs 228 Latin on the EL timeline). Untranslated strings on EL pages:
- Visible: "Skip to content"
- `aria-label`s: "Toggle menu", "Back to top", "Toggle filters", "Grid view", "List view", "Map view"
- "main projects" on the EL timeline
- iframe title "THEMELI Location"
- `/el/` unknown-URL 404 served fully in English
- EN contact map embed is localised Greek (`1sel!2sgr` in the embed URL)
- EN project gallery alt text in Greek

"FINISHER", "gunite" and "land rovers" on the EL about page are probably intentional technical terms [I].

---

## 6. Console and network [M]

- **Console errors:** none on home, timeline, about, contact, projects or project detail.
- **Warnings:**
  - `CFModGrotesk-RegularExpanded.woff2 was preloaded … but not used within a few seconds` (about page)
  - Chrome Issue: "Lazy-loaded images should have explicit dimensions (count: 7)" (about/timeline)
- **Failed requests:** none from the site. The only failure was `maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true` with `ERR_BLOCKED_BY_CLIENT`, which is Brave Shields, not the site.
- **Third parties:** contact pulls about 50 Google Maps requests (JS, fonts, tiles, Places RPC) once the lazy iframe scrolls into view. No third parties on other pages.
- **Security headers present:** HSTS, X-Frame-Options, CSP (frame-ancestors/base-uri/object-src only), nosniff, Referrer-Policy, Permissions-Policy.

---

## 7. Top issues ranked by impact

Design risk means whether a fix would change anything visible: **none**, **minor**, or **visible**.

1. **[perf] Projects and project-detail ship original multi-MB photos as thumbnails.**
   - Page: `/en|el/projects`, `project?id=*`
   - Evidence [M]: 31.4 MB on projects (7.4 MB PNG card thumbnail); 15.3 MB on project 113 (2.9 MB hero, 5,472 px gallery images at 337 px). Slow 4G load never finishes within 100 s.
   - Design risk: **none** if resized/re-encoded to the displayed size (same crop and look).
2. **[perf] No gzip/brotli and no Cache-Control on any asset.**
   - Page: all
   - Evidence [M]: curl shows no `content-encoding` and no `cache-control`; Cache insight TTL 0 (430 KB repeat-view waste on home); about 600 KB of JS+CSS sent raw.
   - Design risk: **none** (server config).
3. **[perf] Home LCP 5.6 s on throttled mobile, 99% render delay.**
   - Page: `/en/`, `/el/`
   - Evidence [M]: H1 paints 1.9 s after all resources finish; 2.56 s even unthrottled desktop; 92 ms with reduced motion. [I] The intro choreography gates the headline.
   - Design risk: **visible** (headline timing/animation change). Lower-risk partial fixes: compression, preloading the Bold font, deferring `i18n-data.js`, not loading unused data scripts. Those are **none**.
4. **[seo] JSON-LD invalid on every page (trailing comma).**
   - Page: all
   - Evidence [M]: `JSON.parse` fails at line 33.
   - Design risk: **none**.
5. **[a11y] Closed nav overlay is keyboard-focusable and exposed to AT.**
   - Page: all
   - Evidence [M]: 6 invisible tab stops before the logo (`clip-path` only, no `inert`/`visibility`); open menu does not contain focus.
   - Design risk: **none** (add `inert`/`visibility:hidden` after the close transition).
6. **[seo] Project pages are invisible or duplicated for crawlers.**
   - Page: `project?id=*`
   - Evidence [M]: static canonical/og:url/title = generic `/en/project`; runtime hreflang lacks `?id`; not in sitemap; unknown ids return 200.
   - Design risk: **none**.
7. **[a11y] Text contrast failures (2.71–4.41:1).**
   - Page: projects, project detail, contact
   - Evidence [M]: Lighthouse, 85 nodes total; worst is white on #ff731e at 10–13 px (2.71) and `.cf-optional` (2.73).
   - Design risk: **visible**. Needs options, e.g. darker orange for the badge background, or a #b0b0b0-ish grey.
8. **[perf] Every page loads `projects-data.js` (133 KB) + `subsidiaries-data.js` (25 KB); projects also loads Leaflet + GeoJSON (280 KB) while the map is hidden.**
   - Page: all; projects
   - Evidence [M]: network lists on home, contact, about, timeline; projects LCP load delay 5.0 s (87%) waiting on scripts before JS sets card backgrounds.
   - Design risk: **none**.
9. **[seo] 404 handling.**
   - Page: `/en/404`, `/el/404`, unknown `/el/*`
   - Evidence [M]: 404 pages in sitemap, 200 + `index, follow`; unknown `/el/` URLs get the English 404; `www.` and `/en/index` serve 200 duplicates.
   - Design risk: **none**.
10. **[a11y] Broken or missing semantics on interactive state.**
    - Page: project detail, projects, timeline, all EL pages
    - Evidence [M]:
      - Project detail: skip link target missing (`main#projectDetail`) and two `h1`s
      - Projects: view/filter buttons lack `aria-pressed`; "Toggle filters" lacks `aria-expanded`
      - Timeline: year nav lacks `aria-current`
      - EL pages: aria-labels and skip link in English; EN gallery alt text in Greek
      - Footer `h4` heading-order failure on all pages
      - Hero canvas keeps animating under reduced motion
    - Design risk: **none** for ARIA, labels, ids and alt text; **minor** for the heading-level change, only if styles are tied to `h4`; **visible** for stopping the canvas under reduced motion (reduced-motion users only).

Also noted, lower impact:
- [bp] Footer says "© 2025".
- [perf] Pagination interaction 200 ms at 4× CPU.
- [seo] Greek brand spelled both ΘΕΜΕΛΗ and ΘΕΜΕΛΙ; sitemap lacks x-default; all `lastmod` are the build date.
- [visible, existing] At 375 px, project card years are clipped at the card edge ("202" in `en-projects-375.png`), and the projects map crops western Greece.
