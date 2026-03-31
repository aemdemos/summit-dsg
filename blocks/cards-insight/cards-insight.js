import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Replace about:error images with local fallbacks.
 *
 * Content is authored with Scene7 URLs (the canonical source), but
 * AEM's media pipeline cannot download them server-side and rewrites
 * src to about:error.  The alt text (preserved by the pipeline) is
 * matched to a local copy in /images/.
 */
const IMAGE_FALLBACKS = new Map([
  ['2026 AI in Professional Services Report', '/images/ai-professional-services-report.jpg'],
  ['Introducing Our First CoCounsel Guided Workflows', '/images/cocounsel-guided-workflows.jpg'],
  ['Future of Professionals Report 2025', '/images/future-of-professionals-2025.jpg'],
]);

function resolveExternalImages(block) {
  block.querySelectorAll('img[src="about:error"]').forEach((img) => {
    const fallback = IMAGE_FALLBACKS.get(img.alt);
    if (fallback) {
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
