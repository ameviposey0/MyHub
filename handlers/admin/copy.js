const { sendJson, sendCaught } = require("../../lib/http");
const { readAdminSession } = require("../../lib/session");
const { readStore } = require("../../lib/store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Méthode non autorisée." });
    return;
  }
  if (!readAdminSession(req)) {
    sendJson(res, 401, { error: "Espace admin : connecte-toi." });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const id = String(req.query?.id || url.searchParams.get("id") || "").trim();
  if (!id) {
    sendJson(res, 400, { error: "Copie introuvable." });
    return;
  }

  try {
    const store = await readStore();
    const copy = store.submissions[id];
    if (!copy) {
      sendJson(res, 404, { error: "Copie introuvable." });
      return;
    }
    const student = store.students[copy.studentKey] || {};
    const work = store.assignments.find((item) => item.id === copy.assignmentId);
    const course = store.courses.find((item) => item.id === copy.courseId);
    sendJson(res, 200, {
      id,
      content: copy.content || "",
      filename: copy.filename || "rendu.txt",
      link: copy.link || "",
      feedback: copy.feedback || "",
      grade: copy.grade || "",
      reviewedAt: copy.reviewedAt || null,
      at: copy.at,
      prenom: student.prenom || "",
      nom: student.nom || "",
      phone: student.phone || "",
      assignmentTitle: work?.title || "",
      courseTitle: course?.title || "",
    });
  } catch (error) {
    sendCaught(res, error, "Impossible d’ouvrir cette copie.");
  }
};
