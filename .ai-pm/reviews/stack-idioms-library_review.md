## Plan compliance

- ✓ Scenario 1 — `pm-stack-researcher` seeds from the library — implemented at `.claude/agents/pm-stack-researcher.md` line 46: "Seed from the library (read BEFORE researching new idioms)" sub-bullet instructs the researcher to check `doc/_templates/stack-idioms/<stack>.md` before researching new idioms and include the library's entries as the starting set. Verified as editorial test (markdown-prose repo; no automated test applicable — consistent with `cross-model-review`, `integration-risk-spike-gate`, and `diagnostic-flow-discipline` precedents). `tests/hooks.sh` 73/73 pass.
- ✓ Scenario 2 — `pm-stack-researcher` emits a contribute-up recommendation — implemented at `.claude/agents/pm-stack-researcher.md` line 47: "Contribute-up recommendation (emit AFTER documenting new idioms)" sub-bullet instructs the researcher to annotate first-occurrence entries with `[first occurrence — not yet promoted to library]` and emit "Contribute-up candidate" recommendations for idioms recurring across ≥2 projects. Recurrence gate (≥2 projects) documented. Researcher-never-writes-to-library constraint stated ("The orchestrator decides whether to contribute; the researcher never writes to `doc/_templates/stack-idioms/` directly."). Verified editorially.
- ✓ Scenario 3 — `python.md` seed validates the schema end-to-end — implemented at `doc/_templates/stack-idioms/python.md`. Three entries present: `exception-crosses-module-boundary`, `dict-subscript-vs-get`, `pin-lower-version-bound`. Each entry carries all required schema fields: Edge case covered → Deviation = bug → Semgrep rule YAML → Linter encoding (if applicable) → Source → Contributed by. File header instructs downstream `pm-stack-researcher` to read it load-on-demand (not @-imported) and include entries as starting set. Verified editorially.
- ✓ Scenario 4 — Orchestrator contributes a new library entry on PM approval — implemented by the contribute-up constraint in `.claude/agents/pm-stack-researcher.md` line 47: the researcher recommends, the orchestrator decides and writes, the researcher never writes directly. This is a behavioral constraint on the orchestrator, not on code — editorial verification is the applicable method. The constraint is stated clearly and correctly.

## Definition of Done

- [x] All plan scenarios implemented and tested
- [x] Interaction scenarios have concurrent-state tests (plan declares "Provably isolated" — prose additions to `.claude/agents/pm-stack-researcher.md` and new template files; no shared mutable state, no concurrent operations, no I/O; no concurrent-state test required)
- [x] Stack expectations respected; stack-spec tests pass (`pm-stack-researcher.md` frontmatter block (`name`, `description`, `tools`) intact — `---` delimiters in place, YAML fields uncorrupted, body additions are below the closing `---`; `tests/hooks.sh` 73/73 — no hook touched, no `settings.json` change)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (plan declares "No Product Contract" — all scenario subjects are system actors: `pm-stack-researcher`, orchestrator, downstream projects; backend-discipline change only)
- [x] Pipeline green (`tests/hooks.sh` 73/73; no linter in this markdown-prose repo; editorial review passed)
- [x] State file updated (`.ai-pm/state/current.md` updated with plan, touched files, next step, validation note)
- [x] Product Impact Report present (when contract touched) — n/a; no Product Contract for this feature
- [x] Docs updates landed (`doc/architecture.md` decision record "Protocol-level stack-idioms library: two-tier executable standard" present at line 370, authored by `pm-architect`, with all required content: two-tier standard, library home, entry schema, seed-then-augment → contribute-up, recurrence gate, initial seed, Semgrep rationale; source citation includes plan, research doc, and commit `e87f851`)
- [x] Expected artifacts exist (plan at `doc/features/stack-idioms-library_plan.md`, this review at `.ai-pm/reviews/stack-idioms-library_review.md`, research at `.ai-pm/research/stack-idioms-library_research.md`; no Product Contract — not user-facing)
- [n/a] Product-readiness gate resolved (user-facing only — all scenario subjects are system actors; not user-facing; gate exempt)
- [n/a] Validation gate resolved (documentation-kind only — this repo is `software`-kind per `CLAUDE.md` "Project kind: software"; gate exempt)

**DoD: pass**

## Blocking

(none)

## Notes (product)

(none)

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See the "Edit-ownership rule" in `workflow/enforcement.md` — the Pass-2 code-review
     trail is the single carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Two minor findings (both fixed before stamp):

1. **dict-subscript-vs-get — overly broad scope not documented** (`doc/_templates/stack-idioms/python.md`): `$DICT[$KEY]` matches all Python subscript operations (lists, tuples, strings, custom objects), not only dicts. Without documentation, downstream teams would not know how to suppress false positives on range-safe sequences. **Fixed:** added "Scope note" paragraph after the YAML block explaining the broad scope and the `# nosemgrep: python.seam.dict-subscript-vs-get` suppression path.

2. **pin-lower-version-bound-bare — pattern matches comment lines** (`doc/_templates/stack-idioms/python.md`): bare `pattern: $PKG` matches every non-empty line in `requirements*.txt`, including `# comment`, `-r base.txt`, `--index-url` lines. Without exclusion, the rule produces false positives on all pip directive lines. **Fixed:** added `pattern-not-regex: '^(\s*#|\s*-|\s*$|--)'` to the rule YAML and a "Scope note" documenting residual edge cases (environment markers, editable installs).

## Code review: 2026-06-05 — passed
