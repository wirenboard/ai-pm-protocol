# Execution State

- **Task:** `pm-product-advocate` — new independent product-axis referee (the `code-review` twin): a read-only agent that generates fixed-checklist foundational-product-question gaps and blocks the coder handoff (user-facing features) + a `/pm-bootstrap` foundational-question pass; soft-enforced with `pm-plan-checker` DoD + `pm-auditor` backstop, no hook.
- **Status:** review
- **Branch:** `feature/pm-product-advocate` (from `main`)
- **Done:**
  - `/pm-research` → `.ai-pm/research/pm-product-advocate_research.md` (verdict: new agent justified; checklist from Cagan/Working-Backwards/Shape-Up; block-but-overridable; proportional).
  - Plan approved → `doc/features/pm-product-advocate_plan.md` (7 scenarios, 8 key design decisions, categorical = user-facing only).
  - Arch review → `.ai-pm/arch/pm-product-advocate_arch.md` (Variant A on all 4 placements; Step 3.5, checklist in WORKFLOW.md, `.ai-pm/reviews/<topic>_advocate.md` with `gaps: N`/`clean` greppable token + `## Resolutions` trail, second edit-ownership carve-out, no hook). Plan updated with greppable format + carve-out specifics.
  - PM decisions (2026-06-04): v1 = full anchor (agent + per-feature gate + bootstrap pass); reach = user-facing only.
- **Done (pm-coder, 2026-06-04):**
  1. Created `.claude/agents/pm-product-advocate.md` (read-only referee: `tools: Read, Grep, Glob, Bash, Write`, no `model:`; presence-not-prose; never addresses PM; emits `gaps: N`/`clean` + numbered gaps through `## Verdict`; does NOT write `## Resolutions`).
  2. `WORKFLOW.md`: roster row; Step 3.5 product-readiness gate; bootstrap-pass note; `### Foundational product questions` (two tiers, fixed order, presence-only, cross-domain); product-readiness rider in "What is mandatory when"; **second edit-ownership carve-out** + agent-owned-artefact list entry + owner-list entry.
  3. `.claude/commands/pm-plan.md`: Product-readiness gate section (user-facing only via pm-auditor's human-role-subject extraction; spawn advocate after contract draft; one AskUserQuestion relay; record `## Resolutions`; block handoff until resolved; silent on `clean`); wired into Handoff; dispatch-table row; checklist referenced by name.
  4. `.claude/commands/pm-bootstrap.md`: Foundational-question pass (tier bootstrap) after the product Q&A, wired into greenfield + legacy shallow + legacy full; dispatch-table row; bootstrap tier referenced by name; explicit "questions only, no auto-drafted user-journeys.md".
  5. `.claude/agents/pm-plan-checker.md`: one user-facing-only DoD item (prose list + Verdict-format block) keyed on the greppable token (treats `clean` and `gaps: N`-with-N-resolutions as the two resolved states; non-user-facing exempt).
  6. `.claude/agents/pm-auditor.md`: dimension-1 user-facing-only artifact-completeness check, reusing the human-role-subject extraction (absent/unresolved = blocking; non-user-facing with no artifact = clean).
  7. `README.md`: one capability bullet in "Какие риски шаблон снижает" + agent name in the factual roster listing.
- **Remaining:**
  - `doc/architecture.md` decision — POST-coding (pm-architect handoff, orchestrator drives), not coder's.
  - Review loop: `pm-plan-checker` + `code-review`.
- **Touched files:**
  - `.claude/agents/pm-product-advocate.md` (new)
  - `WORKFLOW.md`
  - `.claude/commands/pm-plan.md`
  - `.claude/commands/pm-bootstrap.md`
  - `.claude/agents/pm-plan-checker.md`
  - `.claude/agents/pm-auditor.md`
  - `README.md`
  - `.ai-pm/state/current.md`
- **Next step:** spawn `pm-architect` for the `doc/architecture.md` decision (Docs-to-update handoff), then review loop (`pm-plan-checker` + `code-review`).
- **Validation:** no executable tests (repo "no automated tests by design"); `tests/hooks.sh` green (71/71, unchanged — no hook added); scenario coverage verified editorially by `pm-plan-checker` + `code-review`.
