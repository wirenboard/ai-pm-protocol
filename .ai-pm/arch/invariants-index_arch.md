# invariants-index — design notes

## Context

The plan makes `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` the **single index** for the project's system invariants, so a top-down reader finds one entry point rather than three partial homes keyed differently. Today invariants live in three places: format/taxonomy invariants **in** the Behavioral contract; rule-shaped invariants as `SCn` in `## Security constraints` (referenced by the threat-model by ID); journey-level preconditions in the per-journey `**Invariants:**` blocks. The structural choice is *where the index lives* and *how it points* — and whether that pointing re-creates any coupling the protocol elsewhere avoids.

This is a prose-spec / meta-feature on the template repo (software-kind, no-user-facing-contract exception). No runtime, no shared state. The "adjacent implementations" are not code modules but the protocol's own established cross-doc patterns; I map them as such.

## Adjacent implementations (protocol patterns of the same shape)

1. **threat → constraint wiring** — `.claude/agents/pm-architect.md:120` (the spec) + `.claude/agents/pm-auditor.md:134` (the audit check). A Threats-table Mitigation references a constraint **by `SCn` ID** (one-way, ID is the stable anchor, prose only a human hint); the constraint keeps **no back-link** ("one constraint can mitigate several threats; a back-link would drift"); **no rule text is duplicated** — the only cross-doc datum is the bare `SCn` token. Each doc stays independently readable. The auditor cross-checks for a **dangling `SCn`** (Mitigation names an ID no constraint defines) or an **orphan constraint** — "Structural ID-match only — never prose-police." This is the exact shape the index reuses.

2. **Behavioral contract move-not-copy** — `architecture.md.tmpl:64-79` + `pm-architect.md:107`. The Behavioral contract is declared "the single home … the machine-level facts that other docs reference but must never restate." Journeys and contracts reference it **by name**, never copying identifiers — the discipline that stops "6 statuses in the docs, 7 in the code." The index extends this same home with an index *role*; it is the natural owner, not a parallel one.

3. **A4 cross-check set** — `pm-architect.md:66`. Exactly three pairings (File layout↔tree, Release flow↔CI, Integration contract↔README). The Behavioral contract is **explicitly excluded** — "authored domain content with no external artifact to diverge from." The index inherits this exclusion by construction.

4. **Auditor structural-token / front-gate notes** — `pm-auditor.md:106,116,129`. The house pattern for a non-blocking dimension-5 note: match a **shape** (token, heading presence, ID), never prose meaning; presence-conditional; remediation = spawn `pm-architect`. The new index note is a direct sibling.

## Behavioral risks in this area

Not event-driven code — no subscription/feedback-loop surface. The only "feedback" risk is *documentation drift*: if the index were to **copy** an `SCn` rule or a journey identifier beside its pointer, the copy would drift from its home — the same failure mode move-not-copy and threat→constraint-by-ID already prevent. The plan forbids restating (scenarios 1, 2, 3), so the risk is closed by design, not by the location choice.

## Settling the five structural questions

