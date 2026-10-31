/* THEMELI — Email & phone popups */

// ========== EMAIL / PHONE POPUPS (disclosure buttons) ==========
// Trigger <button aria-expanded aria-controls> + .email-popup inside a
// .email-wrapper/.phone-wrapper. One popup open at a time; Escape closes.
const POPUP_WRAPPER_SEL = '.email-wrapper, .phone-wrapper';
const POPUP_TRIGGER_SEL = '.email-trigger, .phone-trigger';

function setPopupOpen(wrapper, open) {
  wrapper.classList.toggle('active', open);
  const trigger = wrapper.querySelector(POPUP_TRIGGER_SEL);
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeAllPopups(except) {
  document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
    if (w !== except) setPopupOpen(w, false);
  });
}

document.querySelectorAll(POPUP_TRIGGER_SEL).forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest(POPUP_WRAPPER_SEL);
    if (!wrapper) return;
    closeAllPopups(wrapper);
    setPopupOpen(wrapper, !wrapper.classList.contains('active'));
  });
});

// Visually hidden live region so "Copied!" is announced (the button text
// change alone is not reliably read out).
let copyStatusEl = null;
function announceCopy(text) {
  if (!copyStatusEl) {
    copyStatusEl = document.createElement('div');
    copyStatusEl.setAttribute('role', 'status');
    copyStatusEl.setAttribute('aria-live', 'polite');
    copyStatusEl.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';
    document.body.appendChild(copyStatusEl);
  }
  copyStatusEl.textContent = '';
  // Set on the next tick so repeated copies are announced again
  setTimeout(() => { copyStatusEl.textContent = text; }, 50);
}

function bindCopy(selector, dataKey, restoreLabel) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset[dataKey];
      navigator.clipboard.writeText(value).then(() => {
        btn.textContent = T.copied;
        btn.classList.add('copied');
        announceCopy(T.copied);
        setTimeout(() => {
          btn.textContent = restoreLabel();
          btn.classList.remove('copied');
          const wrapper = btn.closest(POPUP_WRAPPER_SEL);
          if (wrapper) {
            // The copy button is about to become hidden; do not lose focus with it.
            const hadFocus = wrapper.contains(document.activeElement);
            setPopupOpen(wrapper, false);
            const trigger = wrapper.querySelector(POPUP_TRIGGER_SEL);
            if (hadFocus && trigger) trigger.focus({ preventScroll: true });
          }
        }, 1500);
      });
    });
  });
}
bindCopy('.email-copy', 'email', () => T.copyAddress);
bindCopy('.phone-copy', 'phone', () => T.copyNumber);

// Close popups when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest(POPUP_WRAPPER_SEL)) closeAllPopups();
});

// Escape closes an open popup and returns focus to its trigger
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = document.querySelector('.email-wrapper.active, .phone-wrapper.active');
  if (!open) return;
  setPopupOpen(open, false);
  const trigger = open.querySelector(POPUP_TRIGGER_SEL);
  if (trigger) trigger.focus();
});

// ========== CONTACT FORM (submits to /api/inquiries.php) ==========
(function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var formView   = document.getElementById('cfFormView');
  var successView = document.getElementById('cfSuccessView');
  var errorBox   = document.getElementById('cfError');
  var errorHome  = errorBox && { parent: errorBox.parentNode, next: errorBox.nextSibling };
  var submit     = form.querySelector('.cf-submit');
  var newMsgBtn  = document.getElementById('cfNewMsg');
  var originalLabel = submit.textContent;

  // `field` (optional) is the control the message is about: it is marked
  // invalid and described by the error box so screen readers hear why.
  function showError(msg, field) {
    // Sit right under the field in question, so it is on screen beside the
    // focused control; messages not about a field stay in their original place.
    var fieldWrap = field && field.closest('.cf-field');
    if (fieldWrap) fieldWrap.appendChild(errorBox);
    else if (errorHome) errorHome.parent.insertBefore(errorBox, errorHome.next);
    errorBox.textContent = msg;
    errorBox.classList.add('is-shown');
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', 'cfError');
      // Bring the field and its message on screen, clear of the fixed header.
      field.focus({ preventScroll: true });
      var wrap = (fieldWrap || field).getBoundingClientRect();
      var box = errorBox.getBoundingClientRect();
      var menu = document.querySelector('.menu');
      var topLimit = (menu ? menu.offsetHeight : 0) + 16;
      if (wrap.top < topLimit || box.bottom > window.innerHeight - 16) {
        window.scrollBy({ top: wrap.top - topLimit, behavior: themeliScrollBehavior() });
      }
    }
  }
  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.remove('is-shown');
    form.querySelectorAll('[aria-invalid]').forEach(function(el) {
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
  }
  function showSuccess() {
    formView.classList.add('hidden');
    successView.classList.remove('hidden');
    // Scroll the success message into view on small screens so the user sees it.
    if (window.innerWidth < 1024) {
      successView.scrollIntoView({ behavior: themeliScrollBehavior(), block: 'start' });
    }
    // The submit button is now display:none; move focus to the success title
    // (tabindex="-1") so the confirmation is announced and Tab continues from it.
    var title = successView.querySelector('.cf-success-title');
    if (title) title.focus({ preventScroll: true });
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

    if (!data.name) { showError(T.formValidName, form.name); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showError(T.formValidEmail, form.email); return; }
    if (data.message.length < 10) { showError(T.formValidMessage, form.message); return; }

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
