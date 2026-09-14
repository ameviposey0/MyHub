const emptyClass = () => ({
  students: {},
  courses: [],
  assignments: [],
  submissions: {},
});

const makeId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const seedBootcamp = (data) => {
  if (data.courses.length) return data;
  data.courses.push({
    id: "c_jour1",
    title: "Jour 1. Réseaux et web",
    summary:
      "Comment une page arrive jusqu’à toi, et comment tu en crées une.",
    support: "supports/jour-1-apprenants.pdf",
    published: true,
    order: 1,
    createdAt: Date.now(),
  });
  data.assignments.push({
    id: "a_vitrine",
    courseId: "c_jour1",
    title: "Mini exo : ta vitrine",
    brief:
      "Dépose ta page index.html : prénom, un texte, une liste, un lien WhatsApp.",
    createdAt: Date.now(),
  });
  return data;
};

const migrateOldCopies = (data) => {
  for (const [key, student] of Object.entries(data.students)) {
    const old = student.submissions?.jour1;
    const copyKey = `${key}|a_vitrine`;
    if (old && (old.html || old.content) && !data.submissions[copyKey]) {
      data.submissions[copyKey] = {
        studentKey: key,
        assignmentId: "a_vitrine",
        courseId: "c_jour1",
        content: old.html || old.content,
        filename: old.filename || "index.html",
        link: old.whatsapp || old.link || "",
        at: old.at || Date.now(),
      };
    }
  }
  return data;
};

const normalizeStore = (raw) => {
  if (!raw || typeof raw !== "object") return seedBootcamp(emptyClass());

  if (raw.students && typeof raw.students === "object") {
    return seedBootcamp(
      migrateOldCopies({
        students: raw.students,
        courses: Array.isArray(raw.courses) ? raw.courses : [],
        assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
        submissions:
          raw.submissions && typeof raw.submissions === "object"
            ? raw.submissions
            : {},
      }),
    );
  }

  const students = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value && value.prenom && value.phone) students[key] = value;
  }
  return seedBootcamp(migrateOldCopies({ ...emptyClass(), students }));
};

const publicStudent = (student) =>
  student
    ? {
        prenom: student.prenom,
        nom: student.nom,
        phone: student.phone,
      }
    : null;

const studentView = (data, studentKey) => {
  const student = data.students[studentKey];
  const courses = [...data.courses]
    .filter((course) => course.published)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);

  const viewCourses = courses.map((course) => {
    const works = data.assignments
      .filter((item) => item.courseId === course.id)
      .map((item) => {
        const copy = data.submissions[`${studentKey}|${item.id}`];
        return {
          id: item.id,
          title: item.title,
          brief: item.brief || "",
          submitted: Boolean(copy),
          submittedAt: copy?.at || null,
          filename: copy?.filename || "",
          link: copy?.link || "",
        };
      });
    return {
      id: course.id,
      title: course.title,
      summary: course.summary || "",
      support: course.support || "",
      assignments: works,
    };
  });

  const total = viewCourses.reduce((sum, course) => sum + course.assignments.length, 0);
  const done = viewCourses.reduce(
    (sum, course) => sum + course.assignments.filter((item) => item.submitted).length,
    0,
  );

  return {
    student: publicStudent(student),
    courses: viewCourses,
    done,
    total,
  };
};

const adminOverview = (data) => {
  const students = Object.entries(data.students).map(([key, student]) => ({
    key,
    prenom: student.prenom,
    nom: student.nom,
    phone: student.phone,
    createdAt: student.createdAt || 0,
  }));

  const copies = Object.entries(data.submissions).map(([id, copy]) => {
    const student = data.students[copy.studentKey] || {};
    const work = data.assignments.find((item) => item.id === copy.assignmentId);
    const course = data.courses.find((item) => item.id === copy.courseId);
    return {
      id,
      at: copy.at,
      filename: copy.filename || "",
      link: copy.link || "",
      prenom: student.prenom || "",
      nom: student.nom || "",
      phone: student.phone || "",
      assignmentTitle: work?.title || copy.assignmentId,
      courseTitle: course?.title || "",
    };
  });

  copies.sort((a, b) => b.at - a.at);
  students.sort((a, b) => b.createdAt - a.createdAt);

  return {
    students,
    courses: [...data.courses].sort((a, b) => (a.order || 0) - (b.order || 0)),
    assignments: data.assignments,
    copies,
  };
};

module.exports = {
  makeId,
  normalizeStore,
  publicStudent,
  studentView,
  adminOverview,
};
