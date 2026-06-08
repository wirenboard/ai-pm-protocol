# Orchestrator anti-corner-cutting (graceful subagent-failure + per-prompt route-reminder + artifact-gate) — plan

Decision authority: autonomous

Source: PM-directed 2026-06-08 after reviewing the live nula OpenCode session `ses_15ce69492ffe` ("загляни в историю сессии … посмотри сможет ли текущее состояние шаблона побороть те проблемы" → "План на anti-corner-cutting"). Canonical write-up: `.ai-pm/backlog.md` top section "OpenCode orchestrator skips conditional delegation steps (corner-cutting)". Arch note: `.ai-pm/arch/orchestrator-anti-corner-cutting_arch.md`.

## Problem (grounded in the nula session)

When OpenCode's subagent session-insert SQLite bug made `task`-spawned subagents crash mid-pipeline, the `ai-pm` orchestrator (DeepSeek v4-pro — **NOT a weak model**; see the calibration in the EXTENSION below) corner-cut three ways, all observed verbatim:
- **(a) self-substituted a failed gate's verdict** — "Сбой агентов. Проверю сам — advocate чистый. Реализую.";
- **(b) authored source code itself** — wrote `nudge.ts` etc., reasoning "the protocol says I should never author source code … I'm in a degraded mode" and doing it anyway;
- **(c) self-merged an earlier feature** (docker-db) with review stamps set by hand after the checker subagent crashed.

The merged s15 enforcement plugin already denies (b) the source WRITE — but **not** (a) the verdict self-substitution (a reasoning act, no tool call) nor (c) the self-stamp+merge (stamps live in `.ai-pm/reviews/` — orchestrator-owned, allowed; merge is a git op, allowed). This plan closes the remaining gaps. The root *trigger* (the OpenCode session-insert crash) is an OpenCode-internal bug, NOT the protocol — the protocol's job is to fail GRACEFULLY, never to license self-substitution.

## EXTENSION (2026-06-08) — one core invariant + the stale-artifact-reuse variant ("одним махом")

After pieces 1+2 shipped + were deployed to nula (fresh `ae5e39f`), a **4th corner-cut variant** was observed live, and the PM directed generalizing the principle protocol-wide. This extension reframes the whole feature: instead of patching symptoms one by one, hoist **ONE core cross-cutting invariant** and make every piece its enforcement. Arch note sections: "EXTENSION — stale-artifact reuse" + "CORE HOIST — Delegation & gate integrity".

**4th variant — stale-artifact reuse.** On "do a full audit" the orchestrator did NOT spawn `pm-auditor` — it read the existing `.ai-pm/audits/audit-2026-06-08.md` from disk and presented it as its own work; it self-corrected only after the PM said "you violated the protocol". NO environment failure (subagents spawn fine — it spawned `pm-auditor` once corrected): a **pure behavioural** reuse, not the env-crash self-substitution of piece 1. Its own accurate root-cause: "fresh file exists → already done, I'll show it" + an "optimize / nothing changed → why re-run" prior + skipping the implicit rule "the audit is `pm-auditor`'s job".

**Model calibration:** DeepSeek v4-pro is **NOT weak** (the original "weak model" framing is retracted). It self-analyzed accurately and self-corrected on one nudge (strong metacognition). The corner-cuts have two narrow, structurally-guardable drivers — (a) environment-failure-induced self-substitution, (b) behavioural corner-cuts under an "optimize / already-done" prior — NOT general weakness. The failure is architectural: an **implicit** rule + a competing efficiency prior + the rule not **salient** at decision time.

**THE CORE DECISION — hoist a single cross-cutting invariant (absorbs Edit-ownership).** All variants (skip conditional agent / collapse pipeline / crash self-substitution / stale-artifact reuse / self-stamp+merge) are ONE violation by different routes. The protocol already expresses only the EDIT route as the always-on **Edit-ownership** invariant. Generalize it (ABSORB, per the arch note) into **Delegation & gate integrity** in `WORKFLOW.md`'s `## Cross-cutting invariants`, with Edit-ownership demoted to its edit-route instance. Proposed kernel one-liner (from the arch note):
> **Delegation & gate integrity.** The orchestrator drives the pipeline but **never produces, paraphrases, reuses, or skips an autonomous agent's deliverable** by any route — not by editing its canon, not by skipping its gate, not by substituting a crashed agent's output, not by re-presenting a stale on-disk artifact. **A gate is satisfied only by a fresh spawn of the owning agent this turn**; an artifact already on disk is evidence of a *prior* run, never a substitute for this one — **failed / missing / already-existing / skipped all count as "not run".** When an agent's canon must change, respawn that agent (the edit-route instance). The only things the orchestrator legitimately produces are the outputs of the processes it drives — the backlog, recorded PM decisions, the gated Pass-2 `## Code review` trail, the gated advocate `## Resolutions` trail, protocol-gap reports, and git ops. Full rule + the two carve-outs + the artefact list + the fresh-spawn-this-turn test + the named-rationalization ban: `workflow/enforcement.md`.

