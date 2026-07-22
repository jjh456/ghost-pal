const EVIDENCE_LABELS = {
  EMF5: "EMF 5",
  Orb: "Orbs",
  SpiritBox: "Spirit Box",
  Freezing: "Freezing",
  UV: "UV",
  Writing: "Writing",
  DOTS: "DOTS",
};

// Compact labels for ghost-card meta lines, where 3 evidence names need to
// share one row without wrapping. Full names stay on the evidence chips.
const EVIDENCE_LABELS_SHORT = {
  EMF5: "EMF5",
  Orb: "Orbs",
  SpiritBox: "Sp. Box",
  Freezing: "Freeze",
  UV: "UV",
  Writing: "Writing",
  DOTS: "DOTS",
};

// Curated v1 trait set — maps a plain-language behavior to the ghost(s)
// consistent with it. Not exhaustive; expand as needed in data alongside
// ghosts.json's strength/weakness text.
const TRAITS = [
  { id: "always-knows-location", label: "Always knows your location in a hunt", ghosts: ["Deogen"] },
  { id: "fast-far-slow-close", label: "Very fast far away, crawls up close", ghosts: ["Deogen"] },
  { id: "speeds-electronics", label: "Speeds up near active electronics", ghosts: ["Raiju"] },
  { id: "speeds-cold", label: "Speeds up in cold, slows in warm areas", ghosts: ["Hantu"] },
  { id: "fuse-disabled", label: "Ability disabled with fuse box off", ghosts: ["Jinn"] },
  { id: "never-lights-on", label: "Never turns a light on itself", ghosts: ["Mare"] },
  { id: "teleports", label: "Teleports to a random player", ghosts: ["Wraith"] },
  { id: "no-salt-tracks", label: "Won't step in salt / no footstep tracking", ghosts: ["Wraith"] },
  { id: "photo-vanish", label: "Photographing it makes it disappear", ghosts: ["Phantom"] },
  { id: "multi-throw", label: "Throws multiple objects at once", ghosts: ["Poltergeist"] },
  { id: "three-candles", label: "Forces a hunt after 3 candles blown out", ghosts: ["Onryo"] },
  { id: "shapeshifts", label: "Briefly shapeshifts model during a hunt", ghosts: ["Obake"] },
  { id: "goryo-room", label: "DOTS only when alone; stuck near one room", ghosts: ["Goryo"] },
  { id: "one-fast-one-slow", label: "One hunter is fast, the other slow", ghosts: ["The Twins"] },
  { id: "single-target", label: "Fixates on and targets one player", ghosts: ["Banshee"] },
  { id: "curses-sanity", label: "Curses a player, faster sanity drain", ghosts: ["Moroi"] },
  { id: "no-hunt-crowded", label: "Won't hunt if people are nearby", ghosts: ["Shade"] },
  { id: "talk-raises-threshold", label: "Talking nearby raises its hunt threshold", ghosts: ["Yokai"] },
  { id: "slows-with-moved-items", label: "Very fast early, slows as more unique items get moved", ghosts: ["Deildegast"] },
];

const state = {
  ghosts: [],
  evidence: new Map(), // code -> 'positive' | 'negative'; absent = unknown
  traits: new Set(),
  gender: null, // null (unknown) | 'male' | 'female'
  huntSpeed: null, // null | 'slow' | 'normal' | 'fast'
  losAccel: null, // null | 'none' | 'normal' | 'fast'
  traitsExpanded: false, // traits are for advanced players — start tucked away
  manuallyOut: new Set(), // ghost names the user crossed off by hand
};

// Single-select observations as cycle selectors: each tap steps through
// unset → value → … → unset, the same pattern the evidence chips teach.
// The button doubles as the readout, so nothing expands or shifts layout.
const OBS_CONTROLS = [
  {
    key: "gender",
    name: "Gender",
    cycle: ["male", "female"],
    valueLabels: { male: "Male", female: "Female" },
  },
  {
    key: "huntSpeed",
    name: "Hunt speed",
    cycle: ["slow", "normal", "fast"],
    valueLabels: { slow: "Slow", normal: "Normal", fast: "Fast" },
  },
  {
    key: "losAccel",
    name: "LoS speedup",
    cycle: ["none", "normal", "fast"],
    valueLabels: { none: "None", normal: "Normal", fast: "Fast" },
  },
];

const els = {
  evidenceRow: document.getElementById("evidenceRow"),
  traitsRow: document.getElementById("traitsRow"),
  traitsToggle: document.getElementById("traitsToggle"),
  traitsToggleLabel: document.getElementById("traitsToggleLabel"),
  traitsCount: document.getElementById("traitsCount"),
  resultsList: document.getElementById("resultsList"),
  resultCount: document.getElementById("resultCount"),
  resetBtn: document.getElementById("resetBtn"),
};

async function loadGhosts() {
  const res = await fetch("./data/ghosts.json");
  const data = await res.json();
  state.ghosts = data.ghosts;
}

// aria-pressed cycles false (unknown) -> true (positive) -> mixed (negative/crossed out) -> false.
function evidenceAriaValue(mark) {
  if (mark === "positive") return "true";
  if (mark === "negative") return "mixed";
  return "false";
}

