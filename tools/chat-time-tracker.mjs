#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { basename, join, dirname } from 'path';

// --- Configuration (edit these) ---
const BUFFER_PER_EXCHANGE_MS = 60_000; // 1 minute per exchange
const IDLE_THRESHOLD_MS = 5 * 60_000; // 5 minutes

// Optional: manual project aliases to merge auto-detected domains.
const PROJECT_ALIASES = {};

// Session break threshold — gaps longer than this split sessions for chunking
const SESSION_BREAK_MS = 2 * 60 * 60_000; // 2 hours

// "Too large" thresholds — if ANY is exceeded, the script recommends/auto-chunks
const LARGE_FILE_BYTES = 100 * 1024; // 100 KB
const LARGE_EXCHANGE_COUNT = 50; // 50+ exchanges
const LARGE_SESSION_COUNT = 3; // 3+ distinct work sessions

// --- CLI flags ---
const rawArgs = process.argv.slice(2);
const verbose = rawArgs.includes('--verbose') || rawArgs.includes('-v');
const perFile = rawArgs.includes('--per-file');
const byProject = rawArgs.includes('--by-project');
const chunk = rawArgs.includes('--chunk');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');
const chunkDirIdx = rawArgs.indexOf('--chunk-dir');
const chunkDir = chunkDirIdx !== -1 && rawArgs[chunkDirIdx + 1] ? rawArgs[chunkDirIdx + 1] : null;
const files = rawArgs.filter((a) => !a.startsWith('-') && (chunkDirIdx === -1 || rawArgs.indexOf(a) !== chunkDirIdx + 1));

if (help || files.length === 0) {
  console.log(`
Usage: node chat-time-tracker.mjs [options] <file1.md> [file2.md] ...

Options:
  --verbose, -v      Show per-exchange detail (category, time, scores, summary)
  --per-file         Show breakdown per input file
  --by-project       Auto-detect projects from URLs in content, group exchanges
  --chunk            Split large chats into sessions and output per-session summaries
  --chunk-dir <dir>  Write session chunks as separate files to <dir> (implies --chunk)
  -h, --help         Show this help

Output always includes:
  - Summary table with category breakdown
  - Time comparison (active vs. wall clock vs. idle)
  - Idle gap log with timestamps and type classification
  - Rework report (exchanges fixing prior work)
  - Efficiency suggestions with savings % (auto-generated from data patterns)

Chunking (--chunk / --chunk-dir):
  Splits the chat into sessions based on gaps > ${SESSION_BREAK_MS / 3_600_000}h.
  Each session gets a mini-summary (category table, top topics, key metrics).
  With --chunk-dir, writes each session to a separate .md file plus an index.md.
  Feed individual session files to an AI for analysis without needing the full chat.

Thresholds (edit at top of script):
  BUFFER_PER_EXCHANGE_MS  = ${BUFFER_PER_EXCHANGE_MS / 1000}s   (per exchange for operator review)
  IDLE_THRESHOLD_MS       = ${IDLE_THRESHOLD_MS / 1000}s  (gaps above this are idle)
  SESSION_BREAK_MS        = ${SESSION_BREAK_MS / 1000}s (gaps above this split sessions for chunking)

Large chat auto-detection (triggers chunking recommendation):
  LARGE_FILE_BYTES        = ${LARGE_FILE_BYTES / 1024}KB  (file size on disk)
  LARGE_EXCHANGE_COUNT    = ${LARGE_EXCHANGE_COUNT}    (number of user→assistant round-trips)
  LARGE_SESSION_COUNT     = ${LARGE_SESSION_COUNT}     (number of distinct work sessions)
  If ANY threshold is exceeded, the script recommends --chunk.

Project detection (--by-project):
  Auto-detects projects from URLs in content. Edit PROJECT_ALIASES to add friendly names.
`);
  process.exit(0);
}

// --- Parsing ---
function parseMessages(markdown) {
  const headerRe = /^### (User|Assistant) \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) UTC\]/;
  const lines = markdown.split('\n');
  const messages = [];
  let current = null;
  const contentLines = [];

  for (const line of lines) {
    const m = headerRe.exec(line);
    if (m) {
      if (current) {
        const raw = contentLines.join('\n').trim();
        current.content = raw.length > 2000 ? raw.slice(0, 2000) : raw;
        messages.push(current);
        contentLines.length = 0;
      }
      current = {
        role: m[1].toLowerCase(),
        timestamp: new Date(`${m[2]}Z`),
        content: '',
      };
    } else if (current) {
      contentLines.push(line);
    }
  }
  if (current) {
    const raw = contentLines.join('\n').trim();
    current.content = raw.length > 2000 ? raw.slice(0, 2000) : raw;
    messages.push(current);
  }
  return messages;
}

// --- Exchange grouping ---
function groupExchanges(messages, sourceFile) {
  const exchanges = [];
  let current = null;

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (current) exchanges.push(current);
      current = {
        userTime: msg.timestamp,
        lastAssistantTime: null,
        content: msg.content,
        allContent: msg.content,
        sourceFile,
      };
    } else if (msg.role === 'assistant' && current) {
      current.lastAssistantTime = msg.timestamp;
      if (current.allContent.length < 20000) {
        current.allContent += `\n${msg.content}`;
      }
    }
  }
  if (current) exchanges.push(current);
  return exchanges.filter((e) => e.lastAssistantTime);
}

// --- Project detection ---
const IGNORED_DOMAINS = new Set([
  'localhost', 'localhost:3000', 'localhost:3001',
  'github.com', 'raw.githubusercontent.com',
  'fonts.googleapis.com', 'fonts.gstatic.com',
  'cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com',
  'www.aem.live', 'aem.live',
  'developers.google.com', 'developer.mozilla.org',
  'portswigger.net',
  'content.da.live', 'da.live', 'admin.da.live',
]);

const AEM_PREVIEW_RE = /\w+--(\w[\w-]*)--(\w[\w-]*)\.aem\.(page|live)/;

function extractDomainFromUrl(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
}

function domainToProjectName(domain) {
  if (PROJECT_ALIASES[domain]) return PROJECT_ALIASES[domain];
  const aemMatch = domain.match(AEM_PREVIEW_RE);
  if (aemMatch) {
    if (PROJECT_ALIASES[aemMatch[1]]) return PROJECT_ALIASES[aemMatch[1]];
    return aemMatch[1];
  }
  return domain.replace(/^www\./, '');
}

