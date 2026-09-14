const { readBody, sendJson } = require("../../lib/http");
const { passwordMatches, writeAdminSession } = require("../../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }

  try {
    const body = await readBody(req);
    if (!passwordMatches(body.password || "")) {
      sendJson(res, 401, { error: "Mot de passe incorrect." });
      return;
    }
    writeAdminSession(res);
    sendJson(res, 200, { ok: true });
  } catch {
    sendJson(res, 500, { error: "Connexion admin impossible." });
  }
};
