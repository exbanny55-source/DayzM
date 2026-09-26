/* ============================================================
   Страница «Настройки» — управление путями к папкам DayZ.
   Загружает /api/paths, строит форму, сохраняет /api/paths (POST).
   Для выбора папки/файла вызывает /api/pick-path (Tkinter).
   ============================================================ */

(function () {
  "use strict";

  function initPage() {
    const form      = document.getElementById("paths-form");
    const fieldsBox = document.getElementById("paths-fields");
    const status    = document.getElementById("paths-status");
    const btnSave   = document.getElementById("paths-save");
    const btnReset  = document.getElementById("paths-reset");

    if (!form || !fieldsBox) return;

    // ---- Локальное состояние (живёт только пока страница в DOM) ----
    let fieldsMeta = [];
    let values = {};
    let statusTimer = null;

    /* ---------- Статус-бар ---------- */

    function showStatus(msg, kind = "ok") {
      if (!status) return;
      status.textContent = msg;
      status.className = "paths-status show " + kind;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
        status.className = "paths-status";
      }, 3500);
    }

    /* ---------- Отрисовка полей ---------- */

    function renderFields() {
      fieldsBox.innerHTML = "";

      fieldsMeta.forEach((meta) => {
        const row = document.createElement("div");
        row.className = "paths-row";

        const label = document.createElement("label");
        label.className = "paths-row-label";
        label.textContent = meta.label;
        label.htmlFor = "path-" + meta.key;

        const desc = document.createElement("p");
        desc.className = "paths-row-desc";
        desc.textContent = meta.description || "";

        const inputWrap = document.createElement("div");
        inputWrap.className = "paths-row-input";

        const input = document.createElement("input");
        input.type = "text";
        input.id = "path-" + meta.key;
        input.name = meta.key;
        input.value = values[meta.key] || "";
        input.placeholder = meta.type === "file" ? "C:\\...\\DayZ_x64.exe" : "C:\\...";
        input.dataset.key = meta.key;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost paths-browse";
        btn.textContent = "📁 Обзор";
        btn.title = meta.type === "file" ? "Выбрать файл" : "Выбрать папку";

        btn.addEventListener("click", () => pickPath(meta, input));

        inputWrap.append(input, btn);
        row.append(label, desc, inputWrap);
        fieldsBox.appendChild(row);
      });
    }

    /* ---------- Выбор пути через Tkinter ---------- */

    async function pickPath(meta, input) {
      try {
        const payload = {
          type: meta.type || "dir",
          initial: input.value || ""
        };
        if (meta.type === "file" && meta.filetypes) {
          const exts = meta.filetypes
            .flatMap((t) => (t[1] || "").split(";"))
            .map((s) => s.trim())
            .filter((s) => s.startsWith("*."));
          if (exts.length) payload.filetypes = exts.join(",");
        }

        const res = await fetch("/api/pick-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

        if (data.path) {
          input.value = data.path;
          values[meta.key] = data.path;
        }
      } catch (err) {
        showStatus("Ошибка выбора пути: " + err.message, "err");
      }
    }

    /* ---------- Загрузка списка путей ---------- */

    async function loadPaths() {
      try {
        const res = await fetch("/api/paths");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        values = data.values || {};
        fieldsMeta = data.fields || [];

        renderFields();
      } catch (err) {
        fieldsBox.innerHTML = `<p class="paths-error">Ошибка загрузки: ${err.message}</p>`;
      }
    }

    /* ---------- Сохранение ---------- */

    async function savePaths() {
      const data = {};
      fieldsBox.querySelectorAll("input[data-key]").forEach((inp) => {
        data[inp.dataset.key] = inp.value.trim();
      });

      try {
        const res = await fetch("/api/paths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok || !result.ok) throw new Error(result.error || `HTTP ${res.status}`);

        showStatus("Пути сохранены в paths.json", "ok");
      } catch (err) {
        showStatus("Ошибка сохранения: " + err.message, "err");
      }
    }

    /* ---------- Сброс ---------- */

    async function resetFields() {
      const ok = await Confirm.show({
        title: "Очистить все поля?",
        text: "Файл paths.json изменится только после сохранения.",
        okText: "Очистить",
        cancelText: "Отмена",
        danger: true
      });
      if (!ok) return;

      fieldsBox.querySelectorAll("input[data-key]").forEach((inp) => {
        inp.value = "";
      });
    }

    /* ---------- Привязка кнопок ---------- */

    btnSave.addEventListener("click", savePaths);
    btnReset.addEventListener("click", resetFields);

    /* ---------- Загружаем данные ---------- */

    loadPaths();
  }

  /* ---------- Хук на событие SPA ---------- */

  document.addEventListener("spa:page-loaded", (e) => {
    if (e.detail && e.detail.page === "settings") {
      initPage();
    }
  });

  // Если index.html сразу открыт на #settings
  if (location.hash === "#settings") {
    setTimeout(initPage, 100);
  }
})();