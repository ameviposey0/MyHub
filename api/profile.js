const { readBody, sendJson, sendCaught } = require("../lib/http");
const { studentView } = require("../lib/class");
const { updateStore } = require("../lib/store");
const { readSession } = require("../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }

  const session = readSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Connecte-toi." });
    return;
  }

  try {
    const body = await readBody(req);
    const nom = String(body.nom || "").trim().slice(0, 80);
    if (!nom) {
      sendJson(res, 400, { error: "Indique ton nom." });
      return;
    }

    const view = await updateStore((store) => {
      const student = store.students[session.key];
      if (!student) {
        const error = new Error("missing");
        error.status = 401;
        throw error;
      }
      student.nom = nom;
      return studentView(store, session.key);
    });

    sendJson(res, 200, view);
  } catch (error) {
    sendCaught(res, error, "Profil impossible à mettre à jour.");
  }
};
