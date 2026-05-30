# readme-workflow-split — plan

## Audit reference

From `doc/features/audit-2026-05-30.md` note #3:
> WORKFLOW.md vs README.md — both cover the same orchestration material in two places, mostly consistent but with subtle divergences. ... Consider a one-page divisor: README is the marketing/quickstart face, WORKFLOW is the canonical orchestration spec — link from one to the other rather than duplicating.

PM decided: "Развести роли" (split the roles).

## Current state

The two files have already drifted into distinct roles in practice:
- `README.md` — Russian, marketing + quickstart + install + flow diagrams + "what guarantees" overview.
- `WORKFLOW.md` — English, agent roster + edit-ownership + boundaries + step-by-step orchestration + PM communication rules.

What is missing: explicit cross-references making the role split visible to a reader. A reader currently does not know which file is canonical for which question. The previous audits' drift risk persists silently.

## Scenarios

1. `README.md` carries a banner at the top of "Как это работает" / "Какие риски снижает" / "Что остаётся за PM" sections pointing to the canonical sections in `WORKFLOW.md`. A reader who needs the binding rules knows where to go.
2. `WORKFLOW.md` carries a one-line header note pointing to `README.md` for the marketing-level overview, so a reader landing in WORKFLOW first knows there is a friendlier intro.
3. Future drift between the two files becomes visible: when one is updated, the cross-reference in the other surfaces the inconsistency at review time.

## Existing behaviors

- WORKFLOW.md remains the canonical orchestration spec for agents and downstream `CLAUDE.md` import (`@.ai-pm/tooling/WORKFLOW.md` directive).
- README.md remains the marketing surface — PMs and new contributors land here first.
- No content moves between files. This is a cross-reference plan, not a content migration.

## Categorical scope

"Cross-reference styles" — categorical, but trivially. Chose: inline parenthetical pointer ("полный canonical флоу — в `WORKFLOW.md`"). Sibling forms (footer block, dedicated "see also" section, badge / banner at top) — Out of scope, can be added if the inline form proves insufficient.

## Stack expectations touched

None — pure prose edit. Markdown frontmatter from `doc/stack-notes.md` is not in scope; these are plain Markdown files with no frontmatter.

## Test plan

Validation by review:
- Each cross-reference points at a section that actually exists in the target file.
- No content is duplicated, removed, or rephrased — only inline pointers added.
- README install instructions and Russian voice preserved.
- WORKFLOW.md header note is one line, does not contradict the existing intro.

DoD applies: scope respected, no Product Contract touched, pipeline green, docs landed.

## Docs to update

- `README.md` — three short inline cross-references in: "Как это работает" intro, "Какие риски снижает" intro, "Что остаётся за PM" intro.
- `WORKFLOW.md` — one short header note pointing to README for the overview.

## Out of scope

- Content migration between the files (separate plan if pain shows).
- Translating WORKFLOW.md to Russian or README.md to English.
- Refactoring the flow diagrams in README.
- Removing duplication of the agent roster (the roster lives in WORKFLOW; README only shows the flow diagram).

## Handoff

1. Orchestrator edits README.md (inline cross-refs) and WORKFLOW.md (header note).
2. Self-review: reviewer verifies cross-refs point at real sections; no content migration.
3. pr-prep: docs PATCH bump.
