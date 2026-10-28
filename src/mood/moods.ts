// The seven moods and the calm face: what each one puts on your head, the
// colours the propeller beanie turns, and how fast its propeller spins.
// Every model is a vincentt.studio head accessory
// (public/models/vincentt-*.glb), authored in metres in the "Complete 3D
// Reference - Spark AR" face frame (origin at the front of the face, +Y up,
// +Z out of the face) — see FRAME.

export type Part = {
  /** File name in public/models without `vincentt-` / `.glb`. */
  id: string;
  /**
   * Material swaps by name, to another material in the same file (the
   * models carry their colour presets as spare materials). The default
   * preset's finish is applied first, on every part.
   */
  materials?: Record<string, string>;
  /** Tints by material name (on this part's own copy of the material). */
  colors?: Record<string, string>;
  /** Fine placement: `x` / `y` / `z` canonical cm, `scale` about its middle. */
  fit?: { x?: number; y?: number; z?: number; scale?: number };
};

/** The beanie's colour zones (its materials are `mat_<zone>`). */
export type BeanieColors = {
  panel_a: string;
  panel_b: string;
  panel_c: string;
  seams: string;
  trim: string;
  bill: string;
  button: string;
  blade_a: string;
  blade_b: string;
  hub: string;
};

export type MoodId =
  | "calm"
  | "happy"
  | "angry"
  | "surprised"
  | "sleepy"
  | "sad"
  | "kiss"
  | "thinking";

export type Mood = {
  id: MoodId;
  emoji: string;
  /** What this mood adds on top of the beanie. */
  parts: Part[];
  beanie: BeanieColors;
  /** Propeller turns per second. */
  spin: number;
};

/**
 * The floating reactions are made to sit on the head; the beanie and its
 * propeller are in the way, so they float this much higher (cm).
 */
const LIFT = 5;

const CLASSIC: BeanieColors = {
  panel_a: "#D7262E",
  panel_b: "#F4C21F",
  panel_c: "#1F5FBF",
  seams: "#F2F2EE",
  trim: "#F4C21F",
  bill: "#1F5FBF",
  button: "#D7262E",
  blade_a: "#D7262E",
  blade_b: "#1F5FBF",
  hub: "#F4C21F",
};

