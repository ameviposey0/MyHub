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
    const title = String(body.title || "").trim().slice(0, 80);
    const summary = String(body.summary || "").trim().slice(0, 400);
    const support = String(body.support || "").trim().slice(0, 200);
    const published = body.published !== false && body.published !== "false";
    const order = Number(body.order) || Date.now();

    if (!title) {
      sendJson(res, 400, { error: "Donne un titre au cours." });
      return;
    }

    const view = await updateStore((store) => {
      store.courses.push({
        id: makeId("c"),
        title,
        summary,
        support,
        published,
        order,
        createdAt: Date.now(),
      });
      return adminOverview(store);
    });

    sendJson(res, 201, view);
  } catch (error) {
    sendCaught(res, error, "Impossible de créer le cours.");
  }
};
