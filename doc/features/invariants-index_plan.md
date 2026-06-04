# invariants-index — plan

*First slice of the EPIC cross-document-consistency-auditor (`.ai-pm/backlog.md` → "From downstream artifact review — 2026-06-04 (wb-mqtt-matter docs)" first bullet + the EPIC "Cross-document consistency auditor" bullet). PM picked this slice 2026-06-04.*

Make `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` the **single index / entry point** for the project's system invariants — so a top-down reader finds one list, not three partial ones keyed differently. Today invariants are fragmented across three homes: format/taxonomy invariants already live **in** the Behavioral contract; rule-shaped invariants live as `SCn` in `## Security constraints` (referenced by the threat-model by ID); and product-level / journey-level invariants live in `docs/product.md` and the per-journey `**Invariants:**` blocks. The fix applies the protocol's own *one-fact-one-owner / reference-don't-duplicate* and *threat→constraint-by-ID* patterns to invariants: the Behavioral contract **indexes** invariants by reference (an `SCn` by ID; a journey by name; inline only when the Behavioral contract is itself the home), **never relocating** the `SCn` ones (moving them would break the threat→constraint-by-ID wiring) and never restating identifiers (a copy-beside-a-link drifts).

Meta-feature on the template repo: **software-kind**, the no-user-facing-contract exception; dev-docs in `doc/` (singular). Every scenario subject is the architecture doc / the index / `pm-architect` / `pm-auditor` (non-human) → not user-facing → no Product Contract, no product-readiness advocate gate, no `## Validation` gate (Pass-2 is `code-review`). Verification = editorial + clean-grep.

## Scenarios

1. **The Behavioral contract carries a System-invariants index.** The `## Behavioral contract (taxonomies & invariants)` template section (`doc/_templates/architecture.md.tmpl`) gains an explicit **"System invariants"** index role: a short list where each cross-cutting system invariant points to its single home — **inline** when the Behavioral contract is the home (a format/taxonomy/transport invariant it already states), **by `SCn` ID** when the invariant is enforced as a security constraint (never restated — the rule text stays in `## Security constraints`), **by journey reference** when it is a journey-level precondition. The section keeps its existing format/taxonomy content unchanged; the index is additive. `N/A — <reason>` when the project has no system invariants.

2. **`SCn`-enforced invariants are indexed by ID, never moved.** An invariant that is enforced as a security constraint (e.g. "one commissioning window at a time" living as `SC5`) appears in the index as a **reference to its `SCn` ID**, with a human hint only — exactly mirroring the threat→constraint Mitigation pattern. The `SCn` definition stays in `## Security constraints`; the threat→constraint-by-ID wiring is untouched. No rule text is duplicated.

3. **`pm-architect` authors and maintains the index.** `pm-architect` (which already owns `docs/architecture.md`, `docs/user-journeys.md`, and the `SCn` IDs) gains the explicit role: when authoring/refreshing the Behavioral contract, build the System-invariants index by reference — index every invariant that lives as an `SCn` (by ID) or as a journey precondition (by name), and state inline only those whose single home is the Behavioral contract itself. Never restate an `SCn` rule or a journey identifier in the index; never invent an invariant to fill it (`N/A` when none).

3a. **The index is not added to the A4 cross-check set.** Like the rest of the Behavioral contract, the System-invariants index is authored domain content with no external artifact to diverge from — it is **not** one of the three A4 cross-check pairings (File layout↔tree, Release flow↔CI, Integration contract↔README). It never produces an A4 finding.

4. **`pm-auditor` notes scattered-but-unindexed invariants (structural, conditional).** `pm-auditor` dimension 5 (docs currency) gains a check, sibling to the existing threat↔constraint wiring check and the same structural family: when the project has invariant-bearing homes (**≥1 `SCn`** in `## Security constraints` **and/or ≥1 journey `**Invariants:**` block** in `docs/user-journeys.md`) but the Behavioral contract has **no System-invariants index** → **note**; and an index entry whose `SCn` reference no constraint defines (a **dangling `SCn`**) → **note**. Remediation: spawn `pm-architect` to build/reconcile the index. Conditional/proportional: a project with no invariant homes triggers nothing (silent).

5. **Structural / shape-not-meaning, never prose-policing.** The auditor check matches only **shapes** — the presence of the index subsection, the presence of `SCn` tokens / `**Invariants:**` block markers, and `SCn` reference integrity. It **never** judges whether a sentence "is really an invariant", whether the index is complete in meaning, or whether the wording is good — the same discipline as the existing structural-token note and the threat↔constraint ID-match check. It reads markers and IDs, not prose meaning.

6. **Additive and back-compat.** Existing downstream projects are unaffected until their next `/pm-audit`, where they may get the new **note** (never a block) nudging them to index their invariants. No migration; no existing artifact gains a required field; a project with no invariants sees nothing change.

## Existing behaviors this feature touches

(from the protocol spec — what must not break)

