const api = async (path, options = {}) => {
  const response = await fetch(path, {
    method: options.method || "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Une erreur est survenue.");
  }
  return data;
};

const showError = (el, message) => {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
};

const goEspace = () => {
  window.location.href = "espace.html";
};

const goConnexion = () => {
  window.location.href = "etudiant.html";
};

const when = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const whenDay = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const bindDrawer = (toggle, backdrop) => {
  const close = () => {
    document.body.classList.remove("hub-open");
    if (backdrop) backdrop.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    document.body.classList.add("hub-open");
    if (backdrop) backdrop.hidden = false;
    toggle?.setAttribute("aria-expanded", "true");
  };
  toggle?.addEventListener("click", () => {
    if (document.body.classList.contains("hub-open")) close();
    else open();
  });
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  return { close, open };
};

const showView = (name, titles = {}) => {
  document.querySelectorAll("[data-view]").forEach((panel) => {
    panel.hidden = panel.getAttribute("data-view") !== name;
  });
  document.querySelectorAll("[data-go]").forEach((button) => {
    const on = button.getAttribute("data-go") === name;
    button.setAttribute("aria-current", on ? "page" : "false");
  });
  const title = document.getElementById("hub-title");
  const lead = document.getElementById("hub-lead");
  if (title && titles[name]?.title) title.textContent = titles[name].title;
  if (lead && titles[name]) lead.textContent = titles[name].lead || "";
};

const readFileText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsText(file);
  });