function detectProject(exchange) {
  const text = exchange.allContent;
  const urlPattern = /https?:\/\/[^\s"'<>)\]]+/g;
  const domainCounts = {};
  let match;
  while ((match = urlPattern.exec(text)) !== null) {
    const domain = extractDomainFromUrl(match[0]);
    if (!domain || IGNORED_DOMAINS.has(domain)) continue;
    const aemMatch = domain.match(AEM_PREVIEW_RE);
    const key = aemMatch ? `${aemMatch[1]}--${aemMatch[2]}.aem` : domain;
    domainCounts[key] = (domainCounts[key] || 0) + 1;
  }
  const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return 'General';
  const topDomain = sorted[0][0];
  if (PROJECT_ALIASES[topDomain]) return PROJECT_ALIASES[topDomain];
  const aemMatch = topDomain.match(/^(\w[\w-]*)--(\w[\w-]*)\.aem$/);
  if (aemMatch) return PROJECT_ALIASES[aemMatch[1]] || aemMatch[1];
  return domainToProjectName(topDomain);
}

// --- Categories with weighted patterns ---
const CATEGORIES = {
  'Review/Admin': [
    { p: /\bstage the file/i, w: 3 },
    { p: /\bstage file/i, w: 3 },
    { p: /\bplease stage/i, w: 3 },
    { p: /\bstage.*change/i, w: 3 },
    { p: /\breview.*file/i, w: 3 },
    { p: /\breview all/i, w: 3 },
    { p: /\blooking good/i, w: 3 },
    { p: /\bthank you\b/i, w: 2 },
    { p: /\bthanks\b/i, w: 2 },
    { p: /^yes\b/i, w: 1 },
    { p: /\bplease rollback/i, w: 3 },
    { p: /\brollback\b/i, w: 2 },
    { p: /\bcan you summar/i, w: 3 },
    { p: /\bsummerize\b/i, w: 3 },
    { p: /\bsummarize\b/i, w: 3 },
    { p: /\bwhat.*file.*change/i, w: 3 },
    { p: /\bexplain.*structure/i, w: 3 },
    { p: /\bprovide.*info/i, w: 3 },
    { p: /\bprovide.*structure/i, w: 3 },
    { p: /\bi am happy/i, w: 3 },
    { p: /\bi will.*push/i, w: 2 },
    { p: /\bcommit.*push.*later/i, w: 3 },
    { p: /\bre-stage/i, w: 3 },
    { p: /\bany code change/i, w: 3 },
    // Acknowledgments and confirmations
    { p: /\bworking now\b/i, w: 2 },
    { p: /\bits working/i, w: 2 },
    { p: /\bwhat files\b/i, w: 3 },
    { p: /\bwhat.*the.*file\b/i, w: 3 },
    { p: /\bin what file/i, w: 3 },
    { p: /\bfile.*change.*list/i, w: 3 },
    { p: /\bscreenshot.*showing/i, w: 1 },
    { p: /\bscreenshot.*taken/i, w: 1 },
  ],
  Config: [
    { p: /\bproject\.json/i, w: 3 },
    { p: /\bfstab/i, w: 3 },
    { p: /\bcontentHostUrl/i, w: 3 },
    { p: /\blibraryUrl/i, w: 3 },
    { p: /\bsite configuration/i, w: 3 },
    { p: /\bauthenticat/i, w: 2 },
    { p: /\bcredential/i, w: 2 },
    { p: /\bcommit\b/i, w: 2 },
    { p: /\bpush\b/i, w: 1 },
    { p: /\bstage\b/i, w: 2 },
    { p: /\bgit\b/i, w: 2 },
    { p: /\bbranch/i, w: 1 },
    { p: /\brepo\b/i, w: 1 },
    { p: /\bupload\b/i, w: 1 },
    { p: /\bclean.*tree/i, w: 3 },
    { p: /\buntracked/i, w: 2 },
    { p: /\bunstaged/i, w: 2 },
    { p: /\bdeploy/i, w: 1 },
  ],
  Debugging: [
    { p: /\bplease investigate/i, w: 3 },
    { p: /\binvestigat/i, w: 3 },
    { p: /\bdebug\b/i, w: 3 },
    { p: /\btroubleshoot/i, w: 3 },
    { p: /\bnot working/i, w: 3 },
    { p: /\bnot appear/i, w: 3 },
    { p: /\bnot display/i, w: 3 },
    { p: /\bmissing\b/i, w: 2 },
    { p: /\bbroken\b/i, w: 3 },
    { p: /\b404\b/, w: 2 },
    { p: /\bempty\b/i, w: 1 },
    { p: /\bfails?\b/i, w: 2 },
    { p: /\berror\b/i, w: 2 },
    { p: /\broot cause/i, w: 3 },
    { p: /\bstill not/i, w: 3 },
    { p: /\bdoesn.t work/i, w: 3 },
    { p: /\bnot.*correct on.*live/i, w: 3 },
    // Environment comparison (local vs AEM/live)
    { p: /\bpreview vs\b/i, w: 2 },
    { p: /\bvs AEM/i, w: 3 },
    { p: /\bcompare.*AEM/i, w: 2 },
    { p: /\bmatch.*local/i, w: 2 },
    { p: /\bAEM.*different/i, w: 2 },
    { p: /\bstill outside/i, w: 3 },
    { p: /\bnot see.*change/i, w: 3 },
    { p: /\bi do not see/i, w: 3 },
    { p: /\bi still see/i, w: 3 },
    { p: /\bnot seeing/i, w: 3 },
  ],
  Validation: [
    { p: /\bvalidat/i, w: 2 },
    { p: /\bvisual critique/i, w: 3 },
    { p: /\bsimilarity/i, w: 3 },
    { p: /\bremediation cycle/i, w: 3 },
    { p: /\bregister/i, w: 2 },
    { p: /\bpre.?completion/i, w: 3 },
    { p: /\bgate\b/i, w: 1 },
    { p: /\bcompare.*source/i, w: 2 },
    { p: /\bcompare.*migrat/i, w: 2 },
    { p: /\bmatch_elements/i, w: 3 },
    { p: /\ballValidated/i, w: 3 },
    { p: /\b\d+\/\d+.*pass/i, w: 2 },
    { p: /\bstructural.*schema/i, w: 3 },
    { p: /\bbehavior.*register/i, w: 3 },
    { p: /\bappearance.*register/i, w: 3 },
  ],
  'Image Work': [
    { p: /\bdownload.*font/i, w: 3 },
    { p: /\bfont file/i, w: 3 },
    { p: /\bbase64\b/i, w: 2 },
    { p: /\billustration/i, w: 3 },
    { p: /\blogo\b/i, w: 2 },
    { p: /\bsvg\b/i, w: 1 },
    { p: /\bicon\b/i, w: 1 },
    { p: /\.webp\b/i, w: 2 },
    { p: /\.png\b/i, w: 1 },
    { p: /\.jpg\b/i, w: 1 },
    { p: /\bphoto/i, w: 2 },
    { p: /\bimage\b/i, w: 1 },
    { p: /\bpicture\b/i, w: 1 },
  ],
  Content: [
    { p: /\bplain\.html/i, w: 2 },
    { p: /\bsection break/i, w: 3 },
    { p: /\b<hr>/i, w: 2 },
    { p: /\bcontent.*restructur/i, w: 3 },
    { p: /\bnav.*content/i, w: 2 },
    { p: /\bfooter.*content/i, w: 2 },
    { p: /\bauthoring/i, w: 2 },
    { p: /\bDA\b/, w: 1 },
    { p: /\bdocument authoring/i, w: 2 },
    { p: /\bpublish/i, w: 1 },
    { p: /\bremove.*from.*block/i, w: 2 },
    { p: /\badd.*CTA/i, w: 2 },
    { p: /\badd.*callout/i, w: 2 },
    { p: /\bpromo.?card/i, w: 2 },
  ],
  'Block Work': [
    { p: /\bblock\b/i, w: 2 },
    { p: /\bcarousel\b/i, w: 2 },
    { p: /\bcards\b/i, w: 2 },
    { p: /\bcolumns\b/i, w: 2 },
    { p: /\bhero\b/i, w: 2 },
    { p: /\baccount.?login\b/i, w: 3 },
    { p: /\bparser\b/i, w: 3 },
    { p: /\bdecorat/i, w: 2 },
    { p: /\bmegamenu\b/i, w: 2 },
    { p: /\bfooter\b/i, w: 1 },
    { p: /\bheader\b/i, w: 1 },
    { p: /\bnavigation.*migrat/i, w: 3 },
    { p: /\bfooter.*migrat/i, w: 3 },
    { p: /\bblock variant/i, w: 3 },
    { p: /\bimport script/i, w: 3 },
    { p: /\bimport infrastructure/i, w: 3 },
    { p: /\bpage analysis/i, w: 3 },
    { p: /\bsite analysis/i, w: 3 },
    { p: /\bcontent import\b/i, w: 3 },
    { p: /\bsection transform/i, w: 3 },
    { p: /\bhamburger/i, w: 2 },
    { p: /\bslide.?in/i, w: 2 },
    { p: /\bheader\.js/i, w: 2 },
    { p: /\bfooter\.js/i, w: 2 },
    { p: /\b12.?column/i, w: 2 },
    { p: /\brefactor/i, w: 2 },
    // Standalone variant/structure patterns
    { p: /\bvariant\b/i, w: 2 },
    { p: /\bpage structure/i, w: 2 },
    { p: /\bsection metadata/i, w: 3 },
    { p: /\bfulfillment/i, w: 2 },
    { p: /\bdropdown\b/i, w: 2 },
    { p: /\bpanel\b/i, w: 1 },
    { p: /\bdrop.?down/i, w: 2 },
    { p: /\bbehavior\b/i, w: 1 },
    { p: /\bclick\b/i, w: 1 },
    { p: /\bmouse over/i, w: 1 },
    { p: /\bhover.*behav/i, w: 2 },
  ],
  'Style Work': [
    { p: /\bdesign system/i, w: 3 },
    { p: /\bdesign token/i, w: 3 },
    { p: /\btypography/i, w: 2 },
    { p: /\bbreakpoint/i, w: 2 },
    { p: /\bgradient/i, w: 2 },
    { p: /\bhover/i, w: 2 },
    { p: /\bunderline/i, w: 2 },
    { p: /\bfont.?weight/i, w: 2 },
    { p: /\bfont.?size/i, w: 2 },
    { p: /\bopacity/i, w: 2 },
    { p: /\btransparent/i, w: 1 },
    { p: /\bopaque/i, w: 2 },
    { p: /\bborder.?radius/i, w: 2 },
    { p: /\brounded/i, w: 2 },
    { p: /\bCTA button/i, w: 1 },
    { p: /styles\.css/i, w: 1 },
    { p: /fonts\.css/i, w: 2 },
    { p: /\bmax.?width/i, w: 1 },
    { p: /\bside.?by.?side/i, w: 2 },
    { p: /\bdivider/i, w: 1 },
    { p: /\bCSS\b/, w: 1 },
    { p: /\bcolor\b/i, w: 1 },
    { p: /\bfont\b/i, w: 1 },
    { p: /\bpadding/i, w: 1 },
    { p: /\bmargin/i, w: 1 },
    { p: /\bborder\b/i, w: 1 },
    { p: /\bbackground/i, w: 1 },
    { p: /\balign/i, w: 1 },
    { p: /\bwidth\b/i, w: 1 },
    { p: /\bgap\b/i, w: 1 },
    { p: /\bspacing/i, w: 1 },
    { p: /\blayout/i, w: 1 },
    // Sizing and dimensions (catches "16x16", "220px", "make smaller")
    { p: /\bheight\b/i, w: 1 },
    { p: /\bsize\b/i, w: 1 },
    { p: /\bsmaller\b/i, w: 2 },
    { p: /\bbigger\b/i, w: 2 },
    { p: /\b\d+x\d+\b/, w: 2 },
    { p: /\b\d+px\b/, w: 1 },
    { p: /\bobject.?fit/i, w: 2 },
    { p: /\boverlap/i, w: 1 },
    { p: /\bcrop/i, w: 1 },
    { p: /\bflush\b/i, w: 1 },
    { p: /\binside\b/i, w: 1 },
    { p: /\boutside\b/i, w: 1 },
    { p: /\bregular\b/i, w: 1 },
    { p: /\bbold\b/i, w: 1 },
    { p: /\bline\b/i, w: 1 },
    { p: /\bdimension/i, w: 2 },
    { p: /\breduce\b/i, w: 1 },
    { p: /\bincrease\b/i, w: 1 },
    { p: /\badjust/i, w: 1 },
    { p: /\bdark(er)?\b/i, w: 1 },
    { p: /\blighter\b/i, w: 1 },
    { p: /\bbanner\b/i, w: 1 },
  ],
};

const CATEGORY_ORDER = [
  'Review/Admin', 'Config', 'Debugging', 'Validation', 'Image Work',
  'Content', 'Block Work', 'Style Work', 'Other',
];

// --- Rework detection ---
const REWORK_PATTERNS = [
  /\bstill not/i, /\bnot working/i, /\bstill fails/i,
  /\bnot.*appear/i, /\bmissing\b/i, /\bbroken\b/i,
  /\bafter the last change/i, /\bprevious.*commit/i,
  /\bpreview site shows/i, /\bnot making it to/i,
  /\bneeds more refining/i, /\bvariance/i,
  /\bnot.*correct.*live/i, /\bdoes not appear correct/i,
  /\bstill see/i, /\bi still/i, /\bstill.*same/i,
];

function isRework(exchange) {
  return REWORK_PATTERNS.some((p) => p.test(exchange.content));
}

// --- Rollback detection ---
const ROLLBACK_PATTERNS = [
  /\brollback\b/i, /\brevert\b/i, /\bundo\b/i, /\bgo back\b/i,
];

function isRollback(exchange) {
  return ROLLBACK_PATTERNS.some((p) => p.test(exchange.content));
}

// --- Rapid-fire detection (same property tweaked multiple times) ---
const RAPID_FIRE_PATTERNS = [
  { re: /\bfont.?weight\b/i, label: 'font-weight' },
  { re: /\bfont.?size\b/i, label: 'font-size' },
  { re: /\bpadding/i, label: 'padding' },
  { re: /\bheight\b/i, label: 'height' },
  { re: /\bwidth\b/i, label: 'width' },
  { re: /\bcolor\b/i, label: 'color' },
  { re: /\bmargin/i, label: 'margin' },
  { re: /\bborder/i, label: 'border' },
  { re: /\bmax.?width/i, label: 'max-width' },
  { re: /\bimage.*size/i, label: 'image size' },
  { re: /\bicon.*size/i, label: 'icon size' },
  { re: /\bbadge/i, label: 'badge' },
];

function detectRapidFire(exchanges) {
  const streaks = [];
  let i = 0;
  while (i < exchanges.length) {
    const ex = exchanges[i];
    const text = ex.content;
    for (const { re, label } of RAPID_FIRE_PATTERNS) {
      if (re.test(text)) {
        // Count consecutive exchanges touching the same property
        let count = 1;
        let totalMs = ex.agentTimeMs;
        let j = i + 1;
        while (j < exchanges.length) {
          const nextText = exchanges[j].content;
          // Check if next exchange touches same property or is a rollback
          if (re.test(nextText) || isRollback(exchanges[j])) {
            count += 1;
            totalMs += exchanges[j].agentTimeMs;
            j += 1;
          } else {
            break;
          }
        }
        if (count >= 3) {
          streaks.push({ property: label, count, totalMs, startIdx: i });
        }
        break; // only match first property per exchange
      }
    }
    i += 1;
  }
  return streaks;
}

// --- Tie-breaking signals ---
// When the user message (not the full exchange) contains these,
// it's a CSS sizing task even if "icon"/"image" triggered Image Work.
const SIZING_SIGNALS = [
  /\b\d+x\d+\b/, /\b\d+px\b/, /\bsmaller\b/i, /\bbigger\b/i,
  /\bsize\b/i, /\bheight\b/i, /\bwidth\b/i, /\bdimension/i,
  /\breduce\b/i, /\bincrease\b/i, /\badjust/i, /\bregular\b/i,
  /\bbold\b/i, /\bdarker\b/i, /\blighter\b/i,
];
const STYLE_INTENT_SIGNALS = [
  /\bpadding/i, /\bmargin/i, /\bfont/i, /\bcolor\b/i,
  /\bborder/i, /\bbackground/i, /\balign/i, /\bspacing/i,
  /\bgap\b/i, /\bheight\b/i, /\bwidth\b/i, /\blayout/i,
  /\bobject.?fit/i, /\bcrop/i, /\boverlap/i,
];

function hasSizingContext(userText) {
  return SIZING_SIGNALS.some((p) => p.test(userText));
}

function hasStyleIntentContext(userText) {
  return STYLE_INTENT_SIGNALS.some((p) => p.test(userText));
}

// --- Classification ---
function classifyExchange(exchange) {
  const text = exchange.allContent;
  const userText = exchange.content; // user message only, for intent signals
  const scores = {};
  for (const [cat, patterns] of Object.entries(CATEGORIES)) {
    let total = 0;
    for (const { p, w } of patterns) {
      if (p.test(text)) total += w;
    }
    scores[cat] = total;
  }

  // Tie-break: Image Work vs Style Work
  // If both score and user message has sizing/dimension language, boost Style Work
  if (scores['Image Work'] > 0 && scores['Style Work'] > 0 && hasSizingContext(userText)) {
    scores['Style Work'] += 3;
  }

  // Tie-break: Debugging vs Style Work
  // If both score and user describes a style symptom (not a functional bug), prefer Style Work
  if (scores['Debugging'] > 0 && scores['Style Work'] > 0 && hasStyleIntentContext(userText)) {
    scores['Style Work'] += 2;
  }

  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]);
  });
  const winner = sorted[0][1] > 0 ? sorted[0][0] : 'Other';
  return { category: winner, scores };
}

