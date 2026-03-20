/* THEMELI — Projects loader (static data) */

async function fetchProjects() {
  return typeof PROJECTS !== 'undefined' ? PROJECTS : [];
}
