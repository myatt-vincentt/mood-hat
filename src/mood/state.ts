// Which mood shows (and the one shrinking away). One small store for the
// scene, the input and the dev keys.
import { useSyncExternalStore } from "react";

import { LEAVE } from "./Part";

export type MoodState = {
  /** Index into MOODS (0 = calm). */
  mood: number;
  /** The mood that just ended, shrinking away; −1 = none. */
  leaving: number;
  /** Bumps on every change (the burst plays once per change). */
  changes: number;
};

let current: MoodState = { mood: 0, leaving: -1, changes: 0 };
const listeners = new Set<() => void>();
let leaveTimer = 0;

const set = (next: MoodState) => {
  current = next;
  listeners.forEach((l) => l());
};

export const getMood = () => current;

export const useMood = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getMood,
    getMood,
  );

export const moodActions = {
  /** Show mood `i`; the one before shrinks away. */
  show(i: number) {
    if (i === current.mood) return;
    window.clearTimeout(leaveTimer);
    set({ mood: i, leaving: current.mood, changes: current.changes + 1 });
    leaveTimer = window.setTimeout(
      () => set({ ...current, leaving: -1 }),
      LEAVE * 1000 + 50,
    );
  },
};
