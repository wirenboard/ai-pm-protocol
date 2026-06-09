# doc-frugality — plan

Decision authority: autonomous

Source: protocol-gap `.ai-pm/protocol-feedback/doc-frugality.md` + research synthesis `.ai-pm/protocol-feedback/doc-frugality_research.md`, grounded in live evidence (wb-mqtt-matter 119 files / 15,848 lines; nula 44 artifact files / 2.75× source). PM design session 2026-06-08/09: full-distillation chosen, `state-archive-home` to be superseded.

## Summary

Make the protocol a **distillation engine** with a small, continuously-compacted living reference, replacing the current append-and-accumulate model. Two axes: **per-file frugality** (lean, fact-first, current-state-only) and **file-count frugality** (O(1) artifact lifecycle — process evidence is distilled into the living reference, then evaporates; git is the incidental forensic backstop, not a curated archive). Justified by the keystone finding: human-readability and machine-readability are the same goal (Lost-in-the-Middle + F-pattern → front-loaded, short, chunked serves both).

**Builds on (shipped — referenced, not rebuilt):** two-layer contracts + token-lint (`contract-two-layer-token-lint`), product-map generation (`product-map-value-first`), WORKFLOW progressive-disclosure (`workflow-progressive-disclosure`), comment-restraint template + Semgrep (`comment-restraint`), template-inert (`template-dev-artifacts-inert`).

**Supersedes:** `state-archive-home` (PM decision — full distillation obsoletes the persist-archive-on-branch model; nothing to strand once evidence evaporates). **Absorbs:** the DRAFT `context-leanness` (unreviewed, arch-note-blocked — its targeted-reading intent is covered by the unified doc-style rule + auditor frugality dimensions here).

## Key design decisions

(resolved with `pm-architect`; full reasoning in `.ai-pm/arch/doc-frugality_arch.md`)
- **Graduation targets = a closed enum of 4** in `workflow/doc-style.md` (decision→architecture decision record; contract→`.ai-pm/contracts/` registry; deferred finding→backlog; stack rule→stack-notes), so both gates check one list. Both gates required — a **prevent/recover twin**: the pre-ship merge gate (D.13) fires while the dossier is on disk; the auditor git-aware check (C.9) is the only one that still works after it's gone. Mixed-project rule: **presence-in-any-durable-home satisfies graduation** → no false-block mid-migration.
- **Generated sections = in-file GENERATED-marker fences** (modelled on the shipped product-map generation procedure: source→overwrite-delimited-region, idempotent), guarded by a re-run-diff-clean check. `gen/generate.py` stays a byte-copy adapter generator — doc-derivation is a **separate** procedure, not bolted into it.
- **Rejected-variant reasoning survives as one terse line per alternative in the decision record** (PM decision); the verbose narrative evaporates to git. This is the single durable-content trade, accepted.
- **`state-archive-home` superseded at 6 loci**: `workflow/state.md:9`, `workflow/pipeline.md:99`, `doc/architecture.md:83` + `:509`, the pm-auditor (confirmed no-op — no dimension asserts archive presence), and a `MIGRATIONS.md` supersede entry.
- **Single-home split**: doc-style = frugality (structure/restraint); pm-comms `## Human-facing text legibility` = clarity (read-before-ship); `CLAUDE.md.tmpl` + Semgrep = realization. Comment-restraint's **definition** promotes to first-class in doc-style; template/Semgrep **realize** it (one-way, no redefinition — same wiring as AI-minimums→linter).

## Scenarios

