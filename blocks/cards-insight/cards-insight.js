import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Convert Scene7 / DAM text URLs to images.
 *
 * Authors paste external image URLs as plain text in DA to prevent DA
 * from rewriting them to content.da.live.  AEM may auto-link pasted URLs,
 * delivering them as <div><a href="url">url_text</a></div> instead of
 * plain text.  This function handles both cases.
 */
const IMAGE_URL_PATTERNS = [
  /^https:\/\/thomsonreuters\.scene7\.com\//,
  /^https:\/\/www\.thomsonreuters\.com\/content\/dam\//,
];

function resolveImageUrls(block) {
  // 1. Handle Scene7/DAM URLs that AEM auto-linked into <a> tags.
  //    The URL text may be split: <a href="…?wid=376">…?wid=37</a>6
  //    Use a.href (the full resolved URL) as the image source.
  block.querySelectorAll('a[href]').forEach((a) => {
    if (!IMAGE_URL_PATTERNS.some((re) => re.test(a.href))) return;
    // Only convert links whose visible text looks like a URL (not authored labels)
    if (!a.textContent.trim().startsWith('https://')) return;
    const container = a.parentElement;
    if (!container) return;
    const img = document.createElement('img');
    img.src = a.href;
    img.alt = '';
    img.loading = 'lazy';
    container.textContent = '';
    container.appendChild(img);
  });

  // 2. Handle plain-text URLs in <p> elements (fallback).
  block.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('img')) return;
    const text = p.textContent.trim();
    if (!text.startsWith('https://')) return;
    if (!IMAGE_URL_PATTERNS.some((re) => re.test(text))) return;
    const img = document.createElement('img');
    img.src = text;
    img.alt = '';
    img.loading = 'lazy';
    p.textContent = '';
    p.appendChild(img);
  });
}

export default function decorate(block) {
  const blockId = getBlockId('cards-insight');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

  resolveImageUrls(block);

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    ul.append(createCard(row));
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const isExternal = img.src.startsWith('http') && new URL(img.src).origin !== window.location.origin;
    if (isExternal) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    const pic = img.closest('picture');
    if (pic) pic.replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
