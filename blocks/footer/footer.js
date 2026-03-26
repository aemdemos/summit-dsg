import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DESKTOP_MQ = window.matchMedia('(width >= 900px)');

/**
 * Builds the footer column navigation from authored content.
 * Expects alternating h3 + ul elements in the section.
 * @param {Element} section The section element containing footer nav content
 * @returns {HTMLElement} The footer nav element
 */
function buildFooterNav(section) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'site footer');

  const ul = document.createElement('ul');
  ul.className = 'footer-columns';

  // Pair each h3 with its following ul to create columns
  const children = [...section.querySelectorAll(':scope .default-content-wrapper > h3, :scope .default-content-wrapper > ul')];
  let currentColumn = null;

  children.forEach((el) => {
    if (el.tagName === 'H3') {
      currentColumn = document.createElement('li');
      currentColumn.className = 'footer-column';
      currentColumn.append(el);
      ul.append(currentColumn);
    } else if (el.tagName === 'UL' && currentColumn) {
      currentColumn.append(el);
    }
  });

  nav.append(ul);
  return nav;
}

/**
 * Builds the legal bar from authored content.
 * Expects: a link (brand), a ul (legal links), and a link (CCPA).
 * @param {Element} section The section element containing legal content
 * @returns {HTMLElement} The legal bar element
 */
function buildLegalBar(section) {
  const legal = document.createElement('div');
  legal.className = 'footer-legal';

  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return legal;

  // First <p><a> is the brand link — include TR logo icon
  const brandP = wrapper.querySelector('p:first-child a');
  if (brandP) {
    const brand = document.createElement('a');
    brand.href = brandP.href;
    brand.className = 'footer-legal-brand';
    const icon = document.createElement('span');
    icon.className = 'icon icon-tr-logo';
    brand.append(icon);
    brand.append(document.createTextNode(` ${brandP.textContent}`));
    legal.append(brand);
  }

  // The <ul> contains legal links
  const legalUl = wrapper.querySelector('ul');
  if (legalUl) {
    const legalNav = document.createElement('nav');
    legalNav.setAttribute('aria-label', 'legal');
    legalNav.append(legalUl);
    legal.append(legalNav);
  }

  // Last <p><a> is the CCPA link
  const allPs = wrapper.querySelectorAll('p');
  const lastP = Array.from(allPs).at(-1);
  const ccpaLink = lastP?.querySelector('a');
  if (ccpaLink && ccpaLink !== brandP) {
    ccpaLink.className = 'footer-legal-ccpa';
    legal.append(ccpaLink);
  }

  return legal;
}

/**
 * Sets up mobile accordion behavior for footer columns.
 * On mobile, headings become clickable buttons that expand/collapse their link lists.
 * @param {HTMLElement} nav The footer nav element
 */
function setupMobileAccordion(nav) {
  const columns = nav.querySelectorAll('.footer-column');

  columns.forEach((column) => {
    const heading = column.querySelector('h3');
    const linkList = column.querySelector('ul');
    if (!heading || !linkList) return;

    // Create a button to wrap heading text
    const button = document.createElement('button');
    button.className = 'footer-column-toggle';
    button.setAttribute('aria-expanded', 'false');
    const span = document.createElement('span');
    span.textContent = heading.textContent;
    button.append(span);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      // Close all others
      nav.querySelectorAll('.footer-column').forEach((col) => {
        if (col !== column) {
          col.classList.remove('footer-column-expanded');
          col.querySelector('.footer-column-toggle')?.setAttribute('aria-expanded', 'false');
        }
      });
      column.classList.toggle('footer-column-expanded', !expanded);
      button.setAttribute('aria-expanded', String(!expanded));
    });

    heading.textContent = '';
    heading.append(button);
  });
}

/**
 * Updates accordion visibility based on viewport.
 * @param {HTMLElement} nav The footer nav element
 */
function updateAccordionState(nav) {
  const isDesktop = DESKTOP_MQ.matches;
  nav.querySelectorAll('.footer-column').forEach((col) => {
    const btn = col.querySelector('.footer-column-toggle');
    if (isDesktop) {
      col.classList.add('footer-column-expanded');
      btn?.setAttribute('aria-expanded', 'true');
    } else {
      col.classList.remove('footer-column-expanded');
      btn?.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Loads and decorates the footer.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');

  // Extract sections from fragment
  const sections = fragment.querySelectorAll(':scope .section');
  const navSection = sections[0];
  const legalSection = sections[1];

  // Build navigation columns from authored content
  if (navSection) {
    const nav = buildFooterNav(navSection);
    decorateIcons(nav);
    footer.append(nav);
    setupMobileAccordion(nav);

    // Respond to viewport changes
    updateAccordionState(nav);
    DESKTOP_MQ.addEventListener('change', () => updateAccordionState(nav));
  }

  // Build legal bar from authored content
  if (legalSection) {
    const legalBar = buildLegalBar(legalSection);
    decorateIcons(legalBar);
    footer.append(legalBar);
  }

  block.append(footer);
}
