const { sendJson } = require("../../lib/http");
const { clearAdminSession } = require("../../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }
  clearAdminSession(res);
  sendJson(res, 200, { ok: true });
};
