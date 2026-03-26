import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * Convert Scene7 image tokens to <img> elements.
 *
 * AEM's media pipeline converts ANY recognisable URL (bare text, links, img
 * tags) to about:error when it cannot download the image. To survive the
 * pipeline we store only a short token in the image cell:
 *
 *   scene7:<account>/<asset-id>
 *
 * The JS reconstructs the full URL at runtime.
 *
 * Authoring pattern in DA:
 *   Image cell → scene7:thomsonreuterscloudprod/201276_109755785-1
 */
const SCENE7_BASE = 'https://thomsonreuters.scene7.com/is/image/';

function resolveExternalImages(block) {
  [...block.children].forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;

    const imageCell = cells[0];
    const contentCell = cells[1];

    /* scene7: token → reconstruct full URL */
    const text = imageCell.textContent.trim();
    const match = text.match(/^scene7:(.+)/i);
    if (match) {
      const heading = contentCell.querySelector('h1, h2, h3, h4, h5, h6');
      const img = document.createElement('img');
      img.src = `${SCENE7_BASE}${match[1]}`;
      img.alt = heading ? heading.textContent : '';
      img.loading = 'lazy';
      imageCell.replaceChildren(img);
      return;
    }

    /* Remove about:error images left by AEM's pipeline */
    const broken = imageCell.querySelector('img[src="about:error"]');
    if (broken) broken.remove();
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
