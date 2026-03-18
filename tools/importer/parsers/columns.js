/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns.
 * Base: columns. Variant: columns (base).
 * Source: https://www.abercrombie.com/shop/us
 * Generated: 2026-03-18
 *
 * Used in 2 sections:
 *
 * 1. Trend Edit Cards (.trend-edit .tout-group):
 *    <div class="tout-group">
 *      <div class="tout tout-with-picture">
 *        <img src="..." alt="...">
 *        <div class="tout-content">
 *          <span class="label">TREND EDIT</span>
 *          <strong>Garden Grown</strong>
 *          <a href="..." class="button">SHOP WOMEN'S</a>
 *        </div>
 *      </div>
 *      <div class="tout tout-with-picture">...</div>
 *    </div>
 *
 * 2. Membership Tiles (.membership-tiles .tout-group):
 *    <div class="tout-group">
 *      <div class="tout">
 *        <img src="..." alt="myAbercrombie">
 *        <p>Become a member...</p>
 *        <a href="..." class="button">JOIN OR SIGN IN</a>
 *      </div>
 *      ... (3 tiles total)
 *    </div>
 *
 * Target (from block library):
 * Columns block: N columns per row, each cell can contain image + text + links.
 * Row 1 = block name. Row 2+ = content columns side by side.
 */
export default function parse(element, { document }) {
  // Each .tout child represents one column
  const touts = Array.from(element.querySelectorAll(':scope > .tout'));

  // Build one row with N columns (one cell per tout)
  const row = touts.map((tout) => {
    const cellContent = [];

    // Extract image (found in captured HTML: direct child <img> of .tout)
    const img = tout.querySelector(':scope > img');
    if (img) {
      const p = document.createElement('p');
      p.append(img);
      cellContent.push(p);
    }

    // Extract label text (found in captured HTML: .label span in .tout-content)
    const label = tout.querySelector('.tout-content .label, .label');
    if (label) {
      const p = document.createElement('p');
      p.textContent = label.textContent;
      cellContent.push(p);
    }

    // Extract heading (found in captured HTML: <strong> in .tout-content)
    const heading = tout.querySelector('.tout-content strong, strong');
    if (heading) {
      const h3 = document.createElement('h3');
      h3.textContent = heading.textContent;
      cellContent.push(h3);
    }

    // Extract description paragraph (found in captured HTML: <p> in .tout for membership tiles)
    const desc = tout.querySelector(':scope > p, .tout-content > p');
    if (desc) cellContent.push(desc);

    // Extract CTA link (found in captured HTML: a.button in .tout-content or direct child)
    const cta = tout.querySelector('a.button, a[class*="button"]');
    if (cta) {
      const p = document.createElement('p');
      p.append(cta);
      cellContent.push(p);
    }

    // Fallback: if tout has a button element (not link), convert to paragraph
    if (!cta) {
      const buttonEl = tout.querySelector('button.button');
      if (buttonEl) {
        const p = document.createElement('p');
        p.textContent = buttonEl.textContent;
        cellContent.push(p);
      }
    }

    return cellContent;
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
