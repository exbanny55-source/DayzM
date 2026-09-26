/* ============================================================
   GUI-редактор settings.json — выезжающая панель справа.
   FAB открывает, крестик закрывает. Всё на одной странице.
   ============================================================ */

(function () {
  const fab = document.getElementById("editor-fab");
  if (!fab) return;   // на страницах без FAB ничего не делаем

  /* -------------------- HTML панели -------------------- */

  const PANEL_HTML = `
    <div class="editor-panel" id="editor-panel" aria-hidden="true">
      <header class="editor-panel-header">
        <h2>Редактор настроек</h2>
      <div class="editor-panel-actions">
        <button class="btn btn-icon" id="btn-reload" type="button" title="Перезагрузить" aria-label="Перезагрузить">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>

        <button class="btn btn-icon btn-primary" id="btn-save" type="button" title="Сохранить" aria-label="Сохранить">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>

        <button class="btn btn-icon btn-ghost" id="btn-close" type="button" title="Закрыть" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      </header>

      <div class="editor-panel-body">
        <div id="editor-status" class="editor-status"></div>

        <form id="editor-form" class="editor-form" autocomplete="off">
          <!-- ФОН -->
          <details>
            <summary>Фон</summary>
            <div class="grid">
              <label>Тип
                <select name="background.type">
                  <option value="local">local</option>
                  <option value="url">url</option>
                </select>
              </label>
              <label>Источник
                <input type="text" name="background.source" />
              </label>
            </div>
            <h4>Анимация</h4>
            <div class="grid">
              <label class="check">
                <input type="checkbox" name="background.animation.enabled" />
                Включена
              </label>
              <label>Длительность (мс)
                <input type="number" name="background.animation.duration" min="1000" step="1000" />
              </label>
              <label>pos_from (%)
                <input type="number" name="background.animation.pos_from" min="0" max="100" />
              </label>
              <label>pos_to (%)
                <input type="number" name="background.animation.pos_to" min="0" max="100" />
              </label>
              <label>zoom from
                <input type="number" name="background.animation.zoom.from" step="0.05" min="0.1" />
              </label>
              <label>zoom to
                <input type="number" name="background.animation.zoom.to" step="0.05" min="0.1" />
              </label>
            </div>
          </details>

          <!-- РАМКА -->
          <details>
            <summary>Рамка</summary>
            <div class="grid">
              <label>Отступ (px)
                <input type="number" name="frame.margin" min="0" />
              </label>
              <label>Размытие (px)
                <input type="number" name="frame.blur" min="0" />
              </label>
              <label>Скругление (px)
                <input type="number" name="frame.border_radius" min="0" />
              </label>
              <label>Обводка (px)
                <input type="number" name="frame.border_width" min="0" />
              </label>
              <label>Цвет обводки
                <input type="text" name="frame.border_color" />
              </label>
              <label>Фон рамки
                <input type="text" name="frame.background" />
              </label>
              <label>Фон рамки
                <input type="text" name="frame.background" />
              </label>
              <label>Обводка FAB (px)
                <input type="number" name="frame.fab_border_width" min="0" />
              </label>
              <label>Цвет обводки FAB
                <input type="text" name="frame.fab_border_color" />
              </label>
              <label>Цвет иконки FAB
                <input type="text" name="frame.fab_icon_color" />
              </label>
            </div>
          </details>
          <!-- САЙДБАР -->
          <details>
            <summary>Сайдбар</summary>
            <div class="grid">
              <label>Заголовок
                <input type="text" name="sidebar.title" />
              </label>
              <label>Ширина (px)
                <input type="number" name="sidebar.width" min="0" />
              </label>
              <label>Фон
                <input type="text" name="sidebar.background" />
              </label>
              <label>Обводка (px)
                <input type="number" name="sidebar.border_width" min="0" />
              </label>
              <label>Цвет обводки
                <input type="text" name="sidebar.border_color" />
              </label>
            </div>
            <h4>Стиль пунктов меню</h4>
            <div class="grid">
              <label>Обводка (px)
                <input type="number" name="sidebar.menu_style.item_border_width" min="0" />
              </label>
              <label>Цвет обводки
                <input type="text" name="sidebar.menu_style.item_border_color" />
              </label>
              <label>Скругление (px)
                <input type="number" name="sidebar.menu_style.item_border_radius" min="0" />
              </label>
              <label>Обводка hover
                <input type="text" name="sidebar.menu_style.item_hover_border_color" />
              </label>
            </div>
          </details>

          <!-- ВЕРХНЕЕ МЕНЮ -->
          <details>
            <summary>Верхнее меню</summary>
            <div class="menu-editor" data-menu-path="sidebar.menu"></div>
            <button type="button" class="btn btn-add" data-add-to="sidebar.menu">+ Добавить пункт</button>
          </details>

          <!-- FOOTER -->
          <details>
            <summary>Нижний блок (footer)</summary>
            <div class="grid">
              <label>Фон
                <input type="text" name="sidebar.footer.background" />
              </label>
              <label>Обводка сверху (px)
                <input type="number" name="sidebar.footer.border_top_width" min="0" />
              </label>
              <label>Цвет обводки
                <input type="text" name="sidebar.footer.border_top_color" />
              </label>
            </div>
            <div class="menu-editor" data-menu-path="sidebar.footer.menu"></div>
            <button type="button" class="btn btn-add" data-add-to="sidebar.footer.menu">+ Добавить пункт</button>
          </details>
        </form>
      </div>
    </div>

    <div class="editor-backdrop" id="editor-backdrop"></div>
  `;

  // Вставляем панель и backdrop в body
  document.body.insertAdjacentHTML("beforeend", PANEL_HTML);

  const panel     = document.getElementById("editor-panel");
  const backdrop  = document.getElementById("editor-backdrop");
  const form      = document.getElementById("editor-form");
  const status    = document.getElementById("editor-status");
  const btnSave   = document.getElementById("btn-save");
  const btnReload = document.getElementById("btn-reload");
  const btnClose  = document.getElementById("btn-close");

  /* -------------------- Открытие/закрытие -------------------- */

  let isOpen = false;

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    backdrop.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    fab.classList.add("is-open");
    loadSettings();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    backdrop.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    fab.classList.remove("is-open");
    if (window.Palette) window.Palette.close();
  }

  fab.addEventListener("click", () => (isOpen ? closePanel() : openPanel()));
  btnClose.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closePanel();
  });

  /* -------------------- Утилиты -------------------- */

  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }

  function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!(key in acc)) acc[key] = {};
      return acc[key];
    }, obj);
    target[last] = value;
  }

  let statusTimer = null;
  function showStatus(msg, kind = "ok") {
    status.textContent = msg;
    status.className = "editor-status show " + kind;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.className = "editor-status";
    }, 3000);
  }

  /* -------------------- Загрузка -------------------- */

  let settings = null;

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      settings = await res.json();
      fillForm(settings);
    } catch (err) {
      showStatus("Ошибка загрузки: " + err.message, "err");
    }
  }

  function fillForm(data) {
    form.querySelectorAll("[name]").forEach((el) => {
      if (el.closest(".menu-editor")) return;
      const path = el.name;
      const value = getPath(data, path);
      if (el.type === "checkbox") el.checked = !!value;
      else if (value != null) el.value = value;
    });
    renderMenu("sidebar.menu");
    renderMenu("sidebar.footer.menu");
  }

  /* -------------------- Меню -------------------- */

  function renderMenu(path) {
    const container = form.querySelector(`.menu-editor[data-menu-path="${path}"]`);
    if (!container) return;

    container.innerHTML = "";
    const items = getPath(settings, path) || [];

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "menu-row";

      /* ---- Верхняя строка: чекбокс + заголовок + кнопки ---- */
      const top = document.createElement("div");
      top.className = "menu-top";

      const enabledWrap = document.createElement("div");
      enabledWrap.className = "menu-enabled";

      const enabled = document.createElement("input");
      enabled.type = "checkbox";
      enabled.checked = !!item.enabled;
      enabled.title = "Включено";
      enabled.addEventListener("change", () => { items[index].enabled = enabled.checked; });
      enabledWrap.appendChild(enabled);

      const title = document.createElement("span");
      title.className = "menu-title";
      title.textContent = item.label || "Без названия";
      enabledWrap.appendChild(title);

      const buttons = document.createElement("div");
      buttons.className = "menu-buttons";

      const up = document.createElement("button");
      up.type = "button";
      up.className = "menu-btn";
      up.textContent = "↑";
      up.title = "Вверх";
      up.disabled = index === 0;
      up.addEventListener("click", () => {
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
        renderMenu(path);
      });

      const down = document.createElement("button");
      down.type = "button";
      down.className = "menu-btn";
      down.textContent = "↓";
      down.title = "Вниз";
      down.disabled = index === items.length - 1;
      down.addEventListener("click", () => {
        [items[index + 1], items[index]] = [items[index], items[index + 1]];
        renderMenu(path);
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "menu-btn danger";
      del.textContent = "✕";
      del.title = "Удалить";
      del.addEventListener("click", () => {
        if (!confirm(`Удалить «${item.label || "без названия"}»?`)) return;
        items.splice(index, 1);
        renderMenu(path);
      });

      buttons.append(up, down, del);
      top.append(enabledWrap, buttons);

      /* ---- Поля: Название / Иконка / Страница ---- */
      const fields = document.createElement("div");
      fields.className = "menu-fields";

      const labelLbl = document.createElement("label");
      labelLbl.textContent = "Название";
      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.value = item.label || "";
      labelInput.placeholder = "Управление Сервером";
      labelInput.addEventListener("input", () => {
        items[index].label = labelInput.value;
        title.textContent = labelInput.value || "Без названия";
      });

      const iconLbl = document.createElement("label");
      iconLbl.textContent = "Иконка";
      const iconInput = document.createElement("input");
      iconInput.type = "text";
      iconInput.value = item.icon || "";
      iconInput.placeholder = "server / game / mod";
      iconInput.addEventListener("input", () => { items[index].icon = iconInput.value; });

      const pageLbl = document.createElement("label");
      pageLbl.textContent = "Страница";
      const pageInput = document.createElement("input");
      pageInput.type = "text";
      pageInput.value = item.page || "";
      pageInput.placeholder = "servers / game / mods";
      pageInput.addEventListener("input", () => { items[index].page = pageInput.value; });

      fields.append(labelLbl, labelInput, iconLbl, iconInput, pageLbl, pageInput);

      row.append(top, fields);
      container.appendChild(row);
    });

    // Привязываем палитру ко всем «цветовым» полям меню (если появятся)
    attachPaletteTo(container.querySelectorAll('input[data-color="true"]'));
  }

  form.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.addTo;
      if (!path) return;
      let arr = getPath(settings, path);
      if (!Array.isArray(arr)) {
        setPath(settings, path, []);
        arr = getPath(settings, path);
      }
      arr.push({ enabled: true, label: "Новый пункт", icon: "", page: "" });
      renderMenu(path);
    });
  });

  /* -------------------- Палитра цветов -------------------- */

  // Привязать палитру к цветовым полям.
  // Поля определяются по имени (например, sidebar.background) —
  // это те поля, где ожидается цвет.
  const COLOR_FIELDS = [
    "frame.border_color",
    "frame.background",
    "frame.fab_border_color",
    "frame.fab_icon_color",
    "sidebar.background",
    "sidebar.border_color",
    "sidebar.menu_style.item_border_color",
    "sidebar.menu_style.item_hover_border_color",
    "sidebar.footer.background",
    "sidebar.footer.border_top_color"
  ];

  function attachPaletteTo(elements) {
    if (!window.Palette) return;
    elements.forEach((el) => {
      if (!el || el.dataset.paletteAttached === "true") return;
      window.Palette.attachTo(el);
      el.dataset.paletteAttached = "true";
    });
  }

  function attachColorFields() {
    const inputs = COLOR_FIELDS
      .map((name) => form.querySelector(`input[name="${name}"]`))
      .filter(Boolean);
    attachPaletteTo(inputs);
  }

  /* -------------------- Сборка и сохранение -------------------- */

  function collectForm() {
    const data = JSON.parse(JSON.stringify(settings));

    form.querySelectorAll("[name]").forEach((el) => {
      if (el.closest(".menu-editor")) return;
      const path = el.name;
      let value;
      if (el.type === "checkbox") value = el.checked;
      else if (el.type === "number") value = el.value === "" ? null : Number(el.value);
      else value = el.value;
      setPath(data, path, value);
    });

    setPath(data, "sidebar.menu",
      JSON.parse(JSON.stringify(getPath(settings, "sidebar.menu") || [])));
    setPath(data, "sidebar.footer.menu",
      JSON.parse(JSON.stringify(getPath(settings, "sidebar.footer.menu") || [])));

    return data;
  }

  async function save() {
    const data = collectForm();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error || `HTTP ${res.status}`);
      settings = data;
      showStatus("Сохранено. Обновите страницу (Ctrl+F5) для применения.", "ok");
    } catch (err) {
      showStatus("Ошибка сохранения: " + err.message, "err");
    }
  }

  btnSave.addEventListener("click", save);
  btnReload.addEventListener("click", () => {
    if (!confirm("Перезагрузить настройки из файла? Несохранённые изменения будут потеряны.")) return;
    loadSettings();
  });

  /* -------------------- Старт -------------------- */

  // Даём DOM построиться и привязываем палитру к цветовым полям
  setTimeout(attachColorFields, 0);
})();