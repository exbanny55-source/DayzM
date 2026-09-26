/* ============================================================
   Страница «Музыка» — список треков + глобальный плеер.

   - <audio> живёт ВНЕ SPA (в index.html) → SPA-переходы не рвут звук.
   - Плеер — единый объект Player.
   - Страница подписывается на player:* события и отписывается при уходе.
   - Клик по строке — перемотка. Drag — плавная перемотка.
   - Автоплей следующего трека после ended (циклично).
   - Таймеры: прошло / всего. Прогресс — фоновая заливка (--progress).
   - При переключении трека прогресс старого сбрасывается (player:switching).
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     Глобальный плеер
     ============================================================ */

  const Player = {
    audio: null,
    currentTrackFile: null,
    initialized: false,
    _pendingPlay: null,

    init() {
      if (this.initialized) return;
      this.audio = document.getElementById("music-audio");
      if (!this.audio) {
        console.warn("[player] <audio#music-audio> не найден");
        return;
      }
      this.initialized = true;
      this._attachAudioListeners();
    },

    _attachAudioListeners() {
      const audio = this.audio;

      audio.addEventListener("play", () => {
        document.dispatchEvent(new CustomEvent("player:play", {
          detail: { file: this.currentTrackFile }
        }));
      });

      audio.addEventListener("pause", () => {
        document.dispatchEvent(new CustomEvent("player:pause", {
          detail: { file: this.currentTrackFile }
        }));
      });

      audio.addEventListener("timeupdate", () => {
        document.dispatchEvent(new CustomEvent("player:timeupdate", {
          detail: {
            file: this.currentTrackFile,
            currentTime: audio.currentTime,
            duration: audio.duration || 0
          }
        }));
      });

      audio.addEventListener("loadedmetadata", () => {
        document.dispatchEvent(new CustomEvent("player:loadedmetadata", {
          detail: {
            file: this.currentTrackFile,
            duration: audio.duration || 0
          }
        }));
      });

      audio.addEventListener("ended", () => {
        const file = this.currentTrackFile;
        this.currentTrackFile = null;
        document.dispatchEvent(new CustomEvent("player:ended", {
          detail: { file }
        }));
      });

      audio.addEventListener("error", () => {
        if (!audio.src) return;
        document.dispatchEvent(new CustomEvent("player:error", {
          detail: { file: this.currentTrackFile }
        }));
      });
    },

    /* ---------- Управление ---------- */

    play(file) {
      if (!this.audio) return;

      // Уведомить UI: переключаемся со старого трека
      const previous = this.currentTrackFile;
      if (previous && previous !== file) {
        document.dispatchEvent(new CustomEvent("player:switching", {
          detail: { from: previous, to: file }
        }));
      }

      this.currentTrackFile = file;
      this.audio.src = `/api/music/stream/${encodeURIComponent(file)}`;
      this._pendingPlay = null;

      const promise = this.audio.play();
      this._pendingPlay = promise;

      promise
        .then(() => {
          if (this._pendingPlay === promise) this._pendingPlay = null;
        })
        .catch((err) => {
          if (err && err.name === "AbortError") return;
          if (err && /interrupted by a call to pause/i.test(err.message || "")) return;
          if (err && /new load request/i.test(err.message || "")) return;

          console.error("[player] play error:", err);
          document.dispatchEvent(new CustomEvent("player:error", {
            detail: { file, error: err.message }
          }));
        });
    },

    resume() {
      if (!this.audio) return;
      const promise = this.audio.play();
      this._pendingPlay = promise;
      promise.catch((err) => {
        if (err && err.name === "AbortError") return;
        if (err && /interrupted/i.test(err.message || "")) return;
        if (err && /new load request/i.test(err.message || "")) return;
        console.error("[player] resume error:", err);
      });
    },

    pause() {
      if (!this.audio) return;

      if (this._pendingPlay) {
        try { this.audio.pause(); } catch (_) {}
        this._pendingPlay = null;
        return;
      }

      this.audio.pause();
    },

    stop() {
      if (!this.audio) return;
      this._pendingPlay = null;
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.currentTrackFile = null;
      document.dispatchEvent(new CustomEvent("player:stop"));
    },

    toggle(file) {
      if (!this.audio) return;

      if (this.currentTrackFile === file && !this.audio.paused) {
        this.pause();
        return;
      }

      if (this.currentTrackFile === file && this.audio.paused && this.audio.src) {
        this.resume();
        return;
      }

      this.play(file);
    },

    isPlaying(file) {
      return this.currentTrackFile === file && this.audio && !this.audio.paused;
    },

    isCurrent(file) {
      return this.currentTrackFile === file;
    }
  };

  Player.init();
  window.MusicPlayer = Player;


  /* ============================================================
     Страница музыки
     ============================================================ */

  function initPage() {
    const listBox    = document.getElementById("music-list");
    const statusBox  = document.getElementById("music-status");
    const btnRefresh = document.getElementById("music-refresh");
    if (!listBox) return;

    let statusTimer = null;
    let trackList = [];

    /* ---------- Статус ---------- */

    function showStatus(msg, kind = "ok") {
      if (!statusBox) return;
      statusBox.textContent = msg;
      statusBox.className = "music-status show " + kind;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
        statusBox.className = "music-status";
      }, 3500);
    }

    /* ---------- Время ---------- */

    function formatTime(seconds) {
      if (!isFinite(seconds) || seconds < 0) return "--:--";
      const s = Math.floor(seconds);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      }
      return `${m}:${String(sec).padStart(2, "0")}`;
    }

    /* ---------- SVG ---------- */

    const SVG_NS = "http://www.w3.org/2000/svg";

    function makeIcon(iconName, className) {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", className);
      svg.setAttribute("aria-hidden", "true");
      const use = document.createElementNS(SVG_NS, "use");
      use.setAttribute("href", `/static/icons/icons.svg#icon-${iconName}`);
      svg.appendChild(use);
      return svg;
    }

    function setButtonIcon(btn, iconName) {
      const old = btn.querySelector("svg.music-track-play-icon");
      if (old) old.remove();
      btn.appendChild(makeIcon(iconName, "music-track-play-icon"));
      btn.title = iconName === "pause" ? "Пауза" : "Воспроизвести";
    }

    /* ---------- Рендер ---------- */

    function renderEmpty(reason) {
      listBox.innerHTML = `<p class="music-empty">${reason}</p>`;
    }

    function renderTracks(data) {
      if (!data.tracks || data.tracks.length === 0) {
        renderEmpty("В папке нет аудиофайлов.");
        trackList = [];
        return;
      }

      trackList = data.tracks.map((t) => t.file);

      const ul = document.createElement("ul");
      ul.className = "music-tracks";

      data.tracks.forEach((track, i) => {
        const li = document.createElement("li");
        li.className = "music-track";
        li.dataset.file = track.file;

        const num = document.createElement("span");
        num.className = "music-track-num";
        num.textContent = String(i + 1).padStart(2, "0");

        const playBtn = document.createElement("button");
        playBtn.type = "button";
        playBtn.className = "music-track-play";
        playBtn.title = "Воспроизвести";
        playBtn.setAttribute("aria-label", "Воспроизвести");
        playBtn.appendChild(makeIcon("play", "music-track-play-icon"));
        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          Player.toggle(track.file);
        });

        const noteIcon = makeIcon("music", "music-track-icon");

        const info = document.createElement("div");
        info.className = "music-track-info";

        const title = document.createElement("div");
        title.className = "music-track-title";
        title.textContent = track.name;
        title.title = track.file;

        const meta = document.createElement("div");
        meta.className = "music-track-meta";
        meta.textContent = `${track.ext.toUpperCase()} · ${track.size}`;

        const time = document.createElement("div");
        time.className = "music-track-time";

        const totalLabel = (track.duration && track.duration > 0)
          ? formatTime(track.duration)
          : "--:--";

        time.innerHTML =
          `<span class="time-current">0:00</span>` +
          `<span class="time-sep">/</span>` +
          `<span class="time-total">${totalLabel}</span>`;

        const metaRow = document.createElement("div");
        metaRow.className = "music-track-info-meta-row";
        metaRow.append(meta, time);

        info.append(title, metaRow);

        li.append(num, playBtn, noteIcon, info);
        ul.appendChild(li);
      });

      listBox.innerHTML = "";
      listBox.appendChild(ul);

      syncUIWithPlayer();
      attachSeekHandlers();
    }

    /* ---------- Перемотка ---------- */

    function attachSeekHandlers() {
      listBox.querySelectorAll(".music-track").forEach((li) => {
        const file = li.dataset.file;

        li.addEventListener("click", (e) => {
          if (e.target.closest(".music-track-play")) return;

          if (!Player.isCurrent(file)) {
            Player.toggle(file);
            return;
          }
          seekFromEvent(e, li);
        });

        li.addEventListener("mousedown", (e) => {
          if (e.target.closest(".music-track-play")) return;
          if (!Player.isCurrent(file)) return;
          if (e.button !== 0) return;

          e.preventDefault();
          const audio = Player.audio;
          if (!audio || !audio.duration || !isFinite(audio.duration)) return;

          const wasPlaying = !audio.paused;
          if (wasPlaying) audio.pause();

          const onMove = (ev) => seekFromEvent(ev, li);
          const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            if (wasPlaying) audio.play().catch(() => {});
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
      });
    }

    function seekFromEvent(e, li) {
      const audio = Player.audio;
      if (!audio || !audio.duration || !isFinite(audio.duration)) return;

      const rect = li.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));

      const percent = x / rect.width;
      const newTime = percent * audio.duration;

      audio.currentTime = newTime;

      li.style.setProperty("--progress", (percent * 100).toFixed(2) + "%");
      const curEl = li.querySelector(".time-current");
      if (curEl) curEl.textContent = formatTime(newTime);
    }

    /* ---------- Иконки/подсветка ---------- */

    function setButtonIconOn(file, iconName) {
      const btn = listBox.querySelector(
        `.music-track[data-file="${CSS.escape(file)}"] .music-track-play`
      );
      if (btn) setButtonIcon(btn, iconName);
    }

    function setAllButtonsTo(iconName) {
      listBox.querySelectorAll(".music-track-play").forEach((btn) => {
        setButtonIcon(btn, iconName);
      });
    }

    function clearPlayingClass() {
      listBox.querySelectorAll(".music-track").forEach((li) => {
        li.classList.remove("is-playing");
      });
    }

    function markPlaying(file) {
      clearPlayingClass();
      const li = listBox.querySelector(`.music-track[data-file="${CSS.escape(file)}"]`);
      if (li) li.classList.add("is-playing");
    }

    function resetTrackProgress(file) {
      if (!file) return;
      const li = listBox.querySelector(`.music-track[data-file="${CSS.escape(file)}"]`);
      if (!li) return;

      // 1) Включаем «растворение» — полоса плавно гаснет
      li.classList.add("resetting");

      // 2) Ждём окончания fade-out (300 мс, как в CSS)
      setTimeout(() => {
        // Пока невидима — мгновенно обнуляем ширину
        li.style.setProperty("--progress", "0%");

        const curEl = li.querySelector(".time-current");
        if (curEl) curEl.textContent = "0:00";

        // 3) Возвращаем полосу (opacity → 1) — теперь она шириной 0%
        requestAnimationFrame(() => {
          requestAnimationFrame(() => li.classList.remove("resetting"));
        });
      }, 300);
    }
    
    function syncUIWithPlayer() {
      const file = Player.currentTrackFile;
      const audio = Player.audio;

      clearPlayingClass();
      setAllButtonsTo("play");

      if (!file || !audio) return;

      const li = listBox.querySelector(`.music-track[data-file="${CSS.escape(file)}"]`);
      if (!li) return;

      li.classList.add("is-playing");
      setButtonIconOn(file, audio.paused ? "play" : "pause");

      const curEl = li.querySelector(".time-current");
      const totEl = li.querySelector(".time-total");
      if (curEl) curEl.textContent = formatTime(audio.currentTime);
      if (totEl && audio.duration && isFinite(audio.duration)) {
        totEl.textContent = formatTime(audio.duration);
      }
      if (audio.duration && isFinite(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        li.style.setProperty("--progress", percent.toFixed(2) + "%");
      }
    }

    /* ---------- Автоплей ---------- */

    function getNextTrackFile(currentFile) {
      if (!trackList.length) return null;
      const idx = trackList.indexOf(currentFile);
      if (idx === -1) return trackList[0];
      return trackList[(idx + 1) % trackList.length];
    }

    /* ---------- События плеера ---------- */

    function onPlay(e) {
      if (!listBox.isConnected) return;
      setAllButtonsTo("play");
      if (e.detail.file) {
        setButtonIconOn(e.detail.file, "pause");
        markPlaying(e.detail.file);
      }
    }

    function onPause(e) {
      if (!listBox.isConnected) return;
      if (e.detail.file) setButtonIconOn(e.detail.file, "play");
    }

    function onTimeUpdate(e) {
      if (!listBox.isConnected) return;
      const file = e.detail.file;
      if (!file) return;

      const li = listBox.querySelector(`.music-track[data-file="${CSS.escape(file)}"]`);
      if (!li) return;

      const curEl = li.querySelector(".time-current");
      const totEl = li.querySelector(".time-total");
      if (curEl) curEl.textContent = formatTime(e.detail.currentTime);
      if (totEl && e.detail.duration && isFinite(e.detail.duration)) {
        totEl.textContent = formatTime(e.detail.duration);
      }
      if (e.detail.duration && isFinite(e.detail.duration)) {
        const percent = (e.detail.currentTime / e.detail.duration) * 100;
        li.style.setProperty("--progress", percent.toFixed(2) + "%");
      }
    }

    function onLoadedMetadata(e) {
      if (!listBox.isConnected) return;
      const file = e.detail.file;
      if (!file) return;
      const li = listBox.querySelector(`.music-track[data-file="${CSS.escape(file)}"]`);
      if (!li) return;

      const totEl = li.querySelector(".time-total");
      if (totEl && totEl.textContent === "--:--" && e.detail.duration && isFinite(e.detail.duration)) {
        totEl.textContent = formatTime(e.detail.duration);
      }
    }

    function onSwitching(e) {
      if (!listBox.isConnected) return;
      // Сбросить прогресс и текущее время у трека, с которого уходим
      resetTrackProgress(e.detail.from);
    }

    function onEnded(e) {
      if (!listBox.isConnected) return;

      const finishedFile = e.detail.file;

      // Если следующий трек НЕ запустится — надо сбросить вручную.
      // Если запустится — Player.play() сгенерирует player:switching,
      // и сброс произойдёт там.
      const nextFile = getNextTrackFile(finishedFile);

      if (!nextFile) {
        resetTrackProgress(finishedFile);
        setAllButtonsTo("play");
        clearPlayingClass();
        return;
      }

      Player.play(nextFile);
    }

    function onError(e) {
      if (!listBox.isConnected) return;
      const detail = e.detail || {};
      if (detail.error && /abort|interrupted|new load request/i.test(detail.error)) {
        return;
      }
      const msg = detail.error ? "Ошибка: " + detail.error : "Ошибка воспроизведения";
      showStatus(msg, "err");
    }

    document.addEventListener("player:play", onPlay);
    document.addEventListener("player:pause", onPause);
    document.addEventListener("player:timeupdate", onTimeUpdate);
    document.addEventListener("player:loadedmetadata", onLoadedMetadata);
    document.addEventListener("player:switching", onSwitching);
    document.addEventListener("player:ended", onEnded);
    document.addEventListener("player:error", onError);

    function cleanup() {
      document.removeEventListener("player:play", onPlay);
      document.removeEventListener("player:pause", onPause);
      document.removeEventListener("player:timeupdate", onTimeUpdate);
      document.removeEventListener("player:loadedmetadata", onLoadedMetadata);
      document.removeEventListener("player:switching", onSwitching);
      document.removeEventListener("player:ended", onEnded);
      document.removeEventListener("player:error", onError);
    }

    document.addEventListener("spa:page-unloading", (e) => {
      if (e.detail && e.detail.page === "music") cleanup();
    });

    /* ---------- Загрузка списка ---------- */

    async function loadTracks(forceRefresh = false) {
      listBox.innerHTML = `<p class="music-loading">Загрузка списка…</p>`;

      try {
        const url = forceRefresh
          ? "/api/music/list?refresh=1"
          : "/api/music/list";

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.error) {
          renderEmpty(data.error);
          showStatus(data.error, "err");
          return;
        }

        renderTracks(data);
      } catch (err) {
        renderEmpty("Ошибка загрузки: " + err.message);
        showStatus("Ошибка загрузки: " + err.message, "err");
      }
    }

    /* ---------- Ссылки с data-page внутри страницы ---------- */

    document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
      if (link.closest(".sidebar-nav")) return;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetPage = link.dataset.page;
        const navLink = document.querySelector(
          `.sidebar-nav .nav-link[data-page="${targetPage}"]`
        );
        if (navLink) navLink.click();
      });
    });

    /* ---------- Кнопка «Обновить» ---------- */

    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => loadTracks(true));
    }

    /* ---------- Старт ---------- */

    loadTracks(false);
  }

  /* ---------- Хук SPA ---------- */

  document.addEventListener("spa:page-loaded", (e) => {
    if (e.detail && e.detail.page === "music") initPage();
  });

  if (location.hash === "#music") {
    setTimeout(initPage, 100);
  }
})();