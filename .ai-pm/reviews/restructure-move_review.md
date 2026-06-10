# Review: restructure-move (Slice B)

## Code review: approve

All prior blockers and non-blocking findings resolved. Independent stale-path sweep clean.
See fixup re-review below for the per-item evidence.

---

### BLOCKER 1 — README.md:39: stale Markdown link target

```
**[`src/agents/orchestrator.md`](agents/orchestrator.md)**
```

The display text was updated to `src/agents/orchestrator.md` (correct) but the hyperlink
target remains `agents/orchestrator.md` (the old path, 404 on GitHub). Fix: change the
link target to `src/agents/orchestrator.md`.

**Severity:** BLOCKER — stale live path reference, plan B2 DoD.

---

### BLOCKER 2 — docs/architecture.md:61: `agents/*.md` in integration table

The core/adapter diagram at `docs/architecture.md:57–65`:

```
 agents/*.md       role procedures          deny-rules.json  shared rules (data)
```

After the move, the correct path is `src/agents/*.md`. Note that line 64 of the same block
already correctly shows `src/quality/` — the two lines above it are inconsistent. The plan
inventory (Chunk 2) listed updating `architecture.md`'s own self-references.

**Severity:** BLOCKER — stale path in the architecture doc's own layout table.

---

### BLOCKER 3 — docs/architecture.md:62: `architecture.md` self-reference in integration table

Same code block, the row directly below BLOCKER 2:

```
 architecture.md   this file                tool-map.json    neutral noun → tool
```

This file is now `docs/architecture.md`. The table should read `docs/architecture.md`.

**Severity:** BLOCKER — self-referential stale path. The plan (Chunk 1) explicitly listed
updating `architecture.md`'s own self-references.

---

### Non-blocking findings (hygiene — comments only, no functional impact)

These are in code comments, not resolved paths. They are factually stale after the move
but do not break any mechanism.

- `src/adapter/modules.mjs:10` — comment says `agents/<role>.md`, should say
  `src/agents/<role>.md`.
- `src/adapter/modules.mjs:13` — comment says `modules/<id>/<role>.md`, should say
  `src/modules/<id>/<role>.md`.
- `src/adapter/install-commands.test.mjs:35` — comment says `agents/orchestrator.md`,
  should say `src/agents/orchestrator.md`.
- `src/quality/neutral-prose.test.mjs:29` — comment uses `modules/<id>/<role>.md` as a
  template pattern (ambiguous; acceptable but inconsistent).

---

### Passed checks

Every other requirement in the plan's B2 DoD passed cleanly:

- **All test suites green** (run from new `src/` paths, each verified independently):
  parity 55/55, install-plugin 6/6 (byte-identity), install-modules 51/51,
  install-model 11/11, install-commands 10/10, rigor-profile 24/24,
  opencode-inject 10/10, neutral-prose PASS.
- **Live enforcement verified:**
  - `.claude/settings.json` correctly runs `src/adapter/claude/shim.mjs` (not the old path).
  - Shim blocks a write into `.ai-pm/tooling/` (self-patch deny, live smoke).
  - Shim blocks a write outside root (boundary deny, live smoke).
- **Plugin trio in lockstep:**
  `src/adapter/opencode/plugin-entry.mjs` → `install-plugin.mjs` generator → deployed
  `.opencode/plugins/ai-pm.mjs` — regenerated output is byte-identical to committed
  deployed file (confirmed by both the test and a manual regenerate+diff).
- **All deployed artifacts idempotent:** Claude agents, OpenCode agents, Claude commands,
  OpenCode commands — all regenerated to byte-identical output.
- **Downstream path convention correct:** `src/adapter/claude/hooks.json` and
  `src/adapter/INSTALL.md:5` both show `.ai-pm/tooling/src/adapter/` (updated from the
  old `.ai-pm/tooling/adapter/`).
- **Merge-gate path unchanged:** `engine.mjs:126` still reads `.ai-pm/reviews/<topic>_review.md`
  — transient reviews were correctly not moved to `docs/`.
- **Compaction verified:** `docs/contracts/` (10 files, 16–19 lines each),
  `docs/decisions/` (2 files, 28 lines each). The Mechanism principle
  ("a mechanism counts only if it fires without the Operator's vigilance") is present
  at `docs/decisions/direction.md:18–20`.
- **Paused plans preserved:** `.ai-pm/plans/product-advocate.md` and
  `.ai-pm/plans/restructure.md` both present and untouched.
- **`.ai-pm/` is lean:** only `backlog.md`, `plans/`, `state/` — no reviews/audits graveyard.
- **Depth-fixes correct:** all installer scripts under `src/adapter/<platform>/` resolve
  ROOT at 3-up (`"..", "..", ".."`); all test files resolve ROOT at 2-up (`"..", ".."`).
- **`modules.json` fragment pointers:** correctly updated to `src/modules/threat-model/…`.
- **`src/quality/tools.json` run commands:** all updated to `src/adapter/…` and
  `src/quality/…`.
