# Plan a feature

Create `docs/features/<topic>_plan.md` for a feature, fix, or non-trivial change.

This skill runs in the main session — planning is a conversation with the PM, not an autonomous agent task.

## Before asking anything

Read these first:
- `CLAUDE.md` — architecture constraints, security constraints
- `docs/architecture.md` — stack, decisions, constraints
- `docs/user-journeys.md` — existing scenarios (identifies regression risk)
- `docs/features/` — existing plans (context for what's already built)
- `docs/backlog.md` — if it exists, match items against the feature topic: same module, same user journey, same data model, or same area of code

If matching backlog items exist, surface only those to PM before planning:
> "There are [N] backlog items in this area: [list in plain language]. Want to fold any of them into this feature?"

PM decides. Never include backlog items without explicit PM approval. Don't surface unrelated backlog items — only topically matching ones.

Questions emerge from this context. Don't ask generic questions.

## Check and fill documentation gaps

While reading docs/, identify whether this feature touches areas that are incomplete or missing.

Three cases — handle each differently:

**1. Documentation missing or marked `[?]`** — read the relevant code yourself, write what you find into `docs/architecture.md` or `docs/user-journeys.md`. Facts only, no interpretation. Do this before writing the plan.

**2. Documentation exists but incomplete** — supplement with what's missing from code. Do not rewrite what's already there.

**3. Documentation exists and contradicts what the plan would need** — do not touch the docs. Stop and surface to PM:
> "The existing docs say X, but this feature would require Y. This is a product decision — should the behavior change, or should the feature stay within what's documented?"

PM decides. Then plan accordingly.

Also flag anything this feature makes outdated:
- Does this feature change an existing user journey? → note the update needed in `docs/user-journeys.md`
- Does this feature add a new architectural constraint or decision? → note the update needed in `docs/architecture.md`

Include any doc updates as explicit steps in the plan — coder does not touch docs.

## Planning conversation

Ask clarifying questions as needed — grounded in what you read. Typical questions:

- What behavior changes from the user's perspective?
- What should NOT change? (look at user-journeys.md for adjacent scenarios)
- Any edge cases? (empty state, errors, concurrent access)
- Is there an existing pattern in the codebase this should follow?

Stop asking when you have enough to write the plan.

**Research trigger (optional):** If the feature area might benefit from existing libraries or established patterns (e.g., new protocol integration, new data format, new external service) — suggest `/research` before planning: "Worth searching for existing solutions for X? Takes 5 minutes and could save a week of development." PM decides.

## Plan format

```markdown
# <Topic> — plan

## Scenarios
1. <user-visible behavior after this change>
2. ...

## Existing behaviors this feature touches
(from user-journeys.md — what must not break)
- <journey or behavior>
- ...

## Contracts
(new or changed APIs, data shapes, config keys — omit section if none)
- `<name>(args) → return` — what it does, error modes

## Test plan
- Existing tests that must pass: <list or "all existing tests">
- New tests:
  - `<test name>`: <one sentence — what scenario this verifies, given/when/then>
  - `<test name>`: <what scenario>

## Docs to update
(omit if none)
- `docs/user-journeys.md`: <what changes — which journey, how>
- `docs/architecture.md`: <what new constraint or decision to add>

## Out of scope
- <explicitly what this plan does NOT touch>
```

**Test plan rule:** each new test must have a one-sentence behavior description — what scenario it verifies (given/when/then style). Not just a file name. This is what reviewer and coder use to write and verify the test.

## Retrospective check

Count the number of files in `docs/features/`. If 5 or more have been added since the last time architecture.md was meaningfully updated (check git log on that file), suggest to PM:

> "We've built N features. It might be worth a quick architectural retrospective — reviewing whether the codebase still matches architecture.md and whether any patterns have drifted. Do you want to do that now or after this feature?"

If PM says now:
1. Read the current codebase top-level structure and compare to `docs/architecture.md`.
2. Report gaps: decisions that changed, patterns that drifted, constraints that are no longer accurate.
3. Save findings to `docs/retro-<YYYY-MM-DD>.md`.
4. Ask PM which gaps to fix: update `docs/architecture.md` to match reality, or file a plan to bring code back in line. Don't implement fixes — just report and let PM decide.

Don't implement fixes, just report.

## Architect check

After PM approves the plan, check architect criteria before handing off to coder:

- Does the change add a new axis of extension (new device type, new event kind, new protocol handler alongside existing ones)?
- Are there multiple plausible homes for the new logic in existing abstractions?
- Does the plan contain a structural choice about internal layout rather than public API?

If **yes to any** — suggest to PM: "This plan has a structural choice about where the new code lives. I can run an architecture review (5-10 min) to map the options and risks before coding starts. Worth doing?"

If PM says yes — invoke `architect` agent with the plan, then hand off to coder with both plan and arch notes.
If PM says no — hand off to coder with plan only.
If **none apply** — hand off to coder directly without mentioning architect.

## Handoff

Show the draft to PM. Iterate until PM says ok.

Save to `docs/features/<topic>_plan.md`.

Tell PM the plan is saved and run architect check above.

## What the plan does NOT include

- File paths where code will live — that is the coder's decision
- Private function names, internal helpers
- Step-by-step implementation guidance
