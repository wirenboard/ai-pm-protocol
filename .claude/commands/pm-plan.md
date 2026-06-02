# Plan a feature

Create `docs/features/<topic>_plan.md` for a feature, fix, or non-trivial change.

## Agent dispatch

All agents below are project agents — use the Agent tool with the exact `subagent_type` shown.

| Agent | subagent_type |
|---|---|
| pm-architect | `"pm-architect"` |
| pm-legacy-reader | `"pm-legacy-reader"` |
| pm-stack-researcher | `"pm-stack-researcher"` |
| pm-coder | `"pm-coder"` |
| pm-plan-checker | `"pm-plan-checker"` |

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
- `.ai-pm/backlog.md` — if it exists, match items against the feature topic: same module, same user journey, same data model, or same area of code

If matching backlog items exist, surface only those to PM before planning:
> "There are [N] backlog items in this area: [list in plain language]. Want to fold any of them into this feature?"

PM decides. Never include backlog items without explicit PM approval. Don't surface unrelated backlog items — only topically matching ones.

Questions emerge from this context. Don't ask generic questions.

## Check and fill documentation gaps

While reading docs/, identify whether this feature touches areas that are incomplete or missing.

Three cases — handle each differently:

**1. Documentation missing or marked `[?]`** — do not write to `docs/` directly. Spawn the owning agent with a focused prompt: `pm-architect` (`subagent_type: "pm-architect"`) for gaps in `docs/architecture.md`, `pm-legacy-reader` (`subagent_type: "pm-legacy-reader"`) for gaps in `docs/user-journeys.md`. Wait for the agent to complete before writing the plan.

**2. Documentation exists but incomplete** — same: spawn the owning agent with a focused prompt to fill the missing section. Do not rewrite what's already there.

**3. Documentation exists and contradicts what the plan would need** — do not touch the docs. Stop and surface to PM:
> "The existing docs say X, but this feature would require Y. This is a product decision — should the behavior change, or should the feature stay within what's documented?"

PM decides. Then plan accordingly.

Also flag anything this feature makes outdated:
- Does this feature change an existing user journey? → note the update needed in `docs/user-journeys.md`
- Does this feature add a new architectural constraint or decision? → note the update needed in `docs/architecture.md`

Include any doc updates as explicit steps in the plan — coder does not touch docs. After pm-coder finishes and before spawning pm-plan-checker: if the plan's "Docs to update" section names `docs/architecture.md` — spawn `pm-architect` (`subagent_type: "pm-architect"`) with a focused prompt to update that section; if it names `docs/user-journeys.md` — spawn `pm-legacy-reader` (`subagent_type: "pm-legacy-reader"`) standalone with a focused prompt. This satisfies DoD item 8 before the review loop runs.

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
- **Component missing or stale** (no entry, or entry older than 6 months without re-review) → spawn `pm-stack-researcher` (`subagent_type: "pm-stack-researcher"`) for that component **before** continuing planning. Wait for it to extend `stack-notes.md`. Take its "New validators" list — add to the plan's "Docs to update" section as `CLAUDE.md` Pipeline extension.

Never plan against a missing or stale stack-notes entry. This is not a PM question — PM never sees this step. If a researcher run takes time, tell PM one sentence ("checking stack docs before planning, one moment") and continue.

**Deployment path trigger (mandatory when applicable).** If the plan touches any of: deployment paths, packaging, system-level config file placement, service unit target directories, container image paths, or partition-specific locations on an embedded/opinionated platform — before writing any path in the plan, explicitly check `docs/stack-notes.md` for a "Platform filesystem layout" section (or equivalent) that documents which paths survive system resets, firmware flashes, or OS upgrades.

- **Section present and covers the path in question** → cite the rule in the plan's "Stack expectations touched" section. If the platform rule constrains the path, the plan must use the correct path, not the convenient one.
- **Section missing or does not cover the specific constraint** → this is not a PM question. Spawn `pm-stack-researcher` (`subagent_type: "pm-stack-researcher"`) to document the platform filesystem layout before continuing. If `pm-stack-researcher` cannot resolve it (platform-specific knowledge requiring human input), add as **the first task in the plan**:
  > `[ ] Document <platform> partition layout and path survival rules in docs/stack-notes.md before implementing any file placement`

  Never write a path placement into a plan without a platform-level reference in stack-notes.

