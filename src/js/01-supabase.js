/* THEMELI — Supabase client */

// Supabase client (read-only, uses anon key)
const _sb = (typeof SUPABASE_URL !== 'undefined' && typeof supabase !== 'undefined')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Shared async fetch: Supabase → fallback to PROJECTS constant
async function fetchProjects() {
  if (_sb) {
    try {
      const { data, error } = await _sb.from('projects').select('*').order('id');
      if (!error && data) {
        return data.map(r => ({
          id: r.id, name: r.name, description: r.description || '',
          year: r.year, typology: r.typology, location: r.location || '',
          architect: r.architect || '', size: r.size || '',
          status: r.status || 'Completed', dateCompleted: r.date_completed || '',
          image: r.image_url || '', mapX: r.map_x, mapY: r.map_y
        }));
      }
    } catch (e) { /* fall through to local data */ }
  }
  return typeof PROJECTS !== 'undefined' ? PROJECTS : [];
}
