var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-shop-homepage.js
  var import_shop_homepage_exports = {};
  __export(import_shop_homepage_exports, {
    default: () => import_shop_homepage_default
  });

  // tools/importer/parsers/columns-promo-bar.js
  function parse(element, { document }) {
    const promoText = element.querySelector("p");
    const ctas = Array.from(element.querySelectorAll('a.button, a[class*="button"]'));
    const contentCell = [];
    if (promoText) contentCell.push(promoText);
    contentCell.push(...ctas);
    const cells = [contentCell];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-promo-bar", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse2(element, { document }) {
    const contentCell = [];
    const parentSection = element.closest('.hero-sale, .archive-collection, .ypb-hero, [class*="section"]');
    const bgImg = element.querySelector(":scope > img, :scope > picture");
    if (bgImg) {
      const p = document.createElement("p");
      p.append(bgImg);
      contentCell.push(p);
    }
    const lockup = element.querySelector(".lockup");
    if (lockup) {
      const headlines = Array.from(lockup.querySelectorAll(".headline"));
      headlines.forEach((hl) => {
        const h2 = document.createElement("h2");
        h2.innerHTML = hl.innerHTML;
        contentCell.push(h2);
      });
    } else {
      const toutContent = element.querySelector(".tout-content");
      if (toutContent) {
        const logoImg = toutContent.querySelector("img");
        if (logoImg) {
          const p = document.createElement("p");
          p.append(logoImg);
          contentCell.push(p);
        }
        const headingEl = toutContent.querySelector("strong, h1, h2, h3");
        if (headingEl) {
          const h2 = document.createElement("h2");
          h2.textContent = headingEl.textContent;
          contentCell.push(h2);
        }
      }
    }
    if (parentSection && !lockup) {
      const siblingBanner = parentSection.querySelector(":scope > .banner p");
      if (siblingBanner) {
        contentCell.push(siblingBanner);
      }
    }
    const ctasInElement = Array.from(element.querySelectorAll('.cta-group a.button, .cta-group a[class*="button"]'));
    if (ctasInElement.length > 0) {
      ctasInElement.forEach((cta) => {
        const p = document.createElement("p");
        p.append(cta);
        contentCell.push(p);
      });
    } else if (parentSection) {
      const siblingCtas = Array.from(
        parentSection.querySelectorAll(':scope > .banner a.button, :scope > .cta-group a.button, :scope > .cta-group a[class*="button"]')
      );
      const externalCtas = siblingCtas.filter((cta) => !element.contains(cta));
      externalCtas.forEach((cta) => {
        const p = document.createElement("p");
        p.append(cta);
        contentCell.push(p);
      });
    }
    const cells = contentCell.length > 0 ? [[contentCell]] : [];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse3(element, { document }) {
    const touts = Array.from(element.querySelectorAll(":scope > .tout"));
    const row = touts.map((tout) => {
      const cellContent = [];
      const img = tout.querySelector(":scope > img");
      if (img) {
        const p = document.createElement("p");
        p.append(img);
        cellContent.push(p);
      }
      const label = tout.querySelector(".tout-content .label, .label");
      if (label) {
        const p = document.createElement("p");
        p.textContent = label.textContent;
        cellContent.push(p);
      }
      const heading = tout.querySelector(".tout-content strong, strong");
      if (heading) {
        const h3 = document.createElement("h3");
        h3.textContent = heading.textContent;
        cellContent.push(h3);
      }
      const desc = tout.querySelector(":scope > p, .tout-content > p");
      if (desc) cellContent.push(desc);
      const cta = tout.querySelector('a.button, a[class*="button"]');
      if (cta) {
        const p = document.createElement("p");
        p.append(cta);
        cellContent.push(p);
      }
      if (!cta) {
        const buttonEl = tout.querySelector("button.button");
        if (buttonEl) {
          const p = document.createElement("p");
          p.textContent = buttonEl.textContent;
          cellContent.push(p);
        }
      }
      return cellContent;
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse4(element, { document }) {
    const slides = Array.from(element.querySelectorAll(".carousel-slide"));
    const cells = slides.map((slide) => {
      const slideImg = slide.querySelector(":scope > img");
      const imgCell = slideImg ? [slideImg] : [];
      const textCell = [];
      const heading = slide.querySelector(".slide-heading");
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent;
        textCell.push(h2);
      }
      const subheading = slide.querySelector(".slide-subheading");
      if (subheading) {
        const p = document.createElement("p");
        p.textContent = subheading.textContent;
        textCell.push(p);
      }
      const logo = slide.querySelector(".slide-content img");
      if (logo) {
        const p = document.createElement("p");
        p.append(logo);
        textCell.push(p);
      }
      const cta = slide.querySelector('.slide-content a.button, .slide-content a[class*="button"]');
      if (cta) {
        const p = document.createElement("p");
        p.append(cta);
        textCell.push(p);
      }
      return [imgCell, textCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/abercrombie-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        ".carousel-controls",
        ".carousel-pause",
        ".carousel-prev",
        ".carousel-next"
      ]);
      const footnotes = element.querySelectorAll("a.footnote");
      footnotes.forEach((fn) => fn.remove());
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        "nav",
        ".search-button",
        ".account-link",
        ".cart-link"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "link",
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/abercrombie-sections.js
  var H2 = { before: "beforeTransform", after: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === H2.after) {
      const { document } = payload;
      const sections = payload.template && payload.template.sections;
      if (!sections || sections.length < 2) return;
      const reversed = [...sections].reverse();
      reversed.forEach((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) return;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        if (section.id !== sections[0].id) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-shop-homepage.js
  var parsers = {
    "columns-promo-bar": parse,
    "hero": parse2,
    "columns": parse3,
    "carousel": parse4
  };
  var PAGE_TEMPLATE = {
    name: "shop-homepage",
    description: "Abercrombie shop US homepage with hero, promotional carousels, category cards, and marketing content sections",
    urls: [
      "https://www.abercrombie.com/shop/us"
    ],
    blocks: [
      {
        name: "columns-promo-bar",
        instances: [".promo-bar"]
      },
      {
        name: "hero",
        instances: [
          ".hero-sale .banner",
          ".archive-collection .tout.tout-with-picture",
          ".ypb-hero .tout.tout-with-picture"
        ]
      },
      {
        name: "columns",
        instances: [
          ".trend-edit .tout-group",
          ".membership-tiles .tout-group"
        ]
      },
      {
        name: "carousel",
        instances: [".carousel-section .carousel"]
      }
    ],
    sections: [
      {
        id: "section-promo-bar",
        name: "Promo Bar",
        selector: ".promo-bar",
        style: null,
        blocks: ["columns-promo-bar"],
        defaultContent: []
      },
      {
        id: "section-hero-sale",
        name: "Winter Sale Hero",
        selector: ".hero-sale",
        style: "brand-red",
        blocks: ["hero"],
        defaultContent: []
      },
      {
        id: "section-trend-edit",
        name: "Trend Edit Cards",
        selector: ".trend-edit",
        style: null,
        blocks: ["columns"],
        defaultContent: []
      },
      {
        id: "section-archive",
        name: "Archive Collection Hero",
        selector: ".archive-collection",
        style: null,
        blocks: ["hero"],
        defaultContent: [".archive-collection .banner p"]
      },
      {
        id: "section-carousel",
        name: "NFL Partnership Carousel",
        selector: ".carousel-section",
        style: null,
        blocks: ["carousel"],
        defaultContent: []
      },
      {
        id: "section-ypb",
        name: "YPB Hero",
        selector: ".ypb-hero",
        style: null,
        blocks: ["hero"],
        defaultContent: []
      },
      {
        id: "section-membership",
        name: "Membership Tiles",
        selector: ".membership-tiles",
        style: null,
        blocks: ["columns"],
        defaultContent: []
      },
      {
        id: "section-footer-legal",
        name: "Footer Legal",
        selector: ".footer-legal",
        style: null,
        blocks: [],
        defaultContent: [".footer-legal p", ".footer-legal a"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_shop_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_shop_homepage_exports);
})();
