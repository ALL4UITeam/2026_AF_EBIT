document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-card__form");
  const userIdInput = document.getElementById("userId");
  const rememberCheckbox = form == null ? void 0 : form.querySelector('input[name="rememberId"]');
  const STORAGE_KEY_ID = "login_saved_id";
  document.querySelectorAll(".login-card__toggle-pw").forEach((togglePwBtn) => {
    const control = togglePwBtn.closest(".login-card__control--password");
    const pwInput = control == null ? void 0 : control.querySelector(".login-card__input");
    if (!(togglePwBtn instanceof HTMLButtonElement) || !(pwInput instanceof HTMLInputElement)) return;
    togglePwBtn.addEventListener("click", () => {
      const isPassword = pwInput.type === "password";
      pwInput.type = isPassword ? "text" : "password";
      togglePwBtn.classList.toggle("is-visible", isPassword);
      togglePwBtn.setAttribute("aria-label", isPassword ? "비밀번호 숨기기" : "비밀번호 표시");
      togglePwBtn.setAttribute("aria-pressed", String(isPassword));
      togglePwBtn.setAttribute("title", isPassword ? "비밀번호 숨기기" : "비밀번호 표시");
    });
  });
  if (userIdInput && rememberCheckbox) {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ID);
      if (savedId) {
        userIdInput.value = savedId;
        rememberCheckbox.checked = true;
      }
    } catch (_) {
    }
  }
  if (form) {
    form.addEventListener("submit", (e) => {
      if ((rememberCheckbox == null ? void 0 : rememberCheckbox.checked) && (userIdInput == null ? void 0 : userIdInput.value)) {
        try {
          localStorage.setItem(STORAGE_KEY_ID, userIdInput.value.trim());
        } catch (_) {
        }
      } else {
        try {
          localStorage.removeItem(STORAGE_KEY_ID);
        } catch (_) {
        }
      }
    });
  }
});
