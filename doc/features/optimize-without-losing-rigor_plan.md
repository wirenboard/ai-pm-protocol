# optimize-without-losing-rigor — plan

## Context

Per-change overhead grew through the recent sequence (stack-notes + state + contracts + DoD + 11-dim reviewer + 11-dim auditor + hooks + tests). Each addition closed a real defect class but the total ceremony for a small fix is now disproportionate.

This plan ships four orthogonal optimizations that compress overhead without weakening any gate. Each preserves what defect the original mechanism caught; only the form (number of categories, file structure, fast paths) changes.

## Scenarios

1. **Smaller reviewer / auditor verdict files.** Reviewer goes from 11 dimensions to 8 by merging three overlapping pairs into single, broader dimensions. Same defects caught, fewer categories to navigate.

2. **Explicit decision matrix for state / contract / DoD.** Each is currently scattered across coder.md and reviewer.md with "skip if backend-only" / "meta-case N/A" caveats in many places. Collapse to one table in WORKFLOW.md so coder and reviewer read once.

3. **Trivial-fixup fast path** (`/fixup` command). PRs that meet four narrow conditions (≤ 50 lines diff, no user-facing behavior, no stack-notes touch, no new code file) skip plan-feature, go straight to coder with compact prompt, reviewer runs in trivial-mode (Blocking + DoD only, no notes triage). Saves ~10 min per micro-fix. Reviewer in trivial mode re-validates the four conditions; if any breaks, bounce to plan-feature.

4. **Audit `--scope=diff` mode.** Auditor accepts a scope parameter: `full` (current behavior) or `diff` (only files changed since last `docs/audit-*.md` + their direct cross-references). Full audit explicitly recommended quarterly; diff mode for routine in-progress checks.

## Existing behaviors this feature touches

- **Reviewer dimensions** — 11 → 8. The dropped category names disappear but each defect class is still caught under a broader name. Reviewer verdict file shape unchanged (sections "Plan compliance", "Definition of Done", "Blocking", "Notes (product)", "Notes (technical)", "Verdict").
- **Auditor dimensions** — same merge applied; `--scope=diff` option added.
- **coder.md** — references to dim numbers (e.g., "see reviewer dim 9") updated. Step 9 (update state) gets a "skip if task is single-step done in this run" exception per the decision matrix.
- **plan-feature.md** — "Stack component check" + "Categorical scope check" + "Product Contract check" unchanged in substance. Wording around mandatory/skip cases now defers to the matrix instead of inline conditions.
- **`/audit` command** — invocation can now pass `scope=diff`; default remains `full`.
- **No removed gate.** Every defect that the 11-dim form caught is still caught by the 8-dim form. No new files of plan/review machinery; the trivial-fixup path **shrinks** the file count for the smallest changes.

## Categorical scope check

- **Categories of optimization** — chose: text consolidation (dim merge) + new fast path (trivial-fixup) + new parameter (scope). Sibling optimizations explicitly Out of scope:
  - Removing any gate entirely (Hooks, stack-notes, edit-ownership, categorical scope) — would lose rigor.
  - Modes-vs-roles redesign (consultancy Part 3 already rejected) — out of scope, not reopening.
  - Moving content between agent files — not in this PR; would amplify drift risk before split is proven.

## Stack expectations touched

No new external stack components. Markdown frontmatter for the new `/fixup` command file uses the same YAML 1.2.2 frontmatter shape as existing commands. No new validators, no new integration contracts.

## Contracts

### Reviewer dimension merge (commit 1)

New 8 dimensions (replaces 11):

1. **Plan & Contract compliance** — merges old dim 1 (plan compliance + plan completeness sub-check + categorical coverage sub-check) and old dim 11 (Product Contract compliance). Same checks; one heading.
2. **Test quality** — was dim 2, unchanged.
3. **Correctness (Security + Stability)** — merges old dim 3 (Security) and old dim 4 (Stability). Both are "may this break or be exploited in production"; reviewer reads diff as attacker and as operator in one pass.
4. **Regressions risk** — was dim 5, unchanged.
5. **Conventions** — was dim 6, unchanged.
6. **Dead code and simplification** — was dim 7, unchanged.
7. **Documentation and canon compliance** — merges old dim 8 (documentation drift) and old dim 10 (stack expectations compliance). Both compare code against a documented source of truth.
8. **Infrastructure and integration delivery** — was dim 9, unchanged.

