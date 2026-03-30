// Back to top button
function buildBackToTop() {
  const btn = document.createElement('a');
  btn.href = '#';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to the top');

  // SVG namespace is an identifier, not a network URL — http:// is required per spec
  const svgNs = ['http', '://www.w3.org/2000/svg'].join('');
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS(svgNs, 'path');
  path.setAttribute('d', 'M12 19V5M5 12l7-7 7 7');
  svg.append(path);
  btn.append(svg);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide based on scroll position — push above footer when it's in view
  const footer = document.querySelector('footer');
  const defaultBottom = 186;
  const gap = 16;
  const toggle = () => {
    const scrolledDown = window.scrollY > 400;
    btn.classList.toggle('visible', scrolledDown);
    if (footer) {
      const footerTop = footer.getBoundingClientRect().top;
      const overlap = window.innerHeight - footerTop;
      const maxBottom = window.innerHeight - 40 - gap;
      btn.style.bottom = overlap > 0
        ? `${Math.min(overlap + gap, maxBottom)}px`
        : `${defaultBottom}px`;
    }
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  document.body.append(btn);
}

buildBackToTop();

// Scroll progress bar
function buildScrollProgress() {
  const wrapper = document.createElement('div');
  wrapper.className = 'scroll-progress-wrapper';
  const bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  wrapper.append(bar);

  const header = document.querySelector('header');

  const update = () => {
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const pastHeader = headerBottom <= 0;

    wrapper.classList.toggle('visible', pastHeader);

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
  document.body.append(wrapper);
}

buildScrollProgress();

// Chat button (visual placeholder for Salesforce Embedded Messaging)
function buildChatButton() {
  const btn = document.createElement('button');
  btn.className = 'chat-button';
  btn.setAttribute('aria-label', 'Hello, have a question? Let\'s chat.');
  btn.title = 'Hello, have a question? Let\'s chat.';

  // Chat bubble SVG matching the original Salesforce MIAW icon
  const svgNs = ['http', '://www.w3.org/2000/svg'].join('');
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 100 100');

  const icon = document.createElementNS(svgNs, 'path');
  icon.setAttribute('d', [
    'M50 0c27.614 0 50 20.52 50 45.833S77.614 91.667 50',
    '91.667c-8.458 0-16.425-1.925-23.409-5.323-13.33',
    '6.973-21.083 9.839-23.258 8.595-2.064-1.18.114-8.436',
    '6.534-21.767C3.667 65.54 0 56.08 0 45.833 0 20.52',
    '22.386 0 50 0zm4.583 61.667H22.917a2.917 2.917 0 000',
    '5.833h31.666a2.917 2.917 0 000-5.833zm12.5-15.834',
    'H22.917a2.917 2.917 0 000 5.834h44.166a2.917 2.917',
    '0 000-5.834zM79.583 30H22.917a2.917 2.917 0 000',
    '5.833h56.666a2.917 2.917 0 000-5.833z',
  ].join(' '));

  svg.append(icon);
  btn.append(svg);

  document.body.append(btn);
}

buildChatButton();

// Scroll-down prompt arrow (matches source cmp-scroll-prompt)
function buildScrollPrompt() {
  const firstSection = document.querySelector('main > .section');
  if (!firstSection) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'scroll-prompt';

  const container = document.createElement('div');
  container.className = 'scroll-prompt-arrows';

  // Two stacked chevron-down arrows
  const svgNs = ['http', '://www.w3.org/2000/svg'].join('');
  for (let i = 0; i < 2; i += 1) {
    const arrow = document.createElement('div');
    arrow.className = 'scroll-prompt-arrow';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 512 512');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', [
      'm396.6 160 19.4 20.7L256 352 96',
      '180.7l19.3-20.7L256 310.5z',
    ].join(' '));
    svg.append(path);
    arrow.append(svg);
    container.append(arrow);
  }

  wrapper.append(container);
  wrapper.addEventListener('click', () => {
    const next = firstSection.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  });

  // Hide once user scrolls past first section
  const toggle = () => {
    const { bottom } = firstSection.getBoundingClientRect();
    wrapper.classList.toggle('visible', bottom > 0);
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  firstSection.append(wrapper);
}

buildScrollPrompt();
