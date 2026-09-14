const crypto = require("crypto");
const { cookieValue, setCookie } = require("./http");

const STUDENT_COOKIE = "myhub_student";
const ADMIN_COOKIE = "myhub_admin";
const ADMIN_HASH =
  process.env.ADMIN_PASS_HASH ||
  "840486f16a42e36f95f51df1090b186dc2e8def555041877b290058062f3f356";

const secret = () =>
  process.env.STUDENT_SESSION_SECRET ||
  process.env.BLOB_READ_WRITE_TOKEN ||
  "myhub-dev-secret";

const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
};

const verify = (token) => {
  try {
    const [body, mac] = String(token || "").split(".");
    if (!body || !mac) return null;
    const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
    const left = Buffer.from(mac);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
};

const hashPassword = (password) =>
  crypto.createHash("sha256").update(String(password)).digest("hex");

const writeSession = (res, key) => {
  const token = sign({
    role: "student",
    key,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  });
  setCookie(res, STUDENT_COOKIE, token, ["Max-Age=2592000"]);
};

const clearSession = (res) => {
  setCookie(res, STUDENT_COOKIE, "", ["Max-Age=0"]);
};

const readSession = (req) => {
  const data = verify(cookieValue(req, STUDENT_COOKIE));
  if (!data?.key) return null;
  return data;
};

const writeAdminSession = (res) => {
  const token = sign({ role: "admin", exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  setCookie(res, ADMIN_COOKIE, token, ["Max-Age=604800"]);
};

const clearAdminSession = (res) => {
  setCookie(res, ADMIN_COOKIE, "", ["Max-Age=0"]);
};

const readAdminSession = (req) => {
  const data = verify(cookieValue(req, ADMIN_COOKIE));
  if (data?.role !== "admin") return null;
  return data;
};

const passwordMatches = (password) => hashPassword(password) === ADMIN_HASH;

module.exports = {
  writeSession,
  clearSession,
  readSession,
  writeAdminSession,
  clearAdminSession,
  readAdminSession,
  passwordMatches,
};