**Q1 — Index home (additive subsection vs new top-level section).** The Behavioral contract **already declares itself** "the single home for taxonomies & invariants" (tmpl:64) — its title literally carries `& invariants`. A new top-level `## System invariants` section would create a *second* home for the same concept, directly contradicting one-fact-one-owner and forcing readers to reconcile two sections. The additive-subsection choice (plan's) puts the index where the concept already lives and where its inline-home invariants already sit. **Confirmed: additive subsection inside `## Behavioral contract`.** See Variant A vs B below.

**Q2 — Reference mechanics / coupling.** The index points at three target kinds: `SCn` **by ID** (rule-invariants, home stays `## Security constraints`), **journey by name** (precondition-invariants, home stays the journey's `**Invariants:**` block), and **inline** only for Behavioral-contract-native invariants (the index *is* the home). This **exactly mirrors** threat→constraint-by-ID: one-way, ID/name only, no text duplication, no back-link. Critically, the index does **not** ask `## Security constraints` to back-link to it — the same anti-drift reasoning that bars a constraint→threat back-link (architect.md:120) bars a constraint→index back-link. **No new coupling.** The index→`SCn` reference is the same *kind* of pointer the threat-model already emits at an `SCn`, so it needs the **same dangling-ID audit** — confirmed, and the plan's scenario 4 specifies exactly that shape (a dangling `SCn` in the index → note). One asymmetry worth naming for the PM (not a defect): the auditor checks the index for **dangling** `SCn` only, **not** for orphan constraints from the index's side — correct, because an `SCn` with no index entry is not an error (the index is a curated entry-point, not a mirror of every constraint), and orphan-constraint detection already lives in the threat↔constraint check.

**Q3 — A4 exclusion.** The index is authored domain content with **no external artifact** to cross-check against (unlike tree/CI/README). It must **not** enter the A4 set — consistent with the whole Behavioral contract's exclusion (architect.md:66, tmpl:64). **Confirmed; plan scenario 3a is correct.** A clean-grep that the A4 set still lists exactly three pairings (plan's test) is the right guard.

**Q4 — Auditor check placement + proportionality.** The new dimension-5 note is correctly a **sibling** of the threat↔constraint wiring check (auditor.md:134) — same family (cross-doc ID integrity), same structural-only discipline, same note-not-blocking weight, same remediation (spawn `pm-architect`). It does **not** violate no-prose-policing: it matches *shapes* — index-subsection presence, `SCn` / `**Invariants:**` markers, `SCn` reference integrity — never "is this sentence really an invariant." **Confirmed.** Proportionality: the check is **presence-conditional** on ≥1 `SCn` and/or ≥1 journey `**Invariants:**` home; a project with neither fires nothing. **Risk flag (see below):** the conditionality must gate on *invariant-bearing homes*, not on "is security-bearing" — a non-security project can still have journey `**Invariants:**` blocks, and a security project can legitimately have `SCn` constraints that are all rule-only with no cross-cutting invariant worth indexing. The note must be a **note**, never a block, so a legitimately index-light project is nudged, not walled (matches the EPIC "wake-up not a wall" framing). The plan's wording handles this; calling it out so the coder keeps the `and/or` and the silent-when-no-homes branch exact.

**Q5 — Single-source / back-compat.** Additive only: the Behavioral-contract section keeps its taxonomy/format content unchanged; the index is a new subsection; `SCn` definitions are **not moved** (moving them would break threat→constraint-by-ID — explicitly rejected in Out of scope); no existing artifact gains a required field; no migration. A project with no invariants sees nothing change. The change **re-encodes nothing by name** — it points at `SCn` IDs and journey names that already exist, by reference. **Confirmed.**

## Variant A: index as additive subsection inside `## Behavioral contract` (plan's choice)

- **Where:** a "System invariants" index role within `## Behavioral contract (taxonomies & invariants)` in `architecture.md.tmpl`; authored by `pm-architect` (A2).
- **Relation to adjacent:** symmetric with the section's existing move-not-copy role and with threat→constraint-by-ID — same home-owns-it, reference-don't-duplicate shape.
- **Pros:** one home for "invariants" matching the section's self-declared role; index sits beside the inline invariants it already owns; A4 exclusion inherited for free; auditor check is one sibling note; zero migration.
- **Cons:** the section grows a second responsibility (taxonomy home + invariant index) — mild, and the title already advertises both.
- **Risks:** none structural beyond the proportionality wording in Q4.

## Variant B: new top-level `## System invariants` section

- **Where:** a sibling `##` section in architecture.md, pointing into the Behavioral contract for inline invariants.
- **Relation to adjacent:** **asymmetric / anti-pattern** — creates a second home for a concept the Behavioral contract already claims; inline invariants would then live in one section and be indexed from another, re-introducing the very "two partial lists" the feature exists to remove.
- **Pros:** a louder top-level entry point for a skimming reader.
- **Cons:** violates one-fact-one-owner; forces a new A4-exclusion carve-out for a brand-new section; splits inline invariants from their index; more surface for drift.
- **Risks:** the index and the Behavioral contract drift apart — exactly the failure this feature targets.

## Recommendation

**Variant A**, because the Behavioral contract already declares itself the single home for invariants, so an additive index subsection there satisfies one-fact-one-owner and inherits the A4 exclusion and the by-ID/by-name reference discipline for free; a new top-level section (B) would manufacture a second home and re-create the fragmentation the feature is removing.

## Risk for the PM

One thing to keep exact in coding (not a plan defect): the auditor note's firing condition must gate on **invariant-bearing homes** (`≥1 SCn` *and/or* `≥1` journey `**Invariants:**` block), **not** on "project is security-bearing" — otherwise a non-security project with journey invariants is missed, or a security project with rule-only `SCn` and no cross-cutting invariant is false-nudged. Keep it a **note**, never blocking, so substrate-first / index-light projects are woken, not walled.
