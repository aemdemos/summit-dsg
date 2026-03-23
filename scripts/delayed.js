// Back to top button
function buildBackToTop() {
  const btn = document.createElement('a');
  btn.href = '#';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to the top');

  const svg = document.createElementNS('https://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS('https://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 19V5M5 12l7-7 7 7');
  svg.append(path);
  btn.append(svg);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide based on scroll position
  const toggle = () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  document.body.append(btn);
}

buildBackToTop();
