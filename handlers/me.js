const { sendJson, sendCaught } = require("../lib/http");
const { studentView } = require("../lib/class");
const { readStore } = require("../lib/store");
const { readSession } = require("../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }

  const session = readSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Connecte-toi." });
    return;
  }

  try {
    const store = await readStore();
    if (!store.students[session.key]) {
      sendJson(res, 401, { error: "Connecte-toi." });
      return;
    }
    sendJson(res, 200, studentView(store, session.key));
  } catch (error) {
    sendCaught(res, error, "Espace indisponible pour le moment.");
  }
};
