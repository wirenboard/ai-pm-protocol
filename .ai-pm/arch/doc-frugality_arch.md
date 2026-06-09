# doc-frugality — design notes

## Context

The protocol becomes a distillation engine (gap `.ai-pm/protocol-feedback/doc-frugality.md`, research `…/doc-frugality_research.md`). Five structural choices need resolving before coding; the slices (plan scenarios 1–16) span prose/persona edits (A–D) and the generator (E). This note maps the choices — it does not re-describe the plan.

Self-dogfood note: this repo uses `doc/`, not `docs/`; `pm-architect`'s own canon is `doc/architecture.md`. Downstream projects use `docs/`.

---

## 1. Distillation-engine model — the durable/transient boundary (the load-bearing risk)

The single rule: **durable knowledge graduates to a named living-reference home; process evidence evaporates (git is the incidental forensic backstop, never a curated archive).** Define the boundary by *kind of fact*, not by file.

**Durable (graduates — exactly four targets):**

| Durable fact | Graduation target | Form on arrival |
|---|---|---|
| An architectural decision | `docs/architecture.md` `## Architectural decisions` (a decision record) | current-state-only block; supersede-don't-edit (§4) |
| A product contract | `.ai-pm/contracts/<feature>.md` (the contract registry) + projected into the generated `docs/product-map.md` | two-layer, token-lint-clean (shipped — unchanged) |
| A deferred finding / accepted tech-debt | `.ai-pm/backlog.md` | one orchestrator-written line |
| A new stack rule / idiom | `docs/stack-notes.md` | distilled rule + one `Source:` pointer line |

**Process (evaporates):** the plan narrative, the arch rationale, the plan-compliance trail, the code-review trail, the advocate gap-report + `## Resolutions` reasoning — everything that justified *getting to* a decision rather than the decision itself. These live in the one transient dossier `.ai-pm/features/<topic>.md` (D.10) in flight, then cease to be a maintained file on merge (D.11). Git retains the bytes; nothing re-reads them as canon.

**Failure mode if graduation is skipped:** the dossier evaporates carrying the only copy of a durable bit (a decision never written into `architecture.md`, a deferred finding never backlogged). Result is silent knowledge loss — the exact "просто дописывает новый кусок" inverse: instead of bloat, a hole. This is *worse* than the current append model, because the append model at least keeps the bit somewhere readable. **Graduation is therefore the precondition that makes evaporation safe** — distillation without an enforced graduation gate is a regression, not a fix.

**Both gates are required (plan C.9 + D.13) — they are a behavioral twin, not a redundancy:**

- **Pre-ship merge gate (D.13)** — fires *before* the dossier evaporates, on the same Step 6 path that today archives state. Cheapest place to catch a miss: the dossier is still on disk, so "did each durable bit land in its home?" is a direct in-flight comparison. This is the *prevent* half.
- **Auditor git-aware graduation check (C.9)** — fires *after the fact*, on full-scope audit. Reads `git log` + the standing docs (never N per-feature evidence files — those no longer exist), and for every merged feature asserts its durable bits are present in the living reference. A feature whose dossier evaporated without graduating → **blocking**. This is the *recover/backstop* half, and it is the only gate that still works once the dossier is gone.

The pair mirrors the shipped prevent-and-recover pattern (the bootstrap write-loss guards: a deny + a snapshot). Neither gate alone is sufficient: the merge gate can be bypassed (manual ship path), and the auditor runs only periodically. Design the merge gate as a checklist comparison (dossier durable-bits ↔ their four homes) and the auditor check as git-history-vs-standing-docs (structure-not-prose, consistent with the no-prose-policing rule). **Recommendation:** specify the four graduation targets as a closed enum in `workflow/doc-style.md` so both gates check against one list; a fact that fits none of the four is the signal it is process, not durable.

**Mixed-project tolerance (interaction scenario):** the auditor's git-aware check must not false-block a project mid-migration (some features still as old `_review.md`/`_arch.md` files, some evaporated). Rule: a durable bit present in *either* a surviving per-feature file *or* the living reference satisfies graduation. The check asserts presence-in-a-durable-home, never absence-of-old-files.

---

## 2. Generated-vs-authored boundary in `architecture.md` (Slice E)

**The split (by derivability from a deterministic source):**

