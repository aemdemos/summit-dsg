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
  const defaultBottom = 206;
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

// Feedback sidebar tab (visual replica of the source site's Qualtrics widget)
function buildFeedbackTab() {
  const btn = document.createElement('button');
  btn.className = 'feedback-tab';
  btn.setAttribute('aria-label', 'Feedback - Show survey');

  // Smiley face SVG (speech-bubble with smile — two eyes and a curved mouth)
  const svgNs = ['http', '://www.w3.org/2000/svg'].join('');
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');

  // Speech bubble outline
  const bubble = document.createElementNS(svgNs, 'path');
  bubble.setAttribute('d', [
    'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7',
    '8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0',
    '01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48',
    '8.48 0 018 8v.5z',
  ].join(' '));
  bubble.setAttribute('fill', '#fdfdfd');
  svg.append(bubble);

  // Left eye
  const eyeL = document.createElementNS(svgNs, 'circle');
  eyeL.setAttribute('cx', '9');
  eyeL.setAttribute('cy', '10');
  eyeL.setAttribute('r', '1.2');
  eyeL.setAttribute('fill', '#555');
  svg.append(eyeL);

  // Right eye
  const eyeR = document.createElementNS(svgNs, 'circle');
  eyeR.setAttribute('cx', '15');
  eyeR.setAttribute('cy', '10');
  eyeR.setAttribute('r', '1.2');
  eyeR.setAttribute('fill', '#555');
  svg.append(eyeR);

  // Smile
  const smile = document.createElementNS(svgNs, 'path');
  smile.setAttribute('d', 'M9.5 14.5c.83 1 2.17 1.5 3 1.5s2.17-.5 3-1.5');
  smile.setAttribute('stroke', '#555');
  smile.setAttribute('stroke-width', '1.2');
  smile.setAttribute('stroke-linecap', 'round');
  smile.setAttribute('fill', 'none');
  svg.append(smile);

  const iconWrap = document.createElement('span');
  iconWrap.className = 'feedback-tab-icon';
  iconWrap.append(svg);

  const text = document.createElement('span');
  text.className = 'feedback-tab-text';
  text.textContent = 'Feedback';

  btn.append(iconWrap, text);
  document.body.append(btn);
}

buildFeedbackTab();
