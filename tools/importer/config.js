/**
 * DSG (dickssportinggoods.com) importer configuration.
 * Selectors and options for page transformers and block detection.
 * Used by import.js (values inlined or kept in sync) and by any Node-based scripts.
 *
 * Tune these after inspecting the live site (header, main, hero, product grids, etc.).
 */

/** @type {Record<string, string | string[]>} */
export const DSG_SELECTORS = {
  // Main content container (prefer main, fallback to content wrapper)
  main: 'main, [role="main"], .main-content, #main-content, .content-area',

  // Strip from document before extracting main
  remove: [
    'header', 'footer', 'nav',
    '.header', '.footer', '.navigation', '.nav',
    '[class*="cookie"]', '[class*="banner"]',
    '.skip-link',
    'script', 'style', 'noscript', 'iframe',
  ],

  // Hero: first large visual block (image + heading)
  hero: [
    '.hero', '[class*="hero"]', '.banner', '.homepage-hero',
    'section:first-of-type picture',
  ],

  // Product or promo cards (for Cards block)
  cardGrid: [
    '.product-grid', '.product-list',
    '[class*="product-grid"]', '[class*="card-grid"]',
    '.cards', '.promo-cards',
  ],

  // FAQ / expandable (for Accordion block)
  accordion: [
    '.faq', '[class*="accordion"]',
    '.expandable', '[class*="collapse"]',
  ],

  // Multi-column layout
  columns: ['.columns', '[class*="column-"]', '.multi-column'],
};

/** Default block names used when creating EDS block tables */
export const EDS_BLOCK_NAMES = {
  metadata: 'Metadata',
  hero: 'Hero',
  cards: 'Cards',
  accordion: 'Accordion',
  columns: 'Columns',
  quote: 'Quote',
  embed: 'Embed',
};

/** Path options: base path for imported docs, sanitize rules */
export const PATH_OPTIONS = {
  /** Replace source host with this in paths (optional) */
  basePath: '',
  /** Strip these path segments from URL pathname */
  stripSegments: ['/en', '/us'],
  /** Lowercase path segments */
  lowercase: true,
};

export default {
  DSG_SELECTORS,
  EDS_BLOCK_NAMES,
  PATH_OPTIONS,
};
