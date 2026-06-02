# product-map-migration-detection — design notes

## Context

The plan makes detection of an un-migrated template structure reliable and turns the
passive "map missing" note into an active offer to run the pending `/pm-bootstrap`
migration. The migration procedures (v2.2 `_index.md`→`product-map.md`, v2.3
`product.md` split) are **not** touched — only detection + trigger/offer.

This repo IS ai-pm-protocol, so the "code" here is agent/command prose. The change
spans four files: `pm-auditor.md` (the read-only detector), `pm-audit.md` and
`pm-plan.md` (the two orchestrator-side offer surfaces), and `pm-bootstrap.md` (the
single source of the detection conditions + the migration procedures).

The structural forks (set by the plan, sent here for resolution):
1. Where the "pending-migration detector + offer" logic lives.
2. How the detection conditions are single-sourced so they don't drift.
3. How to restructure `pm-auditor` so a lingering `_index.md` is a note, never a
   silent inventory source, and the "`product-map.md` exists" check is hard/early —
   without breaking the greenfield/feature-less exemption.
4. The read-only / actor split (auditor flags, orchestrator offers).

This is a documentation/protocol change with no runtime state — the plan's own
"Interaction scenarios: Provably isolated" is correct. The only real intersection is
conceptual: three consumers must reuse one set of detection conditions, not fork them.
That is exactly the drift class this feature exists to fix, which is why questions 1–2
are the load-bearing design decisions.

## Adjacent implementations

These are the existing patterns in this repo that already do "detect a condition, then
prompt the PM" or "single-source a definition that multiple commands consume". They set
the precedent the new logic should match.

1. **Retrospective audit nudge** — `pm-plan.md:209-222` (`## Retrospective check`).
   Detect = count `feat:`/`fix:` commits since the most recent `.ai-pm/audits/audit-*.md`;
   trigger = "5+ since last audit" or "no audit ever"; action = offer `/pm-audit`, PM
   decides, never auto-runs. This is the exact shape the new `/pm-plan` migration nudge
   should clone — a sibling block right next to it.

2. **Audit follow-through offer** — `pm-audit.md:60-89`. The auditor (subagent) writes
   findings to `.ai-pm/audits/audit-*.md`; the `/pm-audit` orchestrator reads the
   structured summary and walks the PM through each finding, offering remediation
   (fix-now / backlog / accept). The actor split is already clean here: auditor writes
   the note, orchestrator acts on it. The migration offer is just one more remediation
   branch keyed off a specific note title.

3. **Pending template-upgrade migrations** — `pm-bootstrap.md:39-67`. Already the home of
   both migrations *and* their detection conditions, stated as prose inside each migration
   entry: v2.2 at `:43` ("If `docs/features/_index.md` exists"); v2.3 at `:51-61` (the
   two-guard detection: generated `product.md` carrying the frozen signature line AND no
   `product-map.md`). It is only ever consumed today by `/pm-bootstrap` itself. Nothing
   currently cross-references these conditions — so when `pm-auditor`/`pm-audit`/`pm-plan`
   start needing them, the naive move (restating them) is what drifts.

4. **Docs-currency map check** — `pm-auditor.md:106-107`. Already flags "map missing →
   note" and already carries the greenfield exemption ("on a legitimately feature-less
   greenfield project … a missing map is **not** a finding — skip"). The reliability fix
   extends this existing check; it does not invent a new one.

