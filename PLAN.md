# Plan — Mood Hat

A propeller beanie that changes with your mood. Built on SDK 2.0.0-alpha.9 with the vincentt.studio
head accessories; the head pipeline is shared with Try-On Studio and Spirit Animal Reveal.

## Decisions (from the creator)

- Seven moods: happy, angry, surprised, sleepy, sad, kiss (pucker) and thinking (look up).
- One mood at a time: the strongest wins; the old one shrinks away as the new one pops in.
- The calm face wears a base hat, the propeller beanie, always on; each mood recolours it and sets
  its propeller speed.
- Minimal: no HUD, no sound, no text. A kiss also blows hearts from the lips.
- Calibrate to each person's calm face.

## How it works

- `moods.ts`: each mood's pieces (with fine `fit`), beanie colours and propeller speed. The
  floating reactions sit 5 cm higher than authored, above the beanie and its propeller.
- `Beanie.tsx`: the beanie, its colour zones eased to the mood's colours and its propeller to the
  mood's speed. It is grown 8 % and raised 0.5 cm (`BEANIE_FIT`) so the head occluder doesn't
  poke through its crown, and the crown is drawn one-sided so no lining shows at the temples.
- `Part.tsx`: loads a piece (shared cache), applies its default preset's finish, plays its autoplay
  loops, follows its face triggers (`rig.ts`), wobbles on a head shake, pops in and shrinks away.
- `FilteredHead.tsx` + `headFilter.ts` (tested): the SDK's canonical head fit through a
  speed-adaptive critically damped spring, the depth-only v3 head occluder in the same group, the
  SDK's `NeckOccluder` in the face tracker. Face model 20 Hz.
- `detect.ts` (tested) + `MoodInput.tsx`: one reading per mood from the blendshapes, scored against
  the calm face learnt in the first 2 s (capped, so someone already smiling still reads happy, and
  kept up to date slowly while calm). Score 1 = clearly showing; held 0.2–0.4 s (sleepy 0.9 s, so
  a blink isn't sleep) it shows; below 0.55 for 0.4 s it lets go; a different mood takes over when
  it beats the current one by 0.25; a second without a face goes back to calm.
- `LipHearts.tsx`: the kiss's hearts, a puff at the start then a stream that grows with the pucker,
  fanning out from the lips (instanced, on the filtered head).
- Dev only: `DevKeys.tsx` (keys 0–7 / A, `window.__mood`), `DevMediaSwitcher.tsx`, `?occ`.
- Checks: `audit/` (look sheets, hat fit while the head turns, the mood reading on each clip).

## Known limits

- MediaPipe reads a pursed "oh" much like a kiss; the SDK's "Person Looking" video gets a brief
  kiss when he purses his lips.
- The SDK's sample videos only show calm and smiling faces; the other moods are covered by the
  unit tests and need a webcam check.
