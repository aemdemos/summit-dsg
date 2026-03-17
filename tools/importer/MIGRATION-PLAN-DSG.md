# Migration Plan: dickssportinggoods.com → aemcoder.adobe.io

This document outlines the plan to migrate [Dick's Sporting Goods](https://www.dickssportinggoods.com/) into AEM Edge Delivery Services (EDS) / Document Authoring using the AEM bulk import tool and local importer tooling in this repo.

## Goals

- Add dickssportinggoods.com as a source for bulk import into the project (aemcoder.adobe.io / Document Authoring).
- Provide reusable **import.js** and supporting **transformers** and **parsers** in `tools/importer/` so bulk imports can be run from your local system (AEM Importer UI or `aem import`) with accurate, repeatable conversion.
- Distill landing page structure, blocks, and existing tooling into a single, maintainable import pipeline.

## Prerequisites (from AGENTS.md and skills)

1. **Design system first**  
   Run design extraction (e.g. [get-general-styling](.agents/skills/get-general-styling/SKILL.md) or [design-system-extractor](.agents/skills/design-system-extractor/SKILL.md)) on the source site **before** bulk page import so `styles/styles.css` and `styles/fonts.css` match the brand. Migrated pages will then render against the correct foundation.

2. **AEM / importer setup**  
   - Project on Edge Delivery (e.g. aemcoder.adobe.io).  
   - Local: `aem import` (or use [DA Import](https://da.live/apps/import) / [Bulk](https://da.live/apps/bulk)).  
   - Import runs in browser; only Chrome-based browsers supported.  
   - `tools/importer/import.js` is the single transformation file loaded by the importer (no build step).

3. **URL list**  
   - For bulk: paste URLs (one per line) in the Bulk tool, or use the importer’s Crawl tool (sitemap/robots.txt or crawl) and filter by pathname if needed.  
   - Optional: use `tools/importer/url-list.txt` (or similar) to maintain a curated list; paste into Bulk when running.

## Phases

### Phase 1: Design and URL strategy

| Step | Action |
|------|--------|
| 1.1 | Run design extraction on https://www.dickssportinggoods.com/ (and optionally key templates). Output: tokens, colors, typography, spacing → map into `styles/styles.css` and `styles/fonts.css`. |
| 1.2 | Decide scope: landing only, landing + category, or full site. Use Crawl or sitemap to get URL list; filter by pathname if needed. |
| 1.3 | Inspect landing (and 1–2 representative pages) in DevTools: identify `main`, header, footer, hero, nav, product grids, CTAs, and any recurring blocks. Document selectors in `tools/importer/config.js` (or inlined in `import.js`). |

### Phase 2: Import pipeline (this repo)

| Step | Action |
|------|--------|
| 2.1 | **import.js** in `tools/importer/import.js`: implement `transform()` (and optionally `generateDocumentPath`) per [importer guidelines](https://github.com/adobe/helix-importer-ui/blob/main/importer-guidelines.md). Return `[{ element, path, report? }]` for each document. Use `WebImporter.FileUtils.sanitizePath()` for paths. |
| 2.2 | **Page transformers**: strip header/footer/nav, keep `main` (or equivalent), ensure first heading is H1, convert background images to `<img>`, create metadata block from `<title>` and `<meta>`. Logic lives in `import.js` (and is mirrored in `page-transformers.js` for reference/Node). |
| 2.3 | **Block parser**: map DOM regions to EDS blocks (Hero, Cards, Accordion, Columns, etc.) by creating HTML tables in the form the importer expects (see helix-importer Blocks/DOMUtils). Block table format is documented in `block-parser.js`. |
| 2.4 | Tune selectors and block mapping for DSG (e.g. hero banner, promos, product grids) and add any DSG-specific rules in `import.js`. |

### Phase 3: Validate and bulk run

| Step | Action |
|------|--------|
| 3.1 | **Single-page test**: In Import Workbench, run import for the DSG landing URL. Confirm structure (sections, blocks, metadata) and preview (HTML/Markdown/docx). Iterate on `import.js` (hot-reload in Workbench). |
| 3.2 | Test 2–3 more URLs (e.g. category, PDP) and adjust rules if needed. |
| 3.3 | **Bulk**: Paste URL list into Import – Bulk. Run import (note: `import.js` is not reloaded during bulk). Download report (XLSX) and fix any failing URLs or path issues. |
| 3.4 | For DA: drag-and-drop or use DA Import with the same project/repo; ensure CORS allows `https://da.live` if using DA Import. |

### Phase 4: Post-import

| Step | Action |
|------|--------|
| 4.1 | Use import report for redirect mapping (old URL → new path) if paths were changed. |
| 4.2 | Preview/publish from DA or AEM; run PageSpeed and fix any issues. |
| 4.3 | Optionally add block library sheet in DA and configure aemcoder to point at your blocks.json per `tools/library-pages.md`. |

## Tooling in this repo

| Asset | Purpose |
|-------|--------|
| **tools/importer/import.js** | Main entry for AEM Importer. Exports `transform()` (and optionally `generateDocumentPath`). Contains DSG-specific cleanup, block creation, and path generation. Uses global `WebImporter` (provided by importer UI). |
| **tools/importer/page-transformers.js** | Reusable DOM transform helpers (strip nav/footer, extract main, metadata, hero, sections). Kept in sync with logic used inside `import.js` for reference or for use in a Node-based pipeline. |
| **tools/importer/block-parser.js** | Helpers and documentation for building EDS block tables (Hero, Cards, Accordion, Columns, Metadata, etc.). Defines the cell layout expected by the importer → Markdown → docx/HTML. |
| **tools/importer/config.js** | DSG selectors and options (main, header, footer, hero, product grid, etc.). Canonical place for selectors; `import.js` inlines or references the same values. |
| **tools/importer/MIGRATION-PLAN-DSG.md** | This plan. |
| **tools/importer/README.md** | How to run the importer locally and customize for DSG or other sites. |

## Block mapping (EDS ↔ import tables)

Importer converts blocks to **HTML tables**; the first row is the block name, following rows are content. Our blocks and their expected authoring structure:

| EDS block | Import table shape | Notes |
|-----------|---------------------|--------|
| **Metadata** | `WebImporter.Blocks.getMetadataBlock(document, meta)` or custom table with Title, Description, Image, etc. | Prepend to main. |
| **Hero** | 1 row: block name "Hero"; 2nd row: heading + picture (or image). | First visual section. |
| **Cards** | "Cards" + rows of cells (image, title, copy, link). | Product grids, promos. |
| **Accordion** | "Accordion" + rows: label, body per item. | FAQs, details. |
| **Columns** | "Columns" + one row per column content. | Multi-column layout. |
| **Section break** | `<hr>` in DOM → `---` in Markdown. | New section. |

Block structure in the repo: `blocks/{blockname}/{blockname}.js` + `.css`; decorator expects default content (e.g. table → divs). Import produces that default content via these tables.

## Running the importer locally

1. **CLI**  
   From project root:
   ```bash
   npx -y @adobe/aem-cli import
   ```
   Or with custom headers (e.g. auth):
   ```bash
   aem import --headers-file ./tools/importer/headers.json
   ```
   Opens Importer UI (e.g. http://localhost:3001/...). Choose Document Authoring (or AEM Authoring). Select output (Save as docx, Save HTML for DA, etc.).

2. **Single-page (Workbench)**  
   Paste one URL (e.g. `https://www.dickssportinggoods.com/`). Click import. Adjust `tools/importer/import.js` and save; import re-runs automatically.

3. **Bulk**  
   Paste many URLs (one per line). Run import. No hot-reload of `import.js` during bulk. Download report when done.

4. **Crawl**  
   Use Importer Crawl tool: hostname + Get from robots.txt/sitemap or Crawl. Filter pathname if needed. Download report to get URL list for Bulk.

## Success criteria

- Landing page (and sampled URLs) import without errors and produce valid docx/HTML.
- Structure matches intent: main content only, H1 first, metadata block present, key regions mapped to blocks (Hero, Cards, etc.).
- Paths are sanitized and consistent (lowercase, hyphens, no .html).
- Report includes any custom columns (e.g. title, list of images) for analysis.
- Design tokens already applied so preview looks on-brand.

## References

- [AEM Importer (aem.live)](https://www.aem.live/developer/importer)
- [Importer guidelines (helix-importer-ui)](https://github.com/adobe/helix-importer-ui/blob/main/importer-guidelines.md)
- [Bulk importing (Experience League)](https://experienceleague.adobe.com/en/docs/experience-manager-learn/sites/document-authoring/how-to/bulk-importing-using-importer)
- [Customizing the Importer](https://experienceleague.adobe.com/en/docs/experience-manager-learn/sites/document-authoring/how-to/customizing-importer)
- [DA Import](https://da.live/apps/import), [Bulk](https://da.live/apps/bulk)
- Project: `AGENTS.md`, `tools/library-pages.md`, `docs/aem-block-architecture.md`
