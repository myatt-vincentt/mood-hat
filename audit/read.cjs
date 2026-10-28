// Face reading check: on each clip, logs every mood change with its time,
// the peak score per mood, and the share of time in each mood.
//   PLAYWRIGHT_FROM=<folder with @playwright/test> node audit/read.cjs <seconds> <clip.y4m> …
const { chromium } = require(
  require.resolve("@playwright/test", {
    paths: [process.env.PLAYWRIGHT_FROM || __dirname],
  }),
);
const [seconds, ...clips] = process.argv.slice(2);
const BASE = `http://localhost:${process.env.PORT || 5193}`;

(async () => {
  for (const clip of clips) {
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
        document.documentElement.dataset.experience === "ready" &&
        window.__mood,
      null,
      { timeout: 120000 },
    );
    const log = await page.evaluate(
      (ms) =>
        new Promise((done) => {
          const t0 = performance.now();
          const changes = [];
          const peak = {};
          const time = {};
          let last = null;
          let lt = t0;
          const tick = () => {
            const now = performance.now();
            const m = window.__mood;
            const mood = m.moods[m.get().mood].id;
            time[mood] = (time[mood] || 0) + (now - lt) / 1000;
            lt = now;
            if (mood !== last) {
              changes.push(`${((now - t0) / 1000).toFixed(1)}s ${mood}`);
              last = mood;
            }
            const s = m.live.scores;
            if (s) for (const k in s) peak[k] = Math.max(peak[k] || 0, s[k]);
            if (now - t0 < ms) requestAnimationFrame(tick);
            else done({ changes, peak, time, calibrated: !!s });
          };
          tick();
        }),
      Number(seconds) * 1000,
    );
    const name = clip.split("/").pop();
    console.log(`\n== ${name} calibrated=${log.calibrated}`);
    console.log("changes:", log.changes.join(" → "));
    console.log(
      "peak:",
      Object.entries(log.peak)
        .map(([k, v]) => `${k} ${v.toFixed(2)}`)
        .join(", "),
    );
    console.log(
      "time:",
      Object.entries(log.time)
        .map(([k, v]) => `${k} ${v.toFixed(1)}s`)
        .join(", "),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
