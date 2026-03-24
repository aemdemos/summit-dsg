import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > :where(a,p)');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

const MAX_BREADCRUMB_DEPTH = 20;

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a[href]').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    let depth = 0;
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
      depth += 1;
    } while (menuItem && depth < MAX_BREADCRUMB_DEPTH);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  crumbs.unshift({ title: 'Home', url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs.at(-1).url = null;
  }
  crumbs.at(-1)['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'), document.location.href);

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

function splitNavSections(nav) {
  if (nav.children.length >= 3) return;
  const wrapper = nav.children[0];
  if (!wrapper) return;

  const contentHost = wrapper.querySelector('.default-content-wrapper') || wrapper;
  const brandDiv = document.createElement('div');
  const sectionsDiv = document.createElement('div');
  const toolsDiv = document.createElement('div');

  [...contentHost.children].forEach((el) => {
    if (el.tagName === 'UL') {
      sectionsDiv.append(el);
    } else if (!brandDiv.hasChildNodes()) {
      brandDiv.append(el);
    } else {
      toolsDiv.append(el);
    }
  });
  wrapper.remove();
  nav.append(brandDiv, sectionsDiv, toolsDiv);
}

function decorateNavBrand(nav) {
  const navBrand = nav.querySelector('.nav-brand');
  if (!navBrand) return;
  const brandLink = navBrand.querySelector('.button') || navBrand.querySelector('a');
  if (!brandLink) return;
  brandLink.className = '';
  const btnContainer = brandLink.closest('.button-container')
    || brandLink.closest('.button-wrapper');
  if (btnContainer) btnContainer.className = '';

  // Replace text with logo image
  const logo = document.createElement('img');
  logo.src = '/icons/tr-logo.svg';
  logo.alt = 'Thomson Reuters';
  logo.className = 'nav-brand-logo';
  logo.width = 250;
  logo.height = 61;
  brandLink.textContent = '';
  brandLink.append(logo);
  brandLink.setAttribute('aria-label', 'Thomson Reuters Home');
}

const NAV_ITEMS = ['Solutions', 'Products', 'Purchase', 'Resources'];

