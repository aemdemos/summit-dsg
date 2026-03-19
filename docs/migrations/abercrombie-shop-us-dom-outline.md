# DOM outline: Abercrombie /shop/us (source: live site screenshot)

For use with [abercrombie-shop-us.md](./abercrombie-shop-us.md) and aemcoder. Order is top → bottom. **Source of truth:** full-page screenshot (abercrombie.com/shop/us).

## Landmarks

- **Header** — Utility bar (A&F, abercrombie kids, Sign In or Join) + main nav (logo, menu links, search, region/wishlist/bag) + promo banner (navy strip).
- `main` — Page body; sections below.
- `footer` — Footer block injects footer fragment (`/footer`).

## Main content sections (sequential, from screenshot)

| # | Section label (from live site) | Block / content | Notes |
|---|--------------------------------|-----------------|--------|
| 1 | **Utility bar** | header (fragment) or columns | Thin white strip: A&F, abercrombie kids (left); Sign In or Join (right). |
| 2 | **Main nav** | header | Logo, New / Women's / Men's / kids / baby & toddler / Jeans / Active / Sale / Purpose, search, region/wishlist/bag. |
| 3 | **Promo banner** | columns | Dark navy bar: "Online Only: All Clearance Up To 60% Off! \| Free Shipping On Orders Over $99" + SHOP WOMEN'S SHOP MEN'S. |
| 4 | **Hero: Hotel Abercrombie** | hero / carousel | Split-screen two images; overlay "Hotel Abercrombie" + "New sun-ready looks are made to getaway."; ghost buttons SHOP WOMEN'S, SHOP MEN'S; carousel arrows/dots. |
| 5 | **Product carousel: Spring-Capsule Starters** | card-carousel or tabs + cards | Tabs: Spring-Capsule Starters, You'll Love These, New This Week. Horizontal product cards (image, heart, swatches, BESTSELLER, name). |
| 6 | **Split hero: Swim & Tees** | columns | Left: "NEW IN SWIM High Tide" + SHOP WOMEN'S. Right: "The Premium Heavyweight 2.0 Tee" + SHOP MEN'S. |
| 7 | **Full-width hero: Heritage** | hero | Single image; overlay "The Heritage Heavyweight Collection"; SHOP NOW ghost button. |
| 8 | **Split hero: Activewear** | columns | Two banners; overlay "Your Personal Best >"; SHOP WOMEN'S, SHOP MEN'S. |
| 9 | Legal / footer strip | default content or footer fragment | Copy + links. |

## Design notes (from screenshot)

- **Typography:** Headings use serif (premium); nav and product copy use sans-serif.
- **CTAs:** Primary style is **ghost buttons** — white border and text on dark/image.
- **Spacing:** Consistent white space between sections.
- **Responsive:** Product carousel and split banners should stack or adapt at 375 / 768 / 1440px.

## Draft files (local dev with `--html-folder drafts`)

- **Page:** `drafts/shop/us.html` — full page; meta `nav`=/nav, `footer`=/footer.
- **Fragments:** `drafts/nav.plain.html`, `drafts/footer.plain.html` — inner HTML for header/footer blocks.
- **Screenshot reference:** Use full-page capture of abercrombie.com/shop/us for parity checks.

## Viewports

Per playbook: 375px, 768px, 1440px.

## Block library (aemcoder)

`https://main--summit-dsg--aemdemos.aem.page/docs/library/blocks.json`
