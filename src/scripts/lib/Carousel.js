import debounce from "@/scripts/utils/debounce";

export default class Carousel {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);

    if (!this.container) {
      throw new Error(`Carousel: контейнер "${containerSelector}" не найден`);
    }

    this.options = {
      autoPlay: true,
      autoPlayDelay: 4000,
      transition: 'ease-in-out',
      transitionDuration: 600,
      pauseOnHover: true,
      infinite: true,
      slidesToShow: { 0: 1, 768: 2, 1200: 3 }, // адаптивный объект
      slidesToScroll: 1,
      activeBreakpoint: null, // напр. "(max-width: 768px)"
      // Селекторы управления
      prevButtonSelector: null,
      nextButtonSelector: null,
      currentSlideSelector: null,
      totalSlidesSelector: null,
      pagination: false,
      paginationSelector: null,
      containerTrack: '.carousel-track',
      ...options
    };

    this.track = null;
    this.slides = [];
    this.currentSlide = 0;
    this.totalSlides = 0;
    this.slidesToShow = 1;
    this.isTransitioning = false;
    this.autoPlayTimer = null;
    this.paginationDots = [];

    this.mediaQuery = null;
    this.isActive = false;

    this.initMedia();
  }

  initMedia() {
    if (!this.options.activeBreakpoint) {
      this.init();
      return;
    }

    this.mediaQuery = window.matchMedia(this.options.activeBreakpoint);
    this.mediaQuery.addEventListener("change", this.handleMediaChange);
    this.handleMediaChange(this.mediaQuery);
  }

  handleMediaChange = (e) => {
    if (e.matches && !this.isActive) this.init()
    else if (!e.matches && this.isActive) this.destroy()
  }

  init() {
    this.isActive = true;

    this.track = this.container.querySelector(this.options.containerTrack);
    if (!this.track) throw new Error("Carousel: не найден track контейнер");

    this.slides = Array.from(this.track.children);
    this.totalSlides = this.slides.length;

    this.setupResponsiveSlidesToShow();
    this.updateSlideWidths();

    if (this.options.infinite && this.totalSlides > this.slidesToShow) {
      this.cloneSlides();
      this.currentSlide = this.slidesToShow;
    }

    this.bindControls();
    this.setupPagination();
    this.updateCounter();
    this.updatePagination();
    this.updateArrows();
    this.updateTrackPosition(false);

    if (this.options.autoPlay) this.startAutoPlay();
    window.addEventListener("resize", this.handleResize);
  }

  bindControls() {
    if (this.options.prevButtonSelector) {
      const prev = document.querySelector(this.options.prevButtonSelector);
      prev?.addEventListener("click", () => this.prevSlide());
    }

    if (this.options.nextButtonSelector) {
      const next = document.querySelector(this.options.nextButtonSelector);
      next?.addEventListener("click", () => this.nextSlide());
    }

    if (this.options.pauseOnHover) {
      this.container.addEventListener("mouseenter", () => this.pauseAutoPlay());
      this.container.addEventListener("mouseleave", () => this.startAutoPlay());
    }

    this.track.addEventListener("transitionend", this.handleTransitionEnd);

    this.setupTouchEvents();
  }

  setupPagination() {
    if (!this.options.pagination || !this.options.paginationSelector) return;
    const container = document.querySelector(this.options.paginationSelector);
    if (!container) return;

    container.innerHTML = "";
    this.paginationDots = [];

    const pages = this.getTotalPages();

    for (let i = 0; i < pages; i++) {
      const dot = document.createElement("li");
      dot.className = "pagination-dot";
      dot.dataset.slide = i;
      dot.innerHTML = '<p class="visually-hidden">Кнопка переключения слайда</p>';
      dot.addEventListener("click", () => this.goToSlide(i));
      container.appendChild(dot);
      this.paginationDots.push(dot);
    }
  }

  setupResponsiveSlidesToShow() {
    const width = window.innerWidth;
    let slides = 1;
    for (const bp in this.options.slidesToShow) {
      if (width >= bp) {
        slides = this.options.slidesToShow[bp];
      }
    }
    this.slidesToShow = slides;
  }

  removeClones() {
    this.track.querySelectorAll('.carousel-slide-clone, .clone').forEach(n => n.remove());
  }

  cloneSlides(forSlidesToShow = this.slidesToShow) {
    if (!this.options.infinite || this.totalSlides <= forSlidesToShow) return;

    // клоны в конец
    for (let i = 0; i < forSlidesToShow; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add('carousel-slide-clone', 'clone');
      this.track.appendChild(clone);
    }
    // клоны в начало
    for (let i = this.totalSlides - forSlidesToShow; i < this.totalSlides; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add('carousel-slide-clone', 'clone');
      this.track.insertBefore(clone, this.track.firstChild);
    }
  }

  handleTransitionEnd = () => {
    this.isTransitioning = false;
    if (!this.options.infinite) return;

    const maxIndex = this.totalSlides;
    if (this.currentSlide >= maxIndex + this.slidesToShow) {
      this.currentSlide = this.slidesToShow;
      this.updateTrackPosition(false);
    }
    if (this.currentSlide < this.slidesToShow) {
      this.currentSlide = maxIndex;
      this.updateTrackPosition(false);
    }
  };

  updateTrackPosition(animate = true) {
    const slideWidth = this.container.offsetWidth / this.slidesToShow;
    const offset = -this.currentSlide * slideWidth;

    this.track.style.transition = animate
      ? `transform ${this.options.transitionDuration}ms ${this.options.transition}`
      : "none";

    this.track.style.transform = `translateX(${offset}px)`;
  }

  updateState() {
    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
  }

  updateSlideWidths() {
    this.track.style.gridAutoColumns = `calc(100% / ${this.slidesToShow})`;
  }

  updateCounter() {
    const totalPages = this.getTotalPages();

    if (this.options.currentSlideSelector) {
      const el = document.querySelector(this.options.currentSlideSelector);
      if (el) el.textContent = this.getCurrentPage();
    }
    if (this.options.totalSlidesSelector) {
      const el = document.querySelector(this.options.totalSlidesSelector);
      if (el) el.textContent = totalPages;
    }
  }

  updateArrows() {
    if (this.options.infinite) return;
    const prev = document.querySelector(this.options.prevButtonSelector);
    const next = document.querySelector(this.options.nextButtonSelector);

    if (prev) prev.disabled = this.currentSlide <= 0;
    if (next) next.disabled = this.currentSlide >= this.totalSlides - this.slidesToShow;
  }

  updatePagination() {
    if (!this.paginationDots.length) return;
    const current = this.getCurrentPage() - 1;
    this.paginationDots.forEach((dot, i) =>
      dot.classList.toggle("active", i === current)
    );
  }

  goToSlide(index) {
    if (this.isTransitioning) return;
    this.currentSlide = this.options.infinite ? index + this.slidesToShow : index;
    this.updateTrackPosition();
    this.updateState();
  }

  nextSlide() {
    if (this.isTransitioning) return;
    this.currentSlide += this.options.slidesToScroll;
    this.updateTrackPosition();
    this.updateState();
  }

  prevSlide() {
    if (this.isTransitioning) return;
    this.currentSlide -= this.options.slidesToScroll;
    this.updateTrackPosition();
    this.updateState();
  }

  getRealIndex(offsetSlidesToShow = this.slidesToShow) {
    if (!this.options.infinite) return Math.max(0, Math.min(this.currentSlide, this.totalSlides - 1));
    const max = this.totalSlides;            // количество РЕАЛЬНЫХ слайдов
    const offset = offsetSlidesToShow;       // сколько клонов слева
    let idx = (this.currentSlide - offset) % max;
    if (idx < 0) idx += max;
    return idx; // 0..max-1
  }

  getCurrentPage() {
    // индекс реального слайда → страница
    const real = this.getRealIndex();                    // 0..totalSlides-1
    return Math.floor(real / this.slidesToShow) + 1;     // 1..totalPages
  }

  getTotalPages() {
    // totalSlides — количество реальных слайдов (не клонов!)
    return Math.max(1, Math.ceil(this.totalSlides / this.slidesToShow));
  }

  startAutoPlay() {
    if (!this.options.autoPlay || this.totalSlides <= this.slidesToShow) return;
    this.pauseAutoPlay();
    this.autoPlayTimer = setInterval(() => this.nextSlide(), this.options.autoPlayDelay);
  }

  pauseAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  setupTouchEvents() {
    let startX = 0;
    this.container.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    this.container.addEventListener("touchend", (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? this.nextSlide() : this.prevSlide();
    });
  }

  handleResize = debounce(() => {
    const prevSTS = this.slidesToShow;

    // высчитать новое slidesToShow (ваша логика/таблица брейкпоинтов)
    const width = window.innerWidth;
    let newSTS = this.options.slidesToShow; // если у вас объект брейкпоинтов — вычислите отсюда
    if (typeof newSTS !== 'number') {
      newSTS = 1;
      for (const bp in this.options.slidesToShow) {
        if (width >= Number(bp)) newSTS = this.options.slidesToShow[bp];
      }
    }

    if (newSTS === prevSTS) return;

    this.rebuildForSlidesToShowChange(prevSTS, newSTS);
  }, 200);

  rebuildForSlidesToShowChange(prevSTS, newSTS) {
    const realIndex = this.getRealIndex(prevSTS);

    this.removeClones();

    this.slidesToShow = newSTS;
    this.updateSlideWidths();

    this.cloneSlides(newSTS);

    if (this.options.infinite && this.totalSlides > newSTS) {
      this.currentSlide = newSTS + realIndex;
    } else {
      const maxStart = Math.max(0, this.totalSlides - newSTS);
      this.currentSlide = Math.min(realIndex, maxStart);
    }

    this.updateTrackPosition(false);
    this.setupPagination();
    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
  }

  destroy() {
    this.isActive = false;
    this.pauseAutoPlay();
    window.removeEventListener("resize", this.handleResize);
    this.track.style = "";
    this.track.style = "";
    this.paginationDots = [];
  }
}
