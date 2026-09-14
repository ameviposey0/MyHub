const logoutBtn = document.getElementById("logout-student");
const coursesRoot = document.getElementById("courses-root");

const when = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const readFileText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsText(file);
  });

const paintHeader = (data) => {
  const { student, done, total } = data;
  document.getElementById("hello-title").textContent = `Bonjour ${student.prenom}`;
  document.getElementById("hello-meta").textContent =
    `${student.prenom} ${student.nom} · ${student.phone}`;
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-copy").textContent = total
    ? `${done} devoir${done > 1 ? "s" : ""} déposé${done > 1 ? "s" : ""} sur ${total}.`
    : "Les devoirs apparaîtront ici dès qu’un cours sera publié.";
  document.getElementById("progress-fill").style.width = `${percent}%`;
  const meter = document.getElementById("progress-meter");
  if (meter) meter.setAttribute("aria-valuenow", String(percent));
};

const assignmentCard = (work) => {
  const item = document.createElement("article");
  item.className = `work-card${work.submitted ? " is-done" : ""}`;

  const head = document.createElement("header");
  const title = document.createElement("h4");
  title.textContent = work.title;
  const status = document.createElement("p");
  status.className = "work-status";
  status.textContent = work.submitted
    ? `Déposé${work.submittedAt ? ` · ${when(work.submittedAt)}` : ""}`
    : "À déposer";
  head.append(title, status);

  const brief = document.createElement("p");
  brief.textContent = work.brief || "Suis la consigne vue en séance.";

  const form = document.createElement("form");
  form.className = "coords-form work-form";

  const fileId = `file-${work.id}`;
  const contentId = `content-${work.id}`;
  const linkId = `link-${work.id}`;

  const fileField = document.createElement("div");
  fileField.className = "field";
  const fileLabel = document.createElement("label");
  fileLabel.setAttribute("for", fileId);
  fileLabel.textContent = "Fichier du devoir";
  const fileInput = document.createElement("input");
  fileInput.id = fileId;
  fileInput.name = "file";
  fileInput.type = "file";
  fileInput.accept = ".html,.htm,.txt,.css,.js,.md";
  fileField.append(fileLabel, fileInput);

  const contentField = document.createElement("div");
  contentField.className = "field";
  const contentLabel = document.createElement("label");
  contentLabel.setAttribute("for", contentId);
  contentLabel.textContent = "Ou colle ton rendu";
  const contentInput = document.createElement("textarea");
  contentInput.id = contentId;
  contentInput.name = "content";
  contentInput.rows = 6;
  contentInput.spellcheck = false;
  contentField.append(contentLabel, contentInput);

  const linkField = document.createElement("div");
  linkField.className = "field";
  const linkLabel = document.createElement("label");
  linkLabel.setAttribute("for", linkId);
  linkLabel.textContent = "Lien (optionnel)";
  const linkInput = document.createElement("input");
  linkInput.id = linkId;
  linkInput.name = "link";
  linkInput.type = "url";
  linkInput.inputMode = "url";
  linkInput.placeholder = "https://";
  linkField.append(linkLabel, linkInput);

  const errorEl = document.createElement("p");
  errorEl.className = "form-error";
  errorEl.hidden = true;
  errorEl.setAttribute("aria-live", "polite");

  const okEl = document.createElement("p");
  okEl.className = "form-ok";
  okEl.setAttribute("aria-live", "polite");
  if (work.submitted) {
    okEl.textContent = "Tu peux renvoyer une version plus tard.";
  } else {
    okEl.hidden = true;
  }

  const submit = document.createElement("button");
  submit.className = "btn btn-primary";
  submit.type = "submit";
  submit.textContent = work.submitted ? "Mettre à jour le dépôt" : "Soumettre ce devoir";

  form.append(fileField, contentField, linkField, errorEl, okEl, submit);

  if (work.link) form.elements.namedItem("link").value = work.link;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorEl = form.querySelector(".form-error");
    const okEl = form.querySelector(".form-ok");
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
      const view = await api("/api/submit", {
        method: "POST",
        body: {
          assignmentId: work.id,
          content,
          filename,
          link: form.elements.namedItem("link").value.trim(),
        },
      });
      paint(view);
    } catch (error) {
      showError(errorEl, error.message);
      okEl.hidden = true;
    }
  });

  item.append(head, brief, form);
  return item;
};

const courseCard = (course) => {
  const article = document.createElement("article");
  article.className = "course-card";

  const stamp = document.createElement("p");
  stamp.className = "stamp";
  stamp.textContent = "Cours";

  const title = document.createElement("h3");
  title.textContent = course.title;

  const summary = document.createElement("p");
  summary.textContent = course.summary || "";

  article.append(stamp, title);
  if (course.summary) article.append(summary);

  if (course.support) {
    const support = document.createElement("a");
    support.className = "text-link";
    support.href = course.support;
    support.setAttribute("download", "");
    support.textContent = "Télécharger le support";
    article.append(support);
  }

  const worksTitle = document.createElement("h4");
  worksTitle.className = "works-title";
  worksTitle.textContent = "Devoirs de ce cours";
  article.append(worksTitle);

  if (!course.assignments.length) {
    const empty = document.createElement("p");
    empty.textContent = "Pas de devoir pour l’instant.";
    article.append(empty);
  } else {
    const list = document.createElement("div");
    list.className = "work-list";
    course.assignments.forEach((work) => list.append(assignmentCard(work)));
    article.append(list);
  }

  return article;
};

const paint = (data) => {
  paintHeader(data);
  coursesRoot.replaceChildren();
  if (!data.courses.length) {
    const empty = document.createElement("p");
    empty.className = "dash-empty";
    empty.textContent = "Aucun cours publié pour le moment.";
    coursesRoot.append(empty);
    return;
  }
  data.courses.forEach((course) => coursesRoot.append(courseCard(course)));
};

logoutBtn?.addEventListener("click", async () => {
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
