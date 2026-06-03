# review-stamp-gate — plan

## Context

Real downstream feedback (2026-06-04): on a project, `code-review` (review-loop Pass 2)
*was actually performed* — every feature's archive shows concrete Pass-2 fixes — but the
last, bookkeeping step (record the result in `.ai-pm/reviews/<topic>_review.md` and stamp
`passed`) was silently skipped. Functionally nothing broke in that incident; **integrity**
broke: the single persistent review artifact lied by omission, a benign-looking blank
section reads as "passed / no findings" to a quick eye, `grep`, or tool, and only a late
audit caught it. The identical blank is what you'd see if review had **never run** — the
artifact cannot distinguish the two worlds.

Four root causes, all instances of one law — *a manual step with no gate degrades silently*:

1. **No gate.** Between "review clean" and "merge" nothing checks the stamp exists.
   `pm-pr-prep` prepares the release without looking; only a late `pm-auditor` sweep catches it.
2. **Self-contradiction.** `WORKFLOW.md` edit-ownership lists `.ai-pm/reviews/` as a content
   artefact the orchestrator does **not** touch (owner: `pm-plan-checker`), while Step 5 Pass 2
   tells the orchestrator to append and stamp that same file.
3. **Deceptive-empty template.** The section ships as an empty `## Code review` heading — present
   structurally, so it reads as "done" — instead of a loud incompleteness marker.
4. **DoD ordering.** The Definition of Done is signed in Pass 1, *before* the Pass-2 trail exists,
   so a "trail stamped" checkbox cannot physically live there.

PM decisions (2026-06-04):

- **Writer of the Pass-2 trail = the orchestrator (carve-out), confirmed.** It runs `code-review`
  and already holds the findings; routing them through an agent (or a dedicated "stamper" agent —
  the "backlog-curator" overhead-with-no-upside anti-pattern the spec already names) pays a hop for
  data already in hand. The deeper reframe the PM surfaced: the rule is **not** "orchestrator writes
  no content" — the orchestrator already writes plans (`/pm-plan`), contracts, and backlog. The rule
  is "**orchestrator writes the outputs of processes it drives; it does not freehand-edit canon owned
  by an autonomous agent.**" The code-review trail is such a process-output, alongside plans and
  protocol-feedback.
- **Make the stamp load-bearing, not by-discipline:** loud marker + a hard `pm-pr-prep` gate +
  `pm-auditor` backstop.
- **A hard `Edit|Write`/`main` PreToolUse guard is NOT in scope** (re-opened separately — see
  Out of scope). Blocking `main` would break `git pull` / merge (the valid 2026-06-02 objection);
  an `Edit|Write` content-artefact guard remains feasibility-blocked on the unanswered
  orchestrator-vs-subagent detection question (now routed to `/pm-research`).

A second, thematically-linked obligation ships in the same branch: when the orchestrator discovers a
**structural gap in the protocol spec itself** (not a project bug — a tooling bug), it must not
silently work around it; it writes a structured **protocol-gap report** for upstreaming to the
`ai-pm-protocol` repo. This very feedback is the worked example of the format.

## Scenarios

*(the "user" of the protocol is the orchestrator / agents)*

1. **Loud incompleteness marker.** `pm-plan-checker` writes the review file's code-review section as
   `## Code review: NOT YET RUN`, never an empty heading. A `NOT YET RUN` / empty / undated section
   is "unstamped"; only `## Code review: <date> — passed` is "stamped". The marker reads as
   "not done" to eye, `grep`, and the gate — a skeleton that looks filled is worse than an absent one.
2. **Contradiction removed + ownership reframed.** `WORKFLOW.md` edit-ownership gains an explicit
   carve-out: the Pass-2 `## Code review` trail is the **single** review section the orchestrator
   writes; `pm-plan-checker` owns everything through `## Verdict`. The section also states the general
   model: the orchestrator writes the outputs of processes it drives (PM conversation → backlog /
   contracts; `/pm-plan` → plan; running `code-review` → the trail; finding a protocol gap →
   protocol-feedback) and never freehand-edits agent-owned canon.
