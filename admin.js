const TITLES = {
  vue: { title: "Vue", lead: "Étudiants, copies à relire, activité du bootcamp." },
  cours: { title: "Cours", lead: "Crée, masque ou corrige un cours." },
  devoirs: { title: "Devoirs", lead: "Lie chaque exo à un cours." },
  copies: { title: "Copies", lead: "Lis, télécharge, envoie un retour." },
  etudiants: { title: "Étudiants", lead: "Les comptes inscrits." },
  annonces: { title: "Annonces", lead: "Messages visibles dans l’espace étudiant." },
};

const gate = document.getElementById("gate");
const desk = document.getElementById("desk");
const loginForm = document.getElementById("admin-login");
const loginError = document.getElementById("admin-error");
const courseForm = document.getElementById("course-form");
const workForm = document.getElementById("work-form");
const courseSelect = document.getElementById("work-course");
const dialog = document.getElementById("copy-dialog");
const frame = document.getElementById("copy-dialog-frame");
const codeEl = document.getElementById("copy-dialog-code");

let snapshot = { students: [], courses: [], assignments: [], copies: [], announcements: [], pending: 0 };
let openCopy = null;
const drawer = bindDrawer(
  document.getElementById("hub-toggle"),
  document.getElementById("hub-backdrop"),
);

const currentView = () => {
  const hash = (location.hash || "#vue").slice(1);
  return TITLES[hash] ? hash : "vue";
};

const go = (name) => {
  if (location.hash.slice(1) !== name) location.hash = name;
  showView(name, TITLES);
  drawer.close();
};

const showGate = () => {
  desk.hidden = true;
  gate.hidden = false;
  document.body.classList.remove("hub");
};

const showDesk = () => {
  gate.hidden = true;
  desk.hidden = false;
  document.body.classList.add("hub");
  showView(currentView(), TITLES);
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const actions = (pairs) => {
  const wrap = el("div", "hub-actions");
  pairs.forEach(([label, onClick, className]) => {
    const button = el("button", className || "text-link", label);
    button.type = "button";
    button.addEventListener("click", onClick);
    wrap.append(button);
  });
  return wrap;
};

const fillCourseSelect = () => {
  courseSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = snapshot.courses.length ? "Choisir un cours" : "Crée un cours d’abord";
  courseSelect.append(placeholder);
  snapshot.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    courseSelect.append(option);
  });
};

const resetCourseForm = () => {
  courseForm.reset();
  document.getElementById("course-id").value = "";
  document.getElementById("course-published").checked = true;
  document.getElementById("course-form-title").textContent = "Créer un cours";
};

const resetWorkForm = () => {
  const selected = courseSelect.value;
  workForm.reset();
  document.getElementById("work-id").value = "";
  fillCourseSelect();
  if ([...courseSelect.options].some((option) => option.value === selected)) {
    courseSelect.value = selected;
  }
  document.getElementById("work-form-title").textContent = "Créer un devoir";
};

const paintVue = () => {
  const grid = document.getElementById("admin-stats-grid");
  grid.replaceChildren();
  [
    [`${snapshot.students.length}`, "Étudiants"],
    [`${snapshot.courses.length}`, "Cours"],
    [`${snapshot.copies.length}`, "Copies"],
    [`${snapshot.pending}`, "À relire"],
  ].forEach(([value, label]) => {
    const card = el("article", "stat-card");
    card.append(el("b", "", value), el("span", "", label));
    grid.append(card);
  });

  const pending = document.getElementById("pending-list");
  pending.replaceChildren();
  const todo = snapshot.copies.filter((copy) => copy.status === "submitted").slice(0, 8);
  if (!todo.length) {
    pending.append(el("p", "dash-empty", "Rien en attente."));
    return;
  }
  todo.forEach((copy) => pending.append(copyCard(copy)));
};

