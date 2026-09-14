const { readBody, sendJson, sendCaught } = require("../../lib/http");
const { readAdminSession } = require("../../lib/session");
const { updateStore } = require("../../lib/store");
const { makeId, adminOverview } = require("../../lib/class");

const readCourseFields = (body) => ({
  title: String(body.title || "").trim().slice(0, 80),
  summary: String(body.summary || "").trim().slice(0, 400),
  support: String(body.support || "").trim().slice(0, 200),
  meet: String(body.meet || "").trim().slice(0, 200),
  published: body.published !== false && body.published !== "false",
  order: Number(body.order) || Date.now(),
});

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

    const view = await updateStore((store) => {
      if (action === "delete") {
        const course = store.courses.find((item) => item.id === id);
        if (!course) {
          const error = new Error("missing");
          error.status = 400;
          throw error;
        }
        store.courses = store.courses.filter((item) => item.id !== id);
        store.assignments = store.assignments.filter((item) => item.courseId !== id);
        return adminOverview(store);
      }

      const fields = readCourseFields(body);
      if (action !== "toggle" && !fields.title) {
        const error = new Error("title");
        error.status = 400;
        throw error;
      }

      if (action === "update" || (id && action === "create")) {
        const course = store.courses.find((item) => item.id === id);
        if (!course) {
          const error = new Error("missing");
          error.status = 400;
          throw error;
        }
        Object.assign(course, fields);
        return adminOverview(store);
      }

      if (action === "toggle") {
        const course = store.courses.find((item) => item.id === id);
        if (!course) {
          const error = new Error("missing");
          error.status = 400;
          throw error;
        }
        course.published = !course.published;
        return adminOverview(store);
      }

      store.courses.push({
        id: makeId("c"),
        ...fields,
        createdAt: Date.now(),
      });
      return adminOverview(store);
    });

    sendJson(res, action === "create" && !id ? 201 : 200, view);
  } catch (error) {
    if (error.status === 400) {
      sendJson(res, 400, {
        error:
          error.message === "title"
            ? "Donne un titre au cours."
            : "Cours introuvable.",
      });
      return;
    }
    sendCaught(res, error, "Impossible d’enregistrer le cours.");
  }
};
