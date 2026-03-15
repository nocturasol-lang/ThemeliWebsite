/**
 * THEMELI — Core namespace and constants
 */

// ========== I18N ==========
const LANG = window.location.pathname.includes('/el/') ? 'el' : 'en';
const BASE = window.location.pathname.match(/\/(en|el)\//) ? '../' : '';