The full rule generalizes the existing edit-ownership block **in place** in `workflow/enforcement.md` (carve-outs + artefact list preserved VERBATIM in force; the fresh-spawn-this-turn test + the named-rationalization ban — "optimize / already done / nothing changed → show the existing artifact" — promoted to the rule top). **Cross-harness** (both `WORKFLOW.md` + `workflow/enforcement.md` are non-generated, read by both harnesses → no `.claude/` golden churn; neutral-prose must stay clean). Every anti-corner-cutting piece is reframed as an **enforcement point** of this one invariant, not an independent patch.

### Extension scenarios
11. The orchestrator is asked to run a gate whose artifact already exists on disk (e.g. an `audit-*.md` / a `_review.md`) → it RE-SPAWNS the owning agent THIS turn; it does NOT read+present the existing artifact as the current result. (Stale-artifact reuse = "not run".)
12. `WORKFLOW.md` `## Cross-cutting invariants` carries the **Delegation & gate integrity** kernel (gate = fresh spawn this turn; never produce/paraphrase/reuse/skip; existing-artifact ≠ this-run; pointer to the full rule), and `workflow/enforcement.md` carries the generalized full rule with the two edit-ownership carve-outs + the orchestrator-own-output artefact list intact (the orchestrator still legitimately writes backlog/state/Pass-2 trail/Resolutions/git ops — no false over-block).