const paintCourses = () => {
  const list = document.getElementById("course-list");
  list.replaceChildren();
  if (!snapshot.courses.length) {
    list.append(el("p", "dash-empty", "Aucun cours pour l’instant."));
    return;
  }
  snapshot.courses.forEach((course) => {
    const article = el("article", "admin-item");
    article.append(el("h3", "", course.title));
    if (course.summary) article.append(el("p", "", course.summary));
    article.append(el("p", "", course.published ? "Visible pour les étudiants" : "Masqué"));
    if (course.support) article.append(el("p", "", `Support : ${course.support}`));
    article.append(
      actions([
        ["Modifier", () => {
          document.getElementById("course-id").value = course.id;
          document.getElementById("course-title").value = course.title;
          document.getElementById("course-summary").value = course.summary || "";
          document.getElementById("course-support").value = course.support || "";
          document.getElementById("course-meet").value = course.meet || "";
          document.getElementById("course-published").checked = Boolean(course.published);
          document.getElementById("course-form-title").textContent = "Modifier le cours";
          go("cours");
        }],
        [course.published ? "Masquer" : "Publier", () =>
          sendCourse({ action: "toggle", id: course.id })],
        ["Supprimer", () => {
          if (window.confirm(`Supprimer « ${course.title} » et ses devoirs ?`)) {
            sendCourse({ action: "delete", id: course.id });
          }
        }],
      ]),
    );
    list.append(article);
  });
};

const paintWorks = () => {
  fillCourseSelect();
  const list = document.getElementById("work-list");
  list.replaceChildren();
  if (!snapshot.assignments.length) {
    list.append(el("p", "dash-empty", "Aucun devoir pour l’instant."));
    return;
  }
  snapshot.assignments.forEach((work) => {
    const course = snapshot.courses.find((item) => item.id === work.courseId);
    const article = el("article", "admin-item");
    article.append(el("h3", "", work.title));
    article.append(el("p", "", course ? course.title : ""));
    if (work.brief) article.append(el("p", "", work.brief));
    if (work.dueAt) article.append(el("p", "", `Limite : ${whenDay(work.dueAt)}`));
    article.append(
      actions([
        ["Modifier", () => {
          document.getElementById("work-id").value = work.id;
          fillCourseSelect();
          courseSelect.value = work.courseId;
          document.getElementById("work-title").value = work.title;
          document.getElementById("work-brief").value = work.brief || "";
          document.getElementById("work-due").value = String(work.dueAt || "").slice(0, 10);
          document.getElementById("work-form-title").textContent = "Modifier le devoir";
          go("devoirs");
        }],
        ["Supprimer", () => {
          if (window.confirm(`Supprimer « ${work.title} » ?`)) {
            sendWork({ action: "delete", id: work.id, courseId: work.courseId, title: work.title });
          }
        }],
      ]),
    );
    list.append(article);
  });
};

const copyCard = (copy) => {
  const article = el("article", "admin-item");
  article.append(el("h3", "", `${copy.prenom} ${copy.nom}`));
  article.append(el("p", "", `${copy.courseTitle} · ${copy.assignmentTitle}`));
  article.append(el("p", "", when(copy.at)));
  article.append(el("p", "work-status", copy.status === "reviewed" ? "Corrigée" : "À relire"));
  const open = el("button", "text-link", "Ouvrir la copie");
  open.type = "button";
  open.addEventListener("click", () => openCopyView(copy.id));
  article.append(open);
  return article;
};

const paintCopies = () => {
  const query = (document.getElementById("copy-search").value || "").trim().toLocaleLowerCase("fr-FR");
  const list = document.getElementById("copy-list");
  list.replaceChildren();
  const copies = snapshot.copies.filter((copy) => {
    if (!query) return true;
    return `${copy.prenom} ${copy.nom} ${copy.courseTitle} ${copy.assignmentTitle}`
      .toLocaleLowerCase("fr-FR")
      .includes(query);
  });
  if (!copies.length) {
    list.append(el("p", "dash-empty", query ? "Aucune copie pour cette recherche." : "Personne n’a encore déposé."));
    return;
  }
  copies.forEach((copy) => list.append(copyCard(copy)));
};

const paintStudents = () => {
  const list = document.getElementById("student-list");
  list.replaceChildren();
  if (!snapshot.students.length) {
    list.append(el("p", "dash-empty", "Aucun étudiant inscrit."));
    return;
  }
  snapshot.students.forEach((student) => {
    const article = el("article", "admin-item");
    article.append(el("h3", "", `${student.prenom} ${student.nom}`));
    article.append(el("p", "", student.phone));
    article.append(el("p", "", `${student.copies} copie${student.copies > 1 ? "s" : ""} · ${student.reviewed} corrigée${student.reviewed > 1 ? "s" : ""}`));
    list.append(article);
  });
};

