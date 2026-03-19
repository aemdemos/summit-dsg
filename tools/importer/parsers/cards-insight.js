/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-insight.
 * Base: cards. Source: https://www.thomsonreuters.com/en
 * Selector: #features-insights-module .card-wrapper
 *
 * Extracts: 3 portrait cards with images, headings, body text, and CTA links.
 * Target: Cards block — N rows, 2 columns: [image | heading + paragraph + link]
 */
export default function parse(element, { document }) {
  const cards = element.querySelectorAll('.card > dig-card, dig-card');
  const cells = [];

  cards.forEach((card) => {
    // Card image: from dig-card-media
    const imageCell = [];
    const cardImg = card.querySelector('dig-card-media img');
    if (cardImg) {
      const img = document.createElement('img');
      img.src = cardImg.src;
      img.alt = cardImg.alt || '';
      imageCell.push(img);
    }

    // Card content
    const contentCell = [];

    // Title: h3 from dig-typography--subtitle
    const titleEl = card.querySelector('dig-typography.dig-typography--subtitle h3, .dig-card-content h3');
    if (titleEl) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      contentCell.push(h3);
    }

    // Body text: p from dig-typography--body-medium
    const bodyEl = card.querySelector('dig-typography.dig-typography--body-medium p, .dig-card-content-container p');
    if (bodyEl) {
      const p = document.createElement('p');
      p.textContent = bodyEl.textContent.trim();
      contentCell.push(p);
    }

    // CTA link: from dig-link
    const ctaEl = card.querySelector('dig-link a');
    if (ctaEl) {
      const a = document.createElement('a');
      a.href = ctaEl.href;
      a.textContent = ctaEl.textContent.trim();
      const p = document.createElement('p');
      p.append(a);
      contentCell.push(p);
    }

    if (imageCell.length || contentCell.length) {
      cells.push([imageCell, contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-insight', cells });
  element.replaceWith(block);
}
