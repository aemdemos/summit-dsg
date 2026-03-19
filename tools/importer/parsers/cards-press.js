/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-press.
 * Base: cards. Source: https://www.thomsonreuters.com/en
 * Selector: #press-releases-module .card-wrapper
 *
 * Extracts: 3 text-only press release cards with title, body, date, and CTA link.
 * Target: Cards (no images) — N rows, 1 column: [heading + paragraph + date + link]
 */
export default function parse(element, { document }) {
  const cards = element.querySelectorAll('.card > dig-card, dig-card');
  const cells = [];

  cards.forEach((card) => {
    const contentCell = [];

    // Title: h3 from dig-typography--subtitle
    const titleEl = card.querySelector('dig-typography.dig-typography--subtitle h3, .dig-card-content h3');
    if (titleEl) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      contentCell.push(h3);
    }

    // Body text: p from dig-typography--body-medium
    const bodyEl = card.querySelector('dig-typography.dig-typography--body-medium p');
    if (bodyEl) {
      const p = document.createElement('p');
      p.textContent = bodyEl.textContent.trim();
      contentCell.push(p);
    }

    // Date: p from dig-typography--body-small
    const dateEl = card.querySelector('dig-typography.dig-typography--body-small p');
    if (dateEl) {
      const p = document.createElement('p');
      p.textContent = dateEl.textContent.trim();
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

    if (contentCell.length) {
      cells.push([contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-press', cells });
  element.replaceWith(block);
}