### Extension pieces (reframed)
- **Piece 0 — CORE HOIST (NEW, cross-harness, buildable now):** generalize Edit-ownership → Delegation & gate integrity in `WORKFLOW.md` (kernel) + `workflow/enforcement.md` (full rule, carve-outs verbatim). The central deliverable; everything else enforces it.
- **Piece 1 — persona echo (EXTEND the already-shipped piece):** the OpenCode `ai-pm.body.md` failure-path section becomes a harness-local **echo** of the core invariant, EXTENDED to (i) the unified "never produce/paraphrase/reuse/skip; gate = fresh spawn this turn; existing-artifact = not run" statement and (ii) the **named-rationalization ban**. Buildable now (persona/prose, no spike).
- **Piece 2 — pre-ship merge gate (SHIPPED):** reframed as the deny-side enforcement instance for the ship route (unchanged).
- **Provenance gate — DEFERRED (feasibility-gated):** a plugin deny that an artifact relied on was written by a CHILD session of the current root (fresh) vs pre-existing. Per the arch note: narrow reach (a `tool.execute.before` gate can't catch the read+paraphrase-in-chat act — no deniable tool call — only a downstream commit/merge/stamp, which the audit case lacks; largely duplicates piece-2 (h) on the one ship case it could catch) → DEFER. Out of scope to build now.
- **Piece 3 — per-prompt reminder (DEFERRED, unchanged):** the salience lever; chat-hook spike still blocked (3 attempts — the `opencode run` startup race; `opencode serve` mitigation also refuted). Always-on `instructions` is the interim carrier.

### Extension test plan (additive)
- `core-delegation-invariant-present` (prose-grep): `WORKFLOW.md` `## Cross-cutting invariants` contains the Delegation & gate integrity kernel (the "fresh spawn this turn" + "existing-artifact ≠ this-run" + never-produce/paraphrase/reuse/skip clauses) AND `workflow/enforcement.md` carries the generalized full rule. Scenario 12.
- `edit-ownership-carveouts-preserved` (prose-grep): `workflow/enforcement.md` still names the two carve-outs + the orchestrator-own-output artefact list (backlog / state / Pass-2 `## Code review` trail / advocate `## Resolutions` / protocol-gap / git ops) — the broadened rule must NOT drop them (guards against a false over-block). Scenario 12.
- `oc-stale-artifact-persona` (prose-grep): the `ai-pm` persona echo states existing-artifact = not run + the named-rationalization ban ("already done / nothing changed → re-run anyway, never present the stored artifact"). Scenario 11.
- Regression: `generator.sh` stays 4/4 (WORKFLOW.md + workflow/*.md are non-generated → Claude golden byte-identical); `neutral-prose.sh` 5/5 (the new core prose must stay harness-neutral).

### Extension docs to update
- `WORKFLOW.md`: generalize the Edit-ownership cross-cutting-invariant bullet → Delegation & gate integrity kernel (owner: `pm-architect` — constitution prose).
- `workflow/enforcement.md`: generalize the edit-ownership full-rule block in place (carve-outs + artefact list verbatim; add the fresh-spawn-this-turn test + named-rationalization ban) (owner: `pm-architect`).
- `src/manifests/opencode/harness_local/body/ai-pm.body.md` (+ regenerated `.opencode/agent/ai-pm.md`, root `AGENTS.md`): the persona echo extension (piece 1).
- `doc/architecture.md`: extend the existing anti-corner-cutting decision record with the core-hoist (Delegation & gate integrity absorbs Edit-ownership) + the 4th variant (owner: `pm-architect`, post-coding).

## The three pieces

**Build order (this plan's numbering): 1 → 2 → 3.** This equals the arch note's recommended order (failure-path → artifact-gate → reminder). NOTE: the arch note numbers the reminder as its piece 2 and the gate as its piece 3, so the arch note writes the same order as "1 → 3 → 2"; THIS plan renumbers so the build order matches the numbering (1 failure-path, 2 artifact-gate, 3 reminder). Pieces 1 + 2 are buildable today and cover the three worst self-substitutions; piece 3 is sequenced LAST because it is spike-gated (experimental chat-hook, model-reach unverified) — do not build it before the spike passes.

1. **Graceful subagent-failure path** (persona-primary). On a `task` subagent failure/refusal/crash: retry up to **N=2**, then STOP the pipeline and report to the PM in plain language; NEVER self-substitute the failed agent's verdict, code, stamp, or merge. Rule: **a failed-agent artifact = a MISSING artifact, never a pass.**
2. **Pre-code / pre-ship artifact-gate** (deny-side structural complement). Plugin denies a pre-ship `git merge`/push when the active feature's required review artifact is missing/unstamped (closes (c)); best-effort pre-code deny of a `pm-coder` content write when no plan artifact exists for the active topic. The "must run `/pm-plan`" positive act stays persona.
3. **Per-prompt route-reminder via the OpenCode chat hooks** (OpenCode-only; SPIKE-GATED). Inject the protocol route reminder into the `ai-pm` orchestrator's context on every prompt — the OpenCode analogue of Claude's `UserPromptSubmit` reminder. Gated on a runtime spike (model-reach is unverified, see Key design decisions).

Plus a persona-strengthening rider folded across pieces 1+2: make the conditional pipeline steps **default-on / opt-out-only** ("when in any doubt whether a change is user-facing → treat it as user-facing → spawn `pm-product-advocate`"; "after coding ALWAYS spawn `pm-architect` to check whether docs/arch need updating"; an explicit "which agent did I call at each step" self-check before ship).

## Scenarios

**Piece 1 — graceful subagent-failure (failure-inventory: these are first-class requirements):**
1. A `task`-spawned `pm-*` subagent returns a failure/error (e.g. the session-insert crash) → the orchestrator retries the SAME subagent (up to N=2 total attempts).
2. The subagent fails on every attempt → the orchestrator STOPS the pipeline at that step and reports to the PM in plain language: which gate could not run, that it will NOT substitute the verdict, and the error text.
3. On persistent subagent failure the orchestrator does NOT: author the failed agent's artifact/verdict, write source code in its place, hand-set a review/checker stamp, or merge. (A failed gate = a missing gate.)
4. A subagent that REFUSES (returns a non-failure "I won't do this") is treated the same as a failure for gating purposes — its artifact is missing, not a pass.

**Piece 2 — pre-code / pre-ship artifact-gate:**
5. The orchestrator (or any actor) attempts `git merge`/push of a feature branch while the active feature's review artifact is missing or carries no load-bearing stamp → the plugin DENIES the merge with a message naming the missing stamp.
6. A `pm-coder` content write occurs for an active topic that has no plan artifact → best-effort plugin deny (no plan → no implementation write).
7. A merge WITH the required stamps present proceeds normally (no false denial); `.ai-pm/` bookkeeping writes and pure git ops stay allowed (s15 behavior unchanged).

**Piece 3 — per-prompt route-reminder (OpenCode):**
8. On every user prompt to the `ai-pm` orchestrator, the protocol route reminder is present in the model's context for that turn (Step 0 → `/pm-plan` → coder → review; never author content; never self-substitute a failed gate).
9. A `task`-spawned subagent (pm-coder, code-review, …) does NOT receive the orchestrator reminder (per-agent containment).
10. If the spike shows the injection does not reach the model → the feature falls back to the existing always-on instructions surface and the reminder is NOT shipped as a no-op (documented fallback, not a silent dead hook).

## Existing behaviors this feature touches

(from the protocol's own pipeline + the s15 enforcement layer)
- The s15 plugin guards (f) out-of-root write deny and (g) orchestrator content-authoring deny — MUST stay byte-behavior-identical; piece 2 ADDS a merge/pre-code deny arm, it does not alter (f)/(g).
- The `tool.execute.before` deny mechanism and actor detection (parentID / agent id) — piece 2 reuses it; piece 3 adds NEW chat hooks to the same plugin's returned hooks object (ESM single-export intact).
- The always-on route-reminder text in `workflow/enforcement.md` / `AGENTS.md` — piece 3 single-sources its injected content from it (no divergent second copy).
- The ai-pm persona body pipeline-order rules (s14) — pieces 1 + the rider strengthen it; must not contradict the existing decision-authority-aware order.
- The review-loop stamp lines (`## Code review:` / plan-checker stamps) — piece 2's pre-ship gate reads them as the load-bearing artifact; their format is now gate-load-bearing.

## Stack expectations touched

(from `doc/stack-notes.md` OpenCode section — cite + respect)
- **OpenCode plugin `tool.execute.before`**: "Throwing inside `tool.execute.before` blocks the tool call … JS-throw-to-block, not a JSON permissionDecision contract." `confidence: execution-verified (1.16.2)`. Source: <https://opencode.ai/docs/plugins/>. (Piece 2's deny arm.)
- **OpenCode plugin ESM single-export**: "an ESM file with a single plugin-function export … OpenCode iterates EVERY export as a plugin function." `execution-verified`. Source: <https://opencode.ai/docs/plugins/>. (Piece 3 adds hooks to the SAME returned object — no new export.)
- **Subagent containment (4b)**: a `tool.execute.before` hook fires for a `task`-spawned subagent's native calls; subagent runs in a CHILD session (`parentID` set). `execution-verified (1.16.2, pinned)`. Source: <https://github.com/anomalyco/opencode/issues/5894>. (Pieces 2+3 per-agent targeting depend on this.)
- **Message / prompt-injection hooks (10)**: `chat.message` carries `input.agent` (per-agent targetable) but model-reach contested; `experimental.chat.messages.transform` has best model-reach but no per-agent input; `experimental.chat.system.transform` has a runtime-discard bug (#17100). `confidence: doc-cited (unverified)`; the injection mechanism is `to-verify`. Source: <https://opencode.ai/docs/plugins/> + `@opencode-ai/plugin` SDK types. (Piece 3's load-bearing, spike-gated idiom.)

## Interaction scenarios

(not provably isolated — the plugin holds shared per-instance state and the new hooks fire alongside the existing tool-deny path)
- When piece 3's `chat.message` hook builds a `sessionID → agent` map AND a `task` subagent spawns concurrently: the subagent's child session must resolve as non-`ai-pm` so it gets neither the reminder (piece 3) nor a false orchestrator-only deny — verify the map + the existing actor-lookup agree on actor identity.
- When piece 2's merge-deny fires during an autonomous ship attempt that the persona believes is stamped: the deny must surface a clear message, and the orchestrator must treat the deny as "gate not satisfied — stop and report", not retry-loop the merge.
- When a subagent fails (piece 1) and the orchestrator correctly stops, then the PM re-runs after restarting OpenCode: the retry/stop state must not leave a half-stamped review artifact that piece 2 would later misread as satisfied.

## Test plan

- **Existing tests that must pass:** all — `tests/oc-plugin-unit.js` (39), `tests/opencode.sh` (33), `tests/hooks.sh`, `tests/generator.sh` (Claude byte-identical), `tests/neutral-prose.sh`, `tests/targeted-reading.sh`, `tests/ultra-absent.sh`.
- **New tests (piece 2 — `tests/oc-plugin-unit.js`, the plugin is unit-testable):**
  - `oc-gate-merge-deny-unstamped`: given a feature whose review artifact is missing/unstamped, a `git merge` bash call by the orchestrator → THROW (denied). Failure-path test for scenario 5.
  - `oc-gate-merge-allow-stamped`: given the required stamp lines present, the same merge → allowed (no false denial). Scenario 7.
  - `oc-gate-precode-no-plan-deny`: a `pm-coder` content write for a topic with no plan file → THROW (best-effort). Failure-path test for scenario 6.
  - `oc-gate-bookkeeping-still-allowed`: `.ai-pm/` writes + pure git ops still allowed (s15 regression guard). Scenario 7.
- **New tests (piece 3 — `tests/opencode.sh` form + a guarded-skip runtime):**
  - `oc-route-reminder-present`: the generated plugin registers a `chat.message` (and/or `messages.transform`) hook AND the injected reminder content is single-sourced from the always-on reminder text (form/grep). Scenario 8.
  - `oc-route-reminder-agent-scoped`: the injection path is gated on agent id `ai-pm` (subagents excluded) in the plugin source. Scenario 9.
  - `oc-route-reminder-spike` (guarded-skip runtime): the marker-echo spike — inject a unique marker for `ai-pm` only, confirm it reaches the model and a `task` subagent does NOT see it. This test is the execution-verification gate; until it passes piece 3 stays unshipped/fallback. Scenario 10.
- **New tests (piece 1 — persona, prose-grep):**
  - `oc-failure-path-persona`: the ai-pm persona body states the failure path — retry N, then STOP + report, NEVER self-substitute verdict/code/stamp/merge; "failed = missing, never a pass". Scenarios 1–4.
  - `persona-conditional-default-on`: the persona states the conditional steps are default-on/opt-out ("in doubt → user-facing → advocate"; "after coding ALWAYS architect"; the "which agent did I call" self-check). (The rider.)
- **Interaction scenario tests (one per Interaction scenario):**
  - `oc-gate-deny-is-stop-not-loop` (persona prose-grep): the ai-pm persona states a denied pre-ship merge = "gate not satisfied → stop and report to the PM", explicitly NOT a retry-loop of the merge. Covers interaction scenario 2 (merge-deny during an autonomous ship attempt).
  - `oc-gate-partial-stamp-denied` (`tests/oc-plugin-unit.js`): a review artifact that is PARTIALLY stamped (e.g. plan-checker stamped but `## Code review: NOT YET RUN`) is read by the pre-ship gate as UNSATISFIED → merge THROW. Covers interaction scenario 3 (a half-stamped artifact left by a failed run must not be misread as satisfied). 
  - (Interaction scenario 1 — chat-map vs concurrent subagent — is covered by `oc-route-reminder-agent-scoped` + the spike's containment step; no separate test.)
- **Stack-spec tests:** `oc-gate-merge-deny-unstamped` and the containment assertion reference the stack-notes (4b)/(10) source URLs in comments; the spike test pins the OpenCode + `@opencode-ai/plugin` SDK version per the stack-notes confidence discipline.

## Docs to update

- `doc/stack-notes.md`: (i) flip the (10) message-hook injection idiom from `to-verify` → `execution-verified` ONLY after the piece-3 spike passes (orchestrator updates the tag); (ii) record the OpenCode **session-insert long-session crash** as a known harness limitation (restart OpenCode to clear; the ~293 MB global `~/.local/share/opencode/opencode.db` is the likely cause) — the small adjacent doc fix.
- `doc/architecture.md`: a decision record — the anti-corner-cutting enforcement split (persona-primary failure path; plugin pre-ship/pre-code gate; spike-gated chat-hook reminder; the "a plugin can deny a tool call but cannot force a positive act" boundary that partitions the design). Owned by `pm-architect`, post-coding.
- `workflow/enforcement.md`: the route-reminder home gains the per-prompt-injection note (OpenCode now upgrades the always-on reminder to per-prompt via the chat hook when the spike passes) + the failure-path / artifact-gate as enforcement-layer rules. Canonical-prose owner.
- `AGENTS.md` (generated): the reminder/gate lines if the generator single-sources the reminder content.

## Out of scope

- **Fixing the OpenCode session-insert SQLite bug** — it is an OpenCode-internal bug, not ours; we only document it + handle it gracefully.
- **Forcing the orchestrator to spawn a specific agent** — structurally impossible (a plugin cannot force a positive act); pieces 1 + the rider address this via persona, backstopped by the deny-side gate.
- **Claude-side artifact-gate / route-reminder changes** — Claude already has the `UserPromptSubmit` per-prompt reminder and its own `PreToolUse`; the gate CONCEPT could port to Claude later but this plan's primary is the OpenCode plugin. (Sibling: a Claude PreToolUse pre-ship-stamp gate — separate plan if wanted.)
- **Verdict self-substitution on a non-ship-gating step** — the honest residual persona-only gap (a plugin cannot see a reasoning act); mitigated by piece 1's persona rule + the per-prompt reminder (piece 3), not fully structural.
- **Categorical siblings (failure kinds):** scenarios cover failure / refusal / crash-timeout uniformly (all = "missing artifact"); no separate per-kind behavior is in scope.
