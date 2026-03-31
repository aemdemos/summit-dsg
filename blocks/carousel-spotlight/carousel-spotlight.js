import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createSliderControls, initSlider, showSlide } from '../../scripts/slider.js';

export { showSlide };

/**
 * Replace unreachable external images with the original DAM URLs.
 *
 * Content is authored with Thomson Reuters DAM URLs (the canonical source),
 * but AEM's media pipeline cannot download them server-side and rewrites
 * src to about:error.  DA rewrites them to content.da.live URLs that
 * are also not publicly accessible.  The browser can reach the DAM
 * directly, so we restore the original URL using the preserved alt text.
 */
const IMAGE_FALLBACKS = new Map([
  ['2026 AI in Professional Services Report', 'https://www.thomsonreuters.com/content/dam/ewp-m/images/thomsonreuters/en/photography/201276_109755785.jpeg'],
  ['Future of Professionals Report 2025', 'https://www.thomsonreuters.com/content/dam/ewp-m/images/thomsonreuters/en/reports/251216-922168087.jpeg'],
]);

function resolveExternalImages(block) {
  block.querySelectorAll('img').forEach((img) => {
    const fallback = IMAGE_FALLBACKS.get(img.alt);
    if (!fallback) return;
    const { src } = img;
    if (src === 'about:error' || src.includes('content.da.live')) {
      img.src = fallback;
      img.loading = 'lazy';
    }
  });
}

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

  const columns = [...row.querySelectorAll(':scope > div')];
  columns.forEach((column) => {
    const hasMedia = column.querySelector('picture, img');
    column.classList.add(`carousel-spotlight-slide-${hasMedia ? 'image' : 'content'}`);
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

    /* insert slide counter between prev and next buttons */
    const counter = document.createElement('span');
    counter.classList.add('slide-counter');
    counter.textContent = `1 of ${rows.length}`;
    const nextBtn = buttonsContainer.querySelector('.slide-next');
    buttonsContainer.insertBefore(counter, nextBtn);

    /* nav goes after slides-container (below content, not inside it) */
    block.append(buttonsContainer);
  }

  resolveExternalImages(block);

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, blockId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    /* Override prev/next to use instant transitions (slider.js defaults to 'smooth').
       Register before initSlider so these handlers fire first and stop propagation. */
    block.querySelector('.slide-prev')?.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      showSlide(block, current - 1, 'auto', SLIDER_OPTIONS);
    });
    block.querySelector('.slide-next')?.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      showSlide(block, current + 1, 'auto', SLIDER_OPTIONS);
    });

    initSlider(block, SLIDER_OPTIONS);

    /* keep the "X of N" counter in sync with active slide */
    const totalSlides = block.querySelectorAll(SLIDER_OPTIONS.slideSelector).length;
    const counterEl = block.querySelector('.slide-counter');
    if (counterEl) {
      const observer = new MutationObserver(() => {
        const idx = parseInt(block.dataset.activeSlide, 10) || 0;
        counterEl.textContent = `${idx + 1} of ${totalSlides}`;
      });
      observer.observe(block, { attributes: true, attributeFilter: ['data-active-slide'] });
    }

    slidesWrapper.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      const next = e.key === 'ArrowLeft' ? current - 1 : current + 1;
      e.preventDefault();
      showSlide(block, next, 'auto', SLIDER_OPTIONS);
    });
  }
}
