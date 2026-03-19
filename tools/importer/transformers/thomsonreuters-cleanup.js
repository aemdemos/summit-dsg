/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Thomson Reuters cleanup.
 * Removes non-authorable content (header, footer, cookie consent, tracking, cloud services).
 * All selectors from captured DOM of https://www.thomsonreuters.com/en
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove cookie consent and tracking overlays (blocks parsing)
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '.onetrust-pc-dark-filter',
      '#modalRoot',
    ]);

    // Remove header, navigation, and megamenu (multiple selector variants)
    WebImporter.DOMUtils.remove(element, [
      'header',
      'header.bb-headerWrapper',
      'nav',
      'bb-megamenu',
      'bb-navigation',
      '.bb-Megamenu',
      '.bb-Navigation',
      '.bb-headerWrapper',
      '.megamenu',
      '.megamenu-wrapper',
      '[class*="megamenu"]',
      '[class*="Megamenu"]',
      '[class*="Navigation"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable global chrome
    WebImporter.DOMUtils.remove(element, [
      // Site footer and global footer
      '.siteFooter',
      'footer',
      'footer.tr-SemanticFooter',
      'footer.megamenu-footer',
      '.emcmUi-SiteFooter',
      'dcl-globalfooter',
      // Cloud services and tracking
      '.cloudservice',
      '.chatBotTrackingVariables',
      // Stylesheet links
      'link[href*="clientlibs"]',
      // iframes and noscript
      'iframe',
      'noscript',
      // Tracking pixels
      'img[src*="bat.bing.com"]',
      'img[src*="analytics"]',
      'img[src*="tracking"]',
    ]);
  }
}