// --- Helpers ---
function extractSummary(exchange) {
  const raw = exchange.content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  return raw.length > 120 ? `${raw.slice(0, 117)}...` : raw;
}

function formatDuration(ms) {
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function formatTimestamp(date) {
  return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

// --- Analysis ---
function analyzeExchanges(exchanges) {
  const results = {};
  const idleGaps = [];
  const reworkExchanges = [];
  const rollbackExchanges = [];
  let prevEnd = null;
  let idleTotal = 0;

  for (const ex of exchanges) {
    if (prevEnd) {
      const gapMs = ex.userTime - prevEnd;
      if (gapMs > IDLE_THRESHOLD_MS) {
        idleGaps.push({ fromTime: prevEnd, toTime: ex.userTime, durationMs: gapMs });
        idleTotal += gapMs;
      }
    }

    const agentTimeMs = ex.lastAssistantTime - ex.userTime;
    const { category, scores } = classifyExchange(ex);
    const rework = isRework(ex);
    const rollback = isRollback(ex);

    ex.classification = category;
    ex.classificationScores = scores;
    ex.agentTimeMs = agentTimeMs;
    ex.rework = rework;
    ex.rollback = rollback;
    ex.project = detectProject(ex);

    if (rework) reworkExchanges.push(ex);
    if (rollback) rollbackExchanges.push(ex);

    if (!results[category]) {
      results[category] = { exchanges: 0, agentTimeMs: 0, bufferMs: 0, reworkCount: 0, reworkMs: 0 };
    }
    results[category].exchanges += 1;
    results[category].agentTimeMs += agentTimeMs;
    results[category].bufferMs += BUFFER_PER_EXCHANGE_MS;
    if (rework) {
      results[category].reworkCount += 1;
      results[category].reworkMs += agentTimeMs;
    }

    prevEnd = ex.lastAssistantTime;
  }

  let wallClockMs = 0;
  if (exchanges.length > 0) {
    wallClockMs = exchanges[exchanges.length - 1].lastAssistantTime - exchanges[0].userTime;
  }

  return { results, idleGaps, idleTotal, reworkExchanges, rollbackExchanges, wallClockMs };
}

// --- Table output ---
function printTable(results, label) {
  if (label) { console.log(''); console.log(`### ${label}`); }
  console.log('');
  console.log('| Task Category | Exchanges | Agent Time | + Buffer | Total | Rework |');
  console.log('|---------------|-----------|------------|----------|-------|--------|');

  const totals = { exchanges: 0, agent: 0, buffer: 0, reworkCount: 0, reworkMs: 0 };
  const sortedCats = Object.entries(results).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a[0]);
    const bi = CATEGORY_ORDER.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const [cat, d] of sortedCats) {
    const total = d.agentTimeMs + d.bufferMs;
    const rw = d.reworkCount > 0 ? `${d.reworkCount} (${formatDuration(d.reworkMs)})` : '-';
    console.log(
      `| ${cat.padEnd(13)} | ${String(d.exchanges).padStart(9)} | ${formatDuration(d.agentTimeMs).padStart(10)} | ${formatDuration(d.bufferMs).padStart(8)} | ${formatDuration(total).padStart(5)} | ${rw.padStart(6)} |`,
    );
    totals.exchanges += d.exchanges;
    totals.agent += d.agentTimeMs;
    totals.buffer += d.bufferMs;
    totals.reworkCount += d.reworkCount;
    totals.reworkMs += d.reworkMs;
  }

  const rwTotal = totals.reworkCount > 0 ? `${totals.reworkCount} (${formatDuration(totals.reworkMs)})` : '-';
  console.log(
    `| **Total**     | ${String(totals.exchanges).padStart(9)} | ${formatDuration(totals.agent).padStart(10)} | ${formatDuration(totals.buffer).padStart(8)} | ${formatDuration(totals.agent + totals.buffer).padStart(5)} | ${rwTotal.padStart(6)} |`,
  );
  return totals;
}

