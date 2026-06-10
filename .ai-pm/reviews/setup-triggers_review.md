# Review: setup-triggers (Slice B)

## Code review: approve

Final re-review (below) upgrades the verdict. All four blockers/findings resolved. See "## Final re-review" for detail.

---

## Evidence by checklist item

### Plan compliance

Every named scenario is implemented and nothing unplanned was added.

- **Lazy trigger (offer-and-proceed):** `agents/orchestrator.md:23` — "This is an **offer, not a block**" with explicit decline path ("not now, let's go") proceeding on documented zero-config defaults. NOT a hard block. Confirmed.
- **NOT over-claimed as mechanical:** `agents/orchestrator.md:21` — "Two triggers, both **your** persona act (the enforcement floor cannot *force* a positive act, so neither is mechanical — a reminder may nudge, but running setup is yours)." Confirmed.
- **Inject-class = persona act + mechanical nudge:** `PROTOCOL.md:112` — new **Inject-class** paragraph placed OUTSIDE the "Mechanically denied" section, correctly saying "nudges, never blocks" and "the act itself stays the Orchestrator's." Not over-claimed. Confirmed.
- **`/setup` both platforms = thin wrapper, ONE neutral body:** `adapter/commands/setup.body.md` is one sentence pointing at `## Setup`. Per-platform frontmatter in `adapter/claude/commands/setup.fm` and `adapter/opencode/commands/setup.fm`. NO dialog logic in either. Confirmed by install-commands test check `no dialog copy (thin wrapper)` — all 10 checks pass.
- **Reuses Slice A `## Setup` — triggers point, never restate:** command body (`adapter/commands/setup.body.md:1`) says "do not restate the dialog here, run it there." The "When it fires" block in `agents/orchestrator.md:21–25` adds only trigger logic, not dialog steps. Confirmed.

### Correctness

