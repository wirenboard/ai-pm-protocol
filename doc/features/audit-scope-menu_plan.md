# audit-scope-menu — plan

Source: PM directive 2026-06-05 — on a PM-initiated project-analysis request ("анализ проекта" / "полный анализ проекта"), the PM expects an upfront menu (quick / full + review + depth), not a silent auto-decided scope. PM chose "сделать меню сейчас, отгрузить вместе" (fold into the current `feature/periodic-codebase-review` branch, ship with `review-engine-selection` as one PR).

## Scenarios

1. **A PM-initiated analysis request shows an upfront scope menu.** When the PM asks for a project analysis by intent (e.g. "анализ проекта", "проверь проект", "review the project") **without naming the scope**, the protocol presents one `AskUserQuestion` menu before running anything — **Quick** (protocol-compliance only, fast `diff`) vs **Full** (whole project: protocol-compliance **+** the code-quality review sweep) — instead of silently auto-deciding and only announcing. The PM's pick drives the `/pm-audit` scope.
2. **A scope-specified request is honored without re-asking scope.** When the PM's words already name the scope — "полный анализ" / "go deep" / "everything" → **Full**; "быстрая проверка" / "just a quick one" → **Quick** — the protocol honors it directly (no redundant scope menu). For a Full analysis it still surfaces the review-sweep **depth** choice (light `low`/`medium` vs deep `high`/`max`/`ultra`) so the PM controls cost, consistent with the existing `## Technical quality` depth offer.
3. **The existing auto-triggers and safety nets are unchanged.** The retrospective audit nudge (5+ features since last audit), the auto-scope thresholds (no prior audit / >60 days / >15 feature commits → full), and the post-`diff` "run a full audit now?" offer all remain. The thresholds become the **default pre-selection** the menu recommends (so the menu still carries the protocol's judgement — the PM just sees and can override it upfront). This feature **adds an upfront PM choice on a PM-initiated request**; it does not remove any auto-trigger.
4. **The menu shows even in autonomous mode for a PM-initiated request.** A PM-initiated analysis request is a product/cost fork the PM explicitly asked to own ("продуктовые решения со мной"), so the menu is shown regardless of authority mode. The **non-PM-initiated** path (the system's own retrospective nudge / auto-scope) keeps its autonomous announce-and-proceed behavior — only a *PM-initiated* analysis request triggers the upfront menu.

## Existing behaviors this feature touches

(from `.claude/commands/pm-audit.md` — what must not break)

- `## Auto-scope decision` — the threshold logic (first audit / >60 days / >15 commits → full; else diff) stays as the **judgement** behind the menu's default pick; it is not deleted, it is surfaced.
- `## PM-facing flow` — the existing post-`diff` "run a full audit now?" `AskUserQuestion` offer stays as the safety net when a Quick audit was run; it must not double-prompt when the upfront menu already chose Full.
- `## Technical quality` — the smell/hygiene sweep, its proportional new-code-gating, depth selection, engine selection (per the just-built `review-engine-selection`), and findings→triage are all unchanged; the menu only decides whether Full (which includes the sweep) runs.
- The retrospective nudge in `/pm-plan` (5+ features) — untouched.

## Contracts

(no Product Contract — this repo has no user-facing contracts by design; the change is a PM-facing procedure-UX refinement to `/pm-audit`.)

## Stack expectations touched

(none — this is a Markdown procedure-flow change in `.claude/commands/pm-audit.md`; no library / format / external-system idiom is touched. The `AskUserQuestion`-vs-prose convention it uses is a `WORKFLOW.md` PM-comms rule, not a stack component.)

## Interaction scenarios

Provably isolated: the change is to the PM-facing decision flow of a single command procedure (`pm-audit.md`). No shared mutable state, no concurrency, no I/O — it changes *when a question is asked*, not what the audit/sweep machinery does. The one interaction with adjacent flow is stated as scenario 3 (must not double-prompt: the upfront Full choice suppresses the redundant post-diff "run full?" offer) — covered editorially in the procedure text.

## Test plan

- Existing tests that must pass: all of `tests/hooks.sh` (untouched — this feature changes no hook).
- New tests: **none** — this is a Markdown PM-facing procedure-flow change in a markdown-prose repo with no runtime/linter to host an automated test for "which question is asked when" (the same documented boundary the engine-selection prose half recorded). Verification is editorial: Pass-1 plan-compliance (the procedure text implements scenarios 1–4 and does not double-prompt) + Pass-2 `code-review` over the diff + validation-by-use. No hook / behavior is testable by `tests/hooks.sh`.

## Docs to update

- `doc/architecture.md`: a short addition to the existing review-dimensions / `--scope` decision record — note that a **PM-initiated** analysis request now surfaces an upfront scope (+ review depth) menu rather than auto-deciding-and-announcing; the threshold logic becomes the menu's recommended default. Authored by `pm-architect` post-coding.
- `.claude/commands/pm-audit.md`: the actual procedure change (scenarios 1–4) — `## Auto-scope decision` + `## PM-facing flow`. This is protocol source (the deliverable), authored by `pm-coder`.

(README not touched — it carries no audit-scope-flow description; README-currency trigger does not fire.)

## Out of scope

- **The auto-scope threshold values** (60 days / 15 commits / 5-feature nudge) — unchanged; this feature surfaces them as the menu default, it does not retune them.
- **The quality-sweep machinery** (proportional gating, engine selection, depth mechanics, findings triage) — owned by the shipped smell/hygiene slice + `review-engine-selection`; this feature only decides whether the sweep runs (via Full), not how.
- **A new `/analysis` or `/review` slash command** — explicitly rejected; "анализ проекта" is an intent the orchestrator routes to `/pm-audit`, not a new command (a new command would register a phantom slash command and fragment the single audit entry point).
- **Changing autonomous-mode behavior for system-initiated audits** — the auto-nudge / retrospective path keeps announce-and-proceed; only a PM-initiated analysis request gets the menu.
