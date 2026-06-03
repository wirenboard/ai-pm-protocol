# Plan-compliance review — route-reminder-coverage-and-prprep-model

Branch: `fix/route-reminder-coverage-prprep-model`
Commits: `f049b30`, `701179b`
Test harness: `bash tests/hooks.sh` → **71/71 green** (was 65/65; +6 new UPS cases).
No Product Contract touched — this is a template-repo meta change (config + agent frontmatter + decision docs); no `.ai-pm/contracts/` entry expected or required.

## Plan compliance

### Scenarios

- ✓ **Scenario 1** (removal/edit verbs fire) — UPS regex in `.claude/settings.json` broadened with RU `убери|убрать|удали|сними|вынеси|переименуй|обнови` and EN `\bremove\b|\bdelete\b|\bdrop\b|\brename\b|\bextract\b|\bupdate\b`. Tests at `tests/hooks.sh:427-437` cover all five plan phrasings → inject.
- ✓ **Scenario 2** (no over-match; chit-chat/questions silent) — existing silent cases (`спасибо, отлично`, `как это устроено?`) still pass; new near-miss silent case `как это обновляется?` at `tests/hooks.sh:438` → silent. Verified the `обнови` literal does **not** substring-match `обновляется` (root diverges at `обнов**л**яется` vs `обнов**и**`).
- ✓ **Scenario 3** (`pm-pr-prep` inherits session model) — `model: haiku` line removed from `.claude/agents/pm-pr-prep.md` (frontmatter). No other agent pins a `model:` (`grep '^model:' .claude/agents/` → none). Instructions unchanged; only the tier line dropped.
- ✓ **Scenario 4** (reversal recorded, doc agrees with config) — `doc/protocol-vs-builtins-analysis.md` records a `⚠ Reversal — 2026-06-03` block with falsifying evidence (Haiku factual errors in PM-facing CHANGELOG: non-existent `/pm-architect`, typos, invented `§` numbers); original analysis struck through, not deleted, at all three plan-cited regions (table row, conclusion #4, Шаг 0). Doc and shipped config agree.

### Test plan

- ✓ All six new `run_ups_case` lines present and passing (`tests/hooks.sh:427-438`): `убери модель хайку у агента`→inject, `remove the haiku model`→inject, `удали старый шаблон`→inject, `переименуй файл конфигурации`→inject, `обнови README`→inject, `как это обновляется?`→silent.
- ✓ Additive only — `git diff` of `tests/hooks.sh` shows zero removed/changed lines; no existing case modified or removed.
- ✓ Full suite green: 71/71.

### Stack expectations

- ✓ **`if:` not used on UPS hook** — `jq '.hooks.UserPromptSubmit[0].hooks[0] | has("if")'` → `false` (and the entry itself → `false`). Filtering stays inside the command via `grep -qiE`, honoring `doc/stack-notes.md:134` ("On other events, a hook with `if` set never runs"; source <https://code.claude.com/docs/en/hooks>).
- ✓ **`additionalContext` output shape unchanged** — the `jq -nc '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:...}}'` emitter is byte-identical to main; only the gating regex changed.
- ✓ **settings.json is valid JSON** — `jq` parses the UPS hook entry cleanly.
- ✓ **`model` removal relies on documented inherit default** — `doc/stack-notes.md:161` ("Defaults to `inherit`"; source <https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields>).

### Interaction scenarios

- ✓ **Broadening did not regress silent cases / over-match** — covered by the retained existing silent cases plus the new `как это обновляется?` near-miss; all silent in the green run.
- ✓ **Shared settings.json — all PreToolUse guard cases stay green** — full 71-case suite (every path-boundary/ssh/force-push/no-verify/wb-* routing guard) passes after the settings.json edit. The settings.json diff touches only the single UPS command line.

### Critical over-match check (load-bearing)

- ✓ `как это обновляется?` stays **SILENT**. `printf '%s' 'как это обновляется?' | grep -qiE 'обнови'` → no match. The `обнови` root does not fire on `обновляется`. Confirmed both directly and via the passing test case.

### Scope boundaries

- ✓ No hard `PreToolUse` edit-ownership guard added (settings.json diff contains no ownership guard; stays rejected per PM decision 2026-06-02).
- ✓ No other agent's model touched (only `pm-pr-prep`).
- ✓ Only the one reversal recorded in `protocol-vs-builtins-analysis.md` — the tool-lock pass, judge-agent model items, and REWORK/NEW engine items remain untouched (out of scope, as planned).
- ✓ `architecture.md` got only a one-line **Currency note (2026-06-03)** appended after the existing paragraph — no invented section.

## Definition of Done

- [x] All plan scenarios implemented and tested
- [x] Interaction scenarios have concurrent-state tests (silent-regression + full-suite-green guards)
- [x] Stack expectations respected; stack-spec tests pass (UPS harness runs the actual hook command from settings.json)
- [x] Product Contract honored — N/A, no Product Contract touched (template-repo meta change); no silent user-visible behavior change
- [x] Pipeline green — `bash tests/hooks.sh` 71/71; settings.json valid JSON
- [x] State file updated — N/A for this checker's gate; not part of plan's Docs-to-update (no `.ai-pm/state/current.md` change required by plan)
- [x] Product Impact Report present — N/A (no contract touched)
- [x] Docs updates landed — `protocol-vs-builtins-analysis.md` reversal + `architecture.md` currency note both present; no CLAUDE.md/validator change required (plan says none)
- [x] Expected artifacts exist — plan present (`doc/features/...plan.md`), this review present; no contract required (not user-facing product)

**DoD: pass**

## Blocking

None.

## Notes (product)

None. Scope held exactly to the plan: soft-reminder coverage broadened, `pm-pr-prep` unpinned, one decision reversal recorded. No scope expansion observed.

## Verdict

approve

<!-- orchestrator appends after code-review pass: -->
## Code review findings

## Code review
