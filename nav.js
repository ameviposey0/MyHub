const DESKTOP_NAV = window.matchMedia("(min-width: 64rem)");
const header = document.querySelector(".top");
const toggle = document.querySelector(".nav-toggle:not(.hub-toggle)");
const panel = document.getElementById("menu");
const backdrop = document.getElementById("nav-backdrop");

const isDesktopNav = () => DESKTOP_NAV.matches;

let lockY = 0;

const lockPage = (lock) => {
  if (lock) {
    lockY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockY}px`;
    document.body.style.width = "100%";
  } else if (document.body.style.position === "fixed") {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, lockY);
  }
};

const setMenuOpen = (open) => {
  const next = Boolean(open) && !isDesktopNav();
  document.body.classList.toggle("nav-open", next);
  toggle?.setAttribute("aria-expanded", String(next));
  toggle?.setAttribute("aria-label", next ? "Fermer le menu" : "Ouvrir le menu");
  if (backdrop) backdrop.hidden = !next;
  if (panel) panel.inert = !isDesktopNav() && !next;
  lockPage(next);
};

toggle?.addEventListener("click", () => {
  setMenuOpen(!document.body.classList.contains("nav-open"));
});

backdrop?.addEventListener("click", () => setMenuOpen(false));

panel?.querySelectorAll("a, button").forEach((item) => {
  item.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!document.body.classList.contains("nav-open")) return;
  setMenuOpen(false);
  toggle?.focus();
});

const onBreakpoint = () => setMenuOpen(false);
if (typeof DESKTOP_NAV.addEventListener === "function") {
  DESKTOP_NAV.addEventListener("change", onBreakpoint);
} else if (typeof DESKTOP_NAV.addListener === "function") {
  DESKTOP_NAV.addListener(onBreakpoint);
}

if (toggle && panel) setMenuOpen(false);

const markStuck = () => {
  header?.classList.toggle("is-stuck", window.scrollY > 8);
};

window.addEventListener("scroll", markStuck, { passive: true });
markStuck();
