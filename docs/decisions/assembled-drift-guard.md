# Drift guard for committed generated artifacts

**Question.** No quality check compares the committed assembled orchestrator
(`.opencode/agents/ai-dev.md`) against its source (`src/agents/orchestrator.md`); it went
stale unnoticed between 5.4.0 and 5.6.0. Design the drift guard — and generalize: which
other committed generated artifacts lack one?

**Answer.** Add one `build`-beat quality row (`install-drift`) that re-assembles every
markdown artifact the four install scripts generate — both platforms' agents and
commands — into a temp dir using the repo's **tracked** `.ai-dev/config.json`, and
byte-compares each against its committed file, plus an orphan check (no extra file in a
generated dir that no generator writes). Same pattern as the existing plugin guard.
State the class rule — *every committed generated artifact carries a mechanical drift
guard* — in `docs/architecture.md`, and let the audit's "no drift" dimension point at the
quality rows instead of a manual sweep.

Confidence: high — all claims tree-read AND verified by executing the generators against
the committed tree (2026-06-13). No web sources needed; everything is in-repo.

## Inventory: committed generated artifacts and their guards

| Committed artifact | Generator | Drift guard today |
| --- | --- | --- |
| `.opencode/plugins/ai-dev.mjs` | `src/adapter/opencode/install-plugin.mjs` | **Yes** — byte-compare vs generator output (`src/adapter/install-plugin.test.mjs:42`; registry row `install-plugin`, `src/quality/tools.json:29`) |
| `.opencode/agents/ai-dev.md`, `dev-builder.md`, `dev-reviewer.md` | `src/adapter/opencode/install-agents.mjs` | **None** — the 5.4.0→5.6.0 incident |
| `.claude/agents/dev-builder.md`, `dev-reviewer.md` | `src/adapter/claude/install-agents.mjs` | **None** |
| `.claude/commands/dev-setup.md` | `src/adapter/claude/install-commands.mjs` | **None** |
| `.opencode/commands/dev-setup.md` | `src/adapter/opencode/install-commands.mjs` | **None** |
| `.claude/settings.json` | partial — hand-maintained dev-layout mirror of `src/adapter/claude/hooks.json` (shim path intentionally `src/adapter/...`, not the fragment's `.ai-dev/tooling/...`) | **None** — different class, see below |
| `.opencode/opencode.json` | partial — hand-maintained mirror of `wireOpenCode` keys (`src/adapter/install.mjs:219-235`), `instructions` intentionally `PROTOCOL.md` not `.ai-dev/PROTOCOL.md` | **None** — same partial class |

Why the existing tests do NOT cover the gap: `install-modules.test.mjs` proves the
**composition logic** into a temp dir; `install-model.test.mjs` proves the **model bake**
into a temp dir; `install.test.mjs` proves a **downstream temp install** is correct and
idempotent. None of them ever reads this repo's *committed* `.claude/` / `.opencode/`
files — only `install-plugin.test.mjs:41-42` does, for exactly one artifact.

Supporting evidence of the failure mode: an untracked stray `.opencode/plugins/ai-dev.mjs.gen`
sits in the tree (leftover of a manual generate run) — generated artifacts here are
refreshed by hand-runs, which is precisely what a forgotten run lets drift.

## The test design (`src/adapter/install-drift.test.mjs` + one registry row)

Replicate the plugin guard's shape (`install-plugin.test.mjs:36-42`): generate to temp,
byte-compare against committed.

1. Read the repo's tracked config `.ai-dev/config.json` once and pass it explicitly to
   each installer's exported `install(outDir, config)` (`claude/install-agents.mjs:30`,
   `opencode/install-agents.mjs:43`; the command installers take `outDir` only).
2. Assemble into `fs.mkdtempSync(os.tmpdir())` per platform (the established dry-run
   pattern, `install-plugin.test.mjs:38`).
3. For each written file, byte-compare against the committed sibling
   (`.claude/agents/<id>.md`, `.opencode/agents/<id>.md`, `.claude/commands/dev-setup.md`,
   `.opencode/commands/dev-setup.md`). A mismatch fails naming the fix:
   *"re-run node src/adapter/&lt;platform&gt;/install-agents.mjs (source changed without
   re-assembly, or the committed file was hand-edited)"*.