5. **Feature inventory build** — `pm-auditor.md:31-36`. Builds the inventory purely from
   `git log` (merge commits + `feat:`/`fix:` commits) — **not** from `docs/features/_index.md`.
   Worth noting: the auditor does **not** today read `_index.md` as an inventory source at
   all. The "silently treat `_index.md` as a valid feature inventory" risk in plan scenario 1
   is therefore *latent/preventive*, not an active bug in the current text. The fix is to make
   that non-use explicit (so a future edit can't reintroduce it) and to flag the lingering
   file as a note.

## Behavioral risks in this area

No event-driven / runtime code — nothing subscribes, emits, or mutates. The only "risk"
is documentation drift: if any consumer re-encodes the detection conditions, the three
sites diverge over template versions. The design must structurally prevent restatement
(single-source via cross-reference), not merely ask authors to keep them in sync.

A second, subtler risk: the greenfield exemption (`pm-auditor.md:107`) must not be widened
or narrowed by the reliability fix. Today "no contracts and no plans → missing map is not a
finding". A lingering `_index.md` is, by definition, evidence of a non-greenfield project
that has already had features (the index only exists post-feature). So the `_index.md`-note
and the greenfield-skip are mutually exclusive by construction — the fix must keep them
ordered so the `_index.md` check is evaluated *before* the greenfield skip can swallow it.

---

## Question 1 — where the detector + offer lives

### Variant A — auditor note + `/pm-audit` offer only
Detection note added in `pm-auditor`; offer added only in `/pm-audit`.
- Pros: minimal surface; detection is unambiguously the auditor's job; one offer site.
- Cons: the PM only learns about a pending migration when they happen to run an audit.
  A project can drift through many `/pm-plan` cycles on stale structure untouched. Misses
  the "nudge before new work" moment, which is where stale structure actually bites
  (planning against a structure the tooling no longer expects).

### Variant B — A plus a `/pm-plan` retrospective nudge (recommended)
Everything in A, plus a sibling block in `pm-plan.md`'s existing `## Retrospective check`
that surfaces the pending migration ("this project is on an older template structure — run
the migration first?"), PM decides.
- Pros: catches the PM at both natural moments — health check (`/pm-audit`) and before new
  work (`/pm-plan`). The `/pm-plan` nudge reuses an already-existing, already-trusted
  prompt block (adjacent impl #1), so it adds almost no new surface. Matches plan scenarios
  2 and 3 directly.
- Cons: two offer sites. Acceptable **only** because both consume the same single-sourced
  conditions (Question 2) and the same single-sourced offer remediation; the cost of "two
  sites" collapses to "two one-line cross-references" rather than two restatements.

### Variant C — a shared "pending-migration detector" procedure referenced by all three
A standalone detector *procedure* (like the Product map generation procedure) that
`pm-auditor`, `pm-audit`, and `pm-plan` each invoke.
- Pros: maximal single-sourcing of the *whole* detect+offer flow.
- Cons: over-engineered for this repo's idiom. The detection *conditions* genuinely need
  single-sourcing (Q2). The *offer* is two short PM prompts in two different command voices
  (one mid-audit-walk, one mid-plan-retrospective) — folding them into one procedure forces
  an awkward shared voice and an extra indirection hop for what is two sentences each. The
  repo's existing pattern is "conditions live once, prompts live at each call site in that
  command's voice" — adjacent impls #1 and #2 already do exactly this. Inventing a procedure
  breaks that idiom for no real dedup win (the prompts aren't actually duplicated content,
  they're context-specific).

**Recommendation: Variant B.** Coverage at both PM touchpoints is the point of the feature
(scenarios 2 and 3), and B gets it by cloning the existing retrospective-nudge pattern
rather than inventing structure. The duplication objection against B is neutralized by
single-sourcing the *conditions* (Q2) — which must be done regardless of which variant wins.

---

## Question 2 — single-sourcing the detection conditions

The conditions currently live as prose inside the two migration entries
(`pm-bootstrap.md:43` and `:51-61`). They must become a named, citable unit that the other
three files point at instead of restating.

### Variant A — add a named subsection in `pm-bootstrap.md` and cross-reference it (recommended)
Insert one short subsection, e.g. `### Pending-migration detection`, **at the top of the
existing `## Pending template-upgrade migrations` section** (`pm-bootstrap.md:39`), that
states the two detection conditions exactly once:
- **v2.2 un-migrated:** `docs/features/_index.md` exists.
- **v2.3 un-migrated:** `docs/product.md` exists AND carries the frozen pre-split signature
  line `> Source of truth = contracts. One contract, many features. Generated, not
  hand-filled.` AND `docs/product-map.md` does not exist.

The two migration *entries* below it keep their procedures but defer their "if … exists"
guard wording to this subsection (a one-line "Detection: see `### Pending-migration
detection` above"). Then `pm-auditor`, `pm-audit`, and `pm-plan` each cite it by name:
"un-migrated structure as defined in `pm-bootstrap.md` `### Pending-migration detection`".
- Pros: one literal home for the conditions; the frozen v2.3 signature string lives in
  exactly one place (it is already flagged as a frozen historical artifact at `:56-58` — a
  single home protects it from "tidying" across multiple files); cross-references are stable
  against a named heading; matches the repo's existing "named procedure other files cite"
  idiom (the Product map generation procedure at `pm-bootstrap.md:290` is referenced this way
  from `pm-plan.md:244` and `pm-auditor.md:107`).
- Cons: requires a light restructure of the two migration entries so their guards point up
  to the subsection instead of restating inline. This is desirable cleanup, not cost.

### Variant B — leave conditions inline at `:43`/`:51-61`, cross-reference by line number
Other files reference "`pm-bootstrap.md:43` / `:51`".
- Pros: zero edit to `pm-bootstrap.md`.
- Cons: line-number references rot on every edit to that file (the plan itself already cites
  `:43/:51` and they will move the moment this very feature edits the section). A named
  anchor is edit-stable; line numbers are not. Reject.

**Recommendation: Variant A** — a named `### Pending-migration detection` subsection inside
`## Pending template-upgrade migrations`, cited by name (not line number) from the other
three files. This is the structural mechanism that makes Variant B of Question 1 safe: two
offer sites, one condition definition.

> **Plan note (for the coder, not a plan rewrite):** the plan's "Contracts" and "Key design
> decisions" sections cite the conditions by line number (`:43/:51`). After this feature
> creates the named subsection, those references should read "`### Pending-migration
> detection` in `pm-bootstrap.md`" rather than line numbers — otherwise the plan reintroduces
> the exact line-rot the feature removes.

---

## Question 3 — the auditor reliability fix

Two distinct changes, deliberately placed in two different parts of `pm-auditor.md`.

**3a. `_index.md` as a note, never a silent inventory source → inventory step 2
(`pm-auditor.md:31-36`).** Add one explicit line to the inventory build: the inventory is
derived from `git log` only; if `docs/features/_index.md` is present, it is **not** an
inventory source — record it as a docs-currency note (un-migrated v2.2 structure) and
continue building the inventory from git. This both (a) makes the current non-use explicit
so a future edit can't turn `_index.md` into a fallback inventory, and (b) routes the
lingering file to the notes path. Keep the actual note text in the docs-currency dimension
(3b) so there is one note, not two.

**3b. "`product-map.md` exists" as a hard, early step → docs-currency dimension
(`pm-auditor.md:106-107`), reordered.** Restructure the existing map check so the existence
gate runs *first* and independently of any inventory fallback:
1. **First**, evaluate the greenfield/feature-less exemption explicitly: no `_index.md`
   present AND no contracts AND no plans → missing map is not a finding, skip the rest of
   this check. (Add `_index.md` absence to the existing exemption so a lingering index can
   never qualify as greenfield — see the "mutually exclusive by construction" note above.)
2. **Then**, the hard existence check: if not exempt and `docs/product-map.md` is missing →
   **note** (un-migrated structure / un-generated map). State this as a standalone early
   check that does **not** depend on the contract/feature re-derivation below it — the
   re-derivation (`:108-112`) only runs once the file is known to exist.
3. The lingering-`_index.md` note (from 3a) and a missing-`product-map.md` note carry the
   same remediation pointer: "un-migrated template structure — run the `/pm-bootstrap`
   migration (`### Pending-migration detection` defines the trigger)".

Why this split (inventory vs docs-currency): the *inventory* must not be poisoned by
`_index.md`, so the guard belongs where the inventory is built (step 2). The *finding* about
structure currency belongs in the docs-currency dimension where the map check already lives —
keeping both notes in one dimension avoids double-flagging the same un-migrated state.

The greenfield exemption (`:107`) is preserved verbatim in intent; it is only made stricter
by adding the `_index.md`-absent precondition, which cannot misfire (a greenfield project has
no `_index.md`).

---

## Question 4 — read-only / actor split

The boundary is already the repo's established pattern (adjacent impl #2) and must be stated
explicitly so the auditor never appears to run the migration:

- **Auditor (`pm-auditor.md`): detects and FLAGS only.** It writes a note ("un-migrated
  template structure — `docs/features/_index.md` present" / "`docs/product-map.md` missing")
  with the remediation pointer to `/pm-bootstrap`. It must **not** say "I will migrate" or
  "running the migration". Reuse the existing note remediation grammar at `:106-112`
  ("remediation: …") so the migration appears as a *remediation step the orchestrator runs*,
  not an auditor action. The auditor's hard rules (`:179-187`, read-only, write only to the
  audit file) already forbid it acting — no new prohibition needed, just don't add action
  verbs to the new note.
- **Orchestrator (`pm-audit.md` / `pm-plan.md`): reads the note and OFFERS.** In `/pm-audit`,
  add a remediation branch in the findings walk (`pm-audit.md:77-89`): when a finding is the
  un-migrated-structure note, the remediation offered is "run the pending `/pm-bootstrap`
  migration now?" — PM decides (fits the existing fix-now / backlog / accept loop). In
  `/pm-plan`, the retrospective nudge (Q1 Variant B) makes the same offer proactively. Both
  offers invoke `/pm-bootstrap`, whose existing migration procedures (untouched) do the work
  with PM consent.

No new wording is needed to *prevent* the auditor migrating — its hard rules already do. The
only wording discipline: the new auditor note uses flag/remediation grammar, never
action/offer grammar. Offer grammar lives only in the two command files.

---

## Recommendation summary

- **Q1 placement:** Variant B — auditor note + `/pm-audit` offer **and** a `/pm-plan`
  retrospective nudge cloned from the existing audit-nudge block. Both PM touchpoints
  covered; cost contained because conditions are single-sourced.
- **Q2 single-sourcing:** Variant A — a named `### Pending-migration detection` subsection at
  the top of `## Pending template-upgrade migrations` in `pm-bootstrap.md`, cited **by name**
  (not line number) from the other three files. The frozen v2.3 signature string lives there
  once.
- **Q3 auditor fix:** split — inventory guard in step 2 (`_index.md` is never an inventory
  source, route to note); hard early existence check + stricter greenfield exemption in the
  docs-currency dimension (`:106-107`). One note per un-migrated state, shared remediation.
- **Q4 actor split:** auditor flags (no action verbs in the new note); orchestrator offers in
  both commands and invokes the untouched `/pm-bootstrap` procedures with PM consent.

## Per-file change list for the coder

1. **`pm-bootstrap.md`** — add `### Pending-migration detection` subsection at the top of
   `## Pending template-upgrade migrations` (~`:39`) stating both conditions (v2.2 `_index.md`
   present; v2.3 signature line + no `product-map.md`) exactly once, including the frozen
   signature string (preserve it verbatim — already flagged frozen at `:56-58`). Trim the
   inline "if … exists" guards in the two migration entries (`:43`, `:51-61`) to a one-line
   "Detection: see `### Pending-migration detection` above". Do not touch the migration
   *procedures/steps*.

2. **`pm-auditor.md`** —
   - Step 2 inventory (`:31-36`): add an explicit line — inventory is from `git log` only;
     `docs/features/_index.md`, if present, is **not** an inventory source; record it as an
     un-migrated-structure note.
   - Docs-currency map check (`:106-107`): reorder to (1) evaluate the greenfield exemption
     first, adding `_index.md`-absent to its preconditions; (2) hard early existence check for
     `docs/product-map.md`, independent of the re-derivation below; (3) shared remediation
     pointer to `/pm-bootstrap` (`### Pending-migration detection`). Keep note severity. Use
     flag/remediation grammar only — no action verbs.

3. **`pm-audit.md`** — in the findings-remediation walk (`:77-89`), add a branch: when the
   finding is the un-migrated-structure note, offer "run the pending `/pm-bootstrap` migration
   now?" within the existing fix-now / backlog / accept loop. Reference the condition by name
   (`### Pending-migration detection` in `pm-bootstrap.md`), do not restate it.

4. **`pm-plan.md`** — in `## Retrospective check` (`:209-222`), add a sibling nudge block:
   if un-migrated structure is detected (cite `### Pending-migration detection`), offer
   "this project is on an older template structure — run the migration first?" PM decides;
   never auto-run. Do not restate the conditions.

5. **Plan hygiene (note to orchestrator, not done by coder):** the plan's line-number
   citations (`:43/:51`) should be updated to the named-subsection reference after this lands,
   so the plan doesn't reintroduce the line-rot the feature removes.
</content>
</invoke>
