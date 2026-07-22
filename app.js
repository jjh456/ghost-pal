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

// Traits are mostly informational — only worth showing once the field is
// narrowed down, and only a handful at a time so they don't crowd out the
// results list.
const TRAITS_NARROW_THRESHOLD = 10;
const MAX_VISIBLE_TRAITS = 5;

const state = {
  ghosts: [],
  evidence: new Map(), // code -> 'positive' | 'negative'; absent = unknown
  traits: new Set(),
  gender: "unknown", // 'unknown' | 'male' | 'female'
  traitsExpanded: true,
};

const els = {
  evidenceRow: document.getElementById("evidenceRow"),
  traitsRow: document.getElementById("traitsRow"),
  traitsToggle: document.getElementById("traitsToggle"),
  traitsToggleLabel: document.getElementById("traitsToggleLabel"),
  traitsHint: document.getElementById("traitsHint"),
  genderRow: document.getElementById("genderRow"),
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
    chip.className = "chip";
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
// (so they can be un-toggled), topped up with traits whose ghost(s) are
// still in the running, capped at MAX_VISIBLE_TRAITS.
function pickVisibleTraits(possibleNames) {
  const selected = TRAITS.filter((t) => state.traits.has(t.id));
  const relevant = TRAITS.filter(
    (t) => !state.traits.has(t.id) && t.ghosts.some((g) => possibleNames.has(g))
  );
  return [...selected, ...relevant].slice(0, MAX_VISIBLE_TRAITS);
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

// Traits are informational and mostly noise until the field is narrowed
// down, so keep the whole panel collapsed behind a hint until then.
function updateTraitsPanel(possibleCount, possibleNames) {
  const narrowedEnough = state.ghosts.length > 0 && possibleCount <= TRAITS_NARROW_THRESHOLD;

  els.traitsHint.hidden = narrowedEnough;
  els.traitsToggle.disabled = !narrowedEnough;
  els.traitsToggle.setAttribute("aria-expanded", String(narrowedEnough && state.traitsExpanded));
  els.traitsToggleLabel.textContent = state.traitsExpanded ? "Collapse" : "Expand";
  els.traitsRow.hidden = !narrowedEnough || !state.traitsExpanded;

  buildTraitChips(narrowedEnough ? pickVisibleTraits(possibleNames) : []);
}

function wireGender() {
  els.genderRow.querySelectorAll("[data-gender]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.gender = state.gender === chip.dataset.gender ? "unknown" : chip.dataset.gender;
      els.genderRow.querySelectorAll("[data-gender]").forEach((c) => {
        c.setAttribute("aria-pressed", String(c.dataset.gender === state.gender));
      });
      render();
    });
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
    state.gender = "unknown";
    state.traitsExpanded = true;
    document.querySelectorAll(".chip[data-evidence]").forEach((c) => c.setAttribute("aria-pressed", "false"));
    els.genderRow.querySelectorAll("[data-gender]").forEach((c) => c.setAttribute("aria-pressed", "false"));
    render();
  });
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
  const results = state.ghosts.map((ghost) => ({
    ghost,
    ...evaluateGhost(ghost),
  }));

  const possibleCount = results.filter((r) => r.possible).length;
  const possibleNames = new Set(results.filter((r) => r.possible).map((r) => r.ghost.name));
  updateTraitsPanel(possibleCount, possibleNames);

  results.sort((a, b) => {
    if (a.possible !== b.possible) return a.possible ? -1 : 1;
    return b.matchCount - a.matchCount;
  });

  els.resultCount.textContent = `${possibleCount} / ${state.ghosts.length}`;

  els.resultsList.innerHTML = "";

  if (state.ghosts.length === 0) {
    els.resultsList.innerHTML = `<li class="empty-state">Loading ghost data…</li>`;
    return;
  }

  results.forEach(({ ghost, possible, mimicFlag, matchCount }) => {
    const li = document.createElement("li");
    li.className = "ghost-card";
    if (!possible) li.classList.add("ghost-card--ruled-out");
    if (mimicFlag && possible) li.classList.add("ghost-card--mimic-flag");

    const segs = [0, 1, 2]
      .map((i) => `<span class="ghost-card__seg ${i < matchCount ? "ghost-card__seg--filled" : ""}"></span>`)
      .join("");

    li.innerHTML = `
      <div class="ghost-card__top">
        <span class="ghost-card__name">${ghost.name}</span>
        <span class="ghost-card__bar">${segs}</span>
      </div>
      <div class="ghost-card__meta">
        ${ghost.evidence.map((e) => EVIDENCE_LABELS_SHORT[e]).join(" · ")}
      </div>
      ${mimicFlag && possible ? `<div class="ghost-card__mimic-note">Possible fake orbs</div>` : ""}
    `;
    els.resultsList.appendChild(li);
  });
}

async function init() {
  buildEvidenceChips();
  wireGender();
  wireTraitsToggle();
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
