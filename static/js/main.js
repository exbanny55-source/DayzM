(function () {
  const body = document.body;

  // ---- Читаем настройки из data-* атрибутов <body> ----
  const BG = {
    enabled:  body.dataset.bgEnabled === "True" || body.dataset.bgEnabled === "true",
    duration: parseFloat(body.dataset.bgDuration)  || 120000,
    posFrom:  parseFloat(body.dataset.bgPosFrom)   || 20,
    posTo:    parseFloat(body.dataset.bgPosTo)     || 100,
    zoomFrom: parseFloat(body.dataset.bgZoomFrom)  || 1.0,
    zoomTo:   parseFloat(body.dataset.bgZoomTo)    || 1.4
  };

  console.log("[bg] settings:", BG);   // ← временный лог, потом удалим

  if (!BG.enabled) {
    console.log("[bg] animation disabled");
    return;
  }

  // ---- Время ----
  const startTime = Date.now();   // фиксированный момент старта
  let pausedTotal = 0;            // накопленное время в паузах, мс
  let pausedAt = null;            // момент ухода вкладки в фон (null = активна)

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausedAt = Date.now();
    } else if (pausedAt !== null) {
      pausedTotal += Date.now() - pausedAt;
      pausedAt = null;
    }
  });

  // Плавное сглаживание (ease-in-out)
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function animateBackground() {
    // Реально прошедшее время без учёта пауз
    const now = (pausedAt !== null) ? pausedAt : Date.now();
    const elapsed = now - startTime - pausedTotal;

    // Полный цикл = туда и обратно (alternate)
    const cycle = BG.duration * 2;
    let t = (elapsed % cycle) / cycle;   // 0..1

    // Треугольная волна 0..1..0
    t = t <= 0.5 ? t * 2 : (1 - t) * 2;

    // Сглаживание
    const eased = smoothstep(t);

    const pos  = BG.posFrom  + (BG.posTo  - BG.posFrom)  * eased;
    const zoom = BG.zoomFrom + (BG.zoomTo - BG.zoomFrom) * eased;

    body.style.backgroundPosition = pos + "% 50%";
    body.style.backgroundSize     = (zoom * 100) + "%";

    requestAnimationFrame(animateBackground);
  }

  requestAnimationFrame(animateBackground);
})();