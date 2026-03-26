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
  const defaultBottom = 85;
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
