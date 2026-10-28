// Hat fit: one mood on one clip, close shots (2x) at a few moments while the
// head turns, with the occluders drawn (?occ) and without. One sheet: top row
// plain, bottom row occluders.
//   PLAYWRIGHT_FROM=<folder with @playwright/test> node audit/fit.cjs <out-dir> <clip.y4m> [mood] [x,y,w,h] [every-ms] [shots]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require(
  require.resolve("@playwright/test", {
    paths: [process.env.PLAYWRIGHT_FROM || __dirname],
  }),
);
const [
  out,
  clip,
  mood = "0",
  box = "150,180,240,260",
  every = "700",
  shots = "6",
] = process.argv.slice(2);
const [x, y, width, height] = box.split(",").map(Number);
const BASE = `http://localhost:${process.env.PORT || 5193}`;
fs.mkdirSync(out, { recursive: true });

(async () => {
  const rows = [];
  for (const q of ["", "&occ"]) {
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
        deviceScaleFactor: 2,
        permissions: ["camera"],
      })
    ).newPage();
    await page.goto(`${BASE}/?input=webcam${q}`);
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.experience === "ready" &&
        window.__mood,
      null,
      { timeout: 120000 },
    );
    await page.evaluate((i) => {
      window.__mood.actions.show(i);
    }, Number(mood));
    await page.waitForTimeout(3000);
    const files = [];
    for (let s = 0; s < Number(shots); s++) {
      const f = path.join(out, `${q ? "occ" : "plain"}-${s}.png`);
      await page.screenshot({ path: f, clip: { x, y, width, height } });
      files.push(f);
      await page.waitForTimeout(Number(every));
    }
    await browser.close();
    const row = path.join(out, `${q ? "occ" : "plain"}.png`);
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      ...files.flatMap((f) => ["-i", f]),
      "-filter_complex",
      `${files.map((_, k) => `[${k}]`).join("")}hstack=inputs=${files.length}`,
      row,
    ]);
    rows.push(row);
  }
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    rows[0],
    "-i",
    rows[1],
    "-filter_complex",
    "vstack=inputs=2",
    path.join(out, "sheet.png"),
  ]);
  console.log("sheet", path.join(out, "sheet.png"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
