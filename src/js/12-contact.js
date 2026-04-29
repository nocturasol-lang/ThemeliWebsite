/* THEMELI — Email & phone popups */

// ========== EMAIL POPUP ==========
document.querySelectorAll('.email-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest('.email-wrapper');
    // Close any other open popups
    document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
      if (w !== wrapper) w.classList.remove('active');
    });
    wrapper.classList.toggle('active');
  });
});

document.querySelectorAll('.email-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const email = btn.dataset.email;
    navigator.clipboard.writeText(email).then(() => {
      btn.textContent = T.copied;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = T.copyAddress;
        btn.classList.remove('copied');
        btn.closest('.email-wrapper').classList.remove('active');
      }, 1500);
    });
  });
});

// ========== PHONE POPUP ==========
document.querySelectorAll('.phone-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest('.phone-wrapper');
    document.querySelectorAll('.phone-wrapper.active, .email-wrapper.active').forEach(w => {
      if (w !== wrapper) w.classList.remove('active');
    });
    wrapper.classList.toggle('active');
  });
});

document.querySelectorAll('.phone-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const phone = btn.dataset.phone;
    navigator.clipboard.writeText(phone).then(() => {
      btn.textContent = T.copied;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = T.copyNumber;
        btn.classList.remove('copied');
        btn.closest('.phone-wrapper').classList.remove('active');
      }, 1500);
    });
  });
});

// Close popups when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.email-wrapper') && !e.target.closest('.phone-wrapper')) {
    document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
      w.classList.remove('active');
    });
  }
});

// ========== CONTACT FORM (submits to /api/inquiries.php) ==========
(function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var formView   = document.getElementById('cfFormView');
  var successView = document.getElementById('cfSuccessView');
  var errorBox   = document.getElementById('cfError');
  var submit     = form.querySelector('.cf-submit');
  var newMsgBtn  = document.getElementById('cfNewMsg');
  var originalLabel = submit.textContent;

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.add('is-shown');
  }
  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.remove('is-shown');
  }
  function showSuccess() {
    formView.classList.add('hidden');
    successView.classList.remove('hidden');
    // Scroll the success message into view on small screens so the user sees it.
    if (window.innerWidth < 1024) {
      successView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function resetToForm() {
    form.reset();
    clearError();
    submit.disabled = false;
    submit.textContent = originalLabel;
    successView.classList.add('hidden');
    formView.classList.remove('hidden');
    // Re-select the default inquiry_type so radio state is consistent after reset()
    var firstType = form.querySelector('input[name="inquiry_type"]');
    if (firstType) firstType.checked = true;
    // Focus the first empty text field for fast re-entry.
    var firstEmpty = Array.prototype.find.call(
      form.querySelectorAll('input[type="text"], input[type="email"], textarea'),
      function(el) { return !el.value; }
    );
    if (firstEmpty) firstEmpty.focus();
  }

  if (newMsgBtn) newMsgBtn.addEventListener('click', resetToForm);

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearError();

    var typeEl = form.querySelector('input[name="inquiry_type"]:checked');
    var data = {
      name:         form.name.value.trim(),
      email:        form.email.value.trim(),
      phone:        form.phone.value.trim(),
      subject:      form.subject.value.trim(),
      message:      form.message.value.trim(),
      inquiry_type: typeEl ? typeEl.value : 'other',
      website:      form.website.value.trim()  // honeypot — should be empty
    };

    if (!data.name) { showError(T.formValidName); form.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showError(T.formValidEmail); form.email.focus(); return; }
    if (data.message.length < 10) { showError(T.formValidMessage); form.message.focus(); return; }

    submit.disabled = true;
    submit.textContent = T.formSending;

    try {
      var res = await fetch('/api/inquiries.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      var json = null;
      try { json = await res.json(); } catch (_) {}
      if (!res.ok || !json || json.ok === false) {
        throw new Error((json && json.error) || ('HTTP ' + res.status));
      }
      showSuccess();
    } catch (err) {
      showError(T.formError);
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
})();
