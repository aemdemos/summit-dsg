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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-corporate.js
  function parse(element, { document }) {
    const bgImg = element.querySelector(":scope > img");
    const eyebrowEl = element.querySelector(".variant.eyebrow");
    const eyebrow = eyebrowEl ? eyebrowEl.closest("h2") || eyebrowEl : null;
    const displayEl = element.querySelector(".variant.display");
    const heading = displayEl ? displayEl.closest("h1") || displayEl : null;
    const subtitleEl = element.querySelector("p .variant.subtitle");
    const subtitle = subtitleEl ? subtitleEl.closest("p") : null;
    const ctaLink = element.querySelector("dig-button a.primary, dig-button a");
    const wrapper = document.createElement("div");
    if (bgImg) {
      const imgP = document.createElement("p");
      imgP.append(bgImg);
      wrapper.append(imgP);
    }
    if (eyebrow) {
      const h2 = document.createElement("h2");
      h2.textContent = eyebrow.textContent.trim();
      wrapper.append(h2);
    }
    if (heading) {
      const h1 = document.createElement("h1");
      h1.textContent = heading.textContent.trim();
      wrapper.append(h1);
    }
    if (subtitle) {
      const p = document.createElement("p");
      p.textContent = subtitle.textContent.trim();
      wrapper.append(p);
    }
    if (ctaLink) {
      const a = document.createElement("a");
      a.href = ctaLink.href;
      a.textContent = ctaLink.textContent.trim();
      const p = document.createElement("p");
      p.append(a);
      wrapper.append(p);
    }
    const cells = [[wrapper]];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-corporate", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-offering.js
  function parse2(element, { document }) {
    const cards = element.querySelectorAll("dig-card");
    const cells = [];
    cards.forEach((card) => {
      const link = card.querySelector("a.cmp-cardlist__item, a");
      const iconImg = card.querySelector('.dig-card-content img[src^="./images"], .dig-card-content img[src*="images/"]');
      const labelEl = card.querySelector("dig-typography p");
      const labelText = labelEl ? labelEl.textContent.trim() : "";
      const iconCell = [];
      if (iconImg) {
        const img = document.createElement("img");
        img.src = iconImg.src;
        img.alt = iconImg.alt || "";
        iconCell.push(img);
      }
      const textCell = [];
      if (link && labelText) {
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = labelText;
        const p = document.createElement("p");
        p.append(a);
        textCell.push(p);
      } else if (labelText) {
        const p = document.createElement("p");
        p.textContent = labelText;
        textCell.push(p);
      }
      if (iconCell.length || textCell.length) {
        cells.push([iconCell, textCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-offering", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-spotlight.js
  function parse3(element, { document }) {
    const desktopContent = element.querySelector(".cmp-rotator-content-desktop dig-rotator-content");
    const textSlides = desktopContent ? Array.from(desktopContent.querySelectorAll(":scope > div")) : [];
    const imageContainer = element.querySelector(".cmp-rotator__content-item-video dig-rotator-content");
    const imageSlides = imageContainer ? Array.from(imageContainer.querySelectorAll(":scope > div")) : [];
    const cells = [];
    textSlides.forEach((slide, idx) => {
      const imageCell = [];
      if (imageSlides[idx]) {
        const slideImg = imageSlides[idx].querySelector("img.cmp-rotator__content-video, img");
        if (slideImg) {
          const img = document.createElement("img");
          img.src = slideImg.src;
          img.alt = slideImg.alt || "";
          imageCell.push(img);
        }
      }
      const contentCell = [];
      const titleEl = slide.querySelector("dig-typography.dig-typography--subtitle h3, h3");
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        contentCell.push(h3);
      }
      const bodyEl = slide.querySelector("dig-typography.dig-typography--body-large");
      if (bodyEl) {
        const paragraphs = bodyEl.querySelectorAll("p");
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (text) {
            const para = document.createElement("p");
            para.textContent = text;
            contentCell.push(para);
          }
        });
      }
      const ctaEl = slide.querySelector("dig-link a");
      if (ctaEl) {
        const a = document.createElement("a");
        a.href = ctaEl.href;
        a.textContent = ctaEl.textContent.trim();
        const p = document.createElement("p");
        p.append(a);
        contentCell.push(p);
      }
      if (contentCell.length) {
        cells.push([imageCell, contentCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-spotlight", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-insight.js
  function parse4(element, { document }) {
    const cards = element.querySelectorAll(".card > dig-card, dig-card");
    const cells = [];
    cards.forEach((card) => {
      const imageCell = [];
      const cardImg = card.querySelector("dig-card-media img");
      if (cardImg) {
        const img = document.createElement("img");
        img.src = cardImg.src;
        img.alt = cardImg.alt || "";
        imageCell.push(img);
      }
      const contentCell = [];
      const titleEl = card.querySelector("dig-typography.dig-typography--subtitle h3, .dig-card-content h3");
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        contentCell.push(h3);
      }
      const bodyEl = card.querySelector("dig-typography.dig-typography--body-medium p, .dig-card-content-container p");
      if (bodyEl) {
        const p = document.createElement("p");
        p.textContent = bodyEl.textContent.trim();
        contentCell.push(p);
      }
      const ctaEl = card.querySelector("dig-link a");
      if (ctaEl) {
        const a = document.createElement("a");
        a.href = ctaEl.href;
        a.textContent = ctaEl.textContent.trim();
        const p = document.createElement("p");
        p.append(a);
        contentCell.push(p);
      }
      if (imageCell.length || contentCell.length) {
        cells.push([imageCell, contentCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-insight", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-support.js
  function parse5(element, { document }) {
    const columnContainers = element.querySelectorAll(".container.responsivegrid.aem-GridColumn--default--4");
    const columnCells = [];
    columnContainers.forEach((col) => {
      const cellContent = [];
      const iconImg = col.querySelector(".cmp-image img, .cmp-image__image");
      if (iconImg) {
        const img = document.createElement("img");
        img.src = iconImg.src;
        img.alt = iconImg.alt || "";
        const p = document.createElement("p");
        p.append(img);
        cellContent.push(p);
      }
      const headingEl = col.querySelector(".rich-text-wrapper h3, h3");
      if (headingEl) {
        const h3 = document.createElement("h3");
        h3.textContent = headingEl.textContent.trim();
        cellContent.push(h3);
      }
      const bodyEl = col.querySelector(".rich-text-wrapper p");
      if (bodyEl) {
        const p = document.createElement("p");
        p.textContent = bodyEl.textContent.trim();
        cellContent.push(p);
      }
      const ctaEl = col.querySelector("dig-link a, .cmp-link a");
      if (ctaEl) {
        const a = document.createElement("a");
        a.href = ctaEl.href;
        a.textContent = ctaEl.textContent.trim();
        const p = document.createElement("p");
        p.append(a);
        cellContent.push(p);
      }
      if (cellContent.length) {
        columnCells.push(cellContent);
      }
    });
    const cells = [columnCells];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-support", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-press.js
  function parse6(element, { document }) {
    const cards = element.querySelectorAll(".card > dig-card, dig-card");
    const cells = [];
    cards.forEach((card) => {
      const contentCell = [];
      const titleEl = card.querySelector("dig-typography.dig-typography--subtitle h3, .dig-card-content h3");
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        contentCell.push(h3);
      }
      const bodyEl = card.querySelector("dig-typography.dig-typography--body-medium p");
      if (bodyEl) {
        const p = document.createElement("p");
        p.textContent = bodyEl.textContent.trim();
        contentCell.push(p);
      }
      const dateEl = card.querySelector("dig-typography.dig-typography--body-small p");
      if (dateEl) {
        const p = document.createElement("p");
        p.textContent = dateEl.textContent.trim();
        contentCell.push(p);
      }
      const ctaEl = card.querySelector("dig-link a");
      if (ctaEl) {
        const a = document.createElement("a");
        a.href = ctaEl.href;
        a.textContent = ctaEl.textContent.trim();
        const p = document.createElement("p");
        p.append(a);
        contentCell.push(p);
      }
      if (contentCell.length) {
        cells.push([contentCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-press", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/thomsonreuters-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        ".onetrust-pc-dark-filter",
        "#modalRoot"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "header",
        "header.bb-headerWrapper",
        "nav",
        "bb-megamenu",
        "bb-navigation",
        ".bb-Megamenu",
        ".bb-Navigation",
        ".bb-headerWrapper",
        ".megamenu",
        ".megamenu-wrapper",
        '[class*="megamenu"]',
        '[class*="Megamenu"]',
        '[class*="Navigation"]'
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Site footer and global footer
        ".siteFooter",
        "footer",
        "footer.tr-SemanticFooter",
        "footer.megamenu-footer",
        ".emcmUi-SiteFooter",
        "dcl-globalfooter",
        // Cloud services and tracking
        ".cloudservice",
        ".chatBotTrackingVariables",
        // Stylesheet links
        'link[href*="clientlibs"]',
        // iframes and noscript
        "iframe",
        "noscript",
        // Tracking pixels
        'img[src*="bat.bing.com"]',
        'img[src*="analytics"]',
        'img[src*="tracking"]'
      ]);
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Thomson Reuters corporate homepage with hero, content bands, carousels, card grids, and global chrome (header/footer)",
    urls: [
      "https://www.thomsonreuters.com/en"
    ],
    blocks: [
      {
        name: "hero-corporate",
        instances: ["#hero-module"]
      },
      {
        name: "cards-offering",
        instances: [".cmp-cardlist"]
      },
      {
        name: "carousel-spotlight",
        instances: ["#cmp-rotator-spotlight", "#spotlight-module .cmp-rotator"]
      },
      {
        name: "cards-insight",
        instances: ["#features-insights-module .card-wrapper"]
      },
      {
        name: "columns-support",
        instances: ["#customer-support-module .dig-paper__content"]
      },
      {
        name: "cards-press",
        instances: ["#press-releases-module .card-wrapper"]
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero",
        selector: "#hero-module",
        style: null,
        blocks: ["hero-corporate", "cards-offering"],
        defaultContent: []
      },
      {
        id: "section-2-new-noteworthy",
        name: "New and Noteworthy",
        selector: "#spotlight-module",
        style: null,
        blocks: ["carousel-spotlight"],
        defaultContent: ["#spotlight-module .rich-text-wrapper h2"]
      },
      {
        id: "section-3-featured-insights",
        name: "Featured Insights",
        selector: "#features-insights-module",
        style: null,
        blocks: ["cards-insight"],
        defaultContent: ["#features-insights-module .rich-text-wrapper h2"]
      },
      {
        id: "section-4-customer-support",
        name: "Customer Support",
        selector: "#customer-support-module",
        style: "grey",
        blocks: ["columns-support"],
        defaultContent: ["#customer-support-module .rich-text-wrapper h2"]
      },
      {
        id: "section-5-press-releases",
        name: "Press Releases",
        selector: "#press-releases-module",
        style: null,
        blocks: ["cards-press"],
        defaultContent: [
          "#press-releases-module .rich-text-wrapper h2",
          "#press-releases-module .dig-button"
        ]
      }
    ]
  };
  var parsers = {
    "hero-corporate": parse,
    "cards-offering": parse2,
    "carousel-spotlight": parse3,
    "cards-insight": parse4,
    "columns-support": parse5,
    "cards-press": parse6
  };
  var transformers = [
    transform
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
    for (let i = 0; i < pageBlocks.length; i += 1) {
      for (let j = 0; j < pageBlocks.length; j += 1) {
        if (i !== j && pageBlocks[i].element.contains(pageBlocks[j].element)) {
          const parent = pageBlocks[i].element;
          const child = pageBlocks[j].element;
          parent.after(child);
          console.log(`Extracted nested block "${pageBlocks[j].name}" from "${pageBlocks[i].name}"`);
        }
      }
    }
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  function addSectionBreaks(document, template) {
    if (!template.sections || template.sections.length < 2) return;
    const sections = template.sections;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      let sectionEl = null;
      for (const sel of selectors) {
        sectionEl = document.querySelector(sel);
        if (sectionEl) break;
      }
      if (!sectionEl) continue;
      if (section.style) {
        const sectionMetaBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        sectionEl.after(sectionMetaBlock);
      }
      if (i > 0) {
        const hr = document.createElement("hr");
        sectionEl.before(hr);
      }
    }
  }
  var import_homepage_default = {
    transform: (payload) => {
      var _a;
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const firstSectionSel = (_a = PAGE_TEMPLATE.sections[0]) == null ? void 0 : _a.selector;
      if (firstSectionSel) {
        const firstSectionEl = document.querySelector(firstSectionSel);
        if (firstSectionEl) {
          let current = firstSectionEl;
          while (current && current.parentElement) {
            while (current.previousSibling) {
              current.previousSibling.remove();
            }
            if (current.parentElement === document.body) break;
            current = current.parentElement;
          }
        }
      }
      addSectionBreaks(document, PAGE_TEMPLATE);
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
  return __toCommonJS(import_homepage_exports);
})();
