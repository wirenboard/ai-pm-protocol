# ai-minimums-linter-wiring — design notes

## Context

The plan (`doc/features/ai-minimums-linter-wiring_plan.md`) makes the **AI-specific
minimums** (max-file 300 / max-fn 50 / cyclomatic ≤10 / no file-level suppressions /
new-code coverage ≥80%) **deterministically enforced by the project's real linter, run
every diff** — closing the DriveBox gap (#224: `cli.py` drifted to 331 lines because
nothing *ran* the 300-line rule; it was a `CLAUDE.md` / `architecture.md` *convention*,
AI-self-policed). This is the **deterministic half** of the #211
deterministic-enforceable-vs-AI-evaluated boundary, made real.

The structural fork the plan defers to arch-review (line 80): **who owns the new check
"the linter actually encodes the AI-minimums it declares"** — `pm-auditor` dimension vs
`pm-plan-checker` DoD vs `code-review` — and whether bootstrap or the coder writes the
linter config. The plan's own stake (scenario 3, line 15) is "extend the existing dim-9
validator-present-and-run discipline, not a new gate." This note verifies that the
existing discipline *can* absorb the check, finds its real home in the codebase, and
settles the four secondary questions.

This is a **meta-feature on the template repo** — markdown-prose, no linter to host the
minimums; it dogfoods the *discipline + the researcher role*, exercised on downstream
code projects. So "adjacent implementations" here are the protocol's own review/validator
mechanisms, not application modules.

## Adjacent patterns (where the dim-9 discipline actually lives today)

The plan refers to "reviewer dim 9" and "the validator listed in stack-notes must be
present in the Pipeline and actually run" as if it were a single numbered gate. The
codebase reality (mapped below) is that **"dim 9" is a logical name for a three-surface
mechanism**, not one owner — and that is exactly the shape the new check should reuse.

1. **The Pipeline rule — `doc/_templates/CLAUDE.md.tmpl` `## Pipeline`** — the *declaration*
   surface. The `<lint command>` line plus the `**Validators**` block (populated by
   `stack-researcher`, extended per feature). Its closing sentence is the canonical
   statement of dim 9: *"Reviewer dim 9 blocks if a validator listed in `stack-notes.md`
   is not present here, or if it is present here but not actually run by the coder."* The
   rule text lives **here**, once.

2. **The per-diff *run* — `pm-coder.md` step 7** — *"Every command in the Pipeline block
   must be green — tests, lint, **and every validator listed under `Validators`**. A green
   test + lint with a failing validator is still a failed pipeline."* This is where the
   linter (and therefore the AI-minimums, once encoded) actually **runs every diff**.

3. **The per-diff *check* — `pm-plan-checker.md` DoD** — line 71/118:
   `[ ] Pipeline (tests + lint + validators from CLAUDE.md) green`. This is the per-diff
   reviewer surface that **blocks** a diff whose pipeline (hence linter) is red. It asserts
   the run happened and was green — it does **not** today inspect *whether the lint config
   encodes the declared minimums*.

4. **The periodic surface — `pm-auditor.md` dimension 5 (Docs currency)** — already carries
   the structural-token / stack-notes-currency family of notes (lines 108–144). It is the
   audit-cadence home for "stack-notes says X, the artifact doesn't match" findings, and
   the natural home for the periodic "linter config doesn't encode the declared minimums"
   note (scenario 6: a downstream project flagged at next `/pm-audit`, never a forced
   rewrite).

