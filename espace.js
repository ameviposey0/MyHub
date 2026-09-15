const TITLES = {
  accueil: { title: "Tableau de bord", lead: "Ta progression, tes cours, tes prochains devoirs." },
  cours: { title: "Cours", lead: "Tes séances, supports et avancement par cours." },
  devoirs: { title: "Devoirs", lead: "Dépose tes exos, cours par cours." },
  copies: { title: "Mes copies", lead: "Tes dépôts et le retour du formateur." },
  infos: { title: "Infos", lead: "Meet, horaires, contact." },
  profil: { title: "Profil", lead: "Tes informations de compte." },
};

let snapshot = null;
const drawer = bindDrawer(
  document.getElementById("hub-toggle"),
  document.getElementById("hub-backdrop"),
);

const currentView = () => {
  const hash = (location.hash || "#accueil").slice(1);
  return TITLES[hash] ? hash : "accueil";
};

const go = (name) => {
  if (location.hash.slice(1) !== name) location.hash = name;
  showView(name, TITLES);
  drawer.close();
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const statusLabel = (work) => {
  if (work.status === "reviewed") return work.grade ? `Corrigé · ${work.grade}` : "Corrigé";
  if (work.submitted) return `Déposé${work.submittedAt ? ` · ${when(work.submittedAt)}` : ""}`;
  return work.dueAt ? `À déposer · ${whenDay(work.dueAt)}` : "À déposer";
};

const assignmentCard = (work) => {
  const item = el("article", `work-card${work.submitted ? " is-done" : ""}`);
  const head = document.createElement("header");
  head.append(el("h3", "", work.title), el("p", "work-status", statusLabel(work)));
  item.append(head);
  item.append(el("p", "", work.courseTitle));
  item.append(el("p", "", work.brief || "Suis la consigne vue en séance."));

  if (work.feedback) {
    const note = el("p", "copy-feedback", `Retour : ${work.feedback}`);
    item.append(note);
  }

  const form = document.createElement("form");
  form.className = "coords-form work-form";
  const fileId = `file-${work.id}`;
  const contentId = `content-${work.id}`;
  const linkId = `link-${work.id}`;

  const fileField = el("div", "field");
  const fileLabel = el("label", "", "Fichier du devoir");
  fileLabel.setAttribute("for", fileId);
  const fileInput = document.createElement("input");
  fileInput.id = fileId;
  fileInput.name = "file";
  fileInput.type = "file";
  fileInput.accept = ".html,.htm,.txt,.css,.js,.md,.py";
  fileField.append(fileLabel, fileInput);

  const contentField = el("div", "field");
  const contentLabel = el("label", "", "Ou colle ton rendu");
  contentLabel.setAttribute("for", contentId);
  const contentInput = document.createElement("textarea");
  contentInput.id = contentId;
  contentInput.name = "content";
  contentInput.rows = 6;
  contentInput.spellcheck = false;
  contentField.append(contentLabel, contentInput);

  const linkField = el("div", "field");
  const linkLabel = el("label", "", "Lien (optionnel)");
  linkLabel.setAttribute("for", linkId);
  const linkInput = document.createElement("input");
  linkInput.id = linkId;
  linkInput.name = "link";
  linkInput.type = "url";
  linkInput.inputMode = "url";
  linkInput.placeholder = "https://";
  if (work.link) linkInput.value = work.link;
  linkField.append(linkLabel, linkInput);

  const errorEl = el("p", "form-error");
  errorEl.hidden = true;
  errorEl.setAttribute("aria-live", "polite");
  const okEl = el("p", "form-ok");
  okEl.setAttribute("aria-live", "polite");
  if (work.submitted) okEl.textContent = "Tu peux renvoyer une version plus tard.";
  else okEl.hidden = true;

  const submit = el("button", "btn btn-primary", work.submitted ? "Mettre à jour le dépôt" : "Soumettre ce devoir");
  submit.type = "submit";
  form.append(fileField, contentField, linkField, errorEl, okEl, submit);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError(errorEl, "");
    const pasted = form.elements.namedItem("content").value.trim();
    const file = form.elements.namedItem("file").files?.[0];
    let content = pasted;
    let filename = "rendu.txt";
    try {
      if (!content && file) {
        content = (await readFileText(file)).trim();
        filename = file.name || filename;
      }
      snapshot = await api("/api/submit", {
        method: "POST",
        body: {
          assignmentId: work.id,
          content,
          filename,
          link: form.elements.namedItem("link").value.trim(),
        },
      });
      paint(snapshot);
    } catch (error) {
      showError(errorEl, error.message);
      okEl.hidden = true;
    }
  });

  item.append(form);
  return item;
};

