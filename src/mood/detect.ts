// Reading a mood from the face's blendshapes. Pure (no React, no three), so
// it is tested on its own (detect.test.ts).
//
// Every face rests differently (some mouths turn down at rest, some brows
// sit low), so the first CALIBRATE seconds with a face in view learn your
// calm face (up to REST_MAX, so someone already grinning still reads happy), and each mood is scored by how far it has moved from there:
// 1 = clearly showing. The strongest mood at or above 1, held for a moment,
// takes over; it stays while its score is above EXIT and gives way to calm
// after it has dropped for a moment. Calm keeps learning, slowly, so
// lighting and posture drifts don't build up.

import type { MoodId } from "./moods";

export type Blendshapes = Readonly<Record<string, number | undefined>>;

/** The moods a face can show (calm is what's left). */
export type Expressive = Exclude<MoodId, "calm">;

const avg = (b: Blendshapes, a: string, c: string) =>
  ((b[a] ?? 0) + (b[c] ?? 0)) / 2;

/** One raw reading per mood, from the blendshapes. */
export const SIGNALS: Record<Expressive, (b: Blendshapes) => number> = {
  happy: (b) => avg(b, "mouthSmileLeft", "mouthSmileRight"),
  angry: (b) => avg(b, "browDownLeft", "browDownRight"),
  // Mouth open does most of it; brows up help.
  surprised: (b) =>
    0.65 * (b.jawOpen ?? 0) +
    0.35 *
      Math.max(
        b.browInnerUp ?? 0,
        avg(b, "browOuterUpLeft", "browOuterUpRight"),
      ),
  // Both eyes (a wink isn't sleep).
  sleepy: (b) => Math.min(b.eyeBlinkLeft ?? 0, b.eyeBlinkRight ?? 0),
  sad: (b) => avg(b, "mouthFrownLeft", "mouthFrownRight"),
  // Puckered lips, closed: a rounded open mouth ("oh") isn't a kiss.
  kiss: (b) => (b.mouthPucker ?? 0) - 0.8 * (b.jawOpen ?? 0),
  thinking: (b) => avg(b, "eyeLookUpLeft", "eyeLookUpRight"),
};

export const EXPRESSIVE = Object.keys(SIGNALS) as Expressive[];

export const DETECT = {
  /** Seconds of face to learn the calm face from. */
  calibrate: 2,
  /**
   * The most each reading can be at rest: what calibration sees above this
   * is an expression already showing, not the calm face.
   */
  restMax: {
    happy: 0.15,
    angry: 0.3,
    surprised: 0.15,
    sleepy: 0.35,
    sad: 0.2,
    kiss: 0.3,
    thinking: 0.2,
  } as Record<Expressive, number>,
  /** How far each reading must rise above your calm face to score 1. */
  span: {
    happy: 0.35,
    angry: 0.3,
    surprised: 0.3,
    sleepy: 0.45,
    sad: 0.15,
    kiss: 0.45,
    thinking: 0.28,
  } as Record<Expressive, number>,
  /** Score to stay in a mood once in it. */
  exit: 0.55,
  /** Seconds a mood must hold before it shows (sleep: eyes closed a while). */
  hold: {
    happy: 0.25,
    angry: 0.3,
    surprised: 0.2,
    sleepy: 0.9,
    sad: 0.35,
    kiss: 0.4,
    thinking: 0.6,
  } as Record<Expressive, number>,
  /** Seconds below EXIT before a mood lets go. */
  release: 0.4,
  /** A different mood takes over only when it beats the current by this. */
  switchMargin: 0.25,
  /** Seconds without a face before going back to calm. */
  faceLost: 1,
  /** Calm keeps learning: seconds for the calm face to follow a drift. */
  adapt: 20,
};

export type DetectState = {
  /** Calm-face baselines per mood (null until calibrated). */
  base: Record<Expressive, number> | null;
  /** Sums while calibrating. */
  sum: Record<Expressive, number>;
  /** Seconds of face seen while calibrating. */
  seen: number;
  /** The mood showing. */
  mood: MoodId;
  /** The mood trying to take over and since when (s). */
  candidate: Expressive | null;
  candidateSince: number;
  /** When the current mood dropped below EXIT (−1 = it hasn't). */
  lowSince: number;
  /** When the face was last seen (s). */
  lastFace: number;
  /** Last time (s). */
  t: number;
};