- **`CLAUDE.md` @-imports:** `@PROTOCOL.md` (root, unchanged) and `@src/agents/orchestrator.md`
  (correct new path).
- **`opencode.json` `instructions`:** `["PROTOCOL.md"]` (root, unchanged — correct).
- **No old `adapter/`, `agents/`, `quality/`, `modules/` bare paths** remain in any
  live non-plan non-CHANGELOG file, except the three BLOCKER items above and the
  non-blocking comment stubs.
- **Security surface intact:** `isInsideRoot` logic unchanged, merge-gate predicate
  unchanged, hook command strings correctly quoted, no new input surfaces.

---

## Fixup re-review

**Date:** 2026-06-11. Focused pass: verify the 3 blockers and 4 comment stubs were
addressed, plus independent stale-path sweep.

### Blocker verification (all 3 resolved)

**BLOCKER 1 — README.md:39:** diff shows both display text and link target changed to
`src/agents/orchestrator.md` — `README.md:39` now reads
`**[\`src/agents/orchestrator.md\`](src/agents/orchestrator.md)**`. Link target is no
longer stale. RESOLVED.

**BLOCKER 2 — docs/architecture.md:61:** diff shows the integration table row changed
from `agents/*.md` to `src/agents/*.md`. RESOLVED.

**BLOCKER 3 — docs/architecture.md:62:** diff shows the self-reference row changed from
`architecture.md   this file` to `docs/architecture.md this file`. RESOLVED.

### Comment stub verification (all 4 resolved)

- `src/adapter/modules.mjs:10` — now reads `src/agents/<role>.md`. RESOLVED.
- `src/adapter/modules.mjs:13` — now reads `src/modules/<id>/<role>.md`. RESOLVED.
- `src/adapter/install-commands.test.mjs:35` — now reads
  `src/agents/orchestrator.md \`## Setup\``. RESOLVED.
- `src/quality/neutral-prose.test.mjs:29` — comment now reads
  `src/modules/<id>/<role>.md`. RESOLVED. The same diff also corrected a functional
  bug in this file: `CORE` path was `path.resolve(HERE, "..")` (resolving to `src/`,
  not the repo root), now correctly `path.resolve(HERE, "..", "..")`.
  `neutral-prose.test.mjs:26` — the root fix means the test now reads
  `docs/architecture.md` and `src/agents/` as intended. Both the functional fix and
  the comment fix are in scope (same file, same fixup).

### Independent stale-path grep

Full grep of live surface (root files, `docs/`, `src/`, `.claude/`, `.opencode/`,
tests) for bare `agents/`, `adapter/`, `quality/`, `modules/<id>`, `architecture.md`
(not `docs/...`), `.ai-pm/contracts/`, `.ai-pm/design/`:

- **`src/adapter/README.md:3`** — `../agents/` is a relative path from `src/adapter/`
  that resolves to `src/agents/`. Not a root-relative stale reference.
- **`src/templates/contracts.md:5` and `src/templates/README.md:15`** — bare
  `architecture.md` in template files. These are templates for downstream projects
  where `architecture.md` is at the root; correct for the template context.
  Pre-existing; not in this fixup's scope.
- **`.ai-pm/backlog.md`** — several bare `adapter/` and `agents/` refs in the backlog
  body. The backlog is a plan/state document; exempt per the first-pass ruling
  ("no stale root-relative path in live non-plan non-CHANGELOG file").
- **`.ai-pm/reviews/restructure-move_review.md`** — prior review text quotes the old
  paths verbatim as findings. These are quoted evidence, not live source paths.

No true stale source-path reference found in any live (non-plan, non-CHANGELOG, non-review)
file. The plan B2 DoD requirement — "a repo-wide grep shows no stale root-relative path" —
is satisfied.

### Scope and gate confirmation

The 5 changed files are: `README.md`, `docs/architecture.md`,
`src/adapter/modules.mjs`, `src/adapter/install-commands.test.mjs`,
`src/quality/neutral-prose.test.mjs`. None of these is `src/adapter/engine.mjs`,
`src/adapter/claude/shim.mjs`, `src/adapter/opencode/normalise.mjs`,
`src/adapter/opencode/plugin-entry.mjs`, or the merge-gate logic — the deny hook
and merge-gate are untouched by this fixup.

Test suites run independently on the live working tree:
- `node src/adapter/parity.test.mjs` — PASS, 55/55.
- `node src/quality/neutral-prose.test.mjs` — PASS (core is platform-neutral,
  deny-list is live).
- `node src/adapter/install-modules.test.mjs` — PASS, 51/51.

### Verdict

All 3 blockers resolved with correct `file:line` evidence. All 4 comment stubs
resolved. Independent stale-path sweep found no surviving true stale source-path
reference. Tests green. No scope creep, no behavior change, enforcement surfaces
untouched. **Approve.**
