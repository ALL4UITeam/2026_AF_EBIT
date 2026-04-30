/**
 * 로그인 페이지 전용 스크립트
 * - 비밀번호 표시/숨김
 * - 아이디 저장 (localStorage)
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-card__form");
  const userIdInput = document.getElementById("userId");
  const rememberCheckbox = form?.querySelector('input[name="rememberId"]');

  const STORAGE_KEY_ID = "login_saved_id";

  // ----- 비밀번호 표시/숨김 -----
  document.querySelectorAll(".login-card__toggle-pw").forEach((togglePwBtn) => {
    const control = togglePwBtn.closest(".login-card__control--password");
    const pwInput = control?.querySelector(".login-card__input");

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

  // ----- 아이디 저장: 로드 시 복원 -----
  if (userIdInput && rememberCheckbox) {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ID);
      if (savedId) {
        userIdInput.value = savedId;
        rememberCheckbox.checked = true;
      }
    } catch (_) {}
  }

  // ----- 폼 제출: 아이디 저장 처리 -----
  if (form) {
    form.addEventListener("submit", (e) => {
      if (rememberCheckbox?.checked && userIdInput?.value) {
        try {
          localStorage.setItem(STORAGE_KEY_ID, userIdInput.value.trim());
        } catch (_) {}
      } else {
        try {
          localStorage.removeItem(STORAGE_KEY_ID);
        } catch (_) {}
      }
    });
  }
});
