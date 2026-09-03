#!/usr/bin/env node
// Renders the static site from content/ into committed HTML.
// No dependencies. Run with: npm run build
//
// index.html and support.html are generated for all 16 locales.
// privacy.html and terms.html exist in English and Spanish only; every other
// locale links to the English pages. This matches the mobile app, which also
// keeps legal document bodies in English and Spanish.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');

const site = JSON.parse(fs.readFileSync(path.join(CONTENT, 'locales.json'), 'utf8'));
const LOCALES = site.locales;
const LEGAL = new Set(site.legalLocales);

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Public URL of a page for a locale, used for canonical and alternate links.
function pageUrl(locale, page) {
  const base = locale.dir ? `${site.baseUrl}/${locale.dir}/` : `${site.baseUrl}/`;
  return page === 'index' ? base : `${base}${page}.html`;
}

// Path prefix from a locale directory back to the repository root.
function rootPrefix(locale) {
  return locale.dir ? '../' : '';
}

function fileName(page) {
  return `${page}.html`;
}

// Legal pages are English/Spanish only, so other locales reach them at the root.
function legalHref(locale, page) {
  return LEGAL.has(locale.code) ? fileName(page) : `${rootPrefix(locale)}${fileName(page)}`;
}

// Which locales a page actually exists in. Legal pages are English/Spanish
// only, so neither their alternate links nor their language menu may offer the
// other locales — those files are never generated.
function localesFor(page) {
  return page === 'privacy' || page === 'terms'
    ? LOCALES.filter((l) => LEGAL.has(l.code))
    : LOCALES;
}

function alternates(page) {
  const translated = localesFor(page);
  const links = translated.map(
    (l) => `<link rel="alternate" hreflang="${l.code}" href="${pageUrl(l, page)}" />`,
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(LOCALES[0], page)}" />`);
  return links;
}

function head(locale, page, opts) {
  const prefix = rootPrefix(locale);
  const lines = [
    '<!DOCTYPE html>',
    `<html lang="${locale.code}">`,
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `  <title>${esc(opts.title)}</title>`,
    `  <meta name="description" content="${esc(opts.description)}" />`,
    '  <meta name="theme-color" content="#000000" />',
    `  <link rel="canonical" href="${pageUrl(locale, page)}" />`,
    ...alternates(page).map((line) => `  ${line}`),
  ];
  if (opts.og) {
    lines.push(
      '  <meta property="og:title" content="ColdHello" />',
      `  <meta property="og:description" content="${esc(opts.og)}" />`,
      '  <meta property="og:type" content="website" />',
      `  <meta property="og:url" content="${pageUrl(locale, page)}" />`,
    );
  }
  lines.push(
    `  <link rel="icon" href="${prefix}assets/app-icon.png" />`,
    '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />',
    `  <link rel="stylesheet" href="${prefix}assets/style.css?v=${site.cssVersion}" />`,
    `  <script src="${prefix}assets/lang-picker.js" defer></script>`,
  );
  for (const script of opts.scripts || []) {
    lines.push(`  <script src="${prefix}${script}" defer></script>`);
  }
  lines.push('</head>');
  return lines.join('\n');
}

function languagePicker(locale, page) {
  const items = localesFor(page).map((other) => {
    if (other.code === locale.code) {
      return `<span class="lang-current" lang="${other.code}">${esc(other.name)}</span>`;
    }
    const target = other.dir
      ? `${rootPrefix(locale)}${other.dir}/${fileName(page)}`
      : `${rootPrefix(locale)}${fileName(page)}`;
    return `<a href="${target}" lang="${other.code}" hreflang="${other.code}">${esc(other.name)}</a>`;
  }).join('');
  const label = esc(locale.chrome.languageLabel);
  return (
    '<details class="lang-picker">'
    + `<summary class="language-switch" title="${label}">`
    + `<span class="lang-code">${locale.code.toUpperCase()}</span>`
    + '<span class="lang-caret" aria-hidden="true">▾</span>'
    + '</summary>'
    + `<div class="lang-menu" role="group" aria-label="${label}">${items}</div>`
    + '</details>'
  );
}