function printTimeComparison(totals, idleTotal, wallClockMs) {
  const activeMs = totals.agent + totals.buffer;
  console.log('');
  console.log('## Time Comparison');
  console.log('');
  console.log('| Measure | Time | Notes |');
  console.log('|---------|------|-------|');
  console.log(`| Active time (agent + buffer) | ${formatDuration(activeMs).padStart(8)} | Idle gaps excluded |`);
  console.log(`| Idle time | ${formatDuration(idleTotal).padStart(8)} | Gaps > ${IDLE_THRESHOLD_MS / 60_000} min between exchanges |`);
  console.log(`| Active + idle | ${formatDuration(activeMs + idleTotal).padStart(8)} | Total including breaks |`);
  console.log(`| Wall clock (first to last msg) | ${formatDuration(wallClockMs).padStart(8)} | Calendar time span of session |`);
  console.log(`| Utilization | ${activeMs > 0 && wallClockMs > 0 ? `${Math.round((activeMs / wallClockMs) * 100)}%` : 'N/A'} | Active time / wall clock |`);
}

// --- Efficiency Suggestions (auto-generated from data with savings estimates) ---
// Each suggestion calculates savingsMs from actual data:
//   - Rework: 75% of rework time is avoidable with pre-flight checks
//   - Rollbacks: 100% of rollback time (each rollback = wasted round-trip)
//   - Rapid-fire: for N tweaks, batching into 1 saves (N-1) exchanges worth of buffer + overhead
//   - Admin overhead: combining "change + stage" saves ~50% of admin exchanges
//   - Debugging: 50% avoidable with live-site verification and EDS gotcha awareness
//   - Style batching: batching 3 per prompt saves 2/3 of buffer overhead
//   - Mid-session breaks: no direct time savings, but better tracking (0ms)
//   - Live mismatch: 75% avoidable with dual-environment testing
function generateSuggestions(allExchanges, results, reworkExchanges, rollbackExchanges, idleGaps) {
  const suggestions = [];
  const totalExchanges = allExchanges.length;
  const totalActiveMs = allExchanges.reduce((s, e) => s + e.agentTimeMs, 0);
  const totalWithBuffer = totalActiveMs + (totalExchanges * BUFFER_PER_EXCHANGE_MS);

  // 1. Rework ratio — 75% avoidable
  if (reworkExchanges.length > 0) {
    const reworkMs = reworkExchanges.reduce((s, e) => s + e.agentTimeMs, 0);
    const reworkBufferMs = reworkExchanges.length * BUFFER_PER_EXCHANGE_MS;
    const savingsMs = Math.round((reworkMs + reworkBufferMs) * 0.75);
    const pct = Math.round((reworkMs / totalActiveMs) * 100);
    const categories = [...new Set(reworkExchanges.map((e) => e.classification))].join(', ');
    suggestions.push({
      severity: pct > 15 ? 'high' : 'medium',
      title: `${reworkExchanges.length} rework exchanges (${formatDuration(reworkMs)}, ${pct}% of agent time)`,
      detail: `Exchanges where something previously completed needed re-investigation. Categories: ${categories}.`,
      action: 'Verify on live/preview environments before marking work complete. Maintain a pre-flight checklist for known platform behaviors.',
      savingsMs,
      savingsNote: '75% of rework time avoidable with pre-flight checks',
    });
  }

  // 2. Rollbacks — 100% wasted
  if (rollbackExchanges.length >= 2) {
    const rollbackMs = rollbackExchanges.reduce((s, e) => s + e.agentTimeMs, 0);
    const rollbackBufferMs = rollbackExchanges.length * BUFFER_PER_EXCHANGE_MS;
    const savingsMs = rollbackMs + rollbackBufferMs;
    suggestions.push({
      severity: 'medium',
      title: `${rollbackExchanges.length} rollback exchanges (${formatDuration(rollbackMs)})`,
      detail: 'Changes were applied then reverted — each rollback is a wasted round-trip.',
      action: 'Provide exact values upfront (e.g., "set padding to 8px" not "add some padding"). Use DevTools to experiment before requesting changes.',
      savingsMs,
      savingsNote: '100% of rollback time is recoverable',
    });
  }

  // 3. Rapid-fire property tweaks — batching N into 1 saves (N-1) buffer + 50% agent time
  const rapidFire = detectRapidFire(allExchanges);
  if (rapidFire.length > 0) {
    const totalTweakMs = rapidFire.reduce((s, r) => s + r.totalMs, 0);
    const totalTweakCount = rapidFire.reduce((s, r) => s + r.count, 0);
    const savedExchanges = totalTweakCount - rapidFire.length; // each streak batched to 1
    const savingsMs = (savedExchanges * BUFFER_PER_EXCHANGE_MS) + Math.round(totalTweakMs * 0.5);
    const props = rapidFire.map((r) => `${r.property} (${r.count}x, ${formatDuration(r.totalMs)})`).join(', ');
    suggestions.push({
      severity: 'high',
      title: `Rapid-fire CSS tweaking: ${props}`,
      detail: `Same properties adjusted ${totalTweakCount} times in ${rapidFire.length} streak(s), totaling ${formatDuration(totalTweakMs)}.`,
      action: 'Batch related style changes in one request with exact values. Use DevTools to find the right value first, then provide it in a single prompt.',
      savingsMs,
      savingsNote: `Batching ${totalTweakCount} tweaks into ${rapidFire.length} saves ${savedExchanges} round-trips`,
    });
  }

  // 4. High Review/Admin ratio — 50% of admin exchanges could be combined with work exchanges
  const adminData = results['Review/Admin'];
  if (adminData && adminData.exchanges > 0) {
    const adminPct = Math.round((adminData.exchanges / totalExchanges) * 100);
    if (adminPct > 15) {
      const savingsMs = Math.round((adminData.agentTimeMs + adminData.bufferMs) * 0.5);
      suggestions.push({
        severity: adminPct > 25 ? 'medium' : 'low',
        title: `${adminPct}% of exchanges are Review/Admin (${adminData.exchanges} of ${totalExchanges})`,
        detail: `${formatDuration(adminData.agentTimeMs + adminData.bufferMs)} spent on staging, reviewing, summarizing, and confirming.`,
        action: 'Combine "make the change" and "stage it" into one request. Skip explicit review asks when you can verify visually.',
        savingsMs,
        savingsNote: '50% of admin overhead saved by combining with work requests',
      });
    }
  }

  // 5. Debugging time ratio — 50% avoidable with proactive testing
  const debugData = results['Debugging'];
  if (debugData && debugData.agentTimeMs > 0) {
    const debugPct = Math.round((debugData.agentTimeMs / totalActiveMs) * 100);
    if (debugPct > 10) {
      const savingsMs = Math.round((debugData.agentTimeMs + debugData.bufferMs) * 0.5);
      suggestions.push({
        severity: debugPct > 20 ? 'high' : 'medium',
        title: `${debugPct}% of agent time spent debugging (${formatDuration(debugData.agentTimeMs)})`,
        detail: `${debugData.exchanges} exchanges investigating broken behavior instead of building.`,
        action: 'Test on live/AEM preview after each change, not just locally. Anticipate known EDS gotchas (class stripping, p-tag wrapping, section breaks).',
        savingsMs,
        savingsNote: '50% of debug time avoidable with live-environment testing and EDS awareness',
      });
    }
  }

  // 6. Style Work dominance — batching 3 per prompt saves 2/3 of buffer overhead
  const styleData = results['Style Work'];
  if (styleData && styleData.exchanges > 0) {
    const stylePct = Math.round((styleData.exchanges / totalExchanges) * 100);
    if (stylePct > 30) {
      const batchableExchanges = Math.round(styleData.exchanges * (2 / 3)); // 2/3 could be batched away
      const savingsMs = batchableExchanges * BUFFER_PER_EXCHANGE_MS; // buffer savings from fewer round-trips
      suggestions.push({
        severity: stylePct > 40 ? 'high' : 'medium',
        title: `Style Work is ${stylePct}% of exchanges (${styleData.exchanges} of ${totalExchanges})`,
        detail: `Many exchanges are individual CSS adjustments. Batching 3 per prompt would reduce ${styleData.exchanges} exchanges to ~${Math.ceil(styleData.exchanges / 3)}.`,
        action: 'Batch 3-5 CSS adjustments per prompt. Extract exact values from the source DOM inspector before requesting changes.',
        savingsMs,
        savingsNote: `${batchableExchanges} fewer round-trips by batching style changes`,
      });
    }
  }

  // 7. Mid-session breaks — no direct time savings, but better session management
  const longUserGaps = idleGaps.filter((g) => g.durationMs > 15 * 60_000 && g.durationMs < 2 * 60 * 60_000);
  if (longUserGaps.length >= 3) {
    suggestions.push({
      severity: 'low',
      title: `${longUserGaps.length} mid-session breaks of 15-120 min detected`,
      detail: 'Frequent mid-session breaks may indicate reviewing changes takes time or context switching.',
      action: 'Use topic markers ("Starting: header styling") for cleaner tracking. Provide screenshots with requests to reduce back-and-forth.',
      savingsMs: 0,
      savingsNote: 'No direct time savings — improves tracking and session flow',
    });
  }

  // 8. Local vs live mismatch — 75% avoidable with dual-environment testing
  const liveDebugPatterns = [/\blive.*page/i, /\baem.*page/i, /\bpreview.*site/i, /\bnot.*aem/i];
  const liveDebugExchanges = allExchanges.filter((ex) => liveDebugPatterns.some((p) => p.test(ex.content)));
  if (liveDebugExchanges.length >= 2) {
    const liveDebugMs = liveDebugExchanges.reduce((s, e) => s + e.agentTimeMs, 0);
    const liveBufferMs = liveDebugExchanges.length * BUFFER_PER_EXCHANGE_MS;
    const savingsMs = Math.round((liveDebugMs + liveBufferMs) * 0.75);
    suggestions.push({
      severity: 'high',
      title: `${liveDebugExchanges.length} exchanges reference live/AEM page issues (${formatDuration(liveDebugMs)})`,
      detail: 'Work passed local preview but failed on the deployed site, requiring additional debugging cycles.',
      action: 'Verify changes on both local preview AND the AEM page URL before signing off.',
      savingsMs,
      savingsNote: '75% avoidable with dual-environment verification',
    });
  }

  return suggestions;
}

