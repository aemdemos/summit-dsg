/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Abercrombie cleanup.
 * Selectors from captured DOM of https://www.abercrombie.com/shop/us
 * Removes non-authorable site chrome (header, footer, nav, search, cart)
 * and interactive widgets (carousel controls) before/after block parsing.
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove carousel control buttons that interfere with block parsing
    // Found in captured HTML: .carousel-controls with pause/prev/next buttons
    WebImporter.DOMUtils.remove(element, [
      '.carousel-controls',
      '.carousel-pause',
      '.carousel-prev',
      '.carousel-next',
    ]);

    // Remove footnote links (e.g. asterisk references in sale copy)
    // Found in captured HTML: a.footnote inside .lockup
    const footnotes = element.querySelectorAll('a.footnote');
    footnotes.forEach((fn) => fn.remove());
  }

  if (hookName === H.after) {
    // Remove non-authorable site chrome
    // Found in captured HTML: <header> with <nav>, search-button, account-link, cart-link
    // Found in captured HTML: <footer> with footer-links, footer-bottom
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      'nav',
      '.search-button',
      '.account-link',
      '.cart-link',
    ]);

    // Remove script, noscript, link, iframe elements
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'link',
      'iframe',
    ]);
  }
}
