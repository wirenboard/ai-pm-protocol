<!--
  Doc-style rules apply: fact-first, current-state-only, supersede-don't-edit,
  provenance-as-pointer, plain-language. Read them in `## Durable-text frugality`
  in `workflow/doc-style.md` — the authority; this comment names the rules and
  points there, it does not restate them.

  This is an on-demand decision file under `doc/decisions/`, sharded out of the
  thin `## Architectural decisions` index in `doc/architecture.md`. Each `###`
  record keeps the exact heading anchor it had in the index, so a reference of the
  form `doc/architecture.md` `### <heading>` still resolves (via the index entry
  that points here). Bodies are current-state-only decision records.
-->
# Pipeline roles & ownership

On-demand decision records sharded from `doc/architecture.md` `## Architectural decisions`. See that index for the full set and one-line gists.

---

### pm-auditor / pm-stack-researcher / pm-codebase-reader as read-only subagents

Read-only project-wide work (audit sweep, stack research, existing-codebase extraction at bootstrap) runs in subagents with explicit read-only constraints, not in the main session. This keeps the main orchestrator focused on PM conversation while large reads happen in isolation. **Source for pm-auditor:** PR #143, commit `cf889c6 feat(audit): make /audit spawn auditor subagent instead of reading in main`. **Source for pm-codebase-reader (under its former name, see rename below):** commit `f767531 Extract docs-extractor subagent for modular codebase reading`. **Source for pm-stack-researcher:** PR #142, commit `6e1bf14 Protocol integrity + stack literacy: close 5 structural gaps`.

**Rename + journeys-ownership consolidation (2026-06-04).** The reader agent (formerly carrying a "legacy" name) was renamed to **`pm-codebase-reader`**: it only ever *reads* an existing codebase at bootstrap and *writes* raw doc drafts, and "legacy" mis-narrows (a pre-existing codebase may be modern), so "codebase-reader" names what it does — read-only on code, drafting docs. The rename also **completed the drafts-vs-owns pattern** already in force for `docs/architecture.md` and `docs/threat-model.md` (the reader drafts raw, `pm-architect` finalizes and owns — established in commit `ee99c10`): `docs/user-journeys.md` was the one doc where the pattern was missing (the reader was treated as standing owner). Ownership of `docs/user-journeys.md` is now consolidated under **`pm-architect`** — which already owns `architecture.md`, `product.md`, `threat-model.md`, and the `## Behavioral contract (taxonomies & invariants)` that journeys reference move-not-copy — covering per-feature updates, gap-fill, standalone-when-gaps, and stale-journeys remediation. `pm-codebase-reader` is reduced to a pure bootstrap raw-drafter: it still drafts `user-journeys.md` from code at bootstrap legacy-full, and `pm-architect` finalizes that draft in the same finalize spawn that already finalizes the architecture and threat-model drafts. No new agent was added (the rejected alternative was a dedicated `pm-journeys` agent). **Source:** `doc/features/legacy-reader-role-split_plan.md`; branch commits `7e63ab1` (rename: agent file + frontmatter `name:`) and `462d61a` (journeys ownership → `pm-architect`, reader narrowed to raw-drafter); pattern precedent commit `ee99c10`.

---

### Edit-ownership split: content artefacts vs orchestration artefacts

The rule is not "the orchestrator writes no content" — the orchestrator already writes the **outputs of the processes it drives**: PM conversation → backlog / contracts; `/pm-plan` → the plan; running `code-review` → the Pass-2 trail; finding a protocol gap → a protocol-feedback report. What it never does is **freehand-edit canon owned by an autonomous agent** — source code, schemas, manifests, `docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`, plan / arch files under `docs/features/`, and (inside a review artefact under `.ai-pm/reviews/`) everything through `## Verdict`, owned by `pm-plan-checker`. When one of those needs to change, even by a line, it respawns the responsible agent.

**The one carve-out** is the Pass-2 code-review trail inside `.ai-pm/reviews/<topic>_review.md`: `pm-plan-checker` owns everything through `## Verdict`; the orchestrator owns only the `## Code review` trail below it. This is the single review section the orchestrator writes — it runs the `code-review` skill and already holds the findings, so routing them through an agent would pay a hop for data in hand. It is made safe by a **gate, not by discipline**: `pm-pr-prep` refuses to release a feature whose `## Code review` section is unstamped, and `pm-auditor` blocks an unstamped trail.