function header(locale, page) {
  const c = locale.chrome;
  const prefix = rootPrefix(locale);
  const howItWorks = page === 'index' ? '#how-it-works' : 'index.html#how-it-works';
  const current = (target) => (page === target ? ' aria-current="page"' : '');
  return (
    '  <header class="site-header"><div class="shell header-inner">'
    + `<a class="brand" href="index.html" aria-label="${esc(c.homeAria)}">`
    + `<img src="${prefix}assets/app-icon.png" alt="" width="42" height="42" /><span>ColdHello</span></a>`
    + `<nav class="site-nav" aria-label="${esc(c.mainNavAria)}">`
    + `<a href="${howItWorks}">${esc(c.navHowItWorks)}</a>`
    + `<a href="${legalHref(locale, 'privacy')}"${current('privacy')}>${esc(c.navPrivacy)}</a>`
    + `<a href="support.html"${current('support')}>${esc(c.navSupport)}</a>`
    + '</nav>'
    + languagePicker(locale, page)
    + '</div></header>'
  );
}

function footer(locale) {
  const c = locale.chrome;
  const prefix = rootPrefix(locale);
  return (
    '  <footer class="site-footer"><div class="shell footer-grid">'
    + '<div><a class="brand footer-brand" href="index.html">'
    + `<img src="${prefix}assets/app-icon.png" alt="" width="34" height="34" /><span>ColdHello</span></a>`
    + `<p>${esc(c.footerTagline)}</p></div>`
    + `<nav aria-label="${esc(c.footerNavAria)}">`
    + `<a href="support.html">${esc(c.navSupport)}</a>`
    + `<a href="${legalHref(locale, 'privacy')}">${esc(c.footerPrivacy)}</a>`
    + `<a href="${legalHref(locale, 'terms')}">${esc(c.footerTerms)}</a>`
    + '</nav>'
    + '<div class="footer-meta"><p>&copy; 2026 ColdHello</p></div>'
    + '</div></footer>'
  );
}

function storeRow(locale, extraClass, ariaLabel) {
  const c = locale.chrome;
  const prefix = rootPrefix(locale);
  return (
    `<div class="store-row${extraClass}" role="group" aria-label="${esc(ariaLabel)}">`
    + '<a class="official-store-badge app-store-badge" data-store="apple" hidden>'
    + `<img src="${prefix}assets/download-on-app-store.svg" alt="${esc(c.appleBadgeAlt)}" /></a>`
    + '<a class="official-store-badge google-play-badge" data-store="google" hidden>'
    + `<img src="${prefix}assets/get-it-on-google-play.png" alt="${esc(c.googleBadgeAlt)}" /></a>`
    + '</div>'
  );
}

function contactBox() {
  return `<div class="contact-box"><a href="mailto:${site.email}">${site.email}</a></div>`;
}

// The free tier is 10 free approaches OR 5 saved contacts, whichever happens
// first (app_preferences.dart: freeApproachLimit = 10). Mobile's own bundled
// translations reflect this only in English and Spanish so far - the other 14
// languages still say "5" everywhere, in the app itself. The web pricing card
// number matches whichever figure mobile actually shows in that language.
const FREE_TIER_NUMBER = { en: '10', es: '10' };

