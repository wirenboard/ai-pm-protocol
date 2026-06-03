# Plan-compliance review — behavioral-contract-and-human-journeys

Branch: `feature/behavioral-contract-human-journeys`
Commits reviewed: `4b1c6fa` (templates + agents + plan), `bb71293` (doc/architecture.md)
Repo type: ai-pm-protocol template repo (prose/template/agent-definition). Per the plan's Test plan there is no automated harness for template/agent prose; verification is by review against named checks. `tests/hooks.sh` is the only executable test.

Plan completeness: plan has Stack expectations touched (None, justified), Interaction scenarios, and is not a hotfix — no plan-completeness blocker. No stack component touched, so no stack-spec sections required.

## Plan compliance (Scenarios)

- ✓ **Scenario 1** (journey steps in plain human language, no identifiers, guidance demands it) — `doc/_templates/user-journeys.md.tmpl:13` adds the "plain human language … No protocol identifiers in the step bodies — no topic names, field names, status codes, message-retention or quality-of-service flags" guidance; example cells (`:18`) are human-language ("scans the device's QR code"). Verified by review check `journeys-template-human-steps`.
- ✓ **Scenario 2** (single distinct `## Behavioral contract (taxonomies & invariants)` section, separate from `## Integration contract`) — `doc/_templates/architecture.md.tmpl:65` new top-level `##` section; Integration contract header/body unchanged (diff shows no change to Integration contract lines). Section text explicitly contrasts "This is **not** the integration surface above". Verified by `arch-template-has-behavioral-contract`.
- ✓ **Scenario 3** (journey references the section; `**Invariants:**` carries human-level only; format/taxonomy invariants moved, not duplicated) — `user-journeys.md.tmpl:24` Invariants guidance routes format/taxonomy invariants out, with bullet `Format / taxonomy invariants for this journey: see docs/architecture.md ## Behavioral contract …` (`:28`). Move-not-copy framing present.
- ✓ **Scenario 4** (`pm-architect` A2 walks the new section incl. N/A guidance; A4 cross-check set NOT extended) — `pm-architect.md:18` (when-invoked list) and A2 (`:50`) both name the section, with `N/A — <reason>` and "Never invent a taxonomy". A4 (`:54`) explicitly states "The cross-check set is exactly these three pairings (File layout ↔ tree, Release flow ↔ CI, Integration contract ↔ README install) … Do not add it to the cross-check set." Verified by `a4-not-extended`.
- ✓ **Scenario 5** (`pm-legacy-reader` human-language steps + routes identifiers into architecture Behavioral contract, not journey bodies) — `pm-legacy-reader.md:70` new paragraph instructs human-language step bodies and routes "a status enumeration, a topic / ID / name grammar, a retain or QoS flag, a reachability rule … belongs in the architecture draft's `## Behavioral contract (taxonomies & invariants)` section, not in a journey step." Verified by `legacy-reader-routes-identifiers`.

## Test plan (review checks)

- ✓ `arch-template-has-behavioral-contract` — distinct section present, separate from Integration contract, names owned taxonomies (status enums, topic/ID grammars, QoS, retain, reachability) and an `N/A — <reason>` instruction with example. `architecture.md.tmpl:65-78`.
- ✓ `journeys-template-human-steps` — human-step guidance + no-identifier rule + `**Invariants:**` routing with a one-line pointer present. `user-journeys.md.tmpl:13,24,28`.
- ✓ `move-not-copy-guidance` — phrased as "state once + reference", never "restate + link". Architecture: "all live here, stated once … reference this section by name instead of copying identifiers". Journeys: "State it once … and reference that section … never restate the identifiers here beside a link, because a copy-beside-a-link drifts." Legacy-reader: "State each such identifier once there and let the journey reference that section by name — do not restate it in the step beside a pointer." The "restate/beside a link" phrasing appears only as the named anti-pattern, never as instruction. Compliant.
- ✓ `soft-break-safe` — checked edited regions: `**Drop-off points:**` (`user-journeys.md.tmpl:22`) and `**Invariants:**` (`:24`) are separated by a blank line; programmatic adjacency scan found no two adjacent non-blank bold-label lines. Architecture section uses blank-separated paragraphs, proper tables, and bullet lists. Compliant.
- ✓ `a4-not-extended` — A4 set still exactly File layout / Release flow / Integration contract; walk list (A2 / `:18` / `pm-bootstrap.md:141`) DOES include Behavioral contract. Confirmed both halves.
- ✓ `no-auditor-taxonomy-check` — `pm-auditor.md` is NOT in the branch diff (`git diff --name-only main...HEAD` has no auditor entry). Slice 4 stays out.
- ✓ `legacy-reader-routes-identifiers` — see Scenario 5.
- ✓ `bootstrap-walk-list-synced` — `pm-bootstrap.md:141` and `pm-architect.md:18` both include `Behavioral contract (taxonomies & invariants)`. Verified verbatim.
- ✓ Existing test `bash tests/hooks.sh` — ran: **65 passed, 0 failed, exit 0**.

