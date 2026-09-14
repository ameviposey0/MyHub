const form = document.getElementById("register-form");
const errorEl = document.getElementById("register-error");

api("/api/me")
  .then(goEspace)
  .catch(() => {});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(errorEl, "");
  const prenom = form.elements.namedItem("prenom").value.trim();
  const nom = form.elements.namedItem("nom").value.trim();
  const phone = form.elements.namedItem("phone").value.trim();
  if (!prenom || !nom) {
    showError(errorEl, "Indique ton prénom et ton nom.");
    return;
  }
  if (phone.replace(/\D+/g, "").length < 8) {
    showError(errorEl, "Indique un numéro de téléphone valide.");
    return;
  }
  try {
    await api("/api/register", {
      method: "POST",
      body: { prenom, nom, phone },
    });
    goEspace();
  } catch (error) {
    showError(errorEl, error.message);
  }
});
