# Product map — what the protocol guarantees, by contract

> **GENERATED** from `.ai-pm/contracts/` + `doc/features/` + `.ai-pm/reviews/` + git — do not hand-edit.

> Status: **live** — contract in force. The protocol's product is its enforced behavioral guarantees; the primary consumer is the LLM/agent, alongside the PM. Each contract below leads with its value; the features that built or strengthened it are listed under `Built by:`.

## cross-model-review

A model reviewing its own work shares its own blind spots — it tends to miss exactly what it got wrong, and to over-rate its own output. This guarantee makes the reviewer a *different brain* by default: review and audit run on a model different from the session that planned and coded, so a second set of blind spots catches what the first missed. The PM gets this diversity out of the box, is always told which model is reviewing (never left guessing), and is never blocked by it — when no other model is available, the activity still runs on the session model and says so.

**Out of scope:**

- Choosing *which reviewer engine* runs — that is engine-selection (a different axis: engine = which reviewer, model = which brain); both coexist.
- Forcing a cross-model run when no other model exists — the path degrades to the session model rather than failing.
- Pinning the *session* model — that is a harness relaunch, unrelated to this config.

Built by:

| Feature | Added | Review |
|---|---|---|
| [cross-model-review](features/cross-model-review_plan.md) | 2026-06-06 | [review](../.ai-pm/reviews/cross-model-review_review.md) |
| [review-typology-framework](features/review-typology-framework_plan.md) | 2026-06-05 | [review](../.ai-pm/reviews/review-typology-framework_review.md) |
| [review-engine-selection](features/review-engine-selection_plan.md) | 2026-06-05 | [review](../.ai-pm/reviews/review-engine-selection_review.md) |

## cross-session-enforcement

Prose rules in a workflow document only hold while a session remembers to read them. A fresh AI session, a different model, or a long conversation that has paged the rules out would otherwise be free to do the forbidden thing. This guarantee makes the load-bearing rules *mechanical*: a small set of before-tool guards blocks the specific dangerous actions at the moment they are attempted — so the rules survive memory loss, model swaps, and session boundaries. Crucially, the guards are a named deny-list, not a blanket block, so they never get in the way of legitimate diagnostics or deployment.

**Out of scope:**

- Enforcing semantic judgements a regex cannot make (is this feature user-facing? is the product under-specified? is this a security-touch?) — those are soft-enforced by gates and backstops, deliberately not hooks.
- Blocking legitimate runtime, deployment, or read-only diagnostic work — the enforcement layer is a targeted deny-list, not a productivity wall.
- Realizing the same guards identically on every harness — the *rules* are harness-neutral, but the wiring and the available outcomes differ per harness (see the dual-harness contract).

Built by:

| Feature | Added | Review |
|---|---|---|
| [protocol-integrity-and-stack-literacy](features/protocol-integrity-and-stack-literacy_plan.md) | 2026-05-30 |  |
| [protocol-builtins-realignment](features/protocol-builtins-realignment_plan.md) | 2026-06-02 |  |
| [bootstrap-write-loss-guards](features/bootstrap-write-loss-guards_plan.md) | 2026-06-06 |  |
| [deny-review-orchestrator](features/deny-review-orchestrator_plan.md) | 2026-06-05 | [review](../.ai-pm/reviews/deny-review-orchestrator_review.md) |

## decision-authority

A protocol that asks the PM about *everything* is exhausting; one that decides *everything* itself is dangerous. This guarantee gives the dial two ends and a clear rule for which end applies to each fork. By default the PM answers each product fork (interactive). Optionally the pipeline resolves forks itself from the PM's bootstrap mandate and the project's own canon (autonomous) — but only when the answer is genuinely derivable from cited canon, announcing each decision before acting, and always escalating a fork that is not derivable, touches a security surface, or is irreversible/high-stakes. Whichever mode is in force, the PM keeps the final, irrevocable control: merge and ship never happen without them.

**Out of scope:**

