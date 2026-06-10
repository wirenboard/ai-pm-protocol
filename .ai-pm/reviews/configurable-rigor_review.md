# Review: configurable-rigor

Reviewer: fresh context, independent of the Builder. Checked against
`.ai-pm/plans/configurable-rigor.md` and the approved direction in
`.ai-pm/design/direction-product-engine.md`.

## Code review: approve

All security-critical checks passed. No floor relaxation, no over-claim, no
bloat. Evidence by item:

---

### 1. FAIL-SAFE TO `full` — PASS

`adapter/engine.mjs:152-157` (`projectProfile`):

```js
function projectProfile(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(...));
    return cfg.profile === "lite" || cfg.profile === "solo" ? cfg.profile : "full";
  } catch (_e) { return "full"; }
}
```

Verified manually for every edge case: no file → `full`; garbage JSON (`{this
is not json`) → `full`; `profile: "bogus"` → `full`; `profile: null` → `full`;
missing key (`{}`) → `full`; `profile: "LITE"` (uppercase) → `full`; only
`"lite"` and `"solo"` relax — everything else is the strict default. The
catch clause returns `"full"` so a read error also fails safe. No path widens
a deny on broken config.

`adapter/rigor-profile.test.mjs:61-67` — four `full`/absent/unknown/malformed
cases assert `verdict === "deny"` with `ruleId === "orchestrator-authors-content"`.
All 24 assertions pass (`node adapter/rigor-profile.test.mjs`: PASS 24/24).

---

### 2. THE FLOOR NEVER RELAXES — PASS

Rule ordering in `adapter/deny-rules.json`:

- rule 2 (`write-outside-root`, `writeTargetOutsideRoot`) — no profile gate,
  fires before rule 4.
- rule 3 (`truncating-write`, `emptyWriteOverNonEmpty`) — no profile gate,
  fires before rule 4.
- rule 4 (`orchestrator-authors-content`, `orchestratorWritingContent`) — the
  only rule gated on profile.
- rule 5 (`self-patch-enforcer`, `writesIntoTooling`) — no profile gate, fires
  after rule 4 but is a separate predicate entirely.
- rule 6 (`merge-while-unstamped`, `mergeWithUnstampedReview`) — no profile
  gate.

`adapter/engine.mjs:205-210` (`writesIntoTooling`) has no reference to
`projectProfile` — confirmed separate and untouched.

`adapter/rigor-profile.test.mjs:73-121` asserts all four floor cases under
`solo` (the loosest profile): tooling-submodule write → `deny
[self-patch-enforcer]`; out-of-root write → `deny [write-outside-root]`;
truncating write → `deny [truncating-write]`; merge-while-unstamped → `deny
[merge-while-unstamped]`. All pass.

---

### 3. ONLY THE INTENDED RELAXATION — PASS

`adapter/engine.mjs:190-203`: `orchestratorWritingContent` is the only
predicate that reads `projectProfile`. Every other predicate in the `PREDICATES`
object has no `projectProfile` call — confirmed by reading the full predicate
block (lines 170-253).

The profile gate is entirely inside the engine (`projectProfile` called at
`engine.mjs:197`). Neither `adapter/claude/shim.mjs` nor
`adapter/opencode/normalise.mjs` reference `projectProfile` or `profile` —
confirmed by reading both files. Both shims pass `root` to `evaluate`, so the
engine reads the config file at decision time, platform-agnostically.

`adapter/parity.test.mjs`: PASS 55/55 — count unchanged. Both shims reach
identical verdicts for all cases. The existing `orchestrator-authors-content`
parity fixture uses a temp root with no `ai-pm.config.json` (profile defaults
to `full`), so the documented divergence (Claude=allow/OpenCode=deny) still
fires correctly and is recorded at `parity.test.mjs:66-68`.

---

### 4. PER-PLATFORM HONESTY — PASS

`PROTOCOL.md:105` states the relaxation is "a no-op where the deny already
fails open (Claude)" — the per-platform split is explicit. On Claude the
orchestrator-content deny was already `[persona]`/fails-open before this
change; the profile gate is therefore a no-op there (the predicate was already
returning false because `isOrchestrator` is undefined on Claude). No
over-claim that a lite Claude project gets mechanical orchestrator-build
enforcement — it never had it and the text says so.

