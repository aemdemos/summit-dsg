/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsParser from './parsers/cards.js';
import carouselParser from './parsers/carousel.js';

// TRANSFORMER IMPORTS
import dsgCleanupTransformer from './transformers/dsg-cleanup.js';
import dsgSectionsTransformer from './transformers/dsg-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'DICK\'S Sporting Goods homepage with hero carousel, trending cards, latest launches, expert advice pro tips, and social/Instagram sections',
  urls: [
    'https://www.dickssportinggoods.com/',
  ],
  blocks: [
    {
      name: 'cards',
      instances: [
        '#FootwearBubbles .trending-card',
        '#TopTrending_container .trending-card',
        '#latestlaunches .trending-card',
        '#protips_container .trending-card',
      ],
    },
    {
      name: 'carousel',
      instances: [
        '#Carousel',
      ],
    },
  ],
  sections: [
    {
      id: 'section-shoe-bar',
      name: 'Shoe Bar',
      selector: '#footwearbubbles_container',
      style: null,
      blocks: ['cards'],
      defaultContent: ['.title-scrolling__title', '.title-scrolling__cta'],
    },
    {
      id: 'section-hero-carousel',
      name: 'Hero Carousel',
      selector: '#Carousel',
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'section-trending-spotlight',
      name: 'Trending Spotlight',
      selector: '#TopTrending_container',
      style: null,
      blocks: ['cards'],
      defaultContent: ['#title-294168ac00'],
    },
    {
      id: 'section-latest-launches',
      name: 'Latest Launches',
      selector: '#latestlaunches',
      style: null,
      blocks: ['cards'],
      defaultContent: [],
    },
    {
      id: 'section-expert-advice',
      name: 'Expert Advice',
      selector: ['#protips_container', '.global-title'],
      style: null,
      blocks: ['cards'],
      defaultContent: ['.global-title h1'],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'cards': cardsParser,
  'carousel': carouselParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  dsgCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [dsgSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page using selectors from the embedded template.
 * For cards blocks, uses the PARENT container selector instead of individual card
 * selectors to pass the full container to the parser.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  // Map of block name -> parent container selectors for cards-type blocks
  // The parsers expect the container element, not individual card elements
  const containerSelectors = {
    cards: [
      '#FootwearBubbles',
      '#TopTrending_container',
      '#latestlaunches',
      '#protips_container',
    ],
  };

  template.blocks.forEach((blockDef) => {
    const selectors = containerSelectors[blockDef.name] || blockDef.instances;
    selectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
          });
        });
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
      }
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform (cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Insert section breaks BEFORE parsing (parsers replace section containers)
    if (PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1) {
      const sections = PAGE_TEMPLATE.sections;
      // Process in reverse to avoid position shifts
      [...sections].reverse().forEach((section) => {
        if (section.id === sections[0].id) return; // skip first section
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          try {
            sectionEl = document.querySelector(sel);
            if (sectionEl) break;
          } catch (e) { /* skip */ }
        }
        if (sectionEl && sectionEl.previousElementSibling) {
          const sectionHr = document.createElement('hr');
          sectionEl.before(sectionHr);
        }
      });
    }

    // 3. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 4. Parse each block
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 5. Execute afterTransform (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 6. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 7. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
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
