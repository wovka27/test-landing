import debounce from "@/scripts/utils/debounce";

/**
 * Модуль карусели участников турнира на чистом JavaScript
 * Поддерживает зацикливание и автопереключение
 */
export default class {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) {
      throw new Error(`Контейнер ${containerSelector} не найден`);
    }

    // Настройки по умолчанию
    this.options = {
      autoPlay: true,
      autoPlayDelay: 4000,
      transition: 'ease-in-out',
      transitionDuration: 600,
      pauseOnHover: true,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      // Селекторы для внешних элементов управления
      prevButtonSelector: null,
      nextButtonSelector: null,
      counterSelector: null,
      currentSlideSelector: null,
      totalSlidesSelector: null,
      // Пагинация
      pagination: false,
      paginationSelector: null,
      ...options
    };

    this.containerTrack = options.containerTrack || '.carousel-track';

    this.currentSlide = 0;
    this.slides = [];
    this.totalSlides = 0;
    this.autoPlayTimer = null;
    this.isTransitioning = false;
    this.slidesToShow = this.options.slidesToShow;

    // Внешние элементы управления
    this.prevBtn = null;
    this.nextBtn = null;
    this.counterElement = null;
    this.currentSlideElement = null;
    this.totalSlidesElement = null;
    this.paginationContainer = null;
    this.paginationDots = [];

    this.init();
  }

  init() {
    this.createCarouselStructure();
    this.setupSlides();
    this.setupExternalControls();
    this.setupPagination();
    this.bindEvents();
    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
    this.startAutoPlay();
    this.handleResize();
  }

  createCarouselStructure() {
    // Получаем ссылки на элементы
    this.viewport = this.container
    this.track = this.container.querySelector(this.containerTrack);
  }

  setupExternalControls() {
    // Находим внешние элементы управления по селекторам
    if (this.options.prevButtonSelector) {
      this.prevBtn = document.querySelector(this.options.prevButtonSelector);
    }

    if (this.options.nextButtonSelector) {
      this.nextBtn = document.querySelector(this.options.nextButtonSelector);
    }

    if (this.options.counterSelector) {
      this.counterElement = document.querySelector(this.options.counterSelector);
    }

    if (this.options.currentSlideSelector) {
      this.currentSlideElement = document.querySelector(this.options.currentSlideSelector);
    }

    if (this.options.totalSlidesSelector) {
      this.totalSlidesElement = document.querySelector(this.options.totalSlidesSelector);
    }

    // Обновляем общий счетчик слайдов
    if (this.totalSlidesElement) {
      this.totalSlidesElement.textContent = Math.ceil(this.totalSlides / this.slidesToShow);
    }

    // Находим контейнер для пагинации
    if (this.options.paginationSelector) {
      this.paginationContainer = document.querySelector(this.options.paginationSelector);
    }
  }

  setupPagination() {
    if (!this.options.pagination || !this.paginationContainer) return;

    // Очищаем контейнер
    this.paginationContainer.innerHTML = '';
    this.paginationDots = [];

    const totalPages = this.getTotalSlides();

    // Создаем точки пагинации
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('li');
      dot.className = 'pagination-dot';
      dot.setAttribute('data-slide', i.toString());
      dot.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);

      this.paginationContainer.appendChild(dot);
      this.paginationDots.push(dot);

      // Добавляем обработчик клика
      dot.addEventListener('click', () => {
        this.goToSlide(i);
      });
    }
  }

  setupSlides() {
    this.slides = Array.from(this.track.children);
    this.totalSlides = this.slides.length;


    if (this.totalSlides === 0) {
      console.warn('Нет слайдов для отображения');
      return;
    }

    // Добавляем классы к слайдам
    this.slides.forEach((slide, index) => {
      slide.classList.add('carousel-slide');
      slide.setAttribute('data-slide', index);
    });

    // Устанавливаем динамическую ширину слайдов
    this.updateSlideWidths();

    // Для бесконечной прокрутки клонируем слайды
    if (this.options.infinite && this.totalSlides > this.slidesToShow) {
      this.cloneSlides();
    }

    this.updateTrackPosition(false);
  }

  cloneSlides() {
    // Клонируем первые слайды в конец
    for (let i = 0; i < this.slidesToShow; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add('carousel-slide-clone');
      this.track.appendChild(clone);
    }

    // Клонируем последние слайды в начало
    for (let i = this.totalSlides - this.slidesToShow; i < this.totalSlides; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add('carousel-slide-clone');
      this.track.insertBefore(clone, this.track.firstChild);
    }

    // Обновляем позицию для компенсации клонированных слайдов
    this.currentSlide = this.slidesToShow;
  }

  bindEvents() {
    // События для внешних стрелок
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSlide());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSlide());
    }

    // Пауза при наведении
    if (this.options.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
      this.container.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    // Обработка событий transitionend для бесконечной прокрутки
    this.track.addEventListener('transitionend', () => {
      this.handleTransitionEnd();
    });

    // Поддержка свайпов на мобильных устройствах
    this.setupTouchEvents();

    // Обработчики для пагинации добавляются в setupPagination()
    this.setupPagination()
    // Обработка изменения размера окна
    window.addEventListener('resize', this.handleResize);
  }

  handleResize = debounce(() => {
    const width = window.innerWidth;
    let newSlidesToShow = this.options.slidesToShow;

    if (width <= 850) {
      newSlidesToShow = 1;
    } else if (width <= 1200) {
      newSlidesToShow = 2;
    }

    if (newSlidesToShow !== this.slidesToShow) {
      this.slidesToShow = newSlidesToShow;
      this.updateSlideWidths();
      this.updateTrackPosition(false);
      this.updateCounter();
      this.updateArrows();
      this.setupPagination(); // Пересоздаем пагинацию при изменении размера
      this.updatePagination();
    }
  }, 200)

  setupTouchEvents() {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    this.viewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
    });

    this.viewport.addEventListener('touchmove', (e) => {
      if (!isTracking) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = startX - currentX;
      const deltaY = startY - currentY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        e.preventDefault();
      }
    });

    this.viewport.addEventListener('touchend', (e) => {
      if (!isTracking) return;

      const endX = e.changedTouches[0].clientX;
      const deltaX = startX - endX;

      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }

      isTracking = false;
    });
  }

  nextSlide() {
    if (this.isTransitioning) return;

    this.currentSlide += this.options.slidesToScroll;
    this.updateTrackPosition();
    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
  }

  prevSlide() {
    if (this.isTransitioning) return;

    this.currentSlide -= this.options.slidesToScroll;
    this.updateTrackPosition();
    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
  }

  updateTrackPosition(animate = true) {
    const slideWidth = this.viewport.offsetWidth / this.slidesToShow;
    const translateX = -this.currentSlide * slideWidth;

    if (animate) {
      this.isTransitioning = true;
      this.track.style.transition = `transform ${this.options.transitionDuration}ms ${this.options.transition}`;
    } else {
      this.track.style.transition = 'none';
    }

    this.track.style.transform = `translateX(${translateX}px)`;
  }

  handleTransitionEnd() {
    this.isTransitioning = false;

    if (!this.options.infinite) return;

    const maxSlide = this.totalSlides;
    const minSlide = 0;

    // Обработка бесконечной прокрутки
    if (this.currentSlide >= maxSlide + this.slidesToShow) {
      this.currentSlide = this.slidesToShow;
      this.updateTrackPosition(false);
    } else if (this.currentSlide < this.slidesToShow) {
      this.currentSlide = maxSlide;
      this.updateTrackPosition(false);
    }

    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
  }

  updateCounter() {
    const actualSlide = this.options.infinite ?
      Math.max(1, Math.min(Math.ceil(this.totalSlides / this.slidesToShow), Math.ceil((this.currentSlide - this.slidesToShow + 1) / this.options.slidesToScroll) + 1)) :
      Math.ceil((this.currentSlide + 1) / this.options.slidesToScroll);

    // Обновляем внешний элемент счетчика
    if (this.currentSlideElement) {
      this.currentSlideElement.textContent = actualSlide;
    }
  }

  updateArrows() {
    if (!this.options.infinite) {
      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentSlide <= 0;
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = this.currentSlide >= this.totalSlides - this.slidesToShow;
      }
    }
  }

  updatePagination() {
    if (!this.options.pagination || this.paginationDots.length === 0) return;

    const currentPage = this.getCurrentPage();

    this.paginationDots.forEach((dot, index) => {
      if (index === currentPage - 1) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  updateSlideWidths() {
    // Вычисляем ширину слайда в процентах
    const slideWidth = Math.floor(100 / this.slidesToShow) + '%';

    this.track.style.gridAutoColumns = `calc(100% / ${this.slidesToShow})`
  }

  startAutoPlay() {
    if (!this.options.autoPlay || this.totalSlides <= this.slidesToShow) return;

    this.pauseAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.nextSlide();
    }, this.options.autoPlayDelay);
  }

  pauseAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  // Публичные методы
  play() {
    this.options.autoPlay = true;
    this.startAutoPlay();
  }

  pause() {
    this.options.autoPlay = false;
    this.pauseAutoPlay();
  }

  destroy() {
    this.pauseAutoPlay();
    window.removeEventListener('resize', this.handleResize);

    // Удаляем обработчики с внешних кнопок
    if (this.prevBtn) {
      this.prevBtn.removeEventListener('click', this.prevSlide);
    }
    if (this.nextBtn) {
      this.nextBtn.removeEventListener('click', this.nextSlide);
    }

    const slides = this.slides

    slides.forEach((slide, index) => {
      this.track.appendChild(slide);
    })
    this.track.style = ''

    // Восстанавливаем оригинальный контент
    this.container.innerHTML = this.track.outerHTML ;

    if (this.paginationDots.length) {
      this.paginationDots = []
    }
  }

  goToSlide(index) {
    if (this.isTransitioning) return;

    this.currentSlide = this.options.infinite ? index + this.slidesToShow : index;
    this.updateTrackPosition();
    this.updateCounter();
    this.updateArrows();
    this.updatePagination();
  }

  // Геттеры для получения информации о состоянии карусели
  getCurrentSlide() {
    return this.options.infinite ?
      Math.max(1, Math.min(Math.ceil(this.totalSlides / this.slidesToShow), Math.ceil((this.currentSlide - this.slidesToShow + 1) / this.options.slidesToScroll) + 1)) :
      Math.ceil((this.currentSlide + 1) / this.options.slidesToScroll);
  }

  getTotalSlides() {
    return Math.ceil(this.totalSlides / this.slidesToShow);
  }

  getCurrentPage() {
    if (this.options.infinite) {
      const actualSlide = Math.max(0, this.currentSlide - this.slidesToShow);
      return Math.floor(actualSlide / this.options.slidesToScroll) + 1;
    } else {
      return Math.floor(this.currentSlide / this.options.slidesToScroll) + 1;
    }
  }
}
