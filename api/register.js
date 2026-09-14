const { readBody, sendJson, sendCaught } = require("../lib/http");
const { publicStudent } = require("../lib/class");
const { foldPhone, studentKey, findKey } = require("../lib/keys");
const { updateStore } = require("../lib/store");
const { writeSession } = require("../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }

  try {
    const body = await readBody(req);
    const prenom = String(body.prenom || "").trim();
    const nom = String(body.nom || "").trim();
    const phone = foldPhone(body.phone);

    if (!prenom || !nom) {
      sendJson(res, 400, { error: "Indique ton prénom et ton nom." });
      return;
    }
    if (phone.length < 8) {
      sendJson(res, 400, { error: "Indique un numéro de téléphone valide." });
      return;
    }

    const key = studentKey(prenom, phone);

    const created = await updateStore((store) => {
      if (findKey(store.students, prenom, phone) || store.students[key]) {
        const error = new Error("exists");
        error.status = 409;
        throw error;
      }
      store.students[key] = {
        prenom,
        nom,
        phone,
        createdAt: Date.now(),
      };
      return store.students[key];
    });

    writeSession(res, key);
    sendJson(res, 201, { student: publicStudent(created) });
  } catch (error) {
    sendCaught(res, error, "Inscription impossible pour le moment.");
  }
};
