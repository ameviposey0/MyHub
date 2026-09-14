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
    const action = String(body.action || "create");
    const id = String(body.id || "").trim();
    const courseId = String(body.courseId || "").trim();
    const title = String(body.title || "").trim().slice(0, 80);
    const brief = String(body.brief || "").trim().slice(0, 800);
    const dueAt = String(body.dueAt || "").trim().slice(0, 32);

    const view = await updateStore((store) => {
      if (action === "delete") {
        const work = store.assignments.find((item) => item.id === id);
        if (!work) {
          const error = new Error("missing");
          error.status = 400;
          throw error;
        }
        store.assignments = store.assignments.filter((item) => item.id !== id);
        return adminOverview(store);
      }

      if (!title) {
        const error = new Error("title");
        error.status = 400;
        throw error;
      }

      const course = store.courses.find((item) => item.id === courseId);
      if (!course) {
        const error = new Error("course");
        error.status = 400;
        throw error;
      }

      if (action === "update" || id) {
        const work = store.assignments.find((item) => item.id === id);
        if (!work) {
          const error = new Error("missing");
          error.status = 400;
          throw error;
        }
        work.courseId = courseId;
        work.title = title;
        work.brief = brief;
        work.dueAt = dueAt;
        return adminOverview(store);
      }

      store.assignments.push({
        id: makeId("a"),
        courseId,
        title,
        brief,
        dueAt,
        createdAt: Date.now(),
      });
      return adminOverview(store);
    });

    sendJson(res, action === "create" && !id ? 201 : 200, view);
  } catch (error) {
    if (error.status === 400) {
      const messages = {
        title: "Donne un titre au devoir.",
        course: "Choisis un cours existant.",
        missing: "Devoir introuvable.",
      };
      sendJson(res, 400, { error: messages[error.message] || "Devoir impossible." });
      return;
    }
    sendCaught(res, error, "Impossible d’enregistrer le devoir.");
  }
};
