# Plan-compliance review — opencode-compact-reviewer (Pass 1)

Scope of this review: **in-scope pieces 1, 4, 5** of `doc/features/opencode-compact-reviewer_plan.md`, shipped as
slice A (`08f42f6`) + slice B (`01e0095`) on `feature/opencode-harness-support--compact-reviewer`. Pieces 2 (audit
fallback) and 3 (ultra removal) are **deferred-by-design to slice C** (cross-harness, golden re-freeze) and are NOT
evaluated here. Range inspected: the two slice commits over the stated base.

## Plan compliance

### Piece 1 — compact one-pass OpenCode reviewer (slice A)
- ✓ Single subagent, one pass, no fan-out — `src/manifests/opencode/harness_local/body/code-review.body.md` (declares "compact one-pass reviewer", "one subagent reads the diff ONCE"); no fan-out/spawn/coordinator language (grep clean). Test: `oc-compact-reviewer` (`tests/opencode.sh:719`).
- ✓ Nine aspects covered (plan-compliance, security, stability, regressions, test-coverage, conventions, simplification, documentation, architecture) — body lines 25–33. Test asserts the aspect set.
- ✓ Severities + confidence kept verbatim (critical/warning/suggestion; high/medium/low) — body lines 17–19.
- ✓ Structured `<finding>` block + `<proposal>` block — body lines 42–71.
- ✓ Consolidated-report sections (Critical / Warnings / Suggestions / Test coverage / Plan compliance / Out-of-scope / Architecture) + verdict rubric — body lines 77–127.
- ✓ Absolute "any plan-compliance deviation ⇒ Request changes / never Approve" rubric row kept — body line 121; test asserts it explicitly.
- ✓ ~¼ size of the wb source — generated reviewer 18,365 B vs ~58 KB source (~32%); 131-line body, in the arch note's 120–160 band. Test asserts substantially-smaller-than-source (guarded-skip when refs absent).
- ✓ OpenCode-only — `.claude/` untouched; golden byte-identical.

