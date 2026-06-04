# Plan a feature

Create `docs/features/<topic>_plan.md` for a feature, fix, or non-trivial change.

## Agent dispatch

All agents below are project agents — use the Agent tool with the exact `subagent_type` shown.

| Agent | subagent_type |
|---|---|
| pm-architect | `"pm-architect"` |
| pm-codebase-reader | `"pm-codebase-reader"` |
| pm-stack-researcher | `"pm-stack-researcher"` |
| pm-product-advocate | `"pm-product-advocate"` |
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

**1. Documentation missing or marked `[?]`** — do not write to `docs/` directly. Spawn the owning agent with a focused prompt: `pm-architect` (`subagent_type: "pm-architect"`) for gaps in `docs/architecture.md` **or `docs/user-journeys.md`** (pm-architect owns both). Wait for the agent to complete before writing the plan.

**2. Documentation exists but incomplete** — same: spawn the owning agent with a focused prompt to fill the missing section. Do not rewrite what's already there.

**3. Documentation exists and contradicts what the plan would need** — do not touch the docs. Stop and surface to PM:
> "The existing docs say X, but this feature would require Y. This is a product decision — should the behavior change, or should the feature stay within what's documented?"

PM decides. Then plan accordingly.

Also flag anything this feature makes outdated:
- Does this feature change an existing user journey? → note the update needed in `docs/user-journeys.md`
- Does this feature add a new architectural constraint or decision? → note the update needed in `docs/architecture.md`

Include any doc updates as explicit steps in the plan — coder does not touch docs. After pm-coder finishes and before spawning pm-plan-checker: if the plan's "Docs to update" section names `docs/architecture.md`, `docs/user-journeys.md`, **or `docs/threat-model.md`** — spawn `pm-architect` (`subagent_type: "pm-architect"`) with a focused prompt to update that section (pm-architect owns all three). This satisfies DoD item 8 before the review loop runs.

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

## Security-surface check (mandatory, no PM questions)

Before drafting the plan, check whether this feature touches a security-relevant surface **and** the project is security-bearing:

- **Security-bearing project?** The project is security-bearing exactly when `docs/threat-model.md` is present. If absent → the project is non-security; this check is silent and you skip the rest of it.
- **Touches a security-relevant surface?** Check the feature against the single-source list — `### Security-relevant surfaces` in `WORKFLOW.md` (referenced by name; never re-list the items here).

If **both** hold: the plan **must** name `docs/threat-model.md` in its "Docs to update" section, with the relevant Threat rows to add or update. After pm-coder finishes, the orchestrator spawns `pm-architect` to update it — this rides the **same** "Docs to update" post-coding handoff already described above for `docs/architecture.md` (same owner, same trigger). `pm-plan-checker` blocks a security-touching plan on a security-bearing project that omits this. This is not a PM question — PM never sees this step.

## NFR / operational-limits check (conditional, judgment-triggered)

Before drafting the plan, judge whether this feature or its platform carries a **resource and scale budget** worth recording. The check fires when **either** of these holds — silent otherwise:

- **Scale-bearing feature?** The feature's core scales with a count the system must bound — devices / endpoints / connections / sessions / subscriptions / messages-per-second / queue depth. This is a judgement about *this* feature, re-made each plan against that concrete bounded-count list — not "any feature that touches more than one thing".
- **Resource-constrained platform?** The platform is resource-constrained — read the signal from the **two named sources only**: an embedded / limited-RAM / Docker-on-controller note in `docs/stack-notes.md`, or an "embedded / offline / must-fit-X" boundary in `docs/architecture.md` `## Architectural constraints`. This can fire for the **system's** budget (RAM, boot time, CPU headroom) even when the individual feature is not itself scale-bearing — **but only once, while the budget is unrecorded.** The platform property is static, so guard against re-asking every plan: if `docs/architecture.md` `## Operational limits & budgets` already carries a quantified budget (not `N/A` / `[?]`), the system budget is already captured — stay **silent** on the system-budget question and fire only for a *new* scale dimension this feature itself introduces. A still-`N/A` / `[?]` / absent budget on a resource-constrained platform is the one case the system-budget prompt is meant to fill.