3. **Hard pre-merge gate.** `pm-pr-prep`, before bumping version / committing / pushing, refuses to
   prepare a release if any feature shipping in it has an unstamped `## Code review` section, and
   reports which feature and why. The rule is keyed on **section presence**: a review file that
   contains a `## Code review` section must have it stamped `passed`. A trivial-fixup review
   (`fixup-*_review.md`, which has no such section) is therefore exempt with no filename special-casing.
4. **Auditor backstop.** `pm-auditor` dimension 1 (artifact completeness) treats a merged feature whose
   `## Code review` section is unstamped (`NOT YET RUN` / empty / undated) as **blocking**, not a note —
   encoding the auditor pattern "empty == unstamped == blocker". Catches anything that bypasses the gate.
5. **DoD ordering corrected.** The binding stamp check lives at the `pm-pr-prep` gate (which fires
   *after* the last necessary action), not in the Pass-1 DoD. `WORKFLOW.md` Step 5 states Pass 2 is not
   complete until the stamp is written, and the gate enforces it.
6. **Downstream migration.** `MIGRATIONS.md` gains a `### Pending-migration detection` condition —
   a downstream `.ai-pm/reviews/<topic>_review.md` whose `## Code review` section is the pre-vX empty
   placeholder (positive presence of an **unstamped** `## Code review` heading: no `— passed` date,
   no `NOT YET RUN` marker) — plus a procedure: the orchestrator (the trail's owner, per the carve-out)
   normalizes each such placeholder to `## Code review: NOT YET RUN`, making the latent gap visible so
   the now-loud `pm-auditor` rule blocks it for per-feature remediation. Idempotent: a section already
   stamped `passed` is never touched.
7. **Protocol-gap feedback obligation.** A new `WORKFLOW.md` section, "When the protocol itself has a
   gap": on discovering a structural protocol-spec gap (contradiction / ungated manual step /
   deceptive-empty template / ordering bug / ownerless artefact — in `.ai-pm/tooling`, not project code),
   the orchestrator writes `.ai-pm/protocol-feedback/<topic>.md` (an orchestration artefact it writes
   directly; directory created on first use) with a fixed shape — **Symptom / Root cause (file+section)
   / Minimal fixes / Protocol files touched** — surfaces it to the PM in plain language for upstreaming,
   and never edits `.ai-pm/tooling` in place. It does not silently work around the gap.

## Existing behaviors this feature touches

(what must not break)

- **Pass 1 (`pm-plan-checker` plan-compliance verdict through `## Verdict`)** — unchanged; ownership of
  that part of the file stays with `pm-plan-checker`.
- **Trivial-fixup flow** (`/pm-fixup` → `pm-coder` → `pm-plan-checker` trivial mode → `pm-pr-prep`) —
  must NOT be blocked by the new gate; its `fixup-*_review.md` carries no `## Code review` section.
- **`pm-pr-prep` release ceremony** (remote-shape detection, version bump, CHANGELOG, staging of
  `.ai-pm/reviews/` + `.ai-pm/arch/`, PR open/update) — unchanged except for the added pre-flight gate.
- **Orchestration-vs-content model** — plans and contracts stay orchestrator-written via `/pm-plan`;
  the reframed wording must remain coherent with that, not narrow it.
- **`tests/hooks.sh`** — stays green; this feature adds no hook (the `Edit|Write` guard is out of scope).

## Stack expectations touched

None. No new library, hook, schema, or external artefact. The `pm-pr-prep` gate is a `grep` over review
files within `pm-pr-prep`'s existing `Bash` capability; all other changes are protocol-spec / agent-prompt
prose. (No `docs/stack-notes.md` component is touched, so no stack-spec test applies.)

## Interaction scenarios