const paintNotices = () => {
  const list = document.getElementById("notice-list");
  list.replaceChildren();
  if (!snapshot.announcements.length) {
    list.append(el("p", "dash-empty", "Aucune annonce."));
    return;
  }
  snapshot.announcements.forEach((item) => {
    const article = el("article", "admin-item");
    article.append(el("h3", "", item.title));
    article.append(el("p", "", item.body));
    article.append(el("p", "", when(item.createdAt)));
    article.append(
      actions([
        ["Retirer", () => sendNotice({ action: "delete", id: item.id })],
      ]),
    );
    list.append(article);
  });
};

const paint = (data) => {
  snapshot = data;
  fillCourseSelect();
  paintVue();
  paintCourses();
  paintWorks();
  paintCopies();
  paintStudents();
  paintNotices();
};

const loadOverview = async () => {
  paint(await api("/api/admin/overview"));
};

const sendCourse = async (body) => {
  const errorEl = document.getElementById("course-error");
  showError(errorEl, "");
  try {
    paint(await api("/api/admin/course", { method: "POST", body }));
    if (body.action !== "toggle") resetCourseForm();
  } catch (error) {
    showError(errorEl, error.message);
  }
};

const sendWork = async (body) => {
  const errorEl = document.getElementById("work-error");
  showError(errorEl, "");
  try {
    paint(await api("/api/admin/assignment", { method: "POST", body }));
    if (body.action !== "delete") resetWorkForm();
  } catch (error) {
    showError(errorEl, error.message);
  }
};

const sendNotice = async (body) => {
  const errorEl = document.getElementById("notice-error");
  showError(errorEl, "");
  try {
    paint(await api("/api/admin/notice", { method: "POST", body }));
    if (body.action !== "delete") document.getElementById("notice-form").reset();
  } catch (error) {
    showError(errorEl, error.message);
  }
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
  document.getElementById("review-grade").value = copy.grade || "";
  document.getElementById("review-feedback").value = copy.feedback || "";
  showError(document.getElementById("review-error"), "");
  document.getElementById("review-ok").hidden = true;
  dialog.showModal();
};

document.getElementById("copy-search")?.addEventListener("input", paintCopies);

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => go(button.getAttribute("data-go")));
});

window.addEventListener("hashchange", () => {
  if (!desk.hidden) showView(currentView(), TITLES);
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
  const id = document.getElementById("course-id").value;
  await sendCourse({
    action: id ? "update" : "create",
    id,
    title: courseForm.elements.namedItem("title").value,
    summary: courseForm.elements.namedItem("summary").value,
    support: courseForm.elements.namedItem("support").value,
    meet: courseForm.elements.namedItem("meet").value,
    published: document.getElementById("course-published").checked,
  });
});

document.getElementById("course-reset")?.addEventListener("click", resetCourseForm);

workForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.getElementById("work-id").value;
  await sendWork({
    action: id ? "update" : "create",
    id,
    courseId: workForm.elements.namedItem("courseId").value,
    title: workForm.elements.namedItem("title").value,
    brief: workForm.elements.namedItem("brief").value,
    dueAt: workForm.elements.namedItem("dueAt").value,
  });
});

document.getElementById("work-reset")?.addEventListener("click", resetWorkForm);

document.getElementById("notice-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await sendNotice({
    action: "create",
    title: event.target.elements.namedItem("title").value,
    body: event.target.elements.namedItem("body").value,
  });
});

document.getElementById("review-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!openCopy) return;
  const errorEl = document.getElementById("review-error");
  const okEl = document.getElementById("review-ok");
  showError(errorEl, "");
  okEl.hidden = true;
  try {
    paint(
      await api("/api/admin/review", {
        method: "POST",
        body: {
          id: openCopy.id,
          grade: event.target.elements.namedItem("grade").value,
          feedback: event.target.elements.namedItem("feedback").value,
        },
      }),
    );
    okEl.hidden = false;
    okEl.textContent = "Retour envoyé à l’étudiant.";
  } catch (error) {
    showError(errorEl, error.message);
  }
});

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

api("/api/admin/me")
  .then(async () => {
    showDesk();
    await loadOverview();
  })
  .catch(showGate);
