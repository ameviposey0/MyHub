const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const slug = process.argv[2] || "jour-1-reseaux-et-web";
  const html = path.resolve(__dirname, `${slug}.html`);
  const out = path.resolve(__dirname, `${slug}.pdf`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file:///${html.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "10mm", bottom: "14mm", left: "10mm" },
  });
  await browser.close();
  console.log(out);
})();
