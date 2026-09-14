const foldPhone = (value) => String(value || "").replace(/\D+/g, "");

const foldName = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .replace(/\s+/g, " ");

const phoneKeys = (digits) => {
  const keys = new Set();
  if (!digits) return keys;
  keys.add(digits);
  if (digits.startsWith("228") && digits.length > 8) keys.add(digits.slice(3));
  if (!digits.startsWith("228") && digits.length === 8) keys.add(`228${digits}`);
  return keys;
};

const studentKey = (prenom, phone) => `${foldName(prenom)}|${foldPhone(phone)}`;

const findKey = (store, prenom, phone) => {
  const name = foldName(prenom);
  const phones = phoneKeys(foldPhone(phone));
  return (
    Object.keys(store).find((key) => {
      const [savedName, savedPhone] = key.split("|");
      return savedName === name && phones.has(savedPhone);
    }) || null
  );
};

const publicStudent = (student) => {
  if (!student) return null;
  const submissions = {};
  for (const [day, item] of Object.entries(student.submissions || {})) {
    submissions[day] = {
      at: item.at,
      filename: item.filename || "index.html",
      whatsapp: item.whatsapp || "",
    };
  }
  return {
    prenom: student.prenom,
    nom: student.nom,
    phone: student.phone,
    submissions,
  };
};

module.exports = {
  foldPhone,
  foldName,
  phoneKeys,
  studentKey,
  findKey,
  publicStudent,
};