- A numeric self-confidence threshold for auto-deciding — explicitly rejected (LLM self-confidence is mis-calibrated); the gate is a citable-canon test, not a confidence score.
- A formal backlog priority/ranking model — autonomous feature-selection uses a derivable-tiebreak floor and escalates on an absent tiebreak, not a scoring algorithm.
- Relaxing merge or ship — those stay manual in both scopes, always.
- Enforcing the modes via a hook — whether a gap is derivable is a semantic judgement a regex cannot make; enforcement is the soft gate plus the two citation backstops.

Built by:

| Feature | Added | Review |
|---|---|---|
| [automode](features/automode_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/automode_review.md) |
| [automode-procedural-gates](features/automode-procedural-gates_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/automode-procedural-gates_review.md) |
| [pm-decision-via-askuserquestion](features/pm-decision-via-askuserquestion_plan.md) | 2026-06-03 | [review](../.ai-pm/reviews/pm-decision-via-askuserquestion_review.md) |
| [pm-product-advocate](features/pm-product-advocate_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/pm-product-advocate_review.md) |

## disciplined-pipeline

Whoever drives a change — an AI agent or the PM behind it — gets a single, predictable path from idea to shipped release, with independent checks wired into the path so that quality does not depend on anyone remembering to be careful. A change cannot quietly skip planning, skip review, or land half-finished: the pipeline makes the disciplined route the only route. The PM watches a plain-language conversation; the structure runs underneath it.

**Out of scope:**

- Deciding *what* a change should do — that is the planning conversation, not the pipeline's structural guarantee.
- Forcing the full pipeline onto a trivial change — the fast path exists for that, and substrate/backend work is proportioned by change type.
- Merging or shipping automatically — the ship gate stays manual (see the decision-authority contract).

Built by:

| Feature | Added | Review |
|---|---|---|
| [template-v2](features/template-v2_plan.md) | 2026-05-28 |  |
| [integrate-consultancy](features/integrate-consultancy_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/integrate-consultancy_review.md) |
| [review-stamp-gate](features/review-stamp-gate_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/review-stamp-gate_review.md) |
| [optimize-without-losing-rigor](features/optimize-without-losing-rigor_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/optimize-without-losing-rigor_review.md) |

## documentation-discipline

Documentation that is written once and never updated is worse than none — it lies. This guarantee makes the doc set a living, owned thing: every project (greenfield or legacy, and the protocol itself) gets a full documentation set bootstrapped at the start, and each document has an owning agent that refreshes it when a landed feature changes it. The PM never has to author or chase documentation; the agents keep architecture, journeys, the product front door, stack notes, and (on security-bearing projects) the threat model current. The protocol proves the discipline by developing itself under it.

**Out of scope:**

- Authoring the *product* decisions the docs record — the docs capture decisions the PM made; this guarantee maintains the docs, not the product strategy.
- Generating documentation a project does not need — non-applicable sections are marked `N/A`, and a non-security project gets no threat model.
- Running product-behavior tests for downstream documentation — validation for a docs-kind deliverable is by dry-run/sign-off, not a runtime test (the disciplined-pipeline `## Validation` stamp).

Built by:

| Feature | Added | Review |
|---|---|---|
| [template-v2](features/template-v2_plan.md) | 2026-05-28 |  |
| [architect-owns-architecture-md](features/architect-owns-architecture-md_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/architect-owns-architecture-md_review.md) |
| [legacy-reader-role-split](features/legacy-reader-role-split_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/legacy-reader-role-split_review.md) |
| [threat-model-ownership-and-lifecycle](features/threat-model-ownership-and-lifecycle_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/threat-model-ownership-and-lifecycle_review.md) |
| [doc-migration-on-template-bump](features/doc-migration-on-template-bump_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/doc-migration-on-template-bump_review.md) |

## dual-harness-from-one-source

