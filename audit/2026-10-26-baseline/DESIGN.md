---
version: alpha
name: THEMELI S.A. website
description: Bilingual (EN/EL) marketing site for a Greek construction company. Dark warm-grey canvas, a single orange accent, one expanded grotesk family, and slow ease-out motion. This file freezes the design as implemented on 2026-10-26; it is the "do not change" contract for polish work.
colors:
  gray-01: "#404041"
  gray-02: "#3f3f3f"
  gray-03: "#a8a8a8"
  gray-04: "#9a9a9a"
  gray-05: "#2e2e2f"
  white: "#ffffff"
  black: "#202020"
  accent: "#FF731E"
typography:
  display:
    fontFamily: CF Mod Grotesk
  body:
    fontFamily: CF Mod Grotesk
  portal-headline:
    fontFamily: CF Mod Grotesk
    fontSize: clamp(44px, 9vw, 92px)
    lineHeight: "1"
    fontWeight: 700
    letterSpacing: 0.02em
  nav-overlay-link:
    fontFamily: CF Mod Grotesk
    fontSize: clamp(36px, 5vw, 56px)
    lineHeight: "1.2"
    fontWeight: 700
    letterSpacing: -0.02em
  page-header-title:
    fontFamily: CF Mod Grotesk
    fontSize: clamp(14px, 1.2vw, 18px)
    lineHeight: "1"
    fontWeight: 500
    letterSpacing: 0.12em
  body-default:
    fontFamily: CF Mod Grotesk
    fontSize: 16px
    lineHeight: "1.6"
    fontWeight: 400
spacing:
  pad-x: max(82px, calc((100vw - 1600px) / 2))
  menu-height: 100px
---

## Overview

Corporate site for THEMELI S.A. (est. 1923): home "portal" with a particle-logo canvas, timeline, subsidiaries, projects (grid / list / Leaflet map), project detail, about/equipment, contact. Every page shares one layout (`src/layouts/base.html`): a fixed blend-mode header, a full-screen circular-reveal menu, a gradient footer and a back-to-top button. Pages exist in English (`/en/`) and Greek (`/el/`) with identical markup and different copy.

The look is: dark warm grey (`gray-01`) everywhere, white text at many opacities, orange (`accent`) reserved for active state, highlights and the home headline, hairline 1px borders in translucent white, greyscale photography that warms up on hover, and a faint SVG grain over the whole viewport.

Source of truth: `src/css/01-tokens.css` (tokens), `src/css/*.css` (all other values are literals), `src/js/*.js` (motion choreography). Everything below describes what is shipped, including inconsistencies. Do not "fix" an inconsistency listed here without a visual sign-off.

## Colors

Tokens (`01-tokens.css`) are the eight values in the frontmatter. Roles as used:

| Token | Role |
|---|---|
| `gray-01` #404041 | Page background (`body`), map background, hero overlay fade target, ring "cutout" shadow (`0 0 0 4px gray-01`) |
| `gray-02` #3f3f3f | Footer gradient top stop, image placeholders, empty featured tiles |
| `gray-03` #a8a8a8 | Secondary text (portal sub, back button, map-card meta, list year) |
| `gray-04` #9a9a9a | Tertiary/meta text (labels, counts, tags, inactive years) |
| `gray-05` #2e2e2f | Menu overlay background, popups, timeline nav dot fill |
| `white` | Primary text and icons |
| `black` #202020 | Text on accent buttons (`.btn-primary`, active page button, map CTA hover), `::selection` text |
| `accent` #FF731E | Active nav link, home headline, labels on contact, tags, focus ring, active filters/views/pagination, timeline line and dots, selection background |

Literal colours used outside the tokens (must stay as they are):

