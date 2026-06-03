# Contract two-layer + PM-layer token lint + contract migration — plan

Root-cause fix for machine-tokens leaking into the PM-facing `product-map.md`, caught
live on wb-mqtt-matter (2026-06-03): the map's `Out of scope:` / `User value:` lines
carried wire-tokens (`bridge.*`, `mqtt.socketPath`, `serialNumber`, `DAC/PAI/CD`,
`DimmableLight`). The map only **projects** the contract's `## Out of scope` / `## User
value` — so the leak originates in the **contracts**, and the blame is a **template +
enforcement gap**, not an agent: `contract.md.tmpl` never designated those sections as
the token-free PM layer, and no structural lint catches it. Old contracts also restate
machine grammars (e.g. `matter_export_<type_slug>_<endpoint_id>`, topic conventions)
inline in Must-work / Must-not-break instead of referencing `architecture.md §
Behavioral contract` — because slice 3 (v2.8.0) extended the two-layer split into
`architecture.md.tmpl` + `user-journeys.md.tmpl` but **not** `contract.md.tmpl`.

This is the **legitimate-structural** part of two-layer slice 4 (the "PM layer contains
no machine tokens" backstop the backlog design principle named) — now with concrete
live proof — plus the slice-3 extension into contracts. Three coupled parts, one PR.

**Key decision (PM 2026-06-03, confirm on review): the lint targets WIRE-tokens only,
and ALLOWS domain vocabulary.** Wire-tokens = topic paths (`/…/…`), `<x>_<y>` /
`<…>_<…>` id/format grammars, dotted config keys (`bridge.*`, `mqtt.socketPath`),
protocol flags (`retain`, `QoS`), raw wire value-ranges (`0..254`). **Allowed**
(not flagged): domain type names the PM's ecosystem uses as product vocabulary —
`DimmableLight`, `Matter`, `fabric`. The fix is targeted, not "strip everything."

**Render decision (carried):** all edits soft-break-safe; no adjacent label lines.

## Scenarios

1. An author writing or changing a contract reads `contract.md.tmpl` guidance: `## User
   value` and `## Out of scope` are the **PM layer** — plain product language, no
   wire-tokens; machine grammars/taxonomies live in `architecture.md § Behavioral
   contract` and are referenced. `## Must work` / `## Must not break` reference the
   Behavioral contract for grammars instead of restating them.
