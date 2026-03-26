import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Resolve external images that AEM's media pipeline cannot process.
 *
 * AEM converts any recognisable URL (text, links, img tags) to about:error
 * for images it cannot download (e.g. Scene7). Two strategies are used:
 *
 * 1. scene7:<account>/<asset-id> tokens — preferred authoring pattern in DA.
 *    AEM leaves these alone because they don't look like URLs.
 *
 * 2. Heading-based fallback — when the pipeline has already destroyed the URL,
 *    the card heading is matched to a known Scene7 asset. This covers content
 *    authored before the token pattern was adopted.
 */
const SCENE7_BASE = 'https://thomsonreuters.scene7.com/is/image/';

const SCENE7_FALLBACKS = new Map([
  ['2026 AI in Professional Services Report', 'thomsonreuterscloudprod/201276_109755785-1'],
  ['Introducing Our First CoCounsel Guided Workflows', 'thomsonreuterscloudprod/243582-644540343'],
  ['Future of Professionals Report 2025', 'thomsonreuterscloudprod/251216-922168087'],
]);

function resolveExternalImages(block) {
  [...block.children].forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;

    const imageCell = cells[0];
    const contentCell = cells[1];

    /* Already has a working image — nothing to do */
    if (imageCell.querySelector('picture') || imageCell.querySelector('img:not([src="about:error"])')) return;

    const heading = contentCell.querySelector('h1, h2, h3, h4, h5, h6');
    const alt = heading ? heading.textContent : '';

    /* Strategy 1: scene7: token → reconstruct full URL */
    const text = imageCell.textContent.trim();
    const tokenMatch = text.match(/^scene7:(.+)/i);
    if (tokenMatch) {
      const img = document.createElement('img');
      img.src = `${SCENE7_BASE}${tokenMatch[1]}`;
      img.alt = alt;
      img.loading = 'lazy';
      imageCell.replaceChildren(img);
      return;
    }

    /* Strategy 2: heading → known Scene7 asset (fallback) */
    const asset = SCENE7_FALLBACKS.get(alt);
    if (asset) {
      const img = document.createElement('img');
      img.src = `${SCENE7_BASE}${asset}`;
      img.alt = alt;
      img.loading = 'lazy';
      imageCell.replaceChildren(img);
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
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
