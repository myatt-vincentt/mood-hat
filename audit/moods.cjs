// Look review: every mood on every clip, one sheet:
// rows = moods, columns = clips.
//   PLAYWRIGHT_FROM=<folder with @playwright/test> node audit/animals.cjs <out-dir> <clip.y4m> …
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require(
  require.resolve("@playwright/test", {
    paths: [process.env.PLAYWRIGHT_FROM || __dirname],
  }),
);
const [out, ...clips] = process.argv.slice(2);
const BASE = `http://localhost:${process.env.PORT || 5193}`;
const W = 216;
const H = 256;
fs.mkdirSync(out, { recursive: true });

(async () => {
  let n = 0;
  for (const [ci, clip] of clips.entries()) {
    const browser = await chromium.launch({
      channel: "chrome",
      args: [
        "--use-angle=metal",
        "--enable-gpu",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-video-capture=${clip}`,
      ],
    });
    const page = await (
      await browser.newContext({
        viewport: { width: 540, height: 960 },
        permissions: ["camera"],
      })
    ).newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error" && !/__harness|XNNPACK/.test(m.text()))
        errors.push(m.text().slice(0, 160));
    });
    await page.goto(`${BASE}/?input=webcam`);
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.experience === "ready" &&
        window.__mood,
      null,
      { timeout: 120000 },
    );
    n = await page.evaluate(() => window.__mood.moods.length);
    for (let a = 0; a < n; a++) {
      await page.evaluate((i) => window.__mood.actions.show(i), a);
      await page.waitForTimeout(a === 0 ? 5000 : 2500);
      await page.screenshot({
        path: path.join(out, `${a}-${ci}.png`),
        clip: { x: 0, y: 0, width: 540, height: 640 },
      });
    }
    if (errors.length)
      console.log("clip", ci, "errors", JSON.stringify(errors.slice(0, 3)));
    await browser.close();
    console.log("clip", ci, "done");
  }
  const inputs = [];
  const scaled = [];
  for (let a = 0; a < n; a++)
    for (let c = 0; c < clips.length; c++) {
      inputs.push("-i", path.join(out, `${a}-${c}.png`));
      const k = inputs.length / 2 - 1;
      scaled.push(`[${k}]scale=${W}:${H}[v${k}]`);
    }
  const total = n * clips.length;
  const layout = Array.from(
    { length: total },
    (_, k) => `${(k % clips.length) * W}_${Math.floor(k / clips.length) * H}`,
  ).join("|");
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    ...inputs,
    "-filter_complex",
    `${scaled.join(";")};${Array.from({ length: total }, (_, k) => `[v${k}]`).join("")}xstack=inputs=${total}:layout=${layout}`,
    path.join(out, "sheet.png"),
  ]);
  console.log("sheet", path.join(out, "sheet.png"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
