import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createSliderControls, initSlider, showSlide } from '../../scripts/slider.js';

export { showSlide };

const SLIDER_OPTIONS = {
  slidesContainer: '.carousel-spotlight-slides',
  slideSelector: '.carousel-spotlight-slide',
  indicatorsContainer: '.carousel-spotlight-slide-indicators',
  indicatorItemSelector: '.carousel-spotlight-slide-indicator',
  prevSelector: '.slide-prev',
  nextSelector: '.slide-next',
};

/* eslint-disable secure-coding/no-hardcoded-credentials */
const CONTROL_OPTIONS = {
  listClass: 'carousel-spotlight-slide-indicators',
  indicatorItemClass: 'carousel-spotlight-slide-indicator',
  navButtonsWrapperClass: 'carousel-spotlight-navigation-buttons',
  prevClass: 'slide-prev',
  nextClass: 'slide-next',
};
/* eslint-enable secure-coding/no-hardcoded-credentials */

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-spotlight-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-spotlight-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-spotlight-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

export default async function decorate(block) {
  const blockId = getBlockId('carousel-spotlight');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `carousel-spotlight-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const container = document.createElement('div');
  // eslint-disable-next-line secure-coding/no-hardcoded-credentials
  container.classList.add('carousel-spotlight-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-spotlight-slides');
  slidesWrapper.setAttribute('tabindex', '0');
  slidesWrapper.setAttribute('aria-label', 'Carousel slides');
  block.prepend(slidesWrapper);

  if (!isSingleSlide) {
    const { indicatorsNav, buttonsContainer } = createSliderControls(
      rows.length,
      CONTROL_OPTIONS,
    );
    block.append(indicatorsNav);
    container.append(buttonsContainer);
  }

  rows.forEach((row, idx) => {
    // remove columns that only contain a broken image
    row.querySelectorAll(':scope > div').forEach((col) => {
      const img = col.querySelector('img');
      if (img && img.src.includes('about:error') && col.children.length === 1) {
        col.remove();
      }
    });
    const slide = createSlide(row, idx, blockId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    initSlider(block, SLIDER_OPTIONS);
    slidesWrapper.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      const next = e.key === 'ArrowLeft' ? current - 1 : current + 1;
      e.preventDefault();
      showSlide(block, next, 'smooth', SLIDER_OPTIONS);
    });
  }
}
