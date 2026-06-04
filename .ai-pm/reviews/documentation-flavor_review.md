# documentation-flavor — plan-compliance review (Pass 1, re-run)

*Protocol-spec / agent-prompt feature on the ai-pm-protocol template repo. No runtime, no executable tests by design (repo "no automated tests by design — validation by use"). This meta-feature is itself **software-kind** (every scenario subject is the bootstrap process / agents / files — non-human), so: Product Contract N/A (repo no-contract exception), product-readiness gate N/A, the new `## Validation` gate N/A to this feature. Verification is editorial + clean-grep.*

*Re-run after the single prior blocking (`MIGRATIONS.md` dangling "procedure below" self-reference) was fixed by `pm-coder` in commit `1d24201`. Per the re-run scope, only the blocking fix was re-verified; the rest of Pass 1 was already verified clean and is carried forward unchanged.*

## Plan compliance

Verified against the 8 Scenarios, 9 Key design decisions, and the 6 Architecture outcomes (Variant A ×6). All carried forward clean from the prior run; the back-compat remediation half (decision 9 / arch outcome 6) is now delivered, not merely promised.

- ✓ **Scenario 1 — Bootstrap asks `software | documentation`.** `.claude/commands/pm-bootstrap.md` Q0 reworded `software | process` → `software | documentation`; "Documentation-kind scaffolding" branch; references `### Project kind` by name, does not re-encode the default.
- ✓ **Scenario 2 — open deliverable in a dedicated location.** `WORKFLOW.md` `### Project kind` single-sources the fixed `deliverable/` directory (distinct from `docs/` and `.ai-pm/`); plan names leaf file(s); gates presence-keyed; no mandated section set. (Arch outcome 1.)
- ✓ **Scenario 3 — SOP is an optional starter.** `process.md.tmpl` `git mv`'d → `doc/_templates/starters/sop.md.tmpl` (clean rename, content/RACI/SIPOC preserved); reframed as opt-in starter. (Arch outcome 2.)
- ✓ **Scenario 4 — dev-docs apply, code-specifics inert.** Rider reworded `process` → `documentation`; tests/`code-review`/build inert; plan/journeys/contracts/threat-model/audit/state still apply; stack reframed "what/who/tools". Software change-type rows byte-unchanged.
- ✓ **Scenario 5 — validation fits the doc type.** WORKFLOW no-code validation discipline + `pm-plan-checker` + `pm-pr-prep` step 0 + `pm-auditor` dim 1 all carry the generalized `## Validation: NOT YET RUN → <date> — <method> — passed` stamp (method `dry-run` | `sign-off`, plan declares it); the v2.18 `## Dry-run` token is fully absorbed; the software `## Code review` path is byte-untouched. (Arch outcome 3.)
- ✓ **Scenario 6 — advocate finds documentation gaps.** `### Foundational product questions` tier enum `per-feature | bootstrap | documentation`; one general `documentation` tier; advocate/relay/backstops reused verbatim; reader/operator = human role fires the extraction. (Arch outcome 4.)
- ✓ **Scenario 7 — rename consistent.** Clean-grep confirmed: the only surviving `process`-kind match is the intentional `MIGRATIONS.md` detection anchor (now backed by a real procedure — see below). No `software | process` literal live; no live `## Dry-run`. Every consumer renamed. (Arch outcome 5.)
- ✓ **Scenario 8 — diagrams/images first-class.** WORKFLOW + pm-coder state diagrams authored (mermaid/ascii), raster images human-supplied and referenced, never fabricated; deliverable accommodates non-md. (Arch outcome 2.)
- ✓ **Decision 9 / Arch outcome 6 — back-compat airtight (remediation half NOW delivered).** Default extended to `absent OR unrecognized ⇒ software`; a stale `process` line falls safely to software AND is non-silently flagged AND the flag now resolves to a real procedure body. **RE-VERIFIED:** the `MIGRATIONS.md:28` detection anchor's "the `## Project kind: process` → `documentation` procedure below" reference now resolves to a matching procedure body at `MIGRATIONS.md:142` under `### Pending template-upgrade migrations` — sibling heading shape (`**<name> — <description>.**`), "Detection: see `### Pending-migration detection` above (a `## Project kind:` line carrying the literal `process` value)", "When it applies:" with numbered steps 1–3, and step 2 idempotency note ("Running the rename twice is a no-op"). Single-source preserved: the procedure references the condition by name, does not re-encode it. The detection+remediation pair is now complete — the prior blocking is resolved.
- ✓ **Decision 10 — no new surface.** Only the plan, the arch note, `guide.md.tmpl`, and `sop.md.tmpl` (renamed) move; no new command/agent/hook.
- ✓ **Categorical (decision 11).** Generalizes the `documentation` kind; sibling `software` is the unchanged default; the narrower `process` is folded in (SOP = one optional starter) — declared in Out of scope. Full set covered.
- ✓ **`guide.md.tmpl`** added (light reference skeleton; states reference-doc validation = `sign-off`).
- ✓ **`tests/hooks.sh`** → 71/71 green (re-confirmed this run).

## Definition of Done