The protocol's guarantees should not be tied to one AI coding tool. This guarantee lets it run on two harnesses (Claude Code, and OpenCode in preview) without maintaining two divergent copies: a single harness-neutral source generates both adapters, and the shared instruction prose refers to every harness-specific concept by a neutral noun (the project entry file, the structured-question tool, the enforcement layer, the instruction-loading mechanism) resolved per harness through one reference table. The PM can adopt the protocol on either harness and get the same disciplined behavior; the agent loads an adapter that is faithful to the single source.

**Out of scope:**

- Harnesses beyond Claude Code and OpenCode — the architecture generalizes to N adapters, but Cursor, Codex CLI, Aider, and similar are not built.
- Full OpenCode certification this slice — OpenCode is a labeled preview gated on tracked upstream gaps; the source/distribution repo split (stage b) is PM-gated/pending.
- Imposing a build, toolchain, or generator on downstream — downstream always gets pre-built plain files.

Built by:

| Feature | Added | Review |
|---|---|---|
| [opencode-harness-support](features/opencode-harness-support_plan.md) | 2026-06-07 |  |
| [harness-neutral-prose](features/harness-neutral-prose_plan.md) | 2026-06-07 |  |
| [opencode-orchestrator-primary](features/opencode-orchestrator-primary_plan.md) | 2026-06-07 |  |
| [per-operation-effort-tiering](features/per-operation-effort-tiering_plan.md) | 2026-06-07 |  |
| [opencode-compact-reviewer](features/opencode-compact-reviewer_plan.md) | 2026-06-08 | [review](../.ai-pm/reviews/opencode-compact-reviewer_review.md) |

## plan-fidelity

When the PM approves a plan, they are approving a promise: this is what will be built. Plan-fidelity makes that promise mechanical — an independent checker confirms that every scenario in the approved plan is actually implemented *and* tested before the change is allowed to pass, and that the change did not quietly grow beyond or shrink below what was agreed. The PM never has to read code to know the plan was honored; the agent cannot pass a half-built or scope-crept change.

**Out of scope:**

- Judging whether the plan itself was a good idea — fidelity checks faithfulness to the approved plan, not its merit (that is the planning conversation and the product-readiness gate).
- Technical bug-hunting — that is Pass 2 (the disciplined-pipeline / regression-protection guarantees), a separate pass from plan-compliance.

Built by:

| Feature | Added | Review |
|---|---|---|
| [integrate-consultancy](features/integrate-consultancy_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/integrate-consultancy_review.md) |
| [protocol-integrity-and-stack-literacy](features/protocol-integrity-and-stack-literacy_plan.md) | 2026-05-30 |  |
| [optimize-without-losing-rigor](features/optimize-without-losing-rigor_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/optimize-without-losing-rigor_review.md) |

## product-readiness-gate

The orchestrator both elicits product detail from the PM and pushes toward coding — player and referee at once — so an under-specified product could otherwise sail straight into implementation. This guarantee inserts an *independent* product referee between planning and coding: on every user-facing feature it checks the plan against a fixed set of foundational product questions and holds the handoff to the coder until each gap is either answered or deliberately descoped with a recorded reason. The PM gets a structural safeguard against building the wrong or half-defined thing, and the answer always stays the PM's — the referee judges presence of an answer, never its quality.

**Out of scope:**

- Grading the quality of the PM's answers — the gate checks that each foundational gap has a recorded answer or descope, not whether the answer is good.
- Running on non-user-facing work — substrate, infra, docs-only, trivial, and diagnostic changes are exempt by design (a blanket gate would strangle legitimate substrate work).
- Deciding the answer itself in interactive mode — the gate surfaces gaps to the PM; autonomous resolution of a derivable gap is the decision-authority contract's concern.

Built by:

| Feature | Added | Review |
|---|---|---|
| [pm-product-advocate](features/pm-product-advocate_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/pm-product-advocate_review.md) |
| [integrate-consultancy](features/integrate-consultancy_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/integrate-consultancy_review.md) |

## project-boundary

