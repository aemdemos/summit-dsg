/**
 * Block parser: build EDS block table structures for the AEM Importer.
 *
 * In the importer, blocks are represented as HTML tables. The first row is the
 * block name; subsequent rows are content cells. The importer converts these to
 * Markdown grid tables → docx/HTML. EDS then renders them via blocks/{name}/{name}.js.
 *
 * This module provides pure helpers that return cell arrays [row1, row2, ...]
 * where each row is [cell1, cell2, ...]. Cells can be strings or DOM elements.
 * Use with WebImporter.DOMUtils.createTable(cells, document) in import.js.
 *
 * Block shapes (align with blocks/ in this repo):
 *
 * - Hero:      [ ['Hero'], [heading, picture] ]
 * - Cards:     [ ['Cards'], [...row1 cells...], [...row2 cells...], ... ]
 * - Accordion: [ ['Accordion'], [label1, body1], [label2, body2], ... ]
 * - Columns:   [ ['Columns'], [col1, col2, ...] ]
 * - Metadata:  use WebImporter.Blocks.getMetadataBlock(document, meta) in import.js
 */

/**
 * Build Hero block rows: one row with block name, one row with heading + image.
 * @param {Element} heading - h1 or h2 element
 * @param {Element} image - img or picture element
 * @returns {[string[], (Element|string)[]]}
 */
export function heroBlockRows(heading, image) {
  return [
    ['Hero'],
    [heading || '', image || ''],
  ];
}

/**
 * Build Cards block rows: first row block name, then one row per card (e.g. image, title, description, link).
 * @param {Element[]} cardElements - Array of card DOM elements (e.g. product cards)
 * @param { (el: Element) => (Element|string)[] } [rowMapper] - Map each card to cell array (default: extract picture, headings, links)
 * @returns { (string|Element)[][] }
 */
export function cardsBlockRows(cardElements, rowMapper = defaultCardRowMapper) {
  const rows = [['Cards']];
  cardElements.forEach((el) => {
    rows.push(rowMapper(el));
  });
  return rows;
}

/**
 * Default card row: [picture or img, title text, description text, link].
 * @param {Element} el
 * @returns {(Element|string)[]}
 */
function defaultCardRowMapper(el) {
  const picture = el.querySelector('picture');
  const img = el.querySelector('img');
  const a = el.querySelector('a');
  const h = el.querySelector('h2, h3, h4');
  const desc = el.querySelector('p');
  return [
    picture || img || '',
    h ? h.textContent.trim() : '',
    desc ? desc.textContent.trim() : '',
    a ? a : '',
  ];
}

/**
 * Build Accordion block rows: first row block name, then [label, body] per item.
 * @param {Element[]} items - Array of item containers (each with label + body)
 * @param { (el: Element) => [Element|string, Element|string] } [itemMapper] - Map each item to [label, body]
 * @returns { (string|Element)[][] }
 */
export function accordionBlockRows(items, itemMapper = defaultAccordionItemMapper) {
  const rows = [['Accordion']];
  items.forEach((el) => {
    const [label, body] = itemMapper(el);
    rows.push([label, body]);
  });
  return rows;
}

/**
 * Default accordion item: first child as label, rest as body.
 * @param {Element} el
 * @returns {[Element|string, Element|string]}
 */
function defaultAccordionItemMapper(el) {
  const first = el.querySelector('dt, .label, h3, h4, [class*="label"]') || el.firstElementChild;
  const rest = el.querySelector('dd, .body, [class*="content"]') || first?.nextElementSibling || el;
  return [first || '', rest || ''];
}

/**
 * Build Columns block rows: first row block name, one row with one cell per column.
 * @param {Element[]} columnElements - Array of column containers
 * @returns { (string|Element)[][] }
 */
export function columnsBlockRows(columnElements) {
  const cells = columnElements.map((col) => col.cloneNode(true));
  return [['Columns'], cells];
}

/**
 * Metadata block: use WebImporter.Blocks.getMetadataBlock(document, meta) in import.js.
 * Meta shape: { Title?: string, Description?: string, Image?: HTMLImageElement, ... }.
 * This helper only documents the shape; actual creation is in import.js via WebImporter.
 */
export const METADATA_SHAPE = {
  Title: 'string',
  Description: 'string',
  Image: 'HTMLImageElement',
};