function renderIndex(locale) {
  const c = locale.chrome;
  const t = locale.index;
  const freeTierNumber = FREE_TIER_NUMBER[locale.code] || '5';
  const accents = ['pink', 'yellow', 'cyan', 'green'];
  const steps = t.steps
    .map((s, i) => `<li class="step-card accent-${accents[i]}"><span class="step-number">0${i + 1}</span>`
      + `<h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></li>`)
    .join('');

  return [
    head(locale, 'index', {
      title: t.title,
      description: t.description,
      og: t.ogDescription,
      scripts: ['assets/store-links.js'],
    }),
    '<body>',
    `  <a class="skip-link" href="#main-content">${esc(c.skipToContent)}</a>`,
    header(locale, 'index'),
    '',
    '  <main id="main-content">',
    '    <section class="hero"><div class="shell hero-grid">',
    '      <div class="hero-copy">'
      + `<p class="eyebrow"><span></span> ${esc(t.heroEyebrow)}</p>`
      + `<h1>${esc(t.heroHeadline1)}<br /><mark>${esc(t.heroHeadline2)}</mark></h1>`
      + `<p class="hero-promise">${esc(t.heroPromise)}</p>`
      + `<p class="hero-detail">${esc(t.heroDetail)}</p>`
      + storeRow(locale, ' hero-store-row', t.storeRowAria)
      + `<p class="micro-proof"><strong>${esc(t.microProofLead)}</strong> ${esc(t.microProofRest)}</p></div>`,
    `      <div class="hero-product" role="img" aria-label="${esc(t.heroProductAria)}">`
      + `<div class="burst" aria-hidden="true">${esc(t.burst1)}<br />${esc(t.burst2)}</div>`
      + '<div class="phone phone-ask"><div class="phone-top"><span></span><span></span></div>'
      + '<div class="phone-screen stranger-screen">'
      + `<p class="screen-kicker">${esc(t.screenKicker)}</p>`
      + `<p class="screen-question">${esc(t.screenQuestion1)}<br />${esc(t.screenQuestion2)}</p>`
      + `<button class="demo-yes" type="button" tabindex="-1">${esc(t.demoYes)}</button>`
      + `<button class="demo-no" type="button" tabindex="-1">${esc(t.demoNo)}</button>`
      + `<p class="screen-note">${esc(t.screenNote)}</p></div></div>`
      + `<div class="privacy-stamp" aria-hidden="true">${esc(t.privacyStamp1)}<br />${esc(t.privacyStamp2)}</div></div>`,
    '    </div></section>',
    '',
    '    <section class="problem-band" id="problem"><div class="shell problem-grid">'
      + `<p class="section-index">${esc(t.problemIndex)}</p>`
      + `<h2>${esc(t.problemHeadline)}</h2>`
      + `<div class="problem-copy"><p>${esc(t.problemBody)}</p>`
      + `<p><strong>${esc(t.problemNoteLead)}</strong> ${esc(t.problemNoteRest)}</p></div>`
      + '</div></section>',
    '',
    '    <section class="flow-section" id="how-it-works"><div class="shell">'
      + `<div class="section-heading"><div><p class="section-index">${esc(t.flowIndex)}</p>`
      + `<h2>${esc(t.flowHeadline1)}<br />${esc(t.flowHeadline2)}</h2></div>`
      + `<p>${esc(t.flowIntro)}</p></div>`
      + `<ol class="steps">${steps}</ol>`
      + '</div></section>',
    '',
    '    <section class="privacy-section" id="privacy"><div class="shell privacy-grid">'
      + `<div class="privacy-copy"><p class="section-index">${esc(t.privacyIndex)}</p>`
      + `<h2>${esc(t.privacyHeadline)}</h2><p>${esc(t.privacyBody)}</p>`
      + `<ul class="proof-list">${t.proofList.map((item) => `<li><span aria-hidden="true">✓</span> ${esc(item)}</li>`).join('')}</ul>`
      + `<a class="text-link" href="${legalHref(locale, 'privacy')}">${esc(t.privacyLink)} <span aria-hidden="true">→</span></a></div>`
      + `<div class="phone-stage" role="img" aria-label="${esc(t.statsAria)}">`
      + '<div class="phone phone-stats"><div class="phone-top"><span></span><span></span></div>'
      + `<div class="phone-screen stats-screen"><div class="screen-header"><span>${esc(t.statsHeader)}</span><span>•••</span></div>`
      + `<p class="stats-label">${esc(t.statsLabel)}</p>`
      + `<div class="stats-summary"><strong>${esc(t.statsCount)}</strong><span>${esc(t.statsCountLabel)}</span></div>`
      + '<div class="chart" aria-hidden="true"><i class="height-34"></i><i class="decline height-58"></i><i class="height-72"></i><i class="height-44"></i><i class="decline height-28"></i><i class="height-86"></i><i class="height-64"></i></div>'
      + `<div class="chart-days">${t.chartDays.map((d) => `<span>${esc(d)}</span>`).join('')}</div>`
      + `<div class="local-badge"><span aria-hidden="true">◆</span> ${esc(t.localBadge)}</div></div></div>`
      + `<p class="owner-label">${esc(t.ownerLabel)}</p></div>`
      + '</div></section>',
    '',
    '    <section class="features-section"><div class="shell">'
      + `<p class="section-index">${esc(t.featuresIndex)}</p><div class="feature-grid">`
      + `<article class="feature"><p class="feature-mark">${LOCALES.length} <span>◆</span></p>`
      + `<h3>${esc(t.features[0].title)}</h3><p>${esc(t.features[0].body)}</p></article>`
      + '<article class="feature"><p class="feature-icon" aria-hidden="true">#</p>'
      + `<h3>${esc(t.features[1].title)}</h3><p>${esc(t.features[1].body)}</p></article>`
      + '<article class="feature"><p class="feature-icon chart-icon" aria-hidden="true">↗</p>'
      + `<h3>${esc(t.features[2].title)}</h3><p>${esc(t.features[2].body)}</p></article>`
      + '</div></div></section>',
    '',
    '    <section class="pricing-section" id="pricing"><div class="shell">'
      + `<div class="section-heading pricing-heading"><div><p class="section-index">${esc(t.pricingIndex)}</p>`
      + `<h2>${esc(t.pricingHeadline)}</h2></div><p>${esc(t.pricingIntro)}</p></div>`
      + `<div class="pricing-grid"><article class="price-card"><p class="price-tier">${esc(t.freeTier)}</p>`
      + `<p class="price"><strong>${esc(freeTierNumber)}</strong> ${esc(t.freeTierUnit)}</p>`
      + `<ul>${t.freeFeatures.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></article>`
      + `<article class="price-card price-pro"><p class="popular-tag">${esc(t.proTag)}</p>`
      + `<p class="price-tier">${esc(t.proTier)}</p><p class="price"><strong>${esc(t.proPrice)}</strong></p>`
      + `<p class="annual">${esc(t.proPlans)}</p>`
      + `<ul>${t.proFeatures.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></article></div>`
      + `<p class="pricing-note">${esc(t.pricingNote)}</p>`
      + '</div></section>',
    '',
    '    <section class="faq-section"><div class="shell faq-grid">'
      + `<div><p class="section-index">${esc(t.faqIndex)}</p><h2>${esc(t.faqHeadline)}</h2>`
      + `<a class="text-link" href="support.html">${esc(t.faqLink)} <span aria-hidden="true">→</span></a></div>`
      + `<div class="faq-list">${t.faqs.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`
      + '</div></section>',
    '',
    '    <section class="final-cta" id="download"><div class="shell final-inner">'
      + `<p class="eyebrow"><span></span> ${esc(t.finalEyebrow)}</p>`
      + `<h2>${esc(t.heroHeadline1)}<br /><mark>${esc(t.heroHeadline2)}</mark></h2>`
      + `<p>${esc(t.heroPromise)}</p>`
      + storeRow(locale, '', t.finalStoreAria)
      + '</div></section>',
    '  </main>',
    '',
    footer(locale),
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function renderSupport(locale) {
  const c = locale.chrome;
  const t = locale.support;
  const navLinks = t.sections.map((s) => `<a href="#${s.id}">${esc(s.nav)}</a>`).join('');
  const sections = t.sections
    .map((s) => {
      if (s.id === 'contact') {
        return `<section id="contact"><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p>${contactBox()}</section>`;
      }
      const items = s.items
        .map((i) => `<article class="faq-item"><h3>${esc(i.q)}</h3><p>${esc(i.a)}</p></article>`)
        .join('');
      return `<section id="${s.id}"><h2>${esc(s.title)}</h2><div class="faq-stack">${items}</div></section>`;
    })
    .join('\n        ');

  return [
    head(locale, 'support', { title: t.title, description: t.description }),
    '<body>',
    `  <a class="skip-link" href="#main-content">${esc(c.skipToContent)}</a>`,
    header(locale, 'support'),
    '',
    '  <main id="main-content">',
    `    <header class="doc-hero"><div class="shell"><p class="section-index">${esc(t.eyebrow)}</p>`
      + `<h1>${esc(t.heading)}</h1><p>${esc(t.intro)}</p></div></header>`,
    '    <div class="shell doc-layout">',
    `      <nav class="doc-nav" aria-label="${esc(t.navAria)}">${navLinks}</nav>`,
    '      <div class="doc">',
    `        ${sections}`,
    '      </div>',
    '    </div>',
    '  </main>',
    '',
    footer(locale),
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function renderLegal(locale, page) {
  const c = locale.chrome;
  const t = locale[page];
  const body = fs
    .readFileSync(path.join(CONTENT, 'legal', locale.code, `${page}.html`), 'utf8')
    .trim();
  const navLinks = t.nav.map((n) => `<a href="#${n.id}">${esc(n.label)}</a>`).join('');

  return [
    head(locale, page, { title: t.title, description: t.description }),
    '<body>',
    `  <a class="skip-link" href="#main-content">${esc(c.skipToContent)}</a>`,
    header(locale, page),
    '  <main id="main-content">',
    `    <header class="doc-hero"><div class="shell"><p class="section-index">${esc(t.eyebrow)}</p>`
      + `<h1>${esc(t.heading)}</h1><p>${esc(t.intro)}</p>`
      + `<p class="updated">${esc(t.updated)}</p></div></header>`,
    '    <div class="shell doc-layout">',
    `      <nav class="doc-nav" aria-label="${esc(t.navAria)}">${navLinks}</nav>`,
    '      <article class="doc">',
    body.split('\n').map((line) => `        ${line.trim()}`).join('\n'),
    '      </article>',
    '    </div>',
    '  </main>',
    footer(locale),
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

// English is the reference shape. A locale missing a key would otherwise render
// the string "undefined" into a page, so compare structures before rendering.
function checkShape(reference, candidate, code, path, problems) {
  for (const [key, expected] of Object.entries(reference)) {
    const here = path ? `${path}.${key}` : key;
    const actual = candidate ? candidate[key] : undefined;

    if (actual === undefined || actual === null || actual === '') {
      problems.push(`${code}: missing ${here}`);
    } else if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        problems.push(`${code}: ${here} should be an array`);
      } else if (actual.length !== expected.length) {
        problems.push(`${code}: ${here} has ${actual.length} entries, expected ${expected.length}`);
      } else {
        expected.forEach((item, i) => {
          if (item && typeof item === 'object') checkShape(item, actual[i], code, `${here}[${i}]`, problems);
        });
      }
    } else if (expected && typeof expected === 'object') {
      checkShape(expected, actual, code, here, problems);
    }
  }
}

function write(locale, page, html) {
  const dir = locale.dir ? path.join(ROOT, locale.dir) : ROOT;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName(page)), html, 'utf8');
  return path.relative(ROOT, path.join(dir, fileName(page))).replace(/\\/g, '/');
}

function main() {
  // Optional locale codes narrow the build, e.g. `node tools/build.js en es`.
  const only = new Set(process.argv.slice(2));
  const targets = only.size ? LOCALES.filter((l) => only.has(l.code)) : LOCALES;
  const reference = JSON.parse(fs.readFileSync(path.join(CONTENT, 'en.json'), 'utf8'));
  const { privacy, terms, ...shared } = reference;

  const problems = [];
  const loaded = targets.map((entry) => {
    const locale = Object.assign(
      {},
      entry,
      JSON.parse(fs.readFileSync(path.join(CONTENT, `${entry.code}.json`), 'utf8')),
    );
    checkShape(LEGAL.has(entry.code) ? reference : shared, locale, entry.code, '', problems);
    return locale;
  });

  if (problems.length) {
    for (const problem of problems) process.stderr.write(`  ${problem}\n`);
    process.stderr.write(`\n${problems.length} content problem(s); nothing was written.\n`);
    process.exitCode = 1;
    return;
  }

  const written = [];
  for (const locale of loaded) {
    written.push(write(locale, 'index', renderIndex(locale)));
    written.push(write(locale, 'support', renderSupport(locale)));
    if (LEGAL.has(locale.code)) {
      written.push(write(locale, 'privacy', renderLegal(locale, 'privacy')));
      written.push(write(locale, 'terms', renderLegal(locale, 'terms')));
    }
  }
  for (const file of written) process.stdout.write(`  ${file}\n`);
  process.stdout.write(`\n${written.length} pages across ${targets.length} locales\n`);
}

main();