Orchestration artefacts (`docs/backlog.md` entries, PM decision logs, the Pass-2 trail above, protocol-gap reports under `.ai-pm/protocol-feedback/`, git operations, deployment script invocations) are normal orchestrator work. On discovering a structural gap in the protocol spec itself (a contradiction, an ungated manual step, a deceptive-empty template, an ownerless artefact — in `.ai-pm/tooling`, not project code), the orchestrator writes a structured report to `.ai-pm/protocol-feedback/<topic>.md` and surfaces it for upstreaming; it never silently works around the gap and never edits `.ai-pm/tooling` in place. **Source:** PR #144, commit `9f81f64 Post-cycle lessons: notes split, edit ownership, pr-prep flexibility`; carve-out, reframed model, and protocol-gap mechanism in `WORKFLOW.md` § "Edit-ownership rule" + § "When the protocol itself has a gap" (branch `feature/review-stamp-gate`); `doc/features/review-stamp-gate_plan.md` (scenarios 2 and 7).

---

### Categorical scope check at plan-feature stage

Every feature plan that mentions a categorical concept (type, mode, role, state, operation, category) must explicitly choose: take the whole set or one element. If one element — siblings are listed in "Out of scope" with one-line reason each. pm-coder cannot extend semantics of the chosen element to cover a sibling case; pm-plan-checker blocks. This catches scope drift before code. **Source:** PR #142, commit `6e1bf14 Protocol integrity + stack literacy: close 5 structural gaps`; rule text in `README.md` § "Что гарантирует шаблон" — "Scope без тихой деформации"; full plan in `doc/features/protocol-integrity-and-stack-literacy_plan.md`.

---

### Execution State as the single source of progress

One file — `.ai-pm/state/current.md` (per downstream project) — holds the active task's Status / Done / Remaining / Touched files / Next step / Validation. Every pm-coder run reads it first and writes it last. /pm-plan initializes it. On finish, the state resets to idle; the feature's lasting facts have already graduated into the living reference (the four permanent homes — see `### Keep only what's actually used; throw the rest away`) and the transient dossier evaporates to git, so there is no curated archive to keep. The intent is that any future session — same model, different model, same agent, different agent — can resume from this file alone, without scrolling chat history. **Source:** `doc/features/integrate-consultancy_plan.md` § "Scenarios"; `doc/_templates/state.md.tmpl`.

---

### Definition of Done as an explicit pm-plan-checker subsection

pm-plan-checker verdict now contains a "Definition of Done" subsection with 7 hard checks: scope respected; stack expectations honored; Product Contract honored; pipeline green; state updated; Product Impact Report present (when contract touched); plan's docs updates landed. The subsection ends with `DoD: pass | fail`. A pass with any unchecked box is a contradiction; pm-plan-checker must re-read its own findings. A fail forces `request-changes` even when Blocking is empty. **Source:** `doc/features/integrate-consultancy_plan.md` § "Key design decisions" point 4; `.claude/agents/pm-plan-checker.md` § "Verdict format".

---

### Eight review dimensions, decision matrix, trivial fast path, audit scope

Four orthogonal optimizations applied together:
1. **pm-plan-checker / pm-auditor dimensions reduced from 11 to 8** by merging three overlapping pairs (Plan + Product Contract → Plan & Contract compliance; Security + Stability → Correctness; Docs drift + Stack expectations → Documentation and canon compliance). No defect class lost; only the heading collapses.
2. **Decision matrix in WORKFLOW.md** (`## What is mandatory when`) — single table covering Execution State, Product Contract, DoD scope, Stack expectations by change type (user-facing / backend / docs-only / trivial). Replaces scattered inline conditions in pm-coder.md and pm-plan-checker.md.
3. **`/pm-fixup` command** for changes meeting four conditions (≤ 50 LOC, no user-visible behavior change, no stack-notes touch, no new source file). Skips plan-feature; pm-plan-checker runs in trivial mode (re-validates the four conditions; only escape hatch).
4. **pm-auditor `--scope=diff`** mode reads only files changed since the most recent `docs/audit-*.md` + their cross-references. `full` remains default and is explicitly recommended quarterly.

**Source:** `doc/features/optimize-without-losing-rigor_plan.md`; commits d09ac14, e441949, d563b02, 310695d.

**Currency note (2026-06-05):** Point 4's audit-scope decision was a silent auto-decide-and-announce. It now splits on **who initiated** the audit. A **PM-initiated** project-analysis request ("анализ проекта" / "review the project" by intent, no scope named) surfaces an **upfront `AskUserQuestion` scope menu** — Quick (`diff`, protocol-compliance only) vs Full (whole project + the code-quality review sweep) — with the threshold logic (first audit / >60 days / >15 feature commits) as the menu's **recommended default** the PM sees and can override; for Full the review-sweep **depth** choice is folded in. An explicit scope in the PM's words skips the menu (Full still surfaces depth). A **system-initiated** audit (the retrospective nudge / orchestrator-decided) keeps its **announce-and-proceed** behavior in both authority modes. A "no double-prompt" guard ensures the post-`diff` "run a full audit now?" offer fires only when a Quick/`diff` audit actually ran. PM-facing flow refinement, not a structural change. **Source:** `doc/features/audit-scope-menu_plan.md`.
