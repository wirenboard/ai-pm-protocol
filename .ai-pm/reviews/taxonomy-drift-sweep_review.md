# taxonomy-drift-sweep — plan-compliance review

Meta-feature on the no-user-facing-contract template repo (software-kind exception). No Product Contract, no product-readiness advocate gate, no `## Validation` gate. Verification = editorial + clean-grep (no automated tests by design). Pass-2 is `code-review`.

## Plan completeness (pre-checks)
- ✓ No `docs/stack-notes.md` in repo → no "Stack expectations touched" section required.
- ✓ "Provably isolated" declared (Interaction scenarios section, plan:44) — prose-spec change, no runtime / shared state / I/O. Valid.
- ✓ No `docs/threat-model.md` → non-security project; threat-model "Docs to update" requirement never fires.
- ✓ Topic is not `hotfix-<area>` → no Incident-facts requirement.
- ✓ Categorical coverage: the EPIC sub-classes the plan does not implement are each listed under Out of scope with a one-line reason (plan:69-78).

## Plan compliance
- ✓ **sc1 — declared-taxonomy exact-token restatement, gated to backticked/fenced code-span tokens** — implemented at `.claude/agents/pm-auditor.md:140`. Backtick gate present; bare-prose match documented as a deliberate miss; common-word over-fire / two-consecutive-audits escalation risk named. Matches plan:13 and arch Variant A.
- ✓ **sc2 — wire-token shape in a journey** — implemented at `pm-auditor.md:141`. Vocabulary reused **by reference** ("the wire-token shapes the structural-token note above defines"); domain-vocab exclusion (`DimmableLight`/`Matter`/`fabric`) inherited. Matches plan:15.
- ✓ **sc3 — dangling `## Behavioral contract` reference** — implemented at `pm-auditor.md:142`; named the journeys-side sibling of the dangling-`SCn` check. Matches plan:17.
- ✓ **sc4 — non-overlap with the existing contract/product-map token note** — implemented at `pm-auditor.md:139` ("surface is `docs/user-journeys.md` ONLY … non-overlapping by **file** … so no token can fire on both"). Disjointness is structural (different files). **Verified by grep**: the new check (lines 139-144) re-encodes zero members of the wire-token list (`matter_export`/`0..254`/`/devices/`/`mqtt.socketPath`/`bridge.*`); the only list-bearing lines are the pre-existing dimension-4 notes (106, 116), which are byte-unchanged in this diff. The by-reference vocabulary-reuse claim and the non-overlap claim both hold. Matches plan:19.
- ✓ **sc4a — intended `## Behavioral contract` reference exempt** — implemented at `pm-auditor.md:143` ("inherit verbatim the same relative-doc-reference carve-out the structural-token note above already applies"). The carve-out it inherits is live at `pm-auditor.md:106`. Matches plan:21.
- ✓ **sc5 — structural / shape-not-meaning, note-not-blocking, presence-conditional** — covered by the check preamble (`:139`, presence-conditional/silent-when-absent) and the closing remediation+discipline paragraph (`:144`, "Structural / shape-not-meaning only … Note, never blocking … subject only to the dimension-wide two-consecutive-full-audits → blocking rule … not a new escalation"). Matches plan:23.
- ✓ **sc6 — additive / back-compat** — the diff adds one dimension-5 bullet block; no template structural change, no new required field, no migration, no `CLAUDE.md`/`MIGRATIONS.md` edit. Matches plan:25.

### Existing behaviors touched (must-not-break) — verified
- ✓ Existing structural-token note (`:106`, `:116`) byte-unchanged and not duplicated.
- ✓ Journeys move-not-copy discipline text unchanged; `pm-architect.md:107` gains the optional one-line "now backstopped by `pm-auditor`" pointer (plan:63) — no behavior change.
- ✓ Dimension-5 structural family + two-consecutive-audits escalation reused, not forked (`:144`).
- ✓ `## Behavioral contract` single-home + System-invariants index (v2.21.0) unchanged.

### Docs to update (plan:60-65) — all landed on branch
- ✓ `.claude/agents/pm-auditor.md` — dimension-5 check added (a–e sub-requirements all present).
- ✓ `.claude/agents/pm-architect.md` — one-line backstop note added.
- ✓ `doc/architecture.md` — decision record added (slice-2 framing, by-reference reuse, code-span gate rationale, siblings deferred, Source line).

## Definition of Done
- [x] All plan scenarios implemented and tested — editorial + clean-grep verification per repo discipline; tests `tests/hooks.sh` 71/71.
- [x] Interaction scenarios have concurrent-state tests — n/a (Provably isolated; declared).
- [x] Stack expectations respected; stack-spec tests pass — n/a (no stack component touched; no `docs/stack-notes.md`).
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — **no Product Contract touched** (backend/meta-only, every scenario subject is `pm-auditor`/the journeys doc/the audit; non-user-facing). Explicit.
- [x] Pipeline green — `tests/hooks.sh` 71/71.
- [x] State file updated — `.ai-pm/state/current.md` tracks `taxonomy-drift-sweep`.
- [x] Product Impact Report present (when contract touched) — n/a (no contract touched).
- [x] Docs updates landed — pm-auditor.md, pm-architect.md, doc/architecture.md all on branch.
- [x] Expected artifacts exist — plan, this review; no contract (non-user-facing).
- [n/a] Product-readiness gate — non-user-facing (every scenario subject is the system/auditor/doc); exempt, no advocate artifact required.
- [n/a] Validation gate — software-kind (no `## Project kind` line in `CLAUDE.md` ⇒ software); no `## Validation` section emitted.

**DoD: pass**

## Blocking
None.

## Notes (product)
None. Scope is exactly the plan's slice-2 surface (`docs/user-journeys.md`); siblings explicitly deferred under Out of scope. No scope expansion, no user-visible trade-off.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
Prose-spec diff (markdown agent-instructions only — no runtime). Focused fan-out: spec-consistency + cross-doc-coherence finders. Two real spec-correctness defects found and **fixed in-pass**:

1. **Incorrect dimension reference (sc2, `pm-auditor.md:141`; also `:139`).** The new check named the contract / product-map structural-token note as "(dimension 4, the contract / product-map note)", but the *product-map value-line* note lives in **dimension 5** (this same dimension); only the *contract* note is in dimension 4. An auditor following "dimension 4" to find the product-map note would not find it there. **Fix:** reworded both sites to "the contract note in dimension 4 … and the product-map value-line note in this dimension".
2. **Silent-condition omitted sc3 (`pm-auditor.md:139`).** The presence-conditional "silent when …" clause listed only token-absence and shape-absence, but sc3 (dangling `## Behavioral contract` reference) fires independently of any token/shape — a journeys file with a dangling reference and no tokens satisfied the stated silent condition yet sc3 should emit a note. **Fix:** added "or a `## Behavioral contract (taxonomies & invariants)` reference" to the silence gate, aligning it with sc3.

Observations (not defects, no fix on this branch):
- CHANGELOG `[Unreleased]` empty / no v2.22.0 entry — **owned by pr-prep** (the version bump + changelog land at release prep, matching slice 1's flow).
- EPIC deferred-sibling list differs between the slice-1 record (architecture.md) and the slice-2 record (slice 2 adds the NFR/operational-limits prompt + conditional-state-model section) — the two are dated historical records; slice 2 is the more complete, current roster (and these siblings are listed in the plan's Out of scope). Left as-is by design — records are append-only.

`tests/hooks.sh` 71/71 after the fixes.

## Code review: DONE — 2 findings, both fixed in-pass; verdict approve
