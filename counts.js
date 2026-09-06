const NS = "ameviposey0-myhub";
const BASES = ["https://abacus.jsn.cam", "https://abacus.jasoncameron.dev"];

const readValue = (payload) => {
  if (typeof payload === "number") return payload;
  if (payload && typeof payload.value === "number") return payload.value;
  return 0;
};

const requestCount = async (action, key) => {
  let lastError;

  for (const base of BASES) {
    try {
      const response = await fetch(`${base}/${action}/${NS}/${key}`, {
        method: "GET",
        keepalive: true,
      });

      if (response.status === 404) return 0;
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return readValue(await response.json());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Compteur indisponible");
};

const getCount = (key) => requestCount("get", key);
const hitCount = (key) => requestCount("hit", key);
