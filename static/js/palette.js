/* ============================================================
   Палитра цветов для редактора настроек.

   - Открывается по центру экрана как модальное окно.
   - Клик по цвету подставляет значение в input.
   - Клик по фону / Esc / кнопка "Закрыть" — закрывают.

   API:
     Palette.attachTo(input)   — привязать к input (клик/фокус открывает)
     Palette.openAt(input)     — открыть вручную
     Palette.close()           — закрыть
   ============================================================ */

window.Palette = (function () {
  "use strict";

  /* -------------------- Наборы цветов -------------------- */

  const PALETTES = {
    "Стекло": [
      "transparent",
      "rgba(255, 255, 255, 0.02)",
      "rgba(255, 255, 255, 0.04)",
      "rgba(255, 255, 255, 0.06)",
      "rgba(255, 255, 255, 0.08)",
      "rgba(255, 255, 255, 0.12)",
      "rgba(255, 255, 255, 0.16)",
      "rgba(255, 255, 255, 0.20)",
      "rgba(255, 255, 255, 0.30)",
      "rgba(255, 255, 255, 0.40)",
      "rgba(255, 255, 255, 0.50)",
      "rgba(255, 255, 255, 0.70)",
      "rgba(0, 0, 0, 0.10)",
      "rgba(0, 0, 0, 0.20)",
      "rgba(0, 0, 0, 0.30)",
      "rgba(0, 0, 0, 0.40)",
      "rgba(0, 0, 0, 0.55)",
      "rgba(0, 0, 0, 0.70)",
      "rgba(20, 20, 25, 0.55)",
      "rgba(16, 21, 61, 0.25)"
    ],
    "Нейтральные": [
      "#000000",
      "#0a0a0a",
      "#141414",
      "#1e1e1e",
      "#282828",
      "#333333",
      "#404040",
      "#4d4d4d",
      "#5c5c5c",
      "#6b6b6b",
      "#808080",
      "#999999",
      "#b3b3b3",
      "#cccccc",
      "#e0e0e0",
      "#f0f0f0",
      "#ffffff"
    ],
    "Фиолетовый акцент": [
      "#3d2d80",
      "#4f3ba0",
      "#6148c0",
      "#7356db",
      "#8568f0",
      "#a996fd",
      "#b9aaff",
      "#c4b5fd",
      "#d4caff",
      "#e0d8ff",
      "rgba(169, 150, 253, 0.15)",
      "rgba(169, 150, 253, 0.25)",
      "rgba(169, 150, 253, 0.35)",
      "rgba(169, 150, 253, 0.5)",
      "rgba(169, 150, 253, 0.65)",
      "rgba(169, 150, 253, 0.8)",
      "rgba(169, 150, 253, 1)"
    ],
    "Синий акцент": [
      "#1a3a80",
      "#2550a8",
      "#3166d0",
      "#417cff",
      "#5c8dff",
      "#7aa3ff",
      "#93b9ff",
      "#b3d4ff",
      "#d4e4ff",
      "rgba(92, 141, 255, 0.15)",
      "rgba(92, 141, 255, 0.25)",
      "rgba(92, 141, 255, 0.35)",
      "rgba(92, 141, 255, 0.5)",
      "rgba(92, 141, 255, 0.65)",
      "rgba(92, 141, 255, 0.8)",
      "rgba(92, 141, 255, 1)"
    ],
    "Красный / розовый": [
      "#7a1a1a",
      "#a82525",
      "#d03131",
      "#ff4040",
      "#ff5c5c",
      "#ff7a7a",
      "#ff9999",
      "#ffb8b8",
      "#ffd4d4",
      "#ff1a8c",
      "#ff4dab",
      "#ff80c4",
      "rgba(255, 100, 100, 0.2)",
      "rgba(255, 100, 100, 0.35)",
      "rgba(255, 100, 100, 0.5)",
      "rgba(255, 100, 100, 0.7)"
    ],
    "Зелёный": [
      "#1a4d1a",
      "#267326",
      "#339933",
      "#40c040",
      "#5ccc5c",
      "#7ec87e",
      "#9dd99d",
      "#b8e6b8",
      "#d4f0d4",
      "rgba(120, 200, 120, 0.2)",
      "rgba(120, 200, 120, 0.35)",
      "rgba(120, 200, 120, 0.5)",
      "rgba(120, 200, 120, 0.7)"
    ],
    "Жёлтый / оранжевый": [
      "#4d3d00",
      "#7a6200",
      "#b38f00",
      "#e0b800",
      "#ffcc00",
      "#ffd633",
      "#ffe066",
      "#ffec99",
      "#ff9900",
      "#ffab33",
      "#ffc266",
      "rgba(255, 180, 60, 0.3)",
      "rgba(255, 180, 60, 0.5)",
      "rgba(255, 180, 60, 0.7)"
    ],
    "Бирюзовый": [
      "#004d4d",
      "#007a7a",
      "#00a8a8",
      "#00d6d6",
      "#33e6e6",
      "#66eeee",
      "#99f3f3",
      "#ccf9f9",
      "rgba(0, 180, 180, 0.3)",
      "rgba(0, 180, 180, 0.5)",
      "rgba(0, 180, 180, 0.7)"
    ],
    "Готовые обводки": [
      "rgba(255, 255, 255, 0.1)",
      "rgba(255, 255, 255, 0.15)",
      "rgba(255, 255, 255, 0.25)",
      "rgba(255, 255, 255, 0.35)",
      "rgba(255, 255, 255, 0.5)",
      "rgba(169, 150, 253, 0.35)",
      "rgba(169, 150, 253, 0.5)",
      "rgba(92, 141, 255, 0.5)",
      "rgba(255, 100, 100, 0.5)",
      "rgba(120, 200, 120, 0.5)",
      "rgba(255, 180, 60, 0.5)",
      "rgba(0, 180, 180, 0.5)"
    ],
    "Готовые фоны рамки": [
      "rgba(16, 21, 61, 0.25)",
      "rgba(20, 20, 25, 0.55)",
      "rgba(0, 0, 0, 0.3)",
      "rgba(0, 0, 0, 0.5)",
      "rgba(255, 255, 255, 0.03)",
      "rgba(255, 255, 255, 0.06)",
      "rgba(169, 150, 253, 0.08)",
      "rgba(92, 141, 255, 0.08)",
      "rgba(0, 180, 180, 0.06)",
      "rgba(255, 100, 100, 0.06)"
    ]
  };

  /* -------------------- Создание модалки -------------------- */

  let overlay = null;
  let targetInput = null;
  let onPickCallback = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "palette-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="palette-modal" role="dialog" aria-modal="true">
        <header class="palette-modal-header">
          <h3>Выбор цвета</h3>
          <button type="button" class="palette-modal-close" aria-label="Закрыть">✕</button>
        </header>
        <div class="palette-modal-current">
          <span>Текущее:</span>
          <span class="palette-current-swatch" id="palette-current-swatch"></span>
          <code id="palette-current-value"></code>
        </div>
        <div class="palette-modal-body"></div>
        <footer class="palette-modal-footer">
          <label class="palette-custom">
            <span>Свой цвет:</span>
            <input type="text" id="palette-custom-input" placeholder="rgba(...) или #hex" />
            <button type="button" class="btn btn-primary" id="palette-custom-apply">Применить</button>
          </label>
        </footer>
      </div>
    `;

    // Клик по фону → закрыть
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // Кнопка ✕
    overlay.querySelector(".palette-modal-close")
      .addEventListener("click", close);

    // Esc → закрыть
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });

    // Кастомный ввод
    const customInput = overlay.querySelector("#palette-custom-input");
    const customApply = overlay.querySelector("#palette-custom-apply");
    customApply.addEventListener("click", () => {
      const value = customInput.value.trim();
      if (!value) return;
      pick(value);
    });
    customInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        customApply.click();
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function buildContent() {
    const body = overlay.querySelector(".palette-modal-body");
    body.innerHTML = "";

    Object.entries(PALETTES).forEach(([title, colors]) => {
      const section = document.createElement("div");
      section.className = "palette-section";

      const heading = document.createElement("div");
      heading.className = "palette-section-title";
      heading.textContent = title;
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "palette-grid";

      colors.forEach((color) => {
        const swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = "palette-swatch";
        swatch.title = color;

        // Специальный случай: transparent или rgba → рисуем шахматку под цветом
        if (color === "transparent" || color.startsWith("rgba")) {
          swatch.classList.add("palette-swatch-checker");
          const layer = document.createElement("span");
          layer.className = "palette-swatch-layer";
          layer.style.background = color;
          swatch.appendChild(layer);
        } else {
          swatch.style.background = color;
        }

        swatch.addEventListener("click", () => pick(color));
        grid.appendChild(swatch);
      });

      section.appendChild(grid);
      body.appendChild(section);
    });
  }

  function updateCurrentPreview() {
    const swatchEl = overlay.querySelector("#palette-current-swatch");
    const valueEl = overlay.querySelector("#palette-current-value");
    const value = targetInput ? targetInput.value : "";

    if (value === "transparent" || value.startsWith("rgba")) {
      swatchEl.className = "palette-current-swatch palette-swatch-checker";
      swatchEl.innerHTML = `<span class="palette-swatch-layer" style="background:${value}"></span>`;
    } else {
      swatchEl.className = "palette-current-swatch";
      swatchEl.style.background = value;
      swatchEl.textContent = "";
    }
    valueEl.textContent = value;
    overlay.querySelector("#palette-custom-input").value = value;
  }

  function pick(color) {
    if (targetInput) {
      targetInput.value = color;
      targetInput.dispatchEvent(new Event("input", { bubbles: true }));
      targetInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (onPickCallback) onPickCallback(color);
    close();
  }

  /* -------------------- Публичные методы -------------------- */

  function openAt(input, callback) {
    createOverlay();
    buildContent();
    targetInput = input;
    onPickCallback = callback || null;
    updateCurrentPreview();

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    // Фокус на кастомное поле — чтобы сразу можно было ввести свой цвет
    setTimeout(() => {
      const customInput = overlay.querySelector("#palette-custom-input");
      if (customInput) customInput.focus();
    }, 100);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    targetInput = null;
    onPickCallback = null;
  }

  function attachTo(input, callback) {
    if (!input) return;
    input.classList.add("palette-input");
    input.addEventListener("focus", () => openAt(input, callback));
    input.addEventListener("click", () => openAt(input, callback));
  }

  /* -------------------- API -------------------- */

  return {
    PALETTES,
    openAt,
    close,
    attachTo
  };
})();