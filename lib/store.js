const fs = require("fs");
const path = require("path");
const { get, put } = require("@vercel/blob");
const { normalizeStore } = require("./class");

const BLOB_PATH = "myhub-students.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "students.json");
const STORE_ID = process.env.BLOB_STORE_ID || "store_Rhp53DOYXelvlTIn";

const onVercel = () => Boolean(process.env.VERCEL);
const hasBlob = () =>
  Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (STORE_ID && (process.env.VERCEL_OIDC_TOKEN || onVercel())),
  );

const blobAuth = () => {
  const options = {
    access: "private",
    storeId: STORE_ID,
  };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }
  return options;
};

const readFileStore = () => {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"));
  } catch {
    return {};
  }
};

const writeFileStore = (store) => {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(store, null, 2));
};

const readBlobStore = async () => {
  try {
    const result = await get(BLOB_PATH, {
      ...blobAuth(),
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return {};
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return data && typeof data === "object" ? data : {};
  } catch (error) {
    if (error?.constructor?.name === "BlobNotFoundError") return {};
    const wrapped = new Error("no-blob");
    wrapped.status = 503;
    throw wrapped;
  }
};

const writeBlobStore = async (store) => {
  try {
    await put(BLOB_PATH, JSON.stringify(store), {
      ...blobAuth(),
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  } catch {
    const wrapped = new Error("no-blob");
    wrapped.status = 503;
    throw wrapped;
  }
};

const readStore = async () => {
  let raw = {};
  if (hasBlob()) raw = await readBlobStore();
  else if (onVercel()) {
    const error = new Error("no-blob");
    error.status = 503;
    throw error;
  } else raw = readFileStore();
  return normalizeStore(raw);
};

const writeStore = async (store) => {
  if (hasBlob()) {
    await writeBlobStore(store);
    return;
  }
  if (onVercel()) {
    const error = new Error("no-blob");
    error.status = 503;
    throw error;
  }
  writeFileStore(store);
};

const updateStore = async (mutator) => {
  const store = await readStore();
  const result = await mutator(store);
  await writeStore(store);
  return result;
};

module.exports = { readStore, writeStore, updateStore };
