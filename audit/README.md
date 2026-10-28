# Look, fit and reading checks

Dev tooling, not part of the app. Headless Chrome (GPU on) against the running dev server
(`PORT=5193 pnpm dev`) with a fake webcam fed from a `.y4m` clip; reads the dev-only
`window.__mood` (`src/mood/DevKeys.tsx`). Needs `@playwright/test` and Chrome:
`PLAYWRIGHT_FROM=<folder whose node_modules has it>`.

- `moods.cjs <out-dir> <clip.y4m> …` — every mood on every clip, one sheet: rows = moods,
  columns = clips. Used with the SDK's sample videos
  (`cdn.vincentt.studio/assets/sdk/debug-ui/v1/videos/*.mp4`).
- `close.cjs <out-dir> <clip.y4m> [x,y,w,h]` — every mood on one clip, cropped to the head, one row.
- `fit.cjs <out-dir> <clip.y4m> [mood] [x,y,w,h] [every-ms] [shots]` — one mood, close shots (2×)
  while the head turns, plain and with the occluders drawn (`?occ`).
- `read.cjs <seconds> <clip.y4m> …` — the mood reading on each clip: every change with its time,
  the peak score per mood and the time in each mood.

Clips (not committed): `ffmpeg -i in.mp4 -t 10 -r 30 -vf "scale=540:960,format=yuv420p" out.y4m`.
The sample videos have the head near the top; for room above the hat:
`-vf "scale=378:672,pad=540:960:81:260:color=0xa9802f,format=yuv420p"`.
