# User Journeys

How users interact with the protocol — step by step. Written for humans and read by agents before planning any feature.

The protocol has two human roles: the **PM** (describes the product, makes product decisions, never reads code) and the **downstream developer / maintainer** (installs the template, bumps it, operates the harness). The orchestrator and the `pm-*` agents are the system, not a role.

> **Vocabulary.** Harness-specific concepts are named with neutral nouns — "the project entry file", "the structured-question tool", "the enforcement layer", "the instruction-loading mechanism", "the adapter directory". The concrete per-harness primitive for each lives once in the [harness-reference table](../gen/harness-reference.md), never restated here.
>
> **Behavioral-contract anchor — N/A for this project.** The journeys template tells a journey's `**Invariants:**` block to reference taxonomy/system invariants in `architecture.md` `## Behavioral contract (taxonomies & invariants)`. This non-runtime project has **no such section** (no status ladder, no wire grammar, no protocol — `architecture.md` `## State model` is born `N/A`). So where a journey would point at the Behavioral contract, it instead references the relevant **architecture decision record** (by name) or the canonical orchestration spec (`../WORKFLOW.md` + `../workflow/*.md`), which is the single home for the protocol's actual behavior.
>
> This repo uses `doc/` (not `docs/`); cross-references point inside `doc/`.

---

## Journey 1: PM — Drive a feature through the pipeline

**Entry context:** the PM has a project already bootstrapped (a project entry file present, `doc/` populated) and wants a new feature or bug fix. They open a session and describe it in their own words ("I want group chats", "checkout hangs on step two").

| Step | What the PM does | What they expect | What can go wrong |
|---|---|---|---|
| 1. | Describes the feature in plain language | The system checks the git state first, branches off the latest main (or asks if a branch is already in progress), and reads the existing project docs before asking anything | Working tree is dirty → the system asks the PM to commit or stash before starting |
| 2. | Answers a few clarifying questions | Questions are grounded in what already exists, asked one at a time, each with concrete options and a recommendation; then a plain-language plan comes back — scenarios, what changes for users, what must not break | The PM and the plan disagree → the PM pushes back and the plan is revised before any code |
| 3. | Confirms the plan (and an architecture decision, if a structural question was raised) | If a new part of the stack is involved, its canon is researched and cited; if the feature touches shared state or async behavior, interaction scenarios are added; a Product Contract is drafted for a user-facing feature | A user-facing feature is under-defined → an independent product-readiness gate surfaces the gaps and blocks coding until each is answered or consciously descoped |
| 4. | Waits while the work happens (does not watch iterations) | The coder implements on the branch and runs the pipeline; a two-pass review loop runs — plan-compliance first, then technical quality — and any findings go back to the coder automatically until both passes are clean | Review finds a bug, a security issue, dead code, or a missed scenario → returned to the coder and re-reviewed; the PM never sees the churn |
| 5. | Reads the result | Hears, in product terms: what the feature now does, how to try it step by step, and any product notes that need a decision (scope, visible behavior) | A product note appears → the PM decides: fix now, add to backlog, or ignore |
| 6. | Says how to ship | Offered three ship options — test first (deploy + checklist), open a PR and test before merging, or ship now; before the PR opens, the feature's lasting facts are distilled into the living reference and the working notes are dropped (git keeps them); the PR is opened on the PM's go | PM is not ready → nothing is opened; merge/ship is always the PM's manual action |
| 7. | Merges the PR on the platform | The release is tagged and published automatically from the changelog; main is pulled locally, ready for the next feature | — |

**Drop-off points:** an unclear plan at step 2 (mitigated by plain-language confirmation); too many product-note decisions at once (the system batches and recommends).

**Invariants:**

- By step 1: the project is bootstrapped (a project entry file and `doc/` exist) and the git tree is clean, or the PM has chosen to continue on an in-progress branch.
- By step 4: every plan scenario must have both an implementation and a test before the feature can pass plan-compliance; a Product Contract violation blocks the PR.
- By step 6: a load-bearing review stamp must be written before the PR can be released; the feature's lasting facts must have graduated into the living reference before the working notes are dropped (the pre-ship graduation gate); merge stays manual.
- The pipeline-step taxonomy (Step 0–7), the two review passes, and the load-bearing review stamp are defined once in `../WORKFLOW.md` and `../workflow/pipeline.md`; this journey references them rather than restating them.

---

## Journey 2: Downstream developer — Install the protocol and bootstrap docs

**Entry context:** a developer has a repository (new or legacy) and wants to run its product development under the protocol, on Claude Code or on OpenCode (preview).

