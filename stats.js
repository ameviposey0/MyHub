const PASS_HASH =
  "840486f16a42e36f95f51df1090b186dc2e8def555041877b290058062f3f356";
const SESSION_KEY = "myhub.atelier";

const gate = document.getElementById("gate");
const studio = document.getElementById("studio");
const form = document.getElementById("gate-form");
const errorEl = document.getElementById("gate-error");
const logout = document.getElementById("logout");

const hex = (buffer) =>
  [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const hashText = async (value) => {
  const data = new TextEncoder().encode(value);
  return hex(await crypto.subtle.digest("SHA-256", data));
};

const isOpen = () => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === PASS_HASH;
  } catch {
    return false;
  }
};

const openSession = () => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, PASS_HASH);
  } catch {
    /* ignore */
  }
};

const closeSession = () => {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
};

const formatCount = (value) => Number(value || 0).toLocaleString("fr-FR");

const formatRate = (visitors, maquette) => {
  if (!visitors) return "0 %";
  return `${Math.round((maquette / visitors) * 100)} %`;
};

const paintCounts = (visitors, maquette) => {
  document.querySelector('[data-count="visitors"]').textContent =
    formatCount(visitors);
  document.querySelector('[data-count="maquette"]').textContent =
    formatCount(maquette);
  document.querySelector('[data-count="rate"]').textContent = formatRate(
    visitors,
    maquette,
  );
};

const loadCounts = async () => {
  try {
    const [visitors, maquette] = await Promise.all([
      getCount("visitors"),
      getCount("maquette"),
    ]);
    paintCounts(visitors, maquette);
  } catch {
    document.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = "—";
    });
  }
};

const showStudio = () => {
  gate.hidden = true;
  studio.hidden = false;
  loadCounts();
};

const showGate = () => {
  studio.hidden = true;
  gate.hidden = false;
  errorEl.hidden = true;
  passInput?.removeAttribute("aria-invalid");
};

const passInput = document.getElementById("pass");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = new FormData(form).get("password")?.toString() ?? "";
  const hash = await hashText(password);

  if (hash !== PASS_HASH) {
    errorEl.hidden = false;
    passInput?.setAttribute("aria-invalid", "true");
    passInput?.focus();
    return;
  }

  passInput?.removeAttribute("aria-invalid");
  openSession();
  showStudio();
});

logout.addEventListener("click", () => {
  closeSession();
  form.reset();
  showGate();
});

if (isOpen()) showStudio();
else showGate();
