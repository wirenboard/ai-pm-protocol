# Product Contract: documentation-discipline

User-facing contract for the guarantee that **every project carries a full, maintained documentation set — and the protocol holds itself to the same discipline (dogfood)** — docs are bootstrapped at project start and kept current by their owning agents as features land. The *user* is the PM (who gets durable, current project documentation without writing it) and the AI agent (which has a single, owned, up-to-date canon to read before every change).

---

## User value

Documentation that is written once and never updated is worse than none — it lies. This guarantee makes the doc set a living, owned thing: every project (greenfield or legacy, and the protocol itself) gets a full documentation set bootstrapped at the start, and each document has an owning agent that refreshes it when a landed feature changes it. The PM never has to author or chase documentation; the agents keep architecture, journeys, the product front door, stack notes, and (on security-bearing projects) the threat model current. The protocol proves the discipline by developing itself under it.

## Who uses it

The documentation-owning agents (which bootstrap and maintain each doc), the AI agent (which reads the current canon before planning/coding), and the PM (who relies on documentation being complete and current without writing it).

## Must work

- A project's documentation set is bootstrapped at start — greenfield (a short conversation then a full doc set) or legacy (quick-start with marked gaps, or full extraction that reads the codebase and reconstructs architecture and journeys).
- Each document has a single owning agent; when a landed feature changes a document, the owning agent refreshes it via the plan's "Docs to update" handoff.
- The protocol develops itself under its own protocol (dogfood) — protocol changes go through the same pipeline a downstream project uses, and the protocol carries its own maintained doc set.
- A bootstrapped doc is born populated where the source allows, with genuine unknowns marked for the PM, never invented.

## Must not break

- Each doc's single owner holds — the orchestrator never freehand-edits an agent-owned doc; it respawns the owning agent (the edit-ownership rule).
- A documentation gap a new template version introduces surfaces and is remediated collaboratively with the PM, never silently left under-filled.
- A value the agent cannot determine without real knowledge is marked for the PM, never invented (the never-invent-to-fill discipline).
- The protocol's own dogfooding stays real — the protocol's docs go through the same pipeline, not a privileged shortcut.

## Acceptance checks

- `doc/architecture.md` § "pm-auditor / pm-stack-researcher / pm-codebase-reader as read-only subagents" + § "Threat-model gains a full lifecycle" — verify the bootstrap drafting and per-doc ownership lifecycle.
- `workflow/pipeline.md` Step 4 ("Docs to update" handoff) — verifies the owning agent is respawned to refresh a doc a landed feature changed.
- `doc/architecture.md` § "Semantic doc-migration on template bump" — verifies the PM-collaborative remediation of a doc discipline a new version introduced.

## Out of scope

- Authoring the *product* decisions the docs record — the docs capture decisions the PM made; this guarantee maintains the docs, not the product strategy.
- Generating documentation a project does not need — non-applicable sections are marked `N/A`, and a non-security project gets no threat model.
- Running product-behavior tests for downstream documentation — validation for a docs-kind deliverable is by dry-run/sign-off, not a runtime test (the disciplined-pipeline `## Validation` stamp).

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- template-v2 — 2026-05-28 — the agent/command structure that bootstraps and owns the doc set.
- architect-owns-architecture-md — 2026-05-30 — single ownership of the architecture doc by pm-architect.
- legacy-reader-role-split — 2026-06-04 — the drafts-vs-owns split and journeys ownership consolidation under pm-architect.
- threat-model-ownership-and-lifecycle — 2026-06-04 — the full threat-model lifecycle owned by pm-architect on security-bearing projects.
- doc-migration-on-template-bump — 2026-06-04 — PM-collaborative remediation of doc disciplines a new template version introduces.

---

## Behavioral contract

The documentation-discipline rules are single-sourced, not restated here: the per-doc ownership and bootstrap drafting in `doc/architecture.md` § "pm-auditor / pm-stack-researcher / pm-codebase-reader as read-only subagents", § "Threat-model gains a full lifecycle", and the edit-ownership rule in `workflow/enforcement.md`; the "Docs to update" refresh handoff in `workflow/pipeline.md` Step 4; the dogfood stance in `CLAUDE.md` / `WORKFLOW.md` and the template-bump remediation in `doc/architecture.md` § "Semantic doc-migration on template bump".
