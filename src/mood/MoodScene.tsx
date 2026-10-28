// Your mood on your head: the propeller beanie always (Beanie.tsx) and the
// mood's own pieces on top, all on the filtered head (FilteredHead.tsx: the
// SDK's canonical head fit through a spring, with the depth-only head
// occluder in the same group). A new mood pops in while the old one
// shrinks away. A kiss also blows hearts from your lips (LipHearts.tsx).
//
// The models are in metres in the Spark AR face frame; FRAME turns them
// into canonical centimetres.
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
// eslint-disable-next-line import/extensions
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFaceInfo, useGesture } from "@vincentt-xr/sdk/tracking";

import { Beanie } from "./Beanie";
import { FACE_FPS, FilteredHead } from "./FilteredHead";
import { live } from "./live";
import { LipHearts } from "./LipHearts";
import { FRAME, MOODS } from "./moods";
import { Part } from "./Part";
import { useMood } from "./state";

/**
 * The blendshapes the models' face_triggers read (see rig.ts) and the
 * moods are read from (detect.ts).
 */
const FACE_INPUTS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "browDownLeft",
  "browDownRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthPucker",
  "eyeLookUpLeft",
  "eyeLookUpRight",
];
/** Per-second easing of the readings (higher = snappier, noisier). */
const FACE_EASE = 14;

/** Copies the face's blendshapes into `live` and counts head shakes. */
const FaceSignals = () => {
  // Same options as FilteredHead's FaceTracker: the first consumer of the
  // shared face model sets its face count and rate.
  const face = useFaceInfo({ active: true, numFaces: 1, targetFps: FACE_FPS });
  const raw = useRef<Readonly<Record<string, number | undefined>>>({});
  raw.current = face?.blendshapes ?? {};
  // Raw blendshapes flicker a few percent frame to frame; ease toward them.
  const smooth = useRef<Record<string, number>>({});
  useFrame((_st, dt) => {
    const k = 1 - Math.exp(-FACE_EASE * Math.min(dt, 0.1));
    const out = smooth.current;
    FACE_INPUTS.forEach((name) => {
      const v = raw.current[name] ?? 0;
      out[name] = (out[name] ?? v) + (v - (out[name] ?? v)) * k;
    });
    live.blendshapes = out;
  }, -1);
  useGesture("headShake", {
    onBegin: () => {
      live.shakes += 1;
    },
  });
  return null;
};

/** Soft studio reflections, so cloth sheen and gloss read on camera. */
const useStudioLight = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const before = scene.environment;
    scene.environment = tex;
    return () => {
      scene.environment = before;
      tex.dispose();
    };
  }, [gl, scene]);
};

export const MoodScene = () => {
  const { mood, leaving } = useMood();
  useStudioLight();
  const now = MOODS[mood];
  const old = leaving >= 0 ? MOODS[leaving] : null;
  return (
    <>
      <FaceSignals />
      <FilteredHead>
        <group name="mood-frame" scale={FRAME.scale} position={FRAME.position}>
          <Beanie />
          {old?.parts.map((p) => (
            <Part key={`${old.id}:${p.id}:out`} part={p} leaving />
          ))}
          {now.parts.map((p) => (
            <Part key={`${now.id}:${p.id}`} part={p} />
          ))}
        </group>
        <LipHearts active={now.id === "kiss"} />
      </FilteredHead>
    </>
  );
};
