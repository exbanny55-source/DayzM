/* ============================================================
   Кастомный диалог подтверждения.

   Использование:
     const ok = await Confirm.show({
       title: "Удалить пункт?",
       text:  "Это действие нельзя отменить.",
       okText: "Удалить",
       cancelText: "Отмена",
       danger: true          // красная кнопка «ОК»
     });
     if (ok) { ... }

   Или короче:
     if (await Confirm.ask("Удалить?")) { ... }
   ============================================================ */

window.Confirm = (function () {
  "use strict";

  let overlay = null;
  let resolveFn = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="confirm-modal" role="dialog" aria-modal="true">
        <h3 class="confirm-title" id="confirm-title"></h3>
        <p  class="confirm-text"  id="confirm-text"></p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-ghost" data-action="cancel" id="confirm-cancel"></button>
          <button type="button" class="btn btn-primary" data-action="ok" id="confirm-ok"></button>
        </div>
      </div>
    `;

    // Клик по фону → отмена
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });

    // Кнопки
    overlay.querySelector("#confirm-cancel").addEventListener("click", () => close(false));
    overlay.querySelector("#confirm-ok").addEventListener("click", () => close(true));

    // Esc → отмена, Enter → ОК
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") close(false);
      if (e.key === "Enter")  close(true);
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function show(options = {}) {
    createOverlay();

    const {
      title       = "Подтверждение",
      text        = "",
      okText      = "OK",
      cancelText  = "Отмена",
      danger      = false
    } = options;

    overlay.querySelector(".confirm-title").textContent = title;
    overlay.querySelector(".confirm-text").textContent  = text;

    const okBtn     = overlay.querySelector("#confirm-ok");
    const cancelBtn = overlay.querySelector("#confirm-cancel");

    okBtn.textContent     = okText;
    cancelBtn.textContent = cancelText;

    // Стиль OK-кнопки
    okBtn.classList.toggle("btn-primary", !danger);
    okBtn.classList.toggle("btn-danger",  danger);

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    // Фокус на OK, чтобы можно было подтвердить Enter'ом
    setTimeout(() => okBtn.focus(), 50);

    return new Promise((resolve) => {
      resolveFn = resolve;
    });
  }

  function close(result) {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    if (resolveFn) {
      resolveFn(result);
      resolveFn = null;
    }
  }

  /* Упрощённый вызов: Confirm.ask("Удалить?") */
  function ask(text, options = {}) {
    return show({ text, ...options });
  }

  return { show, ask };
})();