// Dev-only: keys 0–7 pick a mood by hand (0 = calm), A goes back to reading
// your face; window.__mood exposes the store, the live face readings and the
// mood scores for checks. Scene.tsx lazy-imports this behind an inline
// NODE_ENV check, so it never reaches production.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { live } from "./live";
import { MOODS } from "./moods";
import { getMood, moodActions } from "./state";

const actions = {
  /** Pick mood `i` by hand (the face reading waits). */
  show(i: number) {
    live.manual = true;
    moodActions.show(i);
  },
  /** Back to reading the face. */
  auto() {
    live.manual = false;
  },
};

const DevKeys = () => {
  const scene = useThree((st) => st.scene);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__mood = {
      actions,
      get: getMood,
      moods: MOODS,
      live,
      scene,
    };
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (e.key === "a") actions.auto();
      else if (e.key.length === 1 && n >= 0 && n < MOODS.length)
        actions.show(n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);
  return null;
};

export default DevKeys;
