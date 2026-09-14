const { sendJson } = require("../../lib/http");
const { readAdminSession } = require("../../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }
  if (!readAdminSession(req)) {
    sendJson(res, 401, { error: "Espace admin : connecte-toi." });
    return;
  }
  sendJson(res, 200, { ok: true });
};
