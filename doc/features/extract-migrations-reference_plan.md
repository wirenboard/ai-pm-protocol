# Extract the migration catalogue into a standalone reference — plan

Backlog item "From migration-machinery growth — 2026-06-03", now unblocked
(English-canonical landed). Pure structural refactor of the protocol's own docs —
**no behavior change**. `.claude/commands/pm-bootstrap.md` has grown a large inline
migration catalogue: the `### Pending template-upgrade migrations` /
`### Pending-migration detection` block plus the per-version migration procedures
(v2.2 `_index.md`→map, v2.3 product.md split, old-format-map regenerate, README
front-gate move-not-copy, product.md header-migration, contract two-layer migration).
It mixes "how to bootstrap" with "how to migrate N template versions" and grows every
time a migration is added. Pull it into a dedicated reference, leave a short pointer in
`pm-bootstrap.md`, and **keep the single-source-of-conditions invariant** — everyone
still references one home by name.

**Move-not-copy:** the catalogue *moves*; it is not duplicated. A copy-plus-pointer
would re-introduce the exact drift this extraction exists to prevent.

## Scenarios

1. The migration catalogue (detection conditions + every per-version migration
   procedure) lives in **one dedicated reference**, not inline in `pm-bootstrap.md`.
2. `pm-bootstrap.md` keeps a short pointer where the catalogue was — the re-bootstrap
   flow that runs pending migrations follows the pointer and still finds every
   migration. `pm-bootstrap.md` is meaningfully shorter and no longer mixes bootstrap
   with the migration catalogue.
3. Every live by-name reference still resolves: `pm-plan.md`, `pm-audit.md`,
   `pm-auditor.md`, `pm-plan-checker.md` point at the new home (by name) instead of
   "`### Pending-migration detection` in `pm-bootstrap.md`". No dangling reference.
4. The `## Product map generation procedure` **stays in `pm-bootstrap.md`** (it is a
   generation, not a migration); its many referrers (pm-audit, pm-architect, pm-auditor,
   pm-plan, architecture.md) are unchanged. Migration procedures that say "the Product
   map generation procedure below" are rewritten to the cross-file reference so they
   still resolve.
5. Nothing is lost: every detection condition and every per-version procedure present
   before is present in the new reference, verbatim in substance.

## Existing behaviors this feature touches

