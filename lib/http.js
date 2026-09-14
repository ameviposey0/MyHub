const readBody = async (req) => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string" && req.body) {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
};

const sendJson = (res, status, data) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
};

const cookieValue = (req, name) => {
  const raw = req.headers.cookie || "";
  const match = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
};

const setCookie = (res, name, value, extra = []) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", ...extra];
  if (process.env.VERCEL) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
};

const sendCaught = (res, error, fallback) => {
  if (error?.status === 409) {
    sendJson(res, 409, {
      error: "Ce prénom et ce numéro sont déjà inscrits. Va sur Connexion.",
    });
    return;
  }
  if (error?.status === 401) {
    sendJson(res, 401, { error: "Connecte-toi." });
    return;
  }
  if (error?.message === "no-blob" || error?.status === 503) {
    sendJson(res, 503, {
      error: "Le stockage n’est pas encore branché. Active Blob dans Vercel.",
    });
    return;
  }
  sendJson(res, 500, { error: fallback });
};

module.exports = { readBody, sendJson, cookieValue, setCookie, sendCaught };
