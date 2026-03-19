/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-spotlight.
 * Base: carousel. Source: https://www.thomsonreuters.com/en
 * Selector: #cmp-rotator-spotlight, #spotlight-module .cmp-rotator
 *
 * Extracts: 6-slide content rotator. Desktop text slides paired with matching images.
 * Target: Carousel block — N rows, 2 columns: [image | heading + paragraphs + link]
 */
export default function parse(element, { document }) {
  // Desktop text slides: direct children of dig-rotator-content inside cmp-rotator-content-desktop
  const desktopContent = element.querySelector('.cmp-rotator-content-desktop dig-rotator-content');
  const textSlides = desktopContent
    ? Array.from(desktopContent.querySelectorAll(':scope > div'))
    : [];

  // Desktop images: dig-rotator-content inside cmp-rotator__content-item-video
  const imageContainer = element.querySelector('.cmp-rotator__content-item-video dig-rotator-content');
  const imageSlides = imageContainer
    ? Array.from(imageContainer.querySelectorAll(':scope > div'))
    : [];

  const cells = [];

  textSlides.forEach((slide, idx) => {
    // Extract slide image
    const imageCell = [];
    if (imageSlides[idx]) {
      const slideImg = imageSlides[idx].querySelector('img.cmp-rotator__content-video, img');
      if (slideImg) {
        const img = document.createElement('img');
        img.src = slideImg.src;
        img.alt = slideImg.alt || '';
        imageCell.push(img);
      }
    }

    // Extract slide content
    const contentCell = [];

    // Title: h3 inside dig-typography--subtitle
    const titleEl = slide.querySelector('dig-typography.dig-typography--subtitle h3, h3');
    if (titleEl) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      contentCell.push(h3);
    }

    // Body paragraphs: from dig-typography--body-large
    const bodyEl = slide.querySelector('dig-typography.dig-typography--body-large');
    if (bodyEl) {
      const paragraphs = bodyEl.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text) {
          const para = document.createElement('p');
          para.textContent = text;
          contentCell.push(para);
        }
      });
    }

    // CTA link: from dig-link
    const ctaEl = slide.querySelector('dig-link a');
    if (ctaEl) {
      const a = document.createElement('a');
      a.href = ctaEl.href;
      a.textContent = ctaEl.textContent.trim();
      const p = document.createElement('p');
      p.append(a);
      contentCell.push(p);
    }

    if (contentCell.length) {
      cells.push([imageCell, contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-spotlight', cells });
  element.replaceWith(block);
}
