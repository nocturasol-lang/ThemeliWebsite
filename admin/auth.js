/**
 * THEMELI — Admin Auth Gate
 * Client-side password protection using SHA-256 hash.
 */
(function () {
  const HASH = 'e0f9b174916bb2bc1bf6ba09c3125c9340040b6e0cb774a2b464d1f43219d8c7';
  const SESSION_KEY = 'themeli_auth';

  async function sha256(msg) {
    const data = new TextEncoder().encode(msg);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function unlock() {
    document.getElementById('loginGate').classList.add('is-hidden');
    document.body.classList.remove('admin-gated');
  }

  // Already authenticated this session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    unlock();
  }

  // Login form
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('loginPassword');
      const error = document.getElementById('loginError');
      const box = document.querySelector('.login-box');

      const hash = await sha256(input.value);

      if (hash === HASH) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        error.textContent = '';
        unlock();
      } else {
        error.textContent = 'Incorrect password';
        input.value = '';
        input.focus();
        box.classList.remove('shake');
        void box.offsetWidth; // reflow to restart animation
        box.classList.add('shake');
      }
    });
  }
})();
