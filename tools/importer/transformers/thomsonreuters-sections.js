/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Thomson Reuters section breaks and section metadata.
 * Adds section breaks (<hr>) and section-metadata blocks from template sections.
 * Runs in afterTransform only. All selectors from captured DOM.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
    const template = payload && payload.template;
    if (!template || !template.sections || template.sections.length < 2) return;

    const sections = template.sections;

    // Process sections in reverse order to preserve DOM positions
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];

      let sectionEl = null;
      for (const sel of selectors) {
        sectionEl = element.querySelector(sel);
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
}
