# automode — plan compliance review (Pass 1)

Software-kind meta-feature (prose-spec / agent-prompt) on the no-user-facing-contract template repo. Every scenario subject is the orchestrator / pipeline / agents / files (non-human) → NOT user-facing. Verification = editorial walkthrough + clean-grep, per the plan's Test plan. `tests/hooks.sh` re-run: **71/71**.

## Plan compliance

Scenarios (all 10):

- ✓ **S1 Project-wide autonomous resolution from cited canon** — WORKFLOW.md `### Decision authority` (derivability test, `auto` `## Resolutions` entry with cited passage committed before acting) + Step 3.5 autonomous branch (WORKFLOW.md:124–131). Verified editorially.
- ✓ **S2 Per-feature autonomous on a manual project** — `pm-plan.md:214` optional `Decision authority:` override line + WORKFLOW.md:272 effective-authority order (plan line is the top rung). Verified.
- ✓ **S3 Escalate the cap (not-derivable / security-surface / PM-marked irreversible)** — WORKFLOW.md "Escalate-regardless cap" + "never confabulates … no canon passage ⇒ no auto-decision"; empty escalation set ⇒ fully silent (WORKFLOW.md:128–130, :281–289). Verified.
- ✓ **S4 Announce-before-act, advisory veto window** — WORKFLOW.md "Announce-before-act" line ending `(proceeding — interrupt to override)` + "Advisory veto window — recorded, NOT enforced as a countdown in v1" (WORKFLOW.md:287, :291). Verified.
- ✓ **S5 Effective-authority order + back-compat** — WORKFLOW.md:259 (`absent file OR unrecognized ⇒ interactive`) + :272 (resolution order); mirrors `### Project kind`; no migration. Verified.
- ✓ **S6 Merge/ship stays with the PM (both scopes)** — WORKFLOW.md:293 + PM-talk rider :501 ("I never auto-merge; merge/ship stays manual in both scopes"). No autonomous path reaches `pm-pr-prep`/merge. Verified.
- ✓ **S7 Change authority mid-flight** — WORKFLOW.md:295. Verified.
- ✓ **S8 Anti-confabulation guard load-bearing (both backstops)** — `pm-plan-checker.md:88` (DoD path) AND `pm-auditor.md:77` (dimension 1); both presence-keyed / shape-not-meaning; both state the `gaps: N` ↔ N-resolutions count check is unchanged and the new check fires only on `auto` entries. Verified.
- ✓ **S9 Categorical coverage** — enum `autonomous | interactive` is the full set; both branches specified; excluded siblings (Blocking veto-window mode, Auto-merge/auto-ship, Calibrated numeric confidence thresholding, plus Hard countdown timer) each listed under Out of scope with a one-line reason (plan:92–97). Verified.
- ✓ **S10 The advocate agent is unchanged** — `.claude/agents/pm-product-advocate.md` byte-unchanged (not in diff). Markers/citations live in the orchestrator-owned `## Resolutions` trail. Verified.

Existing behaviors this feature touches (must-not-break):

- ✓ Step 3.5 interactive branch byte-unchanged — WORKFLOW.md:131 ("The interactive branch above is byte-unchanged … This autonomous path is purely additive").
- ✓ Advocate `## Resolutions` trail (Edit-ownership second carve-out) — still orchestrator-owned, count-matched; entries gain `auto` | `escalated` marker; `clean` still needs no trail (WORKFLOW.md:40).
- ✓ `pm-plan-checker` DoD item & `pm-auditor` dimension 1 — count-check unchanged; citation sub-check additive, fires only on `auto`.
- ✓ `### Project kind` single-source pattern mirrored; value-vs-semantics split documented (dedicated `.ai-pm/decision-authority.md` for the flip-often value).
- ✓ `/pm-bootstrap` — one neutral Q8 (default interactive, states the merge cap) + writes `.ai-pm/decision-authority.md`; absent answer / older bootstrap ⇒ no file ⇒ interactive (pm-bootstrap.md:70, :84).
- ✓ Step 6 ship gate + "How to talk to the PM" — unchanged for interactive; autonomous rider inserted before a fork would be raised, never touches merge authority.

Clean-grep verification (the blocking ones from the arch note):

