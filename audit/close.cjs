// Close look: every mood on one clip, cropped to the head, one row.
//   PLAYWRIGHT_FROM=<folder with @playwright/test> node audit/close.cjs <out-dir> <clip.y4m> [x,y,w,h]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require(
  require.resolve("@playwright/test", {
    paths: [process.env.PLAYWRIGHT_FROM || __dirname],
  }),
);
const [out, clip, box = "90,0,360,420"] = process.argv.slice(2);
const [x, y, width, height] = box.split(",").map(Number);
const BASE = `http://localhost:${process.env.PORT || 5193}`;
fs.mkdirSync(out, { recursive: true });

(async () => {
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
  await page.goto(`${BASE}/?input=webcam`);
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.experience === "ready" && window.__mood,
    null,
    { timeout: 120000 },
  );
  const n = await page.evaluate(() => window.__mood.moods.length);
  const inputs = [];
  for (let m = 0; m < n; m++) {
    await page.evaluate((i) => window.__mood.actions.show(i), m);
    await page.waitForTimeout(m === 0 ? 5000 : 2000);
    const f = path.join(out, `${m}.png`);
    await page.screenshot({ path: f, clip: { x, y, width, height } });
    inputs.push("-i", f);
  }
  await browser.close();
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    ...inputs,
    "-filter_complex",
    `${Array.from({ length: n }, (_, k) => `[${k}]`).join("")}hstack=inputs=${n}`,
    path.join(out, "row.png"),
  ]);
  console.log("row", path.join(out, "row.png"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
