// Live face readings, written every frame by FaceSignals (no re-renders).
import type { Expressive } from "./detect";

export const live = {
  blendshapes: {} as Readonly<Record<string, number | undefined>>,
  /** A face is being tracked (FilteredHead). */
  tracked: false,
  /** Bumps on each head shake: worn parts play their wobble. */
  shakes: 0,
  /** The mood scores (MoodInput; null while learning your calm face). */
  scores: null as Readonly<Record<Expressive, number>> | null,
  /** Dev checks only (window.__mood): stands in for the face's readings. */
  override: null as Readonly<Record<string, number | undefined>> | null,
  /** Dev checks only: a mood picked by hand; the face reading waits. */
  manual: false,
};
