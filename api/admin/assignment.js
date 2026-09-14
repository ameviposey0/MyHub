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
    const courseId = String(body.courseId || "").trim();
    const title = String(body.title || "").trim().slice(0, 80);
    const brief = String(body.brief || "").trim().slice(0, 800);

    if (!title) {
      sendJson(res, 400, { error: "Donne un titre au devoir." });
      return;
    }

    const view = await updateStore((store) => {
      const course = store.courses.find((item) => item.id === courseId);
      if (!course) {
        const error = new Error("missing-course");
        error.status = 400;
        throw error;
      }
      store.assignments.push({
        id: makeId("a"),
        courseId,
        title,
        brief,
        createdAt: Date.now(),
      });
      return adminOverview(store);
    });

    sendJson(res, 201, view);
  } catch (error) {
    if (error.status === 400) {
      sendJson(res, 400, { error: "Choisis un cours existant." });
      return;
    }
    sendCaught(res, error, "Impossible de créer le devoir.");
  }
};