The trigger is a **semantic judgement a regex cannot make** — so there is **no hook** and no mandatory plan section, exactly like the product-readiness gate. If **neither** holds — the check is **silent**, no budget question, like the Security-surface check on a non-security project (proportional, never blanket-mandatory on every tiny project).

When it fires, surface *"what is this feature's / the system's resource and scale budget?"* and route the answer to its audience-split home — never a new parallel document:

- **User-facing limits → the Product Contract `## Must not break`.** A limit the PM cares about — max devices / endpoints the product supports, throughput the user perceives — is a promise to the user, so it belongs in the feature's Product Contract `## Must not break` as a quantified invariant. This half is a **product question** for the PM, surfaced per the **product vs technical** rule below (what the product promises to support is product; the engineering number behind it is not).
- **Resource budgets → `docs/architecture.md` `## Operational limits & budgets`.** An engineering bound — RAM ceiling, boot-time budget, CPU headroom, system-level max-N — goes to the new conditional `## Operational limits & budgets` section in `docs/architecture.md` (referenced by name; never re-encode its content here). Name it in the plan's "Docs to update"; `pm-architect` authors/refreshes it on the post-coding "Docs to update" handoff, the **same** trigger as a decision record.

Record a budget the orchestrator cannot quantify without real platform knowledge as `[?]` for the PM to confirm — **never invent a number** (the same "never invent to fill" discipline `pm-architect` applies to the Behavioral contract). There is no hard gate this slice: the prompt degrades silently if the trigger is misjudged, and the homes make a recorded budget recoverable at the next refresh.

## State-model check (conditional, judgment-triggered)

Before drafting the plan, judge whether this feature's **core is a state machine or protocol** worth modeling. The check fires only when that judgement holds — silent otherwise. The trigger is a **concrete list**, re-judged each plan from the feature description — *not* "any feature with a status field":

- a **status ladder with defined transitions** (a status field whose values move between each other on events, not a flat label);
- a **named-state lifecycle plus the events that move between states** (`pairing → paired → active → lost`, with the triggers for each edge);
- a **wire / connection protocol with message or connection states** (handshake / session / link states and the transitions between them).

The trigger is a **semantic judgement a regex cannot make** — so there is **no hook** and no mandatory plan section, exactly like the NFR/operational-limits and product-readiness checks. If the feature's core is **not** a state machine / protocol — the check is **silent**, no state-model question, like the NFR check on a non-scale feature and the Security-surface check on a non-security project (proportional, never blanket-mandatory). A **status enum alone does not trigger it** — many projects carry a status field without their feature core being a lifecycle; an enum is the value set the model *references*, not what fires the check.

When it fires, surface *"what are this feature's states, the transitions between them, and the triggers / debounce that drive each edge?"* and route the answer to its home — never a new parallel document:

- **The model → `docs/architecture.md` `## State model`.** Record the captured machine in the new conditional `## State model` section in `docs/architecture.md` (referenced by name; never re-encode its content here) — a **states×transitions table + a triggers/debounce list**. The table **references** the status taxonomy in `## Behavioral contract` (the state *names* live there once, as the source of truth for which states exist — the State model never restates the enum) and **references the existing prose** (the paragraph-form "why" justification stays where it is — the State model never re-derives it). Its own new datum is the **transitions and their triggers** — the edges, which live nowhere else. **Reference the enum, add the edges, never re-declare a state.** Name the section in the plan's "Docs to update"; `pm-architect` authors/refreshes it on the post-coding "Docs to update" handoff, the **same** trigger as a decision record.

