import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

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
      nav.querySelector('button')?.focus();
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
  if (!button) return;
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
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
  const brandLink = document.querySelector('.nav-brand a[href]');
  if (!brandLink) return crumbs;
  const homeUrl = brandLink.href;

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
  if (crumbs.length > 1) {
    crumbs.at(-1).url = null;
  }
  crumbs.at(-1)['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';
  const crumbs = await buildBreadcrumbsFromNavTree(
    document.querySelector('.nav-sections'),
    document.location.href,
  );
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
  brandLink.setAttribute('aria-label', 'Thomson Reuters Home');

  const logo = document.createElement('img');
  logo.src = '/icons/tr-header-logo.svg';
  logo.alt = 'Thomson Reuters';
  logo.className = 'nav-brand-logo';
  brandLink.textContent = '';
  brandLink.append(logo);
}

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

function createFilledSvgIcon(w, h, viewBox, d) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  return svg;
}

function parseColumnGroups(colLi) {
  const groups = [];
  const strongs = colLi.querySelectorAll(':scope > strong, :scope > p > strong');
  strongs.forEach((strong) => {
    if (strong.closest('a')) return;
    const heading = strong.textContent.trim();
    const startEl = strong.parentElement.tagName === 'P' ? strong.parentElement : strong;
    let next = startEl.nextElementSibling;
    while (next && next.tagName !== 'UL') next = next.nextElementSibling;
    const links = [];
    if (next && next.tagName === 'UL') {
      next.querySelectorAll(':scope > li').forEach((li) => {
        const a = li.querySelector('a');
        if (a) links.push([a.textContent.trim(), a.href]);
      });
    }
    groups.push({ heading, links });
  });
  return groups;
}

function parseSidebar(sidebarLi) {
  const emEl = sidebarLi.querySelector(':scope > em, :scope > p > em');
  const heading = emEl ? emEl.textContent.trim() : '';
  const cards = [];
  const extraLinks = [];
  let ctaLabel = null;
  let ctaUrl = null;

  const cardUl = sidebarLi.querySelector(':scope > ul');
  if (cardUl) {
    cardUl.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector('a');
      if (!a) return;
      const title = a.textContent.trim();
      const url = a.href;
      const clone = li.cloneNode(true);
      const cloneLink = clone.querySelector('a');
      if (cloneLink) cloneLink.remove();
      const text = clone.textContent.trim().replace(/^[\s\-\u2013\u2014]+/, '');
      cards.push({ title, text, url });
    });
  }

  sidebarLi.querySelectorAll(':scope > p').forEach((p) => {
    const link = p.querySelector('a');
    const strong = p.querySelector('strong');
    // decorateButtons converts <strong><a> into <a class="button primary">,
    // so detect CTA by checking for the button class as well as strong wrapping.
    const isButton = link && (link.classList.contains('primary') || link.classList.contains('button'));
    if (link && (strong || isButton)) {
      ctaUrl = link.href;
    } else if (link && !strong) {
      extraLinks.push([link.textContent.trim(), link.href]);
    } else if (strong && !link) {
      ctaLabel = strong.textContent.trim();
    }
  });

  return {
    heading, cards, extraLinks, ctaLabel, ctaUrl,
  };
}