| Section | Source of truth | Owner |
|---|---|---|
| File layout / module map | source tree (`git ls-tree`) | **generated** |
| Dependency table | package manifest (`package.json` / `pyproject.toml` / etc.) | **generated** |
| Architectural decisions (decisions/why/rejected/trade-offs) | author judgment | **hand-authored** |
| Architectural constraints, Security constraints | author judgment | **hand-authored** |
| State model, Behavioral contract | author judgment | **hand-authored** |
| Operational limits & budgets | author judgment | **hand-authored** |

The test: a section is generatable iff its content is a faithful projection of a machine-readable artifact already in the repo. Everything that encodes *why* or *must/never* is irreducibly authored — code never expresses it (the gap's core finding: the protocol "drowns" judgment in volume, so the judgment sections must stay lean *and* hand-owned, never machine-clobbered).

**Ownership-boundary mechanism — Variant A (recommended): generated marker fences, in-file.**

A generated section is delimited by an explicit marker pair that the generator owns and rewrites wholesale:

```
<!-- GENERATED:file-layout — do not hand-edit; regenerate via gen/generate.py -->
… derived table …
<!-- /GENERATED:file-layout -->
```

- A regeneration replaces only the bytes *between* a marker pair → never clobbers authored content.
- A hand-edit inside a fence is detectable: a `single-source-diff-clean`-style guard re-runs the generator and fails on a diff inside any `GENERATED:` fence — exactly the existing guard the adapter trees use (`.golden` byte-parity). This is the `generated-section-owner-boundary` test (plan).
- `pm-architect` guidance: "never hand-edit a generated section; edit the source tree / manifest and regenerate" — the clean-grep the plan names.

**Variant B: a separate generated file (`architecture.generated.md`) the standing doc references.** Cleaner physical separation (no in-file guard needed), but breaks the single-doc reading flow, fragments the targeted-reading index (`### `/`## ` headers across two files), and adds a second file to the lean doc set the feature is trying to *shrink*. **Rejected** — the in-file fence keeps one holdable document (the keystone goal) while still mechanically separating ownership.

**Composition with the existing product-map generation (pm-bootstrap procedure) and `gen/generate.py`:** these are two *different* generators and must stay so.

- `gen/generate.py` assembles **adapter files** by byte-copying `frontmatter + body` (manifest order). It does **not** touch `doc/` content today and should **not** grow doc-derivation logic — that would couple the harness build to project-doc content. Keep the byte-copy contract and `.golden` parity intact.
- The **product-map generation procedure** (in `pm-bootstrap.md`, run by `pm-auditor`/`/pm-plan` handoff) derives `docs/product-map.md` from contracts. It is the existing precedent for "PM-facing doc derived from source." The new architecture.md section-derivation is a **sibling derivation step in the same family** — author it as a procedure (a `pm-architect`-run derivation, or a small standalone helper invoked at the doc-update handoff), *not* inside `gen/generate.py`. **Recommendation:** model E's derivation on the product-map procedure (source → overwrite a delimited region, idempotent), not on the adapter generator. The `generation-derived-sections` test asserts idempotence (re-run = no diff) the same way the product-map is idempotent.

---

## 3. Single-home / no-drift across the durable-text family

Three existing/new homes must be single-source-distinct, each referenced by name:

| Home | Owns | Scope |
|---|---|---|
| `workflow/doc-style.md` (**new**) | **frugality**: fact-first/BLUF, current-state-only, provenance-as-pointer, one-purpose-per-unit, supersede-don't-edit, **comment why-not-what + single-home** | structure/restraint of durable text |
| `workflow/pm-comms.md` `## Human-facing text legibility` (shipped) | **legibility**: read-before-ship, rewrite-if-unclear | clarity of durable text |
| `CLAUDE.md.tmpl` + Semgrep stack-idioms (shipped) | the **realization** of comment-restraint | per-project enforcement mechanism |

**The split is axis-by-axis, not topic-by-topic:** doc-style = *what good structure is* (frugality), legibility = *is the prose clear* (read it before shipping). They never state the same rule. `## Human-facing text legibility` already disclaims the deeper rubric ("The deeper comment-restraint rubric … is a separate convention and out of scope here") — so doc-style is the home that disclaimer points to. Wiring: doc-style references legibility by name as the lighter sibling; legibility's existing disclaimer becomes a forward pointer to doc-style. The `doc-style-vs-legibility-distinct` test (clean-grep: no rule in both) enforces it.

**Comment-restraint promotion (the precise mechanism — plan A.3 + interaction scenario):**

The **definition** moves to first-class in `workflow/doc-style.md` ("why-not-what + single-home for comments: architectural invariant → its decision record; local non-obvious why → terse comment; what → readable code; never duplicated across homes"). This makes it apply on *every* project, including a generic one with no wb-skills wired — that is the whole point of promotion (today it lives only in `CLAUDE.md.tmpl` + optional Semgrep, so a generic project carries nothing).

The existing `CLAUDE.md.tmpl` bullets and Semgrep stack-idioms become the **realization, not a parallel definition**: they reference the doc-style rule as the authority and implement it. No rule text is duplicated — the template/Semgrep carry the *mechanism* (the lint config, the per-language idiom), doc-style carries the *rule*. This is the same one-way realize-don't-redefine wiring the protocol already uses (AI-minimums → linter-rule: the number's single home is the doc, the config encodes it). The `comment-restraint-first-class` test asserts the rule lives in doc-style (non-vacuity: removing it fails); `comment-restraint-no-drift` asserts realization agrees with definition. **Do not re-author the Semgrep rules** (out of scope — A only promotes).

