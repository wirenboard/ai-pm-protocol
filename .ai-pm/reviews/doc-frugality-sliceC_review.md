## Plan compliance

- ✓ Scenario 7 (frugality dimension — size/node-density/lost-in-the-middle/file-sprawl/readability-grade) — implemented in `src/agents/pm-auditor.body.md` `### 6. Frugality`; test at `tests/doc-style.sh` case `auditor-frugality-dimension` (+ non-vacuity case `auditor-frugality-nonvacuous`).
- ✓ Scenario 8 (scale-guard → shard, remediation spawns `pm-architect`) — implemented in `src/agents/pm-auditor.body.md` (scale-guard threshold + shard + thin-core + on-demand + compaction) and surfaced in `src/commands/pm-audit.body.md` step-6 remediation list; test at `tests/doc-style.sh` `auditor-frugality-dimension` (scale-guard and shard token assertions).
- ✓ Scenario 9 (git-aware graduation check — LOAD-BEARING, blocking) — implemented in `src/agents/pm-auditor.body.md`; graduation check references `### Graduation targets` by name; git-aware (git log + standing docs, not N per-feature files); never-graduated merged feature → **blocking** (only blocking finding in dimension; smells stay notes); test at `tests/doc-style.sh` `graduation-check-blocking`.
- ✓ Interaction scenario — mixed-project tolerance — implemented; presence-in-EITHER an old per-feature file OR the living reference satisfies graduation; absence-of-old-files never the test; cannot false-block mid-migration; test at `tests/doc-style.sh` `audit-mixed-project` (+ non-vacuity case `audit-mixed-project-nonvacuous`).

## No-prose-policing preservation check

Every signal in the new frugality dimension is measurable structure:
- **Size** — line/byte count, referenced to `### Numbers = targets, not gates` (no value re-encoded).
- **Node-density** — `###`/`####` sub-section count under one `##` home.
- **Lost-in-the-middle** — explicitly stated as "a measurable length/position signal … length-and-position measurement, NOT a read of whether the middle is 'important'".
- **File-sprawl** — presence-of-a-file-that-should-be-gone, a count.
- **Readability-grade** — explicitly framed as "a metric over sentence length and word length … frame it that way and report it as such; it is NOT prose-policing — it never judges whether the prose is good, clear, or correct, only that the sentence/word-length metric sits above the target".
- **Graduation check** — presence-in-a-home.

The dimension opens with "Measure the shape of the standing docs; never judge the prose" and closes with "Structure-not-prose, restated: … None of them reads meaning — the no-prose-policing rule below is in full force for this dimension."

The readability-grade is framed as a Flesch-Kincaid-style grade (sentence/word-length metric), not a style judgment. The legibility act (read-before-ship) is explicitly left to the orchestrator. No-prose-policing preserved.

## Dimension-count consistency check

- `src/agents/pm-auditor.body.md` step 4: "Apply the remaining **5 dimensions**" — updated (was 4). Consistent.
- `src/agents/pm-auditor.body.md` heading: "## The **6 dimensions**" — updated (was 5). Consistent.
- Generated adapters `.claude/agents/pm-auditor.md` and `.opencode/agent/pm-auditor.md` both carry "remaining 5" / "The 6 dimensions". Consistent.

No stale count found anywhere in the Slice C diff.

## Mixed-project tolerance check

The graduation check asserts presence-in-a-durable-home, never absence-of-old-files. The text states: "a durable bit present in **EITHER** a surviving per-feature file (old model) **OR** the living reference (new model) **satisfies** graduation … must **NOT** flag a surviving old file as a problem … must **NOT** false-block a project that has not finished migrating. Presence-in-a-home is the test, absence-of-old-files is never the test." This is the only blocking finding; the frugality smells are notes. Mixed-project tolerance is correctly implemented.

## Test pairing

| Test | What it asserts | Non-vacuous |
|---|---|---|
| `auditor-frugality-dimension` | size/node-density/lost-in-the-middle/file-sprawl/readability-grade in auditor; scale-guard/shard/thin-core/graduation-check/git-aware in auditor; shard/compaction in pm-audit skill; `### Numbers = targets, not gates` and `### Graduation targets` referenced by name; structure-not-prose framing | Yes — strip removes specific tokens; production greps trip |
| `auditor-frugality-nonvacuous` | Stripping 5 tokens (node-density / lost-in-the-middle / file-sprawl / git-aware / scale-guard) causes at least one production presence grep to fail | Verified live (17/17 PASS) |
| `audit-mixed-project` | mid-migration / presence-in-a-home / absence-of-old-files / EITHER…OR / false-block all present in auditor | Yes — strip removes specific tokens; production greps trip |
| `audit-mixed-project-nonvacuous` | Stripping 3 tokens (mid-migration / presence-in-a-home / false-block) causes at least one production grep to fail | Verified live |
| `graduation-check-blocking` | Never-graduated merged feature marked **blocking**; other frugality smells stay note-severity | Yes — two-condition check (never-graduated + blocking co-occur in graduation-check region; "all five are note" / "this is the one frugality finding that is blocking" language present) |