- **`no-config-run-setup` fires only on change-verb prompt + absent config:** `adapter/engine.mjs:232–236` — `promptNeedsSetup` checks `change_verbs` pattern AND `!projectConfigured(input.root)`. Returns false once config is present. Confirmed by parity test block 1b: unconfigured root → `no-config-run-setup` ruleId; configured root → `change-route-reminder` ruleId.
- **Reuses `change_verbs` (no second verb list):** `adapter/engine.mjs:233` reads `config.change_verbs?.pattern` — the same data key as `promptMatchesChangeVerb`. `adapter/deny-rules.json` has no second verb list. Single home confirmed.
- **Rule ordering load-bearing:** `adapter/deny-rules.json` rules array index 12 = `no-config-run-setup`, index 13 = `change-route-reminder`. Engine (`adapter/engine.mjs:256`) returns on the first inject match. Parity test block 1b pins the ordering behaviorally — if reversed, the NOCFG assert would fail.
- **Non-change prompt allows:** `adapter/engine.mjs:233` — pattern check gates the predicate; non-change prompt returns false before the fs check is even reached. Verified independently: `good morning` → allow on both configured and unconfigured root.
- **Decline path documented:** `agents/orchestrator.md:23` names the zero-config defaults explicitly (`interactive` mode, the adapter's zero-config model) and says "announcing that plainly." Correct handling of the bad-input case.

### Security

- **Root-relative fs check:** `adapter/engine.mjs:145` — `projectConfigured` uses `path.join(path.resolve(root), "ai-pm.config.json")`. The prompt text is never used in path construction — no injection vector. Root is git-derived in the shim (`adapter/claude/shim.mjs:99`). Invariant 2 satisfied.
- **No secrets, no auth surface touched.** The change adds a local config-presence check and a command file assembly. No boundary breach.
- **Command files land inside project root:** `.claude/commands/setup.md` and `.opencode/commands/setup.md` — within invariant 2.

### Honesty

- **`[persona]` label is accurate:** `agents/orchestrator.md:21` names the trigger explicitly as persona; `PROTOCOL.md:112` Inject-class paragraph correctly labels the inject as a nudge, not a block or a force. No over-claim found.
- **Inject-class paragraph is honest:** positioned in `PROTOCOL.md:112` between Ask-class and Persona-only — NOT inside "Mechanically denied." The inject is realised mechanically (prompt hook where available) but only as a context note; the paragraph accurately says "Realised mechanically where a platform has a prompt hook, always-on instruction text where it does not."
- **Command body truthful:** `adapter/commands/setup.body.md:1` — "This is a thin pointer: the procedure and its single home are in `agents/orchestrator.md` `## Setup`; do not restate the dialog here, run it there." Accurate.

### Hygiene and AI slop

- No placeholders, stubs, or TODO in any new file. No AI-chatter artifacts.
- `adapter/claude/install-commands.mjs` (36 lines) and `adapter/opencode/install-commands.mjs` (39 lines) are single-purpose, small, and readable. The separate-files design (builder-flagged for review judgment): clean — each file has exactly one job, mirroring the existing one-file-one-job split, and there is no extractable shared logic that would justify merging them into `install-agents.mjs`. Approved as-is.

### Frugality and one-home

- `adapter/deny-rules.json:121` rule intent names the single home (`## Setup` procedure) and explains the ordering. No second verb list.
- `architecture.md:76` extension point bullet — one sentence, pointers only, no procedure restated, no platform mechanism leaked into the core.
- `adapter/INSTALL.md` Claude and OpenCode sections each gain one "Command" subsection with the dir-resolution outcome recorded. Single home for where files land.
- `agents/orchestrator.md` "When it fires" block is the single home for trigger procedure. `PROTOCOL.md` loop gains one sentence ("It fires lazily...") pointing at it.

### Tests

- **Parity 50→53 is honest:** three new `check()` calls added in block 1b — `no-config-run-setup:fires`, `change-route-reminder:fires-when-configured`, `no-config:non-change-prompt-allows`. The fixture case was RENAMED (`change-route-reminder` → `change-verb-prompt-injects`) — same check, more accurate name for what it now tests (which inject fires is asserted by ruleId in block 1b, not by the fixture name). No existing check deleted or weakened. Confirmed by diff against main (`adapter/parity.test.mjs`).
- **No existing test edited to pass.** The fixture rename does not change the expected verdict (`inject`), only clarifies the name now that ruleId discrimination has moved to block 1b.
- **`install-commands.test.mjs` (10 checks):** assembles both platforms, checks body pointer presence, checks frontmatter correctness (`agent: ai-pm` on OpenCode), guards against dialog copy, asserts both share the one neutral body. All 10 pass.
- **`neutral-prose.test.mjs`:** passes — no platform primitive leaked into `PROTOCOL.md`, `agents/orchestrator.md`, or `architecture.md`.
- **Deployed artifacts are fresh:** `.opencode/agents/ai-pm.md` regenerated (diff confirmed); `.claude/agents/pm-builder.md` and `pm-reviewer.md` verified fresh against re-assembled output; both command files verified against freshly assembled output.

---

## Minor finding (non-blocking)

**Misleading test name — `adapter/parity.test.mjs:162`.**

The check is named `no-config:non-change-prompt-allows` but the root used is `CFG` (the configured root, created a few lines earlier with `ai-pm.config.json` present), not `NOCFG` (which was deleted after the previous check). The behavior is correct either way — a non-change-verb prompt allows regardless of config state — so this is a naming inconsistency, not a behavioral gap. The plan said "non-change prompt on an unconfigured root" but the implementation tests it on a configured root. The test still proves the claim (allow for non-change prompt), just from the wrong fixture.

Severity: minor / hygiene. Does not block ship.

---

## Design choice judgment (builder-flagged)

Separate `install-commands.mjs` per platform vs folding into `install-agents.mjs`: the separate files are the right call. Each has a single job, neither is large, and they parallel the existing one-file-one-job pattern. No shared logic is substantial enough to justify a merge.

---

## Re-review (opencode inject fix)

Fresh read of the inject fix (`adapter/opencode/plugin-entry.mjs`, `adapter/opencode/normalise.mjs`, `.opencode/plugins/ai-pm.mjs`, `adapter/opencode-inject.test.mjs`) and the updated `adapter/parity.test.mjs` (53→55). All five test suites run clean:

- `node adapter/parity.test.mjs` — 55 passed, 0 failed
- `node adapter/opencode-inject.test.mjs` — 10 passed, 0 failed
- `node quality/neutral-prose.test.mjs` — PASS
- `node adapter/install-commands.test.mjs` — 10 passed, 0 failed
- `node adapter/install-model.test.mjs` — 11 passed, 0 failed

### 1. Inject realized on OpenCode, single-source (PASS)

`adapter/opencode/plugin-entry.mjs:54–63` defines the `chat.message` hook inline. It calls `decidePrompt` (imported from `adapter/opencode/normalise.mjs:72`) which in turn calls `evaluate` (imported from `adapter/engine.mjs`) — the shared engine. No verb list, no pattern, no predicate is authored in the plugin or normalise.mjs; every rule token lives in `adapter/deny-rules.json:21–23` (the one `change_verbs.pattern`) and `adapter/engine.mjs`. Single-engine assertion in parity test (`adapter/parity.test.mjs:182–188`) confirms no forbidden token in either shim. Invariant 6 satisfied.

Neutral prompt-input shape match confirmed: `adapter/opencode/normalise.mjs:67–69` (`normalisePrompt`) produces `{ act: "prompt", root, prompt: userText, isOrchestrator }` — identical to the Claude shim's UserPromptSubmit branch (confirmed via parity test `opencodePrompt` path at `adapter/parity.test.mjs:137–139` which runs `ocDecidePrompt` and checks parity with Claude's verdict). The shared engine decides identically on both platforms.

