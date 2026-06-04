# doc-migration-on-template-bump — plan-compliance review (Pass 1)

Protocol-spec / agent-prompt feature. No runtime, no executable tests by design (repo "no automated tests by design" constraint — `doc/architecture.md` § Architectural constraints); validation is editorial, per the `pm-product-advocate` / `legacy-reader-role-split` precedent. Scenario subjects are non-human (the audit process / `pm-auditor` / the orchestrator) → product-readiness gate is N/A; this repo is the documented no-Product-Contract exception.

## Plan compliance

**Scenarios**
- ✓ S1 Version-keyed expectations manifest exists — `### Expected-discipline manifest` added in `MIGRATIONS.md` (sibling to `### Pending-migration detection`), single-source preamble + `####`-per-discipline encoding (arch §1 Variant B), seeded with the 3 disciplines (populated threat-model lifecycle, foundational user-journeys, value-first product story). Each entry carries `Introduced in:` / Applicability / Satisfied-check / Question-source. `MIGRATIONS.md:30-52`.
  - `Introduced in:` versions all trace to CHANGELOG.md (no `[?]` guesses): threat-model **v2.13** (`[2.13.0]` "Adds a full threat-model lifecycle"); journeys **v2.16** (`[2.16.0]` "ownership of docs/user-journeys.md is consolidated under pm-architect"; v2.15 readiness-gate corroboration also accurate); product-story **v2.3** (`[2.3.0]` "docs/product.md as authored PM front door"; v2.6/v2.9 sub-notes corroborated). Verified.
