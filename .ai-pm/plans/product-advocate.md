# Plan: the product-advocate capability module (Pillar 1, first piece)

> Transient plan + progress note (deleted on ship). Topic: `product-advocate`.
> Status: **PLAN — awaiting Operator approval.** Not built.

## Behaviour

**What changes.** A new toggleable capability module **`product-advocate`**, built on the
existing module constructor (`modules.json` row + `modules/product-advocate/<role>.md`
fragments + the depth toggle), assembled by the unchanged `adapter/modules.mjs`. When ON,
it DEEPENS the Builder's plan beat with the uncomfortable user/product questions —
*who is this for, what user pain, is this the right bet, what is the cheapest test,
what breaks if we DON'T build it* — each carrying a **recorded answer or a conscious
"descoped: why"**, never silent. Optionally it deepens the Reviewer beat with one
product dimension: *does the shipped change serve the user claim its plan made*.

**What stays the same.** The loop, the gates, git ownership, the core constitution prose,
and the assembler are all untouched. The module is **`[persona]`** — it sharpens what the
Builder/Reviewer THINK about at plan/review time; it blocks nothing mechanically. The
existing always-on floor (the Builder plan-checklist "Product questions … recorded answer
or a conscious descope" and the Reviewer "user-facing … no recorded answer ⇒ gap") is the
floor and **does not move** — the module is the deepening above it. This is the same
floor-vs-module split threat-model already proved.

## Scope

**Slice 1 (this plan, in detail) — the module fragments under the EXISTING constructor:**
- A `modules.json` registry row for `product-advocate` (toggle shape, per-kind defaults,
  targets, fragment pointers), placed AFTER `threat-model` (registry order = assembly
  order; the order is reviewable and stable).
- `modules/product-advocate/builder.md` — the plan-time uncomfortable-questions fragment,
  depth-tagged `[light]`/`[rich]` exactly like threat-model's fragment.
- Optionally `modules/product-advocate/reviewer.md` — the one product dimension (fork 2).
- The `<!-- ai-pm:modules -->` marker already exists in both floor bodies (builder.md:16,
  reviewer.md:19) — **no floor edit needed** to compose in; the marker is shared across all
  modules and composes them in registry order.
- A short paragraph in `architecture.md` `## Capability modules` naming the second shipped
  module (single-home: the module catalog prose lives there, next to the threat-model one).
- Tests: extend the module test surface (see Test plan).

**Out of scope (Slice 2, sketched below):** the independent plan-time **challenge pass** —
a fresh-voice spawn that stress-tests the plan BEFORE build. That is real loop machinery
(a new spawn point at plan time, like a plan-time Reviewer) and is deliberately deferred.
Slice 1 ships the questions + recorded-skip + honesty-floor with ZERO new machinery.

**Also out of scope:** any deny rule (the module is `[persona]`, no `[mechanical]` part);
any `setup`/`ai-pm.config.json` schema change beyond the toggle the constructor already
reads; reviving the old `pm-product-advocate` agent or its Step-3.5 gate (that was the
pre-minimal-core design; this is its minimal-core re-expression as a module).

## Structural choice (FORKS — hand up to the Operator)

### Fork 1 — the independent `rich` challenge pass: slice it (RECOMMEND slicing)

`rich` for this module logically implies a **separate fresh voice** challenging the plan at
plan-time — self-advocacy is weak (the Builder is invested in shipping its own plan; it will
not kill it), so the value is in independence, structurally a *plan-time Reviewer*. That is a
genuine loop addition (a new spawn point), not just prompt text.

- **Option A (RECOMMEND) — slice like threat-model.** Slice 1 = the fragments
  (the questions) + recorded-skip + honesty-floor, under the EXISTING `[persona]` constructor,
  with `light`/`rich` realised the same way threat-model does it: `light` = a fast self-check
  subset, `rich` = the FULL question set the Builder self-applies + an explicit instruction to
  treat it as an independent stress-test (still self-run in Slice 1). Slice 2 = the actual
  fresh-voice spawn at plan-time. Fast to prove, no new machinery, ships value now.
- **Option B — build the independent pass now.** One bigger feature: new plan-beat spawn,
  Orchestrator routing, a verdict the gate reads, failure-handling for a dead advocate
  subagent (the backlog already records that exact crash class). Higher risk, slower, and it
  couples the module mechanism to a loop change before the cheap version has earned its keep.

**Recommendation: Option A.** It mirrors the threat-model precedent exactly, lands Pillar 1's
first concrete value behind a toggle, and keeps the bigger structural piece (the independent
spawn) as a clean, separately-reviewable Slice 2. **Honesty caveat for Slice 1:** because
`rich` is still self-run in Slice 1, the fragment must NOT claim it is "independent" — it is a
sharper self-check until Slice 2 adds the real fresh voice. Over-claiming independence here
would itself be a Reviewer honesty find.

### Fork 2 — which roles/beats does Slice 1 target?

- **Builder plan-time fragment — REQUIRED.** This is the whole point: the uncomfortable
  questions must fire at PLAN time (where "should we build this at all?" is still answerable),
  by the role drafting the plan, each answered-or-recorded-descope.
- **Reviewer fragment — OPTIONAL (RECOMMEND including a thin one).** A single product
  dimension at review time: *the shipped change serves the user claim its plan made; a
  user-facing change with an unanswered/u+ faked product question is a gap*. This is the
  back-end check that the plan-time questions were actually answered, not faked — it gives the
  honesty-floor a place to BITE at review. Keep it to 1–2 lines so it stays a sharpening of
  the existing Reviewer product item, not a parallel checklist.
- **Recommendation: target BOTH** (builder primary, reviewer thin), mirroring threat-model
  which targets both. If the Operator wants the absolute-minimum first slice, builder-only is
  defensible and Slice 2 can add the reviewer dimension — flagged for the call.

### Fork 3 — the honesty-floor: where it lives + exact wording (single-home)

The honesty floor = **you cannot ship a user-facing change claiming product validation you
didn't do; a skip is RECORDED, never faked.** The whole-surface grep (done — see below) shows
the relevant prose already exists in TWO floor homes:
1. The Builder plan checklist (`agents/builder.md:11`): "Product questions (user-facing only)
   … Each gets a recorded answer or a conscious descope."
2. The Reviewer (`agents/reviewer.md:23`): "If the change is user-facing and a foundational
   product question has no recorded answer, that is a gap — report it; don't invent the answer."
   Plus the Reviewer Honesty item (`agents/reviewer.md:14`): an over-claim blocks.

**Decision (RECOMMEND): do NOT add a new floor clause. SHARPEN, don't duplicate.** The floor
already exists in its two single homes; the manifesto's no-duplication rule and the
whole-surface no-dup guard forbid a third copy. The module fragments therefore **POINT at**
the existing floor and sharpen it:
- The Builder fragment names the SAME "recorded answer or conscious descope" rule the floor
  states and adds the *anti-illusion* sharpening: claiming a question is answered when it was
  skipped is a review-blocking honesty over-claim (pointing at the Reviewer Honesty item, the
  existing single home of "over-claim blocks"). It does not restate the over-claim rule; it
  invokes it.
- The Reviewer fragment (if included) sharpens the SAME Honesty + user-facing-gap items: a
  product question marked "answered" that the plan/diff does not actually back is a faked pass
  and blocks — cite-or-it-didn't-happen, exactly the Reviewer's existing rule.

So the honesty-floor's HOME stays the two floor bodies; the module only deepens the *aim* of
those existing items. **No new clause in PROTOCOL.md** — the constitution's plan-beat sentence
(PROTOCOL.md:51, "the product questions … must each have a recorded answer or be consciously
descoped before build") is already the constitutional single-home and is untouched.

### Fork 4 — per-`kind` defaults + this repo's setting

This module is the inverse-emphasis of threat-model: threat-model is strict-side ON for the
attack-surface-heavy `software` kind; product-advocate is most valuable for **product-facing**
kinds and least for infra/internal/doc kinds.

- Proposed defaults map (drives the depth via the constructor; absent/unknown kind ⇒ strict
  side = the first-declared default, per `strictKind`):
  - `software` → `{ depth: "rich" }` — a software project is presumed product-facing; full
    question set at plan time.
  - `documentation` → `{ depth: "light" }` — docs serve a reader but rarely face the
    "is this the right bet / what breaks if we don't" market question at full depth; the light
    self-check subset.
- **The fail-safe tension to surface:** `strictKind` resolves an unknown/absent kind to the
  **strictest declared default**, and it prefers `"software"` when declared. For threat-model
  "strict = more security rigor" is unambiguously right. For product-advocate, "strict = rich"
  is still the safe direction (more product scrutiny, never less) — so the existing fail-safe
  is CORRECT for this module too and needs no change. Recorded so the Reviewer can confirm the
  module did not need a constructor edit.

**This repo's own setting (the dogfood call — surface to Operator).** The protocol's "users"
are downstream Operators, so this repo IS arguably product-facing (its product is the
protocol experience). The repo `ai-pm.config.json` `kind` is `software`, which defaults this
module to `rich`. **Recommendation: leave it ON at `rich`** (take the default; add no explicit
`modules.product-advocate` override) — dogfood the full question set on the protocol's own
features, exactly as it dogfoods threat-model. If the Operator finds the full set too heavy for
infra-flavoured protocol changes, the per-feature path is `modules.product-advocate.depth =
"light"` (or `false` to disable) in `ai-pm.config.json`, no code change. Flagged for the call.

## Product questions (this change is user-facing — the user is the downstream Operator/Builder)

- **Who is the user?** The downstream Operator (who gets product discipline on their features
  without core bloat) and the Builder agent (which gets the uncomfortable questions at the
  point they are answerable). Recorded.
- **Success state.** A toggled-ON project's Builder plan now carries the product questions,
  each answered-or-descoped; a toggled-OFF project's plan is unchanged. Provable by the
  compose test (fragment present iff ON). Recorded.
- **Empty / off state.** `modules.product-advocate: false` ⇒ the fragment is not composed; the
  floor (the always-on plan product-question line) remains. The role is never left without its
  floor. Recorded (mirrors threat-model's omit test).
- **Bad input.** A malformed/unknown toggle or unknown kind ⇒ ON at the strict side (rich) —
  the constructor's existing fail-safe; a bad config can only turn MORE product scrutiny on.
  Recorded.
- **Irreversible step?** None — this is prompt content composed at install time; toggling
  off and re-installing fully reverts it. No data migration, no destructive op. Recorded.

## Security surface (threat-model module is ON for this repo — enumerate)

This change adds **no new input, endpoint, secret, or network boundary**: it is two markdown
fragments + one JSON registry row, composed by the already-shipped, already-tested assembler.
Walking the surfaces the threat-model module asks for:
- **Attack surface / untrusted input.** The only new untrusted data is the registry row's
  fragment pointers (`modules/product-advocate/<role>.md`). They cross the SAME trust boundary
  threat-model's pointers do, and the assembler's `resolveFragmentPath` already rejects an
  absolute or `..`-bearing pointer and hard-errors a missing fragment. The new row reuses that
  guard unchanged — mitigation is the existing, tested boundary; no new code path. *file:line
  closing it:* `adapter/modules.mjs` `resolveFragmentPath` + the missing-fragment throw in
  `fragmentFor`; proven by `install-modules.test.mjs` security cases (which I will extend to
  also exercise the new module id).
- **Secrets / credentials.** None read, written, or logged.
- **Injection / unsafe ops.** None — no shell/SQL/path/template/eval/deserialization is added;
  fragment text is read and string-substituted by the existing assembler only.
- **Trust boundaries.** No boundary moved; the fragment-pointer boundary is the assembler's,
  already enforced.
- **Fail-open vs fail-closed.** The module's fail-safe is toward MORE rigor (unknown ⇒ rich),
  matching the constructor; correct strict-side direction confirmed in Fork 4.
- **Data & privacy / AuthZ / Supply chain.** No data flow, no access surface, no new
  dependency. Silence here = considered, not exposed.

**Net:** the security surface is the assembler's existing pointer-trust boundary, reused
unchanged; the threat is a hostile/typo'd pointer and the mitigation is the already-tested
`resolveFragmentPath` + missing-fragment hard error. No new mitigation needed.

## Unfamiliar interface

None unfamiliar — the module constructor (`modules.json` shape, the depth-tag convention,
`adapter/modules.mjs`, the `<!-- ai-pm:modules -->` marker, the install-modules test harness)
is the canonical source and is read in full. The fragment follows the threat-model fragment's
exact idiom: a header, an on-line stating the module + that it DEEPENS a floor item + the
`[persona]` disclaimer, then `[light]`/`[rich]`-tagged checklist items.

## Docs (single home each)

- `modules.json` — the registry row (the catalog's single home for the module's toggle/
  defaults/targets/pointers).
- `modules/product-advocate/builder.md` (+ `reviewer.md` if Fork 2 = both) — the fragment
  prose (subject to the neutral-prose guard).
- `architecture.md` `## Capability modules` — one paragraph naming the second shipped module
  (the catalog prose's single home; mirror the existing threat-model sentence at line 95).
- **No PROTOCOL.md edit** — the constitution's plan-beat product-question sentence is the
  existing constitutional home and is untouched (no-dup; the core does not name modules
  individually beyond threat-model's illustrative mention, and need not).
- **No `agents/builder.md` / `agents/reviewer.md` floor edit** — the marker already exists in
  both; the floor product items already exist and are the single home the fragment points at.

## Slice plan

### Slice 1 (this plan — DETAILED)
The module under the existing constructor: registry row + builder fragment (+ optional thin
reviewer fragment) + architecture paragraph + tests. `[persona]`, no new machinery, no loop
change, no deny rule. The `rich`/`light` depth is the threat-model mechanism reused; in Slice
1 `rich` is a sharper SELF-check (the fragment must not claim independence). Atomic commit
boundaries the Orchestrator will use:
1. `modules.json` row + the fragment file(s) (the module's data + prose — one purpose).
2. `architecture.md` catalog paragraph (the doc — one purpose).
3. The test additions (the proof — one purpose).

### Slice 2 (SKETCH — separately planned & reviewed later)
The independent plan-time **challenge pass**: a fresh-voice spawn (structurally a plan-time
Reviewer) that stress-tests the Builder's plan BEFORE build, for `rich` user-facing changes.
This is where the real value (independence over self-advocacy) lands. It needs: a plan-beat
spawn point + Orchestrator routing; a verdict the Orchestrator can read; **failure-handling
for a dead/refusing advocate subagent** (the backlog already records this exact crash class —
the Orchestrator must STOP and report, never self-substitute the verdict, per invariant 3);
and a config switch tying `rich` to "spawn the pass" vs "self-check". It is deferred because
it couples the module to a loop change; the cheap Slice-1 version earns that investment first.
Sketch only — full plan + independent review when sequenced.

## Test plan

Extend `adapter/install-modules.test.mjs` (the existing module DoD harness) so it proves the
SAME binary behaviour for the new module, without weakening any threat-model assertion (add,
never edit):
- **Resolver:** `product-advocate` is enabled on `true` / object / absent-key / malformed
  toggle; disabled ONLY on literal `false` / `{ enabled: false }`.
- **Per-kind defaults:** `software` ⇒ rich, `documentation` ⇒ light, unknown/absent kind ⇒
  strict side (rich); a config `depth` override beats the kind default.
- **Compose (builder role):** ON ⇒ the builder fragment's distinguishing line is present and
  the marker is consumed; OFF ⇒ fragment absent, marker consumed, the Builder FLOOR
  (the plan product-question line) STILL present. (If reviewer fragment included, same for it.)
- **Depth:** rich keeps a `[rich]`-only question; light strips it and is genuinely shorter;
  banner names the resolved depth; no `[light]`/`[rich]` tag leaks into composed prose;
  malformed depth ⇒ rich.
- **Co-existence with threat-model:** with BOTH modules ON, the composed builder body carries
  BOTH fragments in registry order (threat-model first, product-advocate second) and both
  floors — proving registry-order composition with two modules (a case the single-module suite
  never exercised; this is new coverage the second module unlocks).
- **End-to-end (Claude shim):** the installed builder agent gains the fragment when ON, omits
  it when OFF, floor intact — mirroring the existing e2e block.
- **Honesty-floor presence (light assertion):** the builder fragment text POINTS at the
  recorded-answer-or-descope rule and does NOT claim mechanical enforcement or (in Slice 1)
  independence — assert the fragment does not contain an over-claim string like "independent"
  in a way that asserts a fresh voice (guard against the Slice-1 honesty caveat). Keep this a
  simple substring guard; the real honesty judgement is the Reviewer's.
- **Neutral-prose guard:** the new fragment(s) are auto-included by `quality/neutral-prose.test
  .mjs` (it globs `modules/<id>/*.md`); the fragment must carry no backticked platform
  primitive. Run it as part of the build-beat green.

Build-beat green = both `adapter/install-modules.test.mjs` and `quality/neutral-prose.test.mjs`
pass (plus the full adapter suite, to confirm no regression from the registry-order change).

## Definition of Done (Slice 1)

- `modules.json` carries a `product-advocate` row after `threat-model`, shape-matching the
  `_row_shape` contract (id · for · toggle · defaults · targets · fragments).
- `modules/product-advocate/builder.md` exists, depth-tagged, `[persona]`, pointing at (not
  duplicating) the floor's recorded-answer-or-descope rule, making NO independence/mechanical
  over-claim. (+ `reviewer.md` if Fork 2 = both.)
- The `<!-- ai-pm:modules -->` markers are unchanged; the floors are unchanged.
- `architecture.md` `## Capability modules` names the second shipped module in one paragraph;
  no other doc restates the module's rules.
- The whole-surface no-dup guard holds: the honesty-floor / product-question rule has exactly
  ONE constitutional home (PROTOCOL.md:51) and one home per role floor; the fragment points,
  never restates.
- Tests above pass; no existing test edited to pass; the full adapter + quality suite is green.
- Every Slice-1 fork (1 sliced, 2 roles, 3 honesty-home, 4 defaults+repo-setting) has a
  recorded recommendation for the Operator's call.

## Progress note

- 2026-06-10 — Plan drafted. Read: direction-product-engine, modules.json, adapter/modules.mjs,
  both floor bodies, both threat-model fragments, install-modules.test.mjs, architecture.md
  `## Capability modules`, neutral-prose.test.mjs, and the whole-surface grep for existing
  product-question prose. Awaiting Operator approval of the four forks before build.
