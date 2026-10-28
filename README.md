# Mood Hat

A propeller beanie that reads your face. Smile, frown, gasp, close your eyes, pout, blow a kiss or
look up in thought, and the hat changes with you: its colours wash over to the mood's, its
propeller speeds up or stops, and the mood's own pieces pop in. Relax and it's back to the calm
beanie. No text and no buttons on screen.

| Mood         | Your face                  | The hat                                                              |
| ------------ | -------------------------- | -------------------------------------------------------------------- |
| 😊 Happy     | smile                      | candy colours, heart eyes, floating hearts                           |
| 😠 Angry     | brows down                 | red and black, devil horns, grumpy cloud, nose steam                 |
| 😮 Surprised | mouth open, brows up       | rainbow, star eyes, "!" pop, mind-blown burst                        |
| 😴 Sleepy    | eyes closed about a second | night blue, the propeller stops, moon, Zzz, nose bubble              |
| 😢 Sad       | mouth corners down         | rainy blue, rain cloud over the hat, tears                           |
| 😘 Kiss      | pucker                     | hot pink, hearts circling the hat, heart gems, hearts from your lips |
| 🤔 Thinking  | look up                    | purple and gold, thought bubble, question marks                      |

- The first two seconds with your face in view learn your calm face, so a resting frown or a
  mouth that turns down doesn't count as a mood (`src/mood/detect.ts`, tested). The strongest mood
  that's clearly showing, held a moment, takes over; it lets go a moment after you relax.
- The pieces are vincentt.studio head accessories on the SDK's canonical head fit, steadied by a
  speed-adaptive spring with the head occluder in the same group, and they react to your face as
  their author built them (tears flow when you frown, Zzz grows with your eyes closed).
- Thumbnail: `public/images/mood-hat-thumbnail.jpg` (calm, then angry; the share image).
- Models: `public/models/vincentt-*.glb`; credits in `CREDITS.md`. To change what a mood wears or
  its colours, edit `src/mood/moods.ts`.
- Dev preview without a camera: the media switcher starts on the SDK's "Person Shaking Head"
  video; keys 0–7 pick a mood by hand, A goes back to reading your face; `?occ` draws the head
  occluder. How it works: `PLAN.md`.

---

# v2-template

The Vincentt starter app: a real React + R3F + Vincentt XR SDK (`@vincentt-xr/sdk`)
WebXR app, bundled by esbuild.

## Shape

```
src/
  main.tsx            mount — never edited
  App.tsx             protected shell: XRProvider + AspectRatioContainer +
                      XRScene + media-source binding, camera, lighting,
                      VideoBackground, PreviewAnchors — never edited
  Scene.tsx           the agent's surface: add SDK components and R3F
                      primitives here
  PreviewAnchors.tsx  editor-preview integration — never edited
```

See `AGENTS.md` and `GROUNDING.md` for the API reference and how to author scenes.

## Develop

```
pnpm install
pnpm dev          # esbuild dev server on localhost:5173 (output in .dev/)
pnpm preview      # on-device preview over a secure tunnel (needs `vincentt login`)
pnpm typecheck
pnpm build        # production bundle to dist/
```

## Release

`vincentt init` scaffolds from the **`latest` tag**, not from `main`. Merging to `main` does
not ship a template to creators — cutting a release does.

```
git tag 1.1.0 <sha>      # bare semver, no `v` prefix
git push origin 1.1.0    # the Release workflow verifies the tag, then moves `latest`
```

The Release workflow (`.github/workflows/release.yml`) installs from the frozen lockfile,
builds, and typechecks **the tagged tree** before force-updating `latest` to it. A tag that
fails leaves `latest` where it was, so a broken release cannot reach a new creator.

The job runs in the `release` environment, which accepts bare-semver tags only. To re-run it by
hand, dispatch it from the tag itself ("Use workflow from: 1.1.0"); a dispatch from `main` is
refused.

**Never move `latest` by hand.** It is force-updated by that workflow and nowhere else; moving
it manually decouples the pointer from the version it claims to be.

Creators can pin a specific version — `vincentt init --template 1.0.0` — which is the escape
hatch when a release turns out to be bad. That is why the version tags are immutable and only
`latest` moves.

### `MIGRATION.md` and the platform release row

Root `MIGRATION.md` carries one entry per released tag, newest first, authored in the same
PR as the change: `required: true|false`, a one-line summary, and optional notes bullets.
`required: false` means no consumer action is needed, never that the entry was skipped. The
Release workflow refuses to move `latest` for a tag with no valid entry, then — once `latest`
has moved — posts that entry as this release's row to the platform (`POST
/platform/releases`, component `template`), via `scripts/release-row.mjs`. Both steps read
`MIGRATION.md` from `main`, not from the tagged tree: the note is reviewed via PR into `main`
and is append-only per version, so `main`'s copy is the reviewed source for any tag, including
one cut before this file existed. That row is what `vincentt outdated` reads back to tell a
creator's agent what changed and what to do about it.
