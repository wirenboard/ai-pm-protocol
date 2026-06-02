# diagnostic-probe-mode — plan

## Context

A regression surfaced from the protocol's hardening: the orchestrator now refuses to make even a PM-authorized throwaway change to test a hypothesis during diagnosis — it routes a one-off probe through the full feature pipeline. The recently-added `UserPromptSubmit` reminder amplified this (it injects "the orchestrator does not edit content artifacts directly" on change-intent prompts, including a diagnostic "поправь конфиг чтобы проверить").

The protocol conflates two things:
- **Silent permanent fix** (correctly forbidden): editing a repo-owned file in place, no plan/test/review/git — drifts from git, vanishes on rebuild.
- **Diagnostic probe / spike** (legitimate, currently has no sanctioned path): a temporary, PM-authorized change to confirm a hypothesis, understood as throwaway, with the real fix going through the pipeline.

**PM decision on scope:** the probe may touch **runtime / local state only** — flip a runtime setting, restart a service, change a value in a live config a redeploy resets, edit a local dev file. It **never** edits in place a file the repo owns in git. This keeps the git-source-of-truth guard fully intact, so **no hook change is needed** (the ssh content-edit `deny` stays; runtime/restart already go through the ssh-mut `ask`). This is a prose/norm fix plus a UPS exemption.

## Scenarios

1. **PM can authorize a diagnostic probe** to confirm a hypothesis without the full plan→coder→review→PR pipeline.
2. **The probe is runtime/local only** — it never edits a repo-owned file in place, on prod or anywhere. The silent-fix boundary stays hard.
3. **The probe is throwaway** — the orchestrator names it a probe (not the fix), then either reverts it or, if the hypothesis holds, takes the real fix through the pipeline. No silent permanent trace. What was changed and observed is recorded as the plan's Incident facts.
4. **The UPS reminder exempts probes** — its injected text states that a PM-authorized diagnostic probe is not a feature and need not be routed through /pm-plan, so the reminder stops pushing probes into the pipeline.
5. **The probe is proposed to the PM before it runs, in plain language with before→after.** The orchestrator does not silently poke the system — it shows a **probe proposal**: the problem (user's view), the hypothesis, the concrete change it will make (which setting / file, current value → new value), with a plain-language gloss on each technical item, what it will watch to confirm/refute, and what happens next (revert; pipeline fix if confirmed). The PM authorizes explicitly. This is the one place the orchestrator shows the concrete change — because the PM is authorizing a live-system touch and needs the specifics — but every technical item is explained, not dumped raw.

## Existing behaviors this feature touches

- **WORKFLOW.md "When you say it doesn't work in production"** — Step A is currently absolute read-only ("I do not systemctl restart … none of those, no matter how obvious"). Loosened: read-only **by default**, with an explicit PM-authorized probe exception (new **Step A.5**).
- **WORKFLOW.md "What is mandatory when" table** — new row: Diagnostic probe / spike → skip state/contract/DoD/stack.
- **WORKFLOW.md remote-system boundary "Allowed" list** — already permits "Mutating actions on production when the PM has explicitly asked" and runtime-state ops; cross-reference the probe path so the two read consistently.
- **`.claude/settings.json` UserPromptSubmit hook** — append a probe-exemption clause to the injected `additionalContext`.

## Categorical scope check

- **Categories of change during diagnosis** — chose: sanction the *runtime/local probe* element. Sibling explicitly **out of scope**: probes that edit a repo-owned file in place (even temporarily, even reverted) — that reopens the silent-fix path; the PM ruled it out. The real fix to a repo-owned file always goes through the pipeline.

## Stack expectations touched

None. Markdown prose + one string in `.claude/settings.json` (same UserPromptSubmit hook shape). No hook behavior change, so `tests/hooks.sh` is unaffected (the UPS test asserts injection presence, not text).

## Contracts

### Commit 1 — WORKFLOW.md: sanction the diagnostic probe
- Step A: read-only **by default**; remove the absolute "none of those" framing, point to Step A.5.
- New **Step A.5 — Probe to confirm a hypothesis (only if you authorize it)**: PM-explicit go-ahead; runtime/local only; never a repo-owned file in place; revert or pipeline-fix afterward; record as Incident facts.
- **Probe proposal template** inside Step A.5 — the plain-language pre-probe message the orchestrator must show and get a yes on: Problem → Hypothesis → Probe (setting/file, current → new value, with a plain gloss) → What we'll watch → After (revert / pipeline fix). The concrete before→after is shown (PM authorizes a live touch), every technical item glossed.
- "What is mandatory when": add the Diagnostic probe / spike row.

### Commit 2 — UPS reminder exemption
- Append to the injected `additionalContext`: a PM-authorized diagnostic probe (runtime/local, to test a hypothesis) is a throwaway spike, not a feature — do not route it through /pm-plan.

## Test plan

- `bash tests/hooks.sh` — still green; the UPS hook still emits valid JSON with non-empty `additionalContext` (assertion unchanged).
- Manual: the UPS hook on a probe-style prompt still fires (it is a change-intent word) but its text now carries the exemption — verified by reading the emitted `additionalContext`.
- Review: WORKFLOW Step A no longer contradicts Step A.5; the boundary against editing repo-owned files in place remains stated in both Step A.5 and the remote-system boundary rule.

## Docs to update

- `WORKFLOW.md` — Step A, new Step A.5, mandatory table, boundary cross-reference (Commit 1).
- `.claude/settings.json` — UPS text (Commit 2).
- `doc/architecture.md` — optional: note the probe carve-out under the realignment decision (the UPS hook now has an exemption). Light touch.

## Out of scope

- Editing repo-owned files in place during a probe (PM ruled out).
- Any hook `deny`→`ask` change.
- Changing the read-only default for ordinary diagnosis (probe is opt-in, PM-authorized).

## Handoff

1. Orchestrator writes this plan and commits.
2. Commit 1 (WORKFLOW) then Commit 2 (UPS text).
3. `bash tests/hooks.sh` green. `feat:` cluster → MINOR.
