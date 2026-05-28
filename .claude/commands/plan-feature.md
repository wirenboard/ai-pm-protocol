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

## Planning conversation

Ask clarifying questions as needed — grounded in what you read. Typical questions:

- What behavior changes from the user's perspective?
- What should NOT change? (look at user-journeys.md for adjacent scenarios)
- Any edge cases? (empty state, errors, concurrent access)
- Is there an existing pattern in the codebase this should follow?

Stop asking when you have enough to write the plan.

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
- New tests to add: <list>

## Out of scope
- <explicitly what this plan does NOT touch>
```

## Handoff

Show the draft to PM. Iterate until PM says ok.

Save to `docs/features/<topic>_plan.md`.

Then tell the orchestrator: plan is ready, ready to implement.

## What the plan does NOT include

- File paths where code will live — that is the coder's decision
- Private function names, internal helpers
- Step-by-step implementation guidance
