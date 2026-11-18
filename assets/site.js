function responsiveMenu(id, query) {
  const menu = document.getElementById(id);
  if (!menu || !("showPopover" in HTMLElement.prototype)) return;
  const toggle = document.querySelector(`[popovertarget="${id}"]`);
  const narrow = matchMedia(query);
  function resize() {
    if (menu.matches(":popover-open")) menu.hidePopover();
    menu.toggleAttribute("popover", narrow.matches);
    toggle.hidden = !narrow.matches;
  }
  narrow.addEventListener("change", resize);
  resize();
}

responsiveMenu("primary-links", "(max-width: 680px)");
responsiveMenu("guide-menu", "(max-width: 760px)");

const searchLink = document.querySelector("[data-search-link]");
searchLink.hash = "guide-query";

const outlineLinks = Array.from(document.querySelectorAll(".outline a"));
if (outlineLinks.length) {
  const sections = outlineLinks.map(link => document.getElementById(link.hash.slice(1)));
  const header = document.querySelector(".site-header");
  let active;
  let frame;
  function markSection() {
    frame = undefined;
    if (!outlineLinks[0].getClientRects().length) return;
    const top = header.getBoundingClientRect().bottom + 32;
    const index = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
      ? sections.length - 1 : Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= top));
    const next = outlineLinks[index];
    if (next === active) return;
    active?.removeAttribute("aria-current");
    next.setAttribute("aria-current", "location");
    active = next;
  }
  function schedule() {
    if (frame === undefined) frame = requestAnimationFrame(markSection);
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  schedule();
}

if (navigator.clipboard) {
  for (const button of document.querySelectorAll(".copy")) {
    const label = button.textContent;
    const code = button.closest(".code-block").querySelector("code");
    const status = button.nextElementSibling;
    let reset;
    button.hidden = false;
    button.addEventListener("click", async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = button.dataset.copied;
      } catch {
        button.textContent = button.dataset.error;
        const selection = getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      status.textContent = button.textContent;
      reset = setTimeout(() => {
        button.textContent = label;
        status.textContent = "";
      }, 2000);
    });
  }
}

const languageLink = document.querySelector("[data-language]");
function updateLanguageLink() {
  languageLink.hash = location.hash;
}
window.addEventListener("hashchange", updateLanguageLink);
updateLanguageLink();

const docSearch = document.querySelector(".doc-search");
if (docSearch) {
  const form = docSearch.querySelector("form");
  const input = form.elements.q;
  const status = docSearch.querySelector(".search-status");
  const results = docSearch.querySelector(".search-results");
  const index = JSON.parse(document.querySelector("#guide-index").textContent);
  docSearch.hidden = false;
  if (location.hash === "#guide-query") requestAnimationFrame(() => input.focus());

  function clearSearch() {
    status.textContent = "";
    results.replaceChildren();
    results.hidden = true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearSearch();
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) return;

    const terms = query.split(/\s+/);
    const matches = [];
    for (const entry of index) {
      const title = entry.title.toLocaleLowerCase();
      const section = entry.section.toLocaleLowerCase();
      const text = entry.text.toLocaleLowerCase();
      if (!terms.every((term) => title.includes(term) || section.includes(term) || text.includes(term))) continue;
      const score = 4 * Number(section.includes(query)) + 3 * Number(title.includes(query))
        + terms.filter((term) => section.includes(term) || title.includes(term)).length;
      matches.push({ entry, score });
    }
    matches.sort((a, b) => b.score - a.score);

    const guides = new Map();
    for (const { entry } of matches) {
      if (!guides.has(entry.page)) guides.set(entry.page, entry);
    }
    for (const entry of [...guides.values()].slice(0, 10)) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const section = document.createElement("span");
      link.href = entry.url;
      link.textContent = entry.title;
      section.textContent = entry.section;
      link.append(section);
      item.append(link);
      results.append(item);
    }
    results.hidden = !guides.size;
    status.textContent = guides.size
      ? form.dataset.matches.replace("{count}", guides.size)
      : form.dataset.empty;
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) clearSearch();
  });
}