const MEGA_MENUS = {
  Solutions: {
    columns: [
      {
        groups: [{
          heading: 'Law firms',
          links: [
            ['AI for legal', 'https://legal.thomsonreuters.com/en/legal/legal-ai'],
            ['Legal research & guidance', 'https://legal.thomsonreuters.com/en/legal/legal-research-guidance'],
            ['Legal forms', 'https://legal.thomsonreuters.com/en/legal/legal-forms'],
            ['Business development', 'https://legal.thomsonreuters.com/en/legal/business-development'],
            ['Legal data & document management', 'https://legal.thomsonreuters.com/en/legal/data-document-management'],
            ['Business practice & procedure', 'https://legal.thomsonreuters.com/en/legal/corporate-business-organization'],
            ['Drafting software, service & guidance', 'https://legal.thomsonreuters.com/en/legal/drafting-software-service-guidance'],
            ['Evidence', 'https://legal.thomsonreuters.com/en/legal/evidence'],
            ['Trial readiness, process & case guidance', 'https://legal.thomsonreuters.com/en/legal/trial-readiness-process-case-guidance'],
          ],
        }],
      },
      {
        groups: [{
          heading: 'Tax, audit & accounting firms',
          links: [
            ['Audit & accounting', 'https://tax.thomsonreuters.com/en/tax-accounting/audit-accounting'],
            ['Tax planning & preparation', 'https://tax.thomsonreuters.com/en/tax-accounting/tax-planning-preparation'],
            ['Tax research & guidance', 'https://tax.thomsonreuters.com/en/tax-accounting/tax-research-guidance'],
            ['Data & document management', 'https://tax.thomsonreuters.com/en/tax-accounting/data-document-management'],
            ['Financial planning & analysis', 'https://tax.thomsonreuters.com/en/tax-accounting/financial-planning-analysis'],
            ['Estate planning', 'https://tax.thomsonreuters.com/en/tax-accounting/estate-planning'],
            ['Practice management & growth', 'https://tax.thomsonreuters.com/en/tax-accounting/practice-management-growth'],
            ['Professional development & education', 'https://tax.thomsonreuters.com/en/tax-accounting/professional-development-education'],
          ],
        }],
      },
      {
        groups: [
          {
            heading: 'Corporations',
            links: [['All corporate solutions', '/en/products-services/corporate-solutions']],
          },
          {
            heading: 'Governments',
            links: [['All government solutions', '/en/products-services/government']],
          },
        ],
      },
    ],
    sidebar: {
      heading: 'Success stories',
      cards: [
        {
          title: 'A true competitive advantage',
          text: 'Law firm Zarwin Baum\u2019s embrace of generative AI as the natural next step in the evolution'
            + ' of legal work and their adoption of CoCounsel Legal has helped them achieve remarkable'
            + ' efficiency gains and improved client relationships.',
          url: 'https://legal.thomsonreuters.com/en/insights/case-studies/zarwin-baum-experiences-the-transformative-power-of-genai-in-cocounsel',
        },
        {
          title: 'Workflow transformation drives impact',
          text: 'Brinks, a global leader in secure logistics and security solutions,'
            + ' used CoCounsel to reimagine what was possible with AI tools,'
            + ' turning legal challenges into a competitive advantage.',
          url: 'https://legal.thomsonreuters.com/en/insights/case-studies/cocounsel-empowers-brinks-to-transform-legal-workflows-and-drive-impact',
        },
        {
          title: 'The forefront of audit tech',
          text: 'A better auditing workflow solution was the answer to multiple challenges'
            + ' faced by The Mercadien Group. Find out how they achieved greater efficiency'
            + ' by embracing Cloud Audit Suite.',
          url: 'https://tax.thomsonreuters.com/en/insights/case-studies/mercadien-and-thomson-reuters-partnership',
        },
      ],
      extraLinks: [
        ['Partnership program', '/en/partners'],
        ['Partner directory', '/en/partners/partner-directory'],
      ],
      cta: true,
    },
  },

  Products: {
    columns: [
      {
        groups: [
          {
            heading: 'Legal',
            links: [
              ['CoCounsel Legal', 'https://legal.thomsonreuters.com/en/products/cocounsel-legal'],
              ['HighQ', 'https://legal.thomsonreuters.com/en/products/highq'],
              ['Legal Tracker', 'https://legal.thomsonreuters.com/en/products/legal-tracker'],
              ['Practical Law', 'https://legal.thomsonreuters.com/en/products/practical-law'],
              ['Westlaw Advantage', 'https://legal.thomsonreuters.com/en/products/westlaw-advantage'],
              ['Westlaw Edge', 'https://legal.thomsonreuters.com/en/products/westlaw-edge'],
              ['View all', 'https://legal.thomsonreuters.com/en/products#tab=plp-products&cf-tr_plp_disciplinecategorysubcategory=Legal'],
            ],
          },
          {
            heading: 'Trade & supply',
            links: [
              ['ONESOURCE Foreign Trade Zone Management', 'https://tax.thomsonreuters.com/en/products/onesource-foreign-trade-zone-management'],
              ['ONESOURCE Global Classification AI', 'https://tax.thomsonreuters.com/en/products/onesource-global-classification-ai'],
              ['View all', 'https://tax.thomsonreuters.com/en/products#tab=plp-products&cf-tr_plp_disciplinecategorysubcategory=International%20trade%20%26%20supply%20chain&sortCriteria=relevancy'],
            ],
          },
        ],
      },
      {
        groups: [
          {
            heading: 'Tax, audit & accounting',
            links: [
              ['1040SCAN', 'https://tax.thomsonreuters.com/en/products/1040scan'],
              ['Audit Intelligence Analyze', 'https://tax.thomsonreuters.com/en/products/audit-intelligence-analyze'],
              ['CoCounsel Audit', 'https://tax.thomsonreuters.com/en/products/cocounsel-audit'],
              ['CoCounsel Tax', 'https://tax.thomsonreuters.com/en/products/cocounsel-tax'],
              ['Ready to Advise', 'https://tax.thomsonreuters.com/en/products/ready-to-advise'],
              ['Ready to Review', 'https://tax.thomsonreuters.com/en/products/ready-to-review'],
              ['View all', 'https://tax.thomsonreuters.com/en/products#tab=plp-products&cf-tr_plp_disciplinecategorysubcategory=Tax%20%26%20accounting'],
            ],
          },
          {
            heading: 'Corporate tax',
            links: [
              ['CoCounsel Tax', 'https://tax.thomsonreuters.com/en/products/cocounsel-tax'],
              ['ONESOURCE Determination', 'https://tax.thomsonreuters.com/en/products/onesource-determination'],
              ['ONESOURCE Income Tax', 'https://tax.thomsonreuters.com/en/products/onesource-income-tax'],
              ['ONESOURCE Indirect Compliance', 'https://tax.thomsonreuters.com/en/onesource/indirect-tax/compliance'],
              ['ONESOURCE Pagero', 'https://tax.thomsonreuters.com/en/products/onesource-pagero'],
              ['ONESOURCE Tax Provision', 'https://tax.thomsonreuters.com/en/onesource/tax-provision'],
              ['View all', 'https://tax.thomsonreuters.com/en/products#tab=plp-products&cf-tr_plp_disciplinecategorysubcategory=Tax%20%26%20accounting'],
            ],
          },
        ],
      },
      {
        groups: [
          {
            heading: 'Risk & fraud',
            links: [
              ['CLEAR', 'https://legal.thomsonreuters.com/en/products/clear'],
              ['CLEAR Adverse Media', 'https://legal.thomsonreuters.com/en/products/clear-adverse-media'],
              ['CLEAR ID Confirm', 'https://legal.thomsonreuters.com/en/products/clear-id-confirm'],
              ['CLEAR Investigate', 'https://legal.thomsonreuters.com/en/products/clear-investigate'],
              ['CLEAR Risk Inform', 'https://legal.thomsonreuters.com/en/products/clear-risk-inform'],
              ['Fraud Detect', 'https://legal.thomsonreuters.com/en/products/fraud-detect'],
              ['View all', 'https://legal.thomsonreuters.com/en/products#tab=plp-products&cf-tr_plp_disciplinecategorysubcategory=Risk%2C%20fraud%20%26%20investigations&sortCriteria=relevancy'],
            ],
          },
          {
            heading: 'Books',
            links: [
              ['Legal books', 'https://store.legal.thomsonreuters.com/en-us/home'],
              ['Tax books', 'https://store.tax.thomsonreuters.com/accounting/'],
            ],
          },
        ],
      },
    ],
    sidebar: {
      heading: 'Recommended products',
      cards: [
        {
          title: 'CoCounsel Legal',
          text: 'Transform your work with the only AI legal solution uniting research,'
            + ' drafting, and document analysis in a single experience.',
          url: 'https://legal.thomsonreuters.com/en/products/cocounsel-legal',
        },
        {
          title: 'CoCounsel Tax',
          text: 'Transform your tax practice with CoCounsel Tax, an AI-powered assistant'
            + ' that combines trustworthy answers, automation, and firm knowledge'
            + ' into one seamless platform.',
          url: 'https://tax.thomsonreuters.com/en/products/cocounsel-tax',
        },
        {
          title: 'CLEAR Investigate',
          text: 'Intelligently surface critical connections and insights in actionable format'
            + ' through AI-driven research workflows seamlessly integrated with the trusted'
            + ' and transparent CLEAR platform.',
          url: 'https://legal.thomsonreuters.com/en/products/clear-investigate',
        },
      ],
      cta: true,
    },
  },

  Purchase: {
    columns: [
      {
        groups: [{
          heading: 'Buy solutions',
          links: [
            ['CoCounsel Essentials', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/cocounsel-essentials/plans-pricing'],
            ['CoCounsel Legal', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/cocounsel-legal/700/plans-pricing'],
            ['Practical Law', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/practical-law/plans-pricing'],
            ['Practical Law Dynamic Tool Set with CoCounsel Essentials', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/cocounsel-legal/500/plans-pricing'],
            ['Westlaw Advantage', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/westlaw-advantage/plans-pricing'],
            ['Westlaw Advantage with CoCounsel Essentials', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/cocounsel-legal/300/plans-pricing'],
            ['Westlaw Edge', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/westlaw-edge/plans-pricing'],
            ['Westlaw Edge with AI-Assisted Research', 'https://sales.legalsolutions.thomsonreuters.com/en-us/products/westlaw-edgeAAR/plans-pricing'],
          ],
        }],
      },
      {
        groups: [
          {
            heading: 'Buy books',
            links: [
              ['Legal books', 'https://store.legal.thomsonreuters.com/en-us/home'],
              ['Tax books', 'https://store.tax.thomsonreuters.com/accounting/'],
            ],
          },
          {
            heading: 'Contact sales',
            links: [
              ['For legal products', 'https://legal.thomsonreuters.com/en/contact-sales'],
              ['For tax products', 'https://tax.thomsonreuters.com/en/contact-sales'],
            ],
          },
        ],
      },
    ],
    sidebar: { heading: 'Questions? We are here to help.', cta: true },
  },

  Resources: {
    columns: [
      {
        groups: [
          {
            heading: 'Insights',
            links: [
              ['Thomson Reuters Institute', '/en/institute'],
              ['Innovation @ Thomson Reuters', 'https://www.thomsonreuters.com/en-us/posts/innovation/'],
              ['Legal insights', 'https://legal.thomsonreuters.com/en/insights#t=insights&sort=%40tr_wpublishedtime%20descending'],
              ['Tax insights', 'https://tax.thomsonreuters.com/en/insights#t=insights&sort=%40tr_wpublishedtime%20descending&numberOfResults=12'],
            ],
          },
          {
            heading: 'Events',
            links: [
              ['Upcoming events', 'https://www.thomsonreuters.com/en-us/posts/events/'],
              ['On-demand webinars', 'https://www.thomsonreuters.com/en-us/posts/on-demand-webinars/'],
            ],
          },
        ],
      },
      {
        groups: [
          {
            heading: 'Product training',
            links: [
              ['Legal learning hub', 'https://training.legalprofessionals.thomsonreuters.com/learn/signin'],
              ['Tax & accounting professional services', 'https://tax.thomsonreuters.com/us/en/cs-professional-suite/professional-services'],
              ['On-demand learning', 'https://training.thomsonreuters.com/'],
              ['ONESOURCE University', 'https://tax.thomsonreuters.com/en/onesource/services/onesource-university'],
            ],
          },
          {
            heading: 'Product communities',
            links: [
              ['Legal', 'https://community.thomsonreuters.com/legal/'],
              ['Tax & accounting', 'https://community.thomsonreuters.com/tax-accounting/'],
              ['All communities', 'https://community.thomsonreuters.com/'],
            ],
          },
        ],
      },
      {
        groups: [{
          heading: 'Developers',
          links: [
            ['Developer portal', 'https://developers.thomsonreuters.com/pages/home'],
            ['API catalog', 'https://developers.thomsonreuters.com/pages/api-catalog?tab=messages&numberOfResults=10'],
            ['Use case library', 'https://developers.thomsonreuters.com/pages/use-case-library?tab=messages&numberOfResults=10'],
            ['Communities', 'https://community.thomsonreuters.com/developers/'],
          ],
        }],
      },
    ],
    sidebar: {
      heading: 'Highlights',
      cards: [
        {
          title: '2026 SKILLS showcase',
          text: 'Join weekly sessions to experience in-depth demonstrations of the leading'
            + ' legal AI products while connecting with strategic law firm leaders in knowledge'
            + ' management, innovation, and AI.',
          url: 'https://skills.law/',
        },
        {
          title: 'Ghosts on the ledger',
          text: 'Payroll fraud is a major compliance risk. Learn how payroll analytics'
            + ' and AI-powered tools can help exorcise phantom employees and employers.',
          url: 'https://tax.thomsonreuters.com/news/'
            + 'ghosts-on-the-ledger-how-payroll-analytics-can-help-exorcise-phantom-employees-and-employers/',
        },
        {
          title: 'Future of professionals report 2025',
          text: 'The Thomson Reuters Future of Professionals Report 2025 reveals how AI'
            + ' continues to shape professional work \u2014 and what it takes to get ahead.',
          url: '/content/dam/ewp-m/documents/thomsonreuters/en/pdf/reports/'
            + 'future-of-professionals-report-2025.pdf',
        },
      ],
    },
  },
};

// SVG namespace is an identifier, not a network URL — http:// is required per spec
const SVG_NS = ['http', '://www.w3.org/2000/svg'].join('');

function createSvgIcon(size, children) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  children.forEach(([tag, attrs]) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    svg.append(el);
  });
  return svg;
}

function buildMegaMenuColumn(col) {
  const div = document.createElement('div');
  div.className = 'mega-col';
  col.groups.forEach((group) => {
    const h3 = document.createElement('h3');
    h3.textContent = group.heading;
    div.append(h3);
    const ul = document.createElement('ul');
    group.links.forEach(([label, href]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
      ul.append(li);
    });
    div.append(ul);
  });
  return div;
}

function buildMegaSidebar(sidebar) {
  const aside = document.createElement('aside');
  aside.className = 'mega-sidebar';

  if (sidebar.heading) {
    const h3 = document.createElement('h3');
    h3.textContent = sidebar.heading;
    aside.append(h3);
  }

  if (sidebar.cards) {
    sidebar.cards.forEach((card) => {
      const a = document.createElement('a');
      a.href = card.url;
      a.className = 'mega-card';
      const strong = document.createElement('strong');
      strong.textContent = card.title;
      a.append(strong);
      const p = document.createElement('p');
      p.textContent = card.text;
      a.append(p);
      aside.append(a);
    });
  }

  if (sidebar.extraLinks) {
    const ul = document.createElement('ul');
    ul.className = 'mega-extra-links';
    sidebar.extraLinks.forEach(([label, href]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
      ul.append(li);
    });
    aside.append(ul);
  }

  if (sidebar.cta) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'mega-cta';
    // Only show CTA label when sidebar heading doesn't already say it
    if (!sidebar.heading || !sidebar.heading.toLowerCase().includes('questions')) {
      const label = document.createElement('p');
      label.textContent = 'Questions? We are here to help.';
      ctaWrap.append(label);
    }
    const a = document.createElement('a');
    a.href = '/en/contact-us';
    a.className = 'mega-cta-btn';
    a.textContent = 'Contact us';
    ctaWrap.append(a);
    aside.append(ctaWrap);
  }

  return aside;
}

function buildMegaMenu(label, data) {
  const panel = document.createElement('div');
  panel.className = 'nav-mega-menu';
  panel.setAttribute('data-menu', label.toLowerCase());
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', label);

  const header = document.createElement('div');
  header.className = 'mega-header';
  const h2 = document.createElement('h2');
  h2.textContent = label;
  header.append(h2);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'mega-close';
  closeBtn.setAttribute('aria-label', `Close ${label} menu`);
  closeBtn.append(createSvgIcon(20, [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ]));
  header.append(closeBtn);
  panel.append(header);

  const body = document.createElement('div');
  body.className = 'mega-body';
  const cols = document.createElement('div');
  cols.className = 'mega-columns';
  data.columns.forEach((col) => cols.append(buildMegaMenuColumn(col)));
  body.append(cols);

  if (data.sidebar) {
    body.append(buildMegaSidebar(data.sidebar));
  }

  panel.append(body);
  return panel;
}

function closeMegaMenu(navWrapper) {
  const open = navWrapper.querySelector('.nav-mega-menu.open');
  if (open) open.classList.remove('open');
  navWrapper.querySelectorAll('.nav-section-btn[aria-expanded="true"]').forEach((btn) => {
    btn.setAttribute('aria-expanded', 'false');
  });
}

function restructureNavSections(nav) {
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;

  const wrapper = navSections.querySelector('.default-content-wrapper') || navSections;
  const existingUl = wrapper.querySelector('ul');
  if (!existingUl) return;

  existingUl.textContent = '';
  NAV_ITEMS.forEach((label) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'nav-section-btn';
    btn.textContent = label;
    btn.setAttribute('aria-expanded', 'false');
    li.append(btn);
    existingUl.append(li);
  });
}

function iconSearch() {
  return createSvgIcon(28, [
    ['circle', { cx: '11', cy: '11', r: '8' }],
    ['path', { d: 'm21 21-4.3-4.3' }],
  ]);
}

function iconHelp() {
  return createSvgIcon(28, [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }],
    ['path', { d: 'M12 17h.01' }],
  ]);
}

function iconUser() {
  return createSvgIcon(28, [
    ['circle', { cx: '12', cy: '8', r: '4' }],
    ['path', { d: 'M20 21a8 8 0 0 0-16 0' }],
  ]);
}

function restructureNavTools(nav) {
  const navTools = nav.querySelector('.nav-tools');
  if (!navTools) return;

  navTools.textContent = '';
  const ul = document.createElement('ul');
  ul.className = 'nav-tools-list';

  [
    { label: 'Site Search', createIcon: iconSearch },
    { label: 'Help and Support', createIcon: iconHelp },
    { label: 'User Profile', createIcon: iconUser },
  ].forEach(({ label, createIcon }) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', label);
    btn.className = 'nav-tool-btn';
    const span = document.createElement('span');
    span.className = 'nav-tool-icon';
    span.append(createIcon());
    btn.append(span);
    li.append(btn);
    ul.append(li);
  });

  navTools.append(ul);
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  splitNavSections(nav);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  decorateNavBrand(nav);
  restructureNavSections(nav);
  restructureNavTools(nav);

  const navSections = nav.querySelector('.nav-sections');

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  NAV_ITEMS.forEach((label) => {
    const data = MEGA_MENUS[label];
    if (data) navWrapper.append(buildMegaMenu(label, data));
  });

  navWrapper.querySelectorAll('.nav-section-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const label = btn.textContent.trim().toLowerCase();
      const wasExpanded = btn.getAttribute('aria-expanded') === 'true';
      closeMegaMenu(navWrapper);
      if (!wasExpanded) {
        const panel = navWrapper.querySelector(`.nav-mega-menu[data-menu="${label}"]`);
        if (panel) {
          panel.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      }
    });
  });

  // Wire up close buttons
  navWrapper.querySelectorAll('.mega-close').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => closeMegaMenu(navWrapper));
  });

  // Close mega-menu on Escape
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeMegaMenu(navWrapper);
  });

  // Close mega-menu on click outside nav
  document.addEventListener('click', (e) => {
    if (!navWrapper.contains(e.target)) closeMegaMenu(navWrapper);
  });

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