function buildEvidenceChips() {
  els.evidenceRow.innerHTML = "";
  Object.entries(EVIDENCE_LABELS).forEach(([code, label]) => {
    const chip = document.createElement("button");
    chip.className = "chip chip--sm";
    chip.type = "button";
    chip.dataset.evidence = code;
    chip.setAttribute("aria-pressed", "false");
    chip.textContent = label;
    chip.addEventListener("click", () => {
      const current = state.evidence.get(code);
      const next = !current ? "positive" : current === "positive" ? "negative" : undefined;
      if (next) state.evidence.set(code, next);
      else state.evidence.delete(code);
      chip.setAttribute("aria-pressed", evidenceAriaValue(next));
      render();
    });
    els.evidenceRow.appendChild(chip);
  });
}

// Picks which traits are worth showing: currently-selected ones stay put
// (so they can be un-toggled), followed by traits whose ghost(s) are
// still in the running.
function pickVisibleTraits(possibleNames) {
  const selected = TRAITS.filter((t) => state.traits.has(t.id));
  const relevant = TRAITS.filter(
    (t) => !state.traits.has(t.id) && t.ghosts.some((g) => possibleNames.has(g))
  );
  return [...selected, ...relevant];
}

function buildTraitChips(traits) {
  els.traitsRow.innerHTML = "";
  traits.forEach((trait) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.dataset.trait = trait.id;
    chip.setAttribute("aria-pressed", String(state.traits.has(trait.id)));
    chip.innerHTML = `${trait.label} <span class="chip__hint">${trait.ghosts.join(", ")}</span>`;
    chip.addEventListener("click", () => {
      if (state.traits.has(trait.id)) state.traits.delete(trait.id);
      else state.traits.add(trait.id);
      render();
    });
    els.traitsRow.appendChild(chip);
  });
}

// Traits are for advanced players, so the panel starts collapsed and
// just advertises how many are still relevant.
// The count goes amber while trait filters are active, so a collapsed
// panel still signals it's affecting results.
function updateTraitsPanel(possibleNames) {
  const visible = pickVisibleTraits(possibleNames);

  els.traitsCount.textContent = `${visible.length}/${TRAITS.length} possible`;
  els.traitsCount.classList.toggle("panel__count--active", state.traits.size > 0);
  els.traitsToggle.setAttribute("aria-expanded", String(state.traitsExpanded));
  els.traitsToggleLabel.textContent = state.traitsExpanded ? "Collapse" : "Expand";
  els.traitsRow.hidden = !state.traitsExpanded;

  buildTraitChips(state.traitsExpanded ? visible : []);
}

// Syncs the cycle selectors to state: value slot shows the set value (or
// a dim em dash when unset) and the button goes amber when set.
function updateObsControls() {
  OBS_CONTROLS.forEach((ctl) => {
    const value = state[ctl.key];
    ctl.valEl.textContent = value ? ctl.valueLabels[value] : "—";
    ctl.btnEl.classList.toggle("obs-cycle--set", Boolean(value));
    ctl.btnEl.setAttribute(
      "aria-label",
      `${ctl.name}: ${value ? ctl.valueLabels[value] : "not set"}. Tap to cycle.`
    );
  });
}

function wireObservations() {
  OBS_CONTROLS.forEach((ctl) => {
    ctl.btnEl = document.querySelector(`.obs-cycle[data-obs="${ctl.key}"]`);
    ctl.valEl = ctl.btnEl.querySelector(".obs-cycle__val");
    ctl.btnEl.addEventListener("click", () => {
      // indexOf(null) is -1, so an unset control advances to cycle[0];
      // the last value wraps back to unset.
      const i = ctl.cycle.indexOf(state[ctl.key]);
      state[ctl.key] = i === ctl.cycle.length - 1 ? null : ctl.cycle[i + 1];
      render();
    });
  });
}

// Edge-fade scroll hints: fade a scroller's clipped edge while more
// content lies in that direction (mask gradients in CSS keyed off these
// classes). Re-run on scroll, resize, and after every render since
// content height changes.
function updateScrollFade(el) {
  el.classList.toggle("scroll-fade--up", el.scrollTop > 4);
  el.classList.toggle("scroll-fade--down", el.scrollTop + el.clientHeight < el.scrollHeight - 4);
}

function wireScrollFades() {
  [els.traitsRow, els.resultsList].forEach((el) => {
    el.addEventListener("scroll", () => updateScrollFade(el), { passive: true });
  });
  window.addEventListener("resize", () => {
    updateScrollFade(els.traitsRow);
    updateScrollFade(els.resultsList);
  });
}

function wireTraitsToggle() {
  els.traitsToggle.addEventListener("click", () => {
    state.traitsExpanded = !state.traitsExpanded;
    render();
  });
}

function wireReset() {
  els.resetBtn.addEventListener("click", () => {
    state.evidence.clear();
    state.traits.clear();
    state.gender = null;
    state.huntSpeed = null;
    state.losAccel = null;
    state.traitsExpanded = false;
    state.manuallyOut.clear();
    document.querySelectorAll(".chip[data-evidence]").forEach((c) => c.setAttribute("aria-pressed", "false"));
    render();
  });
}