4. **Orphan check:** list each committed generated dir (`.claude/agents/`,
   `.opencode/agents/`, the two `commands/` dirs) and fail on any file no generator wrote
   this run — catches the stale-leftover case (a renamed role's old file, a `.gen` stray)
   that byte-compares alone cannot see.

**One row, not per-platform.** The registry row states one promise — *committed assembled
artifacts are the generators' output under the tracked config* — and the test enumerates
artifacts internally. A per-platform split would duplicate the same `checks` sentence
twice and double the place a new artifact must be registered. The plugin keeps its own
row: `install-plugin` also locks the layout-rewrite logic (dev vs downstream import
paths, `install-plugin.test.mjs:47-56`), which is not a drift concern.

Registry row (beat `build`, so the Builder's whole-set run catches stale assembly before
any hand-back — the same beat as `install-plugin`):

> `id: install-drift` — "assembled-artifact anti-drift — every committed generated
> markdown artifact (both platforms' agents + commands) is byte-identical to a fresh
> assembly under the tracked .ai-dev/config.json; no orphan file in a generated dir"

## Edge cases

- **OpenCode frontmatter differs from source by design** — a non-issue: the comparison
  baseline is the *generator's output* (frontmatter `.fm` + composed body,
  `opencode/install-agents.mjs:57`), never the neutral source body. The frontmatter is
  inside the baseline, so the by-design difference never enters the diff.
- **Model pins / module toggles baked from config** — `.ai-dev/config.json` is
  **git-tracked**, so (sources, config) → artifacts is deterministic for everyone who
  checks out the repo. The test reads that tracked config — never a fixture, never a
  hardcoded module list or model line. When the Operator changes the config (pins a
  reviewer model, toggles a module), the test fails until the artifacts are re-assembled
  and committed — that failure IS the contract: a config change that alters what gets
  baked makes the committed artifacts stale by definition. A fixture config would test
  the wrong question (the logic, already covered by `install-modules`/`install-model`,
  instead of the committed bytes).
- **The two JSON platform configs** (`.claude/settings.json`, `.opencode/opencode.json`)
  are a *partial* class: merge targets with an intentional dev-layout path divergence
  from their downstream fragments. A byte guard is impossible without teaching the
  installer a dev-layout merge mode (new machinery for two small files). Conscious
  descope from the byte-compare row; cheap follow-up if wanted: a structural assertion
  (the hook command ends in `claude/shim.mjs`; matcher set equals the fragment's;
  `default_agent === "ai-dev"`) — recorded here as an open option, not designed.

## What else is missing nearby

- **Audit's "no drift" dimension → mechanical-first.** The auditor sweep currently names
  "no drift (assembled agents match `src/agents/`, deployed plugin byte-identical)" as a
  manual dimension (`src/agents/orchestrator.md` `## Audit` step 2). Once `install-drift`
  is a registered `build` row, audit step 1 (the whole quality run) executes it
  mechanically; the auditor's residual should shrink to the **class rule**: *does every
  committed generated artifact have a registry row?* — i.e. check the inventory is
  complete, not re-diff bytes by hand.
- **The class rule and its one home.** Rule: *every committed generated artifact carries
  a mechanical drift guard (a quality-registry row that re-generates and byte-compares).*
  Home: `docs/architecture.md`, one sentence beside the existing no-drift argument (the
  shared-engine paragraph, `docs/architecture.md:53`) — it is a mental-model invariant
  about the repo's own tree, exactly that file's subject. The registry rows are the
  rule's *instances*, not its home; the audit dimension *points* at it (invariant 6:
  one home, pointers elsewhere).
- **Housekeeping surfaced while reading** (backlog candidates, not this change):
  untracked `.opencode/plugins/ai-dev.mjs.gen` should be deleted (the orphan check would
  flag it); the untracked self-install leftovers (`.ai-dev/PROTOCOL.md`,
  `.ai-dev/tooling/`, `.ai-dev/quality/`) are outside the committed-artifact class but
  worth either gitignoring deliberately or cleaning, so a stale vendored copy never
  shadows the live source.

## Changes this grounds

1. New test `src/adapter/install-drift.test.mjs` (design above) — byte-compare + orphan
   check over the seven committed markdown artifacts, driven by the tracked config.
2. One registry row `install-drift` in `src/quality/tools.json`, beat `build`.
3. One class-rule sentence in `docs/architecture.md` beside the no-drift paragraph.
4. One pointer edit in `src/agents/orchestrator.md` `## Audit` step 2: the no-drift
   dimension defers to the quality rows; the auditor checks inventory completeness.
5. (Optional, separate) structural assertions for the two JSON platform configs;
   delete the `.mjs.gen` stray.
