# contract-centric-product-map — plan

## Context

The feature index (`docs/features/_index.md`) is organized component → feature. Investigation showed it has only four touch points: `/pm-plan` writes it, `/pm-bootstrap` generates it, `pm-auditor` checks its currency (note-level only). **No agent reads it for discipline** — it is a write-only output, not an input anything depends on.

It was implicitly serving as a per-feature artifact checklist: filling the `Review [R]` / `Contract [C]` columns forced the orchestrator to confirm those files exist, and a `—` flagged a gap. But that checklist is **already redundant** with two blocking gates that read files directly: `pm-plan-checker` DoD (per-feature, at completion) and `pm-auditor` dimension 1 (project-wide artifact completeness). The index only mirrored them.

**The realization that drives this plan:** contracts are the source of truth for what the application *does*. A feature/plan is a *change event*; a review is *evidence*. The PM does not need a list of change events — they need a map of current behavior, which is the union of contracts. One contract lives long and accumulates many features. So the index must be **inverted**: not feature → contract, but **group → contract → the plans+reviews that built it**. And it belongs at the documentation level, named so it is obvious it holds the essence of the application — everything that became code.

**Decisions already taken (with the PM):**
- Name: `docs/product.md` at the documentation level (not under `docs/features/`).
- **Single rendered view, not two.** Neither index was ever a source of truth — the source is the files (`.ai-pm/contracts/*`, `docs/features/*_plan.md`, `.ai-pm/reviews/*`, git). `product.md` is the one PM-facing render; the feature index is retired.
- **Generated, never hand-filled** — a deterministic procedure rebuilds it at lifecycle points. No filling = no shortcutting. `pm-auditor` re-checks it from source (the same "don't trust prior state, re-read from source" hardening already applied to contracts).
- **Completeness:** an `## Infrastructure (no user-facing contract)` bucket holds contract-less (backend) features, so the map is "everything that became code", not just user-facing work.
- **Checklist function moves explicitly:** discipline → agent (`pm-plan-checker` DoD asserts the artifact set per feature) + `pm-auditor` dim 1 (retro backstop); render → orchestrator (generates `product.md`).
- **Contract → features link** is maintained contract-side (a `Built/changed by` list in each contract), appended at feature approve, so the inversion is read directly, not reconstructed.

## Scenarios

1. **PM has a contract-centric product map.** `docs/product.md` lists, grouped by component: each contract with a one-line guarantee (from its Must work), a status (live / deprecated), the contract-file link, and under it the plans + reviews that built or changed it. Contract-less features sit under `## Infrastructure (no user-facing contract)`. It reads as "what the system does."

2. **The map is generated, not filled.** A deterministic generation procedure rebuilds `product.md` from contracts + plans + reviews + git, at the same lifecycle points the old index was touched (contract created in `/pm-plan`, feature approved by `pm-plan-checker`, contract updated). No manual column-filling.

3. **Per-feature artifact completeness is asserted at the gate.** `pm-plan-checker` DoD gains an explicit item: the expected artifact set exists for this feature (plan, this review, contract if user-facing, state updated). This replaces the implicit "fill the column, notice the dash" mechanism with a blocking gate assertion.

4. **Contract knows its features.** Each contract file carries a `Built/changed by` list; `/pm-plan` appends the feature to it at approve. Generation reads it directly for the inversion.

5. **Feature index retired.** `docs/features/_index.md` is removed from the protocol: not created at bootstrap, not written by `/pm-plan`. `pm-auditor` dimension 1 (artifact completeness, blocking) is unchanged; dimension 5's index-currency check is repointed from `_index.md` to `product.md`.

## Existing behaviors this feature touches

- **`pm-plan.md`** — "Update feature index" section (lines ~244–260) replaced by "Update product map" (regenerate or append) + append the feature to the contract's `Built/changed by` list at approve. The status-on-approve logic (done date, review link) moves into the product-map render.
- **`pm-bootstrap.md`** — "Index generation procedure" becomes "Product map generation procedure"; bootstrap creates `docs/product.md` instead of `docs/features/_index.md` (all three bootstrap modes).
- **`pm-plan-checker.md`** — DoD gains the explicit artifact-completeness item (Scenario 3).
- **`pm-auditor.md`** — dimension 1 unchanged (the real artifact-completeness backstop, reads files); dimension 5 repointed from `_index.md` to `product.md`. The auditor's existing "Contract check" table is the same contract inventory `product.md` renders for the PM — cross-reference, don't duplicate.
- **`contract.md.tmpl`** — gains a `Built/changed by` list section (Scenario 4).
- **`CLAUDE.md.tmpl` / `WORKFLOW.md`** — Docs tables list `docs/product.md` (PM-facing product map) and drop `docs/features/_index.md`.

## Categorical scope check