### Piece 4 — control-layer model follows the reviewer (slice B)
- ✓ No baked per-agent `model:`/`variant:` pins anywhere — all four generated checking agents (code-review, pm-auditor, pm-plan-checker, pm-product-advocate) + deep-research carry no pin; source frontmatter clean. Tests: `oc-single-model-default`, `oc-control-layer-model` (form/docs/runtime).
- ✓ Single-source mechanism, bump-surviving user override — documented four-line `agent.<id>.model` personal-config block (PM's own opencode.json) in `doc/stack-notes.md` §(9) + the AGENTS.md control-layer section; matches arch note (B) recommendation verbatim. `inject_model_pin`/`inject_variant` + control branches removed from `gen/generate.py`; generator-deterministic test passes.
- ✓ `oc-control-layer-model` runtime guarded-skip confirms the four checking agents resolve to the override model when the block is present; residual task-spawn resolution honestly carried as `to-verify` in stack-notes (per arch note Residual risk).

### Piece 5 — single session default + hide build/plan (slice B)
- ✓ `models` block reduced to only `session` (no `control`/`control_variant`/`control_agents`) — `src/manifests/opencode/adapter.json`. Test: `oc-single-model-default` (asserts no `control*` keys).
- ✓ `agent.build.disable = true` + `agent.plan.disable = true` in shipped `opencode.json` (source + generated). Test: `oc-builtins-hidden` + runtime loader-accept check.
- ✓ Stack-notes spike facts flipped to `execution-verified (OpenCode 1.16.2, 2026-06-08)` (disable, config-level override, mode:all inherit-session).

### Deferred-by-design (NOT flagged)
- Piece 2 (audit fallback → compact reviewer) and piece 3 (`ultra` removal) — `ultra` still present in `workflow/`, `src/commands/`, `README.md`; `ultra-absent` test absent. Correct: slice C, out of scope here.
- `doc/architecture.md` decision record — explicitly post-coding pm-architect handoff per plan; expected-pending, not a gap.

## Definition of Done
- [x] All in-scope plan scenarios implemented and tested
- [x] Interaction scenarios have concurrent-state tests — n/a (config/prose generation, no shared-state/async runtime; arch note explicitly notes no subscription/feedback-loop class)
- [x] Stack expectations respected; stack-spec tests pass (opencode 33/33 incl. runtime loader-accept; spike facts cited with source URLs in stack-notes §(9))
- [x] Product Contract honored — `cross-model-review.md` anchors (workflow/*) untouched, guarantees intact; `dual-harness-from-one-source.md` preview-honesty + byte-identical golden upheld (see note 1). No silent user-visible behavior change.
- [x] Pipeline green — opencode 33/33, oc-plugin-unit 39/39, generator 4/4 (Claude byte-identical), hooks 79/79, neutral-prose 5/5
- [x] State file updated — `.ai-pm/state/current.md` records both slices A and B + Next
- [x] Product Impact Report present — n/a (no Product Contract content changed; OpenCode-only adapter mechanics)
- [x] Docs updates landed — stack-notes §(9), AGENTS.md (source + generated), code-review.fm/deep-research.fm model comments (architecture decision record deferred post-coding by plan)
- [x] Expected artifacts exist — plan, arch note, this review (no new Product Contract required; not user-facing)
- [n/a] Product-readiness gate — feature is non-user-facing (every in-scope scenario subject is the generator / reviewer agent / checking-agent layer / picker; no human-role subject)
- [n/a] Validation gate — software-kind project
- [n/a] Failure-inventory negative-space tests — in-scope plan pieces list no failure-path scenarios

**DoD: pass**

## Blocking
None.

## Notes (product)
1. **`dual-harness-from-one-source` contract preview-gap list is now slightly stale.** Its "Must not break" item lists "cross-model model pins" among the OpenCode not-yet-in-preview pieces honestly disclosed. Pieces 4/5 **retire** those static pins and replace them with the control-layer personal-config block; the AGENTS.md preview-honesty banner was updated correctly, so no guarantee is broken — but the contract text still names a piece this branch removed. Why it matters: the next reader of that contract will see a retired mechanism described as a current preview gap. Natural place to fold the refresh is the deferred `doc/architecture.md` decision record / contract pass; surfacing for the PM to confirm timing.
2. **The OpenCode `code-review` agent's advertised `description` still describes the OLD thin engine.** `code-review.fm`'s `description` (what `opencode agent list` / discovery shows) still reads "correctness bugs and reuse/simplification/efficiency cleanups … a concise findings list (file:line, issue, why)" — i.e. two dimensions + a flat list — while the body is now the nine-aspect compact reviewer with severities and a structured `<finding>` report. This is plan-faithful (the arch note scoped `.fm` to no change beyond the model comment for piece A), so it is not a deviation — but the agent now understates what it does at its discovery surface. Why it matters: a user choosing the engine reads the stale description, not the body. Worth a one-line description refresh; raising for the PM since it is a user-visible discovery-surface choice.
3. **Cosmetic test-output noise (structural, non-blocking).** `tests/opencode.sh:911` emits `session: команда не найдена` to stderr during the `oc-single-model-default` PASS (an unescaped `session` token in the pass message), and the rendered pass text loses the word "session". The assertion still PASSes. Why it matters: muddies the test log and could mask a real message later. Pruning is a code-quality fix (Pass 2's remit), surfaced here only as a structural observation.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
Pass-2 `code-review` (high effort, base `feature/opencode-harness-support`) — 7 finder angles → verify. The shipped deliverable is CLEAN: `gen/generate.py` (no dangling refs to the removed `inject_model_pin`/`inject_variant`/`control*` machinery; `models.get("session")` guarded), the source+shipped `opencode.json` (valid JSON, `agent.build/plan.disable` correctly shaped, no source/shipped drift beyond the `__SESSION_MODEL__` placeholder), every generated agent (no baked `model:`/`variant:` pin), and the Claude golden (byte-identical, generator 4/4). All 5 findings were **test-quality** issues in `tests/opencode.sh`:

1. `oc-compact-reviewer` compactness guard gated on the `.gitignored` `$WBREFS` scratch dir → SKIP off-machine while the PASS message still claimed "substantially smaller than the wb source" (compactness unverified on CI + dishonest message).
2. Unescaped backticks in the `oc-single-model-default` pass message (`` `session` ``) → command substitution, `session: command not found` to stderr + elided word.
3. The slice-B `debug config --pure` runtime PASS over-claimed it verified the disables + pin-absence (it only proved the config parses).
4. The `oc-control-layer-model` runtime override used the session model id as the override value → could not distinguish "moved off session" from "coerced back".
5. The `oc-control-layer-model` docs check grepped each of the four agent ids as a bare anywhere-in-file substring (no block-coherence, no "exactly four").

## Code review: FIXED — `64004ab`
All 5 fixed by `pm-coder`, smallest faithful change each, no shipped artifact touched (diff confined to `tests/opencode.sh`): (1) added an always-run absolute ceiling `CR_CEILING=28000` B (arch-note ~18.4 KB target, well under half the ~58 KB source) + kept the `$WBREFS` relative check as a when-present bonus + made the PASS message honest (absolute claim always, relative only when run); (2) backticks escaped; (3) runtime PASS reworded to claim only "config parses cleanly"; (4) override switched to a distinct synthetic id with an `assert override != session` so it proves the agents move OFF the session (verified live that `--pure` echoes an unknown id on 1.16.2); (5) docs check replaced with a block-extractor asserting EXACTLY the four ids in the canonical config block. Re-verified independently: opencode 33/33 (zero skips), generator 4/4 (Claude byte-identical), neutral-prose 5/5, hooks 79/79, oc-plugin-unit 39/39, targeted-reading 7/7.

## Verdict (Pass 2): approve
