/**
 * THEMELI — Admin Auth Gate (Supabase)
 */
(async function () {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Expose for admin.js
  window._supabase = sb;

  function unlock() {
    document.getElementById('loginGate').classList.add('is-hidden');
    document.body.classList.remove('admin-gated');
  }

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    unlock();
  }

  // Login form
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      const error = document.getElementById('loginError');
      const box = document.querySelector('.login-box');

      const { error: authError } = await sb.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: passInput.value
      });

      if (!authError) {
        error.textContent = '';
        unlock();
      } else {
        error.textContent = authError.message || 'Login failed';
        passInput.value = '';
        passInput.focus();
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      window.location.reload();
    });
  }
})();
