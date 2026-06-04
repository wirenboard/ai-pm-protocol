# taxonomy-drift-sweep — plan

Decision authority: autonomous

*Second slice of the EPIC cross-document-consistency auditor (`.ai-pm/backlog.md` → EPIC bullet "Cross-document consistency auditor" sub-class (a); "From downstream artifact review — 2026-06-04"). PM picked this slice 2026-06-04 to run autonomously. Slice 1 (`invariants-index`, v2.21.0) established the `## Behavioral contract (taxonomies & invariants)` section as the single home + a System-invariants index.*

Close the complementary gap: the single home exists and the **move-not-copy** discipline tells `docs/user-journeys.md` to *reference* the Behavioral contract, never restate machine identifiers — but **nothing audits for stale restated copies**. The downstream symptom is "6 statuses in the docs, 7 in the code" (Matter: `error` status in journeys vs "not emitted" in arch; an `matter_export_<…>` grammar in a journey vs an older arch formulation). This slice gives `pm-auditor` a **structural note** that catches a taxonomy / enum value / identifier-grammar **restated in `docs/user-journeys.md`** instead of referenced.

Meta-feature on the template repo: **software-kind**, the no-user-facing-contract exception; dev-docs in `doc/` (singular). Every scenario subject is `pm-auditor` / the journeys doc / the audit (non-human) → not user-facing → no Product Contract, no product-readiness advocate gate, no `## Validation` gate (Pass-2 is `code-review`). Verification = editorial + clean-grep.

## Scenarios

