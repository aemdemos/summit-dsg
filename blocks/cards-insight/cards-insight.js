import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/** Scene7 image URLs keyed by partial heading text */
const SCENE7_IMAGES = {
  'AI in Professional Services': 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/201276_109755785-1?wid=376',
  'CoCounsel Guided Workflows': 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/243582-644540343?wid=376',
  'Future of Professionals': 'https://thomsonreuters.scene7.com/is/image/thomsonreuterscloudprod/251216-922168087?wid=376',
};

function fixBrokenImages(ul) {
  ul.querySelectorAll('li').forEach((li) => {
    const img = li.querySelector('img');
    if (!img || (img.src && !img.src.includes('about:error'))) return;

    const h3 = li.querySelector('h3');
    if (!h3) return;

    const heading = h3.textContent;
    const matchKey = Object.keys(SCENE7_IMAGES).find((key) => heading.includes(key));
    if (matchKey) {
      img.src = SCENE7_IMAGES[matchKey];
      img.alt = heading;
    }
  });
}

export default function decorate(block) {
  const blockId = getBlockId('cards-insight');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

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

  fixBrokenImages(ul);

  block.textContent = '';
  block.append(ul);
}
