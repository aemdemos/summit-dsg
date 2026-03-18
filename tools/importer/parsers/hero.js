/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero.
 * Base: hero. Variant: hero (base).
 * Source: https://www.abercrombie.com/shop/us
 * Generated: 2026-03-18
 *
 * Used in 3 sections with different content patterns:
 *
 * 1. Winter Sale Hero (.hero-sale .banner):
 *    <div class="lockup"><span class="headline"><i>Winter Sale</i></span>
 *    <span class="headline">20-50% off almost everything*</span></div>
 *    <div class="cta-group"><a class="button">SHOP WOMEN'S</a>
 *    <a class="button">SHOP MEN'S</a></div>
 *
 * 2. Archive Collection (.archive-collection .tout.tout-with-picture):
 *    <img src="..."><div class="tout-content"><strong>HEADING</strong></div>
 *    (sibling .banner: <p>copy</p><a class="button">CTA</a>)
 *
 * 3. YPB Hero (.ypb-hero .tout.tout-with-picture):
 *    <img src="..."><div class="tout-content"><img src="..." alt="YPB logo"></div>
 *    (sibling .cta-group: <a class="button">CTA</a>...)
 *
 * Target (from block library):
 * Hero block: 1 column, single cell with:
 *   1. Background Image (optional) - in <p> wrapper
 *   2. Title (mandatory) - heading element
 *   3. Subheading (optional)
 *   4. Call-to-Action (optional) - in <p> wrapper
 */
export default function parse(element, { document }) {
  const contentCell = [];

  // Detect which hero pattern by checking parent section class
  const parentSection = element.closest('.hero-sale, .archive-collection, .ypb-hero, [class*="section"]');

  // --- Background image (archive, ypb patterns) ---
  // Found in captured HTML: <img> direct child of .tout.tout-with-picture
  const bgImg = element.querySelector(':scope > img, :scope > picture');
  if (bgImg) {
    // Wrap in <p> for block-level rendering (matches library pattern)
    const p = document.createElement('p');
    p.append(bgImg);
    contentCell.push(p);
  }

  // --- Heading / Title ---
  const lockup = element.querySelector('.lockup');
  if (lockup) {
    // Sale hero: .headline spans converted to h2
    const headlines = Array.from(lockup.querySelectorAll('.headline'));
    headlines.forEach((hl) => {
      const h2 = document.createElement('h2');
      h2.innerHTML = hl.innerHTML;
      contentCell.push(h2);
    });
  } else {
    // Tout-based patterns (archive, ypb)
    const toutContent = element.querySelector('.tout-content');
    if (toutContent) {
      // Logo image (YPB pattern)
      const logoImg = toutContent.querySelector('img');
      if (logoImg) {
        const p = document.createElement('p');
        p.append(logoImg);
        contentCell.push(p);
      }
      // Heading text (archive pattern)
      const headingEl = toutContent.querySelector('strong, h1, h2, h3');
      if (headingEl) {
        const h2 = document.createElement('h2');
        h2.textContent = headingEl.textContent;
        contentCell.push(h2);
      }
    }
  }

  // --- Copy/description from sibling banner (archive pattern) ---
  if (parentSection && !lockup) {
    const siblingBanner = parentSection.querySelector(':scope > .banner p');
    if (siblingBanner) {
      contentCell.push(siblingBanner);
    }
  }

  // --- CTAs ---
  const ctasInElement = Array.from(element.querySelectorAll('.cta-group a.button, .cta-group a[class*="button"]'));
  if (ctasInElement.length > 0) {
    // Wrap each CTA in <p> for block-level rendering
    ctasInElement.forEach((cta) => {
      const p = document.createElement('p');
      p.append(cta);
      contentCell.push(p);
    });
  } else if (parentSection) {
    const siblingCtas = Array.from(
      parentSection.querySelectorAll(':scope > .banner a.button, :scope > .cta-group a.button, :scope > .cta-group a[class*="button"]'),
    );
    const externalCtas = siblingCtas.filter((cta) => !element.contains(cta));
    externalCtas.forEach((cta) => {
      const p = document.createElement('p');
      p.append(cta);
      contentCell.push(p);
    });
  }

  // Hero block: single row, single column with all content stacked
  const cells = contentCell.length > 0 ? [[contentCell]] : [];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