function parseNavItems(nav) {
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return [];
  const wrapper = navSections.querySelector('.default-content-wrapper') || navSections;
  const topUl = wrapper.querySelector('ul');
  if (!topUl) return [];

  const items = [];
  topUl.querySelectorAll(':scope > li').forEach((li) => {
    let label = Array.from(li.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join('')
      .trim();
    if (!label) {
      const p = li.querySelector(':scope > p');
      if (p) label = p.textContent.trim();
    }
    const nestedUl = li.querySelector(':scope > ul');
    if (!nestedUl) {
      items.push({ label, hasMega: false });
      return;
    }
    const columns = [];
    let sidebar = null;
    nestedUl.querySelectorAll(':scope > li').forEach((colLi) => {
      if (colLi.querySelector(':scope > em, :scope > p > em')) {
        sidebar = parseSidebar(colLi);
        return;
      }
      const groups = parseColumnGroups(colLi);
      if (groups.length) columns.push({ groups });
    });
    items.push({
      label, hasMega: true, columns, sidebar,
    });
  });
  return items;
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

  if (sidebar.cards.length) {
    sidebar.cards.forEach((card) => {
      const a = document.createElement('a');
      a.href = card.url;
      a.className = 'mega-card';
      const strong = document.createElement('strong');
      strong.textContent = card.title;
      a.append(strong);
      if (card.text) {
        const p = document.createElement('p');
        p.textContent = card.text;
        a.append(p);
      }
      aside.append(a);
    });
  }

  if (sidebar.extraLinks.length) {
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

  if (sidebar.ctaUrl) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'mega-cta';
    if (sidebar.ctaLabel) {
      const label = document.createElement('p');
      label.textContent = sidebar.ctaLabel;
      ctaWrap.append(label);
    }
    const a = document.createElement('a');
    a.href = sidebar.ctaUrl;
    a.className = 'mega-cta-btn';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'mega-cta-icon';
    iconSpan.append(createFilledSvgIcon(16, 16, '0 0 16 16', [
      'M2 1C0.890625 1 0 1.89062 0 3V11C0 12.1094 0.890625 13',
      '2 13H5V15.1875C5 15.75 5.65625 16.0938 6.125',
      '15.75L10 13H14C15.1094 13 16 12.1094 16 11V3C16',
      '1.89062 15.1094 1 14 1H2Z',
    ].join(' ')));
    a.append(iconSpan);
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Contact us';
    a.append(textSpan);
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

function buildNavButtons(nav, navItems) {
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;
  const wrapper = navSections.querySelector('.default-content-wrapper') || navSections;
  const existingUl = wrapper.querySelector('ul');
  if (!existingUl) return;

  existingUl.textContent = '';
  navItems.forEach(({ label }) => {
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
  return createFilledSvgIcon(17, 17, '0 0 17 17', [
    'M13 6.5C13 7.9375 12.5312 9.28125 11.75 10.3438L15.6875',
    '14.3125C16.0938 14.6875 16.0938 15.3438 15.6875',
    '15.7188C15.3125 16.125 14.6562 16.125 14.2812',
    '15.7188L10.3125 11.75C9.25 12.5625 7.90625 13 6.5',
    '13C2.90625 13 0 10.0938 0 6.5C0 2.9375 2.90625 0 6.5',
    '0C10.0625 0 13 2.9375 13 6.5ZM6.5 11C8.09375 11 9.5625',
    '10.1562 10.375 8.75C11.1875 7.375 11.1875 5.65625 10.375',
    '4.25C9.5625 2.875 8.09375 2 6.5 2C4.875 2 3.40625 2.875',
    '2.59375 4.25C1.78125 5.65625 1.78125 7.375 2.59375',
    '8.75C3.40625 10.1562 4.875 11 6.5 11Z',
  ].join(' '));
}

function iconHelp() {
  return createFilledSvgIcon(18, 16, '0 0 18 16', [
    'M9 16C6.125 16 3.5 14.5 2.0625 12C0.625 9.53125 0.625',
    '6.5 2.0625 4C3.5 1.53125 6.125 0 9 0C11.8438 0 14.4688',
    '1.53125 15.9062 4C17.3438 6.5 17.3438 9.53125 15.9062',
    '12C14.4688 14.5 11.8438 16 9 16ZM6.28125',
    '5.1875V5.21875C6.15625 5.59375 6.34375 6.03125 6.75',
    '6.1875C7.125 6.3125 7.5625 6.125 7.6875',
    '5.71875L7.71875 5.6875C7.75 5.59375 7.84375 5.53125',
    '7.9375 5.53125H9.75C10.0312 5.53125 10.25 5.71875 10.25',
    '6C10.25 6.15625 10.1562 6.3125 10 6.40625L8.625',
    '7.1875C8.375 7.3125 8.25 7.5625 8.25',
    '7.84375V8.25C8.25 8.6875 8.5625 9 9 9C9.40625 9 9.71875',
    '8.6875 9.75 8.28125L10.75 7.6875C11.3438 7.34375 11.75',
    '6.6875 11.75 6C11.75 4.90625 10.8438 4 9.75',
    '4H7.9375C7.1875 4 6.53125 4.46875 6.28125 5.1875ZM8',
    '11C8 11.5625 8.4375 12 9 12C9.53125 12 10 11.5625 10',
    '11C10 10.4688 9.53125 10 9 10C8.4375 10 8 10.4688 8 11Z',
  ].join(' '));
}

function iconUser() {
  return createFilledSvgIcon(16, 18, '0 0 16 18', [
    'M12.4688 13.0312C11.75 11.8125 10.4688 11 9',
    '11H7C5.5 11 4.21875 11.8125 3.53125',
    '13.0312C4.625 14.25 6.21875 15 8 15C9.75 15 11.3438',
    '14.25 12.4688 13.0312ZM0 9C0 6.15625 1.5 3.53125 4',
    '2.09375C6.46875 0.65625 9.5 0.65625 12',
    '2.09375C14.4688 3.53125 16 6.15625 16 9C16 11.875',
    '14.4688 14.5 12 15.9375C9.5 17.375 6.46875 17.375 4',
    '15.9375C1.5 14.5 0 11.875 0 9ZM8 9.5C8.78125 9.5',
    '9.53125 9.09375 9.9375 8.375C10.3438 7.6875 10.3438',
    '6.84375 9.9375 6.125C9.53125 5.4375 8.78125 5 8',
    '5C7.1875 5 6.4375 5.4375 6.03125 6.125C5.625 6.84375',
    '5.625 7.6875 6.03125 8.375C6.4375 9.09375 7.1875 9.5',
    '8 9.5Z',
  ].join(' '));
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

  // Parse authored mega-menu content before replacing the DOM
  const navItems = parseNavItems(nav);

  // Replace authored content with nav buttons
  buildNavButtons(nav, navItems);
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

  // Build mega-menu panels from parsed authored content
  navItems.forEach(({ label, hasMega, columns, sidebar }) => {
    if (hasMega) {
      navWrapper.append(buildMegaMenu(label, { columns, sidebar }));
    }
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

  navWrapper.querySelectorAll('.mega-close').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => closeMegaMenu(navWrapper));
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeMegaMenu(navWrapper);
  });

  document.addEventListener('click', (e) => {
    if (!navWrapper.contains(e.target)) closeMegaMenu(navWrapper);
  });

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