- [x] All plan scenarios implemented and tested *(implemented; "tested" = editorial + clean-grep, the repo's no-automated-tests-by-design discipline)*
- [x] Interaction scenarios have concurrent-state tests *(protocol-spec; no runtime / shared mutable state — the load-bearing interaction is the clean-grep, which passes)*
- [x] Stack expectations respected; stack-spec tests pass *(markdownlint structural pre-gate is the only stack expectation; no structural changes that would trip MD022/MD032; `tests/hooks.sh` green)*
- [n/a] Product Contract honored *(no Product Contract touched — meta-feature on the no-contract template repo; backend/protocol-only)*
- [x] Pipeline green *(`tests/hooks.sh` 71/71, re-confirmed)*
- [x] State file updated *(`.ai-pm/state/current.md` reflects documentation-flavor)*
- [n/a] Product Impact Report present *(no contract touched)*
- [x] Docs updates landed *(all "Docs to update" entries present: WORKFLOW, bootstrap, templates demote+add, CLAUDE.md.tmpl, the 4 agents, README, MIGRATIONS, architecture)*
- [x] Expected artifacts exist (plan, this review; no contract — repo exception)
- [n/a] Product-readiness gate resolved *(software-kind meta-feature — scenario subjects are the process/agents/files, non-human; advocate does not fire)*
- [n/a] Validation gate resolved *(the new `## Validation` gate is documentation-kind only; this meta-feature is software-kind, so its own Pass-2 is `code-review`, not `## Validation`)*

**DoD: pass**

## Blocking

None. The single prior blocking — the dangling "procedure below" self-reference at `MIGRATIONS.md:28` — is resolved by commit `1d24201`: the matching procedure body now exists at `MIGRATIONS.md:142`, in sibling style, single-source preserved, and the "below" reference resolves.

## Notes (product)

None. (Software-kind meta-feature, no PM-facing contract surface; no scope expansion. No structural wire-token concern: the protocol's own grammars — `## Project kind:`, `deliverable/`, `## Validation` — are the spec's vocabulary, not contract PM-section tokens.)

## Verdict

approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings

Pass 2 (`code-review`, high effort, prose-protocol: 2 targeted finders — rename/back-compat +
validation-stamp/tier/deliverable coherence). Both finders confirm the core is clean: no live
`process`-kind / `## Dry-run` survivors (only the intentional MIGRATIONS anchor+procedure);
back-compat `absent OR unrecognized ⇒ software` airtight; the `## Validation` gate is wired in
both pr-prep step 0 and pm-auditor dim 1 (presence-keyed, section-absence-exempt); software
`## Code review` path byte-unchanged; template move + MIGRATIONS pair coherent. One real theme to
fix — the validation **`<method>`** is under-specified — plus two minor prose-format fixes.

1. **(fix) The validation METHOD is under-specified end-to-end.** The `## Validation` stamp is
   `## Validation: <date> — <method> — passed` (method ∈ `dry-run` | `sign-off`) and WORKFLOW
   says "the plan declares it", but: (a) **WHERE** the plan declares the method is not stated, and
   there is **no default/inference** if it doesn't (a "create a guide" plan leaves it ambiguous →
   two pm-plan-checker runs could pick differently); (b) `pm-plan-checker` writes a born-loud
   `## Validation: NOT YET RUN` that **does not carry the intended method**, so the orchestrator
   could stamp the wrong method and the presence-keyed gate (`— passed`) accepts it silently.
   *Fix:* (i) in `WORKFLOW.md` `### Project kind` no-code-validation discipline, state that the
   **feature plan declares the method in its Test/validation section** (`dry-run` for actionable
   docs / `sign-off` for reference docs), with an explicit **default by doc type** when the plan
   is silent (actionable→dry-run, reference→sign-off; if still ambiguous the orchestrator
   picks/asks) — single-sourced there; (ii) `pm-plan-checker` reads that declared method and
   writes the born-loud marker **carrying the intended method** (e.g. `## Validation: NOT YET RUN
   — <method>`), so the method is pre-committed and a later mis-stamp is visible.
2. **(fix, minor) Stamp-format prose imprecise in the gates.** `pm-pr-prep.md` step-0 hard rule
   (~line 204) and `pm-auditor.md` dimension 1 (~line 57) describe the stamp as `<date> — passed`,
   but the `## Validation` format carries the method: `<date> — <method> — passed`. The grep
   (`:.*— passed$`) matches correctly, but the prose should show the full format (method ∈
   `dry-run` | `sign-off`) so a reader/auditor knows it. Tighten both lines.

**Considered, not surfaced:** the `documentation` tier name + enum (`per-feature | bootstrap |
documentation`) — verify it is spelled identically wherever referenced (a pre-emptive check, not
a confirmed defect). The N/A-answer phrasing for reference-doc tier questions is **not** a defect
— an `N/A — reference doc` resolution is still a recorded resolution; the count-match counts
entries, not phrasing.

## Code review: 2026-06-04 — passed

Pass 2 clean after fixes (`b3cc380`). Finding 1 (validation method declaration + default
single-sourced in WORKFLOW `### Project kind`; born-loud marker carries `— <method>`) and
finding 2 (stamp-format prose in pr-prep/auditor) fixed; the pre-emptive tier check turned up a
**real** `documentation`-tier enum mismatch in `pm-product-advocate.md` (listed only
`per-feature | bootstrap`) — fixed. Verified: tier enum consistent; no live `process`-kind /
`## Dry-run` survivors; back-compat airtight; software path byte-unchanged; `tests/hooks.sh` 71/71.
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