(from the protocol's own structure — what must not break)

- **`### Pending-migration detection` is the single source of conditions**, referenced
  by name from `pm-plan.md`, `pm-audit.md`, `pm-auditor.md`, `pm-plan-checker.md`. After
  the move, all four must point at the new home — the single-source invariant is
  preserved, just relocated. (Historical `doc/features/*_plan.md` that mention it are a
  frozen record — **not** updated.)
- **The `/pm-bootstrap` re-bootstrap flow** detects and runs pending migrations — it
  must still reach every procedure via the pointer.
- **Each migration's cross-references** ("the Product map generation procedure", "see
  `### Pending-migration detection` above", references to sibling migrations) must keep
  resolving after the split — some become cross-file references.
- **The `## Product map generation procedure`** and its referrers — unchanged (it stays
  in `pm-bootstrap.md`).
- **`tests/hooks.sh`** — hooks are untouched; stays 71/71.
- **Downstream consumption**: the new reference must resolve both in this repo (dogfood,
  `doc/`) and in a downstream project (the tooling submodule, `docs/` / `.ai-pm/tooling`)
  — the home + reference mechanism is a structural choice (see architect note below).

## Contracts

(changed structure — relocated doc)

- **New reference doc** (path is the architect's/coder's call — a shipped, agent-readable
  location that resolves in both this-repo and downstream): holds the
  `### Pending-migration detection` conditions + every per-version migration procedure.
- **`pm-bootstrap.md`**: the inline catalogue is replaced by a short pointer to the new
  reference; the `## Product map generation procedure` stays.
- **`pm-plan.md` / `pm-audit.md` / `pm-auditor.md` / `pm-plan-checker.md`**: by-name
  references re-pointed to the new home.
- No Product Contract (template/meta refactor; no `.ai-pm/contracts/` in this repo).

## Stack expectations touched

None. Human-facing markdown / agent prose; `doc/stack-notes.md` does not track
document-body markdown as a stack component. No new construct. Nothing stack-level to
respect or test.

## Interaction scenarios

This feature is **not** provably isolated: the moved catalogue is referenced by four
live files and the bootstrap flow, and it cross-references the (staying) generation
procedure.

- **When `/pm-plan` or `/pm-audit` surfaces a pending-migration nudge after the move:**
  it follows the re-pointed by-name reference to the new home and finds the same
  conditions/procedures — the nudge text and behavior are unchanged.
- **When `pm-auditor` / `pm-plan-checker` evaluates a migration condition after the
  move:** the by-name reference resolves to the new home; the condition set is
  identical (none added, none lost).
- **When a migration procedure in the new reference cross-references the Product map
  generation procedure (still in `pm-bootstrap.md`):** the cross-file reference resolves
  — the regenerate step still works.
- **When `/pm-bootstrap` re-runs on a downstream project:** it follows the pointer and
  runs the pending migrations exactly as before.

## Test plan

- Existing tests that must pass: `bash tests/hooks.sh` — hooks untouched (71/71).
- **No automated harness for doc structure** (meta-infrastructure exception);
  verification is by review + grep:
  - **New tests (review/grep checks):**
    - `no-dangling-detection-ref`: `grep -rn "Pending-migration detection" .claude` shows
      every **live** referrer (`pm-plan.md`, `pm-audit.md`, `pm-auditor.md`,
      `pm-plan-checker.md`, and `pm-bootstrap.md`'s pointer) resolves to the new home —
      no live file points at a section no longer in `pm-bootstrap.md`.
    - `catalogue-complete-in-reference`: every detection condition (v2.2, v2.3,
      old-format-map, README-front-gate, pre-English-canonical product.md,
      token-laden-contract) and every per-version procedure present before the move is
      present in the new reference — diff the moved block against its pre-move content;
      none lost, none silently altered.
    - `move-not-copy`: the catalogue exists in exactly **one** place after the move — the
      content is gone from `pm-bootstrap.md` (only a pointer remains), not duplicated.
    - `generation-procedure-stays`: `## Product map generation procedure` is still in
      `pm-bootstrap.md`; its referrers (pm-audit, pm-architect, pm-auditor, pm-plan,
      architecture.md) are unchanged; migration procedures that reference it now use a
      resolving cross-file reference.
    - `bootstrap-flow-intact`: the `/pm-bootstrap` re-bootstrap detect-and-run flow
      reaches every migration via the pointer (walk the flow in review).
  - **Interaction scenario tests (review checks):**
    - `nudge-surfaces-resolve`: the `/pm-plan` and `/pm-audit` pending-migration nudges
      reference the new home by name and the referenced conditions exist there.
    - `cross-file-refs-resolve`: each cross-reference between a moved migration and the
      staying generation procedure (and between sibling migrations) resolves after the
      split.
- **Stack-spec tests:** none — no tracked stack component touched.

## Docs to update

- **New reference doc** (architect/coder picks the path) — the relocated migration
  catalogue.
- `.claude/commands/pm-bootstrap.md` — replace the inline catalogue with a pointer;
  keep the generation procedure; fix any in-file cross-references.
- `.claude/commands/pm-plan.md`, `.claude/commands/pm-audit.md`,
  `.claude/agents/pm-auditor.md`, `.claude/agents/pm-plan-checker.md` — re-point the
  by-name references to the new home.
- `doc/architecture.md` — record the structural decision (migration catalogue extracted
  to a single reference; single-source-of-conditions preserved; generation procedure
  stays in `pm-bootstrap.md`) and the chosen home. Owner: `pm-architect` (post-coder).

## Out of scope

- **Any change to a migration's behavior or to a detection condition** — this is a pure
  relocation; the conditions and procedures move verbatim in substance. Adding/removing
  a migration is separate work.
- **Moving the `## Product map generation procedure`** — it stays in `pm-bootstrap.md`
  (it is a generation, not a migration; moving it would churn far more references for no
  gain). Its referrers are deliberately untouched.
- **Rewriting historical `doc/features/*_plan.md`** that mention `### Pending-migration
  detection` — frozen record; the references described the structure at the time.
- **The markdown soft-break sweep** (other open backlog item) — independent.

## Architect note

This plan has a real structural choice with no obviously-right answer: **where the new
reference lives and how it is referenced so it resolves in BOTH this repo (dogfood,
`doc/` paths, command files referenced by bare filename) and a downstream project (the
tooling at `.ai-pm/tooling/`, `docs/` paths, command files symlinked into `.claude/`)**.
The current by-name references say "`### Pending-migration detection` in
`pm-bootstrap.md`" (a command filename, which resolves in both contexts); the new home
must be referenceable the same way. Recommend running `pm-architect` after PM approval to
choose the home + reference mechanism before coding.