## Interaction scenario check (mandatory before drafting)

Before writing the plan, identify shared state and external events that can occur concurrently with this feature. Check `docs/user-journeys.md` and adjacent plans in `docs/features/` for features that share state with what you're planning: same connection objects, same topic subscriptions, same device state, same in-memory data structures, same timers or polling loops.

For each intersection, write one interaction scenario in the plan's **Interaction scenarios** section.

A feature is **not** provably isolated if it touches any of:
- Shared mutable state (objects or data accessible from multiple code paths)
- Asynchronous operations (callbacks, event handlers, message queues, pub/sub)
- External I/O (network, filesystem, database, hardware interfaces)
- Timers, polling loops, or scheduled operations
- Events or signals that can arrive during an ongoing operation

If the feature is provably isolated — no shared state, no concurrent operations, no adjacent feature interference — state this explicitly as `Provably isolated: <reason>` and omit the section.

## Planning conversation

Ask clarifying questions as needed — grounded in what you read. Typical questions:

- What behavior changes from the user's perspective?
- What should NOT change? (look at user-journeys.md for adjacent scenarios)
- Any edge cases? (empty state, errors, concurrent access)
- Is there an existing pattern in the codebase this should follow?

**Before every PM question — product vs technical check.** PM is product, not technical (the same split that governs reviewer notes in `WORKFLOW.md`). Apply it to every clarifying question:

- **Product trade-offs** (what the user experiences, scope between user-visible alternatives, deferral between user-facing features) — surface to PM. Examples: "single install command vs split installs", "real-time vs batch update", "one feature this iteration vs both".
- **Technical detail** (file layout, naming, internal type choices, library API specifics, unit file shape, regex form, sysd vs supervisord, port numbers) — orchestrator decides. Asking the PM about these is a category-error that wastes their attention and produces low-quality answers.

Before forming an AskUserQuestion, write down the question and check: *would a non-technical PM be able to give a meaningful answer based on product knowledge alone?* If no — drop the question, decide yourself, document the decision in the plan's Key design decisions section. If you're framing technical options as "PM chooses between systemd / Docker / k8s", you are asking the wrong question — re-frame to the product trade-off those technical options serve ("integrator experience: single canonical install or component-by-component setup?"), then map technical options back to whichever product direction the PM picks.

Stop asking when you have enough to write the plan.

**Research trigger (optional):** If the feature area might benefit from existing libraries or established patterns (e.g., new protocol integration, new data format, new external service) — suggest `/pm-research` before planning: "Worth searching for existing solutions for X? Takes 5 minutes and could save a week of development." PM decides.

## Hotfix mode

When the topic is `hotfix-<area>` (set by the orchestrator following the production incident flow in WORKFLOW.md), add this section to the plan immediately after `## Scenarios`:

```markdown
## Incident facts
- What is broken: <symptom visible to user>
- Evidence: <log excerpts, error codes, reproduction steps from read-only diagnostics>
- Scope: <affected users, services, or scenarios>
```

Everything else follows the normal plan format. The Incident facts section is the only difference. Treat it as a required section — pm-plan-checker blocks on missing Incident facts for hotfix-* plans.

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

## Interaction scenarios
(omit only when provably isolated — state why; required if feature touches network I/O, connection state, or shared device state)
- When <this feature's operation> happens while <concurrent event or adjacent feature state>: <expected outcome>
- When <external event X> occurs during <this feature's flow>: <expected outcome>

## Test plan
- Existing tests that must pass: <list or "all existing tests">
- New tests:
  - `<test name>`: <one sentence — what scenario this verifies, given/when/then>
  - `<test name>`: <what scenario>
- Interaction scenario tests (one per Interaction scenario above):
  - `<test name>`: sets up <concurrent/post-condition state>, verifies <expected outcome>
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

**Interaction scenario test rule:** each interaction scenario requires a test that sets up the concurrent or post-condition state and verifies the expected outcome. Omitting a test for an interaction scenario is the same protocol violation as omitting a test for a regular scenario. `pm-plan-checker` will block on missing interaction scenario tests.

**Stack-spec test rule:** for every entry in "Stack expectations touched", at least one test must verify behavior against the cited rule, not against the coder's own mapping. Self-consistent property-based tests (e.g., round-trip over the coder's own range) do not count — they can freeze a spec violation as a contract. Stack-spec tests must reference the source URL in a comment.

