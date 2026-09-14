const fs = require("fs");
const path = require("path");
const { get, put } = require("@vercel/blob");
const { normalizeStore } = require("./class");

const BLOB_PATH = "myhub-students.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "students.json");

const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const onVercel = () => Boolean(process.env.VERCEL);

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
      access: "private",
      useCache: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return {};
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return data && typeof data === "object" ? data : {};
  } catch (error) {
    if (error?.constructor?.name === "BlobNotFoundError") return {};
    throw error;
  }
};

const writeBlobStore = async (store) => {
  await put(BLOB_PATH, JSON.stringify(store), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
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
