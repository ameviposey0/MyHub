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
    const assignmentId = String(body.assignmentId || "").trim();
    const content = String(body.content || body.html || "").trim();
    const filename = String(body.filename || "rendu.txt").slice(0, 80);
    const link = String(body.link || body.whatsapp || "").trim();

    if (!assignmentId) {
      sendJson(res, 400, { error: "Choisis le devoir à déposer." });
      return;
    }
    if (content.length > 200000) {
      sendJson(res, 400, { error: "Le rendu est trop lourd." });
      return;
    }
    if (!content && !link) {
      sendJson(res, 400, { error: "Ajoute un fichier, colle ton rendu, ou un lien https." });
      return;
    }
    if (link && !/^https:\/\//i.test(link)) {
      sendJson(res, 400, { error: "Le lien doit commencer par https://" });
      return;
    }

    const view = await updateStore((store) => {
      const student = store.students[session.key];
      if (!student) {
        const error = new Error("missing");
        error.status = 401;
        throw error;
      }
      const work = store.assignments.find((item) => item.id === assignmentId);
      const course = work
        ? store.courses.find((item) => item.id === work.courseId && item.published)
        : null;
      if (!work || !course) {
        const error = new Error("missing-work");
        error.status = 400;
        throw error;
      }
      store.submissions[`${session.key}|${assignmentId}`] = {
        studentKey: session.key,
        assignmentId,
        courseId: course.id,
        content,
        filename,
        link,
        at: Date.now(),
      };
      return studentView(store, session.key);
    });

    sendJson(res, 200, view);
  } catch (error) {
    if (error.status === 400) {
      sendJson(res, 400, { error: "Ce devoir n’est pas ouvert." });
      return;
    }
    sendCaught(res, error, "Dépôt impossible pour le moment.");
  }
};