**"Stack expectations touched" rule:** if the feature touches any stack component listed in `docs/stack-notes.md` and the plan omits this section — plan is incomplete. `pm-plan-checker` will block on missing section.

## Retrospective check

Count `feat:` and `fix:` commits since the most recent `.ai-pm/audits/audit-*.md` (check file listing by date). If `.ai-pm/audits/` does not exist — count all features since project start.

If **5 or more** features have accumulated since the last audit:
> "We've completed N features since the last protocol check. Worth a quick audit before we continue — takes a few minutes. Run now?"

If PM says yes → run `/pm-audit` before proceeding with this feature.
If PM says no or later → continue with this feature.

If **no audit has ever been run** (.ai-pm/audits/ empty or missing):
> "This project hasn't had a protocol check yet. Want to run one before we plan this feature? It verifies that all previous work is properly documented."

**Pending-migration nudge.** If the project shows an un-migrated template structure (per `### Pending-migration detection` in `pm-bootstrap.md` — a lingering `docs/features/_index.md`, or a generated `docs/product.md` with the frozen signature line and no `docs/product-map.md`), surface it before new work:
> "This project is on an older template structure — `docs/product-map.md` hasn't been generated yet. Worth running the pending `/pm-bootstrap` migration first so we plan against the current format. Run the migration now?"

If PM says yes → run the pending `/pm-bootstrap` migration before proceeding with this feature.

Don't implement fixes, don't block planning. PM decides.

## Architect check

After PM approves the plan, check architect criteria before handing off to coder:

- Does the change add a new axis of extension (new entity type, new event kind, new handler of a kind already treated as a category in the codebase)?
- Are there multiple plausible homes for the new logic in existing abstractions?
- Does the plan contain a structural choice about internal layout rather than public API?

If **yes to any** — suggest to PM: "This plan has a structural choice about where the new code lives. I can run an architecture review (5-10 min) to map the options and risks before coding starts. Worth doing?"

If PM says yes — invoke `pm-architect` (`subagent_type: "pm-architect"`) with the plan, then hand off to coder with both plan and arch notes.
If PM says no — hand off to coder with plan only.
If **none apply** — hand off to coder directly without mentioning architect.

## Handoff

Show the draft to PM. Iterate until PM says ok.

Save to `docs/features/<topic>_plan.md`.

**Update the product map.** Regenerate `docs/product-map.md` using the **Product map generation procedure** in `pm-bootstrap.md`. This procedure writes only `docs/product-map.md`; it never creates or edits the authored `docs/product.md` (that front door is owned by `pm-architect`). The map is generated from the source files (contracts + plans + reviews + git), not hand-filled:

- On plan creation: if this feature creates a contract, that contract appears under its component as soon as the contract file exists. A backend-only feature (no contract) will surface in the `## Infrastructure (no user-facing contract)` bucket once approved.
- If `docs/product-map.md` doesn't exist — create it via the same procedure.

After `pm-plan-checker` returns `Verdict: approve`:

1. **Append the feature to its contract's Built/changed by list** — in `.ai-pm/contracts/<name>.md` add `- [<topic>](../../docs/features/<topic>_plan.md)`. Skip for a backend-only feature with no contract (it surfaces in the Infrastructure bucket instead).
2. **Regenerate `docs/product-map.md`** via the Product map generation procedure — the feature now appears under its contract (or Infrastructure) with its Done date and review link. This writes only `docs/product-map.md`; it never touches the authored `docs/product.md`.

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

If yes and the feature does not yet have a contract: draft `.ai-pm/contracts/<feature>.md` from the template at `.ai-pm/tooling/doc/_templates/contract.md.tmpl` based on the plan's Scenarios (Must work) and "Existing behaviors this feature touches" (Must not break) and Test plan (Acceptance checks). Show the draft to PM for one-pass validation, then save.

If yes and the contract exists: surface it to PM ("this touches contract X — Must work / Must not break items will be re-verified by reviewer").

If no (backend-only): skip silently; note "no contract — change is backend-only" in the plan handoff message.

Tell PM the plan is saved, state is initialized, and run architect check above.

## What the plan does NOT include

- File paths where code will live — that is the coder's decision
- Private function names, internal helpers
- Step-by-step implementation guidance
