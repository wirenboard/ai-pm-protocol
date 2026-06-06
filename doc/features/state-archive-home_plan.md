# state-archive-home — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "State-archive (post-ship bookkeeping) has no rule-compliant committed home" (2026-06-04).

## Scenarios

1. **State archive is committed on the feature branch, never stranded post-merge.** Before calling `pm-pr-prep`, the orchestrator archives `.ai-pm/state/current.md` to `.ai-pm/state/archive/<topic>-<date>.md`, resets `current.md` to `Status: idle`, and commits both on the feature branch. The archive therefore lands in the same PR as the feature it describes. This closes the gap: there is no longer a routine post-merge artifact with no rule-compliant commit surface.

2. **`workflow/pipeline.md` Step 6 names the archive step explicitly.** The step "Ship" gains an explicit bullet: archive-then-commit before `pm-pr-prep` runs. The "after merge: `git checkout main && git pull`" line is unchanged.

3. **`workflow/state.md` § "How state is kept" states the commit-point.** The one-sentence description of archiving gains a commit-point clause: "the archive is committed on the feature branch as the final step before `pm-pr-prep`, so it merges with the feature it describes."

## Existing behaviors this feature touches

- `workflow/pipeline.md` Step 6 (Ship) — gains an archive bullet before `pm-pr-prep`. The A/B/C ship gate, the `pm-pr-prep` step, and the post-merge `git checkout main && git pull` are unchanged.
- `workflow/state.md` § "How state is kept" — the archiving sentence gains the commit-point clause. The rest of the state-keeping rules are unchanged.

## Contracts

(No Product Contract — protocol orchestration rule; not user-facing product behavior. No human-role subject.)

## Stack expectations touched

(None — Markdown prose additions to two protocol files. No library, format, or external-system idiom touched.)

## Interaction scenarios

Provably isolated: prose additions to `workflow/pipeline.md` + `workflow/state.md`. No shared mutable state, no concurrency, no I/O. No adjacent feature interference — the archive step is sequential, and it adds a commit before an existing sequential step (`pm-pr-prep`).

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: **none** — Markdown protocol-prose change in a markdown-prose repo with no runtime to host a test for "was the state archived on the correct branch." Verification is editorial: Pass-1 plan-compliance (two files updated, the commit-point described, the archive step named in Step 6) + Pass-2 `code-review` over the diff.

## Docs to update

- `doc/architecture.md`: a short decision record — "State-archive home: archive committed on the feature branch as the final pre-`pm-pr-prep` step, so it merges with the feature it describes; eliminates the post-merge stranded-archive gap." Authored by `pm-architect` post-coding.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change.)

## Key design decisions

- **Option 1 from backlog: archive on the feature branch, not as a carry-over onto the next branch.** Option 1 is derivable from canon: "never commit to `main`" + "state-keeping artifacts belong in git" + "the feature branch is the only rule-compliant commit surface during a feature's lifetime." Option 2 (carry-over onto the next branch) adds a cross-feature dependency and keeps the archive git-clean-losable until the next commit. Option 3 (commit directly to `main`) is explicitly rejected in the backlog as eroding the no-commit-to-main discipline. The cleanest home is the feature's own PR.
- **The archive step is before `pm-pr-prep`, not inside it.** `pm-pr-prep` owns version bump + CHANGELOG + push + PR creation. The state archive is an orchestrator step, not a pr-prep step. Keeping them separate preserves `pm-pr-prep`'s scope and lets the orchestrator commit the archive alongside any other last-minute artifacts (e.g. a code-review stamp fix) before handing off.
- **`workflow/pipeline.md` is the single home for the archive step; `workflow/state.md` is the single home for the state-keeping description.** A rule in both files is a reference-and-description split, not duplication: pipeline.md carries the *procedural step* (when to do it), state.md carries the *conceptual description* (what "archiving" means and where it lands).

## Out of scope

- **A hook or automated gate** — "did the orchestrator archive state before pr-prep?" is not mechanically detectable from a `PreToolUse` hook. Soft discipline only, consistent with the no-hook-for-semantic-judgement family.
- **Changing what goes into the archive** — the archive content is the current `.ai-pm/state/current.md`; its format and content are unchanged by this feature.
- **Agent-handoff durability** — a separate backlog item ("agent flushing analysis to disk on stop"); distinct problem and distinct home. Not folded here.
- **Repo-transfer hold** — the current hold on push/PR/merge is an operational constraint, not changed by this feature.