function toggleManuallyOut(name) {
  if (state.manuallyOut.has(name)) state.manuallyOut.delete(name);
  else state.manuallyOut.add(name);
  render();
}

// Returns { possible: bool, mimicFlag: bool, matchCount: int }
function evaluateGhost(ghost) {
  let ruledOut = false;
  let mimicFlag = false;
  const isMimic = ghost.special === "DO_NOT_ELIMINATE_ON_ORB";

  // Evidence check
  for (const [code, mark] of state.evidence) {
    const hasIt = ghost.evidence.includes(code);
    if (mark === "positive" && !hasIt) {
      if (isMimic && code === "Orb") {
        // Mimic fakes Orb — never eliminate on this evidence alone.
        mimicFlag = true;
        continue;
      }
      ruledOut = true;
    }
    if (mark === "negative" && hasIt) {
      // Evidence confirmed absent — any ghost that requires it is out.
      ruledOut = true;
    }
  }

  // Gender check
  if (state.gender === "male" && ghost.female === true) {
    ruledOut = true;
  }
  // Confirmed female doesn't eliminate anyone (all ghosts can be female).

  // Speed observations — huntSpeed/losAccel are arrays of every value a
  // ghost can present (conditional ghosts like Deogen or Hantu list
  // several). A ghost survives if it can EVER present the observed value;
  // missing data never eliminates, so unverified entries stay safe.
  if (state.huntSpeed && ghost.huntSpeed && !ghost.huntSpeed.includes(state.huntSpeed)) {
    ruledOut = true;
  }
  if (state.losAccel && ghost.losAccel && !ghost.losAccel.includes(state.losAccel)) {
    ruledOut = true;
  }

  // Trait check — every selected trait must include this ghost, unless
  // the ghost has no bearing on that trait (only enforced when tags exist).
  for (const traitId of state.traits) {
    const trait = TRAITS.find((t) => t.id === traitId);
    if (trait && !trait.ghosts.includes(ghost.name)) {
      ruledOut = true;
    }
  }

  const matchCount = ghost.evidence.filter((e) => state.evidence.get(e) === "positive").length;

  return { possible: !ruledOut, mimicFlag, matchCount };
}

function render() {
  updateObsControls();

  const results = state.ghosts.map((ghost) => ({
    ghost,
    ...evaluateGhost(ghost),
    manualOut: state.manuallyOut.has(ghost.name),
  }));
  results.forEach((r) => {
    r.combinedPossible = r.possible && !r.manualOut;
  });

  const possibleCount = results.filter((r) => r.combinedPossible).length;
  const possibleNames = new Set(results.filter((r) => r.combinedPossible).map((r) => r.ghost.name));
  updateTraitsPanel(possibleNames);

  results.sort((a, b) => {
    if (a.combinedPossible !== b.combinedPossible) return a.combinedPossible ? -1 : 1;
    return b.matchCount - a.matchCount;
  });

  els.resultCount.textContent = `${possibleCount} / ${state.ghosts.length}`;

  els.resultsList.innerHTML = "";

  if (state.ghosts.length === 0) {
    els.resultsList.innerHTML = `<li class="empty-state">Loading ghost data…</li>`;
    return;
  }

  results.forEach(({ ghost, possible, mimicFlag, matchCount, manualOut }) => {
    const li = document.createElement("li");

    const segs = [0, 1, 2]
      .map((i) => `<span class="ghost-card__seg ${i < matchCount ? "ghost-card__seg--filled" : ""}"></span>`)
      .join("");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost-card";
    if (!possible) btn.classList.add("ghost-card--ruled-out");
    if (manualOut) btn.classList.add("ghost-card--manual-out");
    if (mimicFlag && possible && !manualOut) btn.classList.add("ghost-card--mimic-flag");
    btn.setAttribute("aria-pressed", String(manualOut));
    btn.setAttribute(
      "aria-label",
      `${ghost.name}${manualOut ? " — crossed off, tap to restore" : " — tap to cross off"}`
    );
    btn.innerHTML = `
      <div class="ghost-card__top">
        <span class="ghost-card__name">${ghost.name}</span>
        <span class="ghost-card__bar">${segs}</span>
      </div>
      <div class="ghost-card__meta">
        ${ghost.evidence.map((e) => EVIDENCE_LABELS_SHORT[e]).join(" · ")}
      </div>
      ${mimicFlag && possible && !manualOut ? `<div class="ghost-card__mimic-note">Possible fake orbs</div>` : ""}
    `;
    btn.addEventListener("click", () => toggleManuallyOut(ghost.name));

    li.appendChild(btn);
    els.resultsList.appendChild(li);
  });

  updateScrollFade(els.traitsRow);
  updateScrollFade(els.resultsList);
}

async function init() {
  buildEvidenceChips();
  wireObservations();
  wireTraitsToggle();
  wireScrollFades();
  wireReset();
  await loadGhosts();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support is best-effort, ignore registration failures */
    });
  }
}

init();