| Step | What the developer does | What they expect | What can go wrong |
|---|---|---|---|
| 1. | Adds the template as a submodule and links the adapter directory into it (symlinks by default; copy for shared-folder filesystems that don't pass symlinks) | The agents, commands, and enforcement layer now resolve through the submodule, so a later template bump propagates them automatically | A shared-folder filesystem silently drops symlinks → custom agents show as "not found"; the documented fix is to install by copy instead |
| 2. | Clears the session / starts fresh after install | The harness re-reads the adapter directory and picks up the agents, commands, and the always-on core | Installing mid-session → the new files aren't loaded in the current context until a fresh session |
| 3. | (OpenCode) links the OpenCode adapter directory and registers the always-on core path in the instruction-loading mechanism | The OpenCode adapters load and the enforcement plugin runs; the orchestrator can surface forks via the structured-question tool | Preview caveats apply — install auto-detect, the bash-`find` boundary guard, "ask"-class guards, cross-model pins, and a native review/research engine are not yet in preview |
| 4. | Says "start the project" | Greenfield → a short bootstrap conversation (product, stack, project kind, decision-authority mode), then the full `doc/` set is written. Legacy → offered two modes: quick-start (reads the essentials, leaves `[?]` gaps to close later) or full extraction (reads the whole codebase and reconstructs architecture + journeys so the system can be ported off the legacy stack) | A legacy codebase is large → full extraction takes longer but leaves no gaps; quick-start is the fast path with gaps closed in-flight |
| 5. | Validates the bootstrapped docs (legacy) or starts the first feature (greenfield) | Documentation, a project entry file, and the operational directory are in place; the project is ready for Journey 1 | — |

**Drop-off points:** the symlink-vs-copy decision on shared filesystems (step 1); forgetting to clear the session (step 2).

**Invariants:**

- By step 2: the agents/commands/core are only usable after a fresh session reads the adapter directory.
- The supported-harness set is **declared explicitly** (in the README and the project entry file), not inferred from which adapter directory is present — see `architecture.md` § "Symmetric dual-harness adapter architecture".
- The neutral-noun → per-harness concrete mapping for every primitive named above lives once in `../gen/harness-reference.md`.

---

## Journey 3: Protocol maintainer — Develop the protocol under its own protocol (dogfood)

**Entry context:** the protocol template itself needs a change (a new agent behavior, a workflow rule, a doc-discipline tweak). This repo *is* the template and develops itself under its own protocol.

| Step | What the maintainer does | What they expect | What can go wrong |
|---|---|---|---|
| 1. | Describes the protocol change as a feature, in the same session model a downstream PM uses | The same Step 0–7 pipeline runs — the protocol's own changes get planned, coded, reviewed, and shipped exactly like a downstream feature | — |
| 2. | Confirms the plan | The change is captured as a feature plan under `doc/features/`; structural questions go to the architect; the architecture record is updated when a decision is made | A protocol gap surfaces (the protocol itself can't express the change cleanly) → recorded as a protocol-gap report rather than worked around |
| 3. | Lets the review loop run | Plan-compliance then technical quality; for this markdown-prose repo, technical quality is editorial review plus a clean-grep plus the enforcement-hook unit tests — there is no stack linter | A regression in an enforcement-hook regex → caught by the hook unit tests (the one test artifact in the repo), not by "validation by use" |
| 4. | Ships the protocol change | Released through the same changelog-driven auto-tag flow; downstream projects pick it up on their next submodule bump | — |

**Drop-off points:** confusing "protocol development" with "downstream feature work" — they use the same pipeline, which is the point.

**Invariants:**

- Validation is by use plus editorial/clean-grep plus `tests/hooks.sh`; there is no runtime to assert against (see `architecture.md` § Architectural constraints).
- Protocol changes go through the `/pm-*` pipeline, never freehand — the same discipline a downstream project gets.

---

## Journey 4: Downstream session — Enforced against a role-duplicator

**Entry context:** during any session, something (the orchestrator, a stray instruction, the user) attempts to spawn a similarly-named role-duplicator agent or load a role-duplicator skill that would occupy a protocol seat, or attempts a silent in-place edit of a repo-owned file on a remote system, or an unsupervised force-push.

| Step | What happens | What the user expects | What can go wrong |
|---|---|---|---|
| 1. | A role-duplicator spawn / skill-load is attempted in place of a `pm-*` agent | The enforcement layer denies it at the harness level, before the action runs — not after | — |
| 2. | A silent in-place edit of a repo-owned file on a remote system is attempted | Denied: repo-owned files change through git, never by an edit on a remote host | A read-only diagnostic or a legitimate deployment is attempted → allowed; the guard targets silent repo edits, not all remote access |
| 3. | An unsupervised force-push is attempted | Denied: the guard prevents an unsupervised history rewrite | — |
| 4. | The user proceeds with the sanctioned `pm-*` agent / a git-based change instead | The protocol seat is filled only by the protocol's own agents; the rules hold even across separate sessions that don't share memory | — |

**Drop-off points:** a user surprised that a familiar non-protocol agent is blocked — the deny is intentional and the protocol agent is the substitute.

**Invariants:**

- The enforcement layer is a harness-level guard (a hook on one harness, a plugin on the other) — see `../gen/harness-reference.md` and `architecture.md` § "Symmetric dual-harness adapter architecture".
- Read-only diagnostics, legitimate deployment, runtime state changes, and dev experiments are **not** blocked; the full forbidden/allowed lists live once in `../workflow/enforcement.md`.
- On OpenCode (preview), the bash-`find` boundary guard and the "ask"-class guards are not yet in preview — see `architecture.md` § "Symmetric dual-harness adapter architecture" (preview caveats).

---

## Journey 5: PM — Resolve a product fork via the structured-question tool

**Entry context:** while planning or running the product-readiness gate on a user-facing feature, the protocol hits a substantive product fork it cannot resolve on its own (an under-specified behavior, a scope boundary, a trade-off between options).

| Step | What the PM does | What they expect | What can go wrong |
|---|---|---|---|
| 1. | (interactive mode, the default) Is presented the fork through the structured-question tool — a small set of concrete options with a recommendation, in their own language, no code | One clear question at a time, framed as a product trade-off, not a technical one | A simple proceed/confirm is not escalated as a structured choice — only substantive forks use the tool; trivial gates stay in prose |
| 2. | Picks an option, or consciously descopes the gap with a rationale | The answer (or descope) is recorded as a numbered entry in the feature's resolutions trail; the coder handoff stays blocked until every gap is answered or descoped | The PM leaves a gap unanswered → the handoff stays blocked, never silently skipped |
| 3. | (autonomous mode, if enabled) For a fork derivable from the bootstrap mandate and project canon, sees the system **announce** its choice before acting and record it with the cited rationale; only non-derivable, security-relevant, or PM-flagged irreversible forks are escalated to the same structured-question pass | Routine derivable forks proceed with an announcement (interruptible); genuine product forks still reach the PM | An autonomous decision is wrong → the announcement is interruptible before it acts; merge/ship still stays manual |

**Drop-off points:** a fork escalated that the PM expected to be automatic (or vice versa) — the derivability test decides, and the boundary is recorded.

**Invariants:**

- Decision authority is one of two modes — **absent or unrecognized configuration defaults to interactive** (the safe default). Autonomy is an upper bound, never required; merge/ship is manual in both scopes.
- The enum, the default, the derivability test, and the escalate-regardless cap are defined once in `../workflow/decision-authority.md`; this journey references them.

---

## Journey 6: PM / maintainer — Review and audit on a different model (cross-model)

**Entry context:** a feature's technical-quality review (Pass 2 of the loop) or a project-wide audit is about to run. By default these run on a different model than the session that wrote the plan and code, for independent blind spots.

| Step | What happens | What the user expects | What can go wrong |
|---|---|---|---|
| 1. | The review/audit resolves which model to use (default: a different model than the session; configurable) | The review model is **named at launch** ("review on <model>…") so it's visible which model is checking the work | — |
| 2. | The review runs on the resolved model, in scope (every change, or only high-risk changes, per configuration) | A different model catches a class of issues the author model missed; findings flow back through the same review trail and stamp | The other model is unavailable or equals the session model → the review simply runs on the session model and announces the fallback; nothing breaks |
| 3. | The user (optionally) changes the model or scope | Settable through the review-config file or by asking in plain language ("review this diff on the bigger model", "change the auditor") | — |

**Drop-off points:** none for the PM — this is transparent; a maintainer may want to tune cost via scope or by turning cross-model off.

**Invariants:**

- The review **engine**, the review trail, the load-bearing stamp, and the release gate are unchanged by cross-model — only the **model** changes.
- The four settings, the opinionated default, the model-blacklist, the fallback, and the model-pinned-subagent mechanism are defined once in `../workflow/review-typology.md` (`### Cross-model review`); on OpenCode (preview), cross-model model pins are not yet in preview.

---

## Cross-journey interactions

- **Bootstrap (Journey 2) precedes everything.** Journeys 1, 3, 5, and 6 assume a bootstrapped project (a project entry file and `doc/` present). Driving a feature (Journey 1) into an un-bootstrapped repo first triggers bootstrap.
- **The fork-resolution journey (5) is a sub-flow of the feature pipeline (1).** It fires at the planning / product-readiness stages of Journey 1; its mode (interactive vs autonomous) is fixed at bootstrap (Journey 2) and overridable per feature.
- **Cross-model review (6) is a sub-flow of the review loop inside Journeys 1 and 3.** It changes which model runs the existing Pass-2 review, not the pipeline shape.
- **Enforcement (4) is always-on across every other journey** — it is not a flow the user starts; it fires whenever a denied action is attempted in any session.
- **Dogfood (3) is Journey 1 turned on the protocol itself** — the same pipeline, with this repo as the project.
