/* ============================================================
   1. Анимация фона с замиранием при неактивной вкладке
   ============================================================ */

(function () {
  const body = document.body;

  const BG = {
    enabled:  body.dataset.bgEnabled === "True" || body.dataset.bgEnabled === "true",
    duration: parseFloat(body.dataset.bgDuration)  || 120000,
    posFrom:  parseFloat(body.dataset.bgPosFrom)   || 20,
    posTo:    parseFloat(body.dataset.bgPosTo)     || 100,
    zoomFrom: parseFloat(body.dataset.bgZoomFrom)  || 1.0,
    zoomTo:   parseFloat(body.dataset.bgZoomTo)    || 1.4
  };

  if (!BG.enabled) return;

  const startTime = Date.now();
  let pausedTotal = 0;
  let pausedAt = null;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausedAt = Date.now();
    } else if (pausedAt !== null) {
      pausedTotal += Date.now() - pausedAt;
      pausedAt = null;
    }
  });

  const smoothstep = (t) => t * t * (3 - 2 * t);

  function animateBackground() {
    const now = (pausedAt !== null) ? pausedAt : Date.now();
    const elapsed = now - startTime - pausedTotal;

    const cycle = BG.duration * 2;
    let t = (elapsed % cycle) / cycle;
    t = t <= 0.5 ? t * 2 : (1 - t) * 2;
    const eased = smoothstep(t);

    const pos  = BG.posFrom  + (BG.posTo  - BG.posFrom)  * eased;
    const zoom = BG.zoomFrom + (BG.zoomTo - BG.zoomFrom) * eased;

    body.style.backgroundPosition = pos + "% 50%";
    body.style.backgroundSize     = (zoom * 100) + "%";

    requestAnimationFrame(animateBackground);
  }

  requestAnimationFrame(animateBackground);
})();


/* ============================================================
   2. SPA-навигация: подгрузка контента без перезагрузки страницы
   ============================================================ */

(function () {
  const content = document.getElementById("content");
  if (!content) return;

  const links = document.querySelectorAll(".nav-link");
  const cache = new Map();   // page → HTML

  async function fetchPage(name) {
    if (cache.has(name)) return cache.get(name);
    const res = await fetch(`/api/page/${name}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    cache.set(name, html);
    return html;
  }

  async function loadPage(name, { push = true } = {}) {
    if (!name) return;

    // Подсветка активного пункта
    links.forEach((l) => {
      l.classList.toggle("active", l.dataset.page === name);
    });

    // Плавное затухание — опционально
    content.style.opacity = "0";

    try {
      const html = await fetchPage(name);
      content.innerHTML = html;

      // Меняем URL, не перезагружая страницу
      if (push) {
        history.pushState({ page: name }, "", `#${name}`);
      }

      content.scrollTop = 0;
    } catch (err) {
      content.innerHTML = `
        <h1>Ошибка</h1>
        <p>Не удалось загрузить страницу: ${err.message}</p>
      `;
      console.error("[spa] load error:", err);
    } finally {
      // Возвращаем непрозрачность
      content.style.opacity = "1";
    }
  }

  // Клики по ссылкам меню
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const name = link.dataset.page;
      if (name) loadPage(name);
    });
  });

  // Кнопки «назад»/«вперёд» в браузере
  window.addEventListener("popstate", (e) => {
    const name = (e.state && e.state.page) || location.hash.slice(1);
    if (name) loadPage(name, { push: false });
  });

  // Начальная загрузка: если в URL есть #page — открываем её
  const initial = location.hash.slice(1);
  if (initial) {
    loadPage(initial, { push: false });
  } else {
    // Ничего не открыто — подсветим первый пункт (опционально)
    // loadPage(links[0]?.dataset.page, { push: false });
  }
})();