## Adapters / golden check

- `pm-auditor.md` and `pm-audit.md` regenerated for BOTH harnesses (`.claude/` and `.opencode/`).
- Claude golden re-frozen for exactly those two files + SHA256SUMS.
- All other golden files byte-identical (confirmed: no other files in `.golden/claude/` appear in the diff).
- `tests/generator.sh` 4/4 (byte-equiv + SHA match + deterministic + diff-clean).

## Definition of Done

- [x] All plan scenarios implemented and tested
- [x] Interaction scenarios have concurrent-state tests
- [x] Stack expectations respected; stack-spec tests pass
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — n/a (internal/process feature, no Product Contract)
- [x] Pipeline green — all 10 suites pass: doc-style 17/17, generator 4/4, opencode 41/41, oc-plugin-unit 74/74, hooks 79/79, core-delegation 2/2, neutral-prose 5/5, targeted-reading 7/7, ultra-absent 2/2, o1-lifecycle 4/4.
- [x] State file updated — `.ai-pm/state/current.md` carries "SLICE C BUILT" entry with full Slice C detail.
- [x] Product Impact Report present (when contract touched) — n/a (no Product Contract)
- [x] Docs updates landed — the two auditor source files updated; adapters regenerated; no other "Docs to update" items are Slice C scope (architecture.md / user-journeys.md updates are pm-architect scope in Slice D, already landed).
- [x] Expected artifacts exist (plan, this review, contract if user-facing) — plan at `doc/features/doc-frugality_plan.md`; this review; no contract (internal feature).
- [n/a] Product-readiness gate resolved — non-user-facing feature (all scenario subjects are the system/auditor/process, not a human role); advocate exempt.
- [n/a] Validation gate resolved — software-kind project.
- [n/a] Failure-inventory negative-space tests — the plan lists no failure-path scenarios for Slice C (the failure mode is "silent knowledge loss" if graduation is skipped, but it is not listed as an explicit test scenario in the Test plan); not applicable.

**DoD: pass**

## Blocking

(none)

## Notes (product)

1. The readability-grade smell references `### Plain language / human-readable` in `workflow/doc-style.md` by name, but `doc-style.md`'s Plain language section does not mention Flesch-Kincaid or any grade-level number — the auditor names a target (≤ ~9–10) that has no single home in `doc-style.md`. The target number could drift: if `doc-style.md` is later updated to define a different grade target, the auditor body would need a separate edit. Why it matters: the "referenced by name, not re-encoded" discipline (the same rule the size smell uses for `### Numbers = targets, not gates`) would be cleaner if `doc-style.md` carried the readability-grade target and the auditor referenced it rather than stating the number. This is a structural observation, not a block — the current form is functional and internally consistent.

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass-2 code-review (high, recall-biased, 2 finder angles) run 2026-06-09 over the Slice C diff. Findings rooted in one single-home issue; all fixed.

1. **Readability-grade target had no canonical home (CONFIRMED; = the Pass-1 note).** The dimension-6 readability smell hardcoded "≤ ~9–10" inline and pointed at `### Plain language / human-readable` (which defines the jargon discipline, not a number) — asymmetric with the size smell (which references `### Numbers = targets, not gates` and re-encodes nothing). **Fixed `04378e4`** — the grade target now lives in `workflow/doc-style.md` `### Numbers = targets, not gates` as a soft target (a smell, not a gate); the auditor references it by name, inline number removed. Also tightened the no-prose-policing framing (a mechanical sentence/word-length metric, not a prose-quality judgement).
2. **Test robustness (CONFIRMED).** `tests/doc-style.sh` `graduation-check-blocking` fallback grep `without graduating` couldn't match the `**without** graduating` markdown — a latent false-negative. **Fixed `2c67beb`** — pattern → `without.*graduating`; the `auditor-frugality-dimension` assertion updated to the new `### Numbers` reference (non-vacuity preserved: stripping the smell trips it).
- **Dropped:** the positional "(see dimension 5)" reference (pre-existing, correct).

Post-fix all 10 suites GREEN (doc-style 17/17). Generator golden parity: only `pm-auditor.md` hash changed.

## Code review: 2026-06-09 — passed
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
