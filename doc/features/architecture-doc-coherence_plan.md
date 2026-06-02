# architecture-doc-coherence — plan

Three related backlog findings (#2, #3, #5), all about `doc/architecture.md` and its
template, owner `pm-architect`. Batched because they touch the same file/area.

## Scenarios
1. The architecture template `doc/_templates/architecture.md.tmpl` is **enriched to match what `pm-architect` (A4) already cross-checks and what this protocol's own `doc/architecture.md` already uses**: it gains a coarse **`File layout (module map)`** section (`directory/module → one-line responsibility`, NOT per-function — this unifies the proposed module map with the agents' existing File-layout expectation), plus **`Integration contract`** and **`Release flow`** sections, and renames `Key decisions → Architectural decisions` and `Constraints → Architectural constraints`. (Git history is decisive: the template was born thin and never updated; the agent prose and the lived own-doc are the source of truth, not the template — see `.ai-pm/arch/architecture-doc-coherence_arch.md`.)
2. The agent/command prose listing the architecture-template sections (`pm-architect.md` A4, `pm-bootstrap.md`) becomes **literally true** against the enriched template — names aligned, no phantom references, no skipped sections.
3. The `pm-auditor` "major components → note" check (`:104`) keys on the named **`File layout (module map)`** section — its requirement now has a concrete, satisfiable anchor (no more manufactured soft requirement that the template + architect cannot legitimately satisfy).
4. This repo's own `doc/architecture.md` **no longer self-contradicts on hooks**: the Architectural constraints section acknowledges the single `UserPromptSubmit` reminder hook (consistent with the doc's own ~line-100 reference and the shipped `.claude/settings.json`), instead of asserting "PreToolUse-only".

## Existing behaviors this feature touches
- The template section walk (`pm-architect` A2/A5: "walk every template section", "do not introduce sections not in the template") — gains the module-map section.
- `pm-auditor` docs-currency component check (`:104`) — points at the module-map section.
- The downstream bootstrap/architect flow that fills `docs/architecture.md` from the template.

## Contracts
None (no config keys, no APIs). Ownership: the module-map section is authored by `pm-architect` (like the rest of `architecture.md`), at `directory/module → responsibility` granularity.

## Stack expectations touched
None — no external stack component. `doc/stack-notes.md` is untouched; no `pm-stack-researcher`.

## Interaction scenarios
`Provably isolated`: a template + agent-prose change plus one own-doc fix. No shared mutable state, no async, no I/O, no concurrent operations. The only "intersection" is conceptual (captured in Key design decisions): the module map must NOT duplicate the new authored `docs/product.md` "## Документы".

## Test plan
- Existing that must pass: `bash tests/hooks.sh` (65/65) — hooks untouched.
- No automated test for prose/template content (`tests/hooks.sh` is the only harness — meta-infrastructure exception, recorded in `doc/architecture.md`). Verification by review:
  - the template gains `File layout (module map)` (coarse, `directory/module → responsibility`, not per-function), `Integration contract`, `Release flow`, and renames `Key decisions → Architectural decisions` / `Constraints → Architectural constraints`;
  - `pm-architect.md` (A4) + `pm-bootstrap.md` section lists are literally true against the enriched template (names aligned, no phantom refs, no skips);
  - the `pm-auditor` component check (`:104`) keys on the named `File layout (module map)` section;
  - `doc/architecture.md` no longer claims "PreToolUse-only" and is consistent about `UserPromptSubmit` with its ~line-100 reference (the other, correct `PreToolUse` mentions stay untouched);
  - the module map does not duplicate `product.md` "## Документы".

## Docs to update
- `doc/architecture.md` (this repo) — the #5 hook-surface fix; done by **`pm-architect`** after the coder (not the coder).
- `CHANGELOG.md` + version bump (**MINOR** — new template section, downstream-affecting) at `pm-pr-prep`.

## Key design decisions
- **Direction (arch review + git history):** the template was the impoverished side — `File layout` / `Integration contract` / `Release flow` were never in any architecture `.tmpl`, while the agents (A4 cross-checks) and this repo's own lived `doc/architecture.md` already use them. So **enrich the template up to the agents/own-doc; do NOT drop sections** (A4's cross-checks against `ls`/CI/README catch real drift). Forced single variant — no viable "trim the agents to the thin template" alternative. Full reasoning in `.ai-pm/arch/architecture-doc-coherence_arch.md`.
- **Unify, don't add a parallel section:** the module map and the agents' "File layout" become ONE coarse section `## File layout (module map)` on the responsibility axis — two coarse tables would reintroduce the "which section does the auditor key on?" ambiguity this fixes.
- Module-map granularity = `directory/module → one-line responsibility` (coarse). Per-function excluded (doc-restates-code drift). Distinct from `product.md` "## Документы" (PM-facing docs nav); this is developer/agent-facing `src/` structure.
- Scope covers **all four drifts**: 2 renames + `File layout (module map)` + `Integration contract` + `Release flow` — not just the module map.
- #2/#3 deploy downstream (template + agents) → MINOR bump; #5 is the protocol's own `doc/architecture.md` (dev-internal docs-currency) and rides along.

## Out of scope
- backlog #4 (product-map migration trigger + auditor detection) — independent.
- backlog #1 — rejected by PM.
- The per-project module-map *content* — authored per downstream project by `pm-architect` from the real `src/` layout; the template only provides the section + guidance.
- Deep per-function documentation — explicitly excluded (drift risk).
