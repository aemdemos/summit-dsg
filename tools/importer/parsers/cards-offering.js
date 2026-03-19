/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-offering.
 * Base: cards. Source: https://www.thomsonreuters.com/en
 * Selector: .cmp-cardlist
 *
 * Extracts: 5 icon+label navigation cards from dig-card components.
 * Target: Cards block — N rows, 2 columns: [icon-image | text-with-link]
 */
export default function parse(element, { document }) {
  const cards = element.querySelectorAll('dig-card');
  const cells = [];

  cards.forEach((card) => {
    const link = card.querySelector('a.cmp-cardlist__item, a');
    // Icon image: first img in dig-card-content that is NOT an inline SVG arrow
    const iconImg = card.querySelector('.dig-card-content img[src^="./images"], .dig-card-content img[src*="images/"]');

    // Card label text: from dig-typography p (text before the arrow icon)
    const labelEl = card.querySelector('dig-typography p');
    const labelText = labelEl ? labelEl.textContent.trim() : '';

    // Build icon cell
    const iconCell = [];
    if (iconImg) {
      const img = document.createElement('img');
      img.src = iconImg.src;
      img.alt = iconImg.alt || '';
      iconCell.push(img);
    }

    // Build text cell with link
    const textCell = [];
    if (link && labelText) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = labelText;
      const p = document.createElement('p');
      p.append(a);
      textCell.push(p);
    } else if (labelText) {
      const p = document.createElement('p');
      p.textContent = labelText;
      textCell.push(p);
    }

    if (iconCell.length || textCell.length) {
      cells.push([iconCell, textCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-offering', cells });
  element.replaceWith(block);
}
