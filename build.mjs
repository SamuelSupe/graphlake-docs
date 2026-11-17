import { cp, mkdir, writeFile } from "node:fs/promises";
import { posix } from "node:path";
import { reference, repository, releasePage } from "./examples.mjs";
import en from "./en.mjs";
import zh from "./zh.mjs";

const locales = { en, "zh-CN": zh };
const groups = [
  ["start", ["", "docs", "install", "first-model", "quickstart", "concepts"]],
  ["guides", ["sources", "model", "query", "query-recipes", "algorithms", "local-tables", "use-cases"]],
  ["integration", ["clients", "access", "mcp"]],
  ["operations", ["deploy", "cluster", "monitoring", "recovery", "troubleshoot"]],
];
const pages = groups.flatMap(([, slugs]) => slugs);
const screenshotHeights = { workbench: 948, "local-tables": 805 };
const connectorAssets = [
  ["postgres", "PostgreSQL"],
  ["parquet", "Parquet"],
  ["iceberg", "Iceberg"],
  ["snowflake", "Snowflake"],
  ["duckdb", "DuckDB"],
];
const icons = {
  sources: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  model: '<path d="m4 19 8-14 8 14H4"/><circle cx="4" cy="19" r="3"/><circle cx="12" cy="5" r="3"/><circle cx="20" cy="19" r="3"/>',
  query: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
};

const output = new URL("./dist/", import.meta.url);
const escape = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const dir = (locale, page) => `./${locale === "en" ? "" : "zh/"}${page ? `${page}/` : ""}`;
const pageURL = (from, locale, page) => {
  const relative = posix.relative(from, dir(locale, page));
  return relative ? `${relative}/` : "./";
};

