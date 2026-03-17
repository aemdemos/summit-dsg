/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: DSG (dickssportinggoods.com) cleanup.
 * Removes non-authorable content before/after block parsing.
 * Selectors from captured DOM of https://www.dickssportinggoods.com/
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove elements that block parsing: cookie banners, overlays, sponsored/retail media
    WebImporter.DOMUtils.remove(element, [
      '[class*="cookie"]',
      '[class*="consent"]',
      '[class*="retailmedia"]',
      '[class*="sponsored"]',
      '.skip-link',
      '#defaultmonetate',
      '#certona',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable content: DSG-specific header, footer, nav, dynamic sections
    WebImporter.DOMUtils.remove(element, [
      // Standard elements
      'header',
      'footer',
      'nav',
      // DSG header/footer containers
      '#responsive-header',
      '#header',
      '#responsive-footer',
      '#footer',
      '#footer-legal-disclaimer',
      '#footer-copyright',
      '#footer-screen-reader-msg',
      '[class*="calia-react-header"]',
      '[class*="dsg-header"]',
      '.main-header',
      '.header-container',
      '[class*="cmp-experiencefragment--header"]',
      '[class*="cmp-experiencefragment--footer"]',
      // Navigation
      '.desktop-nav-container__nav',
      '[class*="navigation"]',
      // Dynamic/personalization sections
      '#productplacement1',
      '#toppzhero_container',
      '#pzhero_container',
      // Social/UGC
      '[class*="bazaarvoice"]',
      '[class*="curalate"]',
      // Value props bar (Best Price Guarantee, Free Shipping etc.)
      '[class*="value-prop"]',
      // Email/SMS signup
      '[class*="email-signup"]',
      '[class*="sms-signup"]',
      // Other non-content
      'iframe',
      'link',
      'noscript',
      '.spacer',
      'script',
      // Social/UGC section (Bazaarvoice/Curalate Instagram)
      '[data-crl8-container-id]',
      '#text-182e35c8d7',
      // Tracking pixels (img tags with tracking URLs)
      'img[src*="arttrk.com"]',
      'img[src*="bat.bing.com"]',
      'img[src*="t.co"]',
      'img[src*="analytics.twitter.com"]',
      'img[src*="tvspix.com"]',
      'img[src*="edge.curalate.com"]',
    ]);

    // Clean tracking/analytics attributes from all elements
    element.querySelectorAll('[data-em]').forEach((el) => el.removeAttribute('data-em'));
    element.querySelectorAll('[data-cmp-clickable]').forEach((el) => el.removeAttribute('data-cmp-clickable'));
    element.querySelectorAll('[data-sly-unwrap]').forEach((el) => el.removeAttribute('data-sly-unwrap'));
  }
}