Build order is **A → B → D → C → E** (D before C — the dossier model Slice D defines is what Slice C's graduation check verifies, so they co-design; per `.ai-pm/arch/doc-frugality_arch.md` §6). Each slice ships on its own sub-branch → review → merge-back into `feature/opencode-harness-support`. Scenarios grouped by slice (labelled A–E by content, not build order).

### Slice A — Unified durable-text frugality discipline (single home)
1. When `pm-architect` / `pm-stack-researcher` / `pm-coder` author any durable human-facing text (a doc section, a code comment, a commit message), they apply one named discipline from `workflow/doc-style.md`: **fact-first/BLUF** (the section opens with the statement that breaks if violated), **current-state-only** (no "Supersedes"/"corrects-the-earlier"/process-narrative in the live artifact), **provenance = one-line pointer** (never an inline commit-hash/`.ai-pm/` block), **one-purpose-per-unit**, and **why-not-what + single-home** for comments (architectural invariant → its decision record; local non-obvious why → terse comment; what → readable code; never duplicated across homes).
2. When a decision changes, the author applies **supersede-don't-edit**: the current decision record is replaced in place by the new decision; the superseded one becomes a **one-line tombstone** (`ADR-N superseded by ADR-M (date) → <pointer>`), its body removed (git retains it). The live doc never accretes decision history. The decision record carries a terse **one-line-per-rejected-alternative** (`rejected X: because Y`) so a contested decision's reasoning survives lean and durable (ADR norm — Nygard Consequences / MADR Considered-Options); the verbose investigation narrative evaporates to git. (PM decision 2026-06-09; arch note §4 — the one durable-content trade the model makes, accepted.)
3. Comment-restraint is a **first-class protocol rule** (in `workflow/doc-style.md`, applying on every project), not only the `CLAUDE.md.tmpl` convention + optional Semgrep — so a generic project (no wb-skills wired) still carries it.
4. Numeric norms are **authoring targets + auditor smells, not merge-gates**, except a small hard-cap set that IS enforceable: README one-liner ≤120 chars, decision record ≤~2 screens, navigation list ≤7, top quality-goals ≤5.

### Slice B — Reviewer + checker enforce frugality
5. When `code-review` runs, it surfaces **doc-frugality** and **comment-restraint** as findings (over-commenting, what-not-why comments, trivial docstrings, inline rule-IDs, doc-bloat / buried-lede / inline-provenance) — not only the existing "stale/contradicting comment" check.
6. When `pm-plan-checker` runs on a plan that updates a standing doc, it blocks if the update violates a hard-cap (Slice A.4) — the few enforceable numbers, not the smells.

### Slice C — Auditor frugality dimensions + graduation gate
7. When `pm-auditor` runs (full scope), it reports a new **frugality dimension**: per standing doc — size, node-density, lost-in-the-middle risk, and **file-sprawl** (process-evidence files that should have evaporated). Structure-not-prose, consistent with the existing no-prose-policing rule.
8. When a doc's size dimension trips the **scale-guard** threshold, the auditor flags it for **shard** (split into on-demand sub-files — the same thin-core+on-demand pattern `workflow-progressive-disclosure` applied to `WORKFLOW.md`), and `pm-architect` performs the shard as a compaction remediation.
9. The auditor runs the **graduation check** (load-bearing): for every merged feature, the durable knowledge (decision, contract, deferred item) is present in the living reference — verified via **git-aware compliance** (reads git history + standing docs, not N per-feature evidence files). A feature whose dossier evaporated without graduating its durable bits is a **blocking** finding.

### Slice D — O(1) artifact lifecycle + distillation
10. A feature in flight carries **one transient dossier** `.ai-pm/features/<topic>.md` (plan + arch rationale + the merged review trail: plan-compliance + code-review + advocate sections). No separate per-feature plan / review / advocate / arch-note files.
11. On merge, durable knowledge is **distilled** into the living reference (decision → architecture decision record; contract → the contract registry; deferred finding → backlog; new stack rule → stack-notes); the dossier then **ceases to exist as a maintained file** (git retains it incidentally).
12. `.ai-pm/tmp/` is git-ignored; scratch never enters the committed tree.
13. The merge gate (pre-ship) blocks if graduation did not happen (the behavioral twin of C.9, caught at ship not just audit).

### Slice E — Aggressive generation + lean doc set + migration
14. The mechanical reference sections are **derived from source**, not hand-authored: module-map / file-layout from the source tree, dependency table from the package manifest (product-map already generated from contracts). `architecture.md` carries **only what code does not express** (decisions/why, constraints, trade-offs, state-model).
15. `doc/_templates/` ships the **lean standing-doc set** under one `docs/` home (mode-pure but lean: architecture, user-journeys, stack-notes [on-demand], product [front-door + contract registry + generated map], threat-model [conditional], thin index, README ≤100 lines), each carrying the doc-style guidance comment.
16. `MIGRATIONS.md` carries a **doc-frugality migration** for existing downstream projects (distill standing docs to lean form; collapse per-feature evidence to git per the distillation model; supersede the state-archive convention) — move/distill-not-delete, every guarantee preserved.

## Existing behaviors this feature touches

(from `doc/user-journeys.md` + shipped features — what must not break)
- **Gate / delegation integrity** (`workflow/enforcement.md`): the review trail still exists (now in the dossier in-flight, git after); a gate is still satisfied only by a fresh owning-agent spawn this turn. Distillation must not weaken the fresh-spawn rule or the evidence's existence.
- **Two-layer contracts** (shipped): the contract registry must preserve the two-layer split + token-lint; the PM layer stays product-language.
- **Progressive-disclosure** (shipped): the scale-guard shard reuses this exact pattern; the new doc-style rule must not contradict the existing targeted-reading Read-steps.
- **pm-comms `## Human-facing text legibility`** (shipped): the new `workflow/doc-style.md` is the deeper sibling; the lighter read-before-ship rule stays, doc-style references it, no duplication.
- **Auditor no-prose-policing** (shipped): the new frugality dimension stays structure-not-meaning (size/density/sprawl are measurable, not style-judgements).
- **Product Contract / advocate / plan-checker gates** (shipped): merging review+advocate into one dossier trail must keep both the `## Code review` and the advocate `## Resolutions` trails intact + count-matchable.

## Contracts

No Product Contract (process/internal feature — the "users" are the protocol's own agents + downstream developers; scenario subjects are the system/agents, not a human end-user → product-readiness advocate exempt). Surfaces in the product-map Infrastructure bucket.

## Stack expectations touched

- **This repo is markdown-prose** (no stack linter; verification = editorial + clean-grep + `tests/*.sh`) — per `CLAUDE.md`. Slices A–D are prose/persona/skill edits validated by clean-grep + the existing test suites.
- **Generator** (`gen/generate.py`, manifests → `.claude/`/`.opencode/` adapters): Slice E adds a derived-section generation step + regenerates personas (pm-architect, pm-stack-researcher, pm-coder, pm-auditor, code-review) from edited manifest bodies. Must keep `.golden` byte-identical where unchanged and the generator tests green.
- **Semgrep stack-idioms** (`doc/_templates/stack-idioms/python.md`, shipped by `comment-restraint`): Slice A/B reference these existing rules when promoting comment-restraint to first-class; do not re-author them.

## Interaction scenarios

(touches many agents/skills + the generated-adapter pipeline — not isolated)
- When the new `workflow/doc-style.md` ships **while** `workflow/pm-comms.md` `## Human-facing text legibility` exists: the two must be single-source-distinct (legibility = clarity/read-before-ship; doc-style = frugality/structure/restraint), referenced by name, no overlap or contradiction.
- When comment-restraint is promoted to first-class **while** the `CLAUDE.md.tmpl` convention + Semgrep rules exist: the protocol rule becomes the single home; the template + Semgrep become its realization, not a parallel definition (no drift).
- When the O(1) dossier model ships **while** `state-archive-home` is live: the supersede must be clean — `workflow/state.md` + `workflow/pipeline.md` Step 6 archive bullets are updated, not left contradicting.
- When Slice E generation runs **while** `pm-architect` owns `architecture.md`: the derived sections must have a clear owner boundary (generated = not hand-edited; pm-architect owns the judgment sections) so a regeneration never clobbers authored content and a hand-edit never lands in a generated section.
- When the auditor's git-aware compliance runs **on a project mid-distillation** (some features still as old per-feature files, some evaporated): it must handle both without false-blocking.

## Test plan

- Existing tests that must pass: **all** — `tests/hooks.sh`, `tests/generator.sh`, `tests/opencode.sh`, `tests/oc-plugin-unit.js`, `tests/core-delegation.sh`, `tests/neutral-prose.sh`, `tests/targeted-reading.sh`, `tests/ultra-absent.sh`.
- New tests:
  - `doc-style-single-home`: asserts `workflow/doc-style.md` exists, is in the WORKFLOW navigation map, and that pm-architect/pm-stack-researcher/pm-coder personas reference it by name (not re-encode it).
  - `comment-restraint-first-class`: asserts the comment-restraint rule lives in `workflow/doc-style.md` as a protocol rule (not only `CLAUDE.md.tmpl`), and that code-review's body lists comment-restraint as a gated aspect. **Non-vacuity**: removing the rule fails the test.
  - `supersede-dont-edit`: asserts the doc-style rule mandates tombstone-on-supersede for decision records and that the template/architecture guidance reflects it.
  - `auditor-frugality-dimension`: asserts `pm-auditor` body carries the size/density/sprawl/lost-in-middle dimension + the graduation check + git-aware compliance, and `pm-audit` skill lists the shard/compaction remediation.
  - `o1-artifact-lifecycle`: asserts the dossier model is documented (one `.ai-pm/features/<topic>.md`), `state-archive-home` is marked superseded where it lived, and `.ai-pm/tmp/` is git-ignored in the template.
  - `generation-derived-sections`: asserts the generator derives module-map/deps and that a regeneration is idempotent (re-run = no diff) and `.golden` stays byte-identical for unchanged manifests.
  - `lean-doc-templates`: asserts `doc/_templates/` standing-doc set carries the doc-style guidance + the README ≤100-line / ≤120-char one-liner shape.
- Stack-spec tests (per "Stack expectations touched"):
  - `generator-golden-parity`: Slice E regenerated adapters are byte-identical to `.golden` for unchanged inputs (the generator's existing contract).
- Interaction scenario tests (one per interaction above):
  - `doc-style-vs-legibility-distinct`: clean-grep — no rule appears in both `workflow/doc-style.md` and `pm-comms.md` `## Human-facing text legibility` (single-source).
  - `comment-restraint-no-drift`: the first-class rule and the template/Semgrep agree (reference, not duplicate).
  - `state-archive-superseded-clean`: no live text still asserts the persist-archive-on-branch model after supersede (clean-grep for the old assertion).
  - `generated-section-owner-boundary`: a marker delimits generated sections; a clean-grep asserts pm-architect guidance says "never hand-edit a generated section".
  - `audit-mixed-project`: (editorial scenario in the auditor body) the git-aware check tolerates a mixed old/new project.

## Docs to update

- `WORKFLOW.md`: add the `workflow/doc-style.md` row to the navigation map; consider one kernel one-liner ("authored durable text is reader-first: fact-first, current-state-only, provenance-as-pointer, distilled-not-accumulated"). (pm-architect owns; via post-coding handoff.)
- `doc/architecture.md` (this repo's own): record the distillation-engine model + the supersede of `state-archive-home` + the generated-vs-authored section boundary as decisions. (pm-architect.)
- `doc/user-journeys.md`: the orchestrator/agent journeys that change (author-lean, distill-on-merge, shard-on-scale-trip). (pm-architect.)
- `MIGRATIONS.md`: the doc-frugality migration + the `state-archive-home` supersede entry + `### Pending-migration detection` extension. (pm-architect / via the migration slice.)
- `.ai-pm/state/current.md`: track this feature.

## Out of scope

- **Already-shipped pieces** are NOT re-built — only referenced: two-layer contracts + token-lint, product-map generation, WORKFLOW progressive-disclosure, comment-restraint template + Semgrep, template-inert. (Slice A only *promotes* comment-restraint to first-class + gated; it does not re-author the template/Semgrep rules.)
- **Retrofitting downstream projects** (wb-mqtt-matter, nula) to the lean/O(1) model — that is each project's own migration run (Slice E ships the migration *machinery*; running it on a given project is separate, PM-initiated work there).
- **Sibling durable-text surfaces not in scope this feature:** none deferred — the unified discipline deliberately covers the full set (docs + code comments + commit messages) as one family; that completeness is the design, not a categorical narrowing.
- **PM-comms "elevate architecture" stance** (the AI actively teaching architecture / growing the PM's architectural expertise) — a related but separate pm-comms/role-philosophy gap, flagged in the gap report, its own future feature. This feature ships the enabling precondition (lean, holdable docs), not the stance change.
- **Prose-policing / style grading by the auditor** — explicitly excluded; the frugality dimension stays structure-not-meaning (size/density/sprawl), honoring the shipped no-prose-policing rule.