function renderPage(locale, slug) {
  const { ui, home, articles } = locales[locale];
  const article = articles[slug];
  const current = dir(locale, slug);
  const other = locale === "en" ? "zh-CN" : "en";
  const assets = `${pageURL(current, "en", "")}assets/`;
  const href = (page) => pageURL(current, locale, page);
  const link = (page, label = articles[page]?.title ?? ui.overview) => `<a href="${href(page)}">${label}</a>`;
  const ref = (path, label) => `<a href="${reference}/${path}">${label}</a>`;
  const code = (language, value) => `<div class="code-block"><div class="code-head"><span>${language}</span><button type="button" class="copy" data-copied="${ui.copied}" data-error="${ui.copyError}" hidden>${ui.copy}</button><span class="sr-only" role="status"></span></div><pre tabindex="0"><code>${escape(value)}</code></pre></div>`;
  const image = (name, alt, eager = false) => `<a class="screenshot" href="${assets}${name}.jpg"><img src="${assets}${name}.jpg" width="1512" height="${screenshotHeights[name]}" alt="${escape(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}></a>`;
  const asset = (path, label) => `<a href="${assets}${path}" download>${label}</a>`;
  const context = { link, ref, code, image, asset, releasePage };

  function navGroups() {
    return groups.map(([group, entries]) => `<div class="nav-group"><p>${ui[group]}</p><ul>${entries.map((page) => `<li><a href="${href(page)}"${page === slug ? ' aria-current="page"' : ""}>${articles[page]?.title ?? ui.overview}</a></li>`).join("")}</ul></div>`).join("");
  }

  function searchGuide() {
    const index = Object.entries(articles)
      .filter(([page]) => page !== "docs")
      .flatMap(([page, guide]) => guide.sections.map(([id, section, body]) => ({
        page,
        url: `${href(page)}#${id}`,
        title: guide.title,
        section,
        text: `${guide.description} ${body(context).replace(/<[^>]+>/g, " ")}`.replace(/\s+/g, " ").trim(),
      })));

    return `<search class="doc-search" hidden>
    <form action="./" method="get" data-empty="${ui.searchEmpty}" data-matches="${ui.searchMatches}">
      <label for="guide-query">${ui.search}</label>
      <div class="search-field">
        <input id="guide-query" name="q" type="search" placeholder="${ui.searchHint}" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="search">
        <button type="submit">${ui.searchAction}</button>
      </div>
    </form>
    <p class="search-status" role="status"></p>
    <ul class="search-results" hidden></ul>
    </search>
    <script type="application/json" id="guide-index">${JSON.stringify(index).replaceAll("<", "\\u003c")}</script>`;
  }

  function articlePage() {
    const sections = article.sections;
    const sectionLinks = `<ul>${sections.map(([id, heading]) => `<li><a href="#${id}">${heading}</a></li>`).join("")}</ul>`;
    const articleNav = pages.filter(Boolean);
    const index = articleNav.indexOf(slug);
    const previous = articleNav[index - 1];
    const next = articleNav[index + 1];
    return `<div class="doc-layout">
      <div class="doc-rail">
        <button class="guide-toggle" type="button" popovertarget="guide-menu" aria-controls="guide-menu" hidden>${ui.contents}</button>
        <nav class="guide-menu" id="guide-menu" aria-label="${ui.contents}">${navGroups()}</nav>
      </div>
      <main class="doc" id="main" tabindex="-1">
        <header class="doc-heading">
          ${slug === "docs" ? "" : `<nav class="breadcrumb" aria-label="${ui.breadcrumb}">
            <ol><li>${link("docs", ui.docs)}</li><li><a href="./" aria-current="page">${article.title}</a></li></ol>
          </nav>`}
          <h1>${article.title}</h1>
          <p class="lead">${article.description}</p>
        </header>
        ${slug === "docs" ? searchGuide() : ""}
        <details class="inline-outline"><summary>${ui.onPage}</summary>${sectionLinks}</details>
        ${sections.map(([id, heading, body]) => `<section class="doc-section" aria-labelledby="${id}"><h2 id="${id}">${heading}</h2>${body(context)}</section>`).join("")}
        <nav class="pagination" aria-label="${ui.contents}">
          ${previous ? `<div><small>${ui.previous}</small>${link(previous)}</div>` : ""}
          ${next ? `<div class="next"><small>${ui.next}</small>${link(next)}</div>` : ""}
        </nav>
      </main>
      <aside class="outline"><nav aria-label="${ui.onPage}"><strong>${ui.onPage}</strong>${sectionLinks}</nav></aside>
    </div>`;
  }

  function landingPage() {
    return `<main class="landing" id="main" tabindex="-1">
      <section class="hero-band" aria-labelledby="overview">
        <div class="shell hero">
          <div class="hero-copy">
            <h1 id="overview">${home.title}</h1>
            <p>${home.description}</p>
            <div class="hero-actions">
              <a class="button primary" href="${href("first-model")}">${home.cta}${svg("arrow")}</a>
              <a class="button secondary" href="${href("install")}">${articles.install.title}</a>
            </div>
          </div>
          <figure class="hero-visual">${image("workbench", home.workbenchAlt, true)}</figure>
        </div>
      </section>
      <div class="connector-band">
        <div class="shell">
          <ul class="connectors" aria-label="${articles.sources.title}">
            ${connectorAssets.map(([asset, name]) => `<li><a href="${href("sources")}"><img src="${assets}${asset}.svg" alt="" width="34" height="34">${name}</a></li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="shell">
        <section class="landing-section" aria-labelledby="workflow">
          <h2 id="workflow">${home.workflow}</h2>
          <div class="step-grid">${home.steps.map(([page, title, body]) => `<div class="step"><h3>${link(page, `${svg(page)}${title}`)}</h3><p>${body}</p></div>`).join("")}</div>
        </section>
        <section class="landing-section use-cases" aria-labelledby="cases">
          <h2 id="cases">${articles["use-cases"].title}</h2>
          <ul class="case-list">${articles["use-cases"].sections.map(([id, title]) => `<li><a class="case" href="${href("use-cases")}#${id}"><div><h3>${title}</h3><p>${home.cases[id]}</p></div>${svg("arrow")}</a></li>`).join("")}</ul>
        </section>
      </div>
      <section class="pathways" aria-labelledby="guides">
        <div class="shell landing-section">
          <h2 id="guides">${home.more}</h2>
          <ul>${["local-tables", "mcp", "cluster"].map((page) => `<li>${link(page)}</li>`).join("")}</ul>
        </div>
      </section>
    </main>`;
  }

  const title = article ? `${article.title} · GraphLake` : `GraphLake · ${ui.product}`;
  const description = article?.description ?? home.description;
  const otherPage = pageURL(current, other, slug);
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="alternate" hreflang="en" href="${pageURL(current, "en", slug)}">
<link rel="alternate" hreflang="zh-CN" href="${pageURL(current, "zh-CN", slug)}">
<link rel="icon" href="${assets}graphlake-logo.png" type="image/png" sizes="512x512">
<link rel="stylesheet" href="${assets}site.css">
<script src="${assets}site.js" defer></script>
</head>
<body>
<a href="#main" class="skip">${ui.skip}</a>
<header class="site-header">
  <div class="shell topbar">
    <a class="brand" href="${href("")}"><img src="${assets}graphlake-logo.png" width="44" height="44" alt=""><span>GraphLake</span></a>
    <nav aria-label="${ui.primary}">
      <a href="${href("docs")}"${slug === "docs" ? ' aria-current="page"' : article && slug !== "use-cases" ? ' class="selected"' : ""}>${ui.docs}</a>
      <a href="${href("use-cases")}"${slug === "use-cases" ? ' aria-current="page"' : ""}>${articles["use-cases"].title}</a>
      <a data-language href="${otherPage}" lang="${other}" hreflang="${other}">${ui.language}</a>
      <a class="github" href="${repository}">GitHub</a>
    </nav>
  </div>
</header>
${article ? articlePage() : landingPage()}
<footer class="site-footer"><div class="shell footer-row"><span>GraphLake</span><nav aria-label="${ui.footer}">${link("docs", ui.docs)} <a href="${releasePage}">${ui.release}</a> <a href="${repository}">GitHub</a></nav></div></footer>
</body>
</html>
`;
}

for (const [locale, content] of Object.entries(locales)) {
  if (Object.keys(content.articles).length !== pages.length - 1) throw new Error(`Page count differs for ${locale}`);
  for (const slug of pages.slice(1)) {
    const ids = content.articles[slug].sections.map(([id]) => id);
    const other = locale === "en" ? zh : en;
    const otherIds = other.articles[slug].sections.map(([id]) => id);
    if (ids.join() !== otherIds.join() || new Set(ids).size !== ids.length) {
      throw new Error(`Section anchors differ for ${slug}`);
    }
  }
}

await cp(new URL("./assets/", import.meta.url), new URL("assets/", output), { recursive: true });
await Promise.all(Object.keys(locales).flatMap((locale) => pages.map(async (slug) => {
  const target = new URL(dir(locale, slug), output);
  await mkdir(target, { recursive: true });
  await writeFile(new URL("index.html", target), renderPage(locale, slug));
})));
console.log(`Built ${pages.length * Object.keys(locales).length} pages in dist/`);
