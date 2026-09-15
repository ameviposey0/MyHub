const emptyClass = () => ({
  students: {},
  courses: [],
  assignments: [],
  submissions: {},
  announcements: [],
});

const makeId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const BOOTCAMP_COURSES = [
  {
    id: "c_jour1",
    title: "Jour 1. Réseaux et web",
    summary: "Comment une page arrive jusqu’à toi, et comment tu en crées une.",
    support: "supports/jour-1-apprenants.pdf",
    meet: "",
    published: true,
    order: 1,
  },
  {
    id: "c_jour2",
    title: "Jour 2. Pseudo-code et Python",
    summary: "Quatre gestes en pseudo-code, puis les mêmes en Python.",
    support: "supports/jour-2-apprenants.pdf",
    meet: "",
    published: true,
    order: 2,
  },
];

const BOOTCAMP_ASSIGNMENTS = [
  {
    id: "a_vitrine",
    courseId: "c_jour1",
    title: "Mini exo : ta vitrine",
    brief: "Dépose ta page index.html : prénom, un texte, une liste, un lien WhatsApp.",
    dueAt: "",
  },
  {
    id: "a_bio_python",
    courseId: "c_jour2",
    title: "Mini exo : du pseudo-code au Python",
    brief: "Dépose decision.py : le pseudo-code en commentaires, puis le programme qui compare un prix et une somme.",
    dueAt: "",
  },
];

const seedBootcamp = (data) => {
  if (!Array.isArray(data.announcements)) data.announcements = [];
  for (const course of BOOTCAMP_COURSES) {
    const existing = data.courses.find((item) => item.id === course.id);
    if (existing) {
      if (course.id === "c_jour2") {
        existing.title = course.title;
        existing.summary = course.summary;
        existing.support = course.support;
        existing.order = course.order;
      }
    } else {
      data.courses.push({ ...course, createdAt: Date.now() });
    }
  }
  for (const work of BOOTCAMP_ASSIGNMENTS) {
    const existing = data.assignments.find((item) => item.id === work.id);
    if (existing) {
      if (work.id === "a_bio_python") {
        existing.title = work.title;
        existing.brief = work.brief;
      }
    } else {
      data.assignments.push({ ...work, createdAt: Date.now() });
    }
  }
  if (!data.announcements.length) {
    data.announcements.push({
      id: "n_welcome",
      title: "Bienvenue dans l’espace bootcamp",
      body: "Les séances sont en visio Google Meet, tous les jours à 12 h GMT. Le lien arrive 15 min avant. Dépose tes devoirs ici, pas sur WhatsApp.",
      createdAt: Date.now(),
    });
  }
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
        feedback: "",
        grade: "",
        reviewedAt: null,
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
        announcements: Array.isArray(raw.announcements) ? raw.announcements : [],
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

const workStatus = (copy) => {
  if (!copy) return "open";
  if (copy.reviewedAt) return "reviewed";
  return "submitted";
};

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
          courseId: course.id,
          courseTitle: course.title,
          title: item.title,
          brief: item.brief || "",
          dueAt: item.dueAt || "",
          submitted: Boolean(copy),
          submittedAt: copy?.at || null,
          filename: copy?.filename || "",
          link: copy?.link || "",
          feedback: copy?.feedback || "",
          grade: copy?.grade || "",
          reviewedAt: copy?.reviewedAt || null,
          status: workStatus(copy),
        };
      });
    const done = works.filter((item) => item.submitted).length;
    return {
      id: course.id,
      title: course.title,
      summary: course.summary || "",
      support: course.support || "",
      meet: course.meet || "",
      assignments: works,
      done,
      total: works.length,
    };
  });

  const assignments = viewCourses.flatMap((course) => course.assignments);
  const copies = assignments.filter((item) => item.submitted);
  const total = assignments.length;
  const done = copies.length;
  const reviewed = copies.filter((item) => item.status === "reviewed").length;
  const nextWork = assignments.find((item) => !item.submitted) || null;
  const announcements = [...(data.announcements || [])].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
  );

  return {
    student: publicStudent(student),
    courses: viewCourses,
    assignments,
    copies,
    announcements,
    nextWork,
    done,
    total,
    reviewed,
  };
};

const adminOverview = (data) => {
  const assignments = data.assignments;
  const students = Object.entries(data.students).map(([key, student]) => {
    const copies = Object.values(data.submissions).filter((copy) => copy.studentKey === key);
    return {
      key,
      prenom: student.prenom,
      nom: student.nom,
      phone: student.phone,
      createdAt: student.createdAt || 0,
      copies: copies.length,
      reviewed: copies.filter((copy) => copy.reviewedAt).length,
    };
  });

  const copies = Object.entries(data.submissions).map(([id, copy]) => {
    const student = data.students[copy.studentKey] || {};
    const work = assignments.find((item) => item.id === copy.assignmentId);
    const course = data.courses.find((item) => item.id === copy.courseId);
    return {
      id,
      at: copy.at,
      filename: copy.filename || "",
      link: copy.link || "",
      feedback: copy.feedback || "",
      grade: copy.grade || "",
      reviewedAt: copy.reviewedAt || null,
      status: workStatus(copy),
      prenom: student.prenom || "",
      nom: student.nom || "",
      phone: student.phone || "",
      studentKey: copy.studentKey,
      assignmentId: copy.assignmentId,
      assignmentTitle: work?.title || copy.assignmentId,
      courseTitle: course?.title || "",
    };
  });

  copies.sort((a, b) => b.at - a.at);
  students.sort((a, b) => b.createdAt - a.createdAt);

  const pending = copies.filter((copy) => copy.status === "submitted").length;

  return {
    students,
    courses: [...data.courses].sort((a, b) => (a.order || 0) - (b.order || 0)),
    assignments,
    copies,
    announcements: [...(data.announcements || [])].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    ),
    pending,
  };
};

module.exports = {
  makeId,
  normalizeStore,
  publicStudent,
  studentView,
  adminOverview,
};
