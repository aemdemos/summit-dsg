import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_COLUMNS = [
  {
    heading: 'About us',
    links: [
      { text: 'About Thomson Reuters', href: 'https://www.thomsonreuters.com/en/about-us' },
      { text: 'Annual report', href: 'https://ir.thomsonreuters.com/financial-information/annual-reports' },
      { text: 'Careers', href: 'https://www.thomsonreuters.com/en/careers' },
      { text: 'Digital accessibility', href: 'https://www.thomsonreuters.com/en/policies/digital-accessibility-policy' },
      { text: 'Investor relations', href: 'https://ir.thomsonreuters.com/' },
      { text: 'Our purpose', href: 'https://www.thomsonreuters.com/en/about-us/our-purpose' },
      { text: 'Press releases', href: 'https://www.thomsonreuters.com/en/press-releases' },
      { text: 'Social impact', href: 'https://www.thomsonreuters.com/en/about-us/social-impact' },
      { text: 'The Trust Principles', href: 'https://www.thomsonreuters.com/en/about-us/trust-principles' },
    ],
  },
  {
    heading: 'Learn more',
    links: [
      { text: 'Partnership information', href: 'https://www.thomsonreuters.com/en/partners' },
      { text: 'Supplier information', href: 'https://www.thomsonreuters.com/en/resources/global-sourcing-procurement' },
      { text: 'Global sites directory', href: 'https://www.thomsonreuters.com/en/global-gateway' },
      { text: 'Site map', href: 'https://www.thomsonreuters.com/en/site-map' },
    ],
  },
  {
    heading: 'Contact us',
    links: [
      { text: 'Sales & support', href: 'https://www.thomsonreuters.com/en/contact-us' },
      { text: 'Investors support', href: 'https://ir.thomsonreuters.com/shareholder-services/investor-contacts' },
      { text: 'Media relations', href: 'https://www.thomsonreuters.com/en/contact-us/media-contacts' },
      { text: 'Office locations', href: 'https://www.thomsonreuters.com/en/locations' },
    ],
  },
  {
    heading: 'Reuters',
    links: [
      { text: 'Reuters News & Media', href: 'https://reutersagency.com/' },
      { text: 'Reuters Best', href: 'https://reutersbest.com/' },
      { text: 'Reuters Professionals', href: 'https://www.reutersprofessional.com/homepage/p/1' },
    ],
  },
  {
    heading: 'Core Publishing Solutions',
    links: [
      { text: 'Book printing for publishers', href: 'https://coreprintsolutions.thomsonreuters.com/' },
    ],
  },
  {
    heading: 'Connect with us',
    links: [
      { text: 'Facebook', href: 'https://www.facebook.com/thomsonreuters' },
      { text: 'Instagram', href: 'https://www.instagram.com/thomsonreuters/' },
      { text: 'LinkedIn', href: 'https://www.linkedin.com/company/thomson-reuters' },
      { text: 'X', href: 'https://x.com/thomsonreuters' },
      { text: 'YouTube', href: 'https://www.youtube.com/thomsonreuters' },
    ],
  },
];

const LEGAL_LINKS = [
  { text: 'Cookie policy', href: '/en/privacy-statement#cookies' },
  { text: 'Terms of use', href: '/en/terms-of-use' },
  { text: 'Privacy statement', href: '/en/privacy-statement' },
  { text: 'Copyright', href: '/en/policies/copyright' },
  { text: 'Supply chain transparency', href: '/en/modern-slavery-act' },
];

function buildFooterColumns() {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'site footer');
  const ul = document.createElement('ul');
  ul.className = 'footer-columns';

  FOOTER_COLUMNS.forEach((col) => {
    const li = document.createElement('li');
    li.className = 'footer-column';
    const h3 = document.createElement('h3');
    h3.textContent = col.heading;
    li.append(h3);

    const linkList = document.createElement('ul');
    col.links.forEach((link) => {
      const linkLi = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      linkLi.append(a);
      linkList.append(linkLi);
    });
    li.append(linkList);
    ul.append(li);
  });

  nav.append(ul);
  return nav;
}

function buildLegalBar() {
  const legal = document.createElement('div');
  legal.className = 'footer-legal';

  const brand = document.createElement('a');
  brand.href = 'https://www.thomsonreuters.com/en.html';
  brand.className = 'footer-legal-brand';
  brand.textContent = 'Thomson Reuters';
  legal.append(brand);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'legal');
  const ul = document.createElement('ul');
  LEGAL_LINKS.forEach((link) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    li.append(a);
    ul.append(li);
  });
  nav.append(ul);
  legal.append(nav);

  const ccpa = document.createElement('a');
  ccpa.href = 'https://www.thomsonreuters.com/ccpa-dsar';
  ccpa.className = 'footer-legal-ccpa';
  ccpa.textContent = 'Do not sell or share my personal information';
  legal.append(ccpa);

  return legal;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Replace minimal footer content with full columns
  footer.textContent = '';
  footer.append(buildFooterColumns());
  footer.append(buildLegalBar());

  block.append(footer);
}
