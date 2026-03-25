import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Fix images that failed AEM optimization (about:error) by restoring their
 * original DAM URL via alt-text lookup. Remove this map once the images are
 * replaced with proper authored assets in DA.
 */
/* eslint-disable max-len */
const IMAGE_FALLBACKS = new Map([
  ['2026 AI in Professional Services Report', 'https://www.thomsonreuters.com/content/dam/ewp-m/images/thomsonreuters/en/photography/201276_109755785.jpeg'],
  ['Introducing Our First CoCounsel Guided Workflows', 'https://www.thomsonreuters.com/content/dam/ewp-m/images/thomsonreuters/en/artworked-images/243582-644540343.jpeg'],
  ['Future of Professionals Report 2025', 'https://www.thomsonreuters.com/content/dam/ewp-m/images/thomsonreuters/en/reports/251216-922168087.jpeg'],
]);
/* eslint-enable max-len */

function fixBrokenImages(block) {
  block.querySelectorAll('img').forEach((img) => {
    if (img.src.includes('about:error') && IMAGE_FALLBACKS.has(img.alt)) {
      img.src = IMAGE_FALLBACKS.get(img.alt);
    }
  });
}

export default function decorate(block) {
  const blockId = getBlockId('cards-insight');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

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
