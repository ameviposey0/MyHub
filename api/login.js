const { readBody, sendJson, sendCaught } = require("../lib/http");
const { findKey } = require("../lib/keys");
const { publicStudent } = require("../lib/class");
const { readStore } = require("../lib/store");
const { writeSession } = require("../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }

  try {
    const body = await readBody(req);
    const store = await readStore();
    const key = findKey(store.students, body.prenom, body.phone);

    if (!key) {
      sendJson(res, 401, {
        error: "Aucun espace pour ce prénom et ce numéro. Crée un espace d’abord.",
      });
      return;
    }

    writeSession(res, key);
    sendJson(res, 200, { student: publicStudent(store.students[key]) });
  } catch (error) {
    sendCaught(res, error, "Connexion impossible pour le moment.");
  }
};
