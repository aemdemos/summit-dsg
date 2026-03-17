# Importer tooling (DSG & bulk import)

This folder holds the **AEM Importer** transformation and helpers for migrating [dickssportinggoods.com](https://www.dickssportinggoods.com/) (and similar retail sites) into AEM Edge Delivery / Document Authoring. Use it with the AEM bulk import tool from your local system or from [DA Import](https://da.live/apps/import) / [Bulk](https://da.live/apps/bulk).

## Quick start

1. **Design first**  
   Run design extraction on the source site so `styles/styles.css` and fonts match the brand (see `.agents/skills/get-general-styling` or `design-system-extractor`).

2. **Run the importer**  
   From project root:
   ```bash
   npx -y @adobe/aem-cli import
   ```
   Or with auth headers:
   ```bash
   aem import --headers-file ./tools/importer/headers.json
   ```
   Choose **Document Authoring** (or AEM Authoring), then:
   - **Workbench**: paste one URL (e.g. `https://www.dickssportinggoods.com/`), run import, tweak `import.js` and save to re-run.
   - **Bulk**: paste many URLs (one per line), run import, download the report when done.

3. **Tune selectors**  
   Edit the config at the top of `import.js` (or `config.js`) to match the live site’s DOM (main, hero, header, footer). Iterate in Workbench before running bulk.

## Files

| File | Purpose |
|------|--------|
| **import.js** | Main entry for the AEM Importer. Exports `transform()` and `generateDocumentPath()`. Uses global `WebImporter` (provided by the importer UI). |
| **config.js** | DSG selectors and EDS block names. Reference only; `import.js` inlines what it needs. |
| **block-parser.js** | Helpers for building EDS block table shapes (Hero, Cards, Accordion, Columns). Use from Node or keep in sync with logic in `import.js`. |
| **page-transformers.js** | Pure DOM transform helpers (get main, remove nodes, ensure H1, find hero, extract metadata). Reference / Node use. |
| **MIGRATION-PLAN-DSG.md** | Full migration plan and phases. |
| **README.md** | This file. |

## Block mapping

The importer turns blocks into HTML tables → Markdown → docx/HTML. Current mapping:

- **Metadata**: from `<title>`, `og:description`, `og:image` → Metadata block (via `WebImporter.Blocks.getMetadataBlock`).
- **Hero**: first hero-like section (image + heading) → Hero block table.
- **Cards / Accordion / Columns**: extend `import.js` (or use `block-parser.js` cell shapes) and add selectors in config for product grids, FAQ, multi-column.

See `block-parser.js` for the exact row/cell layout expected by EDS blocks.

## Paths and report

- Paths are sanitized (lowercase, hyphens, no `.html`) via `WebImporter.FileUtils.sanitizePath` or the fallback in `import.js`.
- The default `transform()` returns one document per URL and adds a `report` object (e.g. `title`) so the Bulk download report gets extra columns.

## Custom headers

Create `tools/importer/headers.json` for auth or cookies:

```json
{
  "Cookie": "your-session-cookie",
  "Authorization": "Bearer token"
}
```

Then run: `aem import --headers-file ./tools/importer/headers.json`.

## References

- [AEM Importer (aem.live)](https://www.aem.live/developer/importer)
- [Importer guidelines (helix-importer-ui)](https://github.com/adobe/helix-importer-ui/blob/main/importer-guidelines.md)
- [MIGRATION-PLAN-DSG.md](./MIGRATION-PLAN-DSG.md) in this folder
