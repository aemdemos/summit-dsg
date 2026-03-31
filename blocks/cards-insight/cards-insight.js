import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Replace unreachable external images with the original Scene7 URLs.
 *
 * Content is authored with Scene7 URLs (the canonical source), but
 * AEM's media pipeline cannot download them server-side and rewrites
 * src to about:error.  DA rewrites them to content.da.live URLs that
 * are also not publicly accessible.  The browser can reach Scene7
 * directly, so we restore the original URL using the preserved alt text.
 */
const IMAGE_FALLBACKS = new Map([
  ['2026 AI in Professional Services Report', 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/201276_109755785-1'],
  ['Introducing Our First CoCounsel Guided Workflows', 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/243582-644540343'],
  ['Future of Professionals Report 2025', 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/251216-922168087'],
]);

function resolveExternalImages(block) {
  block.querySelectorAll('img').forEach((img) => {
    const fallback = IMAGE_FALLBACKS.get(img.alt);
    if (!fallback) return;
    const { src } = img;
    if (src === 'about:error' || src.includes('content.da.live')) {
      img.src = fallback;
      img.loading = 'lazy';
    }
  });
}

export default function decorate(block) {
  const blockId = getBlockId('cards-insight');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

  resolveExternalImages(block);

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
