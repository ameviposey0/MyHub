const { readBody, sendJson, sendCaught } = require("../../lib/http");
const { readAdminSession } = require("../../lib/session");
const { updateStore } = require("../../lib/store");
const { adminOverview } = require("../../lib/class");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }
  if (!readAdminSession(req)) {
    sendJson(res, 401, { error: "Espace admin : connecte-toi." });
    return;
  }

  try {
    const body = await readBody(req);
    const id = String(body.id || "").trim();
    const feedback = String(body.feedback || "").trim().slice(0, 800);
    const grade = String(body.grade || "").trim().slice(0, 24);

    if (!id) {
      sendJson(res, 400, { error: "Copie introuvable." });
      return;
    }

    const view = await updateStore((store) => {
      const copy = store.submissions[id];
      if (!copy) {
        const error = new Error("missing");
        error.status = 400;
        throw error;
      }
      copy.feedback = feedback;
      copy.grade = grade;
      copy.reviewedAt = Date.now();
      return adminOverview(store);
    });

    sendJson(res, 200, view);
  } catch (error) {
    if (error.status === 400) {
      sendJson(res, 400, { error: "Copie introuvable." });
      return;
    }
    sendCaught(res, error, "Impossible d’enregistrer le retour.");
  }
};
