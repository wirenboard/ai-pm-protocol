# Product Contract: decision-authority

User-facing contract for the guarantee that **product forks are resolved at the right level of human involvement** — a non-derivable, security-relevant, or irreversible fork escalates to the PM, while merge and ship always stay manual, in both authority modes. The *user* is the PM (who is asked exactly the questions that need them, and never loses control of merge/ship) and the AI agent (which knows precisely when it may decide for itself and when it must escalate).

---

## User value

A protocol that asks the PM about *everything* is exhausting; one that decides *everything* itself is dangerous. This guarantee gives the dial two ends and a clear rule for which end applies to each fork. By default the PM answers each product fork (interactive). Optionally the pipeline resolves forks itself from the PM's bootstrap mandate and the project's own canon (autonomous) — but only when the answer is genuinely derivable from cited canon, announcing each decision before acting, and always escalating a fork that is not derivable, touches a security surface, or is irreversible/high-stakes. Whichever mode is in force, the PM keeps the final, irrevocable control: merge and ship never happen without them.

## Who uses it

The orchestrating AI agent (which classifies each fork and decides resolve-or-escalate), and the PM (who sets the mode, answers escalated forks, and owns merge/ship).

## Must work

- A fork is resolved under one of two modes (`autonomous | interactive`); an absent or unrecognized authority setting resolves to `interactive` — the safe default, never an error, never a random branch.
- In autonomous mode a fork is auto-resolved only when its answer is derivable from a cited canon passage; the decision is announced before acting and recorded with its citation.
- A fork that is not derivable from canon, OR touches a security-relevant surface on a security-bearing project, OR is PM-marked irreversible/high-stakes — escalates to the PM regardless of mode.
- Routine procedural checkpoints (which feature next, plan-approval, optional-step offers) announce-and-proceed in autonomous mode; genuine product forks still derive-or-escalate.
- Merge and ship stay manual in both modes — autonomy carries a feature to a finished, reviewed result and stops before merge.

## Must not break

- Autonomy is an upper bound, never a requirement — the escalate-regardless cap (not-derivable / security-surface / irreversible) always overrides autonomy.
- An autonomous decision never confabulates a direction the canon did not imply — no citable canon passage means no auto-decision; every `auto` resolution carries a cited reference.
- Merge/ship never becomes automatic in either mode — the ship gate is unchanged by authority mode.
- The dual citation backstop (the per-feature plan-checker DoD and the project-wide auditor check) both stay in place — neither is "simplified" into one, because dropping either lets an uncited auto-decision land silently in its scope.
- A dropped authority setting surfaces as a missing file (a visible signal), never a silent revert that goes unnoticed.

## Acceptance checks

- `workflow/decision-authority.md` § "Decision authority" — verifies the enum, the default, the derivability test, the escalate-cap, announce-before-act, and merge-always-manual.
- `WORKFLOW.md` `## Cross-cutting invariants` (decision-authority kernel) — verifies the always-on derivability/escalation kernel.
- `workflow/pipeline.md` Step 3.5 autonomous branch + Step 6 ship gate — verifies derive-or-escalate at forks and manual merge in both modes.

## Out of scope

- A numeric self-confidence threshold for auto-deciding — explicitly rejected (LLM self-confidence is mis-calibrated); the gate is a citable-canon test, not a confidence score.
- A formal backlog priority/ranking model — autonomous feature-selection uses a derivable-tiebreak floor and escalates on an absent tiebreak, not a scoring algorithm.
- Relaxing merge or ship — those stay manual in both scopes, always.
- Enforcing the modes via a hook — whether a gap is derivable is a semantic judgement a regex cannot make; enforcement is the soft gate plus the two citation backstops.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- automode — 2026-06-04 — the `autonomous | interactive` mode, the derivability test, the escalate-cap, announce-before-act, the dual citation backstop, and merge-always-manual.
- automode-procedural-gates — 2026-06-04 — announce-and-proceed through routine procedural checkpoints, derive-or-escalate only at genuine product forks.
- pm-decision-via-askuserquestion — 2026-06-03 — surfacing substantive forks to the PM via the structured-question tool.
- pm-product-advocate — 2026-06-04 — the product-readiness gate whose gap output the authority engine routes.

---

## Behavioral contract

The decision-authority rules are single-sourced, not restated here: the enum/default/derivability/escalate-cap/merge-manual kernel in `WORKFLOW.md` `## Cross-cutting invariants`; the full elaboration (value home, resolution order, procedural-gate progression, recording mechanics) in `workflow/decision-authority.md` § "Decision authority"; the autonomous gate branch and ship gate in `workflow/pipeline.md` Step 3.5 / Step 6.
