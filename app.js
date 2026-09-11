const KEYS = {
  visitors: "myhub.seen",
  maquette: "myhub.maquette",
  bootcamp: "myhub.bootcamp",
};

const DESKTOP_NAV = window.matchMedia("(min-width: 64rem)");
const header = document.querySelector(".top");
const toggle = document.querySelector(".nav-toggle");
const panel = document.getElementById("menu");
const backdrop = document.getElementById("nav-backdrop");

const isDesktopNav = () => DESKTOP_NAV.matches;

const setMenuOpen = (open) => {
  const next = open && !isDesktopNav();
  document.body.classList.toggle("nav-open", next);
  toggle?.setAttribute("aria-expanded", String(next));
  toggle?.setAttribute("aria-label", next ? "Fermer le menu" : "Ouvrir le menu");
  if (backdrop) backdrop.hidden = !next;
  if (panel) panel.inert = !isDesktopNav() && !next;
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

DESKTOP_NAV.addEventListener("change", () => setMenuOpen(false));
setMenuOpen(false);

const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const markCurrent = () => {
  if (!sections.length) return;

  const y = window.scrollY + 120;
  let current = sections[0];

  for (const section of sections) {
    if (section.offsetTop <= y) current = section;
  }

  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${current.id}`;
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
    link.classList.toggle("is-current", active);
  });
};

const markStuck = () => {
  header?.classList.toggle("is-stuck", window.scrollY > 8);
};

window.addEventListener(
  "scroll",
  () => {
    markCurrent();
    markStuck();
  },
  { passive: true },
);

markCurrent();
markStuck();

const once = (storageKey) => {
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
};

const remember = (storageKey) => {
  try {
    window.localStorage.setItem(storageKey, "1");
  } catch {
    /* ignore private-mode write errors */
  }
};

const trackUnique = async (kind) => {
  if (once(KEYS[kind])) return;
  await hitCount(kind);
  remember(KEYS[kind]);
};

const fullDialog = document.getElementById("bootcamp-full");

document.querySelectorAll("[data-track='bootcamp']").forEach((el) => {
  el.setAttribute("aria-haspopup", "dialog");
  el.setAttribute("aria-controls", "bootcamp-full");
});

fullDialog?.addEventListener("click", (event) => {
  if (event.target === fullDialog) fullDialog.close();
});

document.addEventListener("click", (event) => {
  const maquette = event.target.closest("[data-track='maquette']");
  if (maquette) trackUnique("maquette").catch(() => {});

  const bootcamp = event.target.closest("[data-track='bootcamp']");
  if (!bootcamp) return;

  event.preventDefault();
  trackUnique("bootcamp").catch(() => {});
  setMenuOpen(false);
  fullDialog?.showModal();
});

trackUnique("visitors").catch(() => {});
