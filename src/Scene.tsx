// Scene.tsx — Mood Hat: a propeller beanie that reads your face. Smile,
// frown, gasp, doze, pout, kiss or look up in thought, and the hat changes
// with you. See PLAN.md.
import { lazy, Suspense } from "react";

import { MoodInput } from "./mood/MoodInput";
import { MoodScene } from "./mood/MoodScene";

// Dev-only helpers for previewing without a camera. Lazy and behind a
// constant esbuild folds to false in production. Two rules:
// `process.env.NODE_ENV`, not `import.meta.env.DEV` (vincentt-xr/v2-template#112);
// and write the check INSIDE the ternary — hoisted into a `const`, esbuild
// keeps the dead branch.
const DevMediaSwitcher =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./DevMediaSwitcher"))
    : null;
const DevKeys =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./mood/DevKeys"))
    : null;

export const Scene = () => (
  <>
    <MoodScene />
    <MoodInput />
    {DevMediaSwitcher && DevKeys ? (
      <Suspense fallback={null}>
        <DevMediaSwitcher />
        <DevKeys />
      </Suspense>
    ) : null}
  </>
);
