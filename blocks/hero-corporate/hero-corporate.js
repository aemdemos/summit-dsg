/** Max paragraphs to scan for a background image (CWE-400). */
const MAX_PARAGRAPHS = 10;

export default function decorate(block) {
  // The hero has a single row with a single column of content.
  // The first paragraph containing only an image becomes the background.
  // AEM wraps <img> in <picture> before block decoration, so handle both cases.
  const col = block.querySelector(':scope > div > div');
  if (!col) return;

  const paragraphs = [...col.querySelectorAll(':scope > p')];
  const limit = Math.min(paragraphs.length, MAX_PARAGRAPHS);
  for (let i = 0; i < limit; i += 1) {
    const p = paragraphs[i];
    // Check for <p><picture>...</picture></p> (AEM-wrapped) or <p><img></p> (raw)
    const picture = p.querySelector(':scope > picture');
    const rawImg = p.querySelector(':scope > img:only-child');

    if ((picture && p.children.length === 1) || rawImg) {
      // Use the authored image as the section background
      const img = picture ? picture.querySelector('img') : rawImg;
      // eslint-disable-next-line no-console
      console.log('[hero-corporate] DEBUG', { picture: !!picture, rawImg: !!rawImg, img: !!img, imgSrc: img?.src, pChildren: p.children.length, pHTML: p.innerHTML });
      if (img) {
        const section = block.closest('.section');
        // eslint-disable-next-line no-console
        console.log('[hero-corporate] DEBUG section', { section: !!section, sectionClass: section?.className });
        if (section) {
          section.style.backgroundImage = `url('${img.src}')`;
          // eslint-disable-next-line no-console
          console.log('[hero-corporate] DEBUG set bg', section.style.backgroundImage);
        }
      }
      p.remove();
      break;
    }
  }
}
