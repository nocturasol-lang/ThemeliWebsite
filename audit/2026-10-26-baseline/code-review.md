# THEMELI frontend source review (baseline, 2026-10-26)

Read-only review of `src/` (layout, EN/EL page templates, 19 CSS partials, 16 JS files), `build.js` and the `<script>` wiring. The admin (`public/manage-7fk3/`) and `public/api/` PHP were out of scope. No build, deploy, npx or pip was run. The live-site/Lighthouse pass is being done by another agent; this review is static, and anything that needs a browser is listed under "Needs runtime verification".

Methods applied: `reviewing-a11y` (code-review guide, severity Critical/Major/Minor) with `a11y-knowledge` judgment lines, `fixing-accessibility`, `fixing-motion-performance`, `review-animations` (review-only; choreography kept), `css-pro-tips` (mode = review), `seo-schema` (JSON-LD), `create-design-md` (DESIGN.md written alongside this file; its npx lint/export steps were skipped as instructed).

**Design-risk scale** used on every finding:
- **none**: invisible to everyone.
- **minor**: visible only to keyboard users (focus ring) or reduced-motion users.
- **visible**: changes the look for everyone. These are not fixes. Options are proposed instead and need sign-off (CLAUDE.md).

Contract: `audit/2026-10-26-baseline/DESIGN.md`.

---

## 1. Top 15 findings (ranked by impact)