2. When a plan/contract change introduces a wire-token into a contract's `## User value`
   / `## Out of scope` (or into the regenerated map's value/Out-of-scope lines),
   `pm-plan-checker` emits a **non-blocking structural note** — the token pattern + its
   location — with remediation "move it to `§ Behavioral contract` and reference it, or
   rephrase in product language." Purely a token-pattern match, not a judgment of the
   prose's meaning or quality.
3. `pm-auditor`'s project sweep flags existing contracts whose PM-facing sections carry
   wire-tokens as a **non-blocking structural note**, distinct from the no-prose-policing
   rule (it matches patterns, it does not validate intent).
4. A downstream contract carrying wire-tokens in its PM sections (or inline grammars in
   Must-work / Must-not-break that belong in `§ Behavioral contract`) is detected via
   `### Pending-migration detection` and offered the contract two-layer migration at
   `/pm-plan` and `/pm-audit`.
5. **The migration (move-not-copy, performed by `pm-architect`)** relocates the wire
   grammars/taxonomies into `architecture.md § Behavioral contract` (single owner),
   replaces them in the contract with a reference, and rephrases `## User value` /
   `## Out of scope` into token-free product language — **preserving every Must-work /
   Must-not-break guarantee** (the set of promises is unchanged; only the location and
   phrasing of the *technical detail* move).
6. After migration the product-map regenerates with a token-free PM layer; nothing
   user-visible changed and no guarantee was dropped.

## Existing behaviors this feature touches

(from the protocol's own agent/template behavior — what must not break)

- **`pm-auditor` no-prose-policing rule** (`pm-auditor.md:111` and the `product.md`
  structure-only check): the new token-lint must stay a **structural pattern match** —
  it flags wire-token *shapes*, never judges whether the prose is right/complete. The
  backlog design principle pre-blesses exactly this as "the legitimate structural
  anti-drift, NOT prose-policing." Frame it so it cannot be read as policing intent.
- **`pm-auditor` contract dimension** (`pm-auditor.md:99-102`): gains the structural
  token note; the existing "Must-work provably not met → blocking" check is unchanged
  and **must still hold after a migration** (the migration preserves every guarantee).
- **`pm-plan-checker` contract checks** (`pm-plan-checker.md:45-49`): gains the
  non-blocking structural token note on a plan/contract change. Its blocking contract
  checks (Must-work broken / Must-not-break violated / user-visible change without
  contract update) are unchanged.
- **`contract.md.tmpl` structure**: every existing section (`## User value`, `## Who
  uses it`, `## Must work`, `## Must not break`, `## Acceptance checks`, `## Out of
  scope`, `## Last reviewed`, `## Built/changed by`) is preserved — only two-layer
  guidance + the token rule are added.
- **`architecture.md § Behavioral contract`** (slice 3, v2.8.0): becomes the relocation
  target for contract grammars; the migration writes there (pm-architect owns it). One
  grammar shared by several contracts converges on **one** Behavioral-contract entry
  (single owner), not N copies.
- **Product map generation**: the map keeps projecting `## User value` / `## Out of
  scope`; after migration those are token-free, so the map's PM layer becomes clean with
  no generator change.
- **`### Pending-migration detection`** gains one condition (token-laden / inline-grammar
  contract); v2.2 / v2.3 / old-format-map / README-front-gate / pre-English-canonical
  conditions and procedures are untouched.

## Contracts

(changed data shapes — template + agent-check + detection)

- **`contract.md.tmpl`**: `## User value` + `## Out of scope` marked PM-layer
  (token-free, product language; grammars referenced from `§ Behavioral contract`);
  `## Must work` / `## Must not break` reference the Behavioral contract for
  grammars/taxonomies instead of restating. No section added or removed.
- **Structural token-lint**: a new non-blocking check in `pm-plan-checker` (on
  plan/contract change) and `pm-auditor` (project sweep) — wire-token pattern match over
  the contract's PM-facing sections AND the generated map's value/Out-of-scope lines.
- **`### Pending-migration detection`**: new condition — a contract with wire-tokens in
  its PM sections or inline grammars in Must-work/Must-not-break.
- No Product Contract created — template/meta change; this repo has no `.ai-pm/contracts/`
  of its own (template-repo exception).

## Stack expectations touched

None. Human-facing markdown templates + agent prose; `doc/stack-notes.md` does not track
document-body markdown as a stack component (consistent with all prior two-layer slices).
The token-lint is a structural pattern match expressed in agent prose, not a runtime
validator wired into a pipeline. Nothing stack-level to respect or test.

## Interaction scenarios

This feature is **not** provably isolated: the migration moves content between two
authored files (contract ↔ `architecture.md`), the lint reads the generated map, and
multiple contracts can share one grammar.

- **When the migration relocates a grammar (move-not-copy) and a guarantee is at stake:**
  every Must-work / Must-not-break promise in the original contract must map to a
  surviving promise in the migrated contract — the technical detail moves to `§
  Behavioral contract`, the *guarantee* stays. Verification: `pm-plan-checker` compares
  migrated-vs-original and blocks if any guarantee is dropped or weakened.
- **When several contracts share the same grammar** (e.g. the WB topic convention used
  by every Matter contract): the migration converges them on **one** `§ Behavioral
  contract` entry referenced by all, not a copy per contract (single-owner; avoids
  re-introducing drift).
- **When the token-lint runs against the map's value lines:** it stays structural — it
  must not collide with `pm-auditor.md:111`'s "must not police their prose"; it flags
  only wire-token shapes, never prose meaning.
- **When the migration finishes, the product-map is regenerated:** the PM layer is now
  token-free, and the contract's Acceptance-check tests still pass (code untouched — only
  contract prose moved).

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — hooks untouched (71/71).
- **No automated harness for templates/agent prose** (meta-infrastructure exception);
  verification is by review. This template repo has no contracts of its own, so the
  migration + guarantee-preservation are verified against the worked example, not a live
  contract.
  - **New tests (review checks):**
    - `contract-tmpl-two-layer`: `contract.md.tmpl` marks `## User value` + `## Out of
      scope` as token-free PM layer and instructs `## Must work`/`## Must not break` to
      reference `§ Behavioral contract` for grammars; all existing sections preserved;
      soft-break-safe.
    - `token-patterns-precise`: the defined wire-token pattern set MATCHES the real
      leaked tokens (`bridge.*`, `mqtt.socketPath`, `matter_export_<…>`,
      `/devices/.../on`, `0..254`, `retain`, `QoS`) and does NOT match the allowed
      domain vocabulary (`DimmableLight`, `Matter`, `fabric`) — the Key decision is
      encoded, not "strip everything."
    - `lint-is-structural-not-prose`: the lint in `pm-auditor.md` + `pm-plan-checker.md`
      is described as a structural pattern match (non-blocking note), explicitly NOT a
      judgment of prose meaning/quality — consistent with `pm-auditor.md:111`.
    - `detection-condition-added`: `### Pending-migration detection` gains exactly one
      condition (token-laden / inline-grammar contract); v2.2/v2.3/old-format-map/
      README-front-gate/pre-English-canonical conditions byte-unchanged.
    - `migration-move-not-copy`: the contract two-layer migration procedure relocates
      grammars into `§ Behavioral contract` (single owner), references them from the
      contract, rephrases PM sections token-free, performed by `pm-architect`; a worked
      before/after example shows a token in `## Out of scope` relocated + referenced.
  - **Interaction scenario tests (review checks):**
    - `migration-preserves-every-guarantee`: the procedure mandates that the set of
      Must-work/Must-not-break promises is unchanged, and `pm-plan-checker` compares
      migrated-vs-original and **blocks** if any guarantee is dropped or weakened
      (verification that nothing broke).
    - `shared-grammar-single-owner`: the procedure states that a grammar used by several
      contracts converges on one `§ Behavioral contract` entry, not N copies.
    - `post-migration-map-token-free`: after migration the regenerated map's PM layer
      has no wire-tokens; the contract's Acceptance-check tests still pass (code
      untouched).
    - `nudge-surfaces`: the `/pm-plan` nudge and `/pm-audit` + `pm-auditor` note surface
      the token-laden-contract case, referencing `### Pending-migration detection` by
      name.