**Recommendation:** doc-style holds the closed set of frugality rules + the comment rule definition; every other home references by name. One paragraph in doc-style per rule, fact-first (dogfood the discipline).

---

## 4. Supersede-don't-edit (the tombstone form) + the eliminated arch-note files

**Mechanism (plan A.2, research §"supersede-don't-edit"):** a decision record is current-state-only. When a decision changes, the live record is **replaced in place** by the new decision; the superseded record collapses to a **one-line tombstone**:

```
### <decision title> — superseded by <new decision title> (2026-06-09) → see git history
```

The body is removed (git retains it). The live doc never accretes the *story* of how the decision changed — that story is process, and process evaporates (§1). This kills both the wb-mqtt-matter inline `Supersedes`/`corrects-the-earlier-wording` bloat and the nula inline `[x] Resolved (date)` pattern named in the gap.

**Interaction with the eliminated per-feature arch-note files (D.10) — this is the key composition:** today a structural decision's *full rationale* (variants, rejected, trade-offs) lives in `.ai-pm/arch/<topic>_arch.md` — a separate durable file (the research even proposed arch-notes as "explanation mode, one click away"). Under O(1), that file no longer survives merge: the arch rationale is **process** and lives in the transient dossier, then evaporates. So the "one click away" explanation home **disappears**.

The resolution: the **decision record in `architecture.md` becomes the sole durable home for the why** — the "compact-why." It carries the *current* decision + a one-line *why* (the trade-off that survives), not the variant exploration. The variant exploration was decision-support (process); it evaporates with the dossier. This is consistent: a decision record is current-state, and "the rejected alternatives" is history. **Risk to surface (see summary):** this is a deliberate loss of the durable variant-comparison. For a genuinely contested decision the PM may want the rejected-variants reasoning to survive — that survival path is git (the dossier commit) + the tombstone pointer, not the live doc.

This note itself is a transitional artifact under the *old* model (a `.ai-pm/arch/` file); under the model it designs, its durable conclusions graduate into `architecture.md` decision records and it then evaporates.

---

## 5. Supersede of `state-archive-home` — the exact live loci

Full distillation obsoletes persist-archive-on-branch (PM decision): once process evidence evaporates to git, there is nothing to curate into `.ai-pm/state/archive/`. The supersede must touch **every** locus that still asserts the archive model, or the doc set self-contradicts (interaction scenario; `state-archive-superseded-clean` test = clean-grep, no live text asserts persist-archive-on-branch). The complete locus list:

