# Plan a feature

Create `docs/features/<topic>_plan.md` for a feature, fix, or non-trivial change.

This skill runs in the main session — planning is a conversation with the PM, not an autonomous agent task.

## Before asking anything

Read these first:
- `.ai-pm/state/current.md` — current task state; if `Status` is anything other than `idle` or `done`, an active task exists; surface to PM ("we are in the middle of <task> — finish that first, or pause and start this new one?")
- `CLAUDE.md` — architecture constraints, security constraints
- `docs/architecture.md` — stack, decisions, constraints
- `docs/stack-notes.md` — stack idioms, constraints, validators, integration contracts (mandatory; see "Stack component check" below)
- `docs/user-journeys.md` — existing scenarios (identifies regression risk)
- `.ai-pm/contracts/` — existing Product Contracts; identifies which features the new work might touch
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

## Categorical scope check (mandatory, surfaces a product question to PM)

Before drafting the plan, scan the feature description for **categorical words** — any noun that names a kind, type, mode, role, state, operation, category, tier, level, or other element of a classification.

For each categorical word, ask one question:

> **Is this the full set, or one element of a set?**

If it is **one element** — the feature is implicitly choosing one and ignoring the rest. That choice belongs to the PM, not to the agent. Before going further:

1. List the sibling elements visible in the project's existing context (`docs/architecture.md`, `docs/user-journeys.md`, `docs/stack-notes.md`, prior features in `docs/features/`).
2. Surface the choice to PM as a product question in plain language:
   > "Your feature mentions <element>. In your system, that is one of <siblings>. Do you want this feature to cover all of them, or focus on <element> with siblings handled separately later?"
3. PM decides. Two valid outcomes:
   - **All of them** → plan covers the full set, scenarios and tests span all siblings.
   - **One element** → plan covers only the chosen element, and the **Out of scope** section explicitly lists each sibling with one line on why it is separate (e.g., "different downstream behavior, will be its own plan").

Never silently widen the chosen element's semantics to cover sibling cases at implementation time — that is what the coder rule forbids. The scope decision belongs in the plan.

If the feature description has no categorical words — skip this step.

## Stack component check (mandatory, no PM questions)

Before drafting the plan, identify which stack components this feature touches. A component touch is any of:
- writing or changing code that uses a library / framework / runtime API
- producing or modifying an artifact consumed by an external system (schema, manifest, unit file, config file)
- speaking to an external protocol or standard (any wire protocol, RPC contract, public API standard)
- changing how the project is built, packaged, or deployed

For each touched component, check `docs/stack-notes.md`:

- **Component already present** with current `Last reviewed` date → read the section, plan must respect its idioms and constraints.
- **Component missing or stale** (no entry, or entry older than 6 months without re-review) → spawn `stack-researcher` for that component **before** continuing planning. Wait for it to extend `stack-notes.md`. Take its "New validators" list — add to the plan's "Docs to update" section as `CLAUDE.md` Pipeline extension.

Never plan against a missing or stale stack-notes entry. This is not a PM question — PM never sees this step. If a researcher run takes time, tell PM one sentence ("checking stack docs before planning, one moment") and continue.

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

## Stack expectations touched
(from docs/stack-notes.md — what stack-level rules this feature must respect)
- **<component>**: <quoted rule from stack-notes>. Source: <URL>
- **<component>**: <quoted constraint>. Source: <URL>
- **<integration>**: artifact `<path>` delivered via `<mechanism>`, validated by `<command>`

## Test plan
- Existing tests that must pass: <list or "all existing tests">
- New tests:
  - `<test name>`: <one sentence — what scenario this verifies, given/when/then>
  - `<test name>`: <what scenario>
- Stack-spec tests (one per stack expectation above):
  - `<test name>`: verifies the code respects "<rule from stack-notes>" — not just self-consistent mapping

## Docs to update
(omit if none)
- `docs/user-journeys.md`: <what changes — which journey, how>
- `docs/architecture.md`: <what new constraint or decision to add>
- `CLAUDE.md` Pipeline section: add `<validator command>` (if stack-researcher discovered a new validator for this feature's components)

## Out of scope
- <explicitly what this plan does NOT touch>
- **Sibling elements of categorical choices** — for every categorical element the plan focuses on (a chosen type, mode, role, state, operation), list each sibling that was considered and excluded, with one line on why it is a separate plan
```

**Test plan rule:** each new test must have a one-sentence behavior description — what scenario it verifies (given/when/then style). Not just a file name. This is what reviewer and coder use to write and verify the test.

**Stack-spec test rule:** for every entry in "Stack expectations touched", at least one test must verify behavior against the cited rule, not against the coder's own mapping. Self-consistent property-based tests (e.g., round-trip over the coder's own range) do not count — they can freeze a spec violation as a contract. Stack-spec tests must reference the source URL in a comment.

**"Stack expectations touched" rule:** if the feature touches any stack component listed in `docs/stack-notes.md` and the plan omits this section — plan is incomplete. Reviewer dim 1 will block on missing section.

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

**Initialize Execution State.** Update `.ai-pm/state/current.md`:
- `Task`: <one-sentence plan summary>
- `Status`: `planning` → `coding` (after handoff)
- `Done`: <list any items completed during planning>
- `Remaining`: <list of next concrete steps>
- `Touched files`: <will be filled by coder>
- `Next step`: hand off to architect (if check below applies) or coder
- `Validation`: <will be set per plan's Test plan>

**Product Contract check.** Ask PM one product question (only when the plan touches user-visible behavior):
> "Does this change what the user sees or can do? If yes — which feature is the contract for (existing or new)?"

If yes and the feature does not yet have a contract: draft `.ai-pm/contracts/<feature>.md` from the template based on the plan's Scenarios (Must work) and "Existing behaviors this feature touches" (Must not break) and Test plan (Acceptance checks). Show the draft to PM for one-pass validation, then save.

If yes and the contract exists: surface it to PM ("this touches contract X — Must work / Must not break items will be re-verified by reviewer").

If no (backend-only): skip silently; note "no contract — change is backend-only" in the plan handoff message.

Tell PM the plan is saved, state is initialized, and run architect check above.

## What the plan does NOT include

- File paths where code will live — that is the coder's decision
- Private function names, internal helpers
- Step-by-step implementation guidance