- **Stack-spec tests:** none — no tracked stack component touched.

## Docs to update

- `doc/_templates/contract.md.tmpl` — two-layer guidance + token rule (PM sections
  token-free; Must-work/not-break reference `§ Behavioral contract`).
- `.claude/agents/pm-auditor.md` — structural token note in the contract dimension
  (`:99-102`) and over the map's PM-layer lines (`:108-116`); explicitly structural, not
  prose-policing.
- `.claude/agents/pm-plan-checker.md` — non-blocking structural token note on a
  plan/contract change; plus the migrated-vs-original **guarantee-preservation block**
  for the migration verification.
- `.claude/commands/pm-bootstrap.md` — `### Pending-migration detection` new condition +
  the **contract two-layer migration procedure** (move-not-copy, pm-architect, preserve
  every guarantee, 3-part verification).
- `.claude/commands/pm-plan.md` + `.claude/commands/pm-audit.md` — the token-laden-
  contract migration nudge, referencing `### Pending-migration detection` by name.
- `doc/architecture.md` — record the decision: contracts are two-layer (PM sections
  token-free; grammars single-owned in `§ Behavioral contract`, referenced); the
  structural wire-token lint and its wire-only / allow-domain-vocabulary boundary.
  Owner: `pm-architect` (post-coder).

## Out of scope

- **Stripping domain type names** (`DimmableLight`, `Matter`, `fabric`) — the categorical
  sibling of the wire-token choice. The lint targets wire-tokens only and allows product
  vocabulary (PM decision, confirm on review). Widening the lint to all CamelCase/domain
  terms is a separate decision, not taken here.
- **Auto-rewriting authored contract prose meaning** — the migration relocates/rephrases
  *technical tokens* and preserves *guarantees*; it does not change what a contract
  promises or judge prose quality (no prose-policing).
- **The contested 4-field map "logic" field** — the validation point (2026-06-03 live
  re-read) showed the value-first map already removes the originating pain, so the
  "logic" field stays deferred; this plan delivers only the structural token backstop.
- **Migration-procedures extraction to a reference** (backlog item, this repo) —
  independent; this can land first or alongside.
- **Changing the product-map generator** — the map already projects User value / Out of
  scope; once the contracts are token-free the map's PM layer is clean with no generator
  change.