- **The `## Behavioral contract (taxonomies & invariants)` section** keeps its current role and format (the single home for taxonomies/format invariants; journeys reference it move-not-copy). The System-invariants index is an additive subsection, not a replacement.
- **The `SCn` scheme + threat→constraint-by-ID wiring** (`pm-architect` A2 / the threat-model lifecycle / `pm-auditor` dimension 5 threat↔constraint check) is untouched — the index *references* `SCn` IDs, it never renumbers, moves, or duplicates them.
- **`pm-architect` A4 cross-check set** stays exactly the three existing pairings — the index is explicitly not added (scenario 3a).
- **`docs/user-journeys.md` move-not-copy discipline** (journey steps in human language; format/taxonomy invariants referenced, not restated) is unchanged; the index points *to* journeys, it does not pull their content up.
- **`pm-auditor` no-prose-policing rule** — the new note is structural shape/ID matching only, consistent with the existing structural-token and threat↔constraint notes.
- **Proportionality** — substrate/backend/tiny projects with no invariants get no new ceremony (the check is presence-conditional).

## Contracts

None. Meta-feature on the no-user-facing-contract template repo (the documented exception). No new API or data shape consumed by a downstream runtime — the "System invariants" index is the protocol's own architecture-doc vocabulary.

## Interaction scenarios

Provably isolated: prose-spec change only — no runtime, no shared mutable state, no concurrent operations, no I/O. The cross-artifact coupling (Behavioral-contract index ↔ `SCn` constraints ↔ journey invariant blocks ↔ auditor check) is sequential within a single audit/author pass and is covered by Scenarios 1–6 and the clean-grep verification.

## Test plan

*Repo discipline: "no automated tests by design — validation by use." Verification is editorial + clean-grep, the same shape as every prior meta-feature; `tests/hooks.sh` stays green — this feature touches no hook.*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged).
- New tests: none (prose-spec feature). Verification instead:
  - **Editorial walkthrough** — the System-invariants index is additive to the Behavioral contract; the section's existing taxonomy/format content and the `SCn` scheme are unchanged; the index references `SCn` by ID and journeys by name, never restating them.
  - **Clean-grep — no relocation / no duplication:** no `SCn` rule text is moved out of `## Security constraints` or duplicated into the index; the threat→constraint-by-ID wiring text is byte-unchanged.
  - **Clean-grep — A4 untouched:** the A4 cross-check set in `pm-architect.md` still lists exactly the three pairings; the Behavioral contract (and its index) remains excluded.
  - **Clean-grep — auditor conditionality:** the new dimension-5 note fires only on presence of `SCn` and/or `**Invariants:**` homes; it is described as structural/shape-not-meaning and as a **note** (never blocking); it sits beside the existing threat↔constraint wiring check.
  - **Proportionality check:** a project with no `SCn` and no journey `**Invariants:**` blocks (e.g. this template repo's own `doc/`) triggers no new finding.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `doc/_templates/architecture.md.tmpl`: extend the `## Behavioral contract (taxonomies & invariants)` section description to define the **"System invariants" index** — list each cross-cutting invariant by reference (inline / `SCn` by ID / journey by name), reference-don't-duplicate, `N/A` when none; add a short index example (mirroring the section's existing examples). (Owned by `pm-architect`; this is a template file, edited by `pm-coder` as the deliverable since it is template content, not the live `doc/architecture.md`.)
- `.claude/agents/pm-architect.md`: extend A2 (and the Behavioral-contract description) with the index-authoring role — build the System-invariants index by reference when authoring/refreshing the Behavioral contract; never restate an `SCn` rule or journey identifier; `N/A` when none; reaffirm the index is **not** in the A4 cross-check set (scenario 3a).
- `.claude/agents/pm-auditor.md`: add the dimension-5 structural note (scenario 4 + 5), sibling to the threat↔constraint wiring check — presence-conditional, shape-not-meaning, note-not-blocking.
- `doc/architecture.md`: a short decision record — invariants single-index via the Behavioral contract, by-reference (apply threat→constraint-by-ID + reference-don't-duplicate to invariants), why `SCn` invariants are indexed-not-moved, the conditional structural auditor note, and the EPIC sibling slices deferred. (Owned by `pm-architect`, post-coding handoff.)
- *(No `CLAUDE.md`/`MIGRATIONS.md` change — additive, no migration; no `docs/user-journeys.md` change — the move-not-copy discipline already points journeys at the Behavioral contract.)*

## Out of scope

- **The other cross-document-consistency sub-classes** — siblings in the EPIC, each its own later slice:
  - **Single-source enum/taxonomy drift sweep** — detect an enum/id-grammar *restated* in journeys/contracts and drifted from its Behavioral-contract home. (This slice indexes invariants; it does not sweep stale copies of taxonomies.)
  - **Temporal-status conflation** — "known limitation / planned / interim" in one doc vs "done / current" in another.
  - **ADR ↔ stack-notes backing** — every architectural decision cites stack-notes; no decision relies on absent stack knowledge.
  - **State-machine ↔ journeys single diagram** — one canonical state diagram referenced, not redrawn per journey.
  - **Journeys ↔ threat-model UX** — does a journey surface the mitigation a threat implies.
- **Relocating `SCn` security-constraint invariants** into the Behavioral contract — explicitly rejected: it would break the threat→constraint-by-ID wiring; the index references them by ID instead.
- **Promoting the auditor note to blocking** — kept a **note** (the EPIC framing: a wake-up, not a wall; substrate-first is legitimate). A future plan may revisit if drift proves harmful.
- **Semantic "is this really an invariant?" detection** — out by design; the check is structural shape/ID matching, never prose-policing.