const zeros = () =>
  Object.fromEntries(EXPRESSIVE.map((m) => [m, 0])) as Record<
    Expressive,
    number
  >;

export const detectState = (): DetectState => ({
  base: null,
  sum: zeros(),
  seen: 0,
  mood: "calm",
  candidate: null,
  candidateSince: 0,
  lowSince: -1,
  lastFace: -Infinity,
  t: 0,
});

/** Raw readings → scores against the calm face (1 = clearly showing). */
export const scoresFor = (b: Blendshapes, base: Record<Expressive, number>) => {
  const out = zeros();
  EXPRESSIVE.forEach((m) => {
    out[m] = Math.max(0, (SIGNALS[m](b) - base[m]) / DETECT.span[m]);
  });
  return out;
};

/**
 * One step. `face` is the blendshapes, or null when no face is seen.
 * Returns the new state (the mood is `state.mood`) and the scores (for the
 * dev readout; empty until calibrated).
 */
export const stepDetect = (
  prev: DetectState,
  t: number,
  face: Blendshapes | null,
): { state: DetectState; scores: Record<Expressive, number> | null } => {
  const dt = Math.min(Math.max(t - prev.t, 0), 0.1);
  const s: DetectState = { ...prev, t };

  if (!face) {
    if (t - s.lastFace > DETECT.faceLost) {
      s.mood = "calm";
      s.candidate = null;
      s.lowSince = -1;
    }
    return { state: s, scores: null };
  }
  s.lastFace = t;

  const raw = zeros();
  EXPRESSIVE.forEach((m) => {
    raw[m] = SIGNALS[m](face);
  });

  // Learning the calm face.
  if (!s.base) {
    s.sum = { ...s.sum };
    EXPRESSIVE.forEach((m) => {
      s.sum[m] += raw[m] * dt;
    });
    s.seen += dt;
    if (s.seen >= DETECT.calibrate) {
      const base = zeros();
      EXPRESSIVE.forEach((m) => {
        base[m] = Math.min(s.sum[m] / s.seen, DETECT.restMax[m]);
      });
      s.base = base;
    }
    return { state: s, scores: null };
  }

  const scores = scoresFor(face, s.base);

  // Calm keeps learning, only from readings close to the calm face (so a
  // held expression never becomes the new calm).
  if (s.mood === "calm") {
    const k = dt / DETECT.adapt;
    const base = { ...s.base };
    EXPRESSIVE.forEach((m) => {
      if (scores[m] < 0.4)
        base[m] = Math.min(base[m] + (raw[m] - base[m]) * k, DETECT.restMax[m]);
    });
    s.base = base;
  }

  // The strongest mood that is clearly showing.
  let best: Expressive | null = null;
  EXPRESSIVE.forEach((m) => {
    if (scores[m] >= 1 && (!best || scores[m] > scores[best])) best = m;
  });

  const current = s.mood === "calm" ? null : s.mood;
  const currentScore = current ? scores[current] : 0;

  // Who wants to take over: the best, unless it is the current mood or
  // doesn't beat it by the margin.
  let wants: Expressive | null = best;
  if (wants && current) {
    if (wants === current) wants = null;
    else if (scores[wants] < currentScore + DETECT.switchMargin) wants = null;
  }
  if (wants !== s.candidate) {
    s.candidate = wants;
    s.candidateSince = t;
  }
  if (wants && t - s.candidateSince >= DETECT.hold[wants]) {
    s.mood = wants;
    s.candidate = null;
    s.lowSince = -1;
    return { state: s, scores };
  }

  // The current mood lets go after a moment below EXIT.
  if (current) {
    if (currentScore >= DETECT.exit) s.lowSince = -1;
    else {
      if (s.lowSince < 0) s.lowSince = t;
      if (t - s.lowSince >= DETECT.release) {
        s.mood = "calm";
        s.lowSince = -1;
      }
    }
  }
  return { state: s, scores };
};