const paintHome = (data) => {
  const { student, done, total, reviewed } = data;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const leftover = data.assignments.filter((item) => !item.submitted).length;

  document.getElementById("home-hello").textContent =
    `Bonjour ${student.prenom}, voici où tu en es.`;

  document.getElementById("progress-copy").textContent = total
    ? `${done} devoir${done > 1 ? "s" : ""} déposé${done > 1 ? "s" : ""} sur ${total} (${percent} %).`
    : "Les devoirs apparaîtront ici dès qu’un cours sera publié.";
  document.getElementById("progress-fill").style.width = `${percent}%`;
  document.getElementById("progress-meter").setAttribute("aria-valuenow", String(percent));

  const courseProgress = document.getElementById("home-course-progress");
  courseProgress.replaceChildren();
  if (data.courses.length) {
    const list = el("ul", "home-course-list");
    data.courses.forEach((course) => {
      const item = document.createElement("li");
      const open = course.total
        ? `${course.done} / ${course.total} devoir${course.total > 1 ? "s" : ""}`
        : "Pas de devoir";
      item.append(el("strong", "", course.title), el("span", "", open));
      list.append(item);
    });
    courseProgress.append(list);
  }

  const stats = document.getElementById("home-stats");
  stats.replaceChildren();
  [
    [`${data.courses.length}`, "Cours ouverts"],
    [`${done}/${total || 0}`, "Devoirs déposés"],
    [`${reviewed}`, "Copies corrigées"],
    [`${leftover}`, "Encore à faire"],
  ].forEach(([value, label]) => {
    const card = el("article", "stat-card");
    card.append(el("b", "", value), el("span", "", label));
    stats.append(card);
  });

  const next = document.getElementById("home-next");
  next.replaceChildren();
  next.append(el("h2", "", "Prochain devoir"));
  if (!data.nextWork) {
    next.append(el("p", "", data.total ? "Tout est déposé. Bravo." : "Les devoirs arriveront ici."));
  } else {
    next.append(el("h3", "", data.nextWork.title));
    next.append(el("p", "", data.nextWork.courseTitle));
    next.append(el("p", "", data.nextWork.brief || ""));
    const button = el("button", "btn btn-primary", "Ouvrir la page Devoirs");
    button.type = "button";
    button.addEventListener("click", () => go("devoirs"));
    next.append(button);
  }

  const news = document.getElementById("home-news");
  news.replaceChildren();
  if (!data.announcements.length) {
    news.append(el("p", "dash-empty", "Pas d’annonce pour le moment."));
    return;
  }
  data.announcements.forEach((item) => {
    const card = el("article", "notice-card");
    card.append(el("h3", "", item.title));
    card.append(el("p", "", item.body));
    card.append(el("p", "muted", when(item.createdAt)));
    news.append(card);
  });
};

