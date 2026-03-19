/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-corporate.
 * Base: hero. Source: https://www.thomsonreuters.com/en
 * Selector: #hero-module
 *
 * Extracts: background image, eyebrow text, display heading, subtitle, CTA link.
 * Target: Hero block — 1 row, 1 column: [bg-image, eyebrow, heading, subtitle, CTA]
 */
export default function parse(element, { document }) {
  // Background image: direct child img of #hero-module
  const bgImg = element.querySelector(':scope > img');

  // Eyebrow: h2 containing .variant.eyebrow
  const eyebrowEl = element.querySelector('.variant.eyebrow');
  const eyebrow = eyebrowEl ? eyebrowEl.closest('h2') || eyebrowEl : null;

  // Main heading: h1 containing .variant.display
  const displayEl = element.querySelector('.variant.display');
  const heading = displayEl ? displayEl.closest('h1') || displayEl : null;

  // Subtitle: paragraph containing .variant.subtitle
  const subtitleEl = element.querySelector('p .variant.subtitle');
  const subtitle = subtitleEl ? subtitleEl.closest('p') : null;

  // CTA: primary button link
  const ctaLink = element.querySelector('dig-button a.primary, dig-button a');

  // Build single content cell — hero expects 1 row, 1 column
  // All elements go in one wrapper div so they stay in a single cell
  // First element that is an image-only paragraph becomes background in hero.js
  const wrapper = document.createElement('div');

  // Add background image as a paragraph with just the image (hero.js extracts it)
  if (bgImg) {
    const imgP = document.createElement('p');
    imgP.append(bgImg);
    wrapper.append(imgP);
  }

  // Add eyebrow as h2
  if (eyebrow) {
    const h2 = document.createElement('h2');
    h2.textContent = eyebrow.textContent.trim();
    wrapper.append(h2);
  }

  // Add main heading as h1
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.trim();
    wrapper.append(h1);
  }

  // Add subtitle as paragraph
  if (subtitle) {
    const p = document.createElement('p');
    p.textContent = subtitle.textContent.trim();
    wrapper.append(p);
  }

  // Add CTA link
  if (ctaLink) {
    const a = document.createElement('a');
    a.href = ctaLink.href;
    a.textContent = ctaLink.textContent.trim();
    const p = document.createElement('p');
    p.append(a);
    wrapper.append(p);
  }

  const cells = [[wrapper]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-corporate', cells });
  element.replaceWith(block);
}
