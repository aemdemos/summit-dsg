import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Temporary fallback: restore Scene7 URLs for images that failed AEM
 * optimization (about:error). Remove this map once images are re-authored
 * as links in DA (see convertScene7Links).
 */
/* eslint-disable max-len */
const IMAGE_FALLBACKS = new Map([
  ['2026 AI in Professional Services Report', 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/201276_109755785-1'],
  ['Introducing Our First CoCounsel Guided Workflows', 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/243582-644540343'],
  ['Future of Professionals Report 2025', 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/251216-922168087'],
]);
/* eslint-enable max-len */

function fixBrokenImages(block) {
  block.querySelectorAll('img').forEach((img) => {
    if (img.src.includes('about:error') && IMAGE_FALLBACKS.has(img.alt)) {
      img.src = IMAGE_FALLBACKS.get(img.alt);
    }
  });
}

/**
 * Convert Scene7 links to <img> elements. Authors place Scene7 URLs as
 * links in the image cell (since AEM cannot process Scene7 through its
 * media pipeline). The link text becomes the alt attribute.
 *
 * Authoring pattern in DA:
 *   Image cell → link with href = Scene7 URL, text = alt text
 */
function convertScene7Links(block) {
  block.querySelectorAll(':scope > div > div > a[href*="scene7.com"]').forEach((link) => {
    const img = document.createElement('img');
    img.src = link.href;
    img.alt = link.textContent || '';
    img.loading = 'lazy';
    link.parentElement.replaceChildren(img);
  });
}

export default function decorate(block) {
  const blockId = getBlockId('cards-insight');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

  convertScene7Links(block);
  fixBrokenImages(block);

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
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