- **Categories of "index"** — chose: invert the existing artifact rollup (group → contract → plans+reviews) into one generated PM render. Siblings explicitly **out of scope**:
  - Reconsidering `docs/user-journeys.md` vs contracts overlap (both describe behavior) — real question, separate plan; do not touch user-journeys here.
  - Generating this repo's own `doc/product.md` (dogfood) — separate follow-up; this plan edits the template/protocol, not the tooling repo's own docs.
  - The `protocol-builtins-realignment` items (tool-lock, hooks, deep-research) — different plan; this one is orthogonal but shares the "serve the PM / harden discipline" spirit.

## Stack expectations touched

No new external components. Markdown docs + a deterministic generation procedure described in prose (same shape as the existing index-generation procedure). No new validators. Self-validation is by review; a grep gate confirms no dangling `_index.md` references remain.

## Contracts

Atomic commits:

### Commit 1 — product map generation procedure + bootstrap
`pm-bootstrap.md`: replace "Index generation procedure" with "Product map generation procedure":
- Read `docs/architecture.md` for component grouping.
- For each `.ai-pm/contracts/<name>.md`: section with name, one-line guarantee (first Must work item), status, contract link, and a table of its `Built/changed by` features (plan link, Done date from review file creation via git, review link).
- `## Infrastructure (no user-facing contract)`: every plan in `docs/features/` not referenced by any contract's `Built/changed by` list.
- Bootstrap (all three modes) creates `docs/product.md` instead of `docs/features/_index.md`.

### Commit 2 — contract template carries its feature list
`contract.md.tmpl`: add a `## Built/changed by` section (list of `[<topic>](../../docs/features/<topic>_plan.md)` rows). Empty on creation.

### Commit 3 — /pm-plan writes the map, not the index
`pm-plan.md`: replace "Update feature index" with:
- On plan creation: if the feature creates/touches a contract, ensure the contract exists (unchanged); product map is regenerated.
- On `pm-plan-checker` approve: append the feature to the touched contract's `Built/changed by` list; regenerate `docs/product.md`.
- Remove the `_index.md` create-if-missing step.

### Commit 4 — pm-plan-checker asserts the artifact set
`pm-plan-checker.md`: add DoD item — "Expected artifacts exist: plan present, this review present, contract present if feature is user-facing, `.ai-pm/state/current.md` updated." Unchecked → DoD fail → `request-changes`.

### Commit 5 — auditor repoint + index retirement
`pm-auditor.md`: dimension 5 — replace `docs/features/_index.md` currency checks with `docs/product.md` currency (exists; every contract rendered; every plan appears under a contract or Infrastructure; links resolve; status matches reviews). Dimension 1 unchanged. `CLAUDE.md.tmpl` + `WORKFLOW.md` Docs tables: add `docs/product.md`, drop `_index.md`. Remove residual `_index.md` references across the protocol.

## Test plan

Self-edit validation by review:
- **No dangling references:** `grep -rn "_index" .claude WORKFLOW.md doc/_templates` returns nothing after Commit 5.
- **Generation procedure is deterministic and worked through one example** in the plan-checker review: given two contracts + one backend feature, the procedure produces a stable `product.md` with both contracts populated and the backend feature under Infrastructure.
- **Anti-regression — discipline not weakened:** artifact completeness is still blocking via `pm-auditor` dim 1 (unchanged) plus the new `pm-plan-checker` DoD line. Retiring the index removes a write-only mirror, not a gate.
- **Anti-shortcutting:** `product.md` is generated, and `pm-auditor` re-derives it from source on every full audit — a stale or hand-edited map is a finding, not silently trusted.
- `bash tests/hooks.sh` — unaffected, still green (no hook changes).

## Docs to update

- `.claude/commands/pm-plan.md` — Commit 3.
- `.claude/commands/pm-bootstrap.md` — Commit 1.
- `.claude/agents/pm-plan-checker.md` — Commit 4.
- `.claude/agents/pm-auditor.md` — Commit 5.
- `doc/_templates/contract.md.tmpl` — Commit 2.
- `doc/_templates/CLAUDE.md.tmpl` — Commit 5 (Docs table).
- `WORKFLOW.md` — Commit 5 (Docs table; "How state is kept" cross-reference to product map).
- `doc/architecture.md` — Architectural decisions: record the index inversion + retirement with rationale and a pointer to this plan.

## Out of scope

- Reworking `docs/user-journeys.md` against contracts.
- Generating this repo's own `doc/product.md` (dogfood follow-up).
- Anything in `protocol-builtins-realignment`.
- Changing the contract template's behavioral sections (Must work / Must not break / Acceptance) — only adding the `Built/changed by` list.

## Handoff

1. Orchestrator writes this plan and commits.
2. Commits 1–5 in order (template + procedure first, then the writers, then retirement so no step references a not-yet-existing artifact).
3. Self-review: `pm-plan-checker` on the branch; grep gate for `_index`; `bash tests/hooks.sh` green.
4. `pr-prep`: `feat:` cluster → MINOR. Independent of `protocol-builtins-realignment` — can ship as its own PR.
