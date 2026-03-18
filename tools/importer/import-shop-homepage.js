/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsPromoBarParser from './parsers/columns-promo-bar.js';
import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import carouselParser from './parsers/carousel.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/abercrombie-cleanup.js';
import sectionsTransformer from './transformers/abercrombie-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-promo-bar': columnsPromoBarParser,
  'hero': heroParser,
  'columns': columnsParser,
  'carousel': carouselParser,
};

// PAGE TEMPLATE CONFIGURATION (from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'shop-homepage',
  description: 'Abercrombie shop US homepage with hero, promotional carousels, category cards, and marketing content sections',
  urls: [
    'https://www.abercrombie.com/shop/us',
  ],
  blocks: [
    {
      name: 'columns-promo-bar',
      instances: ['.promo-bar'],
    },
    {
      name: 'hero',
      instances: [
        '.hero-sale .banner',
        '.archive-collection .tout.tout-with-picture',
        '.ypb-hero .tout.tout-with-picture',
      ],
    },
    {
      name: 'columns',
      instances: [
        '.trend-edit .tout-group',
        '.membership-tiles .tout-group',
      ],
    },
    {
      name: 'carousel',
      instances: ['.carousel-section .carousel'],
    },
  ],
  sections: [
    {
      id: 'section-promo-bar',
      name: 'Promo Bar',
      selector: '.promo-bar',
      style: null,
      blocks: ['columns-promo-bar'],
      defaultContent: [],
    },
    {
      id: 'section-hero-sale',
      name: 'Winter Sale Hero',
      selector: '.hero-sale',
      style: 'brand-red',
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'section-trend-edit',
      name: 'Trend Edit Cards',
      selector: '.trend-edit',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-archive',
      name: 'Archive Collection Hero',
      selector: '.archive-collection',
      style: null,
      blocks: ['hero'],
      defaultContent: ['.archive-collection .banner p'],
    },
    {
      id: 'section-carousel',
      name: 'NFL Partnership Carousel',
      selector: '.carousel-section',
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'section-ypb',
      name: 'YPB Hero',
      selector: '.ypb-hero',
      style: null,
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'section-membership',
      name: 'Membership Tiles',
      selector: '.membership-tiles',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-footer-legal',
      name: 'Footer Legal',
      selector: '.footer-legal',
      style: null,
      blocks: [],
      defaultContent: ['.footer-legal p', '.footer-legal a'],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