## Scope boundaries

- ✓ No auditor anti-drift check added — `pm-auditor.md` absent from diff (slice 4 deferred).
- ✓ Journeys table shape preserved — header row `| Step | What the user does | What they expect | What can go wrong |` and `**Drop-off points:**` / `**Invariants:**` fields intact; only guidance text changed.
- ✓ Integration contract section unchanged — diff touches no Integration contract lines.
- ✓ No new file — diff is edits to 6 existing files + the plan; no new source/template file.
- ✓ `doc/architecture.md` records the decision — `bb71293` adds the "Behavioral contract owns technical taxonomies; journeys stay human-language" subsection with Source pointer.
- ✓ `product.md.tmpl` / `contract.md.tmpl` / README template / existing tests untouched — not in diff.

## Interaction scenarios

- ✓ Move-not-copy ordering in guidance — guidance states the value once in Behavioral contract and references from journey; the copy-beside-a-link case is named as forbidden (architecture.md.tmpl, user-journeys.md.tmpl, pm-legacy-reader.md).
- ✓ A4 not tripped — A4 text explicitly excludes the Behavioral contract from the cross-check set; a status table in it cannot produce a self-inflicted finding.
- ✓ Legacy-reader routing — identifiers routed into architecture draft's Behavioral contract section, not journey step bodies.
- ✓ Auditor unchanged — `pm-auditor.md` untouched; existing map/component/journey checks unaffected.

## Definition of Done

- [x] All plan scenarios implemented and tested (review checks, per Test plan)
- [x] Interaction scenarios have concurrent-state coverage (prose review checks per plan; no executable harness applies)
- [x] Stack expectations respected; stack-spec tests pass — N/A, no tracked stack component touched (plan: Stack expectations = None)
- [x] Product Contract honored — no Product Contract touched (template/agent-prose meta change; this repo produces no user-facing Product Contracts — deliberate exception recorded in `doc/architecture.md`)
- [x] Pipeline green — `tests/hooks.sh` 65/65 pass
- [x] State file updated — N/A for this review pass per plan; no `.ai-pm/state/current.md` requirement asserted in plan Docs-to-update
- [x] Product Impact Report present (when contract touched) — N/A, no contract touched
- [x] Docs updates landed — all six Docs-to-update present: `architecture.md.tmpl`, `user-journeys.md.tmpl`, `pm-architect.md`, `pm-bootstrap.md`, `pm-legacy-reader.md`, `doc/architecture.md`
- [x] Expected artifacts exist — plan (`doc/features/behavioral-contract-and-human-journeys_plan.md`) and this review present; no contract required (no user-facing feature)

**DoD: pass**

## Blocking

None.

## Notes (product)

None. Scope matches the plan exactly: the slice adds the home for taxonomies and the human-language journey guidance; the auditor anti-drift checker (slice 4) is correctly deferred. No silent sibling cases, no scope expansion.

## Verdict
approve

<!-- orchestrator appends after code-review pass: -->
## Code review findings

## Code review