- White alpha ladder (text, borders, fills): 0.02, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9. Most common: 0.06 / 0.08 / 0.1 / 0.12 / 0.15 / 0.25 for hairlines and dividers; 0.85 for long-form body text.
- Accent alpha: rgba(255,115,30, 0.06 / 0.08 / 0.1 / 0.12 / 0.2 / 0.3 / 0.35 / 0.4 / 0.5).
- `gray-05` alpha panels: rgba(46,46,47, 0.4 / 0.5 / 0.85 / 0.95).
- Near-black panels: rgba(32,32,32, 0.6 / 0.78 / 0.8 / 0.95), rgba(20,20,20,0.92) (skip link), rgba(0,0,0, 0.25–0.8) shadows/close button.
- Footer gradient: `linear-gradient(to top, #6a6a6a 0%, #4f4f4f 30%, gray-02 100%)`.
- Accent hover on submit: `#e66614`; 404 button hover: `#ff8742`.
- Error: text/border `#ff7b7b`, fill rgba(255,97,92,0.08), invalid underline rgba(255,97,92,0.6).
- One-offs: `#8a857f` (portal hint, currently not rendered), `#c8cbd0` (map-card description), map card photo fallback `#1a1e26 → #0a0d13`, Leaflet regions `#e7e7ea` fill / `#2a2d34` stroke, pin `#FF731E` with `#0a0d13` stroke, canvas trail `rgba(64,64,65,0.35)`, canvas particles orange `rgb(255, 115–175, 30–70)` and 20 % warm white `rgba(255,220,180,…)`.
- `theme-color` meta: `#252526` (not a token value).

Contrast as shipped (WCAG ratios, for reference only, do not change without sign-off): white on accent 2.72, `black` on accent 5.99, accent on `gray-01` 3.81, `gray-04` on `gray-01` 3.68, `gray-03` on `gray-01` 4.36, white 0.25 on `gray-01` 2.09.

## Themes

Single dark theme. No light mode, no `prefers-color-scheme` handling, no `forced-colors` rules.

## Typography

One family, `CF Mod Grotesk` (expanded cuts), loaded from `/assets/fonts/` as woff2 + woff with `font-display: swap`:

| Face file | Declared weight |
|---|---|
| CFModGrotesk-RegularExpanded | 400 (preloaded) |
| CFModGrotesk-MedExtExp | 500 |
| CFModGrotesk-BoldExtExpanded | 700 |

`--font-display` falls back to Georgia, serif; `--font-body` falls back to Helvetica Neue, sans-serif. Both resolve to the same face once loaded, so "display" vs "body" only differs in fallback.

Weights requested in CSS and what actually renders (only 400/500/700 exist):

| Requested | Count | Renders as |
|---|---|---|
| 300 | 16 | 400 (long-form paragraphs, inputs, contact, titles `cf-title`, `cf-success-title`) |
| 400 | 23 | 400 |
| 500 | 32 | 500 |
| 600 | 16 | 700 (list names, card names, meta values, lang switch, timeline years) |
| 700 | 18 | 700 |
| 800 | 1 | 700 (`.timeline-era-year`) |

Font sizes in use (px unless noted, with occurrences): 8 (1), 9 (1), 10 (7), 11 (17), 12 (19), 13 (19), 14 (17), 15 (6), 16 (9), 17 (7), 18 (3), 19 (2), 20 (4), 22 (3), 24 (1), 26 (1), 28 (1), 32 (2), 34 (1), 44 (1), plus rem/em one-offs (0.9rem, 1rem, 1.15rem, 1.2em, 1.5em) and these fluid clamps:

| Role | Value |
|---|---|
| Home headline | clamp(44px, 9vw, 92px); ≤768px clamp(40px, 12vw, 68px) |
| Menu overlay links | clamp(36px, 5vw, 56px) |
| Page header title (fixed, centered, uppercase) | clamp(14px, 1.2vw, 18px); 13px ≤768; 12px ≤480 |
| Project detail title | clamp(32px, 5vw, 56px) |
| Era year (timeline) | clamp(36px, 4.5vw, 52px) |
| Equipment title | clamp(36px, 4vw, 52px); 32px ≤768 |
| Subsidiary name | clamp(32px, 3.5vw, 48px) |
| Era range heading | clamp(24px, 3vw, 40px); ≤768 clamp(20px, 5vw, 28px) |
| Timeline opener | clamp(22px, 2.8vw, 36px); tagline 1.5em (1.2em ≤768) |
| About lead | clamp(24px, 3vw, 34px); 22px ≤768 |
| Era text | clamp(18px, 2.2vw, 26px) |
| Subsidiary subtitle | clamp(16px, 1.8vw, 22px) |
| Equipment big number | clamp(28px, 2.5vw, 36px); 28px ≤768 |
| Portal sub | clamp(13px, 1.2vw, 15px) |
| 404 code / title | clamp(7rem, 18vw, 12rem) / clamp(1.5rem, 3vw, 2rem) |

Recurring text roles:

