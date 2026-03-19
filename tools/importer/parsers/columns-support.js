/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-support.
 * Base: columns. Source: https://www.thomsonreuters.com/en
 * Selector: #customer-support-module .dig-paper__content
 *
 * Extracts: 3-column customer support layout. Each column has icon, heading, body text, and CTA link.
 * Target: Columns block — 1 row, 3 columns: [icon+heading+text+link | ... | ...]
 */
export default function parse(element, { document }) {
  // The 3 columns are .container.responsivegrid elements with aem-GridColumn--default--4 class
  // (4/12 = 1/3 width). This excludes the outer wrapper container which has default--12.
  const columnContainers = element.querySelectorAll('.container.responsivegrid.aem-GridColumn--default--4');
  const columnCells = [];

  columnContainers.forEach((col) => {
    const cellContent = [];

    // Icon image
    const iconImg = col.querySelector('.cmp-image img, .cmp-image__image');
    if (iconImg) {
      const img = document.createElement('img');
      img.src = iconImg.src;
      img.alt = iconImg.alt || '';
      const p = document.createElement('p');
      p.append(img);
      cellContent.push(p);
    }

    // Heading: h3 in richtext
    const headingEl = col.querySelector('.rich-text-wrapper h3, h3');
    if (headingEl) {
      const h3 = document.createElement('h3');
      h3.textContent = headingEl.textContent.trim();
      cellContent.push(h3);
    }

    // Body text: p in richtext
    const bodyEl = col.querySelector('.rich-text-wrapper p');
    if (bodyEl) {
      const p = document.createElement('p');
      p.textContent = bodyEl.textContent.trim();
      cellContent.push(p);
    }

    // CTA link: from dig-link or .cmp-link
    const ctaEl = col.querySelector('dig-link a, .cmp-link a');
    if (ctaEl) {
      const a = document.createElement('a');
      a.href = ctaEl.href;
      a.textContent = ctaEl.textContent.trim();
      const p = document.createElement('p');
      p.append(a);
      cellContent.push(p);
    }

    if (cellContent.length) {
      columnCells.push(cellContent);
    }
  });

  // Columns block: 1 row with N columns
  const cells = [columnCells];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-support', cells });
  element.replaceWith(block);
}
