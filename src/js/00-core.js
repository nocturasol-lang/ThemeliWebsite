/**
 * THEMELI — Core namespace and constants
 */

// ========== I18N ==========
const LANG = window.location.pathname.includes('/el/') ? 'el' : 'en';
const BASE = window.location.pathname.match(/\/(en|el)\//) ? '../' : '';

// ========== MOTION ==========
// Shared by every script that animates or scrolls: one live MediaQueryList for
// prefers-reduced-motion, and the behaviour to pass to scrollTo/scrollIntoView
// (the CSS `scroll-behavior` override does not reach JS-initiated scrolls).
// Top-level names are global in the concatenated bundle, hence the prefix.
const THEMELI_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
function themeliScrollBehavior() {
  return THEMELI_REDUCED_MOTION.matches ? 'auto' : 'smooth';
}
