/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel.
 * Base: carousel. Variant: carousel (base).
 * Source: https://www.abercrombie.com/shop/us
 * Generated: 2026-03-18
 *
 * Source DOM (from captured cleaned.html):
 * <div class="carousel js-carousel">
 *   <div class="carousel-slides">
 *     <div class="carousel-slide">
 *       <img src="..." alt="...">
 *       <div class="slide-content">
 *         <p class="slide-heading">In Her Own League</p>
 *         <p class="slide-subheading">Changing the Game</p>
 *         <img src="..." alt="A&F x NFL"> (logo)
 *         <a href="..." class="button">SHOP NOW</a>
 *       </div>
 *     </div>
 *     ... (5 slides total)
 *   </div>
 * </div>
 *
 * Target (from block library):
 * Carousel block: 2 columns, multiple rows. Row 1 = block name.
 * Each subsequent row = one slide:
 *   Col 1: Image (mandatory) - in its own cell
 *   Col 2: Title (heading) + Description + logo + CTA - stacked in one cell
 */
export default function parse(element, { document }) {
  // Find all carousel slides
  // Found in captured HTML: .carousel-slide inside .carousel-slides
  const slides = Array.from(element.querySelectorAll('.carousel-slide'));

  const cells = slides.map((slide) => {
    // Col 1: slide background image
    // Found in captured HTML: direct child <img> of .carousel-slide
    const slideImg = slide.querySelector(':scope > img');
    const imgCell = slideImg ? [slideImg] : [];

    // Col 2: text content (heading, subheading, logo, CTA)
    const textCell = [];

    // Found in captured HTML: .slide-heading inside .slide-content
    const heading = slide.querySelector('.slide-heading');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent;
      textCell.push(h2);
    }

    // Found in captured HTML: .slide-subheading inside .slide-content
    const subheading = slide.querySelector('.slide-subheading');
    if (subheading) {
      const p = document.createElement('p');
      p.textContent = subheading.textContent;
      textCell.push(p);
    }

    // Found in captured HTML: img inside .slide-content (logo image)
    const logo = slide.querySelector('.slide-content img');
    if (logo) {
      const p = document.createElement('p');
      p.append(logo);
      textCell.push(p);
    }

    // Found in captured HTML: a.button inside .slide-content
    const cta = slide.querySelector('.slide-content a.button, .slide-content a[class*="button"]');
    if (cta) {
      const p = document.createElement('p');
      p.append(cta);
      textCell.push(p);
    }

    return [imgCell, textCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
