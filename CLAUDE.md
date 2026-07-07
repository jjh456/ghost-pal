# Ghost Pal - A Phasmo Ghost ID Helper

A quick, mobile-friendly tool to sit on a desk next to the PC and narrow down
the ghost type in Phasmophobia based on evidence and behavior observed during
a contract.

## Platform decision

**Mobile-friendly PWA** (plain HTML/CSS/JS, no build step, no framework).

- Installable to phone homescreen, works offline via a service worker
- No app store friction, fastest to iterate on
- Data lives in `data/ghosts.json` so it's easy to update after game patches

## Core interaction

A single-screen live filter, not a session log:

1. User taps evidence types they've confirmed (EMF5, Orb, Spirit Box,
   Freezing, UV, Writing, DOTS).
2. User taps behavior traits they've observed (see "Trait tags" below).
3. Remaining possible ghosts update live as a list, ruled-out ghosts are
   grayed out / collapsed rather than deleted (so the user can undo).
4. No timestamps, no history — reset button clears state for a new contract.

## Data

`data/ghosts.json` — 29 ghost types, each with:

- `evidence`: array of exactly 3 evidence codes
- `female`: `true` if always female (Banshee, Dayan), else `null`
- `strength` / `weakness`: short behavior text pulled from the wiki
- `special`: optional flag for ghosts with unique filtering rules

Researched from the Phasmophobia Fandom wiki as of 2026-07-01. **Re-verify
against the in-game journal if Kinetic Games ships a patch that changes the
evidence pool** — this is a modded/fan-community-tracked game that updates
its ghost roster periodically.

## Filtering rules (important — don't just do a naive intersection)

- **Standard evidence match:** a tapped evidence type eliminates every ghost
  whose `evidence` array doesn't contain it — _except_ ghosts with a
  `special` flag that says otherwise (see Mimic below).
- **The Mimic (`special: "DO_NOT_ELIMINATE_ON_ORB"`):** The Mimic's real
  evidence is Spirit Box / Freezing / UV, but it always fakes a Ghost Orb as
  a bonus/secondary piece of evidence. **If the user taps "Ghost Orb," do
  not eliminate the Mimic**, even though Orb isn't in its evidence array.
  Surface it in the UI as "still possible — could be a Mimic faking Orb"
  so the user isn't confused why it didn't get filtered like the others.
  A 4th evidence type appearing at all (i.e., more than 3 evidence types
  get confirmed in one contract) is itself a strong signal the ghost is
  the Mimic — worth a subtle callout in the UI, not an auto-lock.
- **Gender check:** if the user confirms the ghost is male, eliminate
  Banshee and Dayan (`female: true`). If confirmed female, no elimination
  happens (all ghosts have a 50/50 shot at female except those two, who are
  always female) — just note it's consistent with everything.
- **Trait tags → weakness/strength text matching:** rather than hardcoding
  every behavioral rule as its own filter, show trait toggles (fast hunter,
  slow-then-fast, teleports, drains sanity fast, avoids salt, disabled by
  fuse box, etc.) and match them against each ghost's `strength`/`weakness`
  text. Keep this simple for v1 — a tag-to-ghost-name lookup table is fine,
  doesn't need NLP.

## Hosting

**GitHub Pages**, serving from a project repo (`username.github.io/repo-name/`),
not a root user/org site. This matters for the code:

- `manifest.json`'s `start_url` and icon paths must be **relative**
  (`"start_url": "./"`, `"icon-192.png"`), not absolute (`"/icon-192.png"`) —
  absolute paths break under a subpath.
- `sw.js` must be registered with a relative path
  (`navigator.serviceWorker.register('./sw.js')`) and its cache list should
  use relative URLs too, or the service worker scope will be wrong and
  offline caching won't work.
- Any `fetch('data/ghosts.json')` calls should stay relative (no leading `/`).
- Enable Pages in repo Settings → Pages → Deploy from branch (`main`, `/root`
  or `/docs`, whichever the repo ends up using).

## File structure to build

```
/
├── index.html          # single page, mobile-first layout
├── app.js              # filter logic, state management
├── style.css           # mobile-first, large tap targets
├── manifest.json        # PWA manifest, add-to-homescreen
├── sw.js                # service worker, cache-first for offline use
└── data/
    └── ghosts.json      # already created — ghost/evidence dataset
```

## Design notes

- Large tap targets — this is used one-handed, glancing at a phone on a desk
  mid-game, often in a dim room.
- Dark theme by default (matches the game's aesthetic, easier on eyes).
- No build tooling, no npm dependencies — keep it a drag-and-drop static
  site that also works opened directly as a file or hosted anywhere trivial
  (GitHub Pages, Netlify drop, etc.).

## Explicit non-goals for v1

- No session/timestamp journal (decided against — adds complexity without
  clear benefit for a quick desk tool).
- No multiplayer sync between teammates' phones.
- No login/accounts.
