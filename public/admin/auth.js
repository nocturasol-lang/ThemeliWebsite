/**
 * THEMELI — Admin Auth Gate (PHP Session)
 */
(async function () {
  function unlock() {
    document.getElementById('loginGate').classList.add('is-hidden');
    document.body.classList.remove('admin-gated');
  }

  // Check existing session
  try {
    const res = await fetch('../api/auth.php');
    const session = await res.json();
    if (session.authenticated) unlock();
  } catch (e) {
    console.error('Session check failed:', e);
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

      try {
        const res = await fetch('../api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passInput.value
          })
        });

        if (res.ok) {
          error.textContent = '';
          unlock();
        } else {
          const data = await res.json();
          error.textContent = data.error || 'Login failed';
          passInput.value = '';
          passInput.focus();
          box.classList.remove('shake');
          void box.offsetWidth;
          box.classList.add('shake');
        }
      } catch (err) {
        error.textContent = 'Connection failed. Is the PHP server running?';
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
      await fetch('../api/auth.php', { method: 'DELETE' });
      window.location.reload();
    });
  }
})();
