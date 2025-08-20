import '../styles/main.scss';
import Marquee from "./lib/Marquee";
import Carousel from "@/scripts/lib/Carousel";

new Marquee({
  marquees: document.querySelectorAll('[data-marquee-js]'),
  text: 'Дело помощи утопающим — дело рук самих утопающих! • Шахматы двигают вперёд не только культуру, но и экономику! • Лед тронулся, господа присяжные заседатели! • '
})

new Carousel('[data-carousel-list]', {
  autoPlay: true,
  autoPlayDelay: 4000,
  pauseOnHover: true,
  infinite: true,
  transitionDuration: 600,
  slidesToShow: {767: 1, 960: 2, 1200: 3},
  prevButtonSelector: '[data-carousel-prev-btn]',
  nextButtonSelector: '[data-carousel-next-btn]',
  currentSlideSelector: '[data-carousel-current-slide]',
  totalSlidesSelector: '[data-carousel-total-slides]',
})

new Carousel('[data-carousel-list2]', {
  autoPlay: false,
  activeBreakpoint: '(width <= 768px)',
  slidesToShow: {0: 1, 768: 1},
  infinite: false,
  isActive: true,
  containerTrack: '.stages__track',
  prevButtonSelector: '[data-carousel-prev-btn2]',
  nextButtonSelector: '[data-carousel-next-btn2]',
  paginationSelector: '.stages__dots',
  pagination: true,
})