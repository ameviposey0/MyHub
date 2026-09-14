const { sendJson } = require("./http");

const routes = {
  "POST /api/register": require("../handlers/register"),
  "POST /api/login": require("../handlers/login"),
  "POST /api/logout": require("../handlers/logout"),
  "GET /api/me": require("../handlers/me"),
  "POST /api/submit": require("../handlers/submit"),
  "POST /api/profile": require("../handlers/profile"),
  "POST /api/admin/login": require("../handlers/admin/login"),
  "POST /api/admin/logout": require("../handlers/admin/logout"),
  "GET /api/admin/me": require("../handlers/admin/me"),
  "GET /api/admin/overview": require("../handlers/admin/overview"),
  "POST /api/admin/course": require("../handlers/admin/course"),
  "POST /api/admin/assignment": require("../handlers/admin/assignment"),
  "GET /api/admin/copy": require("../handlers/admin/copy"),
  "POST /api/admin/notice": require("../handlers/admin/notice"),
  "POST /api/admin/review": require("../handlers/admin/review"),
};

const clean = (value) => {
  const path = `/${String(value || "").replace(/^\/+|\/+$/g, "")}`;
  return path === "/" ? "" : path.replace(/\/+/g, "/");
};

const add = (set, value) => {
  const path = clean(value);
  if (!path) return;
  set.add(path);
  if (!path.startsWith("/api")) set.add(`/api${path}`);
  if (path.startsWith("/admin")) set.add(`/api${path}`);
};

const candidates = (req) => {
  const list = new Set();
  try {
    add(list, new URL(String(req.url || "/"), "http://localhost").pathname);
  } catch {
    /* ignore */
  }
  const slug = req.query?.slug;
  if (Array.isArray(slug)) add(list, `/api/${slug.join("/")}`);
  else if (slug) add(list, `/api/${slug}`);
  if (req.query && typeof req.query === "object") {
    Object.values(req.query).forEach((value) => {
      if (Array.isArray(value) && value.every((part) => typeof part === "string")) {
        add(list, `/api/${value.join("/")}`);
      }
    });
  }
  return [...list];
};

const dispatch = async (req, res) => {
  const method = req.method;
  try {
    const url = new URL(String(req.url || "/"), "http://localhost");
    req.query = {
      ...(req.query && typeof req.query === "object" ? req.query : {}),
      ...Object.fromEntries(url.searchParams.entries()),
    };
  } catch {
    req.query = req.query && typeof req.query === "object" ? req.query : {};
  }

  for (const pathname of candidates(req)) {
    const handler = routes[`${method} ${pathname}`];
    if (handler) return handler(req, res);
  }

  sendJson(res, 404, { error: "Route introuvable." });
};

module.exports = { dispatch, routes };
