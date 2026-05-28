# Plan a feature

Create `docs/features/<topic>_plan.md` for a feature, fix, or non-trivial change.

This skill runs in the main session — planning is a conversation with the PM, not an autonomous agent task.

## Before asking anything

Read these first:
- `CLAUDE.md` — architecture constraints, security constraints
- `docs/architecture.md` — stack, decisions, constraints
- `docs/user-journeys.md` — existing scenarios (identifies regression risk)
- `docs/features/` — existing plans (context for what's already built)

Questions emerge from this context. Don't ask generic questions.

## Check for stale docs

While reading docs/, flag anything this new feature would make outdated:
- Does this feature change an existing user journey? → user-journeys.md needs updating
- Does this feature add a new architectural constraint or decision? → architecture.md needs updating

If yes — include doc updates as explicit steps in the plan. The coder delivers them alongside the feature. Docs are not updated after the fact.

## Planning conversation

Ask clarifying questions as needed — grounded in what you read. Typical questions:

- What behavior changes from the user's perspective?
- What should NOT change? (look at user-journeys.md for adjacent scenarios)
- Any edge cases? (empty state, errors, concurrent access)
- Is there an existing pattern in the codebase this should follow?

Stop asking when you have enough to write the plan.

**Research trigger (optional):** If the feature area might benefit from existing libraries or established patterns (e.g., new protocol integration, new data format, new external service) — suggest `/research` before planning: "Есть ли смысл поискать готовые решения для X? Это займёт 5 минут и может сэкономить неделю разработки." PM decides.

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

If PM says now — read the current codebase top-level structure and compare to architecture.md. Report gaps. Don't implement fixes, just report.

## Handoff

Show the draft to PM. Iterate until PM says ok.

Save to `docs/features/<topic>_plan.md`.

Tell PM the plan is saved and ask if they want to proceed to implementation.

## What the plan does NOT include

- File paths where code will live — that is the coder's decision
- Private function names, internal helpers
- Step-by-step implementation guidance