- ✓ **Single source / no re-encoding** — the enum + `absent file OR unrecognized ⇒ interactive` default are encoded only in `### Decision authority` (WORKFLOW.md:259, :299). Consumers (`pm-bootstrap.md`, `pm-plan.md`, `pm-plan-checker.md`, `pm-auditor.md`, Step 3.5, PM-talk rider) reference it **by name** and explicitly disclaim re-encoding ("do not re-state/re-encode them here"). `doc/architecture.md` is the decision record (allowed rationale restatement, references the subsection by name). No consumer hard-codes the enum/default as the operative rule.
- ✓ **Back-compat** — no consumer treats an absent file / unrecognized `mode` as anything but interactive; WORKFLOW.md:259 + pm-bootstrap.md:84 + arch.md:206 all state "no consumer may require the file to exist"; no existing artifact gains a required field; `MIGRATIONS.md` untouched; `CLAUDE.md.tmpl` untouched.
- ✓ **Timer honesty** — "recorded, NOT enforced as a countdown in v1" caveat present at the single source (WORKFLOW.md:291), with "console line must never render a live countdown." Announce template ends `(proceeding — interrupt to override)`, not a timer.
- ✓ **Interactive path byte-unchanged** — WORKFLOW.md:131; autonomous path strictly additive.
- ✓ **Merge stays manual** — no autonomous path reaches `pm-pr-prep`/merge without Step 6 (WORKFLOW.md:293, :501).
- ✓ **Untouched files** — `pm-product-advocate.md`, `CLAUDE.md.tmpl`, `MIGRATIONS.md`, hooks: none in diff.
- ✓ **`tests/hooks.sh`** — 71/71 passed.

## Definition of Done
- [x] All plan scenarios implemented and (editorially) verified — prose-spec feature, "no automated tests by design"; verification is editorial + clean-grep per the plan's Test plan
- [x] Interaction scenarios have concurrent-state tests — n/a: plan declares `Provably isolated` (prose-spec only, no runtime / shared state / concurrency / I/O); the one cross-artifact coupling is sequential within a single pipeline
- [x] Stack expectations respected; stack-spec tests pass — n/a: no stack component touched (no "Stack expectations touched" section required)
- [n/a] Product Contract honored; Acceptance checks pass; no silent behavior change — **no Product Contract touched**: every scenario subject is non-human (orchestrator / pipeline / agents / files); meta-feature on the documented no-user-facing-contract template repo
- [x] Pipeline green — `tests/hooks.sh` 71/71 (the one executable suite); feature touches no hook
- [x] State file updated — `.ai-pm/state/current.md` reflects `automode` planning, revised design, branch
- [x] Product Impact Report present (when contract touched) — n/a: no contract touched
- [x] Docs updates landed — WORKFLOW.md (`### Decision authority` + Step 3.5 branch + PM-talk rider + Edit-ownership marker note), pm-bootstrap.md, pm-plan.md, pm-plan-checker.md, pm-auditor.md, README.md, doc/architecture.md all present in this branch (every "Docs to update" entry landed)
- [x] Expected artifacts exist — plan (`doc/features/automode_plan.md`), this review; no contract (non-user-facing)
- [n/a] Product-readiness gate resolved — **non-user-facing** feature (every scenario subject is the system / pipeline / agents / files); advocate artifact not required, exempt with no special-casing
- [n/a] Validation gate resolved — **software-kind** project (no `## Project kind: documentation` line ⇒ `software`); Pass-2 is `code-review`, not a `## Validation` stamp; this review file emits no `## Validation` section

**DoD: pass**

## Blocking
None.

## Notes (product)
None. (No user-visible behavior, no scope expansion beyond the plan: the diff is confined to the files the plan's "Docs to update" enumerates, plus the plan/research/arch/state artifacts. No structural wire-token concern — there is no Product Contract; the new spec keys `mode` / `veto-window-seconds` are the protocol's own single-sourced vocabulary, not a PM-facing contract section.)

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass 2 (`code-review`, high effort, prose-protocol: 3 targeted finders — single-source
coherence / back-compat / wiring completeness). Two finders confirmed clean (zero defects);
the back-compat and wiring-completeness sweeps verified every load-bearing requirement is
wired (timer-honesty caveat at the single source + no live countdown; file-not-required;
citation guard fires only on `auto` entries in both backstops; merge stays manual in both
scopes; the autonomous Step 3.5 branch announce→derive-or-escalate with empty-set-silent; all
three escalate-regardless triggers; two scopes / one engine).

**Considered, not surfaced (1 — refuted):** the single-source finder flagged `pm-bootstrap.md`
Q8 (`Default interactive if the PM skips`) + the `.ai-pm/decision-authority.md` write step
(`default interactive` / `absence elsewhere ⇒ interactive`) as re-encoding the default. Refuted:
it is **byte-identical to the established `### Project kind` bootstrap precedent** (Q0,
`pm-bootstrap.md:50`/`:74`: `default software if unanswered` + by-name reference + "do not
re-state them here"), which the plan and arch note explicitly mandated mirroring. The "(default
…)" phrasing is the bootstrap question's own UX behaviour (what to write when the PM abstains),
not a second *operative* copy of the consumption-time default — the canonical `absent ⇒
interactive` rule is referenced by name. Consistent with accepted convention, not a regression.

## Code review: 2026-06-04 — passed
<!-- Pass 2 clean: 0 confirmed findings (1 candidate considered + refuted as matching the
     `### Project kind` bootstrap precedent). tests/hooks.sh 71/71. -->
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
