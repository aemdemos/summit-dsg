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

  // tools/importer/parsers/cards.js
  function parse(element, { document }) {
    const cards = element.querySelectorAll(":scope .trending-card .trending-info");
    if (!cards.length) return;
    const cells = [];
    cards.forEach((cardInfo) => {
      const card = cardInfo.closest(".trending-card");
      const img = cardInfo.querySelector(".item-image img");
      const imgCell = document.createElement("div");
      if (img) {
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || "";
        imgCell.append(newImg);
      }
      const contentCell = document.createElement("div");
      const titleLink = cardInfo.querySelector("a.item-header");
      if (titleLink) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        a.href = titleLink.href;
        a.textContent = titleLink.textContent.trim();
        strong.append(a);
        p.append(strong);
        contentCell.append(p);
      }
      const subheader = cardInfo.querySelector(".item-subheader p");
      if (subheader && subheader.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = subheader.textContent.trim();
        contentCell.append(p);
      }
      const ctaContainer = card ? card.querySelector(".trending-cta-container") : null;
      if (ctaContainer) {
        const ctas = ctaContainer.querySelectorAll("a.trending-cta");
        ctas.forEach((cta) => {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = cta.href;
          a.textContent = cta.textContent.trim();
          p.append(a);
          contentCell.append(p);
        });
      }
      cells.push([imgCell, contentCell]);
    });
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse2(element, { document }) {
    const panels = element.querySelectorAll('[role="tabpanel"]');
    if (!panels.length) return;
    const cells = [];
    panels.forEach((panel) => {
      const teaser = panel.querySelector(".cmp-teaser-v3, .teaser-v3");
      if (!teaser) return;
      const img = teaser.querySelector("img.cmp-image__image, .cmp-teaser-v3__image-container img");
      if (!img || !img.src) return;
      const imgCell = document.createElement("div");
      const newImg = document.createElement("img");
      newImg.src = img.src;
      newImg.alt = img.alt || "";
      imgCell.append(newImg);
      const contentCell = document.createElement("div");
      const titleEl = teaser.querySelector(".cmp-teaser-v3__title");
      if (titleEl) {
        const titleLink = titleEl.querySelector("a");
        const h2 = document.createElement("h2");
        if (titleLink) {
          const a = document.createElement("a");
          a.href = titleLink.href;
          a.textContent = titleLink.textContent.trim();
          h2.append(a);
        } else {
          h2.textContent = titleEl.textContent.trim();
        }
        contentCell.append(h2);
      }
      const descEl = teaser.querySelector(".cmp-teaser-v3__description");
      if (descEl && descEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        contentCell.append(p);
      }
      const ctaLinks = teaser.querySelectorAll(".cmp-teaser-v3__action-link");
      ctaLinks.forEach((cta) => {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.href;
        a.textContent = cta.textContent.trim();
        p.append(a);
        contentCell.append(p);
      });
      cells.push([imgCell, contentCell]);
    });
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/dsg-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        '[class*="cookie"]',
        '[class*="consent"]',
        '[class*="retailmedia"]',
        '[class*="sponsored"]',
        ".skip-link",
        "#defaultmonetate",
        "#certona"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Standard elements
        "header",
        "footer",
        "nav",
        // DSG header/footer containers
        "#responsive-header",
        "#header",
        "#responsive-footer",
        "#footer",
        "#footer-legal-disclaimer",
        "#footer-copyright",
        "#footer-screen-reader-msg",
        '[class*="calia-react-header"]',
        '[class*="dsg-header"]',
        ".main-header",
        ".header-container",
        '[class*="cmp-experiencefragment--header"]',
        '[class*="cmp-experiencefragment--footer"]',
        // Navigation
        ".desktop-nav-container__nav",
        '[class*="navigation"]',
        // Dynamic/personalization sections
        "#productplacement1",
        "#toppzhero_container",
        "#pzhero_container",
        // Social/UGC
        '[class*="bazaarvoice"]',
        '[class*="curalate"]',
        // Value props bar (Best Price Guarantee, Free Shipping etc.)
        '[class*="value-prop"]',
        // Email/SMS signup
        '[class*="email-signup"]',
        '[class*="sms-signup"]',
        // Other non-content
        "iframe",
        "link",
        "noscript",
        ".spacer",
        "script",
        // Social/UGC section (Bazaarvoice/Curalate Instagram)
        "[data-crl8-container-id]",
        "#text-182e35c8d7",
        // Tracking pixels (img tags with tracking URLs)
        'img[src*="arttrk.com"]',
        'img[src*="bat.bing.com"]',
        'img[src*="t.co"]',
        'img[src*="analytics.twitter.com"]',
        'img[src*="tvspix.com"]',
        'img[src*="edge.curalate.com"]'
      ]);
      element.querySelectorAll("[data-em]").forEach((el) => el.removeAttribute("data-em"));
      element.querySelectorAll("[data-cmp-clickable]").forEach((el) => el.removeAttribute("data-cmp-clickable"));
      element.querySelectorAll("[data-sly-unwrap]").forEach((el) => el.removeAttribute("data-sly-unwrap"));
    }
  }

  // tools/importer/transformers/dsg-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { template } = payload || {};
      const sections = template && template.sections;
      if (!sections || sections.length < 2) return;
      const document = element.ownerDocument;
      const reversed = [...sections].reverse();
      reversed.forEach((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          try {
            sectionEl = element.querySelector(sel);
            if (sectionEl) break;
          } catch (e) {
          }
        }
        if (!sectionEl) return;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        if (section.id !== sections[0].id && sectionEl.previousElementSibling) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "DICK'S Sporting Goods homepage with hero carousel, trending cards, latest launches, expert advice pro tips, and social/Instagram sections",
    urls: [
      "https://www.dickssportinggoods.com/"
    ],
    blocks: [
      {
        name: "cards",
        instances: [
          "#FootwearBubbles .trending-card",
          "#TopTrending_container .trending-card",
          "#latestlaunches .trending-card",
          "#protips_container .trending-card"
        ]
      },
      {
        name: "carousel",
        instances: [
          "#Carousel"
        ]
      }
    ],
    sections: [
      {
        id: "section-shoe-bar",
        name: "Shoe Bar",
        selector: "#footwearbubbles_container",
        style: null,
        blocks: ["cards"],
        defaultContent: [".title-scrolling__title", ".title-scrolling__cta"]
      },
      {
        id: "section-hero-carousel",
        name: "Hero Carousel",
        selector: "#Carousel",
        style: null,
        blocks: ["carousel"],
        defaultContent: []
      },
      {
        id: "section-trending-spotlight",
        name: "Trending Spotlight",
        selector: "#TopTrending_container",
        style: null,
        blocks: ["cards"],
        defaultContent: ["#title-294168ac00"]
      },
      {
        id: "section-latest-launches",
        name: "Latest Launches",
        selector: "#latestlaunches",
        style: null,
        blocks: ["cards"],
        defaultContent: []
      },
      {
        id: "section-expert-advice",
        name: "Expert Advice",
        selector: ["#protips_container", ".global-title"],
        style: null,
        blocks: ["cards"],
        defaultContent: [".global-title h1"]
      }
    ]
  };
  var parsers = {
    "cards": parse,
    "carousel": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
    const containerSelectors = {
      cards: [
        "#FootwearBubbles",
        "#TopTrending_container",
        "#latestlaunches",
        "#protips_container"
      ]
    };
    template.blocks.forEach((blockDef) => {
      const selectors = containerSelectors[blockDef.name] || blockDef.instances;
      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            pageBlocks.push({
              name: blockDef.name,
              selector,
              element
            });
          });
        } catch (e) {
          console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        }
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      if (PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1) {
        const sections = PAGE_TEMPLATE.sections;
        [...sections].reverse().forEach((section) => {
          if (section.id === sections[0].id) return;
          const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
          let sectionEl = null;
          for (const sel of selectors) {
            try {
              sectionEl = document.querySelector(sel);
              if (sectionEl) break;
            } catch (e) {
            }
          }
          if (sectionEl && sectionEl.previousElementSibling) {
            const sectionHr = document.createElement("hr");
            sectionEl.before(sectionHr);
          }
        });
      }
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
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
