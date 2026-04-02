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

  // Scene7 image URLs for Featured insights cards (keyed by heading text)
  const SCENE7_IMAGES = {
    '2026 AI in Professional Services Report': 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/201276_109755785-1?wid=376',
    'Introducing Our First CoCounsel Guided Workflows': 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/243582-644540343?wid=376',
    'Future of Professionals Report 2025': 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/251216-922168087?wid=376',
  };

  // Inject Scene7 images into cards that are missing them.
  // AEM's pipeline converts external image URLs to about:error and the core
  // decoration strips them before the block's decorate() runs.  We recreate
  // the image column from scratch using a heading-text lookup.
  [...block.children].forEach((row) => {
    const h3 = row.querySelector('h3');
    const title = h3?.textContent?.trim();
    const url = title && SCENE7_IMAGES[title];
    if (!url) return;
    // Only add if the row doesn't already have a working image
    const existingImg = row.querySelector('picture img, img');
    if (existingImg && !existingImg.src.includes('about:error')) return;
    // Remove any broken-image div (about:error remnants)
    row.querySelectorAll('div').forEach((div) => {
      if (div.children.length <= 1 && div.querySelector('img')) div.remove();
    });
    // Create new image column as first child
    const imgDiv = document.createElement('div');
    const img = document.createElement('img');
    img.src = url;
    img.alt = title;
    img.loading = 'lazy';
    imgDiv.append(img);
    row.prepend(imgDiv);
  });

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