- Micro-label: 11–13px, weight 500, uppercase, letter-spacing 0.08–0.16em, colour `gray-04` or accent (footer h4, filter labels, meta labels, cf labels, pdet info labels, related title).
- Long-form body: 17–20px, weight 300, line-height 1.75–1.85, white 0.75–0.9.
- Card name: 14px, weight 600, letter-spacing -0.01em, line-height 1.3; turns accent on card hover.
- Tags/pills: 10–11px uppercase, letter-spacing 0.06–0.1em, 1px border, radius 20px.

Letter-spacing values in use: -0.04em, -0.03em, -0.02em, -0.01em, 0.01em, 0.02em, 0.04em, 0.05em, 0.06em, 0.08em, 0.1em, 0.12em, 0.14em, 0.15em, 0.16em, 0.2em, plus px values -1px, 1.5px, 2px, 3px.

Line-heights in use: 0.9, 0.95, 1, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5, 1.55, 1.6 (body default), 1.7, 1.75, 1.8, 1.85.

`html { font-size: 16px }` is fixed in the reset.

## Layout

- Horizontal page gutter: `--pad-x` = max(82px, (100vw − 1600px)/2) → 36px ≤1024, 24px ≤768, 16px ≤480. Header and footer use literal 82px (36px/24px/16px at the breakpoints), not the token.
- Header height: `--menu-height` = 100px → 72px ≤768 → 64px ≤480 (also restated as literals in the same media queries).
- Content max-widths: 1600px (home container), 1400px (about inner, subsidiary detail), 1200px (project detail content), 900px (timeline opener), 800px (project description), 680px (contact lead), 640px (portal content), 480px (success lead, 404 message).
- Page top/bottom padding: 120px top / 240px bottom on about, timeline, projects (subsidiaries: 220px top); reduced to 100px/80px ≤768 and 84px top ≤480. Contact uses `menu-height` top padding.
- Grids: project grid 4 → 3 (≤1200) → 2 (≤768) columns, gap 24 → 20 → 16 → 12px. Related projects 4 → 3 → 2 → 1. Subsidiary featured 4 → 2 → 1. Equipment rows 5 → 3 → 2 → 1 columns. Timeline era body 2 → 1 column (≤1024). Contact info|form 1fr:2fr → 1fr 1fr (≤1024) → one column (≤768).
- Breakpoints (all `max-width`): 1200, 1024, 768, 720 (contact only), 640 (map bottom sheet + JS `matchMedia`), 600 (lang switch only), 480.
- Spacing values actually used (px; no spacing scale exists): gaps 2, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 60, 70, 80, 96, 100; margins 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 60, 72, 80, 96, 100, 120; paddings 1–24 in small steps, then 28, 32, 36, 40, 48, 56, 60, 80, 82, 84, 100, 120, 140, 220, 240. Most frequent: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60, 100. A few rem values exist (0.7, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 4, 6rem) in the map sheet, empty states and 404.

## Elevation & Depth

Depth is made with translucency and hairlines, not shadows. Shadows that exist:

- Popups: `0 8px 24px rgba(0,0,0,.3)`.
- Project card hover: `0 8px 32px rgba(0,0,0,.25)`.
- Map card: `0 20px 60px rgba(0,0,0,.5)`; mobile sheet `0 -12px 40px rgba(0,0,0,.45)`.
- Ring cutout for dots: `0 0 0 4px var(--gray-01)`.
- Backdrop blur: map card 14px + saturate(1.2), map hint 8px, skip link 8px.
- Global grain: fixed `body::after`, opacity 0.018, SVG fractal noise, 256px tile.
- Blend: `.menu` and `.page-header` use `mix-blend-mode: difference` over content.

Stacking order as shipped: grain 10, page header 20, map hint 400 / Leaflet panes 400+, map card 500, footer popups 100, scroll-top 90, project toolbar/chips/filters 40, menu overlay 1999, header 2000, hamburger 2001, skip link 10000.

## Shapes

No radius token. Radii in use: 2px (form controls, submit, error, 404 buttons, timeline bar), 3px (kbd), 8px (map hint), 12px (popups, map card), 16px (project cards, filter panel), 18px top (mobile sheet), 20px (lang switch, chips, tags, apply button), 40px (filter toggle, view buttons, subsidiary featured cards, related cards), 50px / 999px (status badge, pagination, map pills), 50% (dots, scroll-top), 60px/102px (header box, invisible because the header is transparent).

Hairline rule: 1px solid white at 0.06–0.25 alpha for borders and dividers; accent 1px for emphasis dividers.

