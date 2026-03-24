# Migration specification: Thomson Reuters `/en` → AEM Coder / Edge Delivery

**Source:** [https://www.thomsonreuters.com/en](https://www.thomsonreuters.com/en)  
**Target stack:** Project aligned with [aemcoder.adobe.io](https://aemcoder.adobe.io) and this repo’s **block-based** Edge Delivery pattern (see [`aem-block-architecture.md`](./aem-block-architecture.md), [`AGENTS.md`](../AGENTS.md)).

**Goal:** Maximize visual and behavioral parity using **DOM-first** capture, explicit **block + variant** mapping, and a **top-to-bottom** build order so dependencies (tokens → global chrome → sections) resolve cleanly.

> **Rights & content:** Thomson Reuters branding, copy, imagery, and fonts are their property. Use this document for **structure and methodology**; obtain **licensed assets** and **legal approval** before publishing clones in production.

---

## 1. Migration strategy (top to bottom)

Build and validate in this order so each layer can depend on the previous one.

| Phase | Scope | Success criteria |
|------|--------|------------------|
| **1** | Design tokens | All colors, type scale, radii, shadows, spacing documented as CSS custom properties in `styles/` (no magic numbers in blocks). |
| **2** | Fonts & icons | Font files or approved fallbacks; every SVG referenced or inlined per accessibility rules. |
| **3** | Global chrome | Header + navigation + skip link + any announcement bar match source layout and keyboard/ARIA behavior. |
| **4** | Footer | **100% parity checklist** (Section 8) signed off: structure, links, legal, social, responsive. |
| **5** | Main: section by section | Hero → content bands → carousels/grids → repeat; each section mapped to a block (+ variant). |
| **6** | JS behavior | Only what blocks need; no duplicate global listeners; respect “no runtime deps” / native ESM. |
| **7** | QA pass | Viewport 320 / 600 / 900 / 1200+, keyboard, screen reader spot-check, performance (lazy, picture). |

**Why top-to-bottom:** Header/footer define grid width, sticky behavior, and z-index stacking. Tokens prevent rework when tuning blocks. Main content is easiest to iterate once chrome is stable.

---

## 2. DOM-first capture methodology

Use the **live DOM** (not only “View Source”) because marketing sites hydrate, lazy-load, and inject markup with scripts.

### 2.1 Save stable snapshots per region

In browser DevTools (or Playwright):

1. **Wait for network idle** and scroll the full page once to trigger lazy images.
2. For each region (header, main landmarks, footer), run **Copy → Copy outerHTML** on the **root element** you identify (see Section 4 for a suggested selector map).
3. Paste into versioned files under something like `drafts/tr-source-snapshots/` (add folder to `.hlxignore` / `.gitignore` if snapshots must not ship).

### 2.2 Extract what HTML alone hides

| Need | DOM / DevTools approach |
|------|-------------------------|
| **Computed colors** | Select element → Computed → `color`, `background-color`, `border-color`. For gradients, copy full `background-image`. |
| **Background images** | Computed `background-image` on section wrappers, pseudo-elements (`::before`/`::after` in Styles panel). |
| **Real image URLs** | All `img[src]`, `img[srcset]`, `source[srcset]`, `picture`; also CSS `url(...)` from rules affecting that subtree. |
| **Fonts** | Computed `font-family` on body, H1, nav, buttons; trace to loaded files in Network (font filters) or `@font-face` in CSS. |
| **SVG icons** | Inline `<svg>` in header/footer/buttons; or `<img>` pointing to `.svg` — save originals, prefer **sprite or `icons/`** pattern per project. |
| **Z-index / position** | Note `position`, `z-index`, `overflow` on header and mega-menu panels for stacking bugs. |
| **Breakpoints** | Resize; note where nav switches (this repo often uses **600 / 900 / 1200**; map source breakpoints to these or extend tokens). |

### 2.3 Optional: scripted inventory (run in console on the source page)

Use one-off snippets to list assets and tokens (adapt selectors after you inspect the real DOM):

```javascript
// Images in subtree
[...document.querySelectorAll('img')].map((i) => i.currentSrc || i.src);

// Elements with non-none background-image (sample — refine root)
[...document.querySelectorAll('body *')].filter((el) => {
  const bg = getComputedStyle(el).backgroundImage;
  return bg && bg !== 'none';
}).map((el) => [el.tagName, el.className, getComputedStyle(el).backgroundImage]);
```

Document the **exact selectors** you used in an appendix so the migration can be replayed after site updates.

---

## 3. Design tokens (colors, type, surfaces)

### 3.1 Color inventory

Create a table (fill from computed styles on source):

| Token name (proposed) | Usage | Value(s) | Source selector / notes |
|----------------------|-------|----------|---------------------------|
| `--tr-color-text-primary` | Body | | |
| `--tr-color-text-muted` | Secondary | | |
| `--tr-color-link` | Links | | |
| `--tr-color-link-hover` | Hover | | |
| `--tr-color-surface-page` | Page bg | | |
| `--tr-color-surface-elevated` | Cards / panels | | |
| `--tr-color-border` | Hairlines | | |
| `--tr-gradient-hero` | Hero band | | full `background-image` |

Map these in `styles/styles.css` (or a dedicated `styles/tr-tokens.css` imported from lazy path if non-LCP).

### 3.2 Typography

| Role | Source `font-family` | Weights | Sizes (mobile → desktop) | Line-height |
|------|----------------------|---------|---------------------------|-------------|
| Display / H1 | | | | |
| Section H2 | | | | |
| Nav | | | | |
| Body | | | | |
| Button / CTA | | | | |

Align with project conventions: use **`var(--*)`** everywhere in block CSS.

### 3.3 Icons & SVG

- List every **distinct** SVG (nav chevrons, search, social, close, external link).
- Prefer project pattern: **`icons/{name}.svg`** + `<span class="icon icon-{name}">` (see `AGENTS.md`).
- Record **viewBox** and whether **currentColor** is used so themes work.

---

## 4. Suggested DOM → region map (fill after live inspection)

The production DOM class names will differ; **discover and record** the stable hooks for:

| Region | Purpose | Notes |
|--------|---------|--------|
| Skip / accessibility | First focusable | Must be first in tab order in migration too. |
| Utility / alert bar | Optional top strip | Variant on `header` or separate block. |
| Header shell | Logo, tools, sign-in | Often `header`, `[role="banner"]`. |
| Primary nav | Top-level items | Mega-menu panels: capture **expanded** DOM state separately. |
| Search | If present | May be modal or expandable — own block or `search` block variant. |
| Main landmark | `main`, `[role="main"]` | Section children become blocks. |
| Footer landmark | `footer`, `[role="contentinfo"]` | **Section 8** checklist. |

Store the **final selector map** in this doc or a sibling `migration-tr-selectors.md`.

---

## 5. Block structure & naming (including duplicate “types”)

This repo uses **one folder per block**: `blocks/{name}/{name}.js` + `{name}.css`. Variants are usually **extra classes** on the same block (`main .carousel.hero`) or **separate blocks** when DOM structure or behavior diverges.

### 5.1 When to use a variant vs a new block name

| Situation | Recommendation |
|-----------|----------------|
| Same columns/rows contract, different look (background, typography) | **Variant class**, e.g. `carousel` + `full-bleed` (second class on the block div; match author-visible names to CSS per `AGENTS.md`). |
| Different row/column semantics or JS (e.g. card strip vs hero slides) | **New block folder**, e.g. `carousel-hero` vs `card-carousel` (already exists in repo). |
| Shared chrome across pages | **`fragment` block** loading `/nav`, `/footer` paths (see existing [`header.js`](../blocks/header/header.js), [`footer.js`](../blocks/footer/footer.js)). |

### 5.2 Proposed block inventory (rename after DOM audit)

Adjust names to match what authors will understand in documents / Universal Editor.

| Block (folder) | Variants (classes) | Source region / pattern |
|----------------|-------------------|-------------------------|
| `header` | `utility-bar`, `mega-menu` (if needed) | Site header + optional bar |
| `footer` | *(none or `minimal`)* | Full footer — **must pass Section 8** |
| `columns` | `2-cols`, `3-cols`, `media-left`, `media-right` | Content bands |
| `carousel` | `hero`, `testimonial`, `logo-strip` | Full-width heroes vs in-page sliders |
| `card-carousel` | `insight`, `product` | Card-based strips (reuse if structure fits) |
| `cards` / `card` | `press`, `resource` | Card grids |
| `embed` | | Third-party widgets if any |
| `accordion` | `faq` | Expandable groups |
| `tabs` | | Tabbed content if present |
| `quote` | | Pull quotes |
| `modal` | `search`, `video` | Overlays |

**Variant naming convention (recommended):** `{base-block}` + short semantic class: `carousel hero`, `columns media-left`. Keep **one primary variant** per visual pattern so authors aren’t overwhelmed.

### 5.3 Authoring contract (per block)

For each block, document:

- **Rows** = slides or stacked sections?
- **Cells per row** = image / copy / CTA order (match [`carousel.js`](../blocks/carousel/carousel.js) expectation: first column image, second content unless you change the block).
- **Required vs optional** cells to avoid breaking `decorate()`.

---

## 6. Capturing CSS & JS faithfully

### 6.1 CSS

- **Global:** Only true site-wide rules in `styles/styles.css` / `lazy-styles.css`; keep **selectors scoped** in block CSS (`main .block-name …`).
- **Order of application:** tokens → section spacing → block.
- **Background images:** Prefer **`picture` / `<img>`** for LCP heroes where possible; CSS `background-image` for decorative bands only (document in tokens).

### 6.2 JS

- **Block-local:** All behavior inside `export default function decorate(block)` using `block.querySelector…`.
- **Carousels:** Reuse [`scripts/slider.js`](../scripts/slider.js) patterns from [`carousel.js`](../blocks/carousel/carousel.js) / [`card-carousel.js`](../blocks/card-carousel/card-carousel.js) for consistency and a11y (`role`, `aria-*`, keyboard).
- **Header/nav:** Align with existing [`header.js`](../blocks/header/header.js) patterns (focus trap, Escape, `aria-expanded`) rather than importing minified source bundles from the origin site.

### 6.3 Images

- Use **`createOptimizedPicture`** from `scripts/aem.js` where the boilerplate expects it.
- Capture **widest `srcset` candidate** for author uploads; note **aspect ratio** per block for cropping guidelines.

---

## 7. Hero & carousels (high-risk areas)

| Pattern | DOM clues | Block mapping |
|---------|-----------|---------------|
| Single hero | One H1 + supporting copy + CTA + media | `columns` variant or dedicated `hero` block if you add one |
| Rotating hero | Multiple slides, dots/arrows | `carousel` variant `hero` |
| Logo / partner strip | Many small logos, may auto-scroll | `carousel` variant `logo-strip` or `card-carousel` variant |
| Content + image carousels | Cards with titles | `card-carousel` + variant |

For each carousel instance, record: **slide count**, **autoplay** (yes/no), **aria-label**, focus order, and whether **slide change** is button vs swipe (mobile).

---

## 8. Footer: 100% success checklist

Treat the footer as a **separate fragment** (recommended: same approach as [`footer.js`](../blocks/footer/footer.js) loading `/footer`). Do not ship until **every** item is checked.

### 8.1 Structure

- [ ] Landmark: single logical `footer` / `contentinfo` equivalent.
- [ ] Column count matches source at **900px+**; stacks correctly at mobile.
- [ ] Heading hierarchy is **valid** (no skipped levels inside footer).

### 8.2 Link & label parity

- [ ] **Every** visible text link href matches source intent (internal vs external).
- [ ] External links: `rel` / `target` policy matches source or your security standard.
- [ ] **Legal / privacy** links present and correct (including region-specific lines if any).
- [ ] **Social links**: correct destinations; icons with accessible names.

### 8.3 Assets

- [ ] All footer SVGs / icons captured and stored in repo `icons/` (or inline with `aria-hidden` / decorative `alt` rules).
- [ ] Logo wordmark if duplicated in footer.

### 8.4 Behavior & a11y

- [ ] Focus visible on all interactive elements.
- [ ] Color contrast meets WCAG 2.1 AA on footer background.
- [ ] No keyboard traps inside footer.

### 8.5 DOM verification

- [ ] Diff **link text + href** lists: source DOM export vs migrated fragment (spreadsheet is fine).

---

## 9. Feeding AEM Coder

When using **aemcoder.adobe.io**, supply:

1. This specification (tokens, block list, variants).
2. **Per-block** example HTML table markup (Edge Delivery block tables) or UE component definitions if authoring in AEM.
3. **Snapshots** and **selector map** for automated extraction passes.
4. Explicit **“footer parity”** spreadsheet for QA.

If the tool accepts a URL crawl, **still** validate against **DOM snapshots**; crawlers often miss lazy content and mega-menu **hidden** branches.

---

## 10. Deliverables checklist (project artifacts)

- [ ] `styles/*` — tokens for TR theme
- [ ] `fonts/` or documented fallbacks
- [ ] `icons/*` — all SVGs referenced by blocks
- [ ] `blocks/*` — one folder per block; variants documented
- [ ] `blocks/fragment` + authored `/footer`, `/nav` pages if using fragments
- [ ] `drafts/` or preview pages exercising **every** variant
- [ ] Snapshot / selector appendix (optional file)

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **Block** | Edge Delivery table → decorated `div` with `decorate(block)` |
| **Variant** | Extra class on block for visual/structural flavor |
| **Fragment** | Reusable authored page loaded into header/footer |

---

## Appendix B — Related internal docs

- [`docs/aem-block-architecture.md`](./aem-block-architecture.md) — UE JSON, block models
- [`AGENTS.md`](../AGENTS.md) — breakpoints, CSS/JS rules, a11y, performance

---

*Last updated: migration planning template for Thomson Reuters `/en` homepage and shared chrome.*