| # | Where | Cat | Finding | Suggested fix | Design-risk |
|---|---|---|---|---|---|
| 1 | `src/layouts/base.html:132` | seo | JSON-LD has a trailing comma after `contactPoint` (`},` then `}`). The block is invalid JSON, so Google discards the whole Organization/ConstructionCompany entity on every page. | Remove the comma. While there, add `"sameAs"` only once real profile URLs exist (see #S2), and add `"@id": "https://themeli.gr/#org"`. | none |
| 2 | `src/css/05-menu.css:79-93`, nav built in `build.js:83-90` | a11y | The closed menu overlay is hidden only by `clip-path: circle(0%)`, so its 6 links stay in the tab order. The first Tab after the skip link lands on invisible links before the logo (2.4.3/2.4.7 Critical). | In `03-menu.js`, toggle `navOverlay.inert` (set on load and in `closeMenu`, removed in `openMenu`). Alternatively in CSS: closed `visibility:hidden; transition: clip-path .45s var(--ease-in-out), visibility 0s linear .45s`, open `visibility:visible; transition-delay:0s`. Also add `aria-controls="navOverlay"` to the hamburger, `aria-label` to the nav, and move focus to the first link on open. | none |
| 3 | `src/pages/*/subsidiaries.html:15-26` + `src/js/10-subsidiaries.js:127-132`; `10-subsidiaries.js:37-42,76-96`; `src/js/11-project-detail.js:79-86` | a11y | Click-only `div`/`img` controls: the subsidiary logos (the only way into subsidiary detail), the featured-project cards that open PhotoSwipe, and the project gallery images. None can be focused or activated by keyboard (2.1.1 Critical). | Render them as `<button type="button">` with a reset (`background:none;border:0;padding:0;font:inherit;color:inherit;display:block/flex;width:100%`) so the box is identical, or wrap the `img` in a button. Then, when the detail opens, move focus to `#subName` (`tabindex="-1"`) and return it to the logo on Back. PhotoSwipe already returns focus to a focusable trigger. | minor (focus ring) |
| 4 | `src/js/13-terminal-bg.js:12-213`, `src/css/07-hero.css:67-76` | a11y / motion | The home portal ignores `prefers-reduced-motion`. Users who ask for less motion get a 4 s particle flight and then perpetual drift, wobble and breathing. The H1, sub and CTAs stay at opacity 0 for about 2.5 s, and they never appear if the script fails, because `.portal-content-inner{opacity:0}` has no fallback. Keyboard users can also Tab to the CTAs while they are invisible (pointer-events gating does not affect focus). | When `matchMedia('(prefers-reduced-motion: reduce)')` matches: spawn the particles straight at their final logo targets with lift applied (`formProg=1`, `shiftSc=1`, no drift/wobble), draw one frame, set content opacity 1, `--portal-shift:0` and `is-ready`, and do not schedule rAF. Add a no-JS/failure fallback, for example a `<html class="js">` gate (`.js .portal-content-inner{opacity:0}`). Normal users see no change. | minor (reduced-motion only) |
| 5 | `src/js/13-terminal-bg.js:134-209` | perf / motion | The rAF loop never stops. Every frame it does a full-canvas fill, plus a `fillStyle` string build and a `fillRect` per particle (about 23k sampled pixels at stride 3 on a 1440×900 viewport, thousands of particles). After the 4 s timeline it keeps writing `style.opacity` and a CSS custom property on `.portal-content-inner` every frame, which forces a style recalculation of that subtree forever. It also keeps running when the canvas is scrolled out of view (into the footer). `resize` is not debounced and resets the canvas on every event. | (a) Pause and resume with an `IntersectionObserver` on `.portal-stage` (and `visibilitychange`). Keep `startT` arithmetic consistent by accumulating paused time. (b) Once `p>=1`, stop writing `opacity`, `--portal-shift` and the class, because the values are final. (c) Cache `fillStyle` per particle by quantising `v` to about 32 steps (sub-1/255 alpha difference) or batching by colour bucket. (d) Debounce resize with rAF. The loop, drift and wobble are kept. | none |
| 6 | `src/layouts/base.html:97-99` | perf | `subsidiaries-data.js` (~25 KB) and `projects-data.js` (~167 KB) are parser-blocking on every page: home, about, timeline, contact, 404. Only projects/project need PROJECTS and only subsidiaries needs SUBS_DATA. The existing JS already guards with `typeof` (`01-data-loader.js:5`, `02-i18n.js:45`). | Move both to the per-page `scripts:` frontmatter (projects, project → `../projects-data.js`; subsidiaries → `../subsidiaries-data.js`) and drop them from the layout. `projects-data.js` is rewritten by the admin's publish action under a stable name, so also send it with a short `Cache-Control` plus revalidation (`.htaccess`). | none |
| 7 | `src/pages/*/projects.html:6`, `src/css/09-leaflet.css` (whole file), `src/js/10-leaflet-map.js:3-8` | perf | Leaflet (147 KB) and `greece-prefectures.js` (137 KB) load synchronously before `script.js` on the projects page, even though the map view is hidden (`display:none`) by default. Together with #6 that is about 450 KB of JS to parse before the grid (rendered by JS) can appear. In addition, the Leaflet stylesheet (15 KB, identical to `public/assets/vendor/leaflet/leaflet.css`) is concatenated into the global `styles.css` that every page downloads. | Lazy-load on first map toggle, using the same pattern as `09a-photoswipe.js` (`ensureLeaflet()` → load CSS + 2 scripts → `initProjectsLeafletMap()`), and optionally prefetch on hover/focus of the Map button. Remove `09-leaflet.css` from `src/css/` and load the vendor CSS with the lazy loader. `window._resetMapZoom` must be a no-op until the map exists (already guarded). | none (map first opens ~100-300 ms later) |
| 8 | `src/css/11-projects.css:117-129`, `src/pages/*/projects.html:15-78`, `src/js/09-projects-ui.js:171-191` | a11y | The collapsed filter panel uses `max-height:0; opacity:0` only, so its 18 buttons stay focusable while invisible (Major). The toggle has no `aria-expanded`/`aria-controls`, and the filter and view buttons do not expose their on/off state. | Closed: `visibility:hidden` with `transition: max-height .5s var(--ease-out), opacity .4s, visibility 0s linear .5s`. Open: `visibility:visible; transition-delay:0s` (identical look). Set `aria-expanded` on `#projFilterToggle` in the toggle and outside-click handlers. Use `aria-pressed` on `.proj-filter-btn` and `.proj-view-btn`. Add Escape to close the panel. | none |
| 9 | `src/js/09-projects-ui.js:71,84-101` | a11y | Pagination: clicking a page button calls `renderPagination()`, which runs `innerHTML=''` and destroys the focused button. Keyboard focus falls to `<body>`, followed by a smooth scroll (Major, 2.4.3). | After re-render, focus the new button for the same page (`[aria-current="page"]`), or the grid container with `tabindex="-1"`. Also make `#projCount` a `role="status"` so the filtered count is announced. | minor |
| 10 | `src/layouts/base.html:47` + `build.js:92-97`; `src/pages/*/project.html:5,9,30`; `src/pages/*/subsidiaries.html:9,37` | a11y | `<main{{mainAttrs}} id="main-content">`. On the project page `mainId: projectDetail` emits a second `id` on `<main>`. The first wins, so the skip link `#main-content` is broken there. The project and subsidiary pages also have two `<h1>`: the fixed page-header title and the content title. | Put `mainId` on a wrapper or `data-` hook instead (11-project-detail.js only needs `getElementById('projectDetail')`; the `.pdet` class styling must be kept, for example `<main id="main-content"><div class="pdet" id="projectDetail">`, verified against screenshots), or keep `main#main-content` and select `pdetDetail` by class. For the double H1, render the page-header title as `<p class="page-header-title">` on those two pages and widen the selector to `.page-header h1, .page-header-title`. | none |
| 11 | `src/js/05-typewriter.js:4-60`, `src/css/09-timeline.css:37-52` | a11y / motion | The timeline opener is rewritten as one `<span>` per character. VoiceOver and TalkBack can read it letter by letter. It is `visibility:hidden` until scrolled into view, so it is skipped in a reading-order or rotor pass that runs before it reveals. There is no reduced-motion path: the JS tick loop still types for about 1-2 s, and the CSS reduced-motion rule only shortens transitions. | Keep the original text in a visually hidden span (`.sr-only`) and mark the animated copy `aria-hidden="true"`. Under reduced motion, skip wrapping entirely, or add `typing` and all `tw-visible` immediately. | minor (reduced-motion only) |
| 12 | `src/pages/*/projects.html:100`, `src/js/10-leaflet-map.js:99,106-164`, `src/css/11-projects.css:519,525,528` | a11y | The map preview card carries a static `aria-hidden="true"` that is never removed, so when it is open its title, description and CTA are hidden from AT while its close button and link remain focusable (ARIA misuse). Opening does not move focus, and Escape does not restore it. Markers are created with `keyboard:false`, and the map container and interactive paths have `outline:none`. The grid and list views offer the same projects, so the 2.1.1 alternative exists; the card itself still has to be correct. | In `openProject`/`closeProject`, toggle `card.inert` and `aria-hidden` together with `is-open`, focus `#projMapCardClose` on open (keyboard-initiated only), and return focus on close. Remove `outline:none` on `.proj-map-leaflet` and its `.leaflet-container`, or replace it with `:focus-visible` outline. Optionally let markers take focus (`keyboard:true`, `title`/`alt` = project name). Also translate the hint: the EN text says "click", and keyboard users get no equivalent. | minor |
| 13 | `src/pages/*/contact.html:57-106`, `src/js/12-contact.js:79-86,130-132,87-94` | a11y | Validation errors go to one shared box. The invalid field gets focus but no `aria-invalid` or `aria-describedby`, so a screen reader hears the field label and not why it failed (3.3.1/4.1.2 Major). `#cfError` has both `role="alert"` and `aria-live="polite"` (conflicting politeness). The success view is swapped in from `display:none`, so its `aria-live` is not reliably announced, and focus stays on the now-hidden submit button. `role="radiogroup"` on a `div` inside a `fieldset` is redundant. | On error: `field.setAttribute('aria-invalid','true')` plus `aria-describedby="cfError"`, cleared in `clearError`. Keep `role="alert"` and drop `aria-live`. On success, `tabindex="-1"` on `.cf-success-title` and focus it. Remove `role="radiogroup"`. Optionally add a visually-hidden "(required)" to Name, Email and Message labels; the `required` attribute already announces it. | none |
| 14 | `src/layouts/base.html:30,39,93`, `src/pages/el/projects.html:15,22,25,28`, `src/js/09-projects-ui.js:107,135`, `src/pages/el/contact.html:120` | a11y | The Greek pages expose English accessible names: "Skip to content", "Toggle menu", "Back to top", "Toggle filters", "Grid/List/Map view", "Previous/Next page", iframe title "THEMELI Location". The language switch is a bare "EL"/"EN" with no `lang`/`hreflang`, so it is read with the wrong pronunciation and is ambiguous. | Add these strings to `src/i18n/strings.json` and template them in `build.js`/T. On `.lang-switch` add `hreflang="el" lang="el" aria-label="Ελληνικά"` (and the reverse). | none |
| 15 | `src/js/06-scroll-utils.js:31`, `07-timeline-nav.js:17`, `09-projects-ui.js:100`, `10-subsidiaries.js:109`, `12-contact.js:92`; `10-leaflet-map.js:134-161` | a11y / motion | JS `scrollTo({behavior:'smooth'})` and `scrollIntoView({behavior:'smooth'})` bypass the CSS reduced-motion override (`scroll-behavior:auto !important` only affects CSS-initiated scrolling). Leaflet `flyTo`/`flyToBounds` animate regardless of preference. | One helper in `00-core.js`: `const REDUCED = matchMedia('(prefers-reduced-motion: reduce)')`, `scrollBehavior = () => REDUCED.matches ? 'auto' : 'smooth'`. For Leaflet, use `setView`/`fitBounds` with `{animate:false}` when reduced. | minor (reduced-motion only) |

---

## 2. Accessibility review (severity-ranked)

Knowledge base: `a11y-knowledge` index-by-component consulted for button, link, navigation/disclosure, dialog-like overlay (map card, menu), form controls/radio group, image, heading/landmark, live region. Judgment-line notes are inline where they matter.

### Good practices already present
- `<html lang="{{lang}}">` is set per language (`base.html:2`, `strings.json` `lang`).
- Skip link exists and becomes visible on focus (`99-utilities.css:4-32`), although it is broken on the project page (#10).
- The hamburger is a real `<button>` with `aria-expanded`. Opening the menu makes `main`/`footer` inert, Escape closes it, and focus returns to the hamburger (`03-menu.js`).
- Global `*:focus-visible { outline: 2px solid var(--accent) }` (`99-utilities.css:35-38`). Radio pills forward focus to the span (`13-contact.css:181-184`).
- The contact form uses `<label for>` on every field, a `fieldset/legend` for inquiry type, correct `autocomplete`, and a honeypot with `aria-hidden` + `tabindex=-1`.
- Timeline images carry meaningful, localized `alt`. Equipment icons have `alt=""` next to visible text. Images carry `width`/`height`.
- Pagination nav is labeled, and the active page uses `aria-current="page"`.

### Critical
- **C1 Menu links focusable while closed**: #2.
- **C2 Click-only divs/images (subsidiaries, featured cards, gallery)**: #3.

### Major
- **M1 Filter panel focusable while collapsed; missing state ARIA**: #8.
- **M2 Pagination focus loss**: #9.
- **M3 Skip link broken on project page; duplicate H1s**: #10.
- **M4 Map card `aria-hidden` misuse; no focus management**: #12.
- **M5 Contact error association**: #13.
- **M6 Subsidiary detail view focus**: after `showSubDetail` the clicked logo is `display:none` (`.subs-grid.is-hidden`), so focus is lost. Back calls `history.back()` and `showSubGrid` waits 400 ms, and focus is not restored. Fix with #3: focus `#subName` (tabindex −1) on open, and the originating logo button after `showSubGrid`. Risk: minor.
- **M7 Typewriter character spans / hidden text**: #11.
- **M8 Home CTAs focusable while invisible; content never appears without JS**: #4.
- **M9 Heading order**: footer column titles are `<h4>` on every page (`base.html:59,63,81`), directly under an H1 or H2. The contact info groups use `<h3>` (`contact.html:16,21,33,44`) before the page's first `<h2>` ("Write to us", line 55). The timeline era years (`.timeline-era-year`, a `div`) are visually the main section labels but are not headings. Fix: change the footer `<h4>` to `<h2>` (or `<p>` + footer `aria-label`), the contact info `<h3>` to `<h2>`, and optionally the era years to `<h3 class="timeline-era-year">`. Class-based CSS keeps the look, but check `.footer-col h4` and `.info-group h3` selectors (`06-footer.css:98`, `13-contact.css:34`) and update them to class or element-agnostic selectors. Risk: none.

### Minor
- **m1 English labels on Greek pages; lang switch naming**: #14.
- **m2 Footer and contact email/phone toggles** (`base.html:65,72`, `contact.html:23,35`, `12-contact.js:4-56`): `<a href="#">` acts as a disclosure button. There is no `aria-expanded`, no Escape, and the popup links are reachable only after toggling (they are `visibility:hidden` when closed, which is correct). Change to `<button type="button" class="email-trigger" aria-expanded="false" aria-controls=…>` with a font/colour reset (`.footer-col a` styles must be duplicated onto the class), toggle `aria-expanded`, and close on Escape. "Copied!" is not announced: add `aria-live="polite"` on the copy button, or a status span. Risk: none.
- **m3 Filter chips** (`09-projects-ui.js:269-271`): the accessible name is "× Buildings", read as "times Buildings". Use `<span class="proj-chip-x" aria-hidden="true">` + `aria-label="Remove filter: Buildings"` (localized). The "— Clear All" leading em dash is read aloud; wrap it in `aria-hidden`.
- **m4 Sort buttons** (`projects.html:86-89`, `09-projects-ui.js:316-360`): the sorted state is shown only by a CSS ▲/▼ pseudo-element. Add `aria-pressed`/`aria-describedby` or put the direction in the label ("Year, sorted descending").
- **m5 Subsidiary logos double-announce**: `alt="Themos"` plus the hover-only `.sub-name` "THEMOS" (`subsidiaries.html:15-26`). The hover label has no focus equivalent; add `.sub-logo:focus-visible .sub-name` to the hover rules when they become buttons (keyboard-only visibility). The detail logo `alt` duplicates the adjacent H1 (`10-subsidiaries.js:28`); use `alt=""`.
- **m6 Gallery alt uses the Greek name on EN pages** (`11-project-detail.js:83` uses `project.name`). Use `pName`. The Greek project names that fall back on EN pages (`name_en || name`) have no `lang="el"`. Low priority.
- **m7 `role="banner"` on `<header>`** is redundant (`base.html:34`). Also give `<nav class="nav-overlay">` an `aria-label` (#2).
- **m8 Timeline nav** (`07-timeline-nav.js`): set `aria-current="true"` (or `"step"`) on the active year. After a click, move focus to the era (`tabindex="-1"`, `preventScroll` handled by the existing scroll) so the next Tab continues from there.
- **m9 Hover-only interactions not gated** to `(hover:hover) and (pointer:fine)` (review-animations standard 8): lifts and scales on cards, the timeline dot `scale(1.3)` and the footer logo `scale(1.08)` can stick on touch after a tap. Gating is invisible on desktop, but on touch it removes a sticky-hover look that users see today, so it is classed as **visible** (minor) and offered as an option only.
- **m10 Inputs' focus indicator** is a 1px border-bottom colour change (`13-contact.css:221-225`, `outline:0`). It technically passes 2.4.7, but it is a weak indicator; `:focus-visible` adds the global outline back only if `outline:0` is scoped to `:focus:not(:focus-visible)`. That change would show an orange outline to keyboard users only: minor.

### Forms and errors on contact: summary
Labels are good. Missing: field-level `aria-invalid`/`aria-describedby`, conflicting live-region roles, success focus, and the `required` cue in visible text (only "optional" is marked, which is acceptable). See #13.

### Keyboard support by widget
| Widget | Status |
|---|---|
| Menu | Opens/closes, Esc works, focus returns. Fails: closed links tabbable (#2); no focus moved into menu on open. |
| Language switch | Plain link, keyboard OK; name/lang (#14). |
| Timeline nav | Native buttons, OK; no active state exposed, focus not moved (m8). |
| Gallery (PhotoSwipe) | Viewer itself is keyboard-capable; triggers are not focusable (#3). Load failure is silent (`09a-photoswipe.js:75-77`). |
| Map | Pins not keyboard reachable (alternative views exist); card ARIA/focus wrong (#12). |
| Filters / views / sort / pagination | Native buttons; state ARIA missing (#8, m4), focus loss (#9). |
| Subsidiaries | Not operable by keyboard (#3, M6). |
| Footer popups | Operable, wrong semantics (m2). |

### prefers-reduced-motion coverage (every JS animation)
| Animation | File | Covered? | Notes |
|---|---|---|---|
| Canvas hero / home portal | `13-terminal-bg.js` | **No** | Full 4 s flight + infinite drift; content gated behind it (#4). |
| "Terminal background" | same file (`#terminal-bg` is the portal canvas) | **No** | Same as above; there is no separate terminal animation. |
| Typewriter | `05-typewriter.js` | **No** | JS tick loop independent of CSS (#11). |
| Counter | `14-counter.js` | **No**, but **dead code** | No `.stat-number[data-target]` exists in any template. Delete, or add a reduced-motion early exit if it is ever reused. |
| Scroll reveal | `04-scroll-reveal.js` + `03-animations.css` | **Yes** (CSS) | `99-utilities.css:153-157` forces `.reveal` visible. `.reveal-left/-right/-scale` and `.timeline-bar` observed in JS do not exist. |
| Timeline nav progress / smooth scroll | `07-timeline-nav.js` | Partial | Width transition collapsed by the CSS rule; `scrollTo smooth` not (#15). |
| Hero parallax | `06-scroll-utils.js:46-67` | **No**, but **dead code** | No `.hero`/`.hero-est` in templates. |
| Page-header hide, back-to-top | `06-scroll-utils.js` | Yes (CSS transitions) | Back-to-top `scrollTo smooth` not covered (#15). |
| Project detail stagger, subsidiaries fade, grid fade, menu, popups | CSS | Yes | Collapsed to 0.01 ms by the global rule. |
| Leaflet fly animations | `10-leaflet-map.js` | **No** | #15. |
| Portal chevron | `07-hero.css:99-101` | Yes | Element not present in markup (dead). |

Note: the global rule turns all motion off rather than gentler (review-animations standard 8 prefers keeping opacity fades). That is today's shipped behavior, so it is left as-is.

---

## 3. Motion and performance

### Animations on non-composited properties
| Where | Property | Assessment |
|---|---|---|
| `09-timeline.css:113` `.timeline-nav-progress` | `width` 0.6s | Small 4px bar; acceptable. `transform: scaleX()` with `transform-origin:left` would squash the 2px rounded end caps during the transition, so it is not proposed (visible). |
| `11-projects.css:120` `.proj-filters` | `max-height` 0.5s | One-shot, moderate surface; acceptable. A `grid-template-rows: 0fr→1fr` swap would change the easing feel; not proposed. |
| `05-menu.css:88` `.nav-overlay` | `clip-path` 0.45s full-screen | Paint-heavy but one-shot and part of the signature; keep. |
| `10-subsidiaries.css:143`, `13-contact.css:75` | `width` on 1px pseudo-lines | Tiny, fine. |
| `08a-home-projects.css:28,81,116`, `99-utilities.css:53` | `transition: all` | `.btn` is live (home CTAs). Replace with `transform .3s var(--ease-out), filter .3s var(--ease-out), border-color .3s var(--ease-out), color .3s var(--ease-out)`: none. The 08a ones are dead CSS. |
| `11-projects.css:261` `.proj-row:hover` | `padding-left: 4px` (not transitioned) | Layout change on hover, instant. `translateX` would also move the row's background and border; not identical, so leave it. |
| filters `filter: grayscale()` on hover (cards, timeline, gallery) | paint | Small surfaces; fine. |

### Scroll handlers
`06-scroll-utils.js` registers up to three separate `scroll` listeners (page header, back-to-top, dead hero parallax), and `07-timeline-nav.js` a fourth. All are rAF-throttled (good). Only the first passes `{passive:true}`. `passive` is irrelevant for `scroll` events, which cannot be cancelled, so this is cosmetic. `updateActiveYear` reads `offsetTop` of 8 elements every frame and then writes classes and width. Reads come before writes within the frame, so this is not thrashing, but it is unnecessary: use an `IntersectionObserver` on the eras (rootMargin `-200px 0px -60% 0px`), or cache offsets on load/resize. Optional consolidation: one shared rAF scroll dispatcher. Risk: none.

### Canvas loops
`13-terminal-bg.js`: infinite, never paused offscreen, per-frame style writes after completion (#5). Browsers do throttle rAF in hidden tabs, so the hidden-tab cost is already low; the offscreen-but-visible-tab case (scrolled into the footer) is not handled.

### Data and vendor loading
- `projects-data.js` and `subsidiaries-data.js` on every page (#6).
- Leaflet + prefectures sync on projects, plus the Leaflet CSS in the global bundle (#7).
- PhotoSwipe is lazy-loaded correctly (`09a-photoswipe.js`). The ~70 KB is paid only on first open.
- All site JS is one bundle at the end of `<body>` without `defer`. Moving it to `<head>` with `defer` (in order: data → script) gives earlier discovery at the same execution order. Gain is small; optional.
- `build.js:136-147` minifies JS via `execSync('npx terser …')` and silently ships unminified JS if that fails (only a `console.warn`). Prefer `require('terser').minify` (already a devDependency) and fail the prod build on error.
- `src/projects-data.js` (seed) contains `http://127.0.0.1:8090/...` image URLs. `build.js:189-195` copies it to `dist/` when `dist/projects-data.js` is missing (fresh checkout or new server), which would ship localhost URLs. Guard by refusing to copy in `--prod`, or by rewriting the URLs.

### Images
- Project grid, list, related cards, map card and project hero all use CSS `background-image`. There is no `srcset`, no lazy-loading hints and no discoverability, so the project hero (LCP on detail pages) cannot be preloaded. Off-page cards are `display:none`, so their backgrounds are not fetched (good). Option (none): emit `<link rel="preload" as="image">` for the hero from JS early, or render the hero as `<img>` with `object-fit: cover` plus the same `filter` (pixel-identical if `object-position:center`); verify with screenshots.
- Timeline `<picture><source srcset="… 854w, … 427w">` has **no `sizes`** (`timeline.html:51,78,111,116,…`), so the browser assumes 100vw and usually picks the 1200 variant. Add e.g. `sizes="(max-width: 768px) calc(100vw - 80px), 500px"` per layout (04: 400px, 05: 500px, 07: 300px/1.4fr col, 09: 280px, wind park: 500px). Risk: none.
- `wind-park-2000` (2000w) is offered at a 500px display width. With `sizes` the 1000w variant is chosen.
- The project gallery `<img>` elements (`11-project-detail.js:80-86`) lack `width`/`height` and `decoding="async"`. CLS is already prevented by `aspect-ratio: 3/2`; add `decoding="async"`.
- `sub-featured-img` is lazy and aspect-ratio-sized, fine. Header and footer SVGs have dimensions.

### Fonts
- `@font-face` with `font-display: swap` for 400/500/700, woff2 first (good). Only Regular is preloaded (`base.html:26`, `crossorigin` present, URL resolves to the same `/assets/fonts/` path as the CSS: good).
- The home H1, menu links and many headings use 700, and page-header titles use 500. Consider preloading the 700 file on the home page only; measure first, because an extra preload competes with the hero.
- The fallback stacks differ (Georgia serif for display, Helvetica for body), so during swap the headings flash in a serif. A metric-matched fallback (`@font-face { font-family: 'CF Mod Grotesk Fallback'; src: local('Arial'); size-adjust: …; ascent-override: … }`) reduces CLS, but it changes the swap-period look: **visible** (only during load). Option only.
- Weights 300/600/800 are requested but not shipped (DESIGN.md). No fix: changing them would change rendering.

### LCP (home)
The home LCP candidate (the H1) is opacity 0 until about 2.5 s by design. This is choreography and is kept. The reduced-motion path (#4) makes it instant for those users.

---

## 4. CSS review (mode = review)

### Repeated literals that could become tokens with zero visual change
Add to `01-tokens.css` and substitute 1:1 (same computed values):
- Hairlines: `--line-06: rgba(255,255,255,.06)` (9×), `--line-08` (9×), `--line-10` (10×), `--line-12` (7×), `--line-15` (8×), `--line-25` (9×).
- Accent alphas: `--accent-08`, `--accent-30`, `--accent-40` (and so on, 9 distinct).
- Panel fills: `--panel-50: rgba(46,46,47,.5)`, `--panel-95: rgba(32,32,32,.95)`.
- Radii as they exist: `--radius-sharp: 2px` (9×), `--radius-pill: 20px` (5×), `--radius-card: 16px`, `--radius-card-round: 40px` (4×), `--radius-full: 999px` (4×).
- Micro-label recipe (11px / 500 / uppercase / 0.14em / `gray-04`), duplicated in about 8 rules: a shared `.u-micro-label` or custom properties.
- Header gutter: replace literal `82px` (`05-menu.css:14`, `06-footer.css:51`) only if equal to `--pad-x` at every width. It is not (`--pad-x` grows above 1764px), so keep the literal and name it `--chrome-x: 82px`.
- Easing `cubic-bezier(0.2, 0.8, 0.2, 1)` (2×, map card) as `--ease-sheet`.

### Dead CSS (zero-risk removal; selectors not referenced by any template, JS or data)
- `03-animations.css:33-64` (`.reveal-line`, `.reveal-up`, keyframes) and `99-utilities.css:154-155`.
- `04-layout.css:35-40` `.section-divider`.
- `07-hero.css:42-60,99-101` `.portal-hint`, `.portal-chev` (JS still references `.portal-hint`; element absent).
- `08-about.css:3-93` (home-section, section-label/heading, about-grid, body-lead/text, stats-row, stat-*) and `174-183` (`.about-equipment-section>img`).
- `08a-home-projects.css` (entire file) and `08b-home-timeline.css` (entire file).
- `09-timeline.css:248-280` (`.timeline-era-images`, `.timeline-era-caption`).
- `13-contact.css:10-17,403` `.contact-lead`; `13-contact.css:395-412` partly overridden (see specificity).
- `90-responsive.css:99-102,171-174,254-282,312-320,438-449,505-513,666-672`.
That is roughly 12-15 KB of unminified CSS. Verify by grepping `dist/manage-7fk3` only if the admin shares `styles.css`; it was out of scope here.

### Specificity and cascade problems
- `13-contact.css:395-413` media rules are overridden by later, equal-specificity rules in `90-responsive.css:166-169,495-518,657-659,721-723`. The 1024px single-column intent is lost (two columns 769-1024px), and the `.contact-map` `height` values are moot under `min-height:420/320px`. Remove the dead declarations (zero visual change) and document the shipped layout (done in DESIGN.md).
- `06-footer.css:188,193`: `opacity: 1 !important` on `.email-popup-option` to beat `.footer-col a:hover {opacity:.6}`. Replace with `.footer-col .email-popup-option { opacity:1 }` (higher specificity, no `!important`).
- Duplicated declarations: `.timeline-era-side-year{display:none}` (90-resp 112 and 379), `.timeline-frame-year{display:none}` (base and 90-resp 330), `.proj-grid` 3 columns at 1200 and 1024, `.page-header{height:var(--menu-height)}` restated, literal `72px`/`64px` beside the `--menu-height` override, `.subs-grid .sub-logo` 180px at both 1024 and 768.
- `.error-*` (`99-utilities.css:93,102`) uses `'CFModGrotesk'`, which does not match the `@font-face` name. It is visible today (system sans). Fixing it changes the 404 look: **visible**, option only.
- `.reveal-delay-4/5` equal `-3`. Intentional or not, it is frozen.

### z-index
Values in use: 0, 1, 2, 3, 5, 10, 20, 40, 90, 100, 400, 500, 1999, 2000, 2001, 10000, plus Leaflet's internal 400-1000. Concrete issue: `.proj-map` (`11-projects.css:506`) is `position:relative` without its own stacking context, so Leaflet panes (z 400+) and the map card (500) compete in the root context with the fixed page header (20), the grain overlay (10) and back-to-top (90). Back-to-top can end up under the map tiles. Fix: `.proj-map { isolation: isolate; }`. Check screenshots of the map view with back-to-top visible; that is the only place it could differ, and there it corrects an overlap. Then document a scale in tokens (`--z-grain:10; --z-page-header:20; --z-toolbar:40; --z-fab:90; --z-popover:100; --z-overlay:1999; --z-header:2000; --z-skip:10000`).

### Missing focus-visible
A global `*:focus-visible` exists. Removals that defeat it: `.skip-link:focus{outline:none}` (it has a border, OK); `.cf-field input:focus{outline:0}` (m10); `.proj-map-leaflet`, `.leaflet-container`, `.leaflet-interactive:focus { outline:none }` (#12). Inside `.menu` and `.page-header` (`mix-blend-mode: difference`) the orange ring renders blue-ish. It is still visible, so leave it.

### forced-colors (Windows High Contrast)
No `@media (forced-colors: active)` rules exist. Concrete breakages (static analysis; verify with Edge emulation):
- The hamburger bars are `span`s drawn with `background` (`05-menu.css:61`). Forced colours remove the background, so **the menu button is invisible**. Fix: `@media (forced-colors: active) { .hamburger span { background: CanvasText; } }`.
- Selected states drawn only by background or colour become indistinguishable: `.cf-pill input:checked + span` (accent fill), `.proj-page-btn.is-active`, `.proj-view-btn.is-active` (border colour only), `.proj-filter-btn.is-active::before` (white dot drawn with background), the timeline active dot. Fix: under forced-colors give them `border: 2px solid Highlight` / `forced-color-adjust: none` on the dot pseudo-elements with `background: Highlight`.
- Back-to-top SVG stroke is fine. The grain overlay is irrelevant.
Risk: none (affects forced-colors users only, who currently get a broken UI).

### Zoom (200%/400%) and reflow
- `.nav-overlay` (`05-menu.css:79-86`) is a fixed flex-centred panel with no `overflow-y`, and `body{overflow:hidden}` while open. On short viewports (landscape phone, 400% zoom) the 6 links at 36-56px × 1.2 line-height overflow and **cannot be reached**. Fix: `overflow-y:auto; overscroll-behavior: contain;` (and `align-items: safe center`). Risk: none at normal sizes.
- `html { font-size: 16px }` (`00-reset.css:13`) overrides the user's default font-size setting. Nearly all sizes are px anyway, so browser zoom works (1.4.4 OK) but text-only enlargement does not. Changing this would affect the rem-based rules (map sheet, 404): option only.
- Fixed header 100/72/64px plus the fixed page title take a large share of the viewport at 200%+. They are transparent, with the page header hiding on scroll; acceptable.
- `body { overflow-x: hidden }` can hide overflow at zoom. The equipment grid and timeline nav use local horizontal scroll (allowed for 2D content).
- `.subs-grid .sub-name { white-space: nowrap }` is hover-only, fine.

### Contrast (all **visible**, options only; nothing to change without sign-off)
| Pair | Ratio | Where | Options |
|---|---|---|---|
| White text on accent | 2.72 | `.cf-submit` (`13-contact.css:250-252`), "In Progress" badge (`11-projects.css:499-500`) | (a) `black` text as `.btn-primary` already does (5.99); (b) darken the fill to about #C2510F (4.5:1 with white); (c) accept as brand exception (fails 1.4.3) |
| White 0.25 | 2.09 | timeline frame captions/titles/brand (`09-timeline.css:313,335,372`) | raise to 0.55 (4.4:1) or mark them decorative and duplicate the caption text elsewhere |
| White 0.35 / 0.45 | 2.73 / 3.50 | `cf-optional`, `cf-trust` | raise to 0.55 |
| White 0.4 on footer | 3.13 | `.footer-bottom p` | raise to 0.6 |
| `gray-04` on `gray-01` | 3.68 | counts, tags, meta labels (11-13px) | lighten `gray-04` to about #b4b4b4, or use `gray-03` (4.36, still short) |
| Accent on `gray-01` | 3.81 | small accent labels (contact h3 11px, tags 10-11px, subtitle) | fine for ≥24px/bold-19px text; for micro labels use a lighter accent tint (#FF8A45 ≈ 4.6) |
| White 0.2 input underline | 1.81 | form field boundary (1.4.11 needs 3:1) | 0.45 alpha (3.0) |
| Filter buttons white 0.5 | 3.96 | inactive filters 15px | 0.6 alpha |

---

## 5. JS quality

- **Globals and fragility.** All 16 files are concatenated into one classic script (`build.js:181-185`), so every top-level `const`/`let`/`function` lands in the global lexical scope: `LANG`, `BASE`, `I18N`, `T`, `hamburger`, `navOverlay`, `revealObserver`, `pageHeader`, `scrollTopBtn`, `hero`, `heroEst`, `timelineNav`, `projGridView`, `projListView`, `projMapView`, `projPagination`, `PAGE_SIZE`, `currentPage`, `projFilterToggle`, `subsData`, `subsGrid`, `pdetDetail`, `applyPagination`, `fetchProjects`, and others. They share scope with `PROJECTS` from `projects-data.js`. One duplicated name in a future file is a SyntaxError that kills **all** site JS on every page. Fix: wrap each file in an IIFE in `concatDir` (`'(function(){\n' + src + '\n})();'`) and export the few shared symbols explicitly (`window.THEMELI = { LANG, BASE, T, fetchProjects, openGallery }`). Unused exports: `window._projApplyPagination`, `window._projResetPage` (`09-projects-ui.js:155-156`) are referenced nowhere.
- **Silently swallowed errors.**
  - `09a-photoswipe.js:75-77`: if PhotoSwipe fails to load, the click does nothing and nothing is logged. At least `console.error`, and fall back to `window.open(images[startIndex])`.
  - `12-contact.js:19-27,46-54`: `navigator.clipboard.writeText()` has no `.catch` (unhandled rejection on insecure context or denied permission) and gives no user feedback.
  - `12-contact.js:149-153`: `err` is discarded. Log it before showing the generic message.
  - `build.js:58,175,179,185,193`: write/copy failures are swallowed (`catch(_){}`), and prod minification falls back silently (see §3).
- **Duplicated code across files.**
  - The "in progress first, then newest" comparator appears 3× (`08-projects-render.js:11-16`, `11-project-detail.js:25-30`, `11-project-detail.js:113-118`; the last re-sorts an already-sorted array).
  - The `lName`/`lDesc`/`tTyp`/`tLoc` helpers appear in `08-projects-render.js:31-36`, `10-leaflet-map.js:69-72` and `11-project-detail.js:36-39,131,151,154` (inline).
  - The email and phone popup handlers are near-identical blocks (`12-contact.js:4-56`).
  - The rAF scroll-throttle pattern appears 4× (`06-scroll-utils.js`, `07-timeline-nav.js`).
  - `PLACEHOLDER` is duplicated (`08:45`, `11:65`).
  Move the shared helpers to `00-core.js`/`01-data-loader.js` (`sortProjects`, `localName`, …).
- **Inconsistent escaping.** `08-projects-render.js:49` HTML-escapes a value that is then used inside a CSS `url('…')`. `esc()` does not escape `'`, so an image URL containing an apostrophe breaks the card. `11-project-detail.js:126-134` inserts project names and typology **unescaped** into `innerHTML` (the related cards), whereas `08` escapes them. `10-subsidiaries.js:26-58` injects data via `innerHTML` (build-time JSON, lower risk). The data is admin-controlled, but it should use `esc()`/`cssUrl()` consistently.
- **Event listeners never removed.** In a multi-page site most page-lifetime listeners are fine. The concrete cases:
  - The portal's `resize` listener and infinite rAF (`13-terminal-bg.js:57,208`) never stop (#5).
  - `03-menu.js:51`, `09-projects-ui.js:178` and `10-leaflet-map.js:168` each add a document-level `keydown`/`click` listener that runs on every interaction for the page's lifetime. This is acceptable; consolidating them would only be cosmetic.
  - `10-subsidiaries.js` re-binds listeners to freshly created cards on every open. The old nodes are replaced, so there is no leak.
- **Dead JS.**
  - `14-counter.js` (no counters in markup).
  - `06-scroll-utils.js:46-67` (hero parallax).
  - `04-scroll-reveal.js:15`: `.reveal-left/-right/-scale`, `.timeline-bar`.
  - `09-projects-ui.js:228-238`: `.proj-map-dot`/`.proj-map-line` left over from the old PNG map.
  - `13-terminal-bg.js:16,152,202`: `hintEl` is always null.
- **Other concrete bugs.**
  - `11-project-detail.js:161-166`: an unknown id replaces content and redirects after 1.2 s; the message is not in a live region. Minor.
  - `09-projects-ui.js:96`: reads `--menu-height` with `parseInt`, so it works only while the token stays in px.

---

## 6. SEO / JSON-LD (seo-schema)

| Block | Type | Status | Issues |
|---|---|---|---|
| `base.html:100-134` | ConstructionCompany (a LocalBusiness subtype, active) | ❌ invalid JSON | Trailing comma (#1). Once fixed: absolute URLs OK, `geo`, `address`, `telephone` OK. Recommend `@id`, `sameAs` (real profiles), and `openingHoursSpecification` if known. |
| (none) | WebSite | missing | Add `{"@type":"WebSite","@id":"https://themeli.gr/#website","url":"https://themeli.gr/","name":"THEMELI S.A.","inLanguage":["en","el"],"publisher":{"@id":"https://themeli.gr/#org"}}` |
| project pages | none | opportunity | No Google rich result exists for projects. Optional `BreadcrumbList` (Home › Projects › name) emitted by `11-project-detail.js`, or better at build time. |

Related SEO findings (none of them visible):
- **S1** `base.html:10-13,17`: the project page's canonical, hreflang and og:url are `https://themeli.gr/{lang}/project` without `?id=`. JS rewrites canonical and og:url after load (`11-project-detail.js:43-53`), but hreflang alternates stay id-less. Crawlers that do not render JS see every project as a duplicate of `/project`. Fix: have JS also update the hreflang links, or better, prerender project pages at build time from `projects-data.js` (the sitemap already lists `project?id=N`).
- **S2** Footer and contact social links point to the platform homepages (`https://www.linkedin.com`, `facebook.com`, `instagram.com`; `base.html:82-84`, `contact.html:46-48`). This is a content bug: replace them with the company profile URLs and reuse those in `sameAs`. The text does not change, so this is not a visual change.
- **S3** Root redirect pages (`build.js:241-248`) have no `lang`, `<title>` or canonical. They are meta-refresh plus JS, and `.htaccess` already 301s them, so the impact is low.
- **S4** The footer copyright year is hard-coded "2025" (`strings.json`). Content, not design.

---

## 7. Proposed fix order

1. **Zero-risk correctness (one PR)**: #1 JSON-LD comma; #10 duplicate main id and double H1; #14 localized labels and lang-switch attributes; S2 social URLs; `projects-data.js` seed guard in `build.js`. Screenshot diff should be empty.
2. **Keyboard blockers (one PR)**: #2 menu inert/visibility; #8 filter panel visibility plus ARIA; #3 subsidiary/gallery/featured buttons with style reset plus M6 focus management; #9 pagination focus. Screenshot diff should be empty except focus rings in keyboard-driven captures.
3. **Screen-reader semantics**: #12 map card; #13 contact form; #11 typewriter sr-only copy; M9 heading levels (update selectors); m2 popups to buttons; m3/m4 chips and sort; forced-colors block (§4).
4. **Reduced-motion layer** (one shared `REDUCED` helper): #4 portal static frame plus no-JS fallback; #11 typewriter instant; #15 smooth scroll and Leaflet; remove `14-counter.js` and the dead parallax.
5. **Performance**: #6 per-page data scripts; #7 lazy Leaflet (move the CSS out of the bundle); #5 canvas pause/stop-writes/colour caching; timeline `sizes`; `.btn` `transition: all`; `decoding="async"` on gallery; terser via the API.
6. **CSS hygiene**: delete dead CSS/JS listed in §4 and §5; tokenise repeated literals 1:1; remove the overridden contact media rules and `!important`; `.proj-map { isolation: isolate }`; `.nav-overlay { overflow-y:auto }`; z-index scale tokens.
7. **JS structure**: IIFE-wrap the files in `build.js`, explicit `window.THEMELI` exports, shared helpers in `00-core.js`, consistent escaping, error logging.
8. **Needs a design decision (visible)**: the contrast table in §4, the 404 font-family typo, the hover gating for touch (m9), and the metric-matched fallback font.

After each step: `npm run build` locally, then a screenshot diff against `audit/2026-10-26-baseline/screenshots` at the same viewports, and keyboard and reduced-motion passes.

## 8. Needs runtime verification (not asserted here)
- Actual particle count and frame cost of the portal on low-end mobile (use the performance trace from the browser agent).
- Whether VoiceOver/NVDA actually read the typewriter letter by letter (behavior varies by browser and SR).
- The forced-colors rendering of the hamburger and of selected states (Edge forced-colors emulation).
- The map's stacking under the fixed header and back-to-top (screenshot at map view scrolled).
- Whether `dist/projects-data.js` on the server contains absolute production URLs (the src seed does not).
- Contrast of text over images (project hero back link) depends on the photo.
