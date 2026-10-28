import { describe, expect, it } from "vitest";

import {
  DETECT,
  detectState,
  stepDetect,
  type Blendshapes,
  type DetectState,
} from "./detect";

/** A resting face with a slightly sad mouth and low brows (it happens). */
const REST: Blendshapes = {
  mouthSmileLeft: 0.05,
  mouthSmileRight: 0.05,
  browDownLeft: 0.15,
  browDownRight: 0.15,
  jawOpen: 0.03,
  browInnerUp: 0.05,
  eyeBlinkLeft: 0.12,
  eyeBlinkRight: 0.12,
  mouthFrownLeft: 0.08,
  mouthFrownRight: 0.08,
  mouthPucker: 0.12,
  eyeLookUpLeft: 0.05,
  eyeLookUpRight: 0.05,
};

const SMILE = { mouthSmileLeft: 0.7, mouthSmileRight: 0.65 };
const FROWN = { browDownLeft: 0.6, browDownRight: 0.55 };
const GASP = { jawOpen: 0.55, browInnerUp: 0.5 };
const EYES_SHUT = { eyeBlinkLeft: 0.85, eyeBlinkRight: 0.9 };
const POUT = { mouthFrownLeft: 0.35, mouthFrownRight: 0.3 };
const KISS = { mouthPucker: 0.9, mouthSmileLeft: 0, mouthSmileRight: 0 };
const LOOK_UP = { eyeLookUpLeft: 0.5, eyeLookUpRight: 0.45 };

type Face = Blendshapes | null;

/** Run `face(t)` at 30 fps from `from` for `seconds`; mood changes with times. */
const run = (
  seconds: number,
  face: (t: number) => Face,
  start: DetectState = detectState(),
  from = 0,
) => {
  let s = start;
  const changes: [number, string][] = [];
  for (let i = 1; i <= seconds * 30; i += 1) {
    const t = from + i / 30;
    const before = s.mood;
    s = stepDetect(s, t, face(t)).state;
    if (s.mood !== before) changes.push([+t.toFixed(2), s.mood]);
  }
  return { state: s, changes };
};

/** A state that has learned REST (3 s of it). */
const calibrated = () => run(3, () => REST).state;

const after = (face: (t: number) => Face, seconds: number, s = calibrated()) =>
  run(seconds, face, s, 3);

describe("calibration", () => {
  it("learns the calm face first, then reads moods", () => {
    const { state, changes } = run(3, () => REST);
    expect(state.base).not.toBeNull();
    expect(changes).toEqual([]);
  });
  it("a face that smiles from the start isn't happy at once", () => {
    // Nothing shows before calibrating (no base to compare with).
    const { changes } = run(DETECT.calibrate - 0.1, () => ({
      ...REST,
      ...SMILE,
    }));
    expect(changes).toEqual([]);
  });
  it("someone grinning from the start still reads happy", () => {
    const { changes } = run(4, () => ({ ...REST, ...SMILE }));
    expect(changes.map((c) => c[1])).toEqual(["happy"]);
  });
  it("a resting face with a sad mouth stays calm", () => {
    const { changes } = after(() => REST, 5);
    expect(changes).toEqual([]);
  });
});

describe("each mood", () => {
  const cases: [string, Blendshapes][] = [
    ["happy", SMILE],
    ["angry", FROWN],
    ["surprised", GASP],
    ["sleepy", EYES_SHUT],
    ["sad", POUT],
    ["kiss", KISS],
    ["thinking", LOOK_UP],
  ];
  cases.forEach(([mood, look]) =>
    it(`${mood} shows, then calm when you relax`, () => {
      const { changes } = after(
        (t) => (t < 5 ? { ...REST, ...look } : REST),
        4,
      );
      expect(changes.map((c) => c[1])).toEqual([mood, "calm"]);
    }),
  );
});

describe("steadiness", () => {
  it("a blink isn't sleep", () => {
    const { changes } = after(
      (t) => (t > 4 && t < 4.25 ? { ...REST, ...EYES_SHUT } : REST),
      3,
    );
    expect(changes).toEqual([]);
  });
  it("sleep needs the eyes shut for a while", () => {
    const { changes } = after(
      (t) => (t > 4 ? { ...REST, ...EYES_SHUT } : REST),
      3,
    );
    expect(changes[0][1]).toBe("sleepy");
    expect(changes[0][0]).toBeGreaterThanOrEqual(4 + DETECT.hold.sleepy);
  });
  it("a flicker in the smile doesn't drop happy", () => {
    const { changes } = after(
      (t) =>
        t > 3.5 && t < 6 && !(t > 4.5 && t < 4.7)
          ? { ...REST, ...SMILE }
          : REST,
      4,
    );
    expect(changes.map((c) => c[1])).toEqual(["happy", "calm"]);
  });
  it("a fading smile holds a little, then lets go", () => {
    const half = { mouthSmileLeft: 0.3, mouthSmileRight: 0.3 }; // ~0.7
    const { changes } = after(
      (t) => (t < 4.5 ? { ...REST, ...SMILE } : { ...REST, ...half }),
      4,
    );
    // Still above EXIT: stays happy.
    expect(changes.map((c) => c[1])).toEqual(["happy"]);
  });
  it("a clearly stronger mood takes over", () => {
    const { changes } = after(
      (t) => (t < 4.5 ? { ...REST, ...SMILE } : { ...REST, ...KISS }),
      3,
    );
    expect(changes.map((c) => c[1])).toEqual(["happy", "kiss"]);
  });
  it("losing the face briefly keeps the mood; for long, back to calm", () => {
    const short = after(
      (t) => (t > 4 && t < 4.6 ? null : { ...REST, ...SMILE }),
      3,
    );
    expect(short.changes.map((c) => c[1])).toEqual(["happy"]);
    const long = after((t) => (t > 4 ? null : { ...REST, ...SMILE }), 3);
    expect(long.changes.map((c) => c[1])).toEqual(["happy", "calm"]);
  });
  it("a held expression never becomes the new calm", () => {
    const s = after(() => ({ ...REST, ...SMILE }), 30).state;
    expect(s.mood).toBe("happy");
    expect(s.base?.happy).toBeCloseTo(0.05, 2);
  });
});