The review file `.ai-pm/reviews/<topic>_review.md` is shared state across five readers/writers
(`pm-plan-checker` writes the verdict, the orchestrator writes the trail, `pm-coder` reads findings,
`pm-pr-prep` reads for the gate, `pm-auditor` reads for the backstop). Not provably isolated.

- When `pm-pr-prep` runs the gate while a feature's `## Code review` section is still `NOT YET RUN`:
  it refuses to prepare the release and names the feature (the gate's purpose).
- When `pm-pr-prep` runs the gate on a release containing a trivial-fixup review file (no `## Code review`
  section): it does **not** block — section-absence exemption holds.
- When `pm-auditor` reads a merged feature whose `## Code review` section is `NOT YET RUN` / empty:
  blocking. When it reads a `## Code review: <date> — passed` section: clean.
- When the migration normalization runs over a review file already stamped `passed`: no-op (the stamped
  section is not rewritten) — idempotency preserved.

## Test plan

- **Existing tests that must pass:** `tests/hooks.sh` (currently green) — unaffected by a prose /
  agent-prompt change (no new hook); run to confirm it stays green.
- **New executable tests:** none — the change is prose and agent instructions. Verification is editorial:
  `pm-plan-checker` and `code-review` read the diff against this plan and confirm all 7 scenarios are
  realized, specifically that:
  - the edit-ownership carve-out and Step 5 Pass 2 no longer contradict each other (the same file is
    not both "orchestrator must not touch" and "orchestrator must stamp");
  - the gate rule is keyed on `## Code review` **section presence**, so `fixup-*_review.md` is exempt
    without filename special-casing;
  - the auditor rule encodes "unstamped == blocking" and reuses dimension 1, not a new dimension;
  - the migration detection uses **positive presence** of an unstamped heading and the procedure is
    idempotent (never clobbers a `passed` stamp), matching the single-source-of-conditions convention
    already in `MIGRATIONS.md`;
  - the protocol-feedback section names a fixed report shape and an orchestration-artefact path,
    consistent with the reframed orchestrator-writes model.
- **Interaction-scenario coverage:** verified editorially against the four interaction scenarios above
  (gate-blocks-unstamped, gate-exempts-fixup, auditor-blocks-unstamped, migration-idempotent).
- **Mandatory-table classification:** mechanically **docs-only** (no Product Contract, no executable
  tests), but it encodes substantive protocol behaviour — scenario coverage is verified editorially
  rather than by a test runner.

## Docs to update

- `doc/architecture.md` § "Edit-ownership split: content artefacts vs orchestration artefacts"
  (lines ~60-62): reflect (a) the Pass-2 code-review-trail carve-out, (b) the reframed model
  ("orchestrator writes the outputs of processes it drives — plans, contracts, backlog, code-review
  trail, protocol-feedback — and never freehand-edits agent-owned canon"), and (c) the new
  protocol-gap feedback mechanism and its `.ai-pm/protocol-feedback/` artefact. Owner: `pm-architect`
  — spawned by the orchestrator after `pm-coder` finishes (standard `/pm-plan` post-coding handoff).

## Out of scope

- **Hard `PreToolUse` `Edit|Write` / `main` guard for edit-ownership.** Re-opened (backlog line 33,
  rejection basis corrected: the original objection was `main`-blocking breaking `git pull` / merge,
  which is valid; the real open question is whether a `PreToolUse` hook can distinguish the orchestrator
  from `pm-coder`, which legitimately edits the same canon). Routed to a separate `/pm-research` on
  feasibility before any decision. This feature deliberately ships **no** new hook.
- **Pass-1 (plan-compliance) verdict ownership** — stays with `pm-plan-checker`; this feature only
  touches the Pass-2 `## Code review` trail below `## Verdict`.
- **`/pm-fixup` review files** — exempt from the gate by design (no `## Code review` section); their
  trivial-mode verdict is unchanged.
- **Auditing/forwarding of `.ai-pm/protocol-feedback/` reports** (e.g. a `pm-auditor` note for an
  un-forwarded report) — not in this feature; the obligation is to *write and surface*, upstream
  routing is the PM's.
