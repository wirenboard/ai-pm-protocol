# audit-fixup-self-stack-notes — reviewer verdict

## Plan compliance

- Scenario 1 (file exists with exactly 6 component sections — jq, gh, git, GitHub Actions, Claude Code hooks API, Markdown frontmatter): satisfied. `doc/stack-notes.md:25,46,67,92,121,148` — six `###` headers, no more, no fewer.
- Scenario 2 (each component has all template-required fields — Role, Canonical docs, Spec/reference, Required validators, Idioms and constraints, Known gotchas, Last reviewed): satisfied. Field-count check: 7 required fields × 6 sections = 42 expected occurrences; the file has 42.
- Scenario 3 (downstream fixup plans can cite specific rules in their "Stack expectations touched"): satisfied — every positive rule, constraint, and gotcha line carries a `Source:` URL or is explicitly marked empirical, so future plans have stable anchors to cite.
- Test plan item "ровно 6 компонентов, не больше, не меньше": satisfied (categorical scope confirmed below).
- Test plan item "every rule / constraint / gotcha has a source URL": satisfied. 72 `Source:` URLs counted, plus 1 explicit `Source: empirical (...)` self-marker on the JSON-quoting gotcha in the Claude Code hooks section. Spot-check of 6 cited URLs (jq manual, gh env vars, git rev-parse, actions/checkout README, hooks reference, sub-agents reference) plus 3 issue-tracker gotchas (jq#3098, cli/cli#8845, github/docs#3001) all return passages that match the wording cited in the file.
- Test plan item "Validators wired into pipeline table is empty with explicit note": satisfied. The note explicitly says "The template does not currently wire any native stack validator into CI" and points candidates at the future `audit-fixup-hooks-tests` plan.
- Test plan item "Out-of-scope components do not appear in stack-notes": satisfied. Conventional Commits, Keep a Changelog, SemVer, Claude Code Agent API, and Bash do not appear as component sections. (Conventional commits is mentioned once in prose as something `pr-prep` parses, inside the git section's Role sentence — that is descriptive context for git's role, not a component section. Acceptable under the plan's categorical rule, which is about section presence, not prose mentions.)
- Test plan item "Integration contracts table": satisfied. One row for GitHub Releases ← `CHANGELOG.md` via `.github/workflows/auto-tag.yml`. Row matches the workflow at lines 30 (top-version grep), 47–53 (tag-if-missing), 72 (`gh release create`).

## Blocking

None.

## Notes (product)

1. `doc/stack-notes.md` overall scope. The artefact lands the six components the plan asked for. The plan's Out-of-scope list (Conventional Commits, Keep a Changelog, SemVer, Claude Code Agent API, Bash) is parked for later plans on an as-needed basis — that decision was made when the plan was approved, no new product input needed here. PM can revisit if a future fixup plan trips over a missing component entry.

## Notes (technical)

1. `doc/stack-notes.md:60` — the `gh auth status` exit-code gotcha says "issue still open at the time of writing". The cited issue (`cli/cli#8845`) is actually marked closed (fixed via PR #9240). The substantive point — "downstream code should not depend on the exit code as the sole signal" — still holds for older `gh` versions, but the open/closed parenthetical is stale. Routing: respawn `stack-researcher` to either drop the status parenthetical or replace it with "fixed in PR #9240, behaviour pre-fix still affects older gh releases".
2. `doc/stack-notes.md:141` and `:203` — the empirical-marker tally is slightly inconsistent with the researcher's summary. The summary reported "2 explicit empirical markers"; the file actually contains 1 `Source: empirical (...)` citation (line 141) plus 1 reference to the empirical convention in the closing "How to extend this document" section (line 203). The content satisfies the plan (every rule sourced, empirical claims explicitly flagged), but the researcher's count was off by one. Routing: drop on merge — count was descriptive in handoff text, not in the artefact itself; no fix needed in `doc/stack-notes.md`.
3. `doc/stack-notes.md:107` — the GitHub Actions `if:` implicit-`${{ }}` rule is phrased as a strong claim ("simple reference expressions work bare; anything with negation or a function-with-operators needs explicit `${{ }}`"), and is sourced to both the docs page and `github/docs#3001`. This is appropriate — the issue confirms the docs were corrected — but the prose still flags it with **bold treat-as** wording, which reads as researcher caution rather than fully settled docs. After PR #3362 landed, the documentation itself should now be the canonical source; the bold caveat is redundant. Routing: respawn `stack-researcher` to verify whether <https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions> now states the operator rule directly, and if so soften the bold caveat. Defer if WebFetch on the docs page shows the rule still implicit.

## Verdict

approve

This document creates the template's own stack reference: six component sections (jq, gh, git, GitHub Actions, Claude Code hooks, Markdown frontmatter), every rule and gotcha sourced to upstream docs or explicitly marked as observed-from-this-repo, and the integration-with-GitHub-Releases pathway documented. Spot-check of cited URLs found no misattribution. Three minor notes recorded; none block merge — they are tidy-ups the orchestrator can route back to the researcher in a follow-up pass or on merge.