// --- Session chunking ---
// Splits exchanges into sessions based on gaps > SESSION_BREAK_MS.
// Each session gets a self-contained summary for independent analysis.
function splitIntoSessions(exchanges) {
  if (exchanges.length === 0) return [];
  const sessions = [];
  let currentSession = [exchanges[0]];

  for (let i = 1; i < exchanges.length; i++) {
    const gap = exchanges[i].userTime - exchanges[i - 1].lastAssistantTime;
    if (gap > SESSION_BREAK_MS) {
      sessions.push(currentSession);
      currentSession = [];
    }
    currentSession.push(exchanges[i]);
  }
  if (currentSession.length > 0) sessions.push(currentSession);
  return sessions;
}

function extractTopTopics(exchanges, maxTopics = 5) {
  // Count category occurrences and find the most common user-message keywords
  const catCounts = {};
  const keywords = {};
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'it', 'to', 'of', 'and', 'in', 'on', 'for',
    'can', 'you', 'please', 'i', 'we', 'from', 'as', 'be', 'with', 'this',
    'that', 'are', 'not', 'have', 'do', 'its', 'at', 'or', 'my', 'me',
    'see', 'also', 'per', 'all', 'make', 'review', 'below', 'above',
  ]);

  for (const ex of exchanges) {
    catCounts[ex.classification] = (catCounts[ex.classification] || 0) + 1;
    // Extract meaningful words from user messages
    const words = ex.content
      .replace(/[^a-zA-Z\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    for (const w of words) {
      keywords[w] = (keywords[w] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopics)
    .map(([w]) => w);

  return { catCounts, topKeywords };
}

function generateSessionSummary(session, sessionIdx, totalSessions) {
  const first = session[0];
  const last = session[session.length - 1];
  const analysis = analyzeExchanges(session);
  const activeMs = session.reduce((s, e) => s + e.agentTimeMs, 0) + (session.length * BUFFER_PER_EXCHANGE_MS);
  const { catCounts, topKeywords } = extractTopTopics(session);
  const reworkCount = session.filter((e) => e.rework).length;
  const rollbackCount = session.filter((e) => e.rollback).length;

  const dateStr = first.userTime.toISOString().split('T')[0];
  const startTime = formatTimestamp(first.userTime);
  const endTime = formatTimestamp(last.lastAssistantTime);

  const lines = [];
  lines.push(`## Session ${sessionIdx + 1} of ${totalSessions} — ${dateStr}`);
  lines.push('');
  lines.push(`**Time:** ${startTime} to ${endTime}`);
  lines.push(`**Exchanges:** ${session.length} | **Active time:** ${formatDuration(activeMs)} | **Rework:** ${reworkCount} | **Rollbacks:** ${rollbackCount}`);
  lines.push('');

  // Category breakdown as inline list
  const catList = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `${cat} (${count})`)
    .join(', ');
  lines.push(`**Categories:** ${catList}`);
  lines.push('');

  // Top topics
  if (topKeywords.length > 0) {
    lines.push(`**Key topics:** ${topKeywords.join(', ')}`);
    lines.push('');
  }

  // Mini exchange list (first 120 chars of each user message)
  lines.push('### Exchange log');
  lines.push('');
  for (let i = 0; i < session.length; i++) {
    const ex = session[i];
    const tags = [ex.rework ? 'REWORK' : '', ex.rollback ? 'ROLLBACK' : ''].filter(Boolean);
    const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
    lines.push(`${i + 1}. **[${ex.classification}]** ${formatDuration(ex.agentTimeMs)} — ${extractSummary(ex)}${tagStr}`);
  }
  lines.push('');

  return lines.join('\n');
}

function writeChunks(sessions, outputDir, inputFile) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const inputBase = basename(inputFile, '.md');
  const indexLines = [];
  indexLines.push(`# Session Index — ${inputBase}`);
  indexLines.push('');
  indexLines.push(`Source: ${inputFile}`);
  indexLines.push(`Total sessions: ${sessions.length}`);
  indexLines.push(`Total exchanges: ${sessions.reduce((s, sess) => s + sess.length, 0)}`);
  indexLines.push('');
  indexLines.push('| # | Date | Exchanges | Active Time | Categories | File |');
  indexLines.push('|---|------|-----------|-------------|------------|------|');

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const dateStr = session[0].userTime.toISOString().split('T')[0];
    const activeMs = session.reduce((s, e) => s + e.agentTimeMs, 0) + (session.length * BUFFER_PER_EXCHANGE_MS);
    const { catCounts } = extractTopTopics(session);
    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c)
      .join(', ');
    const chunkFile = `session-${String(i + 1).padStart(2, '0')}-${dateStr}.md`;
    const chunkPath = join(outputDir, chunkFile);

    // Write individual session file
    const content = generateSessionSummary(session, i, sessions.length);
    writeFileSync(chunkPath, content, 'utf-8');

    indexLines.push(`| ${i + 1} | ${dateStr} | ${session.length} | ${formatDuration(activeMs)} | ${topCats} | [${chunkFile}](${chunkFile}) |`);
  }

  indexLines.push('');
  indexLines.push('---');
  indexLines.push(`Generated by chat-time-tracker.mjs on ${new Date().toISOString().split('T')[0]}`);

  const indexPath = join(outputDir, 'index.md');
  writeFileSync(indexPath, indexLines.join('\n'), 'utf-8');

  return indexPath;
}

