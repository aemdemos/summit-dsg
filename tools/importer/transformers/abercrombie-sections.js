/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Abercrombie sections.
 * Adds section breaks (<hr>) and section-metadata blocks based on
 * template sections from page-templates.json.
 * Runs in afterTransform only.
 *
 * Sections from captured DOM:
 * 1. .promo-bar (style: null)
 * 2. .hero-sale (style: brand-red)
 * 3. .trend-edit (style: null)
 * 4. .archive-collection (style: null)
 * 5. .carousel-section (style: null)
 * 6. .ypb-hero (style: null)
 * 7. .membership-tiles (style: null)
 * 8. .footer-legal (style: null)
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.after) {
    const { document } = payload;
    const sections = payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;

    // Process sections in reverse order to preserve DOM positions
    const reversed = [...sections].reverse();

    reversed.forEach((section) => {
      // Find the first element matching the section selector
      const selectors = Array.isArray(section.selector)
        ? section.selector
        : [section.selector];

      let sectionEl = null;
      for (const sel of selectors) {
        sectionEl = element.querySelector(sel);
        if (sectionEl) break;
      }

      if (!sectionEl) return;

      // Add section-metadata block if section has a style
      if (section.style) {
        const sectionMetadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(sectionMetadata);
      }

      // Add <hr> before section (except the first section)
      if (section.id !== sections[0].id) {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    });
  }
}