export const MOODS: readonly Mood[] = [
  {
    id: "calm",
    emoji: "🙂",
    parts: [],
    beanie: CLASSIC,
    spin: 0.6,
  },
  {
    id: "happy",
    emoji: "😊",
    parts: [
      { id: "eye-heart-eyes" },
      { id: "react-floating-hearts", fit: { y: LIFT } },
    ],
    beanie: {
      panel_a: "#FF7AB6",
      panel_b: "#FFE36E",
      panel_c: "#7FE3D6",
      seams: "#FFFFFF",
      trim: "#FFFFFF",
      bill: "#FF7AB6",
      button: "#FFE36E",
      blade_a: "#FF7AB6",
      blade_b: "#FFE36E",
      hub: "#FFFFFF",
    },
    spin: 2.5,
  },
  {
    id: "angry",
    emoji: "😠",
    parts: [
      { id: "horns-devil" },
      { id: "nose-angry-steam" },
      { id: "react-grumpy-cloud", fit: { y: LIFT } },
    ],
    beanie: {
      panel_a: "#C8102E",
      panel_b: "#2B2D42",
      panel_c: "#EF233C",
      seams: "#1A1A1A",
      trim: "#2B2D42",
      bill: "#C8102E",
      button: "#1A1A1A",
      blade_a: "#2B2D42",
      blade_b: "#EF233C",
      hub: "#1A1A1A",
    },
    spin: 4,
  },
  {
    id: "surprised",
    emoji: "😮",
    parts: [
      { id: "eye-star-eyes" },
      { id: "react-exclamation-pop", fit: { y: LIFT } },
      { id: "react-mind-blown", fit: { y: LIFT } },
    ],
    beanie: {
      panel_a: "#E63946",
      panel_b: "#F4A261",
      panel_c: "#2A9D8F",
      seams: "#F2F2EE",
      trim: "#E9C46A",
      bill: "#2A9D8F",
      button: "#E9C46A",
      blade_a: "#E9C46A",
      blade_b: "#E76F51",
      hub: "#264653",
    },
    spin: 5,
  },
  {
    id: "sleepy",
    emoji: "😴",
    parts: [
      { id: "eye-sleepy-zzz" },
      { id: "nose-sleep-bubble" },
      { id: "react-sleepy-moon", fit: { y: LIFT } },
    ],
    beanie: {
      panel_a: "#2E3A6B",
      panel_b: "#4A5899",
      panel_c: "#1E2647",
      seams: "#C9D3FF",
      trim: "#C9D3FF",
      bill: "#1E2647",
      button: "#F4D968",
      blade_a: "#4A5899",
      blade_b: "#C9D3FF",
      hub: "#F4D968",
    },
    spin: 0,
  },
  {
    id: "sad",
    emoji: "😢",
    parts: [
      { id: "eye-cartoon-tears" },
      { id: "rain-cloud-hat", fit: { y: -4.5, scale: 0.75 } },
    ],
    beanie: {
      panel_a: "#5B7C99",
      panel_b: "#8FB3D1",
      panel_c: "#3E5872",
      seams: "#DDE6EE",
      trim: "#8FB3D1",
      bill: "#3E5872",
      button: "#5B7C99",
      blade_a: "#8FB3D1",
      blade_b: "#5B7C99",
      hub: "#DDE6EE",
    },
    spin: 0.15,
  },
  {
    id: "kiss",
    emoji: "😘",
    parts: [
      { id: "gems-rhinestone-heart-cheeks" },
      { id: "halo-orbiting-hearts", fit: { y: 4 } },
    ],
    beanie: {
      panel_a: "#FF4F8B",
      panel_b: "#FFC2D6",
      panel_c: "#E0115F",
      seams: "#FFFFFF",
      trim: "#FFC2D6",
      bill: "#E0115F",
      button: "#FFFFFF",
      blade_a: "#FF4F8B",
      blade_b: "#FFFFFF",
      hub: "#FFC2D6",
    },
    spin: 1.5,
  },
  {
    id: "thinking",
    emoji: "🤔",
    parts: [
      { id: "react-thought-bubble", fit: { y: LIFT } },
      { id: "react-question-marks", fit: { y: LIFT } },
    ],
    beanie: {
      panel_a: "#7B5EA7",
      panel_b: "#F4D968",
      panel_c: "#4C6EF5",
      seams: "#F2F2EE",
      trim: "#F4D968",
      bill: "#4C6EF5",
      button: "#F4D968",
      blade_a: "#F4D968",
      blade_b: "#7B5EA7",
      hub: "#F2F2EE",
    },
    spin: 1,
  },
];

export const moodIndex = (id: MoodId) => MOODS.findIndex((m) => m.id === id);

export const BEANIE_ID = "propeller-beanie";

/**
 * The beanie is made for a slimmer head than the SDK's occluder: at its
 * own size the skull pokes through the crown's sides. Grown about the
 * crown's middle (`centre`, model metres) and raised (`y`, canonical cm).
 */
export const BEANIE_FIT = {
  centre: [0, 0.113, -0.117] as const,
  scale: 1.08,
  y: 0.5,
};

export const modelUrl = (id: string) => `/models/vincentt-${id}.glb`;

/** The SDK's v3 head occluder, hosted here until the SDK CDN serves it. */
export const OCCLUDER_URL = "/models/head-occluder-v3.glb";

/** The SDK's neck-and-shoulders bust occluder (same story). */
export const NECK_OCCLUDER_URL = "/models/neck-occluder-bust-v1.glb";

/**
 * The models' frame → the SDK's canonical head frame (centimetres): ×100,
 * then the same shift the SDK used to move the Spark AR reference into the
 * canonical frame (chins and nose tips aligned; vincentt-xr-sdk
 * assets-src/head-occluder/README.md).
 */
export const FRAME = {
  scale: 100,
  position: [0, -1.03, 7.3] as const,
};
