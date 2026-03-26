import decorate from '../cards-insight/cards-insight.js';

export default function decoratePress(block) {
  block.classList.add('cards-insight');
  decorate(block);
}
