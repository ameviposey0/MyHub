const { sendJson } = require("../lib/http");

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

const pathnameOf = (req) => {
  const raw = String(req.url || "/");
  const url = new URL(raw, "http://localhost");
  let pathname = url.pathname;
  if (!pathname.startsWith("/api")) {
    const slug = Array.isArray(req.query?.slug)
      ? req.query.slug.join("/")
      : String(req.query?.slug || "").replace(/^\/+/, "");
    pathname = slug ? `/api/${slug}` : "/api";
  }
  return { pathname, url };
};

module.exports = async (req, res) => {
  const { pathname, url } = pathnameOf(req);
  req.query = {
    ...(req.query && typeof req.query === "object" ? req.query : {}),
    ...Object.fromEntries(url.searchParams.entries()),
  };
  const handler = routes[`${req.method} ${pathname}`];
  if (!handler) {
    sendJson(res, 404, { error: "Route introuvable." });
    return;
  }
  return handler(req, res);
};
