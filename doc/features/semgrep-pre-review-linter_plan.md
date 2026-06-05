# semgrep-pre-review-linter — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; approved by PM 2026-06-05 ("Верно мыслишь. Делай") — delete local idioms library, add Semgrep community pre-check before AI code-review.

## Scenarios

1. **`doc/_templates/stack-idioms/python.md` and its directory are deleted.** The file and the `doc/_templates/stack-idioms/` directory are removed entirely. The protocol no longer maintains a project-local idioms library. Community Semgrep rulesets (`semgrep --config p/<lang>`) supersede the five hand-written rules the file contained.

2. **`pm-stack-researcher.md` loses the "Seed from the library" and "Contribute-up recommendation" sub-bullets.** Both items in the "For each component" section are removed. The researcher's scope returns to its core: canonical docs, validators, constraints, gotchas, integration contracts, linter-rule mapping. No library seeding, no contribute-up path.

3. **`workflow/pipeline.md` Step 5 Pass-2 gains a Semgrep pre-check step placed before AI `code-review`.** Before the existing `code-review` invocation, the orchestrator:
   - Detects the project's primary language from `docs/architecture.md ## Stack`.
   - If a community ruleset exists for that language, runs `semgrep --config p/<lang> --json <changed-files>` on the files touched by `git diff @{upstream}...HEAD --name-only`.
   - Appends Semgrep findings (formatted as findings) to `## Code review findings` in `.ai-pm/reviews/<topic>_review.md` before the AI review runs.
   - If Semgrep is not installed, the config download fails, or no community config is known for the detected language, skips silently and proceeds to AI review.
   - AI `code-review` runs regardless — the pre-check is additive. Combined findings flow to `pm-coder` as one artifact.

## Existing behaviors touched

- `doc/_templates/stack-idioms/python.md` + `doc/_templates/stack-idioms/` — deleted
- `.claude/agents/pm-stack-researcher.md` — two sub-bullets removed from the "For each component" list (items 2f "Seed from the library" and 2g "Contribute-up recommendation" in the current file)
- `workflow/pipeline.md` Step 5 Pass-2 — Semgrep pre-check step inserted before AI code-review

No hooks, no agents, no commands, no test files are touched.

## Contracts

(No Product Contract — reviewer tooling + library cleanup; not user-facing product behavior. No human-role subject.)

## Stack expectations touched

**Semgrep CLI** (new pipeline tool, Step 5 pre-check):
- Invocation: `semgrep --config p/<lang> --json <files>` — community ruleset downloaded at runtime.
- Requires: Semgrep installed (`pip install semgrep` or `brew install semgrep`) and internet access.
- Exit codes: 0 = success (with or without findings); non-zero = error. Findings in JSON stdout (`results` array).
- Silent-fallback rule: any non-zero exit or missing binary → skip, proceed to AI review.
- Community config shorthand `p/<lang>`: downloads the named ruleset from the Semgrep registry; `p/python`, `p/javascript`, `p/typescript`, `p/go`, `p/java` are well-known packs. Source: https://docs.semgrep.dev/getting-started/

`doc/stack-notes.md` currently has no Semgrep section — pm-coder adds it during implementation using the existing research at `.ai-pm/research/semgrep-syntax-docs_research.md` plus the Semgrep invocation docs above.

## Interaction scenarios

Provably isolated: Markdown protocol file updates with no shared mutable state, no async operations, no external I/O at plan/implementation time. No adjacent feature interference — the Semgrep pre-check is additive to the Pass-2 review pass; it does not change the AI review engine, the finding format, the `## Code review` stamp, or the `pm-pr-prep` gate.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: none — Markdown protocol change in a markdown-prose repo. Verification is editorial: Pass-1 plan compliance + Pass-2 `code-review` over the diff.

## Docs to update

- `doc/architecture.md` (pm-architect, post-coding):
  1. Update `### Protocol-level stack-idioms library` decision record: the local library is superseded by community Semgrep rulesets; record the design change and rationale.
  2. Update `### Comment-restraint + documentation-minimalism` decision record: remove the "Two new Semgrep library entries added to `doc/_templates/stack-idioms/python.md`" paragraph — those entries no longer exist.
  3. Add new decision record: Semgrep pre-review pipeline integration — community rules before AI review, combined findings, silent fallback.
- `doc/stack-notes.md` (pm-coder, during implementation): add a `### Semgrep` section documenting the `p/<lang>` community invocation idiom, exit-code contract, JSON output key (`results`), and the silent-fallback rule. Use existing research in `.ai-pm/research/semgrep-syntax-docs_research.md`.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change.)

## Key design decisions

- **Community rules over local library.** The local library had 5 rules; community Python pack has hundreds, maintained by security/quality experts, auto-updated. There is no point maintaining hand-written rules when the community ruleset is available online and qualitatively better.
- **Pre-review position (before AI).** Running Semgrep first filters deterministic mechanical issues cheaply. The AI review then focuses on semantic/architectural concerns. Sequencing: deterministic cheap → AI expensive.
- **Combined findings, single coder pass.** One review file, one pm-coder fix session. No separate Semgrep round followed by AI round — all findings arrive together.
- **Silent fallback.** Semgrep is optional tooling. The protocol degrades gracefully when Semgrep is not installed or network is unavailable. AI review always runs.
- **Language detection from `docs/architecture.md ## Stack`.** The project's declared language is the correct source — scanning file extensions would be noisier and inconsistent with how the protocol reads project context.
- **No project-local rules (deferred).** `.ai-pm/idioms/<lang>.semgrep.yaml` for project-specific overrides is a plausible future extension. Deferred — community rules are sufficient for initial value.

## Out of scope

- **Project-local Semgrep rules** (`.ai-pm/idioms/<lang>.semgrep.yaml`) — deferred.
- **Changing the bundled `code-review` skill** — the pre-check is an orchestrator step before the skill; the skill is unchanged.
- **`pm-stack-researcher` researching Semgrep config** — Semgrep is a pipeline tool used by the orchestrator, not a downstream-project stack component the researcher discovers.
- **Auto-generating idiom docs from community rules** — future possibility; deferred.
- **`CLAUDE.md.tmpl` `### Code conventions`** — the comment-restraint convention text there is unchanged; only the library entries that backed the Semgrep rules are removed.