// ==================== Main ====================
const fileExchanges = {};
let allExchanges = [];
let totalFileBytes = 0;

for (const file of files) {
  const md = readFileSync(file, 'utf-8');
  totalFileBytes += Buffer.byteLength(md, 'utf-8');
  const messages = parseMessages(md);
  const exchanges = groupExchanges(messages, basename(file));
  fileExchanges[basename(file)] = exchanges;
  allExchanges.push(...exchanges);
}

allExchanges.sort((a, b) => a.userTime - b.userTime);

const { results, idleGaps, idleTotal, reworkExchanges, rollbackExchanges, wallClockMs } = analyzeExchanges(allExchanges);

// --- Auto-detect "too large" and recommend/trigger chunking ---
const sessions = splitIntoSessions(allExchanges);
const isLargeFile = totalFileBytes > LARGE_FILE_BYTES;
const isLargeExchanges = allExchanges.length > LARGE_EXCHANGE_COUNT;
const isLargeSessions = sessions.length > LARGE_SESSION_COUNT;
const isLarge = isLargeFile || isLargeExchanges || isLargeSessions;
const shouldChunk = chunk || chunkDir || false;

if (isLarge && !shouldChunk) {
  console.log('');
  console.log('## Notice: Large Chat Detected');
  console.log('');
  const reasons = [];
  if (isLargeFile) reasons.push(`File size: ${Math.round(totalFileBytes / 1024)}KB (threshold: ${LARGE_FILE_BYTES / 1024}KB)`);
  if (isLargeExchanges) reasons.push(`Exchanges: ${allExchanges.length} (threshold: ${LARGE_EXCHANGE_COUNT})`);
  if (isLargeSessions) reasons.push(`Sessions: ${sessions.length} (threshold: ${LARGE_SESSION_COUNT})`);
  console.log(`This chat exceeds the recommended size for single-pass analysis:`);
  for (const r of reasons) console.log(`  - ${r}`);
  console.log('');
  console.log('**Recommendation:** Re-run with `--chunk` or `--chunk-dir <dir>` to split into sessions.');
  console.log('This produces per-session summaries that can be fed to an AI one at a time without');
  console.log('context overflow or losing early details to compression.');
  console.log('');
  console.log('```bash');
  console.log(`node chat-time-tracker.mjs --chunk-dir ./sessions ${files.join(' ')}`);
  console.log('```');
  console.log('');
}

