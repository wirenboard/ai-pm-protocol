# Plan compliance review — on-hardware-blast-radius-preflight

Scope note: this is a docs/spec change to the protocol template's own `WORKFLOW.md`
(the "product" of this repo is the protocol itself). The recorded scope exceptions in
`doc/architecture.md` apply: no `.ai-pm/contracts/`, no `.ai-pm/state/`, no
`docs/product-map.md`; this repo uses `doc/` (singular), `doc/features/` for plans,
`.ai-pm/reviews/` for reviews. The only executable test is `tests/hooks.sh`.
No Product Contract touched (this template repo has no user-facing contracts by design —
arch.md "Contract-centric product map" exception). Plan declares stack expectations
**N/A** and interaction scenarios **Provably isolated** (static spec doc) — both accepted.

## Plan compliance

- ✓ **Scenario 1** (preflight before Step 5.5 on real hardware; stop + surface blast
  radius before acting) — realized at `WORKFLOW.md:142` (Step 5.5 references the
  preflight: "Before I exercise anything on real hardware, I run the **Blast-radius
  preflight** … I stop and surface the blast radius to you before acting — whether I'm
  about to exercise the behaviour myself or hand over the checklist"). Rule body at
  `WORKFLOW.md:227`.
- ✓ **Scenario 2** (preflight before a restarting/mutating Step A.5 probe, with the
  local-vs-external-revert qualifier) — realized at `WORKFLOW.md:242` ("Before a probe
  that restarts or structurally mutates a live target I run the **Blast-radius
  preflight** … *reversible locally ≠ reversible for a coupled external peer*") and the
  probe-rules bullet at `WORKFLOW.md:256`.
- ✓ **Scenario 3** (coupled → safe alternatives + recovery only on explicit PM consent,
  recovery as a mandatory step) — realized at `WORKFLOW.md:233` (safe alternatives:
  separate/throwaway target or separate identity) and `WORKFLOW.md:235` ("**only on your
  explicit consent**, and only with that recovery planned as a **mandatory step**, not an
  afterthought").
- ✓ **Scenario 4** (structural mutations never on the live coupled target by default →
  separate/throwaway instance) — realized at `WORKFLOW.md:234` ("**Structural mutations**
  … never run on the user's live coupled target by default. They go to a separate /
  throwaway instance").
- ✓ **Scenario 5** (minimize restarts; recovery step part of the plan, not an
  afterthought) — realized at `WORKFLOW.md:236` ("I minimize repeated restarts of a
  coupled live target; if a structural change on it is genuinely unavoidable, the recovery
  step is part of the plan from the start").

Verification is editorial per the plan's Test plan (prose change, no new executable test);
each scenario maps to a specific line above.

## Existing behaviors preserved (must-not-break)

- ✓ **Step A read-only-by-default + silent-change boundary** — `WORKFLOW.md:240` is
  byte-identical to the pre-change version (`git show ca0fa7d:WORKFLOW.md`). The preflight
  block ends with an explicit additive disclaimer at `WORKFLOW.md:238` ("relaxes none of
  the Step A read-only default or the Step A.5 probe rules below").
- ✓ **Step A.5 probe rules (runtime/local only, never repo-owned files)** — the
  runtime/local-only + repo-owned-file prohibition bullet at `WORKFLOW.md:257` is
  byte-identical to the original. The preflight only **adds** a precondition (`:242`,
  `:256`); no existing probe rule relaxed.
- ✓ **"What is mandatory when" Diagnostic-probe row (skip-all)** — row retained at
  `WORKFLOW.md:185`; the skip-all classification stands, with the preflight qualifier
  appended ("the Blast-radius preflight still applies — a coupled live target is
  stop-and-surface, even for a skip-all probe").
- ✓ **Step 5.5 checklist-handover path** — preserved at `WORKFLOW.md:142`; the preflight
  runs "whether I'm about to exercise the behaviour myself or hand over the checklist".

## Design-decision checks

- ✓ **Single-source placement** — the rule is **defined once** at `WORKFLOW.md:227-238`
  (under "When you say it doesn't work in production") and **referenced** from Step 5.5
  (`:142` "see …"), Step A.5 (`:242` "(above)"), the probe-rules bullet (`:256`), and the
  mandatory-table row (`:185`). No full copy of the rule in two steps. Confirmed by grep
  of all `blast` occurrences.
- ✓ **Diagnostic-probe row carries the preflight qualifier** — `WORKFLOW.md:185`.
- ✓ **Soft prose, no hook** — diff adds no `PreToolUse`/hook entry to `WORKFLOW.md` or
  `.claude/settings.json`. Rationale recorded in `doc/architecture.md:126-128`.

## Out-of-scope respected

- ✓ **Matter as worked-example only** — Matter/Wiren appears only at `WORKFLOW.md:229`,
  explicitly framed ("The worked example is …", "the Matter case is only the
  illustration", "The principle is domain-agnostic"). "re-commission / re-pair" at `:235`
  are plain-language recovery verbs, not Matter protocol vocabulary. No
  commissioning/fabric/parts-list mechanics encoded as protocol vocabulary.
- ✓ **No hard PreToolUse hook** — none added (confirmed by diff grep).
- ✓ **Downstream status-reflection feature** — not present in WORKFLOW.md; correctly kept
  as cross-reference-only in the plan's Out of scope.

## Definition of Done

- [x] All plan scenarios implemented and tested (5/5 realized; editorial verification per
  plan Test plan — no executable test for a prose rule)
- [x] Interaction scenarios have concurrent-state tests (plan declares Provably isolated —
  static spec doc, no runtime interaction; accepted)
- [x] Stack expectations respected; stack-spec tests pass (plan declares N/A — no external
  stack touched; accepted)
- [x] Product Contract honored (no Product Contract touched — this template repo has none
  by design)
- [x] Pipeline green — `tests/hooks.sh` ran **71/71 passed**; markdown blank-line-correct
  (bullet list `:233-236` blank-separated, paragraph blocks blank-separated);
  English-canonical (no Cyrillic in added lines)
- [x] State file updated (N/A — repo has no `.ai-pm/state/`; recorded exception)
- [x] Product Impact Report present (N/A — no contract touched)
- [x] Docs updates landed — `WORKFLOW.md` change + `doc/architecture.md` decision record
  (`:126-128`) both in this branch, matching the plan's "Docs to update"
- [x] Expected artifacts exist — plan (`doc/features/on-hardware-blast-radius-preflight_plan.md`),
  this review, arch decision record. No Product Contract expected (protocol-self change,
  not user-facing in the contract sense)

**DoD: pass**

## Blocking

None.

## Notes (product)

None. Scope matches the plan exactly: the change is confined to `WORKFLOW.md` (the
preflight rule + four references) and the `doc/architecture.md` decision record. No
scope expansion, no silent sibling cases, no Matter mechanics leaked into protocol
vocabulary.

## Verdict

approve

<!-- orchestrator appends after code-review pass: -->
## Code review findings

## Code review
