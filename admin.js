const gate = document.getElementById("gate");
const desk = document.getElementById("desk");
const loginForm = document.getElementById("admin-login");
const loginError = document.getElementById("admin-error");
const statsEl = document.getElementById("admin-stats");
const courseForm = document.getElementById("course-form");
const workForm = document.getElementById("work-form");
const courseSelect = document.getElementById("work-course");
const dialog = document.getElementById("copy-dialog");
const frame = document.getElementById("copy-dialog-frame");
const codeEl = document.getElementById("copy-dialog-code");

let snapshot = { students: [], courses: [], assignments: [], copies: [] };
let openCopy = null;

const when = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const showGate = () => {
  desk.hidden = true;
  gate.hidden = false;
};

const showDesk = () => {
  gate.hidden = true;
  desk.hidden = false;
};

const card = (title, lines) => {
  const article = document.createElement("article");
  article.className = "admin-item";
  const heading = document.createElement("h4");
  heading.textContent = title;
  article.append(heading);
  lines.filter(Boolean).forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    article.append(p);
  });
  return article;
};

const paint = (data) => {
  snapshot = data;
  statsEl.textContent = `${data.students.length} étudiant${data.students.length > 1 ? "s" : ""} · ${data.courses.length} cours · ${data.copies.length} copie${data.copies.length > 1 ? "s" : ""}`;

  const courseList = document.getElementById("course-list");
  courseList.replaceChildren();
  if (!data.courses.length) {
    courseList.textContent = "Aucun cours pour l’instant.";
  } else {
    data.courses.forEach((course) => {
      courseList.append(
        card(course.title, [
          course.summary,
          course.published ? "Visible pour les étudiants" : "Masqué",
          course.support ? `Support : ${course.support}` : "",
        ]),
      );
    });
  }

  courseSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = data.courses.length ? "Choisir un cours" : "Crée un cours d’abord";
  courseSelect.append(placeholder);
  data.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    courseSelect.append(option);
  });

  const workList = document.getElementById("work-list");
  workList.replaceChildren();
  if (!data.assignments.length) {
    workList.textContent = "Aucun devoir pour l’instant.";
  } else {
    data.assignments.forEach((work) => {
      const course = data.courses.find((item) => item.id === work.courseId);
      workList.append(
        card(work.title, [course ? course.title : "", work.brief]),
      );
    });
  }

  const copyList = document.getElementById("copy-list");
  copyList.replaceChildren();
  if (!data.copies.length) {
    copyList.textContent = "Personne n’a encore déposé.";
  } else {
    data.copies.forEach((copy) => {
      const article = card(
        `${copy.prenom} ${copy.nom}`,
        [copy.courseTitle, copy.assignmentTitle, when(copy.at), copy.filename],
      );
      const button = document.createElement("button");
      button.className = "text-link";
      button.type = "button";
      button.textContent = "Ouvrir la copie";
      button.addEventListener("click", () => openCopyView(copy.id));
      article.append(button);
      copyList.append(article);
    });
  }

  const studentList = document.getElementById("student-list");
  studentList.replaceChildren();
  if (!data.students.length) {
    studentList.textContent = "Aucun étudiant inscrit.";
  } else {
    data.students.forEach((student) => {
      studentList.append(
        card(`${student.prenom} ${student.nom}`, [student.phone]),
      );
    });
  }
};

const loadOverview = async () => {
  const data = await api("/api/admin/overview");
  paint(data);
};

const openCopyView = async (id) => {
  const copy = await api(`/api/admin/copy?id=${encodeURIComponent(id)}`);
  openCopy = copy;
  document.getElementById("copy-dialog-title").textContent = copy.assignmentTitle || "Rendu";
  document.getElementById("copy-dialog-meta").textContent =
    `${copy.prenom} ${copy.nom} · ${copy.courseTitle} · ${when(copy.at)}`;
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(copy.content || "");
  codeEl.hidden = looksHtml;
  frame.hidden = !looksHtml;
  if (looksHtml) {
    frame.srcdoc = copy.content;
    codeEl.textContent = "";
  } else {
    frame.removeAttribute("srcdoc");
    codeEl.textContent = copy.content || "";
  }
  const linkWrap = document.getElementById("copy-dialog-link");
  linkWrap.replaceChildren();
  if (copy.link) {
    const a = document.createElement("a");
    a.href = copy.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = copy.link;
    linkWrap.append(a);
  }
  dialog.showModal();
};

document.getElementById("copy-download")?.addEventListener("click", () => {
  if (!openCopy?.content) return;
  const type = /\.html?$/i.test(openCopy.filename || "")
    ? "text/html;charset=utf-8"
    : "text/plain;charset=utf-8";
  const blob = new Blob([openCopy.content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = openCopy.filename || "rendu.txt";
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll(".dash-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.getAttribute("data-tab");
    document.querySelectorAll(".dash-tabs button").forEach((item) => {
      const selected = item === button;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-panel") !== tab;
    });
  });
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(loginError, "");
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: { password: loginForm.elements.namedItem("password").value },
    });
    showDesk();
    await loadOverview();
  } catch (error) {
    showError(loginError, error.message);
  }
});

document.getElementById("admin-logout")?.addEventListener("click", async () => {
  try {
    await api("/api/admin/logout", { method: "POST" });
  } catch {
    /* still leave */
  }
  loginForm?.reset();
  showGate();
});

courseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById("course-error");
  showError(errorEl, "");
  try {
    const data = await api("/api/admin/course", {
      method: "POST",
      body: {
        title: courseForm.elements.namedItem("title").value,
        summary: courseForm.elements.namedItem("summary").value,
        support: courseForm.elements.namedItem("support").value,
        published: document.getElementById("course-published").checked,
      },
    });
    courseForm.reset();
    document.getElementById("course-published").checked = true;
    paint(data);
  } catch (error) {
    showError(errorEl, error.message);
  }
});

workForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById("work-error");
  showError(errorEl, "");
  try {
    const data = await api("/api/admin/assignment", {
      method: "POST",
      body: {
        courseId: workForm.elements.namedItem("courseId").value,
        title: workForm.elements.namedItem("title").value,
        brief: workForm.elements.namedItem("brief").value,
      },
    });
    workForm.reset();
    paint(data);
  } catch (error) {
    showError(errorEl, error.message);
  }
});

api("/api/admin/me")
  .then(async () => {
    showDesk();
    await loadOverview();
  })
  .catch(showGate);
