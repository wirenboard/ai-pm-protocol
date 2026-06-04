# taxonomy-drift-sweep — design notes

## Context

EPIC cross-document-consistency auditor, slice 2 (slice 1 = `invariants-index`, v2.21.0). Slice 1 made `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` the **single home** for taxonomies + the System-invariants index. This slice closes the complementary gap: the move-not-copy discipline *tells* `docs/user-journeys.md` to reference that home and never restate machine identifiers, but **nothing audits for stale restated copies** — the "6-in-docs-7-in-code" drift. The plan adds a `pm-auditor` dimension-5 **note** that catches a taxonomy value / identifier grammar restated in a journey instead of referenced.

The structural choice is **how the journeys-surface detection is scoped** — specifically the sc1 declared-taxonomy exact-token match, where the failure mode (a declared enum value that is also a common English word) is the one real design risk. Everything else (vocabulary reuse, non-overlap, placement, back-compat) is settled by the patterns slice 1 already established; I confirm them and concentrate the variant work on sc1.

Prose-spec / meta-feature on the template repo (software-kind, no-user-facing-contract exception). No runtime, no shared state. "Adjacent implementations" are the protocol's own dimension-5 cross-doc check patterns.

## Adjacent implementations (protocol patterns of the same shape)

1. **Existing structural-token note** — `pm-auditor.md:106` (contracts `## User value` / `## Out of scope`) and `:116` (product-map value lines). Defines the wire-token vocabulary **once**: topic paths (leading-slash `/devices/.../on`), `<x>_<y>` id/format grammars (`matter_export_<…>`), dotted config keys (`bridge.*`, `mqtt.socketPath`), protocol flags (`retain`/`QoS`), raw value-ranges (`0..254`); domain vocabulary (`DimmableLight`, `Matter`, `fabric`) **never** flagged. Critically, it **already carves out the reference-form**: a relative `docs/architecture.md` `## Behavioral contract` pointer "is the intended token-free form and is **never** flagged" (`:106`). This is the vocabulary the new check reuses *by reference* and the carve-out it must inherit.

2. **threat ↔ constraint wiring** — `pm-auditor.md:134`. "Structural ID-match only — never prose-police." Dangling-`SCn` / orphan-constraint cross-check. The sc3 dangling-Behavioral-contract-reference check is the journeys-side sibling of this shape.

3. **System-invariants index ↔ invariant homes** — `pm-auditor.md:135-138` (slice 1). Gate on **invariant-bearing homes**, note-never-blocking, "match the *presence* of `SCn` tokens / journey `**Invariants:**` markers … never judge whether a statement *is really* an invariant." The new check sits directly beside this one, same family, same discipline. It is also the precedent for **scoping detection to `**Invariants:**` blocks** — see Variant A.

4. **The dimension-5 escalation rule** — `pm-auditor.md:140`: "the same gap flagged in two consecutive full audits upgrades to blocking." The new note inherits this; it is **not** a new escalation.

## Behavioral risks in this area

Not event-driven code — no subscription/feedback surface. The only risk is the auditor's own **false-positive rate**: a check that over-fires on ordinary journey prose would erode trust in dimension 5 and, via the two-consecutive-audits rule, could escalate a non-issue to blocking. This is the risk the sc1 scoping decision exists to contain. The complementary risk — a token that fires under *both* the existing note and the new one (double-flag) — is closed by the surface split (sc4); see Q2.

## Settling the five structural questions

**Q1 — Vocabulary reuse by reference, not re-encode.** The wire-token vocabulary has exactly one home (`pm-auditor.md:106`). sc2 must point at it ("the same shapes the existing structural-token note already defines") and **must not** restate the token list — re-encoding it creates a second list that drifts, the precise failure this EPIC exists to remove, and would be self-parody in a slice about move-not-copy. Reference mechanism: name the existing note by its dimension-5 location and reuse its shapes; inherit its `DimmableLight`/`Matter` domain-vocab exclusion **and** its relative-doc-reference carve-out (`:106`) verbatim-by-reference. **Confirmed.**

**Q2 — Non-overlap / double-flag.** The split is by **surface**, and the surfaces are disjoint: existing = contract PM-sections (`## User value` / `## Out of scope`) + product-map value lines; new = `docs/user-journeys.md` step bodies + `**Invariants:**` blocks. No file is read by both checks, so no token can fire on both notes — the disjointness is structural, not a tie-break rule. One subtlety to keep exact in coding: the **intended** journeys reference form *is* a relative `docs/architecture.md` `## Behavioral contract` pointer, which the existing note already exempts (`:106`); the new check must carry the **same exemption** or it will flag every correctly-written journey (the reference is the move-not-copy goal, not a violation). **Confirmed, with that exemption called out as load-bearing.**

**Q3 — sc1 declared-taxonomy exact-token match — soundness + the common-word failure mode (the main design risk).** Matching journey text against the Behavioral contract's *declared* enum values / id-grammars is sound **in principle** — it is exact-token (not semantic diffing), and it is the most precise catch (it fires only when there is a declared taxonomy AND a journey carries a literal copy of one of its tokens). But naive substring matching over-fires badly: the template's own example enum is `pending` / `active` / `done` / `failed` (`architecture.md.tmpl:72-74`) — `active`, `done`, `error`, `complete` are all ordinary English words that appear in legitimate human-language journey steps ("the user is done", "an error message appears"). A check that flags those is **prose-policing wearing a structural costume** and will train PMs to ignore dimension 5. **This is the real risk; it must be scoped down.** See Variant A vs B — recommendation: require the matched token to be in a **code span / backticked or fenced identifier** before it counts (shape-not-meaning: a backtick *is* the author asserting "this is a machine token"), which also keeps the check honestly structural. **Confirmed sound only with the scoping in Variant A.**

