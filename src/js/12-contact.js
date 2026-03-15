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