Photography: grayscale(100%) at rest → grayscale(40%) on hover for cards; grayscale(30%) contrast(1.05) → none for timeline frames and gallery; project hero grayscale(40%) when an image exists. Contact map iframe: grayscale(100%) invert(92%) contrast(90%).

## Components

- **Header (`.menu`)**: fixed, transparent, difference-blended; logo (65×60, hover opacity 0.7) left; right side the language pill (`EL`/`EN`, 12px, 600, letter-spacing 2px, 1px white-0.25 border, radius 20px, fills white on hover) and the 44×28 three-line hamburger that morphs to an X.
- **Page header (`.page-header`)**: fixed, centered page title in the header band, difference-blended, hides (opacity) on scroll down past 80px and returns on scroll up.
- **Menu overlay**: full-screen `gray-05` panel revealed by a clip-path circle from the hamburger position; uppercase 700 links, active link in accent, hover opacity 0.4.
- **Buttons**: `.btn` (14px 32px padding, 13px uppercase 500, letter-spacing 0.08em); `.btn-primary` accent fill with `black` text, hover brightness(1.1) and lift 2px; `.btn-ghost` transparent with white-0.2 border, hover accent border+text. Contact submit: accent fill, white text, 18px 36px, min-width 240px. 404 buttons use a separate `.btn-error` style.
- **Pills/chips/tags**: 1px border, radius 20px (or 999px), uppercase micro type.
- **Cards**: project card (radius 16px, gray-05 0.5 fill, 3:2 grayscale image, name + year row, tag); subsidiary featured and related cards (same anatomy, radius 40px). Hover: border white 0.15, lift 2px, image warms, name turns accent.
- **Project list**: 4-column grid row (2.5fr 1.2fr 1fr 0.5fr), hairline separators, hover background white 0.04 and 4px indent, sortable header with ▲/▼ glyph.
- **Filter panel**: collapsible bordered panel (radius 16px) with three columns of text buttons; active filter gets a white 6px dot.
- **Pagination**: round 36px buttons, active filled accent with `black` text.
- **Map**: Leaflet with light-grey prefecture polygons on `gray-01`, orange 10px pins (16px with halo when active), segment projects drawn as polylines; preview card slides in from the right (desktop) or rises as a 55dvh bottom sheet (≤640px).
- **Timeline**: horizontal year nav (14px dots, accent progress bar), vertical accent gradient line with 10px dots, giant era years, vertical rotated side years (white 0.1), "brochure frame" cards with label/title header and THEMELI footer.
- **Contact form**: hairline-underline inputs (white 0.2 → 0.4 hover → accent focus), square-cornered radio pills (checked = accent fill), inline error box with left red border, success view with drawn check mark.
- **Footer**: gradient band, footer logo (inverted, hover scale 1.08), three columns of micro-labels and 14px links, email/phone triggers that open small popups with an arrow.
- **Back to top**: 44px circle, appears after 300px of scroll.

## Motion

Easing tokens: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (default for almost everything), `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` (menu clip-path only). Literal curves: `cubic-bezier(0.2, 0.8, 0.2, 1)` (map card), `ease` (map card opacity), `ease-in-out` (portal chevron), CSS default `ease` wherever no timing function is given (most colour/border hovers).

Durations in use: 150ms, 180ms, 0.2s, 240ms, 0.25s, 0.3s, 320ms, 0.35s, 360ms, 0.4s, 0.45s, 0.5s, 0.6s, 0.8s, 1.8s (loop), 2000ms (counter, unused), 4000ms (home portal). Hover colour/border changes are mostly 0.3s; entrances 0.4–0.6s.

Choreography (do not change):