**Q4 — Placement + family.** The new check belongs in **dimension 5** beside the threat↔constraint (`:134`) and System-invariants-index (`:135-138`) checks: same cross-doc structural family, same shape-not-meaning discipline, same **note-not-blocking** weight, same remediation (spawn `pm-architect` to move the identifier into the Behavioral contract and reference it). It inherits the dimension's two-consecutive-full-audits→blocking rule (`:140`) — **not a new escalation**. Presence-conditional: silent when `docs/user-journeys.md` is absent, carries no wire-token shapes, and restates no declared taxonomy token. **Confirmed.**

**Q5 — Single-source / back-compat.** Additive only. Re-encodes nothing (vocabulary by reference, Q1). No template structural change, no new required field, no migration. Existing projects are untouched until their next `/pm-audit`, where a restating journey earns a **note** (never a block). A journey-light / identifier-free / journeys-absent project sees nothing (proportionality). **Confirmed.**

## Variant A: code-span-scoped exact-token + `**Invariants:**`-anchored detection (recommended)

- **Where:** `pm-auditor.md` dimension 5, new check after the System-invariants-index check.
- **Scope (the load-bearing part):**
  - **sc1 (declared-taxonomy exact match):** a declared enum value / id-grammar token counts as a restatement **only when it appears inside a backticked code span or fenced block** in a journey step or `**Invariants:**` block. A backtick is the author explicitly marking the text as a machine token — so matching it is shape-not-meaning, and a bare English word (`the user is done`) never fires.
  - **sc2 (wire-token shape):** reuse the existing note's shapes by reference; these are self-identifying by shape (a leading-slash topic, `<x>_<y>`, dotted key, `retain`/`QoS`, `0..254`) and need no extra gate beyond the existing domain-vocab + relative-doc-reference exemptions.
  - **sc3 (dangling Behavioral-contract reference):** structural reference-presence — a journey names `## Behavioral contract` where the section is absent or `N/A`.
- **Relation to adjacent:** symmetric with the System-invariants-index check's "match the *presence* of markers, never judge meaning" (`:138`) and with the existing note's code-shape matching. The backtick gate is the journeys analogue of "wire-token-shaped" — both reduce a match to a typographic/lexical shape the author chose.
- **Pros:** kills the common-word false positive at the source; stays provably shape-not-meaning (matches a code span, never reads a sentence); low PM-annoyance, so the two-consecutive-audits escalation only ever bites a real restatement; reuses the vocabulary by reference.
- **Cons:** a journey that restates a declared enum value **as bare prose** (no backticks) slips through. Acceptable: bare-prose restatement is indistinguishable from legitimate English without semantic judgment, which is explicitly out of scope (plan "Out of scope: semantic value-diffing"). The check catches the high-signal case (author *typeset* it as a token) and accepts the low-signal miss rather than over-fire.
- **Risks:** none structural; the residual miss is by-design and documented.

## Variant B: bare exact-token match against the declared taxonomy (rejected)

- **Where:** same location.
- **Scope:** sc1 matches any occurrence of a declared enum value / grammar token anywhere in journey text, code-span or not.
- **Relation to adjacent:** **breaks** the family's shape-not-meaning discipline — it would fire on `active`, `done`, `error` as plain words, which requires the auditor to decide "is this word being used as the enum or as English?" — i.e. prose-policing, the line the whole family refuses to cross.
- **Pros:** catches bare-prose restatements Variant A misses.
- **Cons:** unacceptable false-positive rate on common-word enums (the template's own `active`/`done`/`failed` example); via the two-consecutive-audits rule it can escalate a false positive to **blocking**; erodes trust in dimension 5; effectively prose-policing.
- **Risks:** the check becomes noise PMs filter out, defeating its purpose.

## Recommendation

**Variant A.** The declared-taxonomy exact-token match (sc1) is sound only when gated to **backticked / fenced tokens** — the backtick is the author's own structural assertion that the text is a machine identifier, which keeps the check shape-not-meaning and avoids over-firing on common-word enums like `active` / `done` / `error` (the template's own example values). Accepting the bare-prose miss is the correct trade: it is the boundary of structural detection, and crossing it (Variant B) means semantic judgment that is explicitly out of scope and risks escalating false positives to blocking.

## Risks for the PM

1. **Keep sc1 gated to code-span tokens (the one thing to get exact in coding).** Without the backtick/fenced-block gate, the declared-taxonomy match over-fires on ordinary English (`active`, `done`, `error`, `complete`) and, via the existing two-consecutive-full-audits→blocking rule, a false positive can escalate to **blocking**. Gate it; accept the bare-prose miss.
2. **Inherit the relative-doc-reference exemption (`pm-auditor.md:106`).** The *correct* journeys form is a `docs/architecture.md` `## Behavioral contract` pointer; the existing note already exempts it. The new check must carry the same exemption or it flags every well-written journey.
3. **Reuse the wire-token vocabulary by reference only.** Re-encoding the token list in the new check would create the exact second-list drift this EPIC removes — and would be ironic in a move-not-copy slice. Point at `pm-auditor.md`'s existing note location; do not restate the list.