- ✓ S2 Single-source holds — the three `####` discipline headings appear ONLY in `MIGRATIONS.md` (grep confirmed). `WORKFLOW.md:375`, `pm-auditor.md:135`, `pm-audit.md:104` reference `### Expected-discipline manifest` BY NAME; `pm-auditor.md:135` explicitly states "never re-list the disciplines or their checks here." The `doc/architecture.md:160+` mention lists the three disciplines as a descriptive decision record, not a re-encoded check — acceptable narrative.
- ✓ S3 Presence-only, no prose-policing — manifest preamble (`MIGRATIONS.md:33`) and each satisfied-check phrased as positive-presence-of-a-gap (`<placeholder>` / empty table / skeletal funnel); `pm-auditor.md:139` "Presence-only — never prose-police… a populated-but-'weak' artifact is satisfied (silent). The PM owns meaning."
- ✓ S4 `/pm-audit` remediation via existing loop — `pm-audit.md:104-107` adds the semantic-discipline-gap remediation (entry #7) walking fix-now / next-sprint / accept-with-context; on fix-now the orchestrator relays the discipline's foundational questions in one `AskUserQuestion` (by-name source) → spawns `pm-architect`; "No `pm-product-advocate` spawn"; accept-with-context → `.ai-pm/backlog.md`, not re-raised.
- ✓ S5 Run `/pm-audit` after a bump — `WORKFLOW.md:375` (§ Maintenance, right after the `git submodule update --remote` bump flow): "After the bump, run `/pm-audit` — the same sweep… now also runs the semantic discipline sub-check (`### Expected-discipline manifest`…)."
- ✓ S6 Idempotent + proportional — `pm-auditor.md:136-138`: not-applicable → silent; applies + satisfied → silent ("idempotent: a project that already satisfies the discipline produces zero findings on re-run"); only applies + unsatisfied → note. No new state file (deferred per Out of scope).
- ✓ S7 Subsumes "product story fell behind" — realized as the journeys manifest entry; `MIGRATIONS.md:46` states "This generalizes the epic's 'product story fell behind' note — 'N substrate features shipped while user-journeys.md is still skeletal' is exactly this entry unsatisfied." Not a separate one-off check.

**Contracts (protocol-internal; repo no-contract exception)**
- ✓ Expectations manifest — `### Expected-discipline manifest`, `MIGRATIONS.md`, `####`-per-discipline, satisfied-checks as positive-presence-of-a-gap, by-name question sources, seeded with the 3 real disciplines, disjoint from `### Pending-migration detection`. Matches arch §1/§2.
- ✓ `pm-auditor` semantic-discipline-gap check — placed as a SUB-CHECK inside `### 5. Docs currency` (`pm-auditor.md:135`, a bullet after the `docs/threat-model.md` block, before the closing two-consecutive-audits escalation line 142), NOT a sixth `###` dimension (arch §3 Variant B). Reuses the dimension-1 human-role-subject extraction explicitly ("do not re-extract", line 137); inherits the note-default + two-consecutive-audits→blocking escalation for free.
- ✓ `/pm-audit` remediation type — remediation entry #7 in `pm-audit.md`; orchestrator-relays-directly, no advocate spawn (arch §4). Matches.

**Disjointness / Interaction scenarios**
- ✓ DISJOINT from `### Pending-migration detection` — the diff adds the manifest as a sibling; the `### Pending-migration detection` heading and all its structural conditions (`_index.md` / signature line / `Guarantees:` / Russian headers / `## What it does` / wire-token / unstamped review) are UNCHANGED (diff shows additions only, no `-` lines touching that block). Disjointness asserted in the manifest preamble (`MIGRATIONS.md:33`) and arch §1. No double-flagging.
- ✓ Not-applicable → silent; already-satisfied → silent; accept-with-context → backlog and not re-raised — all encoded in `pm-auditor.md:136-138` + `pm-audit.md:107`.
- ✓ Scope binding (full vs diff) settled per arch §3 (whole-project-state check → full scope; skipped in diff), consistent with dimension 5.

**Categorical coverage**
- ✓ The feature covers the SEMANTIC migration kind; the sibling MECHANICAL/structural kind (`### Pending-migration detection`) is explicitly Out of scope and untouched. Manifest "which others qualify" (arch §1) lists the three seeded and gives one-line reasons for excluded candidates (Behavioral-contract heading = structural; `SCn` IDs = cross-ref consistency already owned). Full set addressed.

**Out-of-scope guardrails honored**
- ✓ No new command / agent — `pm-auditor.md` and `pm-audit.md` are modified existing files; new files are only artifacts (arch, research, plan). No `.claude/settings.json` change (not in diff). No hook added; `tests/hooks.sh` 71/71.
- ✓ No committed state file (deferred); no auto-apply without PM (every fill goes through fix-now / accept-with-context).
- ✓ `doc/architecture.md:158+` records the decision — framed as the semantic complement to the mechanical `### Pending-migration detection` and as the generalization of the epic's "product story fell behind" note (the four-part shape, why-this-shape, key properties, family placement, with source + commit trail).

## Definition of Done
- [x] All plan scenarios implemented (7/7) — coverage verified editorially (no executable tests by design)
- [x] Interaction scenarios covered — no-double-flag / not-applicable-silent / satisfied-silent / accept-with-context-suppressed / scope-binding all encoded; non-runtime spec, no concurrent-state test applies
- [x] Stack expectations respected — plan declares "None" (no agent frontmatter / library / hook / schema change); no `docs/stack-notes.md` component touched; no stack-spec test applies
- [n/a] Product Contract — no Product Contract touched (repo documented exception; non-runtime protocol-spec change)
- [x] Pipeline green — `tests/hooks.sh` 71/71; no lint/validator beyond hooks for a prose change
- [x] State file updated — `.ai-pm/state/current.md` records the task, coded status, the 5 landed docs, and the post-coding handoff
- [x] Product Impact Report — n/a (no contract touched)
- [x] Docs updates landed — all 6 "Docs to update" entries present in this branch (MIGRATIONS.md, pm-auditor.md, pm-audit.md, WORKFLOW.md, doc/architecture.md, README.md)
- [x] Expected artifacts exist — plan, research, arch note, and this review present; no contract required (non-user-facing repo exception)
- [n/a] Product-readiness gate — non-human scenario subjects (the audit process / pm-auditor / orchestrator); user-facing gate exempt with no special-casing

**DoD: pass**

## Blocking

None.

## Notes (product)

1. The architecture commit (`a940508`) landed the `doc/architecture.md` decision record, but `.ai-pm/state/current.md` (written at `d14f451`, earlier) still lists that record under "Remaining — POST-coding pm-architect handoff." Not a compliance gap — the doc is present, which is what DoD item 8 requires — but the state file's "Remaining" line is now stale by one commit. Why it matters: a reader trusting `current.md` would think the architecture record is still pending. Worth a one-line state refresh before ship. (Routes to coder — minor; non-blocking.)
2. The branch's `.ai-pm/backlog.md` diff adds two PM observations recorded during the planning session (agent-handoff durability; state-archive committed-home) that are unrelated to this feature's implementation. They are planning-session bookkeeping, not scope creep in the implementation — but they ride this feature's branch rather than landing independently. Why it matters: the PM should be aware these two follow-ups are now coupled to this PR's merge; if either warrants separate triage, note it. (Scope observation for PM — not a defect.)

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass 2 (`code-review`, high effort, prose-protocol: 2 targeted finders — manifest
false-positive risk + consistency/disjointness). One **material design finding**; the rest
are subsumed by its fix.

1. **(material) The new "Expected-discipline gap" sub-check duplicates existing dimension-5
   detection for all three disciplines — double-flagging + redundant detection.** The
   net-new value of the feature is the **PM-collaborative remediation** (relay the
   discipline's foundational questions → `pm-architect` authors), but the implementation also
   added a **parallel detection** sub-check that overlaps what dimension 5 already detects:
   - **threat-model:** the manifest satisfied-check ("Assets/Threats no `<placeholder>` AND
     Threats ≥1 row") is **verbatim** the existing `docs/threat-model.md` skeleton check,
     which already fires **blocking**. The new entry would add a **note** on the same
     condition → double-flag. (The coder's "rides that existing rule" prose acknowledges it
     but does not stop the second emission.)
   - **journeys:** existing "Missing journey for an implemented user-facing feature → note"
     vs new "≥1 user-facing feature AND no populated journey → note" → overlapping double-note.
   - **product-story:** existing "`product.md` missing/empty/no-funnel → note" vs new entry →
     overlap on the missing/empty case.
   *Failure scenario:* a security project with a skeleton threat-model is reported **twice**
   (blocking + note); a project with user-facing features and skeletal journeys gets two
   notes for one gap. *Root cause:* the feature added parallel **detection** where dimension 5
   already detects; only the **remediation** (foundational-question relay) is genuinely new.
   *Recommended fix (reshapes the feature — taken to the PM):* drop the duplicate detection
   sub-check; keep `### Expected-discipline manifest` reframed as a **question-source +
   introduced-in registry** (no re-detection); move the net-new value — relay the discipline's
   foundational questions → `pm-architect` authors — onto the **existing** dimension-5
   findings' remediation (enhance them in `pm-audit.md`, do not add a parallel detector).
   "Run `/pm-audit` after bump" stays (the existing checks surface the gaps; the enhanced
   remediation drives the PM-collaborative fill).

**Subsumed by the fix** (would-be findings on the parallel detector, moot once it's dropped):
manifest "placeholder text" / "non-empty table" phrasing ambiguity (false-positive on
half-stubbed content); the threat-model question-source being less crisply named than the
foundational-question tiers; the `Введ in vN`-predates-project nag (handled by the existing
accept-with-context suppression). The this-repo dogfood case is **not** a current bug
(zero user-facing features → not applicable → silent; verified).

## Code review: NOT YET RUN
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