`adapter/engine.mjs:21-22` (comment): "isOrchestrator intentionally left
undefined" on Claude — the per-platform gap is documented at the engine level
too (this comment is in `claude/shim.mjs:20-22`).

---

### 5. CORE THIN AND HONEST — PASS

`wc -l PROTOCOL.md` → 181 lines (plan targeted ≤ one-sitting; prior was 180
per plan; net +1 line, not the predicted +4–6 due to compact phrasing).

Four clause edits, each at one location:

- Invariant 1 (`PROTOCOL.md:64`): qualifier added, anti-substitution teeth
  intact, Reviewer seat exclusion explicit.
- Orchestrator contract line (`PROTOCOL.md:86`): parenthetical "except where a
  rigor profile lets it build directly — the Reviewer is always a separate
  spawn."
- Enforcement orchestrator-content row (`PROTOCOL.md:105`): relaxation
  described with the per-platform honesty note and the never-relaxed list.
- Project config `profile` bullet (`PROTOCOL.md:128`): states the cuttable
  levers, names the floor, points to the value-home (`ai-pm.config.json
  _profile`).

No new section added. Loop paragraph (`PROTOCOL.md:56`) gains "profile" in the
setup field enumeration — one word, single home updated.

Whole-surface no-dup: the floor list is fully stated in
`ai-pm.config.json:_profile` (the declared value-home). `PROTOCOL.md:128`
summarises it briefly and points to that home. `agents/orchestrator.md:13-14`
and `.opencode/agents/ai-pm.md:28-29` carry short per-beat reminders ("the
floor — never relaxed") — these are operational cues in the loop table, not a
restatement of the full floor list. The per-beat section is homed in the
orchestrator agent (plan's declared single home for loop realization), not in
PROTOCOL.md. No duplicate full floor list found.

---

### 6. SETUP + LOOP — PASS

`agents/orchestrator.md:21` (step 2, setup): presents `full` as
"default/recommended (full rigor, safest)", `lite`/`solo` as "opt-in
speedups." States trade-off in Operator language. Explicitly: "**never
recommend `solo` silently — name the trust cost** (one fewer independent
context, lightest plan)." Correct.

Per-beat loop realization at `agents/orchestrator.md:10-14`: profile is a
"ceiling, not a duty." Every profile: spawn a fresh separate Reviewer; every
profile: Operator merges. These are single-homed in the orchestrator agent,
not restated in PROTOCOL.md.

`.opencode/agents/ai-pm.md` is byte-identical to `agents/orchestrator.md`
(diff shows only YAML frontmatter prepended) — the deployed plugin is not
stale.

---

### 7. SCOPE — PASS

Changed files: `.opencode/agents/ai-pm.md`, `PROTOCOL.md`,
`adapter/deny-rules.json`, `adapter/engine.mjs`, `agents/orchestrator.md`,
`ai-pm.config.json`, `quality/tools.json` + new
`adapter/rigor-profile.test.mjs`. All within plan scope, no unexpected files.

`ai-pm.config.json:7`: `"profile": "full"` — this repo's own config stays at
full rigor as required.

---

### Tests run

```
node adapter/rigor-profile.test.mjs   →  PASS 24/24
node adapter/parity.test.mjs          →  PASS 55/55
node quality/neutral-prose.test.mjs   →  PASS (core is platform-neutral)
node adapter/install-model.test.mjs   →  PASS 11/11
node adapter/install-plugin.test.mjs  →  PASS 6/6
```

---

### Minor observation (not a blocker)

`adapter/engine.mjs:190-203`: under `lite`/`solo`, `orchestratorWritingContent`
returns `false` for ALL in-root writes by the orchestrator, not just
"source/doc paths" as the plan phrases it. In practice the two are equivalent
— the only in-root writes this predicate previously denied were source/doc
paths (`.ai-pm/` and `ai-pm.config.json` were already in `allow_prefixes`).
The tooling floor is a separate predicate unaffected by profile. The relaxation
is correct and the floor is intact; the plan's "source/doc only" phrasing is
slightly imprecise shorthand for "everything this predicate would have denied."
No action required.
