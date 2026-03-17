/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block.
 * Base: cards. Source: https://www.dickssportinggoods.com/
 * Handles DSG trending-card pattern found in:
 *   - #FootwearBubbles (shoe bar, 6 cards)
 *   - #TopTrending_container (trending spotlight, 8 cards)
 *   - #latestlaunches (latest launches, 5 cards)
 *   - #protips_container (expert advice, 4 cards)
 *
 * Source DOM structure (per card):
 *   .trending-card > .trending-info
 *     > .item-image > a > img
 *     > a.item-header (card title)
 *     > .item-subheader > p (description)
 *   .trending-cta-container > a.trending-cta (CTA links)
 *
 * Target: Cards block (2 columns) - image | title + description + CTA
 */
export default function parse(element, { document }) {
  // Find all trending-card elements within this container
  const cards = element.querySelectorAll(':scope .trending-card .trending-info');
  if (!cards.length) return;

  const cells = [];

  cards.forEach((cardInfo) => {
    const card = cardInfo.closest('.trending-card');

    // Column 1: Image
    const img = cardInfo.querySelector('.item-image img');
    const imgCell = document.createElement('div');
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      imgCell.append(newImg);
    }

    // Column 2: Title + description + CTA
    const contentCell = document.createElement('div');

    // Title from the item-header anchor
    const titleLink = cardInfo.querySelector('a.item-header');
    if (titleLink) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.href = titleLink.href;
      a.textContent = titleLink.textContent.trim();
      strong.append(a);
      p.append(strong);
      contentCell.append(p);
    }

    // Description from item-subheader
    const subheader = cardInfo.querySelector('.item-subheader p');
    if (subheader && subheader.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = subheader.textContent.trim();
      contentCell.append(p);
    }

    // CTA buttons from trending-cta-container
    const ctaContainer = card ? card.querySelector('.trending-cta-container') : null;
    if (ctaContainer) {
      const ctas = ctaContainer.querySelectorAll('a.trending-cta');
      ctas.forEach((cta) => {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = cta.href;
        a.textContent = cta.textContent.trim();
        p.append(a);
        contentCell.append(p);
      });
    }

    cells.push([imgCell, contentCell]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
