(function startTvMenu() {
  const stage = document.querySelector("#tvStage");
  const counter = document.querySelector("#slideCounter");
  const progress = document.querySelector("#progressBar");
  const controls = document.querySelector("#tvControls");
  const prevButton = document.querySelector("#prevSlide");
  const nextButton = document.querySelector("#nextSlide");
  const playbackButton = document.querySelector("#togglePlayback");
  const fullscreenButton = document.querySelector("#toggleFullscreen");
  const slideDuration = 10000;
  const menu = Array.isArray(window.EDEN_MENU) ? window.EDEN_MENU : [];

  const orderedMenu = [
    ...menu.filter((category) => category.id === "seti"),
    ...menu.filter((category) => category.id !== "seti"),
  ];

  const slides = orderedMenu.flatMap((category) => {
    const hasImages = category.items.some((item) => item.image);
    const itemsPerSlide = hasImages ? 5 : 6;
    const sectionPageCount = Math.ceil(category.items.length / itemsPerSlide);
    const sectionSlides = [];

    for (let start = 0; start < category.items.length; start += itemsPerSlide) {
      sectionSlides.push({
        category,
        hasImages,
        items: category.items.slice(start, start + itemsPerSlide),
        sectionPage: Math.floor(start / itemsPerSlide) + 1,
        sectionPageCount,
      });
    }

    return sectionSlides;
  });

  let activeIndex = 0;
  let timerId = 0;
  let controlsTimerId = 0;
  let paused = false;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function createCard(item, hasImages) {
    const hasImage = Boolean(item.image);
    const cardClass = hasImage ? "tv-card" : "tv-card tv-card--text";
    const imageClass = item.imageFit === "cover" ? "tv-cover" : "";
    const media = hasImages
      ? `<div class="tv-card-media">
          <span class="tv-card-mark">EDEN</span>
          ${hasImage ? `<img class="${imageClass}" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : ""}
        </div>`
      : "";

    return `<article class="${cardClass}">
      ${media}
      <div class="tv-card-body">
        <h2 class="tv-card-title">${escapeHtml(item.name)}</h2>
        ${item.description ? `<p class="tv-card-description">${escapeHtml(item.description)}</p>` : ""}
        <div class="tv-card-bottom">
          <span class="tv-card-meta">${escapeHtml(item.meta)}</span>
          <strong class="tv-card-price">${escapeHtml(item.price)}</strong>
        </div>
      </div>
    </article>`;
  }

  function preloadNextSlide() {
    if (!slides.length) return;
    const nextSlide = slides[(activeIndex + 1) % slides.length];
    nextSlide.items.forEach((item) => {
      if (!item.image) return;
      const image = new Image();
      image.src = item.image;
    });
  }

  function startProgress() {
    progress.classList.remove("is-running");
    void progress.offsetWidth;
    if (!paused) progress.classList.add("is-running");
  }

  function scheduleNext() {
    window.clearTimeout(timerId);
    if (paused || slides.length < 2) return;
    timerId = window.setTimeout(() => showSlide(activeIndex + 1), slideDuration);
  }

  function showSlide(index) {
    if (!slides.length) {
      stage.innerHTML = '<section class="tv-slide"><h1>Меню временно недоступно</h1></section>';
      counter.textContent = "—";
      return;
    }

    activeIndex = (index + slides.length) % slides.length;
    const slide = slides[activeIndex];
    const columns = Math.min(slide.items.length, slide.hasImages ? 5 : 3);
    const sectionPage = slide.sectionPageCount > 1
      ? `<span class="tv-section-page">${slide.sectionPage} / ${slide.sectionPageCount}</span>`
      : "";

    stage.innerHTML = `<section class="tv-slide">
      <header class="tv-slide-heading">
        <div>
          <span class="tv-kicker">Меню EDEN</span>
          <h1>${escapeHtml(slide.category.label)}</h1>
        </div>
        ${sectionPage}
      </header>
      <div class="tv-grid" data-count="${slide.items.length}" style="--columns:${columns}">
        ${slide.items.map((item) => createCard(item, slide.hasImages)).join("")}
      </div>
    </section>`;

    stage.querySelectorAll(".tv-card-media img").forEach((image) => {
      image.addEventListener("error", () => image.remove(), { once: true });
    });

    counter.textContent = `${activeIndex + 1}/${slides.length}`;
    startProgress();
    scheduleNext();
    preloadNextSlide();
  }

  function togglePlayback() {
    paused = !paused;
    playbackButton.textContent = paused ? "Продолжить" : "Пауза";
    playbackButton.setAttribute("aria-label", paused ? "Продолжить слайд-шоу" : "Остановить слайд-шоу");
    showSlide(activeIndex);
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_error) {
      fullscreenButton.textContent = "Нажмите F11";
    }
  }

  function revealControls() {
    document.body.classList.add("controls-visible");
    window.clearTimeout(controlsTimerId);
    controlsTimerId = window.setTimeout(() => {
      if (!controls.matches(":focus-within")) document.body.classList.remove("controls-visible");
    }, 3500);
  }

  prevButton.addEventListener("click", () => showSlide(activeIndex - 1));
  nextButton.addEventListener("click", () => showSlide(activeIndex + 1));
  playbackButton.addEventListener("click", togglePlayback);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("mousemove", revealControls);
  document.addEventListener("pointerdown", revealControls);
  document.addEventListener("keydown", (event) => {
    revealControls();
    if (event.key === "ArrowLeft") showSlide(activeIndex - 1);
    if (event.key === "ArrowRight") showSlide(activeIndex + 1);
    if (event.key === " ") {
      event.preventDefault();
      togglePlayback();
    }
    if (event.key.toLowerCase() === "f") toggleFullscreen();
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.textContent = document.fullscreenElement ? "Выйти из полного экрана" : "На весь экран";
  });

  document.documentElement.style.setProperty("--slide-duration", `${slideDuration}ms`);
  revealControls();
  showSlide(0);
})();