DoD checklist updated to reference the new dimension names (count drops from 7 to 7 — DoD items don't map 1:1 to dimensions, the count is coincidental).

### Conditional decision matrix (commit 2)

New section in WORKFLOW.md, "What is mandatory when":

| Change type | Execution State | Product Contract | DoD applicable | Stack expectations |
|---|---|---|---|---|
| User-facing feature change | required, update each step | required (create or update) | yes, all 7 | required if stack touched |
| Backend refactor / infra | required, update each step | skip with one-line reason | yes, items 1/2/4/6/7 | required if stack touched |
| Docs-only fix | optional (set Status: done at end) | skip | yes, items 1/4/7 | skip |
| Trivial fixup (see `/fixup` rules) | skip | skip | trivial DoD: scope + pipeline + docs | skip |

This replaces scattered "skip if backend-only" / "N/A meta-case" mentions in coder.md and reviewer.md with one table.

### `/fixup` command (commit 3)

New file `.claude/commands/fixup.md`. Conditions for invocation:
- diff ≤ 50 lines (rough estimate; coder reports actual at end)
- no user-visible behavior change (no new user input, no new output format, no error message changes user reads)
- no `docs/stack-notes.md` touch
- no new `.ts` / `.py` / `.go` / `.rs` / `.js` / etc. source file (existing file edits OK)

Flow:
1. Orchestrator validates the four conditions against the proposed change. If any fails → fall back to `/plan-feature`.
2. Spawn `coder` with a compact prompt (no plan file path; the prompt itself describes the change). Coder writes the change, runs pipeline, commits.
3. Spawn `reviewer` in `--mode=trivial`: only Blocking + DoD (items 1, 4, 7). No Notes triage. Reviewer re-validates the four conditions; if any broke during implementation, returns `request-changes` with reason "trivial-fixup violation — escalate to plan-feature".
4. `pr-prep` runs as usual.

Output of a `/fixup` produces no plan file. The PR title and description carry the change rationale directly.

### Auditor `--scope=diff` (commit 4)

`auditor.md` persona accepts an optional input parameter `scope: full | diff`. When `diff`:
- Read all `docs/audit-*.md` files; find the most recent.
- `git diff <date-of-most-recent-audit>..HEAD --name-only` → files changed.
- For each changed file, also read direct cross-references (grep imports / requires / paths).
- Apply the 8 dimensions to this scoped read.
- Output written to `docs/audit-<YYYY-MM-DD>.md` with prefix `# Project audit (diff scope) — <date>`.

`audit.md` command lets the orchestrator pass `scope=diff` or `scope=full`. Default = `full`. A note recommends `full` quarterly even when `diff` is used routinely.

## Test plan

Validation by review (template-self-edit, no automated tests):

- Commit 1: reviewer.md and auditor.md list 8 dimensions; each old dimension's defect is preserved in a merged dimension; DoD checklist references new names.
- Commit 2: WORKFLOW.md has the decision matrix; coder.md and reviewer.md prose updated to reference it instead of inline conditions.
- Commit 3: `.claude/commands/fixup.md` exists with the four conditions and three-step flow; reviewer.md has a `--mode=trivial` section. Self-validating: running `/fixup` on this very PR is NOT possible (this PR fails the "no new code file" condition — it creates fixup.md), so orchestrator must use plan-feature here. Reviewer in trivial mode is text-defined only; the actual --mode parameter is just a routing hint to the reviewer's prompt.
- Commit 4: auditor.md persona accepts `scope`; audit.md command exposes it. Diff scope output filename is the same; only the heading changes.

Anti-regression:
- All previously caught defect classes (Matter spec violation, silent scope creep, scope ambiguity, broken citations) still caught by the merged dimensions. Concretely: take a hypothetical diff that introduces `currentLevel: 0` — it now fails dimension 7 (documentation and canon compliance) instead of old dim 10. Same blocking, different label.
- Pipeline green: `bash tests/hooks.sh` 44/44 unchanged. Hooks layer untouched.
- DoD still binding: a failed DoD still forces request-changes regardless of Blocking count.

## Docs to update

- `.claude/agents/reviewer.md` — 11 → 8 dimensions; DoD checklist names updated; trivial-mode block added (commit 1 and 3).
- `.claude/agents/auditor.md` — 11 → 8 dimensions; `scope` parameter section added (commit 1 and 4).
- `.claude/agents/coder.md` — references to specific dim numbers updated; step 9 exception text references the matrix (commit 1 and 2).
- `.claude/commands/audit.md` — accepts scope parameter (commit 4).
- `.claude/commands/fixup.md` — new file (commit 3).
- `.claude/commands/plan-feature.md` — wording around mandatory/skip cases simplified, defers to matrix (commit 2).
- `WORKFLOW.md` — new "What is mandatory when" table (commit 2); agent table mentions `--scope=diff` for auditor (commit 4); agent table mentions `/fixup` (commit 3).
- `doc/architecture.md` — File layout adds `.claude/commands/fixup.md`; "Architectural decisions" gets a new entry for the decision matrix and dim merge with rationale (commit 4 final pass).
- `README.md` — no changes; this PR is internal mechanics, no marketing impact.

## Out of scope

- Removing any gate (Hooks, stack-notes, edit-ownership, categorical scope) — would lose rigor.
- Modes-vs-roles redesign — already rejected in integrate-consultancy.
- Moving content between agent files — separate plan if drift becomes a problem.
- Changing how `pr-prep` works — orthogonal.
- Translating any file — orthogonal.

## Handoff

1. Orchestrator writes the plan (this file) and commits.
2. Four atomic commits in order: dim merge → decision matrix → fixup command → audit scope.
3. Self-review: reviewer spawn on the branch; applies the new 8-dim form to itself; DoD pass required.
4. pr-prep: this is a `feat:` cluster → MINOR (v1.12.0).
