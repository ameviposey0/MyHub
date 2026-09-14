const http = require("http");
const fs = require("fs");
const path = require("path");
const api = require("./lib/router").dispatch;

const PORT = 4173;
const ROOT = process.cwd();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const sendFile = (res, filePath) => {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Introuvable.");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", types[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname.startsWith("/api/")) {
    req.query = Object.fromEntries(url.searchParams.entries());
    try {
      await api(req, res);
    } catch {
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "Erreur serveur." }));
      }
    }
    return;
  }

  let file = decodeURIComponent(url.pathname);
  if (file === "/") file = "/index.html";
  const full = path.normalize(path.join(ROOT, file));
  if (!full.startsWith(ROOT)) {
    res.statusCode = 403;
    res.end("Interdit.");
    return;
  }
  sendFile(res, full);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`MyHub local : http://127.0.0.1:${PORT}/`);
});
