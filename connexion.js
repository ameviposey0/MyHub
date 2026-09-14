const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

api("/api/me")
  .then(goEspace)
  .catch(() => {});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(errorEl, "");
  const prenom = form.elements.namedItem("prenom").value.trim();
  const phone = form.elements.namedItem("phone").value.trim();
  if (!prenom || !phone) {
    showError(errorEl, "Indique ton prénom et ton numéro.");
    return;
  }
  try {
    await api("/api/login", { method: "POST", body: { prenom, phone } });
    goEspace();
  } catch (error) {
    showError(errorEl, error.message);
  }
});
