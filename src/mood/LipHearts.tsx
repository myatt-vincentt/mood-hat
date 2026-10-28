// Kiss: little hearts float out from your lips — a puff of them when the
// kiss starts, then a stream that gets busier the more you pucker. Lives
// on the filtered head (canonical cm), so they leave from where your lips
// are and drift up and toward the camera. Drawn last, over the face.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";

import { live } from "./live";

const HEARTS = {
  max: 28,
  /** Seconds each heart lives. */
  life: 1.7,
  /** Hearts at the start of a kiss. */
  burst: 7,
  /** Hearts per second: relaxed lips → full pucker. */
  rate: [2.5, 9] as const,
  /** Just in front of the lips (canonical cm; the SDK's landmarks 13/14). */
  lips: [0, -4.3, 6.4] as const,
  /** Size range, cm. */
  size: [1.8, 3.2] as const,
  colors: ["#ff4f8b", "#ff7aa8", "#e0115f", "#ffc2d6"],
  renderOrder: 20,
};

const heartTexture = () => {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.translate(s / 2, s * 0.56);
  g.scale(s / 36, s / 36);
  const path = new Path2D(
    "M0 11 C-3 8 -15 1 -15 -6 C-15 -11 -11 -14 -7.5 -14 C-4 -14 -1.5 -12 0 -9 C1.5 -12 4 -14 7.5 -14 C11 -14 15 -11 15 -6 C15 1 3 8 0 11 Z",
  );
  g.fillStyle = "#fff";
  g.fill(path);
  // A small highlight, so they read as glossy candy hearts.
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.beginPath();
  g.ellipse(-7, -8, 3.2, 2, -0.6, 0, Math.PI * 2);
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

type Heart = {
  born: number;
  x: number;
  y: number;
  /** Velocity, cm/s. */
  vx: number;
  vy: number;
  vz: number;
  size: number;
  sway: number;
  phase: number;
  color: Color;
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export const LipHearts = ({ active }: { active: boolean }) => {
  const mesh = useRef<InstancedMesh>(null);
  const hearts = useRef<Heart[]>([]);
  const owed = useRef(0);
  const burst = useRef(false);

  const parts = useMemo(
    () => ({
      geo: new PlaneGeometry(1, 1),
      mat: new MeshBasicMaterial({
        map: heartTexture(),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
      palette: HEARTS.colors.map((c) => new Color(c)),
    }),
    [],
  );

  useEffect(() => {
    if (active) burst.current = true;
  }, [active]);

  const dummy = useMemo(() => new Object3D(), []);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const now = state.clock.elapsedTime;
    const list = hearts.current;
    const spawn = () => {
      if (list.length >= HEARTS.max) return;
      const r = Math.random;
      list.push({
        born: now,
        x: (r() - 0.5) * 1.2,
        y: (r() - 0.5) * 0.6,
        // Fanning out to either side and up, a little toward the camera.
        vx: (r() < 0.5 ? -1 : 1) * (3 + r() * 7),
        vy: 4 + r() * 5,
        vz: 2 + r() * 3,
        size: HEARTS.size[0] + r() * (HEARTS.size[1] - HEARTS.size[0]),
        sway: 0.4 + r() * 0.6,
        phase: r() * Math.PI * 2,
        color: parts.palette[Math.floor(r() * parts.palette.length)],
      });
    };
    if (burst.current) {
      burst.current = false;
      for (let i = 0; i < HEARTS.burst; i += 1) spawn();
    }
    if (active) {
      const pucker = Math.min(1, (live.blendshapes.mouthPucker ?? 0) / 0.6);
      owed.current +=
        Math.min(dt, 0.1) *
        (HEARTS.rate[0] + (HEARTS.rate[1] - HEARTS.rate[0]) * pucker);
      while (owed.current >= 1) {
        owed.current -= 1;
        spawn();
      }
    } else owed.current = 0;

    hearts.current = list.filter((h) => now - h.born < HEARTS.life);
    m.visible = hearts.current.length > 0;
    hearts.current.forEach((h, i) => {
      const age = now - h.born;
      const k = age / HEARTS.life;
      dummy.position.set(
        HEARTS.lips[0] +
          h.x +
          h.vx * age +
          Math.sin(age * 5 + h.phase) * h.sway,
        HEARTS.lips[1] + h.y + h.vy * age,
        HEARTS.lips[2] + h.vz * age,
      );
      dummy.rotation.set(0, 0, Math.sin(age * 4 + h.phase) * 0.35);
      // Pops up to size quickly (ease-out), then shrinks away over the last
      // third of its life.
      const grow = easeOut(Math.min(1, age / 0.25));
      const fade = k < 0.66 ? 1 : 1 - easeOut((k - 0.66) / 0.34);
      dummy.scale.setScalar(Math.max(1e-4, h.size * grow * fade));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, h.color);
    });
    m.count = hearts.current.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[parts.geo, parts.mat, HEARTS.max]}
      frustumCulled={false}
      renderOrder={HEARTS.renderOrder}
      visible={false}
    />
  );
};
