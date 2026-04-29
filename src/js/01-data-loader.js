/* THEMELI — Projects loader (static data) */

async function fetchProjects() {
  try {
    if (typeof PROJECTS === 'undefined') {
      console.warn('[projects] PROJECTS constant missing — projects-data.js failed to load?');
      return [];
    }
    if (!Array.isArray(PROJECTS)) {
      console.warn('[projects] PROJECTS is not an array:', typeof PROJECTS);
      return [];
    }
    return PROJECTS;
  } catch (err) {
    console.error('[projects] fetchProjects failed:', err);
    return [];
  }
}