### 2. Deployed plugin — sync check (PASS, with one stale comment noted)

Full diff between source (`adapter/opencode/plugin-entry.mjs`) and deployed (``.opencode/plugins/ai-pm.mjs`):
- Lines removed from deployed: 16-line file-header comment block, 3-line `isOrchestrator` function comment, 8-line `chat.message` inline comment — comments only, no logic.
- Import paths differ as expected: source points into `.ai-pm/tooling/adapter/...`, deployed points into `../../adapter/...` (relative to `.opencode/plugins/`).
- `ADAPTER` path constant computed differently but correctly for each file's location.
- One syntactic micro-diff: `catch (_e)` (source) vs `catch` (deployed) — functionally identical in Node 18+; the deployed form is slightly stricter (no unused binding). No behavioral difference.

Hook body logic is byte-for-byte identical: `tool.execute.before` (lines 22–25 deployed), `chat.message` (lines 27–35 deployed) — every conditional, every assignment, every property access matches. The `chat.message` hook was verified present in the deployed file by the `opencode-inject.test.mjs` which imports `../.opencode/plugins/ai-pm.mjs` directly (`opencode-inject.test.mjs:18`) and asserts `typeof hooks["chat.message"] === "function"` as its first check. The test drives the deployed module, not the source.

**Hand-copy drift risk assessment:** the two-file arrangement is a known limitation. `INSTALL.md:52` explains why: opencode only registers hooks off an inline-defined function, so a thin re-export is impossible — the wrappers must be inline. The drift risk is: the deployed copy is maintained by hand and must be updated when the source hook bodies change. This is **acceptable as a known limitation** with two mitigations: (a) `opencode-inject.test.mjs` imports the deployed copy and asserts the hook fires correctly — a drift in the hook body would break the test; (b) `adapter/parity.test.mjs:183` runs the single-engine assertion against `opencode/plugin-entry.mjs` (the source), catching any rule-logic leak in the source before it could drift into the deployed copy. Recommendation: backlog an install-plugin generator that copies the source to `.opencode/plugins/` as part of the install step (eliminating the manual sync obligation). Does not block ship.

### 3. Honesty check — two findings

**Finding H1 (BLOCKING): `adapter/INSTALL.md:57` presents `chat.message` inject as live-confirmed without qualification.**

`INSTALL.md:57` states: "it fires once per user message before the LLM call and `output.parts` is mutable... This is how the lazy-setup nudge ... and the `change-route-reminder` reach the model on OpenCode." This is a factual present-tense claim about live behavior. Contrast with `INSTALL.md:80` which explicitly flags the deny hook as "Live-verified on opencode 1.17.0." No equivalent statement exists for `chat.message`. The underlying assumption — that OpenCode's `chat.message` hook passes the mutated `output.parts` back to the LLM — is proven only by the unit test (deployed module test) and has not been confirmed by a live interactive session. `adapter/opencode-inject.test.mjs:1–10` correctly frames its own scope ("the parity test never proved the OpenCode adapter APPLIES it") but the test runner proves the hook calls `output.parts.push(...)` on the in-process object; it cannot prove OpenCode's runtime actually delivers that mutated part to the LLM call.

The prior over-claim ("inject always-on OpenCode") from before the fix is gone (`PROTOCOL.md:112` inject-class paragraph is honestly labeled). But the residual claim in `INSTALL.md:57` is still an unqualified present-tense assertion of live behavior for a path not yet live-confirmed. This must be replaced with an honest "unit-proven / live run pending" qualifier — the same pattern used for the deny hook's live-verification note.

Specifically: `INSTALL.md:57` must be qualified to say something like "This is the mechanism — unit-proven via the deployed-module test (`adapter/opencode-inject.test.mjs`); the `output.parts` mutability readback assumption (that OpenCode delivers the pushed part to the LLM) is pending a live interactive run." `tool-map.json:15` (`class_support._doc`) likewise asserts inject is realized for OpenCode with no qualification; the same honest note should accompany it or cross-reference the INSTALL.md qualifier.

Severity: **blocking** — the Reviewer's contract states "an over-claim blocks — never waved through." This is the exact failure mode that caused the original bug to ship (inject presented as realized when it was not). The new form is a narrower over-claim (the hook is now coded; the live-deliver assumption is what is unverified) but the pattern of unqualified present-tense assertion of unconfirmed live behavior is the same honesty defect.

**Finding H2 (non-blocking, hygiene): `adapter/README.md:46` describes a resolved open assumption as still open.**

`adapter/README.md:46`: "One open assumption remains on the OpenCode side — that its loader accepts a re-exported plugin importing from outside the plugin dir." This assumption was resolved when the inline-not-import fix was applied (commit `a6af179`). `INSTALL.md:52` correctly documents the resolution ("verified live — a write into `.ai-pm/tooling/` sailed through an own-export entry, and is blocked by an inline-defined one"). `README.md:46` is stale and misleads a reader of that file alone — and the new open assumption (chat.message parts readback) is not recorded anywhere. Should be corrected (update the status section to reflect the resolved assumption and note the new one) but does not block ship on its own.

Severity: non-blocking hygiene.

### 4. Test-strategy gap assessment (PASS)

`adapter/opencode-inject.test.mjs` drives the `chat.message` hook of the deployed module (`../.opencode/plugins/ai-pm.mjs`, line 18) and asserts the side-effect directly: it checks that `output.parts` gains an extra text part for no-config+change-verb (tests 3–6), that nothing is pushed for non-change (test 7) and configured+non-change (test 9), and that the hook handles empty-parts without crashing (test 10). This is application-level assertion, not decision-level. The parity test (`adapter/parity.test.mjs:137–139`) separately asserts the engine decision cross-platform via `ocDecidePrompt`. The two tests are complementary and non-overlapping in scope. The strategy gap (parity proves decision, inject test proves application) is correctly closed. Tests added, nothing weakened.

Parity 53→55: the two new `opencode:change-verb-prompt-injects` and `parity:change-verb-prompt-injects` checks at `adapter/parity.test.mjs:138–143` (driven by the `opencodePrompt` field added to the fixture at line 110) are genuine additions. No existing check edited to pass.

### 5. Persona reinforcement in orchestrator.md (PASS)

`agents/orchestrator.md:21–24` ("When it fires") is a thin addition — trigger procedure only, no dialog copy, correctly labeled `[persona]`. The Reactive line was changed from an "if" observation to an imperative ("before you act on the Operator's first real work request, check whether `ai-pm.config.json` exists") — confirmed by git diff. The single-home rule is respected: the dialog lives in `## Setup` (lines 13–19), the "When it fires" block (lines 21–24) contains only trigger conditions. PROTOCOL.md gains one sentence in the loop section pointing at the single home. No duplication.

### 6. Gate summary

| Gate | Result |
|---|---|
| `adapter/parity.test.mjs` (55) | PASS |
| `adapter/opencode-inject.test.mjs` (10) | PASS |
| `quality/neutral-prose.test.mjs` | PASS |
| `adapter/install-commands.test.mjs` (10) | PASS |
| `adapter/install-model.test.mjs` (11) | PASS |

### Verdict

**Changes requested.** One blocking finding (H1) must be addressed before ship. H2 (stale README) is non-blocking hygiene. The hand-copy drift risk is acceptable as a known limitation; backlog an install-plugin generator step. All gates pass.

**Blocking finding to address:**
- `adapter/INSTALL.md:57` and `adapter/tool-map.json:15` (`class_support._doc`) — qualify the `chat.message` inject claim as unit-proven / live run pending. The `output.parts` mutability readback assumption has not been confirmed by a live interactive OpenCode session. Use the same pattern as `INSTALL.md:80` (explicit "live-verified" note) — state its absence honestly.

---

## Final re-review

Fresh read of the finalization batch (working-tree changes against commit `fd7e240`). All five test suites re-run clean.

### Gates

| Gate | Result |
|---|---|
| `adapter/parity.test.mjs` (55) | PASS |
| `adapter/opencode-inject.test.mjs` (10) | PASS |
| `quality/neutral-prose.test.mjs` | PASS |
| `adapter/install-commands.test.mjs` (10) | PASS |
| `adapter/install-model.test.mjs` (11) | PASS |

No test weakened. Count unchanged (55 / 10 / 10 / 11). All pass.

### Fix 1 — H1: honesty of `chat.message` inject claim

**RESOLVED.**

`adapter/INSTALL.md:59` (current working tree) now reads: "**Live-verified on opencode 1.17.x:** on an unconfigured project a work request fired the `chat.message` inject and the nudge **reached the model** — the orchestrator offered `setup` instead of starting the task. From there the explicit `/setup` ran: env discovery (`opencode models` → 9 models, session `deepseek/deepseek-v4-pro`) and the structured-question dialog both worked end-to-end. **Still unit-proven only** (the live run was interrupted at the mode question, so not shown end-to-end): the full config **write** and the reviewer model-**pin bake** into the assembled reviewer — these are covered by `install-commands.test.mjs` / `install-model.test.mjs`, not yet by a live run."

This is exactly the pattern the prior review required: the live-verified scope (inject fired + nudge reached the model + env discovery + dialog) is stated as live-verified; the interrupted scope (config write + pin bake) is explicitly labelled unit-proven only. No over-claim; no under-claim. The split is accurate and matches the Operator's reported live session.

`adapter/tool-map.json:15` (`class_support._doc`) now states: "Both OpenCode classes are live-verified on opencode 1.17.x: deny blocked a write into .ai-pm/tooling/, and inject fired on an unconfigured project — the no-config-run-setup nudge reached the model and the orchestrator offered setup." This is accurate for the verified scope (inject fires + reaches model). It does not claim the config-write or pin-bake are live-verified. No over-claim.

The prior blocker pattern ("unqualified present-tense assertion of unconfirmed live behavior") is gone from both locations.

### Fix 2 — H2: stale `adapter/README.md:46`

**RESOLVED.**

`adapter/README.md:46` (current working tree) now reads: "Install glue is in `INSTALL.md` (where each file lands, the Claude hook fragment, the OpenCode plugin entry). The OpenCode loader assumption is resolved: a re-exported plugin is **not** registered, so the entry **defines** its hooks inline and imports only the rule logic — and its `chat.message` inject readback is now live-verified on opencode 1.17.x. Both are documented in `INSTALL.md`; the per-class support is in `tool-map.json`."

The stale "one open assumption remains" text is gone. The resolved assumption is stated as resolved. The live-verified scope is noted. The new remaining caveat (config write / pin bake unit-proven only) is not restated here — correctly: `README.md` points at `INSTALL.md` as the single home for that detail, invariant 6 satisfied. No drift between the two files.

### Fix 3 — crisp lazy trigger, single-source nudge text

**RESOLVED.**

`adapter/deny-rules.json:121` `no-config-run-setup` intent now reads: "This project is not configured (no ai-pm.config.json). Before doing the task, offer the Operator exactly two choices — run `setup` now, or proceed on the safe defaults — then STOP and wait for their answer. Do not start the task, do not explore the repo, do not run git. Keep the offer short."

This is the injected text the model receives (engine `adapter/engine.mjs:256` uses `rule.intent` as `reason`, confirmed at line 256). It is short, deterministic, two-choices, stop-and-wait — no task-start/repo-explore/git, offer-not-block preserved, decline path leads to documented defaults in `agents/orchestrator.md:23`.

Single-source confirmed: the deployed plugin `.opencode/plugins/ai-pm.mjs` pushes `r.reason` (`line 35`), where `r` comes from `decidePrompt` → `evaluate` → `rule.intent`. No drifted copy of the nudge text exists in the plugin, normalise.mjs, or engine.mjs (grep returned empty on "offer the Operator", "two choices" in those files).

`agents/orchestrator.md:23` Reactive line is now the short imperative form: "stop immediately and give a SHORT plain-language offer of exactly two choices — run `setup` now, or proceed on the safe defaults — then wait. Do not start the task, do not explore the repo, do not run git, do not write a multi-topic essay." Consistent with the deny-rule intent. No duplication — the orchestrator prose restates the requirement (what to do), not the injected text (what the model reads in-turn).

### Fix 4 — mode-question consistency with invariant 7

**RESOLVED.**

`agents/orchestrator.md:16` (step 2 of `## Setup`) now reads: "For `mode`, the safe default is **`interactive`** (invariant 7: absent or unrecognised ⇒ `interactive`) — present `interactive` as the default/recommended and `autonomous` as the opt-in; do **not** recommend `autonomous`."

This is exactly what invariant 7 requires (`PROTOCOL.md:76`: "absent or unrecognised ⇒ `interactive`"). The prior version listed both options without a recommended default; the contradiction the Operator observed live is gone.

`.opencode/agents/ai-pm.md:31` reflects the same text — the assembled file was regenerated and matches the source `agents/orchestrator.md:16` byte-for-byte on that line (confirmed by git diff showing identical change in both files). No stale assembled copy.

`PROTOCOL.md` stays at 180 lines — one-sitting constraint holds.

### Scope check

Changes reviewed: `adapter/INSTALL.md`, `adapter/README.md`, `adapter/tool-map.json`, `adapter/deny-rules.json`, `agents/orchestrator.md`, `.opencode/agents/ai-pm.md`, `.opencode/plugins/ai-pm.mjs`, `adapter/opencode/plugin-entry.mjs`, `adapter/opencode/normalise.mjs`, `adapter/parity.test.mjs`. All changes are within the four named fixes plus the assembled-file regen. No scope creep detected.

### Remaining known limitation (acceptable, not a blocker)

Config write + reviewer model-pin bake: unit-proven via `install-commands.test.mjs` / `install-model.test.mjs`, not yet end-to-end live-run. Honestly labelled as such in `adapter/INSTALL.md:59`. Not an over-claim; not a blocker per the task brief.

### Final verdict

**Approve.** All four fixes are correctly applied and verified. All five gates pass. No remaining over-claim, no duplicated nudge string, no stale assembled copy, no mode-question contradicting invariant 7. The one outstanding known limitation (config write / pin bake, unit-proven only) is honestly labelled and is not a blocker.