Record a transition / trigger / debounce the orchestrator cannot determine without real system knowledge as `[?]` for the PM to confirm — **never invent an edge** (the same "never invent to fill" discipline `pm-architect` applies to the Behavioral contract; never reverse-engineer the model from code). Like the NFR system-budget guard: once the `## State model` section captures the machine (a non-`N/A` / `[?]` table), stay **silent** on the already-modeled states and fire only for a feature that introduces a *new* state / transition / trigger not yet in the section. There is no hard gate this slice: the prompt degrades silently if the trigger is misjudged, and the home makes a recorded model recoverable at the next refresh.

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

Decision authority: autonomous | interactive   # OPTIONAL — omit unless overriding the project value

Source: <where this plan came from>   # the plan's provenance line (the plan-level provenance line defined by this feature in the plan format). When the feature was SELECTED autonomously (the orchestrator picked it per the feature-selection scope of `### Decision authority` in `WORKFLOW.md`, not the PM naming it), this same line reads: `selected autonomously per ### Decision authority; source: <backlog item / mandate passage>` — one provenance line carrying the citation, NOT a parallel "Selected-by:" field. The `source:` token is the single grep target the `pm-plan-checker` backstop keys on.

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
- `docs/threat-model.md`: <which Threat rows to add or update> (required on a security-bearing project when the feature touches a `### Security-relevant surfaces` item — see the Security-surface check; updated by `pm-architect` post-coding)
- `CLAUDE.md` Pipeline section: add `<validator command>` (if stack-researcher discovered a new validator for this feature's components)

## Out of scope
- <explicitly what this plan does NOT touch>
- **Sibling elements of categorical choices** — for every categorical element the plan focuses on (a chosen type, mode, role, state, operation), list each sibling that was considered and excluded, with one line on why it is a separate plan
```

**Decision-authority override rule (optional).** The plan may carry an optional `Decision authority: autonomous | interactive` line just under the topic heading. It is the **per-feature override** that runs *this one feature* under a different authority than the project value — most often `autonomous` on an otherwise-interactive project for a feature whose canon coverage is rich. Omit the line unless overriding. Step 3.5 reads it as the **top of the effective-authority resolution order** (plan line → `.ai-pm/decision-authority.md` `mode:` → `interactive`). See `### Decision authority` in `WORKFLOW.md` for the enum, the default, and the resolution order — do not re-encode them here.

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

**Autonomous branch.** When the effective authority is `autonomous`, the retrospective/audit nudge is a procedural checkpoint per `### Decision authority` in `WORKFLOW.md` (procedural-gate progression): auto-decide — run `/pm-audit` when **either** retrospective trigger fires (the 5-since-last threshold trips, **or** no audit has ever been run on a project that has accumulated features) — and **announce**, instead of asking. The PM interrupts to override.

**Pending-migration nudge.** If the project shows an un-migrated template structure (per `### Pending-migration detection` in `MIGRATIONS.md` — a lingering `docs/features/_index.md`, or a generated `docs/product.md` with the frozen signature line and no `docs/product-map.md`), surface it before new work:
> "This project is on an older template structure — `docs/product-map.md` hasn't been generated yet. Worth running the pending `/pm-bootstrap` migration first so we plan against the current format. Run the migration now?"

If PM says yes → run the pending `/pm-bootstrap` migration before proceeding with this feature.

There is also the lighter **old-format-map** case in `### Pending-migration detection` (an existing `docs/product-map.md` with at least one contract block still carrying the literal `Guarantees:` label **or** the pre-English-canonical `Что даёт:` label; a contract-less / infra-only map — no contract blocks, no value lines — is **not** old-format and triggers no nudge). When that is the detected condition, the offer is a regeneration, not a structural migration:
> "Your product map is in the old format — it leads with a build-history table instead of what each feature gives the user. I can regenerate it to the value-first format now (it's rebuilt from your contracts, nothing else changes). Regenerate before planning?"

If PM says yes → regenerate `docs/product-map.md` via the **Product map generation procedure** in `pm-bootstrap.md` before proceeding. If PM declines, planning proceeds and the `/pm-plan` handoff regenerates the map in the new format anyway.

There is also the **pre-English-canonical `product.md`** case in `### Pending-migration detection` (an existing `docs/product.md` whose funnel still carries the Russian headers `## Зачем это нужно` / `## Что умеет сегодня` / `## Документы` / `## Функции`; a `product.md` already on the English headers is not flagged). When that is the detected condition, offer the product.md header-migration before planning:
> "Your product front door uses the old section titles. I can update just the titles to the canonical English names — the text you wrote stays exactly as is. Run it before planning?"

If PM says yes → run the **product.md header-migration procedure** in `MIGRATIONS.md` before proceeding (headers only, prose preserved, performed by `pm-architect`).

There is also the **old-template-README** case in `### Pending-migration detection` (an existing `README.md` still carrying a `## What it does` capability list — the pre-front-gate structure; a README with no `## What it does` heading is not flagged). When that is the detected condition, offer the README front-gate migration before planning:
> "Your README keeps its own 'what it does' list, separate from `docs/product.md` — the two can drift. I can run the README front-gate migration: any capability that's only in the README moves into `docs/product.md` first, then the README's list is replaced with a link to it. Install instructions and everything else stay as-is. Run it before planning?"

If PM says yes → run the **README front-gate migration procedure** in `MIGRATIONS.md` before proceeding (move-not-copy, performed by `pm-architect`).

There is also the **token-laden-contract** case in `### Pending-migration detection` (an existing contract whose PM sections `## User value` / `## Out of scope` carry wire-tokens, or whose `## Must work` / `## Must not break` inline machine grammars that belong in `## Behavioral contract`; a token-free contract that references the Behavioral contract is not flagged). When that is the detected condition, offer the contract two-layer migration before planning:
> "One of your feature contracts mixes technical detail (topic formats, value ranges) into the parts meant for plain product language. I can run the contract two-layer migration: the technical grammar moves into the single architecture reference, the user-facing parts are rephrased in plain language, and every promise the contract makes is preserved. Run it before planning?"

If PM says yes → run the **contract two-layer migration procedure** in `MIGRATIONS.md` before proceeding (move-not-copy, performed by `pm-architect`, preserves every guarantee).

**Autonomous branch (all pending-migration nudges above).** When the effective authority is `autonomous`, a pending-migration nudge is a procedural checkpoint per `### Decision authority` in `WORKFLOW.md` (procedural-gate progression): run the detected pending migration + **announce**, instead of asking. The PM interrupts to override.

In interactive mode: don't implement fixes, don't block planning — PM decides. (In autonomous mode the nudges above are auto-decided per the **Autonomous branch** — the orchestrator runs the detected pending migration and announces, instead of relaying to the PM.)

## Product-readiness gate (user-facing features only)

After the Product Contract is drafted (Handoff below) and before the coder handoff, run the independent product-readiness check. This is the product-axis twin of the post-coding `code-review` pass; it runs **pre-coding** and **only on user-facing features**.

**Reach — user-facing only, by the human-role-subject extraction.** Apply the same rule `pm-auditor` uses in its dimension-1 artifact-completeness check (extract the grammatical subject of the first sentence of each scenario; a human role — integrator / operator / user / admin / developer / … — means user-facing). Do **not** re-encode the role list here — reference `pm-auditor`'s established extraction. If every scenario subject is non-human (the system / package / service / process / file), the feature is **exempt**: do not spawn the advocate, do not require an artifact, skip the rest of this section silently. `/pm-fixup` never reaches this step.

For a user-facing feature:

1. **Spawn `pm-product-advocate`** (`subagent_type: "pm-product-advocate"`) with tier `per-feature`, the approved plan, the drafted/existing contract, `docs/product.md`, and `docs/user-journeys.md`. It matches them against `### Foundational product questions` in `WORKFLOW.md` (referenced by name; never re-list the questions here) and writes `.ai-pm/reviews/<topic>_advocate.md` with a `gaps: N` / `clean` verdict.
2. **`clean` → silent pass.** Record the resolved artifact and proceed to the coder handoff. No `AskUserQuestion`, no ceremony (scenario 3).
3. **`gaps: N` → one relay pass.** Relay all N gap questions to the PM in **one** `AskUserQuestion` pass (never per-question tool-spam). For each gap the PM either answers it or consciously descopes it with a rationale. Record **each gap** as a numbered entry — one entry per gap, in gap order, matching the gap's number — in the artifact's `## Resolutions` trail below `## Verdict`, so the `gaps: N` ↔ N-resolutions count-match the backstops perform is mechanical (the orchestrator owns this trail — see the second carve-out in `WORKFLOW.md`'s Edit-ownership rule).
4. **Block the coder handoff** until every gap is answered or descoped — never a silent skip, never a permanent veto. The block is overridable by a recorded descope, not only by an answer.

This is soft enforcement, backstopped: `pm-plan-checker`'s DoD blocks a user-facing feature whose advocate gate is unresolved, and `pm-auditor` blocks a merged one with no resolved artifact. There is no hook (the trigger is a semantic judgement a regex cannot make). A manual step with no gate degrades silently; the DoD + auditor are that gate.

## Architect check

After PM approves the plan, check architect criteria before handing off to coder:

- Does the change add a new axis of extension (new entity type, new event kind, new handler of a kind already treated as a category in the codebase)?
- Are there multiple plausible homes for the new logic in existing abstractions?
- Does the plan contain a structural choice about internal layout rather than public API?

If **yes to any** — suggest to PM: "This plan has a structural choice about where the new code lives. I can run an architecture review (5-10 min) to map the options and risks before coding starts. Worth doing?"

If PM says yes — invoke `pm-architect` (`subagent_type: "pm-architect"`) with the plan, then hand off to coder with both plan and arch notes.
If PM says no — hand off to coder with plan only.
If **none apply** — hand off to coder directly without mentioning architect.

**Autonomous branch.** When the effective authority is `autonomous`, the architect-review offer is a procedural checkpoint per `### Decision authority` in `WORKFLOW.md` (procedural-gate progression): the orchestrator decides itself — run the arch review when the criteria above match, skip it otherwise — and **announces** the decision, instead of asking. The PM interrupts to override.

## Handoff

Show the draft to PM. Iterate until PM says ok.

**Autonomous branch.** When the effective authority is `autonomous`, plan-approval is a procedural checkpoint per `### Decision authority` in `WORKFLOW.md` (procedural-gate progression): announce the plan summary + proceed to the next step instead of relaying "approve the plan?" — the product-readiness advocate gate and `pm-plan-checker` **still run** (auto-proceed advances the pipeline, it does not skip the genuine-fork checks below). The PM interrupts the announce to steer or stop.

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

**Autonomous branch.** When the effective authority is `autonomous`, the contract-existence question is a procedural checkpoint per `### Decision authority` in `WORKFLOW.md` (procedural-gate progression): derive user-facing from the existing human-role-subject extraction (the same rule the Product-readiness gate uses) + **announce** the result, instead of asking the PM — then draft the contract (user-facing) or skip silently (backend-only) as above. The PM interrupts to override.

Tell PM the plan is saved, state is initialized. Then, before the coder handoff, run the **Product-readiness gate** above (user-facing features only — exempt and silent for backend-only changes by the same human-role-subject extraction) and the **Architect check** above. The coder handoff stays blocked until the product-readiness gate is resolved (`clean`, or every gap answered/descoped).

## What the plan does NOT include

- File paths where code will live — that is the coder's decision
- Private function names, internal helpers
- Step-by-step implementation guidance
