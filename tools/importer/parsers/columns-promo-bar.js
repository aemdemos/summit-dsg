/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-promo-bar.
 * Base: columns. Variant: columns-promo-bar.
 * Source: https://www.abercrombie.com/shop/us
 * Generated: 2026-03-18
 *
 * Source DOM (from captured cleaned.html):
 * <div class="promo-bar">
 *   <p>Winter Sale: 20-50% Off Almost Everything | Free Shipping On Orders Over $99</p>
 *   <a href="/shop/us/womens" class="button">SHOP WOMEN'S</a>
 *   <a href="/shop/us/mens" class="button">SHOP MEN'S</a>
 * </div>
 *
 * Target: Columns block with single row.
 * Col 1: promo text + CTAs
 */
export default function parse(element, { document }) {
  // Extract promo text paragraph
  // Found in captured HTML: <p> direct child of .promo-bar
  const promoText = element.querySelector('p');

  // Extract CTA links
  // Found in captured HTML: a.button direct children of .promo-bar
  const ctas = Array.from(element.querySelectorAll('a.button, a[class*="button"]'));

  // Build content cell: text + CTAs in one column
  const contentCell = [];
  if (promoText) contentCell.push(promoText);
  contentCell.push(...ctas);

  // Columns block: single row with one column containing all promo content
  const cells = [contentCell];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo-bar', cells });
  element.replaceWith(block);
}
