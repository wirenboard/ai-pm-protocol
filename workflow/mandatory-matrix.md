> **Topic file of the orchestration spec** — read on demand from `WORKFLOW.md`'s navigation map. This is the single-source change-type table + its riders. Read it before deciding what artefacts a given change type requires.

## What is mandatory when

Different change types impose different overhead. This table is the single source of truth for what's required and what can be skipped. Coder and reviewer read it once instead of hunting through inline conditions.

| Change type | Execution State | Product Contract | Definition of Done | Stack expectations |
|---|---|---|---|---|
| User-facing feature (new behavior, new UI, new public API) | required, update each step | required (create or update + Product Impact Report from coder) | yes, all 7 items | required if stack touched |
| Backend refactor / infrastructure / build / CI | required, update each step | skip with one-line reason in commit message | yes, items 1, 2, 4, 5, 7 | required if stack touched |
| Docs-only fix (typo, wording, README, plan, review trail) | optional (set Status: done at end) | skip | yes, items 1, 4, 7 | skip |
| Trivial fixup (see `/pm-fixup` rules) | skip | skip | trivial DoD: scope + pipeline + docs landed | skip |
| Diagnostic probe / spike (PM-authorized, runtime/local only) | skip | skip | skip — throwaway, reverted or followed by a pipelined fix (the Blast-radius preflight still applies — a coupled live target is stop-and-surface, even for a skip-all probe) | skip |

**"Skip with one-line reason"** means coder writes in the commit message `Skips Product Contract: backend-only refactor, no user-visible behavior change`. `pm-plan-checker` accepts the skip if the line is present and honest; absence of the line on a backend change → blocking.

**"Set Status: done at end"** means coder writes the state file once in the closing commit, doesn't update it mid-task. For docs-only fixes the state is essentially a record that the change happened.

**Product-readiness rider:** a **user-facing feature** (the first row — its scenario subjects are a human role, the `pm-auditor` extraction) additionally requires the **product-readiness gate** to be resolved before the coder handoff — `pm-product-advocate` run (tier `per-feature`), every `### Foundational product questions` gap answered or descoped, the `.ai-pm/reviews/<topic>_advocate.md` artifact carrying a `clean` or `gaps: N`-with-N-resolutions verdict. See **Step 3.5** in `workflow/pipeline.md`. The other rows — backend / infrastructure / CI, docs-only, trivial fixup, diagnostic probe — are **exempt** by the same human-role-subject extraction (no human-role scenario subject → no gate, no advocate spawn, no artifact required); there is no feature-category special-casing.

**Threat-model rider:** on a security-bearing project (one with `docs/threat-model.md`), a feature that touches a `### Security-relevant surfaces` item additionally requires a `docs/threat-model.md` update in "Docs to update" — see **Threat-model lifecycle** in `workflow/security-surfaces.md`. This is orthogonal to the row above (it applies on top of whatever the change type requires).

**Project-kind rider:** on a `documentation`-kind project, the code-only obligations in the table above are inert and the no-code validation discipline applies instead — see the **Project-kind rider** under `### Project kind` in `workflow/project-kind.md` (referenced by name; never re-encoded here).

Trivial-fixup rules and the `/pm-fixup` command are in `.claude/commands/pm-fixup.md`.
