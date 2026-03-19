# Migration playbook: Abercrombie `/shop/us` → AEM Edge Delivery / aemcoder

This document supports migration agents (**aemcoder.adobe.io** / ExMod) and human implementers. Work **top to bottom**: complete each section's parity gate before moving to the next.

---

## 1. Meta

| Field | Value |
|-------|--------|
| **Source URL** | https://www.abercrombie.com/shop/us |
| **Scope** | **A** — Marketing shell (visual + authored content parity). **B** — Storefront behavior (search, cart, account, PLP, filters) — see [Layer B appendix](#7-layer-b-appendix-storefront-integrations). |
| **Date captured** | _Fill when DOM/screenshots are recorded._ |
| **Viewports for parity** | 375px (mobile), 768px (tablet), 1440px (desktop) |
| **Preview URL (branch)** | `https://{branch}--{repo}--{owner}.aem.page/shop/us` _(after content exists)_ |
| **Content host** | See `.migration/project.json` → `contentHostUrl` (update org/project to match yours). |
| **Block library (aemcoder)** | `https://main--summit-dsg--aemdemos.aem.page/docs/library/blocks.json` — register this URL in ExMod/aemcoder (see [tools/library-pages.md](../../tools/library-pages.md)). |

**Localization:** Per AGENTS.md, user-facing strings must be authorable in Universal Editor—not hard-coded in block JS.

### 1.1 Styling parity (why the preview looked “terrible”)

The repo includes styles and **automatic application** (in `scripts/scripts.js` → `applyAbercrombieSectionStyles`) so the preview matches the live site without editing DA:

1. **Promo banner** — The first section that does not contain a hero or carousel gets class `promo-banner` (navy strip, white text).
2. **Hero carousel** — The first carousel in `main` gets class `inverse` (white text and ghost CTAs on image).
3. **Split banners** — Any columns block with exactly two columns that both contain an image gets class `split-banner` (overlay text, ghost buttons).
4. **Ghost CTAs** — Every `a.button` inside hero, inverse carousel, split-banner columns, or promo-banner section gets class `ghost` so they render as white-outline buttons.

Authors can still override by setting section metadata **Style** or block **Class** in Universal Editor; the auto-apply runs after block decoration and only adds classes when they are not already set.

### 1.2 Preview 404 at root

This project uses **Document Authoring (DA)** — content is served from `.migration/project.json` → `contentHostUrl`, not from the repo. The **root URL** (`https://{branch}--summit-dsg--aemdemos.aem.page/`) often returns 404 because no document is mapped to `/` in DA.

- **Use the content path:** Open **`/shop/us`** (the path this migration targets):  
  `https://{branch}--summit-dsg--aemdemos.aem.page/shop/us`
- **Branch in URL:** Use lowercase in the preview URL (e.g. `abercrombie-initial-pr` even if the Git branch is `abercrombie-initial-PR`).
- **Root page:** To have `/` work, create and publish a document in [Document Authoring](https://content.da.live) (aemdemos/summit-dsg) that maps to the root path.

---

## 2. Prerequisites (order of work)

1. **Design system / tokens**
   If `styles/styles.css` still reflects boilerplate defaults, run the design extraction workflow in `.agents/skills/get-general-styling/SKILL.md` first so typography, colors, spacing, and breakpoints match the source site foundation.

2. **Global header**
   Usually a **fragment** loaded by the `header` block (`blocks/header/`). Megamenu, locale, and search chrome often live here. Complete desktop structure before mobile variants if your process requires it.

3. **Global footer**
   Same pattern: **fragment** via `blocks/footer/`.

4. **Page body (`/shop/us`)**
   Only after header/footer fragments are acceptable for reuse across pages, implement sections below in order.

---

## 3. Capture runbook (mandatory before filling inventory)

The source page is largely client-rendered; automated server fetch is unreliable. Use this runbook so block specs are grounded in real DOM and styles.

### 3.1 Environment

- Browser: Chrome or Edge (DevTools).
- Disable throttling for first pass; repeat key sections with "Slow 4G" if performance matters.
- Clear cookies or use incognito if promos differ by session.

### 3.2 Viewports

For each viewport **375 / 768 / 1440**:

1. Resize or use device toolbar.
2. Full-page screenshot → save as `migration-work/screenshots/shop-us-{width}.png` (or team path).

### 3.3 DOM order (top to bottom)

1. Open **Elements**; walk from first visible content below `<body>` (skip third-party script nodes).
2. Note **landmarks**: `header`, `main`, `nav`, `footer`, role="banner", etc.
3. For **main** content, list **sequential sections** (visually distinct bands: promo strip, hero, carousels, grids, etc.).
4. For each section, copy a **stable selector** or note **nearest `id` / `data-*`** for re-identification after refresh.

### 3.4 Content per section

For each section:

- **Copy:** Exact headings, subcopy, CTA labels, legal microcopy (paste into inventory §4).
- **Images:** Note `src` / `srcset` URLs or export assets per brand guidelines; set **alt** in authoring (decorative → `alt=""`).
- **Links:** Href targets for every CTA and nav item in scope.

### 3.5 Styles (parity with source)

On a **representative node** (container + heading + CTA):

1. **Computed** tab: record font-family, font-size, font-weight, line-height, letter-spacing, color, background-color, padding, margin, gap, border-radius, box-shadow.
2. Note **active/hover/focus** if critical for parity (open :hov in DevTools).
3. Map to **CSS custom properties** in `styles/styles.css` or block-scoped CSS in `blocks/{name}/{name}.css` per AGENTS.md (breakpoints: 600 / 900 / 1200px where applicable).

### 3.6 Variant naming

- Reusing the **same block** with different layout/styling → add a **variant class** on the block (e.g. `cards promo`, `cards category`).
- Document the **exact class string** and which file owns the rules (`blocks/cards/cards.css` + variant selector).
- If DOM structure differs too much (e.g. not a grid of cards), consider a **new block** and note that in the inventory.

### 3.7 Evidence bundle (optional but recommended)

- `migration-work/abercrombie-shop-us-dom-outline.md` — ordered section list + selectors.
- Screenshots per viewport.
- Optional: Playwright script that dumps bounding boxes and text for regression.

---

## 4. Summit-dsg block map (default targets)

Use these **before** inventing new blocks. Paths are under `blocks/{name}/`.

| Block | Typical use on `/shop/us` |
|-------|---------------------------|
| **header** | Site chrome; often loads `/nav` or similar fragment. |
| **footer** | Site footer fragment. |
| **fragment** | Include shared regions or legal. |
| **hero** | Large hero image + headline/CTA. |
| **carousel** | Rotating heroes or product/editorial rails. |
| **card-carousel** | Horizontal card strips. |
| **cards** | Tile grids (categories, promos). |
| **card** | Single featured card if needed. |
| **columns** | Multi-column promos or split layouts. |
| **tabs** | Tabbed category or content regions. |
| **accordion** | Collapsible FAQs or mobile-heavy stacks. |
| **embed** | Third-party widgets, maps, or Layer B embeds. |
| **form** | Email signup, contact. |
| **search** | In-page search UI if not only in header. |
| **modal** | Promo/legal overlays. |
| **quote** | Editorial quotes. |
| **table** | Size charts, comparison tables. |
| **video** | Autoplay/hero video modules. |

**New blocks:** Add only when no combination of blocks + section metadata + variants can match the DOM without fragile hacks. Document the rationale in the inventory row.

---

## 5. Block inventory (top → bottom)

Duplicate this table row per section. **Fill after capture.** Do not implement the next row until **Parity gate** is checked for the current row at all required viewports.

| # | Source label (from live site) | Proposed block | Variant class(es) | Content contract (fields / structure) | Key styles (tokens or notes) | Parity gate |
|---|------------------------------|----------------|-------------------|----------------------------------------|------------------------------|-------------|
| 1 | Utility bar | header (fragment) | — | A&F, abercrombie kids \| Sign In or Join | Thin white strip; left/right links | ☐ |
| 2 | Main nav | header | — | Logo, nav links (New, Women's, Men's, kids, …), search, region/wishlist/bag | Sticky; see nav fragment | ☐ |
| 3 | Promo banner | columns | e.g. `promo-banner` | Copy: clearance + free shipping; CTAs SHOP WOMEN'S, SHOP MEN'S | Dark navy BG, white text | ☐ |
| 4 | Hero: Hotel Abercrombie | carousel or hero | `split` | Two images; overlay heading + subcopy; ghost buttons | Serif heading; ghost buttons; carousel controls | ☐ |
| 5 | Product carousel (Spring-Capsule Starters) | card-carousel + tabs | — | Tabs; horizontal product cards (image, heart, swatches, tag, name) | Tabs underline active; arrow to scroll | ☐ |
| 6 | Split: Swim & Tees | columns | `split-banner` | Two columns: image + overlay + CTA each | Side-by-side; ghost buttons | ☐ |
| 7 | Full-width: Heritage Collection | hero | `full-bleed` | Single image; centered overlay + SHOP NOW | Large serif; centered CTA | ☐ |
| 8 | Split: Activewear (Your Personal Best) | columns | `split-banner` | Two images; overlay spanning center; two CTAs | Same as #6 | ☐ |
| 9 | Legal / footer | footer or default | — | Copy + Privacy/Terms; subscribe CTA | Fragment `/footer` or default content | ☐ |

**Section metadata:** Use section-level styling (background, spacing) via Universal Editor section metadata where your project defines it (see block library **section-metadata** if present).

---

## 5.1 Draft implementation (for aemcoder / local parity)

A static draft of this page exists so aemcoder and tools can read the structure and compare:

- **Page:** `drafts/shop/us.html` — sections: hero, carousel, cards, columns, default content.
- **Fragments:** `drafts/nav.plain.html`, `drafts/footer.plain.html` — loaded by header and footer blocks via meta `nav` / `footer`.
- **DOM outline:** [abercrombie-shop-us-dom-outline.md](./abercrombie-shop-us-dom-outline.md).

**Run locally with drafts:**
`npx -y @adobe/aem-cli up --no-open --forward-browser-logs --html-folder drafts`
Then open: **http://localhost:3000/shop/us**

---

## 6. Using this doc with aemcoder.adobe.io

1. **Register your block library** in ExMod/aemcoder: **`https://main--summit-dsg--aemdemos.aem.page/docs/library/blocks.json`** (see [tools/library-pages.md](../../tools/library-pages.md)).
2. **Paste** this playbook (or link to it in repo) **plus** the current **preview URL** into the agent context.
3. Instruct the agent: **one inventory row at a time** — implement, then compare to source screenshot/DOM before advancing.
4. **Lint:** `npm run lint` before merge (CI requirement per AGENTS.md).
5. **Performance:** Run PageSpeed on the preview URL; heavy Layer B embeds may require lazy loading or `delayed.js` patterns.

---

## 7. Layer B appendix: storefront integrations

Full functional parity with abercrombie.com commerce (live inventory, checkout, auth) typically **exceeds** static Edge Delivery blocks. For each capability, pick a **target** and document the decision in your project.

| Capability | Typical behavior on source | Target options on EDS | Risks / notes |
|------------|---------------------------|------------------------|---------------|
| **Site search** | Typeahead, SERP | Stub UI + link to external search; **embed** vendor widget; headless API + custom block (needs API contract, no secrets in client). | UX mismatch; SEO; third-party ToS. |
| **Mini-cart / cart** | Drawer, cart page | Link to canonical cart URL; **embed** (rare); static "0 items" for demo. | Cannot mirror logged-in cart without backend. |
| **Account / sign-in** | Modal or redirect | Link to account URL; stub button. | Auth flows are out of scope for static demo unless integrated. |
| **PLP product grid** | Live products, filters, sort | **embed** iframe to PLP; static **cards** grid from spreadsheet/JSON for visual parity only; headless product API. | Legal use of product data; performance; stale data. |
| **Filters / facets** | Sidebar or drawer | Same as PLP — usually API or embed. | Complex state; URL sync. |
| **Personalization** | Location, promos by segment | Omit or static promo blocks per audience (separate pages). | No PII in public repo. |

**Security:** Never commit API keys or tokens (AGENTS.md). Client-side code is public.

**Accessibility:** Maintain heading order, focus management for modals/carousels, and WCAG 2.1 AA for any new UI.

---

## 8. Checklist summary

- [ ] Capture runbook completed (viewports + DOM outline).
- [ ] Design tokens aligned with source (or documented deltas).
- [ ] Header/footer fragments done or explicitly deferred with placeholder.
- [ ] Every inventory row filled and parity-gated.
- [ ] Layer B rows decided (embed / link / stub / API) per feature.
- [ ] Block library URL registered in aemcoder.
- [ ] Lint passes; preview URL documented for PR.

---

*Block list for aemcoder: `https://main--summit-dsg--aemdemos.aem.page/docs/library/blocks.json` (also in `.migration/project.json` → `libraryUrl`).*