1. **Home portal** (`13-terminal-bg.js`, canvas): on load, particles sampled from the THEMELI mark fly from a random ring into the logo over a 4000ms timeline. Phases by progress: 0–0.55 formation with flow-field turbulence fading out by 0.4; 0.40–0.75 per-particle wobble, whole-logo drift (14px × 8px) and 1.5 % breathing ramp in; 0.55–0.85 logo lifts by 8 % of viewport height; 0.62–0.94 headline, sub and CTAs fade in while sliding up from 28px (`--portal-shift`). CTAs accept pointer input once content opacity > 0.7. After the timeline the drift/wobble/breathing continues indefinitely. Trails come from painting `rgba(64,64,65,0.35)` each frame.
2. **Page header**: opacity 400ms fade on scroll direction.
3. **Menu**: clip-path circle 0 → 150% in 0.45s ease-in-out; hamburger bars rotate in 0.5s ease-out; links rise from translateY(110%) in 0.6s ease-out with 30ms stagger starting at 50ms (0.05 → 0.2s).
4. **Scroll reveal** (`.reveal`): opacity 0 → 1 over 0.5s ease-out when 10 % visible (bottom margin −60px); delays 0.05 / 0.1 / 0.15 / 0.15 / 0.15s for `reveal-delay-1…5` (4 and 5 equal 3).
5. **Timeline opener typewriter**: text hidden until in view, then revealed 2 characters every ~14ms + one frame.
6. **Timeline nav**: smooth scroll to era (offset 120px); active dot fills accent; progress bar width animates 0.6s ease-out.
7. **Project detail**: whole page fades in 0.6s, then tag / title / meta / rule / description / info board / gallery / related / nav each fade (and rise 12–16px) with 0.05–0.2s staggered delays, 0.4–0.5s each.
8. **Projects grid**: grid fades in 0.4s once cards render (2s CSS fallback). Filter panel opens via max-height 0 → 600px (800px ≤768) in 0.5s plus opacity 0.4s.
9. **Map**: Leaflet `flyTo`/`flyToBounds` 0.45s on open, 0.35s on restore; card slides 360ms (320ms mobile sheet).
10. **Subsidiaries**: detail view fades and rises 20px over 0.6s; return waits 400ms; logos scale 1.06 on hover with a 40px accent underline growing from centre and name label fading in.
11. **Contact success**: view fades/rises 8px in 0.5s; check mark scales 0.7 → 1 with 0.1s delay.
12. **Footer popups**: 0.25s fade + 6px rise. Back-to-top: 0.4s fade + 16px rise.
13. **Hover micro-motion**: card lift 2px (0.3s), button lift 2px, back-arrow nudge −4px, footer logo scale 1.08 (0.4s), gallery image scale 1.02, social underline width 0 → 100% (0.4s), subsidiary back-line 24 → 40px.

Reduced motion today: a global rule in `99-utilities.css` collapses every CSS animation/transition to 0.01ms, turns off smooth scrolling and forces `.reveal` visible; the portal chevron stops. JS-driven motion (portal canvas, typewriter, smooth `scrollTo`, Leaflet fly animations) is not covered.

## Do's and Don'ts

- Don't change colours, fonts, type sizes, spacing, layout or animation choreography (CLAUDE.md). Polish must be visually identical.
- Don't apply a fix that changes something visible (for example a contrast failure); flag it and propose options instead.
- Do compare screenshots against `audit/` before and after any frontend change.

## Inconsistencies (frozen as shipped)

These exist in the code today and are part of the current look. Changing any of them is a visual change that needs sign-off.

- Weights 300, 600 and 800 are requested but no such faces are loaded; they render as 400, 700 and 700.
- The 404 page sets `font-family: 'CFModGrotesk', sans-serif` (no spaces), which matches no `@font-face`, so the 404 code and title render in the system sans-serif. It also references undefined variables `--text`, `--muted`, `--border` (fallbacks #fff, #b0b0b0, #444 are what shows).
- `reveal-delay-4` and `reveal-delay-5` equal `reveal-delay-3` (0.15s).
- Header/footer side padding is the literal 82px instead of `--pad-x`, and `--menu-height` is restated as literal 72px/64px heights in the media queries.
- Contact layout rules in `13-contact.css` (1024px and 720px) are overridden by later rules in `90-responsive.css`: between 769px and 1024px the contact page is two equal columns with a 40px gap (not the single column `13-contact.css` intends), and at ≤720px the `13-contact.css` padding is overridden by the 768px/480px paddings.
- Radius for structurally identical cards differs: project cards 16px, subsidiary featured and related cards 40px.
- Text on accent fill is `black` on `.btn-primary`, pagination and map CTA hover, but white on the contact submit and the "In Progress" badge, and `#000` on the 404 button.
- Two hover tints of accent exist (`#e66614` darker for submit, `#ff8742` lighter for 404), and `.btn-primary` uses brightness(1.1).
- Body text alphas vary by page for the same role (0.75 detail description, 0.8 subsidiary text, 0.85 about/contact, 0.9 era text).
- `theme-color` is #252526, which is not a palette value.
