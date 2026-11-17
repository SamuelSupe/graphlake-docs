const guideMenu = document.querySelector("#guide-menu");
if (guideMenu && "showPopover" in HTMLElement.prototype) {
  const narrow = matchMedia("(max-width: 760px)");
  const toggle = document.querySelector(".guide-toggle");

  function updateGuideMenu() {
    guideMenu.toggleAttribute("popover", narrow.matches);
    toggle.hidden = !narrow.matches;
  }

  narrow.addEventListener("change", updateGuideMenu);
  updateGuideMenu();
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
