const { readBody, sendJson, sendCaught } = require("../../lib/http");
const { readAdminSession } = require("../../lib/session");
const { updateStore } = require("../../lib/store");
const { makeId, adminOverview } = require("../../lib/class");

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
    const action = String(body.action || "create");
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim().slice(0, 80);
    const text = String(body.body || "").trim().slice(0, 800);

    const view = await updateStore((store) => {
      if (!Array.isArray(store.announcements)) store.announcements = [];
      if (action === "delete") {
        store.announcements = store.announcements.filter((item) => item.id !== id);
        return adminOverview(store);
      }
      if (!title || !text) {
        const error = new Error("fields");
        error.status = 400;
        throw error;
      }
      store.announcements.unshift({
        id: makeId("n"),
        title,
        body: text,
        createdAt: Date.now(),
      });
      return adminOverview(store);
    });

    sendJson(res, action === "delete" ? 200 : 201, view);
  } catch (error) {
    if (error.status === 400) {
      sendJson(res, 400, { error: "Titre et message sont requis." });
      return;
    }
    sendCaught(res, error, "Impossible d’enregistrer l’annonce.");
  }
};