An AI agent loose on the filesystem — reading sibling repos, editing production files in place — is a trust and integrity hazard. This guarantee draws two hard lines. First, every agent stays inside the project root: no parent directories, no sibling repositories, no protocol-internal submodule content beyond the named shipped surface. Second, any file the repository owns changes through git, never by an in-place edit on a remote system — so the git history stays the single source of truth and a "tiny obvious fix" on a server cannot silently diverge from the repo. The PM gets a self-contained project whose real state always lives in git.

**Out of scope:**

- Blocking legitimate remote work — read-only diagnostics, deployment via the project's own channel, and PM-initiated maintenance proceed; only silent edits to repo-owned files are forbidden.
- Enforcing semantic ownership judgements a regex cannot make — the edit-ownership rule (who writes which artifact) is orchestrator discipline plus gates, distinct from the path/remote guards this contract enforces.
- Reaching into the protocol submodule's internal history — that surface is excluded by design.

Built by:

| Feature | Added | Review |
|---|---|---|
| [protocol-integrity-and-stack-literacy](features/protocol-integrity-and-stack-literacy_plan.md) | 2026-05-30 |  |
| [protocol-builtins-realignment](features/protocol-builtins-realignment_plan.md) | 2026-06-02 |  |
| [orchestrator-read-discipline](features/orchestrator-read-discipline_plan.md) | 2026-06-05 | [review](../.ai-pm/reviews/orchestrator-read-discipline_review.md) |
| [agent-reporting-discipline](features/agent-reporting-discipline_plan.md) | 2026-06-06 | [review](../.ai-pm/reviews/agent-reporting-discipline_review.md) |

## regression-protection

The most dangerous failure in fast development is the silent regression — a new feature that quietly breaks an old one nobody re-tested. This guarantee closes that: every user-facing feature carries a Product Contract naming, in plain language, what it must do and what must never break; whenever a change touches that feature, those promises are re-checked against the diff, and a violation blocks the PR rather than slipping through. The PM gets durable, accumulating protection of everything the product already promises, without re-describing it each time.

**Out of scope:**

- Protecting behavior of a change that has no user-facing surface — backend/infra refactors carry no contract unless they change visible behavior.
- Judging whether a promise is *worth* keeping — the PM owns the meaning of each must-work / must-not-break item; this guarantee only enforces that recorded promises survive.

Built by:

| Feature | Added | Review |
|---|---|---|
| [integrate-consultancy](features/integrate-consultancy_plan.md) | 2026-05-30 | [review](../.ai-pm/reviews/integrate-consultancy_review.md) |
| [contract-two-layer-token-lint](features/contract-two-layer-token-lint_plan.md) | 2026-06-03 | [review](../.ai-pm/reviews/contract-two-layer-token-lint_review.md) |
| [nfr-operational-limits-prompt](features/nfr-operational-limits-prompt_plan.md) | 2026-06-04 | [review](../.ai-pm/reviews/nfr-operational-limits-prompt_review.md) |
| [contract-centric-product-map](features/contract-centric-product-map_plan.md) | 2026-06-02 |  |

## Infrastructure (no user-facing contract)

Protocol-internal features (47) that strengthen the system but are not linked to a specific contract above.

