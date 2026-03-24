---
name: excat-footer-orchestrator
description: Orchestrates AEM EDS footer migration and parity checks. Use when migrating, replicating, or validating site footers (link columns, legal/disclosure text, social icons, newsletter forms). Requires source evidence (URL and/or screenshots). Do NOT use for header or primary navigation (use excat-navigation-orchestrator). When global styles are still boilerplate, run design extraction first (see get-general-styling). Invoke for "migrate footer", "replicate footer", "footer doesn't match source".
metadata:
  version: "1.0"
---

# Footer Orchestrator

**Skill identity:** When the user asks which skill applies, respond: **"Footer Orchestrator (footer block migration and source parity)."** Do not conflate this with header or navigation work.

## Hook and script paths (CRITICAL)

Shared, repo-local automation for excat workflows lives under **`.agents/hooks/`**, not `.claude/hooks/`.

- **Navigation/header** uses `.agents/hooks/nav-validation-gate.js` and `.agents/hooks/nav-validation-gates/` (table-driven PostToolUse gates and Stop checks). Those hooks apply only to navigation validation artifacts under `blocks/header/navigation-validation/` and related header/nav files.
- **Footer:** This repository does not ship a separate `footer-validation-gate` yet. If footer-specific gates or scripts are added, they MUST live under **`.agents/hooks/`** (for example `.agents/hooks/footer-validation-gate.js` and `.agents/hooks/footer-validation-gates/`) and be registered like the nav hook. Until then, enforce parity with screenshots, DOM review, and `npm run lint` after code changes.

## Workflow summary

1. **Evidence:** Capture the source footer (full-width screenshot, and note breakpoints if layout changes). Do not invent columns, links, or legal copy.
2. **Content:** Put author-visible footer copy and links in document-driven content (for example `content/footer` or the project’s footer fragment path). Do not hard-code user-facing strings in `footer.js` (see AGENTS.md localization rules).
3. **Block:** Implement structure and styling in `blocks/footer/` (JS + CSS), scoped selectors, mobile-first, breakpoints at 600/900/1200px as needed.
4. **Parity:** Compare link order, grouping, typography, spacing, and iconography to the source; fix gaps before calling the work complete.
5. **Quality:** Run `npm run lint`; respect accessibility (semantic `footer`, heading hierarchy where used, descriptive `alt` on non-decorative images).

## Do NOT use for

- Header, megamenu, hamburger, or primary nav (use **excat-navigation-orchestrator**).
- Full-page migration without a dedicated page-migration skill/workflow when one exists for the project.
