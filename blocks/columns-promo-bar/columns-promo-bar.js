export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const cells = [...row.children];
  if (cells[0]) cells[0].classList.add('promo-text');
  cells.slice(1).forEach((cell) => cell.classList.add('promo-cta'));
}