1. **A journey restating a declared taxonomy value → note (the precise drift catcher).** When `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` declares a taxonomy (a status enum, an identifier grammar) and `docs/user-journeys.md` **restates one of those declared values/identifiers verbatim** in a step body or a `**Invariants:**` block — instead of referencing the Behavioral contract — `pm-auditor` dimension 5 emits a **note**: the identifier is restated outside its single home; reference `## Behavioral contract` instead (the move-not-copy discipline). This is an **exact-token match against the declared taxonomy**, so it fires only when there is a declared taxonomy AND a journey carries a copy of one of its tokens — exactly the "6-in-docs-7-in-code" drift, caught structurally. **Gated to backticked / fenced (code-span) tokens** (per the arch note): the match fires only on a declared value that appears as a `` `code` ``-span / fenced token in the journey — a backtick is the author asserting "this is a machine token", which keeps the check provably shape-not-meaning. A declared enum value restated as **bare prose** (e.g. the word "active" in a sentence) is a **deliberate, documented miss** — distinguishing it from the ordinary English word is semantic judgement, explicitly out of scope (the template's own example enum is `pending`/`active`/`done`/`failed`, all common words).

2. **A journey carrying a wire-token shape → note.** Independent of any declared taxonomy: a `docs/user-journeys.md` step body or `**Invariants:**` block carrying a **wire-token shape** — the **same shapes the existing structural-token note already defines** (topic paths, `<x>_<y>` / `<…>_<…>` id/format grammars, dotted config keys, protocol flags `retain`/`QoS`, raw value-ranges like `0..254`; domain vocabulary such as `DimmableLight` / `Matter` / `fabric` is **never** flagged) — → **note** (machine identifier restated in a journey; reference the Behavioral contract instead). The wire-token vocabulary is **referenced by location, never re-encoded**.

3. **A dangling Behavioral-contract reference from a journey → note.** A journey that references `## Behavioral contract (taxonomies & invariants)` by name where that section is **absent or `N/A — <reason>`** → **note** (the reference resolves to nothing — either the taxonomy belongs in the Behavioral contract, or the journey should not reference it). A light structural reference-integrity check, the journeys-side sibling of the existing dangling-`SCn` check.

4. **Non-overlap with the existing contract / product-map token note.** The new checks fire on **`docs/user-journeys.md` only**. The existing structural-token note — wire-tokens in contract PM-sections (`## User value` / `## Out of scope`) and product-map value lines — is **untouched and not duplicated**; the new check is the journeys-surface complement, the surface the move-not-copy discipline governs but no auditor backstopped until now. Disjointness is **structural** (the two checks read different files), so no token can fire on both.

4a. **The intended `## Behavioral contract` reference is exempt — never flagged.** A journey line that *references* `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` by name (the correct move-not-copy form) is **never** a finding — the same relative-doc-reference carve-out the existing structural-token note already applies (a `docs/architecture.md` `## Behavioral contract` reference is the intended token-free form, not a wire-token). The new check inherits that exemption verbatim, so the correct form is never mistaken for a restatement.

5. **Structural / shape-not-meaning, note-not-blocking, presence-conditional.** The check matches only: declared-taxonomy **exact tokens**, wire-token **shapes**, and reference **presence**. It **never** judges whether a value is right, whether the enum is complete, or whether prose is good — the same discipline as the existing structural-token, threat↔constraint, and System-invariants-index checks beside it. **Note, never blocking** (subject to the dimension-wide "same gap in two consecutive full audits → blocking" rule that already governs dimension 5 — not a new escalation). **Silent** when `docs/user-journeys.md` is absent, carries no wire-token shapes, and restates no declared taxonomy token (proportional — a journey-light or identifier-free project sees nothing).

6. **Additive / back-compat.** Existing projects are unaffected until their next `/pm-audit`, where a journey that restates identifiers earns a **note** (never a block). No migration; no existing artifact gains a required field; no template structural change.

## Existing behaviors this feature touches

(from the protocol spec — what must not break)

- **The existing structural-token note** (contracts PM-sections + product-map value lines, `pm-auditor` dimension 5) — unchanged and **not duplicated**; the new check is the `docs/user-journeys.md` complement and reuses that note's wire-token vocabulary **by reference**.
- **The journeys move-not-copy discipline** (`doc/_templates/user-journeys.md.tmpl` and `pm-architect.md`'s journey format rule — human-language steps; identifiers referenced, not restated) — its text is unchanged; this feature makes it **auditor-backed** (an optional one-line "now backstopped by `pm-auditor`" pointer where the discipline is stated).
- **The dimension-5 structural family** (threat↔constraint wiring, System-invariants index) — the new check sits beside them, same structural family, same **note-not-blocking** + same two-consecutive-full-audits→blocking dimension rule.
- **The `## Behavioral contract` single-home + System-invariants index** (v2.21.0) — unchanged; this feature *enforces* the move-not-copy that keeps that home authoritative.
- **The no-prose-policing rule** — preserved; the new check matches shapes/tokens/reference-presence only.
- **Proportionality** — journey-light / identifier-free / journeys-absent projects get no new finding.

## Contracts

None. Meta-feature on the no-user-facing-contract template repo (the documented exception). No new API or data shape consumed by a downstream runtime.

## Interaction scenarios

Provably isolated: prose-spec change only — no runtime, no shared mutable state, no concurrent operations, no I/O. The cross-artifact coupling (journeys ↔ Behavioral-contract declared taxonomy ↔ the existing structural-token vocabulary) is read sequentially within a single audit pass and is covered by Scenarios 1–5 and the clean-grep verification.

## Test plan

*Repo discipline: "no automated tests by design — validation by use." Verification is editorial + clean-grep, the same shape as every prior meta-feature; `tests/hooks.sh` stays green — this feature touches no hook.*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged).
- New tests: none (prose-spec feature). Verification instead:
  - **Editorial walkthrough** — the new dimension-5 check matches Scenarios 1–3; it is presence-conditional, structural/shape-not-meaning, note-never-blocking.
  - **Clean-grep — non-overlap (sc4):** the new check names `docs/user-journeys.md` as its surface; the existing structural-token note (contracts + product-map) is byte-unchanged and the wire-token vocabulary is **referenced by location**, not re-encoded.
  - **Clean-grep — placement:** the new check sits in dimension 5 beside the threat↔constraint and System-invariants-index checks and inherits the dimension's note-not-blocking + two-consecutive-audits rule (not a new escalation).
  - **Clean-grep — shape-not-meaning / proportionality:** the check is described as structural (declared-taxonomy exact tokens + wire-token shapes + reference presence), never prose-policing; silent when journeys are absent / identifier-free.
  - **Proportionality check:** this template repo's own `doc/` (no `## Behavioral contract` taxonomy declared, journeys identifier-free) triggers no new finding.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `.claude/agents/pm-auditor.md`: add the dimension-5 **journey identifier-restatement** check (Scenarios 1–5), placed beside the System-invariants-index check (same structural family). It must: (a) fire on `docs/user-journeys.md` only; (b) reuse the existing structural-token wire-token vocabulary **by reference** (not re-encode it); (c) add the declared-taxonomy exact-token-restatement detection (sc1) and the dangling-Behavioral-contract-reference detection (sc3); (d) be structural/shape-not-meaning, note-never-blocking, presence-conditional; (e) state remediation = spawn `pm-architect` to move the identifier into the Behavioral contract and reference it (move-not-copy).
- `.claude/agents/pm-architect.md` *(optional, one line)*: where the journey move-not-copy format rule is stated, note it is now **backstopped by `pm-auditor`** (so a reader knows the discipline is enforced, not just advisory). Single sentence; no behavior change.
- `doc/architecture.md`: a short decision record — journeys-surface drift sweep enforcing move-not-copy; reuses the structural-token vocabulary by reference; declared-taxonomy exact-match as the precise drift catch; the journeys-side dangling-reference sibling; note-not-blocking; EPIC slice 2; siblings deferred. (Owned by `pm-architect`, post-coding handoff.)
- *(No `CLAUDE.md` / `MIGRATIONS.md` / template structural change — additive, no migration.)*

## Out of scope

- **The other cross-document-consistency sub-classes** — later EPIC slices, each its own plan:
  - **Temporal-status conflation** — "known limitation / planned / interim" in one doc vs "done / current" in another.
  - **ADR ↔ stack-notes backing** — every architectural decision cites stack-notes; none relies on absent stack knowledge.
  - **State-machine ↔ journeys single diagram** — one canonical state diagram referenced, not redrawn per journey.
  - **Journeys ↔ threat-model UX** — does a journey surface the mitigation a threat implies.
  - **NFR / operational-limits prompt** and the **conditional state-model section** — the whole-system-property gaps.
- **Re-doing the contract / product-map structural-token note** — already shipped; the new check covers `docs/user-journeys.md`, the previously-unenforced surface, and references the existing vocabulary rather than duplicating it.
- **Semantic value-diffing** ("are these two enum lists actually different in meaning / which one is right?") — out by design; the check is exact-token + shape + reference-presence structural matching, never prose-policing.
- **Promoting the note to blocking** — kept a **note** (subject only to the existing dimension-wide two-consecutive-audits escalation); the EPIC framing is a wake-up, not a wall.
- **Auto-fixing the restatement** — the auditor only flags; remediation is a `pm-architect` move-not-copy, never an auditor edit.
