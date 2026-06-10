## Code review: approve

Pure structural move — `modules.json` → `src/modules/registry.json` — confirmed clean on all checklist items.

### Check 1: Move + all references rewired

- Root `modules.json` is gone (confirmed: `ls` returns no such file).
- `src/modules/registry.json` exists.
- Grep of all live wiring surfaces (`src/`, `docs/`, `.claude/`, `.opencode/`, `PROTOCOL.md`, `ai-pm.config.json`) returns zero hits for `modules.json`. No live reference survives.
- Permitted hits verified:
  - `CHANGELOG.md:24` — 4.0.0 historical entry (explicitly permitted by review brief).
  - `CHANGELOG.md:68` — 3.4.0 historical entry (archive prose).
  - `.ai-pm/state/current.md:11` — orchestrator state pointer, flagged for later refresh, not a blocker.
  - `.ai-pm/plans/product-advocate.md:9,28,197,205,225,275,292` — paused plan, not a live wiring.
- `src/adapter/modules.mjs:57` — `loadRegistry` now reads `path.join(root, "src", "modules", "registry.json")`. Correct.
- `PROTOCOL.md:98` — updated to `src/modules/registry.json`.
- `docs/architecture.md:76,100` — both references updated.
- `ai-pm.config.json:19` — `_modules` comment updated.
- `src/agents/orchestrator.md` (line 2 of step) — updated to `src/modules/registry.json`.
- `.opencode/agents/ai-pm.md:36` — assembled agent reflects `src/modules/registry.json`.

### Check 2: Registry loads from new path; content unchanged

- `node src/adapter/install-modules.test.mjs` → PASS — 51 passed, 0 failed. `loadRegistry(ROOT)` resolves from `src/modules/registry.json`.
- Registry content diff (`git diff -- src/modules/registry.json`): only the `_doc` self-reference changed from `"modules.json carries only..."` to `"this registry carries only..."`. Schema, toggle shape, defaults, targets, fragment pointers are identical.
- Fragment pointers (`src/modules/threat-model/reviewer.md`, `src/modules/threat-model/builder.md`) resolve repo-root-relative — both files confirmed present.

### Check 3: Assembled agents fresh

- `.opencode/agents/ai-pm.md:36` — `## Setup` step 2 names `src/modules/registry.json`.
- `.claude/agents/pm-reviewer.md:25` and `.opencode/agents/pm-reviewer.md:32` — threat-model fragment (`## Threat model`) present and composes correctly in both.
- No stale `modules.json` reference in any assembled agent.

### Check 4: Scope + gates

- Exactly 7 files changed: `.opencode/agents/ai-pm.md`, `PROTOCOL.md`, `ai-pm.config.json`, `docs/architecture.md`, `src/adapter/modules.mjs`, `src/agents/orchestrator.md`, `src/modules/registry.json` (rename + `_doc` fix). No behavioral change.
- `node src/adapter/parity.test.mjs` → PASS — 55 passed, 0 failed.
- `node src/quality/neutral-prose.test.mjs` → PASS.
- Deny hook / merge-gate files (`src/adapter/claude/`, `src/adapter/opencode/`, `src/adapter/engine.mjs`, `src/adapter/deny-rules.json`) — no diff. Unaffected.
- No test files modified or weakened.

### Security

Not a security-relevant change (pure path rename + reference rewire, no new input surface, no new trust boundary, no secrets touched). The assembler's three existing security guards (root-escape rejection, missing-fragment hard error, fail-safe to ON) are unchanged at `src/adapter/modules.mjs:41-52`.
