// The propeller beanie: always on, the calm face's hat. Each mood eases its
// colour zones to that mood's colours and its propeller to that mood's
// speed, so a mood change washes over the hat instead of swapping it.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AnimationMixer,
  Color,
  FrontSide,
  LoopRepeat,
  type AnimationAction,
  type Material,
  type Mesh,
} from "three";
// eslint-disable-next-line import/extensions
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useXRAsset } from "@vincentt-xr/sdk";

import { BEANIE_FIT, BEANIE_ID, MOODS, type BeanieColors } from "./moods";
import { assetFor, ORDER } from "./Part";
import { useMood } from "./state";

/** Per-second easing of the colours and the propeller. */
const EASE = { color: 6, spin: 3 };

type Tinted = Material & { color: Color };

/** Crown zones drawn from outside only (the bill keeps its underside). */
const ONE_SIDED = new Set<keyof BeanieColors>([
  "panel_a",
  "panel_b",
  "panel_c",
  "seams",
  "trim",
]);

export const Beanie = () => {
  const { value } = useXRAsset(assetFor(BEANIE_ID));
  const { mood } = useMood();
  const target = MOODS[mood];

  const model = useMemo(() => {
    if (!value) return null;
    const root = cloneSkinned(value.scene);
    // Each zone gets its own material copy, eased toward the mood's colour.
    const zones = new Map<keyof BeanieColors, Tinted>();
    root.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      const mat = m.material as Material;
      const zone = mat.name.replace(/^mat_/, "") as keyof BeanieColors;
      if (zone in MOODS[0].beanie) {
        let t = zones.get(zone);
        if (!t) {
          t = mat.clone() as Tinted;
          // The crown is double-sided; its dark lining would show in the
          // gap at the temples. One-sided, that gap shows your own hair.
          if (ONE_SIDED.has(zone)) t.side = FrontSide;
          zones.set(zone, t);
        }
        m.material = t;
      }
      m.renderOrder = (m.material as Material).transparent
        ? ORDER[1]
        : ORDER[0];
    });
    const mixer = new AnimationMixer(root);
    const spin = value.animations.find((c) => c.name === "propellerSpin");
    const action: AnimationAction | null = spin
      ? mixer.clipAction(spin).setLoop(LoopRepeat, Infinity)
      : null;
    action?.play();
    return { root, zones, mixer, action };
  }, [value]);

  // Start on the mood's colours (no ease from the file's own).
  useEffect(() => {
    model?.zones.forEach((m, z) => m.color.set(MOODS[0].beanie[z]));
    return () => {
      model?.mixer.stopAllAction();
    };
  }, [model]);

  const goal = useMemo(() => new Color(), []);
  const speed = useRef(MOODS[0].spin);
  useFrame((_st, dt) => {
    if (!model) return;
    const step = Math.min(dt, 0.1);
    const kc = 1 - Math.exp(-EASE.color * step);
    model.zones.forEach((m, z) => {
      goal.set(target.beanie[z]);
      m.color.lerp(goal, kc);
    });
    speed.current +=
      (target.spin - speed.current) * (1 - Math.exp(-EASE.spin * step));
    if (model.action) model.action.timeScale = speed.current;
    model.mixer.update(step);
  });

  if (!model) return null;
  const { centre: c, scale: k, y } = BEANIE_FIT;
  return (
    <group
      position={[c[0] * (1 - k), c[1] * (1 - k) + y / 100, c[2] * (1 - k)]}
      scale={k}
    >
      <primitive object={model.root} />
    </group>
  );
};
