/**
 * Page transformers: pure DOM operations for import preprocessing.
 *
 * These functions take a document (or root element) and optionally a config object,
 * and mutate or derive a cleaned/main content root. They do not use WebImporter;
 * use them from import.js (logic inlined there) or from a Node script with jsdom.
 *
 * When used in the AEM Importer, the actual DOM is the one inside the iframe;
 * WebImporter.DOMUtils.remove(main, selectors) is the runtime way to strip nodes.
 * The logic here mirrors that for reference and for non-browser use.
 */

/**
 * Get the main content container from the document.
 * @param {Document} document
 * @param {string | string[]} mainSelectors - Comma-separated or array of selectors
 * @returns {Element | null}
 */
export function getMainRoot(document, mainSelectors = 'main, [role="main"], .main-content') {
  const selectors = Array.isArray(mainSelectors)
    ? mainSelectors.join(', ')
    : mainSelectors;
  return document.querySelector(selectors) || document.body;
}

/**
 * Remove elements matching selectors from a root (mutates root).
 * @param {Element} root
 * @param {string[]} selectors
 */
export function removeFromRoot(root, selectors) {
  selectors.forEach((sel) => {
    try {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    } catch (e) {
      // invalid selector
    }
  });
}

/**
 * Ensure the first heading in root is H1 (demote others if needed).
 * @param {Element} root
 */
export function ensureFirstHeadingIsH1(root) {
  const firstHeading = root.querySelector('h1, h2, h3, h4, h5, h6');
  if (firstHeading && firstHeading.tagName !== 'H1') {
    firstHeading.outerHTML = `<h1>${firstHeading.textContent}</h1>`;
  }
}

/**
 * Find first hero-like section (picture + heading).
 * @param {Element} root
 * @param {string[]} heroSelectors
 * @returns {{ heading: Element | null, image: Element | null, container: Element | null }}
 */
export function findHero(root, heroSelectors = ['.hero', '[class*="hero"]', '.banner']) {
  for (const sel of heroSelectors) {
    try {
      const container = root.querySelector(sel);
      if (container) {
        const heading = container.querySelector('h1, h2');
        const picture = container.querySelector('picture');
        const img = container.querySelector('img');
        return {
          heading: heading || null,
          image: picture || img || null,
          container,
        };
      }
    } catch (e) {
      // skip invalid selector
    }
  }

  // Fallback: first section with picture + heading
  const section = root.querySelector('section, [class*="section"]');
  if (section) {
    const heading = section.querySelector('h1, h2');
    const picture = section.querySelector('picture');
    const img = section.querySelector('img');
    if (heading && (picture || img)) {
      return {
        heading,
        image: picture || img,
        container: section,
      };
    }
  }

  return { heading: null, image: null, container: null };
}

/**
 * Extract metadata from document head for Metadata block.
 * @param {Document} document
 * @returns {{ Title?: string, Description?: string, Image?: string }}
 */
export function extractMetadata(document) {
  const meta = {};
  const titleEl = document.querySelector('title');
  if (titleEl) meta.Title = titleEl.textContent.replace(/[\n\t]/g, '').trim();

  const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
  if (desc && desc.getAttribute('content')) meta.Description = desc.getAttribute('content');

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.getAttribute('content')) meta.Image = ogImage.getAttribute('content');

  return meta;
}