1. **`workflow/state.md` line 9** — "When a task finishes, the file is archived to `.ai-pm/state/archive/<topic>-<date>.md` … committed on the feature branch …". The single authoritative assertion. Rewrite: state resets to idle on finish; the prior snapshot is retained incidentally by git, not curated into an archive dir.
2. **`workflow/pipeline.md` line 99 (Step 6)** — "Before running `pm-pr-prep`, I archive the state: copy … to `.ai-pm/state/archive/…`, reset … and commit both …". Rewrite: reset `current.md` to idle and commit; no archive copy.
3. **`doc/architecture.md` line 83** (the `### Execution State as the single source of progress` decision record) — "Completed tasks are archived to `.ai-pm/state/archive/`." Apply §4 tombstone/replace: the decision record's current-state line drops the archive claim; if the archive model was itself a recorded decision, tombstone it → the distillation-engine decision (this feature, D.97 in Docs-to-update).
4. **`doc/architecture.md` line 509** (File layout downstream note) — "`.ai-pm/state/current.md` and `.ai-pm/state/archive/` hold the live and archived Execution States." Drop `.ai-pm/state/archive/` from the downstream-paths note.
5. **`pm-auditor` body** — confirm no archive-existence dimension. (Audit confirms: the 5 dimensions key on review/contract/docs/product-map presence; **none** asserts archive presence — so no auditor edit is required beyond the new frugality dimension. Verify during Slice D that no dimension grew an archive check.)
6. **`MIGRATIONS.md`** — add the `state-archive-home` supersede entry (Slice E migration, plan §16) so downstream projects collapse their archive convention.

Loci 1–4 are the live contradictions; 5 is a confirmed no-op (state it as verified, don't skip the check); 6 is the downstream migration. `doc/_templates/state.md.tmpl` must also drop any archive instruction (Slice E lean-doc set).

---

## 6. Slice boundaries + build order

A→E is the **correct dependency order**; each slice ships on its own sub-branch → review → merge-back. Dependency rationale:

- **A (doc-style single home)** — foundational; B/C/D/E all *reference* doc-style by name. Must land first or they reference a non-existent file. The four graduation targets (§1) and the supersede form (§4) are defined here → A is a hard prerequisite for C and D.
- **B (reviewer + checker enforce)** — depends on A (it surfaces doc-style/comment-restraint findings). Independent of C/D/E.
- **C (auditor frugality + graduation check)** — depends on A (graduation enum) and conceptually on D (the dossier/distillation model the graduation check verifies). **Ordering note:** C.9's graduation check verifies the D.10/D.11 dossier model. If C ships before D, the graduation check verifies a model not yet defined. **Recommendation:** either land D before C, or split C so the **frugality/shard dimensions (C.7, C.8)** ship in C (they depend only on A) and the **graduation check (C.9)** ships *with or after* D. The cleaner cut is **A → B → D → C → E** (D before C), since C.9 and D.13 are the behavioral twin and naturally co-design.
- **D (O(1) lifecycle + distillation)** — depends on A (graduation targets). Defines the dossier model C.9 checks. Carries the `state-archive-home` supersede loci 1–4 (§5) — those are state/pipeline edits, naturally in the lifecycle slice.
- **E (generation + lean templates + migration)** — depends on A (templates carry the doc-style guidance comment) and touches the generator family (§2). Largest blast radius (generator + persona regen + `.golden` parity). Correctly last. **Flag:** E bundles three loosely-coupled things — (E.14) section-derivation generator, (E.15) lean template set, (E.16) MIGRATIONS migration. If E proves heavy in review, split E.16 (the migration) to its own sub-branch; it depends on D's final model and is the riskiest-to-get-wrong (every downstream guarantee must be preserved, move-not-copy).

**Recommended order: A → B → D → C → E** (swap C/D vs the plan's A→E). Single change from the plan; everything else holds.

**Hard prerequisites summary:** A blocks all; D defines the model C.9 verifies; E's `.golden` byte-parity (the generator's existing contract) must stay green through the persona regen — the `generator-golden-parity` test is the tripwire.

---

## Recommendation

Ship as planned with **two amendments**: (1) reorder C/D so the dossier model (D) precedes the graduation check (C.9) it verifies — they are a behavioral twin and should co-design; (2) keep `gen/generate.py` out of doc-section derivation — model E's derivation on the existing product-map generation procedure (source → overwrite a delimited GENERATED-fenced region, idempotent), preserving the adapter generator's byte-copy/`.golden` contract untouched.

The load-bearing risk is §1: distillation without an *enforced* graduation gate is a regression (silent knowledge loss), not a fix. Both gates (pre-ship merge D.13 + auditor git-aware C.9) are required and must check against one closed enum of four graduation targets defined in `workflow/doc-style.md`.
