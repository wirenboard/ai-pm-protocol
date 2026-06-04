# review-typology-framework — design notes

## Context

EPIC review-typology, slice 1. The plan lays a **review-type registry** (5 types × cadence/depth/scope/det-half/AI-half) and builds the **first, lightest type: smell/hygiene**, operationalized through `/pm-audit`'s existing `## Technical quality (full scope only)` hook. The heavier four types are *registered as named later slices*, not built.

Two genuine structural forks need settling before coding (the rest of the plan's questions resolve to confirmations):

- **Q1 — registry home:** `WORKFLOW.md` `### Review typology` subsection vs a section inside `/pm-audit`.
- **Q2 — last-sweep marker home:** a line in the audit report vs a dedicated `.ai-pm/state/` file vs a field in `current.md` vs derived-from-git.

Q3 (framework altitude), Q4 (det-half naming-not-building), Q5 (decision record) are confirmations, settled below. This is a markdown-prose meta-repo: no runtime, no linter to host smell-*detection*, so the deterministic half of the smell type is genuinely aspirational here and only *named* as the path for downstream code projects.

## Adjacent patterns

This slice's two forks each have a direct, load-bearing precedent already in the repo — so neither is a true greenfield choice; both are "follow the established single-source pattern or justify diverging."

1. **`### Decision authority` single-sourcing** (`WORKFLOW.md` lines 250–321) — the registry-home precedent. A cross-cutting *discipline* (who resolves a product fork) lives once as a `###` subsection under `## What is mandatory when`, and **every consumer references it by name** ("`### Decision authority` in `WORKFLOW.md`") and re-encodes neither the enum nor the default. The closing line 321 enumerates the consumers (`pm-bootstrap.md`, `pm-plan.md`, `pm-plan-checker.md`, `pm-auditor.md`, …) and states the rule: re-encoding would reintroduce drift. `### Project kind` is named there as the original of the same pattern. This is the model the plan leans toward, and it fits: the typology is a discipline used *beyond* audit (the per-diff type is a `/pm-plan` review-loop concern; the architectural/functional types are future cross-command concerns), so its home should not be any one consumer.

2. **`/pm-audit` Auto-scope's "most-recent `audit-*.md` by filename date"** (`pm-audit.md` lines 7–20; `pm-auditor.md` lines 16, 29, 36) — the marker-home precedent, and the load-bearing one for Q2. The auditor **already** derives its diff-scope cutoff from the **filename date of the latest `audit-*.md`** — it lists the directory, reads the most-recent filename's date, and scopes `git log --since=<that date>`. It explicitly does *not* read audit *content* for this ("previous findings are not evidence", line 29). So the protocol already has a "when did the last sweep happen" memory derived from an existing artifact, with **zero new files**. The smell sweep wants the same shape, plus a commit SHA for `git diff <sha>..HEAD` precision.

3. **The `## Resolutions` `auto`/`escalated` markers + `pm-plan-checker` presence-key backstop** (`WORKFLOW.md` lines 308, 319) — the precedent for "a small recorded marker, gate-checked by shape not meaning." Relevant to Q2's format: a marker line carrying `date + SHA` is the same class of cheap, shape-checkable artifact as a `source:` provenance token, and the `accepted (quality-sweep-<date>)` backlog marker the plan reuses mirrors `accepted (auditor-<date>)` verbatim.

4. **`## Technical quality (full scope only)`** (`pm-audit.md` lines 112–121) — the implementation site. Today it is a hard-wired `code-review ultra` offer, full-scope-only, PM-gated, no scope memory. The plan strengthens *this exact hook* (proportional scope + selectable depth + triage + autonomous gate + registry reference) rather than adding a command — consistent with the plan's "no new standalone command" rejection.

## Settled (the confirmations)

- **Q3 — register-4 / build-1 is the right altitude.** Registering the four heavier types *with their cadence/depth/scope/det-half/AI-half sketched* is sound, not dead-letter risk, **because the research already validated all five as a coherent taxonomy** (`review-typology_research.md` lines 11–20) — the registry documents a *designed* layering, not speculative placeholders. The anti-drift safeguard is structural: each later type is marked "later slice (not built)" in the same registry, so the registry is self-describing about what is live. The named-but-unbuilt rows are *navigational* (they tell a future slice where its type already has a reserved home + agreed cadence), exactly as `### Decision authority`'s "future hook" caveats (the veto-window countdown, line 291) name an unbuilt path without it rotting. Trimming to per-diff+smell-only would *lose* the EPIC's main slice-1 value — the agreed shared shape that later slices slot into — and force re-litigating the taxonomy per slice. Keep all five; mark four "later slice."

- **Q4 — naming the deterministic smell-detection half without building it is coherent, no half-promise.** The registry states, for the smell type, a deterministic half (*smell detection* — an enumerable catalog a hook/linter should run) and an AI half (*prioritization / root-cause* — the `code-review` skill). Slice 1 ships **only** the AI half and *names* the deterministic half as the path. This is coherent here precisely because the **repo has no host for the det half** (markdown-prose, no linter), so building it now would be impossible, not deferred-by-choice — and the registry says so explicitly, tying to **backlog #211** (the deterministic-vs-AI boundary, research-gated). The half-promise risk is avoided by making the naming *aspirational-for-downstream* not *owed-here*: the row reads "det half = a future smell-detection hook (downstream code projects; #211)", which is a documented boundary, not an undelivered feature. The EPIC is named in #211 as the place that boundary gets applied concretely — that is the correct framing. **Confirmed: name it, do not build it, cite #211, mark it downstream-aspirational.**

- **Q5 — yes, a `doc/architecture.md` decision record.** The review-typology framework is a **new whole-system review discipline** (layered review types, new-code gating, det-vs-AI split) — exactly the class of cross-cutting decision `architecture.md` records. It is the post-coding `pm-architect` handoff the plan already lists (line 82). The record should capture: the framework as a new discipline, EPIC slice 1, the registry home + marker home chosen (the outputs of this arch-review), and that the heavier types are deferred. **Confirmed.**

## Variant A — registry in `WORKFLOW.md` `### Review typology`; marker derived from the audit report (no new file)

- **Where (Q1):** a new `### Review typology` subsection under `## What is mandatory when` in `WORKFLOW.md`, sibling to `### Decision authority` / `### Project kind`. It holds the 5-type table (type × cadence × depth × scope × det-half × AI-half), the proportional new-code-gating + last-sweep-marker *concept*, the per-type det-vs-AI naming (→ #211), and the "later slice" marks. `/pm-audit` references it by name; the enum/cadence lives once here.
- **Where (Q2):** **no new file.** The last-sweep memory is the existing `audit-*.md` artifact, extended minimally: the smell sweep records its outcome as a **line inside the audit report it already writes** — e.g. `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>` (or "swept-clean since …"). The next sweep finds the latest `audit-*.md` that contains a `## Quality sweep` heading, reads its `<sha>`, and scopes `git diff <sha>..HEAD`. This extends the auditor's *existing* "most-recent `audit-*.md` by filename date" cutoff (precedent #2) from date-only to date+SHA, **for the quality-sweep line only** — the protocol-audit cutoff is untouched.
- **Relation to adjacent:** symmetric with `### Decision authority` (Q1) and with the auditor's existing scope-cutoff derivation (Q2) — both forks reuse an established pattern rather than inventing a home.
- **Pros:**
  - Q1 home is the proven single-source location; consumers-by-name is already the house style; the discipline correctly lives above any one consumer (it spans `/pm-plan` per-diff + `/pm-audit` smell + future commands).
  - Q2 adds **zero new mandatory artifact** — honors the plan's Scenario 9 "no new mandatory artifact beyond the small marker" and the "no new file on tiny projects" discipline maximally. A project that never runs a full audit simply has no quality-sweep line yet (first sweep = baseline, identical to first-audit = full).
  - The marker is co-located with the run that produced it (the audit report) — naturally durable, naturally dated by filename, naturally git-tracked.
- **Cons:**
  - Couples the quality-sweep marker's lifecycle to the audit report. If a sweep is ever run *outside* a `full` audit (e.g. a standalone PM request that doesn't write an `audit-*.md`), there is no report to carry the line. **Mitigation:** the plan scopes the sweep to run *from `/pm-audit`'s `## Technical quality` hook* (full-scope), so it always co-occurs with an audit report — the coupling matches the actual trigger. A future standalone trigger would need its own home, but that is out of scope (the plan rejects a standalone command).
  - The reader must scan for the *latest report containing a `## Quality sweep` line*, not merely the latest report (a `diff`-scope audit writes a report but may not run a sweep). Slightly more than "latest file" — but still pure derivation, no separate state.
- **Risks:** a future "sweep without an audit" path would have no marker home — acceptable while the only trigger is the audit hook; flag it in the architecture decision record so the constraint is explicit.

## Variant B — registry in `WORKFLOW.md` (same as A); marker in a dedicated `.ai-pm/state/last-quality-sweep.md`

- **Where (Q1):** identical to Variant A — `WORKFLOW.md` `### Review typology`. (Q1 is not really a two-way fork; see Recommendation.)
- **Where (Q2):** a dedicated single-purpose file `.ai-pm/state/last-quality-sweep.md` holding `date:` + `sha:` + `depth:` (+ optional `scope:` note), read natively the way `.ai-pm/state/current.md` and `.ai-pm/decision-authority.md` are. The sweep overwrites it each run; the next sweep reads `sha:` for `git diff`.
- **Relation to adjacent:** symmetric with `.ai-pm/decision-authority.md` (precedent: a flip-often / overwrite-often value gets its own isolated file, `WORKFLOW.md` line 268).
- **Pros:**
  - Decouples the marker from the audit report — works for *any* trigger (standalone sweep, future command) without a report to host the line.
  - Trivially machine-read (fixed keys), trivially shape-checkable (a `pm-plan-checker`/`pm-auditor` presence-key on `sha:`, mirroring precedent #3), no "scan for the right heading" step.
  - The `decision-authority.md` rationale (line 268: "a flip-often value buried in a multi-purpose file is a clobber surface") *partly* applies — an overwrite-each-run marker is flip-often.
- **Cons:**
  - **Introduces a new mandatory-ish `.ai-pm/` artifact** — exactly the "no new file on tiny projects" discipline the plan flags (Scenario 9). On a small project that runs one audit and is clean, this file exists only to say "swept-clean since X" — proportionally heavier than a line in the report that already exists. The `decision-authority.md` precedent is weaker here: that file is *PM-flippable mid-flight* (a human toggle that must survive edits); the sweep marker is *machine-written-only*, never hand-edited, so the clobber-surface argument that justified a dedicated file there does not transfer — nothing edits it but the sweep.
  - A `field in current.md` sub-variant is worse on both axes: `current.md` is high-churn and human-edited (clobber surface, line 268's exact warning) and is session-state, not durable history.
- **Risks:** sets a precedent that every future review type gets its own `.ai-pm/state/` marker file — four more files as the EPIC grows. Variant A's "a line in the report" scales to a `## <Type> sweep:` line per type with no file proliferation.

## Recommendation

**Variant A.**

- **Q1 (registry home): `WORKFLOW.md` `### Review typology`** — confirmed, not overturned. The single-source rule it should follow is **stated verbatim from the `### Decision authority` precedent**: *the enum/cadence/det-vs-AI split lives once in this subsection; every consumer (`pm-audit.md` now, future `pm-plan`/architectural-slice consumers later) references it by name and re-encodes neither the type list nor the cadence rule* — mirroring `### Project kind` / `### Decision authority`. The typology is a discipline spanning multiple consumers, so it must not live inside `/pm-audit` (the *runner* of one type), exactly as decision-authority does not live inside any one command.

- **Q2 (marker home): derived from the audit report — a `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>` line in the `audit-*.md` the sweep already produces; no new file.** This is the proportional choice and it reuses the auditor's *existing* derive-cutoff-from-latest-`audit-*.md` pattern (precedent #2), extending it from date-only to date+SHA for the sweep line only. It honors the plan's "no new mandatory artifact" discipline maximally, and the marker's lifecycle correctly matches the only trigger (the `/pm-audit` full-scope hook). Format: a single `## Quality sweep` heading in the report — `date`, the `<sha>` swept to (HEAD at sweep time), the depth used, and on a no-op run the `swept-clean since <date>` phrasing.

Q1 is effectively settled (both variants share it) — the real fork is Q2, and there the proportionality discipline plus the existing derive-from-artifact precedent decide it cleanly for A.

## Risks for the PM

1. **Marker-without-report coupling (Q2, Variant A).** The quality-sweep marker only exists where an `audit-*.md` exists. This is safe *today* because the sweep's sole trigger is the `/pm-audit` full-scope hook (always co-produces a report). If a future slice adds a standalone "run a quality sweep" trigger outside an audit, it will need a marker home — at that point reconsider Variant B's dedicated file. The architecture decision record should state this coupling explicitly so the constraint is visible, not discovered later.

2. **`diff`-scope audits write a report but may not run a sweep.** The sweep reader must find the latest report *containing a `## Quality sweep` line*, not merely the latest report. A small but real rule — make it explicit in the registry's marker-concept text so a coder doesn't read the wrong (sweep-less) report's absence as "never swept."

3. **First-sweep / never-swept-area baseline.** On a project's first sweep (no prior `## Quality sweep` line) the proportional scope must fall back to "full re-sweep" — identical to the auditor's "first audit ⇒ full" rule (`pm-audit.md` line 18). Confirm the smell sweep reuses that exact fallback wording rather than inventing a parallel one, so the two "first run = full" behaviors stay single-shaped.

4. **Naming four unbuilt types (Q3).** Low risk given the validated taxonomy, but the registry must keep each later-slice row *visibly marked "not built / later slice"* so a reader never mistakes a named type for a live one. The drift guard is the mark, not discipline — if a future edit drops the mark, an architectural-slice could be assumed live. Worth a clean-grep in the test plan (the plan already lists "registry names the 5 types … only the smell type is implemented").

5. **Plan should note (not block):** the plan's "Docs to update" lists the registry home as "likely `WORKFLOW.md` … alternatively a `/pm-audit` section." This arch-review settles it as `WORKFLOW.md` definitively — the coder should treat the `/pm-audit`-section alternative as **rejected**, and `/pm-audit` as a *by-name consumer* only. No plan edit needed from me; the orchestrator can fold this settlement into the plan's context.

---

*Read-only on source; no canonical `architecture.md` edited (the Q5 decision record is the post-coding `pm-architect` handoff, not this arch-review). No code, plan, or config changed.*
