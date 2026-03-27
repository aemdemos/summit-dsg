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
    if (link && strong) {
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
