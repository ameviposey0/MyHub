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
