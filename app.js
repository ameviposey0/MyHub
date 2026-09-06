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
