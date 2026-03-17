/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel block.
 * Base: carousel. Source: https://www.dickssportinggoods.com/
 * Handles DSG hero carousel (#Carousel) with AEM teaser-v3 slides.
 *
 * Source DOM structure:
 *   #Carousel .panelcontainer [role="tabpanel"]
 *     .teaser-v3 .cmp-teaser-v3
 *       .cmp-teaser-v3__image-container picture > img.cmp-image__image
 *       .cmp-teaser-v3__content
 *         h2.cmp-teaser-v3__title > a (title)
 *         .cmp-teaser-v3__description (description text)
 *         .cmp-teaser-v3__action-container > a.cmp-teaser-v3__action-link (CTA)
 *
 * Target: Carousel block (2 columns) - image | heading + description + CTA
 * Skips sponsored/empty slides.
 */
export default function parse(element, { document }) {
  // Find all slide panels
  const panels = element.querySelectorAll('[role="tabpanel"]');
  if (!panels.length) return;

  const cells = [];

  panels.forEach((panel) => {
    const teaser = panel.querySelector('.cmp-teaser-v3, .teaser-v3');
    if (!teaser) return;

    // Get the main image (desktop version from img.cmp-image__image or picture img)
    const img = teaser.querySelector('img.cmp-image__image, .cmp-teaser-v3__image-container img');
    if (!img || !img.src) return; // Skip slides without images (e.g. sponsored)

    // Column 1: Image
    const imgCell = document.createElement('div');
    const newImg = document.createElement('img');
    newImg.src = img.src;
    newImg.alt = img.alt || '';
    imgCell.append(newImg);

    // Column 2: Content (title + description + CTA)
    const contentCell = document.createElement('div');

    // Title
    const titleEl = teaser.querySelector('.cmp-teaser-v3__title');
    if (titleEl) {
      const titleLink = titleEl.querySelector('a');
      const h2 = document.createElement('h2');
      if (titleLink) {
        const a = document.createElement('a');
        a.href = titleLink.href;
        a.textContent = titleLink.textContent.trim();
        h2.append(a);
      } else {
        h2.textContent = titleEl.textContent.trim();
      }
      contentCell.append(h2);
    }

    // Description
    const descEl = teaser.querySelector('.cmp-teaser-v3__description');
    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      contentCell.append(p);
    }

    // CTA buttons
    const ctaLinks = teaser.querySelectorAll('.cmp-teaser-v3__action-link');
    ctaLinks.forEach((cta) => {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.href;
      a.textContent = cta.textContent.trim();
      p.append(a);
      contentCell.append(p);
    });

    cells.push([imgCell, contentCell]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