// --- Verbose ---
if (verbose) {
  console.log('');
  console.log('## Per-Exchange Detail');
  console.log('');
  for (let i = 0; i < allExchanges.length; i++) {
    const ex = allExchanges[i];
    const tags = [
      ex.rework ? '[REWORK]' : '',
      ex.rollback ? '[ROLLBACK]' : '',
      byProject ? `(${ex.project})` : '',
    ].filter(Boolean).join(' ');
    const topScores = Object.entries(ex.classificationScores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, s]) => `${cat}=${s}`)
      .join(', ');
    console.log(
      `  ${String(i + 1).padStart(3)}. [${ex.classification}] ${formatDuration(ex.agentTimeMs).padStart(7)} | ${formatTimestamp(ex.userTime)} | ${ex.sourceFile} ${tags}`,
    );
    console.log(`       ${extractSummary(ex)}`);
    console.log(`       Scores: ${topScores || '(none matched -> Other)'}`);
    console.log('');
  }
}

// --- Main summary ---
console.log('## Summary (all files combined)');
const totals = printTable(results);
printTimeComparison(totals, idleTotal, wallClockMs);

// --- Per-file ---
if (perFile) {
  console.log('');
  console.log('## Per-File Breakdown');
  for (const [fname, exchanges] of Object.entries(fileExchanges)) {
    const sorted = [...exchanges].sort((a, b) => a.userTime - b.userTime);
    const fileAnalysis = analyzeExchanges(sorted);
    const fileTotals = printTable(fileAnalysis.results, fname);
    if (fileAnalysis.idleGaps.length > 0) {
      const fileActive = fileTotals.agent + fileTotals.buffer;
      console.log(`  Active: ${formatDuration(fileActive)} | Idle: ${formatDuration(fileAnalysis.idleTotal)} | Wall: ${formatDuration(fileAnalysis.wallClockMs)}`);
    }
  }
}

// --- Per-project ---
if (byProject) {
  console.log('');
  console.log('## Per-Project Breakdown');
  const projectMap = {};
  for (const ex of allExchanges) {
    if (!projectMap[ex.project]) projectMap[ex.project] = [];
    projectMap[ex.project].push(ex);
  }
  for (const [proj, exchanges] of Object.entries(projectMap)) {
    const sorted = [...exchanges].sort((a, b) => a.userTime - b.userTime);
    const projAnalysis = analyzeExchanges(sorted);
    const projTotals = printTable(projAnalysis.results, proj);
    const projActive = projTotals.agent + projTotals.buffer;
    console.log(`  Active: ${formatDuration(projActive)} | Idle: ${formatDuration(projAnalysis.idleTotal)} | Wall: ${formatDuration(projAnalysis.wallClockMs)} | Rework: ${projTotals.reworkCount > 0 ? `${projTotals.reworkCount} (${formatDuration(projTotals.reworkMs)})` : 'none'}`);
  }
}

