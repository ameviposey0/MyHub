const { sendJson, sendCaught } = require("../../lib/http");
const { readAdminSession } = require("../../lib/session");
const { readStore } = require("../../lib/store");
const { adminOverview } = require("../../lib/class");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }
  if (!readAdminSession(req)) {
    sendJson(res, 401, { error: "Espace admin : connecte-toi." });
    return;
  }

  try {
    const store = await readStore();
    sendJson(res, 200, adminOverview(store));
  } catch (error) {
    sendCaught(res, error, "Aperçu admin indisponible.");
  }
};
