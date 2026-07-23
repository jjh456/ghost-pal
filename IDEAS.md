# Ghost Pal — Ideas / Roadmap

Running list of companion-app features beyond the core evidence filter.
Framing: the app is good at **identification** (you tell it what you saw, it
narrows the list). The biggest wins left make it **output-driven** too — it
tells you what to check next and what to do once you've narrowed down.

## Done

- **Difficulty selector** (header tap-to-cycle). On Nightmare (2 evidence) and
  Insanity (1), a ghost's evidence is randomly hidden, so "confirmed absent"
  can't be trusted — negative marks stop eliminating and the evidence chips
  stop cycling into the absent state.
- **Hunt sanity threshold badges** — skull + sanity-% badge on ghost cards for
  non-standard thresholds (red when >50 = hunts sooner, dim when <50). Seeded
  with confident single values: Demon 70, Deogen 40, Shade 35.

## Open

1. **Per-ghost "how to confirm this one" tell.** _(Highest gameplay payoff.)_
   A one-liner definitive test per ghost: Obake → photo it for 6 fingers;
   Banshee → parabolic mic; Goryo → DOTS only on a video-cam feed. Turns the
   app from "here's what's left" into "here's how to close it out." Most useful
   when down to 1–3 candidates. Mostly data entry into `ghosts.json` plus a
   small display line — no new interaction model.

2. **Speed-vs-you.** The `huntSpeed` data exists, but "normal" doesn't help
   mid-chase. Reframe as _faster than you / you can outrun it / line-of-sight =
   deadly_. Overlaps the already-planned "speed/accel on ghost tiles" info-icon,
   so it'd likely share that surface. Needs the same journal verification as the
   threshold data.

3. **"What to check next" hint.** When 2+ ghosts remain, surface which
   still-findable evidence best splits them, e.g. "3 left — check Freezing to
   separate Onryo from Mare/Yurei." Speeds up the core loop. The meatiest logic
   addition of the bunch.

4. **Remaining evidence pool readout.** A tiny line showing which evidence
   types are still live across the candidates, so you know what's worth hunting
   for versus already decided.

## Parked

- **Hunt / smudge timers.** Cross into the timestamp/journal territory that
  CLAUDE.md rules out for v1.

## Data-verification caveats

Ghost numbers (speeds, hunt thresholds) must be verified against the in-game
journal, not inferred from strength/weakness text. The Fandom wiki blocks
fetching, so paste values in when adding them.

- **Hunt thresholds still to add** (conditional — a single number misleads):
  Mare 60 dark / 40 light, Yokai ~80 when players talk nearby, Raiju ~65 near
  active electronics, Thaye high-then-decreasing with age. See
  `data/ghosts.json` → `_meta.huntNote`.
- **Speed gaps:** Obambo aggressive/calm hunt speeds, Gallu line-of-sight
  behavior. See `data/ghosts.json` → `_meta.speedNote`.
