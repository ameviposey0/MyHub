const KEYS = {
  visitors: "myhub.seen",
  maquette: "myhub.maquette",
};

const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const markCurrent = () => {
  const y = window.scrollY + 120;
  let current = sections[0];

  for (const section of sections) {
    if (section.offsetTop <= y) current = section;
  }

  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${current.id}`;
    link.toggleAttribute("aria-current", active);
    link.classList.toggle("is-current", active);
  });
};

window.addEventListener("scroll", markCurrent, { passive: true });
markCurrent();

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

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-track='maquette']");
  if (!trigger) return;
  trackUnique("maquette").catch(() => {});
});

trackUnique("visitors").catch(() => {});
