/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroCorporateParser from './parsers/hero-corporate.js';
import cardsOfferingParser from './parsers/cards-offering.js';
import carouselSpotlightParser from './parsers/carousel-spotlight.js';
import cardsInsightParser from './parsers/cards-insight.js';
import columnsSupportParser from './parsers/columns-support.js';
import cardsPressParser from './parsers/cards-press.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/thomsonreuters-cleanup.js';
import sectionsTransformer from './transformers/thomsonreuters-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Thomson Reuters corporate homepage with hero, content bands, carousels, card grids, and global chrome (header/footer)',
  urls: [
    'https://www.thomsonreuters.com/en',
  ],
  blocks: [
    {
      name: 'hero-corporate',
      instances: ['#hero-module'],
    },
    {
      name: 'cards-offering',
      instances: ['.cmp-cardlist'],
    },
    {
      name: 'carousel-spotlight',
      instances: ['#cmp-rotator-spotlight', '#spotlight-module .cmp-rotator'],
    },
    {
      name: 'cards-insight',
      instances: ['#features-insights-module .card-wrapper'],
    },
    {
      name: 'columns-support',
      instances: ['#customer-support-module .dig-paper__content'],
    },
    {
      name: 'cards-press',
      instances: ['#press-releases-module .card-wrapper'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero',
      selector: '#hero-module',
      style: null,
      blocks: ['hero-corporate', 'cards-offering'],
      defaultContent: [],
    },
    {
      id: 'section-2-new-noteworthy',
      name: 'New and Noteworthy',
      selector: '#spotlight-module',
      style: null,
      blocks: ['carousel-spotlight'],
      defaultContent: ['#spotlight-module .rich-text-wrapper h2'],
    },
    {
      id: 'section-3-featured-insights',
      name: 'Featured Insights',
      selector: '#features-insights-module',
      style: null,
      blocks: ['cards-insight'],
      defaultContent: ['#features-insights-module .rich-text-wrapper h2'],
    },
    {
      id: 'section-4-customer-support',
      name: 'Customer Support',
      selector: '#customer-support-module',
      style: 'grey',
      blocks: ['columns-support'],
      defaultContent: ['#customer-support-module .rich-text-wrapper h2'],
    },
    {
      id: 'section-5-press-releases',
      name: 'Press Releases',
      selector: '#press-releases-module',
      style: null,
      blocks: ['cards-press'],
      defaultContent: [
        '#press-releases-module .rich-text-wrapper h2',
        '#press-releases-module .dig-button',
      ],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-corporate': heroCorporateParser,
  'cards-offering': cardsOfferingParser,
  'carousel-spotlight': carouselSpotlightParser,
  'cards-insight': cardsInsightParser,
  'columns-support': columnsSupportParser,
  'cards-press': cardsPressParser,
};

// TRANSFORMER REGISTRY — sections handled separately before parsing
const transformers = [
  cleanupTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
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
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
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

  // Extract nested blocks: if a block element is inside another block element,
  // move it to be a next sibling so parsing one doesn't destroy the other.
  for (let i = 0; i < pageBlocks.length; i += 1) {
    for (let j = 0; j < pageBlocks.length; j += 1) {
      if (i !== j && pageBlocks[i].element.contains(pageBlocks[j].element)) {
        const parent = pageBlocks[i].element;
        const child = pageBlocks[j].element;
        // Move child block to be a next sibling of parent block
        parent.after(child);
        console.log(`Extracted nested block "${pageBlocks[j].name}" from "${pageBlocks[i].name}"`);
      }
    }
  }

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * Add section breaks (<hr>) and section-metadata blocks BEFORE parsing.
 * Must run while original section selectors still exist in the DOM.
 */
function addSectionBreaks(document, template) {
  if (!template.sections || template.sections.length < 2) return;

  const sections = template.sections;

  // Process in reverse to preserve DOM positions
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];

    let sectionEl = null;
    for (const sel of selectors) {
      sectionEl = document.querySelector(sel);
      if (sectionEl) break;
    }
    if (!sectionEl) continue;

    // Add section-metadata block if section has a style
    if (section.style) {
      const sectionMetaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.after(sectionMetaBlock);
    }

    // Add section break (<hr>) before non-first sections
    if (i > 0) {
      const hr = document.createElement('hr');
      sectionEl.before(hr);
    }
  }
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2a. Remove all content before the first section module
    // After header/nav removal, stray utility links may remain at multiple nesting levels
    const firstSectionSel = PAGE_TEMPLATE.sections[0]?.selector;
    if (firstSectionSel) {
      const firstSectionEl = document.querySelector(firstSectionSel);
      if (firstSectionEl) {
        // Walk from firstSectionEl up to body, at each level remove preceding siblings
        let current = firstSectionEl;
        while (current && current.parentElement) {
          while (current.previousSibling) {
            current.previousSibling.remove();
          }
          if (current.parentElement === document.body) break;
          current = current.parentElement;
        }
      }
    }

    // 2b. Add section breaks BEFORE parsing (while section selectors still match)
    addSectionBreaks(document, PAGE_TEMPLATE);

    // 3. Find blocks on page (also extracts nested blocks)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 4. Parse each block using registered parsers
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

    // 5. Execute afterTransform transformers (cleanup only, sections already handled)
    executeTransformers('afterTransform', main, payload);



    // 6. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 7. Generate sanitized path
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
