import '../styles/main.scss';
import Marquee from "./lib/Marquee";
import Carousel from "@/scripts/lib/Carousel";
import debounce from "@/scripts/utils/debounce";

document.addEventListener("DOMContentLoaded", () => {
  new Marquee({
    marquees: document.querySelectorAll('[data-marquee-js]'),
    text: 'Дело помощи утопающим — дело рук самих утопающих! • Шахматы двигают вперёд не только культуру, но и экономику! • Лед тронулся, господа присяжные заседатели! • '
  })

  const carouselOptions = {
    autoPlay: true,
    autoPlayDelay: 4000,
    pauseOnHover: true,
    infinite: true,
    transitionDuration: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    // Селекторы для внешних элементов управления
    prevButtonSelector: '[data-carousel-prev-btn]',
    nextButtonSelector: '[data-carousel-next-btn]',
    currentSlideSelector: '[data-carousel-current-slide]',
    totalSlidesSelector: '[data-carousel-total-slides]',
  }

  new Carousel('[data-carousel-list]', carouselOptions)

  let carousel = null;

  const resizeHandler = (event) => {
    if (!event?.[0] || event?.[0]?.target.innerWidth < 768) {
      if (!carousel) {
        carousel = new Carousel('[data-carousel-list2]', {
          ...carouselOptions,
          autoPlay: false,
          autoPlayDelay: 4000,
          pauseOnHover: false,
          slidesToShow: 1,
          infinite: false,
          containerTrack: '.stages__track',
          prevButtonSelector: '[data-carousel-prev-btn2]',
          nextButtonSelector: '[data-carousel-next-btn2]',
          currentSlideSelector: null,
          paginationSelector: '.stages__dots',
          totalSlidesSelector: null,
          pagination: true,
        })
      }
    } else {
      carousel?.destroy()
      carousel = null
    }
  }

  const debounced = debounce(resizeHandler, 200)

  resizeHandler()
  window.addEventListener('resize', debounced);
})