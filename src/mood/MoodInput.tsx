// Reads your mood from your face (detect.ts) every frame and shows it.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { detectState, stepDetect } from "./detect";
import { live } from "./live";
import { moodIndex } from "./moods";
import { moodActions } from "./state";

export const MoodInput = () => {
  const machine = useRef(detectState());
  useFrame(() => {
    const face = live.tracked ? (live.override ?? live.blendshapes) : null;
    const { state, scores } = stepDetect(
      machine.current,
      performance.now() / 1000,
      face,
    );
    machine.current = state;
    live.scores = scores;
    if (!live.manual) moodActions.show(moodIndex(state.mood));
  });
  return null;
};