const paintCourses = (data) => {
  const root = document.getElementById("courses-root");
  root.replaceChildren();
  if (!data.courses.length) {
    root.append(el("p", "dash-empty", "Aucun cours publié pour le moment."));
    return;
  }
  data.courses.forEach((course) => {
    const article = el("article", "course-card");
    article.append(el("p", "stamp", "Cours"));
    article.append(el("h2", "", course.title));
    if (course.summary) article.append(el("p", "", course.summary));
    article.append(
      el(
        "p",
        "",
        course.total
          ? `${course.done} devoir${course.done > 1 ? "s" : ""} déposé${course.done > 1 ? "s" : ""} sur ${course.total}.`
          : "Pas de devoir pour l’instant.",
      ),
    );
    if (course.support) {
      const support = el("a", "text-link", "Télécharger le support");
      support.href = course.support;
      support.setAttribute("download", "");
      article.append(support);
    }
    const open = el("button", "btn btn-ghost", "Voir les devoirs");
    open.type = "button";
    open.addEventListener("click", () => {
      document.getElementById("work-filter").value = course.id;
      go("devoirs");
      paintWorks(snapshot);
    });
    article.append(open);
    root.append(article);
  });
};

const paintWorks = (data) => {
  const filter = document.getElementById("work-filter");
  const selected = filter.value;
  filter.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "Tous les cours";
  filter.append(all);
  data.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    filter.append(option);
  });
  if ([...filter.options].some((option) => option.value === selected)) filter.value = selected;

  const root = document.getElementById("works-root");
  root.replaceChildren();
  const list = data.assignments.filter((item) => !filter.value || item.courseId === filter.value);
  if (!list.length) {
    root.append(el("p", "dash-empty", "Pas de devoir dans ce filtre."));
    return;
  }
  list.forEach((work) => root.append(assignmentCard(work)));
};

const paintCopies = (data) => {
  const root = document.getElementById("copies-root");
  root.replaceChildren();
  if (!data.copies.length) {
    root.append(el("p", "dash-empty", "Tu n’as pas encore déposé."));
    return;
  }
  data.copies.forEach((copy) => {
    const article = el("article", `work-card${copy.status === "reviewed" ? " is-done" : ""}`);
    article.append(el("h3", "", copy.title));
    article.append(el("p", "", copy.courseTitle));
    article.append(el("p", "work-status", statusLabel(copy)));
    if (copy.filename) article.append(el("p", "", copy.filename));
    if (copy.link) {
      const a = el("a", "text-link", copy.link);
      a.href = copy.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      article.append(a);
    }
    if (copy.feedback) article.append(el("p", "copy-feedback", `Retour : ${copy.feedback}`));
    const again = el("button", "btn btn-ghost", "Mettre à jour");
    again.type = "button";
    again.addEventListener("click", () => {
      document.getElementById("work-filter").value = copy.courseId;
      go("devoirs");
      paintWorks(snapshot);
    });
    article.append(again);
    root.append(article);
  });
};

const paintProfile = (data) => {
  const form = document.getElementById("profile-form");
  form.elements.namedItem("prenom").value = data.student.prenom;
  form.elements.namedItem("nom").value = data.student.nom;
  form.elements.namedItem("phone").value = data.student.phone;
};

const paint = (data) => {
  snapshot = data;
  document.getElementById("hub-who").textContent = `${data.student.prenom} ${data.student.nom}`;
  paintHome(data);
  paintCourses(data);
  paintWorks(data);
  paintCopies(data);
  paintProfile(data);
  showView(currentView(), TITLES);
};

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => go(button.getAttribute("data-go")));
});

document.getElementById("work-filter")?.addEventListener("change", () => {
  if (snapshot) paintWorks(snapshot);
});

window.addEventListener("hashchange", () => showView(currentView(), TITLES));

document.getElementById("profile-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById("profile-error");
  const okEl = document.getElementById("profile-ok");
  showError(errorEl, "");
  okEl.hidden = true;
  try {
    snapshot = await api("/api/profile", {
      method: "POST",
      body: { nom: event.target.elements.namedItem("nom").value },
    });
    paint(snapshot);
    okEl.hidden = false;
    okEl.textContent = "Profil enregistré.";
  } catch (error) {
    showError(errorEl, error.message);
  }
});

document.getElementById("logout-student")?.addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST" });
  } catch {
    /* still leave */
  }
  goConnexion();
});

api("/api/me")
  .then(paint)
  .catch(goConnexion);