5. **The Review typology registry — `WORKFLOW.md` `### Review typology`** (the single source
   for the review-type enum + each type's det/AI split, #211 applied concretely). The
   **per-diff** type's `deterministic-half` is *literally* defined as "lint/format on the
   diff" (line 329); the **smell** type owns cross-module duplication and accumulated cases,
   with its detection half a "named downstream/future path, not built" (lines 330, 337).
   This registry is the conceptual anchor for the whole slice and resolves Q3.

**Mapping of subscriptions/emissions (the dim-9 wiring, not event-driven but worth being
explicit):** `stack-researcher` *emits* the Validators table + (new) the AI-minimums→rule
mapping into `stack-notes.md` → bootstrap/coder *consumes* it to write `CLAUDE.md` Pipeline
+ the linter config → `pm-coder` *runs* the pipeline → `pm-plan-checker` *checks* it green
per-diff → `pm-auditor` *re-checks encoding* periodically. The new check inserts at the
last two consumers; no new producer, no feedback loop (the linter config is the project's
own, run sequentially in its own pipeline — confirmed isolated in the plan's interaction
scenarios).

## What is settled (no variant needed)

- **Q2 — three-layer single-source holds.** Values live **once** in `architecture.md`
  `### AI-specific minimums` (the numbers); `stack-notes.md` carries the **per-stack
  mapping** (each minimum → the concrete rule that enforces it, researcher-cited with the
  linter's doc URL); the **linter config is the enforcement**. The drift risk is real and
  named: the linter config literally contains `max-module-lines=300`. **This is an
  acceptable enforcement *encoding*, not a forbidden re-declaration** — by the same
  principle the plan and the wider protocol already use for threat→`SCn` and
  journey→Behavioral-contract: the *single authoritative statement of the value* is in
  `### AI-specific minimums`; the config is a **downstream mechanism that carries the same
  number to enforce it**, the way a `pylint` config or a CI gate carries a value the doc
  owns. Kept in sync by the same wiring that owns every other declared/enforced pair: the
  stack-notes mapping is the named bridge (it says *which rule carries 300*), and the new
  reviewer/auditor check is precisely what catches the config drifting *off* the declared
  number. **Distinction to hold in the prose:** the config may **contain** the number (to
  enforce); it must **not become a second place a reader is told what the minimum *is*** —
  no second prose authority, no "the max file size is 300" comment that competes with
  `### AI-specific minimums`. The number-in-config is an enforcement parameter, not
  documentation.

- **Q3 — honest partial (#211) is the right altitude, no silent gap.** Recording a
  linter-inexpressible minimum (per-file-length on a stack whose linter lacks it,
  cross-file duplication) as **convention-only + AI-backstopped, explicitly** is correct,
  and it does **not** leave a silent gap *because the typology already owns the backstop by
  name*: cross-module duplication is the **smell type's** territory (`### Review typology`,
  WORKFLOW.md line 330 — "cross-module duplication" / "accumulated cases a single diff's
  lint can't"), and the per-diff AI semantic review is the per-diff type's AI half. The
  mapping must **point at** the smell type for the unexpressible-duplication case rather
  than re-describing the backstop — tie by name (`### Review typology` smell type), the
  same reference-don't-duplicate discipline. The #211 honesty is: deterministic covers
  *most* minimums on *common* stacks; the named AI halves cover the rest; nothing is
  dropped, everything has a stated owner.

- **Q4 — bootstrap wiring: researcher maps, the wiring step writes; protocol stays
  stack-agnostic.** `pm-stack-researcher` **produces the mapping** (its existing
  validator-documenting job, extended — it already writes the Validators table and cites
  per-component rules; the AI-minimums→rule mapping is the same kind of output, doc-URL
  cited). The **linter config itself is written by the bootstrap stack-setup step / the
  coder**, not by the researcher (the researcher is read-only on everything but
  `stack-notes.md` — hard rule, line 70; it cannot and must not write config). `/pm-bootstrap`
  should **not hardcode** `pylint`/`eslint` rule names — those appear **as examples only**;
  the concrete rules come from the researcher's per-project mapping. This keeps the
  protocol stack-agnostic (the plan's "Out of scope" line 79 rejects hardcoding per-stack
  rules; honor it — examples illustrate, the researcher derives). **Recommended split:**
  researcher → mapping in `stack-notes.md`; bootstrap/coder → `CLAUDE.md` Pipeline line +
  the linter config from that mapping; reviewer/auditor → verifies the encoding.

- **Q5 — decision record in `doc/architecture.md`: yes.** This lands a durable
  cross-cutting discipline (the deterministic half of #211, sharpened by #224), changes
  the `pm-stack-researcher` job, the bootstrap step, and a reviewer/auditor check — exactly
  the "architectural decision landed via a feature plan" trigger. Record it: AI-minimums
  deterministically linter-enforced; per-stack mapping = `pm-stack-researcher`; honest
  partial for unexpressible minimums (ties to `### Review typology` smell type); single-
  source preserved (numbers in `### AI-specific minimums`, config enforces). Cite the plan
  + #211 + #224. (pm-architect post-coding handoff, per plan line 70.)

## Variant A: extend the per-diff *and* periodic surfaces, mirroring dim-9 exactly (recommended)

- **Where:** the *check* lands as a **two-cadence extension of the existing dim-9
  mechanism**, exactly mirroring how "validator present + run" already lives on two
  surfaces:
  - **Per-diff** — `pm-plan-checker` DoD: the existing `Pipeline ... green` line already
    forces the linter (hence the encoded minimums) to **run and pass** every diff. The
    new sub-clause is *encoding presence*: the lint config must **encode** the AI-minimums
    it declares (not merely run a default lint). Phrase it as a one-line extension of the
    existing Pipeline-green DoD item / its supporting note, **not** a new checklist gate —
    "lint encodes the AI-minimums per `stack-notes.md` mapping" is part of "validators from
    `CLAUDE.md` are present + run," because the AI-minimums rules *are* validators in the
    Pipeline block once wired.
  - **Periodic** — `pm-auditor` dimension 5 (Docs currency): a non-blocking **note** when a
    downstream project declares the minimums but the lint config doesn't encode them
    (scenario 6 — additive, PM opts in, never a retroactive forced rewrite). This is the
    same shape as the existing stack-notes-currency notes already in dimension 5.
- **Relation to adjacent:** **symmetric** with dim-9. dim-9 = "the validator listed in
  stack-notes is present in Pipeline + actually run"; the new check = "the AI-minimums
  rules (a *kind* of validator) listed in the stack-notes mapping are present in the lint
  config + actually enforced." Same producer (`stack-researcher`), same per-diff run
  (`pm-coder`), same per-diff checker (`pm-plan-checker`), same periodic auditor
  (dimension 5). The single rule-text home stays the CLAUDE.md Pipeline sentence —
  extended in place to say the lint command must *enforce the AI-minimums*, not just run.
- **Pros:** reuses the exact existing discipline (the plan's stated intent, scenario 3 +
  line 80); no new gate, no new numbered dimension, no new vocabulary; both cadences match
  the existing validator discipline (per-diff catches the diff that crosses a minimum *the
  moment it does*; periodic catches an *un-wired* downstream project). Single rule-text
  home preserved. Honors #211 by living on the deterministic per-diff half the typology
  already names.
- **Cons:** the per-diff DoD line and the periodic auditor note must both be touched (two
  edits) — but that is the cost of matching the existing two-cadence shape, not added
  surface.
- **Risks:** the per-diff DoD must not be read as "re-verify the config every diff by
  hand" — it is "the pipeline ran and was green, and the config encodes the declared
  minimums." The *encoding presence* is really verified once at wiring + periodically by
  audit; the per-diff guarantee is the **run** (a diff that crosses a minimum fails the
  green pipeline). Keep that altitude in the wording or the per-diff reviewer is asked to
  do an audit's job every diff.

## Variant B: single-owner — `pm-auditor` dimension only (periodic), no per-diff DoD touch

- **Where:** the encoding check lives **only** in `pm-auditor` dimension 5 as a periodic
  note; `pm-plan-checker` is untouched (relies solely on the existing Pipeline-green DoD).
- **Relation to adjacent:** **asymmetric** with dim-9 — dim-9 is *both* per-diff and
  periodic; this would make the AI-minimums check periodic-only.
- **Pros:** smallest edit (one file); the periodic note is where the *un-wired downstream
  project* is actually caught anyway.
- **Cons:** **re-opens the DriveBox gap conceptually.** If the project *is* wired but a
  minimum is set wrong (config says `max-module-lines=400` while the doc says 300), only an
  audit catches it — diffs ship in between. The whole point of the slice is *per-diff
  deterministic enforcement*; periodic-only would deliver "eventually caught," which is the
  status quo the feature exists to fix. The per-diff guarantee is **free** here (the
  pipeline already runs the linter every diff — no new per-diff work, only the one-line DoD
  clarification that the lint must *encode* the minimums), so dropping it costs the slice's
  core value for no real saving.
- **Risks:** asymmetry with dim-9 invites future drift ("why is this validator-family
  checked only at audit?"); the plan's "extend dim-9" intent is best served by matching
  dim-9's two cadences, not half of them.

## Recommendation

**Variant A** — extend the existing dim-9 validator-present-and-run discipline across
*both* its cadences (per-diff `pm-plan-checker` DoD clarification + periodic `pm-auditor`
dimension 5 note), with the rule-text single-homed in the CLAUDE.md Pipeline sentence,
because that is the plan's explicit intent (scenario 3), is symmetric with the mechanism
it extends, and the per-diff half — the slice's whole reason to exist — is free since the
linter already runs every diff. **No new gate, no new numbered dimension.**

## Risks for the PM

1. **The "owner" is plural by design, and that is correct — don't collapse it to one
   agent.** The fork in Q1 ("pm-auditor dim vs pm-plan-checker DoD vs code-review") assumes
   a single owner exists to pick. The codebase reality is that dim-9 is *already* a
   two-cadence mechanism (per-diff `pm-plan-checker` + periodic `pm-auditor`), and the new
   check should mirror that. Picking only one would either re-open the DriveBox gap
   (periodic-only, Variant B) or lose the audit safety-net for un-wired downstream projects
   (per-diff-only). **`code-review` is not a third owner here** — it is the per-diff *AI
   semantic* half (the `code-review` skill / pass), which backstops *unexpressible*
   minimums (Q3), not the deterministic *encoding* check. Keep these distinct or the
   det/AI #211 boundary blurs.

2. **The number-in-config must stay an enforcement parameter, never a second documentation
   authority.** `max-module-lines=300` in a config is fine (enforcement); a comment or doc
   line *stating* "max file is 300" anywhere but `### AI-specific minimums` is the drift
   the slice must forbid. The clean-grep single-source check (plan Test plan) should guard
   *prose* re-statements of the values, and explicitly **allow** the value appearing as a
   config parameter — otherwise the grep either misses the real risk or false-positives on
   the legitimate encoding.

3. **Honest-partial must point at the smell type by name, not re-describe the backstop.**
   The unexpressible-duplication case is owned by `### Review typology`'s smell type
   (already shipped). The mapping should *reference* it, not paraphrase "the AI will catch
   duplication" — re-describing it creates a second, driftable statement of the smell
   type's job. Same reference-don't-duplicate discipline as threat→`SCn`.

4. **This repo can't dogfood the enforcement, only the discipline.** Markdown-prose, no
   linter — so verification is editorial + clean-grep (plan is explicit). The PM should
   expect the *real* test of this slice to be the first downstream code project's bootstrap,
   not this repo's CI. The proportionality note (plan line 59) must survive review: no
   linter config is forced on this repo.

5. **Plan is sound as written; no revision required.** The plan already defers exactly the
   two structural questions settled here (line 80) and lists the right docs to update
   (lines 65–70). One refinement the implementer should carry from this note: the
   `pm-plan-checker` / `pm-auditor` doc-to-update (line 69) should land as a **clarification
   of the existing dim-9 surfaces on both cadences**, not a new DoD line or a new auditor
   dimension — phrase it as "the AI-minimums rules are validators; the existing
   present-+-run discipline already covers them once the mapping wires them."