| Feature | Added |
|---|---|
| [agent-handoff-durability](features/agent-handoff-durability_plan.md) | 2026-06-06 |
| [ai-minimums-linter-wiring](features/ai-minimums-linter-wiring_plan.md) | 2026-06-05 |
| [architecture-doc-coherence](features/architecture-doc-coherence_plan.md) | 2026-06-02 |
| [audit-fixup-hooks-quoted-form](features/audit-fixup-hooks-quoted-form_plan.md) | 2026-05-30 |
| [audit-fixup-self-docs-architecture](features/audit-fixup-self-docs-architecture_plan.md) | 2026-05-30 |
| [audit-fixup-self-stack-notes](features/audit-fixup-self-stack-notes_plan.md) | 2026-05-30 |
| [audit-scope-menu](features/audit-scope-menu_plan.md) | 2026-06-05 |
| [behavioral-contract-and-human-journeys](features/behavioral-contract-and-human-journeys_plan.md) | 2026-06-03 |
| [bootstrap-populated-journeys](features/bootstrap-populated-journeys_plan.md) | 2026-06-04 |
| [changelog-backfill](features/changelog-backfill_plan.md) | 2026-05-30 |
| [changeset-hygiene](features/changeset-hygiene_plan.md) | 2026-06-05 |
| [comment-restraint](features/comment-restraint_plan.md) | 2026-06-06 |
| [context-leanness](features/context-leanness_plan.md) | 2026-06-07 |
| [diagnostic-flow-discipline](features/diagnostic-flow-discipline_plan.md) | 2026-06-05 |
| [diagnostic-probe-mode](features/diagnostic-probe-mode_plan.md) | 2026-06-02 |
| [documentation-flavor](features/documentation-flavor_plan.md) | 2026-06-04 |
| [english-canonical-artifacts](features/english-canonical-artifacts_plan.md) | 2026-06-03 |
| [extract-migrations-reference](features/extract-migrations-reference_plan.md) | 2026-06-03 |
| [integration-risk-spike-gate](features/integration-risk-spike-gate_plan.md) | 2026-06-06 |
| [invariants-index](features/invariants-index_plan.md) | 2026-06-04 |
| [markdown-blank-line-sweep](features/markdown-blank-line-sweep_plan.md) | 2026-06-03 |
| [on-hardware-blast-radius-preflight](features/on-hardware-blast-radius-preflight_plan.md) | 2026-06-04 |
| [opencode-compact-reviewer](features/opencode-compact-reviewer_plan.md) | 2026-06-08 |
| [opencode-orchestrator-primary](features/opencode-orchestrator-primary_plan.md) | 2026-06-07 |
| [orchestrator-anti-corner-cutting](features/orchestrator-anti-corner-cutting_plan.md) | 2026-06-08 |
| [per-operation-effort-tiering](features/per-operation-effort-tiering_plan.md) | 2026-06-07 |
| [product-map-migration-detection](features/product-map-migration-detection_plan.md) | 2026-06-02 |
| [product-map-value-first](features/product-map-value-first_plan.md) | 2026-06-03 |
| [product-md-front-door](features/product-md-front-door_plan.md) | 2026-06-02 |
| [protocol-process-flavor](features/protocol-process-flavor_plan.md) | 2026-06-04 |
| [readme-currency](features/readme-currency_plan.md) | 2026-06-05 |
| [readme-front-gate](features/readme-front-gate_plan.md) | 2026-06-03 |
| [readme-rewrite](features/readme-rewrite_plan.md) | 2026-06-04 |
| [readme-template-canonical-shape](features/readme-template-canonical-shape_plan.md) | 2026-06-05 |
| [readme-workflow-split](features/readme-workflow-split_plan.md) | 2026-05-30 |
| [route-reminder-coverage-and-prprep-model](features/route-reminder-coverage-and-prprep-model_plan.md) | 2026-06-03 |
| [seam-completeness](features/seam-completeness_plan.md) | 2026-06-06 |
| [semgrep-pre-review-linter](features/semgrep-pre-review-linter_plan.md) | 2026-06-06 |
| [severity-triage-deployment-context](features/severity-triage-deployment-context_plan.md) | 2026-06-06 |
| [stack-idioms-library](features/stack-idioms-library_plan.md) | 2026-06-06 |
| [state-archive-home](features/state-archive-home_plan.md) | 2026-06-06 |
| [state-model-section](features/state-model-section_plan.md) | 2026-06-05 |
| [taxonomy-drift-sweep](features/taxonomy-drift-sweep_plan.md) | 2026-06-04 |
| [template-dev-artifacts-inert](features/template-dev-artifacts-inert_plan.md) | 2026-06-06 |
| [test-wiring-parity](features/test-wiring-parity_plan.md) | 2026-06-05 |
| [workflow-extract-to-refs](features/workflow-extract-to-refs_plan.md) | 2026-06-05 |
| [workflow-progressive-disclosure](features/workflow-progressive-disclosure_plan.md) | 2026-06-05 |

