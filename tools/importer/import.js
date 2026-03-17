/**
 * AEM Importer transformation for dickssportinggoods.com (and configurable retail-style sites).
 *
 * Used by: AEM Importer (aem import / da.live Import & Bulk). Runs in browser; WebImporter
 * is provided by the importer UI. Logic is aligned with tools/importer/block-parser.js and
 * tools/importer/page-transformers.js — keep in sync when changing block mapping.
 *
 * @see https://github.com/adobe/helix-importer-ui/blob/main/importer-guidelines.md
 * @see tools/importer/MIGRATION-PLAN-DSG.md
 */

/* global WebImporter */

// --- Config (canonical selectors in tools/importer/config.js) ---
const MAIN_SELECTOR = 'main, [role="main"], .main-content, #main-content, .content-area';
const REMOVE_SELECTORS = [
  'header',
  'footer',
  'nav',
  '.header',
  '.footer',
  '.navigation',
  '.nav',
  '[class*="cookie"]',
  '[class*="banner"]',
  '.skip-link',
  'script',
  'style',
  'noscript',
  'iframe',
];
const HERO_SELECTORS = ['.hero', '[class*="hero"]', '.banner', '.homepage-hero'];

/**
 * Sanitize path for EDS: lowercase, latin, hyphens, no .html.
 * Uses WebImporter.FileUtils.sanitizePath when available.
 * @param {string} path
 * @returns {string}
 */
function sanitizePath(path) {
  if (typeof WebImporter !== 'undefined' && WebImporter.FileUtils && WebImporter.FileUtils.sanitizePath) {
    return WebImporter.FileUtils.sanitizePath(path);
  }
  return path
    .replace(/\/$/, '')
    .replace(/\.html$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9/-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '/';
}

/**
 * Generate document path from URL. One page → one path.
 * @param {{ params?: { originalURL?: string }, url?: string }} opts
 * @returns {string}
 */
function generateDocumentPath(opts) {
  const url = opts.params?.originalURL || opts.url || '';
  let pathname;
  try {
    pathname = new URL(url).pathname.replace(/\/$/, '').replace(/\.html$/i, '') || '/';
  } catch (e) {
    pathname = '/';
  }
  return sanitizePath(pathname);
}

/**
 * Get main content root from document.
 * @param {Document} document
 * @returns {Element}
 */
function getMain(document) {
  const main = document.querySelector(MAIN_SELECTOR);
  return main || document.body;
}

/**
 * Create metadata block and prepend to main. Uses WebImporter.Blocks.getMetadataBlock when available.
 * @param {Element} main
 * @param {Document} document
 */
function createMetadataBlock(main, document) {
  const meta = {};
  const titleEl = document.querySelector('title');
  if (titleEl) meta.Title = titleEl.textContent.replace(/[\n\t]/g, '').trim();
  const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
  if (desc && desc.getAttribute('content')) meta.Description = desc.getAttribute('content');
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.getAttribute('content')) {
    const img = document.createElement('img');
    img.src = ogImage.getAttribute('content');
    meta.Image = img;
  }
  if (typeof WebImporter !== 'undefined' && WebImporter.Blocks && WebImporter.Blocks.getMetadataBlock) {
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    if (block) main.prepend(block);
  }
}

/**
 * Optionally convert first hero-like section into a Hero block table and prepend to main.
 * @param {Element} main
 * @param {Document} document
 */
function ensureHeroBlock(main, document) {
  let container = null;
  let heading = null;
  let image = null;
  for (const sel of HERO_SELECTORS) {
    try {
      const el = main.querySelector(sel);
      if (el) {
        container = el;
        heading = el.querySelector('h1, h2');
        image = el.querySelector('picture img, img');
        if (heading && image) break;
      }
    } catch (e) {
      // skip
    }
  }
  if (!container || !heading || !image) return;
  if (typeof WebImporter !== 'undefined' && WebImporter.DOMUtils && WebImporter.DOMUtils.createTable) {
    const cells = [
      ['Hero'],
      [heading, image],
    ];
    const table = WebImporter.DOMUtils.createTable(cells, document);
    container.replaceWith(table);
  }
}

/**
 * Ensure first heading in main is H1.
 * @param {Element} main
 */
function ensureFirstH1(main) {
  const first = main.querySelector('h1, h2, h3, h4, h5, h6');
  if (first && first.tagName !== 'H1') {
    const h1 = document.createElement('h1');
    h1.textContent = first.textContent;
    first.replaceWith(h1);
  }
}

/**
 * Replace background images with img elements (so they appear in Markdown).
 * @param {Element} main
 * @param {Document} document
 */
function replaceBackgroundImages(main, document) {
  if (typeof WebImporter !== 'undefined' && WebImporter.DOMUtils && WebImporter.DOMUtils.replaceBackgroundByImg) {
    main.querySelectorAll('[style*="background-image"]').forEach((el) => {
      try {
        WebImporter.DOMUtils.replaceBackgroundByImg(el, document);
      } catch (e) {
        // skip
      }
    });
  }
}

/**
 * Single-page transform: cleanup and structure main for Markdown/docx.
 * @param {{ document: Document, url?: string, params?: { originalURL?: string } }} opts
 * @returns {{ element: Element, path: string, report?: Record<string, unknown> }}
 */
function transformOne(opts) {
  const { document, params } = opts;
  const main = getMain(document);

  // Strip unwanted nodes (header, footer, nav, etc.)
  if (typeof WebImporter !== 'undefined' && WebImporter.DOMUtils && WebImporter.DOMUtils.remove) {
    WebImporter.DOMUtils.remove(main, REMOVE_SELECTORS);
  } else {
    REMOVE_SELECTORS.forEach((sel) => {
      try {
        main.querySelectorAll(sel).forEach((el) => el.remove());
      } catch (e) {
        // skip invalid selector
      }
    });
  }

  replaceBackgroundImages(main, document);
  createMetadataBlock(main, document);
  ensureHeroBlock(main, document);
  ensureFirstH1(main);

  const path = generateDocumentPath({ params, url: opts.url });

  const report = {
    title: document.title || '',
  };

  return { element: main, path, report };
}

/**
 * Transform entry: one input URL → one output document (and optional report columns).
 * Importer expects this export when using the single-doc flow.
 */
export default {
  /**
   * @param {{ document: Document, url?: string, html?: string, params?: { originalURL?: string } }} opts
   * @returns {Array<{ element: Element, path: string, report?: Record<string, unknown> }>}
   */
  transform(opts) {
    return [transformOne(opts)];
  },

  generateDocumentPath(opts) {
    return generateDocumentPath(opts);
  },
};