// --- Idle gaps ---
console.log('');
console.log('## Idle Gaps');
console.log('');
if (idleGaps.length === 0) {
  console.log('No idle gaps detected.');
} else {
  console.log(`Found ${idleGaps.length} idle gap(s) totaling ${formatDuration(idleTotal)} (threshold: >${IDLE_THRESHOLD_MS / 60_000} min)`);
  console.log('');
  console.log('| # | From | To | Duration | Type |');
  console.log('|---|------|-----|----------|------|');
  for (let i = 0; i < idleGaps.length; i++) {
    const gap = idleGaps[i];
    let gapType = 'Short break';
    if (gap.durationMs > 8 * 60 * 60_000) gapType = 'Overnight / next day';
    else if (gap.durationMs > 2 * 60 * 60_000) gapType = 'Long break';
    else if (gap.durationMs > 30 * 60_000) gapType = 'Session break';
    console.log(
      `| ${i + 1} | ${formatTimestamp(gap.fromTime)} | ${formatTimestamp(gap.toTime)} | ${formatDuration(gap.durationMs).padStart(8)} | ${gapType} |`,
    );
  }
}

// --- Rework report ---
if (reworkExchanges.length > 0) {
  const reworkTotalMs = reworkExchanges.reduce((sum, ex) => sum + ex.agentTimeMs, 0);
  console.log('');
  console.log('## Rework Exchanges');
  console.log('');
  console.log(`Found ${reworkExchanges.length} exchange(s) flagged as rework, totaling ${formatDuration(reworkTotalMs)} agent time.`);
  console.log('');
  for (const ex of reworkExchanges) {
    const projectTag = byProject ? ` (${ex.project})` : '';
    console.log(`  - [${ex.classification}] ${formatDuration(ex.agentTimeMs)} | ${formatTimestamp(ex.userTime)}${projectTag}`);
    console.log(`    ${extractSummary(ex)}`);
    console.log('');
  }
}

// --- Efficiency Suggestions + Impact ---
const suggestions = generateSuggestions(allExchanges, results, reworkExchanges, rollbackExchanges, idleGaps);
if (suggestions.length > 0) {
  const totalActiveMs = totals.agent + totals.buffer;
  const totalSavingsMs = suggestions.reduce((s, sg) => s + sg.savingsMs, 0);
  const projectedMs = totalActiveMs - totalSavingsMs;
  const efficiencyGainPct = totalActiveMs > 0 ? Math.round((totalSavingsMs / totalActiveMs) * 100) : 0;

  console.log('');
  console.log('## Efficiency Impact');
  console.log('');
  console.log('| Metric | Value |');
  console.log('|--------|-------|');
  console.log(`| Current active time | ${formatDuration(totalActiveMs)} |`);
  console.log(`| Potential savings | ${formatDuration(totalSavingsMs)} |`);
  console.log(`| Projected active time | ${formatDuration(projectedMs)} |`);
  console.log(`| **Efficiency gain** | **${efficiencyGainPct}%** |`);
  console.log('');
  console.log('### Savings Breakdown');
  console.log('');
  console.log('| # | Suggestion | Savings | How Calculated |');
  console.log('|---|-----------|---------|----------------|');
  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i];
    const icon = s.severity === 'high' ? '!!!' : s.severity === 'medium' ? '!!' : '!';
    console.log(`| ${i + 1} | [${icon}] ${s.title.slice(0, 60)}${s.title.length > 60 ? '...' : ''} | ${formatDuration(s.savingsMs)} | ${s.savingsNote} |`);
  }
  console.log(`| | **Total potential savings** | **${formatDuration(totalSavingsMs)}** | **${efficiencyGainPct}% of ${formatDuration(totalActiveMs)} active time** |`);

  console.log('');
  console.log('### Suggestion Details');
  console.log('');
  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i];
    const icon = s.severity === 'high' ? '!!!' : s.severity === 'medium' ? '!!' : '!';
    const savingsPct = totalActiveMs > 0 ? Math.round((s.savingsMs / totalActiveMs) * 100) : 0;
    console.log(`#### ${i + 1}. [${icon}] ${s.title}`);
    console.log('');
    console.log(`**Potential savings:** ${formatDuration(s.savingsMs)} (${savingsPct}% of active time)`);
    console.log('');
    console.log(`**Pattern:** ${s.detail}`);
    console.log('');
    console.log(`**Suggestion:** ${s.action}`);
    console.log('');
    console.log(`*Savings basis: ${s.savingsNote}*`);
    console.log('');
  }
}

// --- Session Chunks ---
// sessions, shouldChunk, and isLarge are already computed above
if (shouldChunk) {
  console.log('');
  console.log('## Session Chunks');
  console.log('');
  console.log(`Chat split into **${sessions.length} sessions** (gap threshold: >${SESSION_BREAK_MS / 3_600_000}h)`);
  console.log('');

  if (chunkDir) {
    const indexPath = writeChunks(sessions, chunkDir, files[0] || 'input');
    console.log(`Session files written to: ${chunkDir}/`);
    console.log(`Index file: ${indexPath}`);
    console.log('');
    console.log('To analyze a single session, feed one file to the AI:');
    console.log(`  e.g., "Read ${chunkDir}/session-01-2026-03-25.md and analyze the work done"`);
    console.log('');
  }

  // Always print the inline session index
  console.log('| # | Date | Exchanges | Active Time | Top Categories | Rework | Rollbacks |');
  console.log('|---|------|-----------|-------------|----------------|--------|-----------|');
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const dateStr = session[0].userTime.toISOString().split('T')[0];
    const activeMs = session.reduce((s, e) => s + e.agentTimeMs, 0) + (session.length * BUFFER_PER_EXCHANGE_MS);
    const { catCounts } = extractTopTopics(session);
    const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${c}(${n})`).join(', ');
    const rw = session.filter((e) => e.rework).length;
    const rb = session.filter((e) => e.rollback).length;
    console.log(`| ${i + 1} | ${dateStr} | ${session.length} | ${formatDuration(activeMs)} | ${topCats} | ${rw || '-'} | ${rb || '-'} |`);
  }

  // Print each session summary inline when not writing to files
  if (!chunkDir) {
    console.log('');
    for (let i = 0; i < sessions.length; i++) {
      console.log(generateSessionSummary(sessions[i], i, sessions.length));
    }
  }
}

// --- Footer ---
console.log('');
console.log('---');
console.log(`Config: buffer=${BUFFER_PER_EXCHANGE_MS / 60_000}min/exchange | idle=${IDLE_THRESHOLD_MS / 60_000}min | session-break=${SESSION_BREAK_MS / 3_600_000}h`);
console.log(`Categories: ${CATEGORY_ORDER.join(', ')}`);
console.log(`Files: ${files.join(', ')}`);
