# Backlog

Observations and follow-ups recorded during reviews/audits. Triaged 2026-06-12 against the minimal core: entries resolved by shipped versions removed; entries referencing the retired template structure (workflow/*.md, the pm-* roster, gen/) re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals).


## Post-re-unification audit (2026-06-20) — LOW/NIT housekeeping dispatch

Whole-tree audit after the fork→canon squash re-unification: **HEALTHY** — 0 BLOCK, 1 HIGH (resolved this same session: H1 two orphaned tests wired into the registry + an inverse orphan-guard, 5.19.3), plus these non-blocking residuals to fold on a future touch (run-note: `.ai-dev/audit/post-reunification-2026-06-20.md`, deleted once dispatched):

- **L1** — the "Multi-repo epic follow-ups" entry still lists *seam-contract transport* as open though it shipped in 5.17.0; fold to RESOLVED on the next backlog edit (Operator deferred folding it in the H1 PR — not worth its own PR).
- **L2** — `backlog.md:242` references a future `npx ai-dev-protocol@latest` brand path not yet published; correct as a future item, skim-misread awareness only.
- **N1** — `src/agents/orchestrator.md` grew to 312 lines (agent file, not bound by the docs ceiling); watch, consider extraction past ~330.
- **N2** — `docs/decisions/persona-floor-external-substitute.md` is the heaviest decision doc (278 lines); justified epic rationale, watch accumulate-vs-supersede on revisit.

## z.ai support — GLM-the-model (done-by-existing-adapter) + ZCODE-the-harness (candidate adapter, probe-gated) — 2026-06-19

Research landed: `docs/decisions/zai-glm-zcode-support.md`. Two unrelated questions.

- **GLM-4.6 as a model** — ALREADY supported: it is an Anthropic-compatible endpoint (`https://api.z.ai/api/anthropic`) consumed by Claude Code / OpenCode (the adapters we already ship). No mechanical work; at most a short usage note when a downstream actually runs on GLM. Honesty caveat to record then: both Builder + Reviewer run on GLM (per-session endpoint) ⇒ no cross-model independence, same as OpenCode.
- **ZCODE as a third adapter** — CANDIDATE, **gated on a live GO/NO-GO probe**, not started. ZCODE (`zcode.z.ai`) is z.ai's own CC-shaped CLI/Electron agent (Skills/Subagents/Hooks/MCP/Plugins). The two load-bearing contract points are unconfirmed by docs: (1) does a plugin hook *block* a tool call (mechanical deny)? (2) custom sub-agents — docs contradict themselves (one page: only built-in `Explore`; other: `~/.zcode/cli/agents/` markdown). **Do not build on docs** — same fail-open class as OpenCode 1.17.x (pin parsed-but-ignored, plugin registered-but-not-loaded). GO only if both probes pass on a real install (needs a subscription): a plugin/hook actually denies a forbidden write, AND a custom Reviewer sub-agent spawns on a fresh context. Vendor-watch: ZCODE is evolving (the subagent doc contradiction suggests docs trail the build). Probe checklist + secondary contract points: the decision doc.

## Two follow-ups from the 5.17.7 OpenCode-inject fix — 2026-06-19

- **RESOLVED (5.19.0, #62) — Installer npx-cache stale no-op probe.** `npx github:…` caches the checkout and could silently re-install a STALE version (root of the multi-session false-"updated" confusion: a downstream sat on 5.17.3 while every "update" was a cache no-op). Shipped as the proportionate (b) — a loud version banner + the `isStaleNpxReRun` heuristic warning (offline, deterministic, never-blocking, points at the `~/.npm/_npx` cache-clear) — chosen over a flaky remote network check. The manual recipe is also in README `## Updating an existing install` + INSTALL.md `## Upgrade`.
- **Option-B revisit: re-realise the OpenCode inject nudge via a supported hook.** 5.17.7 dropped the OpenCode `chat.message` inject (it crashed opencode 1.17.8 with `EventV2.InvalidSyncEvent` and rendered unreliably) → inject-class rules (change-route-reminder / no-config-run-setup / no-product-brief-discover) are now persona-only on OpenCode. If/when opencode stabilises a supported inject hook (`experimental.chat.system.transform` / `chat.params` are the current candidates — version-brittle today), re-realise the nudge there to restore parity with Claude's `UserPromptSubmit`. Vendor-watch. Backlog (Operator chose Option A 2026-06-19).

## Persona floor collapses under a non-compliant Orchestrator model on OpenCode — 2026-06-19 (downstream intake)

**Direction set (Operator, 2026-06-19): BOTH** — (A) harden the mechanical floor so protection does not depend on model cooperation, AND (B) declare forge branch-protection + required-CI a *mandatory* substitute for the ask-class OpenCode cannot realise. Scope the combined work as its own epic via `research` (it touches the engine + the cross-platform honesty posture). Diagnostic still pending (see end) to tell apart a dead-plugin install bug from live-but-leaky enforcement.

**PROGRESS — the epic is now substantially shipped:**
- **F1 RESOLVED (5.18.0, #61)** — explicit trunk push without stamp now DENIES (not ask → no OpenCode silent pass).
- **F4 RESOLVED (5.18.0, #61)** — `git add -A` + commit-on-main-with-history now DENY mechanically on both platforms.
- **F3 RESOLVED (5.19.0, #62)** — installer drops a default-ON pre-push hook running the quality suite (local mechanical gate, holds regardless of model discipline).
- **F2 RESOLVED-as-F2-1 (this feature)** — the forge branch-protection + required-CI offer is now a MANDATORY, recorded accept-or-decline step in `## Setup` (the printed `gh api` recipe), named openly as THE ask-class substitute on OpenCode. Research/decision: `docs/decisions/persona-floor-external-substitute.md`. **STILL OPEN — F2-2 (deferred fast-follow):** the agent runs the `gh api` branch-protection call itself on the Operator's confirm (a forge-mutating action; admin scope) instead of printing the recipe.
- **F5 RESOLVED-as-accept** — the audit cadence stays honestly `[persona]`; branch protection + CI is its named real backstop (a missed cadence offer costs a delayed sweep, not an unsafe ship). Reframed in `## Audit`.

**Downstream symptom** (OpenCode, `lite`, deepseek-class orchestrator model; long high-throughput session): the orchestrator drove the loop ignoring the persona floor wholesale — direct commits + pushes to `main`, force-push, `git add -A`, no local build, profile-run-as-`yolo` — and shipped broken code + an unrecoverable data deletion. **Honesty:** this is a SYMPTOM report by the failing model, possibly self-serving; the *second* report classified `[mechanical]` vs `[persona]` accurately (the first did not). The enforcer's active state in the downstream repo is UNCONFIRMED.

**Mapped findings** (verified against `src/adapter/deny-rules.json` + `engine.mjs` this session):

- **F1 — trunk-push escapes the merge-gate on OpenCode.** `git push origin main` (explicit trunk ref) → `pushHasUnparsedExplicitRef` true → `resolveMergeTopic` returns null → `mergeWithUnstampedReview` ALLOWS → routed to the ask-class `merge-topic-unresolvable` rule → OpenCode has no ask-return → fallback to persona → **silent pass**. Inconsistency: a *bare* `git push` from `main` resolves topic `main` via HEAD, finds no `main_review.md`, and IS denied — so the hole is form-specific (`git push origin main`) and platform-specific (OpenCode). Owning: `engine.mjs` (`pushHasUnparsedExplicitRef`/`resolveMergeTopic`), `deny-rules.json` `merge-topic-unresolvable`. Fix (direction A): on guarantee profiles an explicit trunk push with no satisfied stamp should **DENY, not ask** — `ask` degraded to persona on OpenCode makes the trunk case worthless.
- **F2 — the entire ask-class degrades to persona on OpenCode** (force-push, ssh-mutating-action, commit-no-verify, merge-topic-unresolvable). Documented per-rule in `fallback`, but the AGGREGATE risk is uncaptured: a non-compliant model on OpenCode `lite` has almost no mechanical backstop. The intended substitute is the once-per-project forge branch-protection + required-CI offer (`orchestrator.md` `## Your seat`) — symptom suggests it was never set up. Fix (direction B): make that offer mandatory/loud on OpenCode and name it explicitly as the ask-class substitute.
- **F3 — no local mechanical quality gate.** "Run build-beat tools before handing back" is `[persona]` (Builder contract). Candidate (cross-platform, mechanical): an installed **pre-push git hook running `node .ai-dev/quality/run.mjs build`**, blocking push on red — catches the "shipped compile errors" class regardless of model discipline.
- **F4 — direct `git commit` to `main` and `git add -A` are never mechanical** on any platform (persona Git-flow / stage-named-paths). Candidates: cheap engine bash-predicate denies (commit/push-on-main without stamp; `git add -A|.` in root).
- **F5 — the audit cadence (the lite/yolo compensating control) is itself persona** — a runaway high-throughput session skips the every-N-features offer entirely.
- **Meta-fork (settled BOTH):** the honesty map is correct that persona = prose-held, but the design presumes a *cooperative* orchestrator model. Under a non-compliant model the OpenCode mechanical floor is too thin; the answer is to stop depending on model cooperation (A) AND require an external mechanical substitute where the platform cannot realise a class (B).

**Dedup:** distinct from "Merge-gate deny over-matches `merge`" (that one *over*-blocks read-only `git merge-base`; this is *under*-enforcement). Overlaps "layout-coupled silent fail-open" IF the plugin was not active downstream (diagnostic pending). Related to the vendor-watch standing item (OpenCode ask-class / `task` limits).

**Diagnostic DONE → root cause found + FIXED (5.17.4).** The downstream-repo probe came back: a write into `.ai-dev/tooling/` was NOT blocked, and `node -e import()` of the deployed plugin threw `Cannot find module '<parent-of-root>/.ai-dev/tooling/...'`. World (a): the plugin was **installed but never loaded** → the ENTIRE `[mechanical]` deny layer was silently absent for the whole session. Root cause: `install-plugin.mjs` `resolveRewrite` left the downstream import path un-rewritten, keeping the source's 3-deep `../../../.ai-dev/tooling/...`; the deployed plugin is 2-deep (`.opencode/plugins/`), so it overshot the root by one and threw on load. Fixed in **5.17.4** (downstream branch now drops one `../`; `install-plugin.test.mjs` gains a real-load guard). **This is the proximate cause of the noos "ignores ALL rules" — not a thin floor and not a non-compliant model alone, but NO floor at all.** Same class as "layout-coupled silent fail-open" below — it bit again because the downstream path was never exercised by importing the generated plugin. **F1–F5 below still stand as a separate epic** (they are real design holes), but they are now LOWER urgency than this defect was: even a perfect model on a dead plugin had zero mechanical protection — which is exactly why direction B (external branch-protection that holds regardless of the plugin) matters.

## Opt-in real-opencode E2E — assert the plugin actually LOADS and fires under a live binary — 2026-06-19 (D7, opencode-plugin-registration)

**Class:** the recurring fail-open "our test proved the module IMPORTS, but the platform never LOADED it" (the 5.17.4 dead-plugin defect and this 5.17.x registration defect are both instances). The unit/install suite now proves the installer *registers* the plugin in `opencode.json` `plugin` with the correct `.opencode/`-relative path (`./plugins/ai-dev.mjs`), de-duped/never-clobbered — but that the running OpenCode binary actually *loads and fires* it is verifiable only against a live `opencode` process.

**Want:** an opt-in E2E that boots a real `opencode` session in a temp target, attempts a write the boundary should deny (e.g. into `.ai-dev/tooling/`), and asserts it is blocked with a `[ai-dev] …` message. **Gated on the `opencode` binary being present** — it is NOT a dev dependency and must NOT enter the CI/build suite (Operator decision 2026-06-19, Option A): skip cleanly where the binary is absent.

**Caveat — version-brittle:** this very class is a version drift (1.17.8 dropped project-folder plugin auto-discovery), so the E2E is tied to whatever `opencode` version is installed; a green run proves the load path for THAT version only. Pin/record the version it ran against. Until built, the gap is covered by the **audit-cadence plugin-load probe** (`src/agents/orchestrator.md` `## Audit` step 2, verification-coverage dimension) — the manual real-layer exercise that catches a future platform drift in the load mechanism.

## RESOLVED (5.19.0, #62) — Installer self-verify of the Claude hook wiring — Fork B follow-up — 2026-06-19

**Resolved:** after wiring the Claude hook, the installer verifies `.claude/settings.json` parses + carries the PreToolUse entry → `claude/shim.mjs` AND the shim loads, failing the install loudly otherwise (the twin of the 5.17.6 OpenCode plugin self-verify). Honest boundary: proves LOAD, not that the harness FIRES it. Original below.

The OpenCode plugin install now import-verifies the deployed plugin actually loads and fails the install loudly if it does not (the install-self-verify change, shipping the D7 class-prevention for the recurring OpenCode silent fail-open). The symmetric Claude-side check was consciously **descoped** (Operator decision, Fork B = OpenCode-only): the installer should likewise self-verify the **Claude hook wiring** — that `claude/shim.mjs` loads and the merged `.claude/settings.json` is well-formed — so a broken Claude deny path fails the install rather than going silently off at the first tool call. Distinct failure mode from the plugin (the shim is harness-invoked per tool call, not `import()`ed at install), so it needs its own check shape. Scope as a separate fixup-grade follow-up.

## RESOLVED — Reviewer floor does not gate test coverage of NEW code branches — 2026-06-16 (downstream intake)

**Resolved (Operator delegated the fork; middle option chosen).** The Reviewer's **Tests** checklist item (`src/agents/reviewer.md`) now flags a new code path that ships with no test exercising it: it **blocks** when that path is security- or contract-bearing (deferring to the existing Security / Contracts gates), otherwise it is a named **advisory** finding (recorded, not blocking — the audit cadence backstops what advisory passes let through). The Builder gains a proactive **New-path coverage** line (`src/agents/builder.md`) so the test is written up front where there is no firefight pressure. Rationale (felt-vs-unfelt): under pressure the Builder feels the deadline, not the coverage gap, so the independent Reviewer is the load-bearing organ; blocking is tied to the already-block-worthy classes so no new absolute gate re-litigates the firefight lane. Original analysis kept below as the record of *why*.

**Protocol-level signal** (mapped from a downstream retrospective; the downstream's own findings are its backlog, not ours). The Builder contract guarantees the `build`-beat quality tools are green and **existing tests are never weakened** — but nowhere does the floor require that a *newly added code branch* carry an isolated test, and the Reviewer checklist does not explicitly flag new, untested branches. Result: new logic can ship with the suite green (it only exercises pre-existing paths). In a rapid firefight (batch fixes → one cumulative Reviewer) this debt accumulates faster, surfacing only at the audit cadence — i.e. the **compensating control works, but with a lag**. Three separate downstream findings collapsed to this one class.

**Honesty note:** this is a downstream SYMPTOM report, not a confirmed protocol defect — the downstream's own choices may explain part of it. What is genuinely ours: the floor's coverage gate is "tests green + existing not weakened", which is silent on new-branch coverage.

**Design fork (settle when picked up):** (a) tighten the per-feature Reviewer — a new code branch with no isolated test is a named finding (raises per-feature rigor, costs Reviewer time); vs (b) keep the audit cadence as the safety net (current posture — proven to work, but lagged). Not a blind pick: (a) partially re-litigates the firefight lane's speed/coverage trade-off. Possible middle: the firefight announce already flags batching — the Reviewer over the cumulative diff could be asked specifically to enumerate new-branch coverage gaps as advisory, non-blocking on `solo`. Dedup: partially overlaps the META deficit row "Forgot half the scenarios → scenario↔path coverage", but that is about scenarios, not new-branch unit coverage — distinct.

## Audit-lens candidate — two safeguards evolving independently, no test exercises them together — 2026-06-16 (downstream intake)

**Class** (mapped from a downstream bug, abstracted — no downstream specifics). Two defensive mechanisms are added in separate changes, each correct in isolation and each tested in isolation; neither's test exercises the OTHER's effect on shared state, and one silently undoes or mis-handles what the other already did. A per-diff Reviewer sees each safeguard as locally sound; the interaction failure is invisible without a test that drives BOTH together. Sibling of the existing *Producer/consumer format coupling* entry below, but a distinct angle: that one is consumer-vs-producer cosmetic coupling; this is safeguard-vs-safeguard state coupling. **Audit-sweep candidate:** when two independent guards touch the same shared structure (history, a buffer, a queue), require a test that runs them in sequence — the second guard fed the first guard's output. Add to the auditor's whole-tree code-quality dimension.

## Multi-repo epic follow-ups — deferred from the shipped epic — 2026-06-16

The multi-repo-components epic shipped (boundary mechanism 5.15.0 + coordination workflow 5.16.0; research `docs/decisions/multi-repo-components.md`). Two items were consciously kept OUT and are their own future features:

1. **Firmware flash-and-probe verification rung.** The real-layer verification offer (`src/agents/orchestrator.md` `## Your seat`) is described only generically (CLI / IPC / socket / API). An embedded firmware component needs a concrete "flash the artifact to the device and probe it" rung — with its blast-radius safety (a device that can be bricked). Needed in ANY layout, not just multi-component. Likely overlaps prior on-hardware-preflight thinking.

2. **Seam-contract transport (epic decision D6).** A cross-component feature changes the contract at the seam (a UI↔service API; a service↔firmware wire protocol). The manifest can *name* a seam contract, but how a CONSUMING repo references a contract OWNED by the producing repo — without reading the producer's tree (project-boundary deny) and without copying it into every repo (invariant-6 violation) — is unsolved. Options sketched in the research: snapshot/copy vs URL vs hub-owned. Its own feature; scope with `research` first.

## Process lessons — git/stamp friction caught live — 2026-06-16

Two mechanical foot-guns hit during the multi-repo ship; both cost a push round, neither leaked:

1. **Stamp filename must track the branch topic.** The merge-gate derives the topic from the branch name and looks for `.ai-dev/reviews/<branch-topic>_review.md`. A branch whose topic differs from the plan/epic name (e.g. an epic plan `multi-repo-components` shipped on a branch `feature/multi-repo-coordination`) gets a stamp at the wrong path and the gate blocks the push. **Fix direction:** the orchestrator derives the stamp filename from the branch topic (one source), or the merge-gate also accepts a stamp matching the active plan topic; document the "branch topic == stamp/plan topic" rule in `## Your seat`.

2. **Never combine the version-bump `git commit` and `git push` in one shell block.** The merge-gate hook inspects the whole block; a block containing `git push` is denied wholesale, so a `git commit` earlier in the same block never runs. A version bump committed this way silently does not land, and a later bare push ships the prior commit at the stale version (this happened — corrected by a follow-up release-marker PR). **Fix direction:** an orchestrator operating note in `## Your seat` — bump+commit and push are always separate tool calls. Low severity (caught mechanically), but it cost a corrective PR.

## RESOLVED (5.16.0) — Multi-component / multi-repo project — the single-root assumption — 2026-06-16 (Operator)

**Resolved by the multi-repo-components epic** (Option B): boundary mechanism shipped 5.15.0 (`.ai-dev/components.json` + fail-closed validator widening invariant 2 to a declared component set), coordination workflow 5.16.0 (one plan / one Reviewer over the unified diff, per-repo git). Decision record: `docs/decisions/multi-repo-components.md`. The monorepo-vs-multi-repo fork was settled (multi-repo, declared-set boundary); the design forks D1–D7 below were all answered during the epic. Two items remain OPEN as their own features — see *Multi-repo epic follow-ups* above (firmware flash-and-probe rung; seam-contract transport D6). The pre-epic analysis is kept below as the historical record of *why*; it is no longer an open gap.

**Original gap (Operator-raised):** the protocol assumes ONE project root. A project that is several parts — front + back in different languages, or an app + embedded firmware — is served unevenly:

- **Polyglot inside one repo** — already works: the quality registry (`tools.json`) is language-agnostic, one row per tool, so a TS-frontend + Go-backend monorepo registers a linter/typechecker/test per language and the `build`/`review` beats run them all. No core gap here; `kind` (`code`/`docs`/`mixed`) is the machine-vs-human axis, NOT a component/language axis — it does not model "frontend" vs "backend" as entities.
- **Embedded firmware in one repo** — partial: the toolchain registers like any stack, but real-layer verification (orchestrator `## Your seat`, the offered real-integration-layer run) is described only generically (CLI / IPC / socket / API); "flash the `.bin` to the device and check" has no first-class shape — it runs as a generic offer with no embedded-specific knowledge.
- **Separate repos** (front-repo + back-repo + firmware-repo as siblings) — **blocked by design**: invariant 2 (`Stay inside the project`, `[mechanical]`) denies parent dirs and sibling repos. Each repo is its own root, own `.ai-dev/`, own session — there is **no cross-repo orchestration**: a feature spanning front+back is two independent loops, two PRs, and the cross-component coherence is the Operator's to hold, not the protocol's. `parallel-work.md` (worktree-per-feature) is intra-root parallelism, NOT multi-repo.

**Class:** a structural assumption (single root) that the deny layer mechanically enforces (invariant 2) — so multi-repo is not a missing feature to bolt on, it is a boundary the core deliberately holds. Loosening it touches the security floor; any design must keep "an agent cannot wander into an arbitrary sibling repo" while permitting a declared, bounded set of sibling components.

**Open design forks (scope via `research` before any plan):**
- Is the served unit a monorepo (recommend it, document the polyglot quality-registry pattern, add an embedded verification rung) — or genuinely multiple repos?
- For multiple repos: a declared component manifest (`.ai-dev/components.json`?) listing sibling roots, with the project-boundary deny widened from "the root" to "the declared component set" — vs. keeping each repo independent and adding only a cross-repo state/PR linkage at the Operator layer.
- Per-component config/quality/kind, or one shared config governing all components?
- Cross-component feature: one plan + one Reviewer over a multi-repo diff, or N coordinated loops with a join at ship?
- Embedded as a first-class `kind`/verification rung (flash-and-probe) regardless of the repo-layout decision.

**First step:** `research` to map how comparable tools (Nx/Turborepo for polyglot monorepos, multi-repo orchestration patterns) draw this line, then bring the Operator a recommendation on the monorepo-vs-multi-repo fork before designing the boundary change. Do NOT loosen invariant 2 ad hoc.

## RESOLVED (5.18.0, #61) — Merge-gate deny over-matches the substring "merge" — blocks read-only git — 2026-06-16 (live false-positive)

**Resolved:** the merge match now requires the standalone verb (`git\s+merge(?![-\w])`); `git merge-base`/`merge-tree`/`merge-file`/`mergetool` ALLOW, real `git merge <topic>` / `gh pr merge` still DENY (`merge-gate.test.mjs` block 9). Original analysis kept below.


**Symptom (this session):** the merge-gate deny blocked `git merge-base --is-ancestor <branch> main` — a **read-only** command run to check whether a stale local branch was contained in main. The deny predicate is `/git\s+(merge|push)\b/` (`src/adapter/engine.mjs`); because `\b` treats the hyphen as a word boundary, `git merge` followed by `-base`/`-tree` matches — so the predicate catches not only a real `git merge <topic>` but also the read-only/plumbing `git merge-base` and `git merge-tree`. (It does NOT match `git branch --merged` or `git log main..x` — `git` must sit immediately before `merge`; those run fine.) None of the `git merge-*` plumbing family is the gated action (a real `git merge` / `gh pr merge` / push of a feature branch).

**Class:** an enforcement pattern tuned for recall (never miss a real merge) that over-matches an adjacent command family, blocking legitimate read-only work. Honesty-relevant: this is a `[mechanical]` deny doing MORE than its stated intent ("block a git merge/push without a satisfied stamp"), the inverse of an over-claim — it is over-*enforcing*.

**Fix direction (one home — `src/adapter/deny-rules.json` merge-gate rule + the predicate in `src/adapter/engine.mjs`):** require `merge` to be the standalone verb, not the prefix of a `merge-*` plumbing command — e.g. `git\s+merge(?![-\w])` (or an explicit `-base`/`-tree` exclusion). Add test cases asserting `git merge-base` / `git merge-tree` ⇒ ALLOW, alongside the existing `git merge <topic>` ⇒ DENY case. Verify the merge-topic-unresolvable ask-rule and the real merge-gate denies still fire (don't loosen the floor while tightening the match).

**Workaround until fixed:** phrase containment checks without a `git merge-*` token (`git rev-list --count main..<branch>`, which this session fell back to).

## RESOLVED (5.18.0, #61) — Adapter error handling — loadConfig + RegExp without try/catch — 2026-06-13 (audit v5.11.4, F1+F2)

**Resolved:** `loadConfig` wrapped in the Claude shim `main()` → fail-OPEN (exit 0, logged); `new RegExp` guarded by `safeTest` → no-match on `SyntaxError` (inject-only, guard comment forbids deny-class reuse). `error-handling.test.mjs`. Original below.


Two pre-existing defensive-coding gaps in the Claude adapter, low practical risk given the immutable tooling dir:

**F1** (`src/adapter/engine.mjs:511`, `src/adapter/claude/shim.mjs:114`) — `loadConfig()` calls `JSON.parse(fs.readFileSync(...))` without try/catch; a malformed `deny-rules.json` crashes the hook with a non-zero exit instead of a clean allow/deny. Fix: wrap the call site in `shim.mjs:main()` with try/catch, exit 0 with a logged error (fail-open for usability, consistent with other paths).

**F2** (`src/adapter/engine.mjs:484,492,503`) — `new RegExp(pat, "i")` where `pat` comes from `deny-rules.json` without try/catch; a bad pattern throws a `SyntaxError` that crashes the predicate. Trusted internal data, no external injection risk. Fix: try/catch around new RegExp, return `false` on error (fail-closed for inject/nudge rules).

Both fixes are one PR.

## Producer/consumer format coupling: tolerant parser + producer-shaped test — 2026-06-13 (8D reviewer-stamp-heading-level, D7)

**Class found:** a mechanical consumer parses an artifact an agent authors, and (a) pins one cosmetic form the producer may vary (heading level, surrounding whitespace, case), relying on the producer's prose discipline to match it; (b) no test feeds a *producer-shaped* artifact through the consumer — only hand-authored ideal inputs. A model authoring the artifact slips to an equivalent form (here: opening a fresh stamp file with an H1 `#` title instead of the documented `##`), the strict consumer rejects it, and the failure surfaces only on a live run. Sibling of the layout-coupling/fail-open class below — but here the gate failed CLOSED (a wasted re-review round, never a silent bypass).

**Fixed instance (5.11.3):** merge-gate regex `^##` → `^#{1,6}` (any heading level accepted — the verdict-on-the-heading-line is load-bearing, not the `#` count); `reviewer.md` documents the tolerance; `merge-gate.test.mjs` case 3f pins h1/h3/h6 ⇒ allow while the bad forms still deny.

**Rule for future + audit sweep:**
- When a mechanical consumer reads an agent-authored artifact, make the parser tolerant of cosmetically-equivalent forms rather than pinning one and trusting prose discipline.
- A test MUST feed a producer-shaped form through the consumer, not only a hand-authored ideal. Sweep every machine-parsed agent artifact: the review-stamp heading (this), config-key reads, plan/state markers.

## Layout-coupled tooling: test the INSTALLED layout, not just the source — 2026-06-13 (8D quality-gate-silent-bypass, D7)

**Class found (audit lens):** tooling whose default path assumes the source repo's layout, exercised (dogfood + self-test) ONLY against that layout, fails open on every other layout — invisibly. The quality runner defaulted its registry to `src/quality/tools.json`; the installer co-locates runner+registry in `.ai-dev/quality/`; downstream the path missed, the runner exited 0 (green) having run zero checks. Dogfood masked it (this repo holds tools.json in BOTH places) and the self-test reproduced the source layout (synthetic registry under `src/quality/`).

**Fixed instance (5.11.1):** runner resolves its registry beside itself (works in both layouts); `install.test.mjs` now spawns the laid-down runner against the temp target (no `src/quality/`) and asserts it LOCATES the registry.

**Rule for future tooling + audit sweep:**
- A tool with a default path must be tested against the INSTALLED layout, not only the source layout — install into a temp target and run it there.
- A fail-open default (exit 0 when an input is missing) needs an explicit "input located" assertion, or the failure is silent. Sweep `.ai-dev/quality/run.mjs`-class tools and any future runner for this pattern.


## "At the END" sweep — mandatory-final-step pattern — 2026-06-13 (8D D7, discovery-conclude)

**Class found:** a procedure step described as "at the end" / "at the close" / "finally" without a structural anchor (template field, named turn, Reviewer check) is invisible to enforcement — the model follows gather momentum and skips it.

**Fixed instance:** product discovery conclude phase (5.11.0) — named turn + template fields + Reviewer check.

**Sweep candidates** (other procedures with the same pattern risk):
- `## Doc bootstrap` step 4 cross-check — contradictions surfaced "where a product brief exists"; no Reviewer check that this cross-check actually happened.
- `## 8D` D8 close — "land every measure in its durable home"; no template, relies entirely on D8 prose.
- Any future procedure: before writing "at the end, do X" — ask whether X has a structural trigger, or add one.
- Generalised by the *fire-time anchor* class below (8D platform-switch-orphaned-offer) — same root, the cross-chapter-trigger variant.

## Fire-time anchor — a trigger must live on the path walked WHEN it fires — 2026-06-13 (8D platform-switch-orphaned-offer, D7)

**Class found:** a `[persona]` trigger/offer documented only inside its own side-tool chapter — which the role reads on a *different* occasion than when the trigger must fire — is invisible. The role walks the fire-time path (a loop beat) and finds no pointer; it would have to spontaneously recall a line from an unrelated chapter. No deny, no inject, no enumeration entry ⇒ never fires.

**Fixed instance (this version):** the platform-switch offer named "on the understand beat" inside `## Setup`, but `PROTOCOL.md` beat 1's own enumeration of lazy offers (no-brief→discovery, UPGRADING→upgrade, …) did not list it. An OpenCode session on a `claude`-pinned project never offered the switch. Fix: add the platform-mismatch case to the beat-1 enumeration, pointing to the `## Setup` procedure (one home preserved).

**Meta-class (folds the two prior D7s into one):** *"At the END" mandatory-final-step* (discovery-conclude) and *implicit counter dependencies* (missed-audit-offer) are the same root — a step/trigger/counter not anchored on the path the role actually traverses at fire time. Unifying rule: **before writing "do X on the Y beat / at the end / every N" — anchor it in the enumeration the role walks AT THAT MOMENT (the beat's own list, a template field, a named turn, a Reviewer check), never only in the feature's own chapter.**

**Audit sweep:** scan every "fires on the X beat" / "offer on X" trigger across the orchestrator's side-tools and confirm the corresponding beat (`PROTOCOL.md` `## The loop`) enumerates it. A trigger named in only one direction is a finding.

## RESOLVED (5.13.0) — Installer churns tracked files in source/dogfood mode — 2026-06-15

**Was:** running `node src/adapter/install.mjs .` on the protocol's OWN repo silently rewrote three tracked surfaces to the downstream (vendored) layout — Claude hook → `.ai-dev/tooling/src/adapter/claude/shim.mjs`, `CLAUDE.md` imports → `@.ai-dev/...`, `opencode.json` `instructions` → `.ai-dev/PROTOCOL.md` — and stamped `.ai-dev/VERSION` + a spurious `UPGRADING.md`, forcing a hand-revert and risking a committed broken-enforcement state (a stale vendored shim drifting from `src/`).

**Resolved by the `--dogfood` self-host flag** (`src/adapter/install.mjs`; usage: `src/adapter/INSTALL.md` `### Dogfood / source mode`). It wires the tracked surfaces to `src/`, skips vendoring + the version stamp/marker, and writes no inactive breadcrumb — so a reinstall converges to the committed bytes (`git status --porcelain` empty, asserted on both platforms in `install.test.mjs`). Fail-closed and symmetric: `--dogfood` on a non-source target throws, and its absence on the source repo throws (the footgun made loud).

**Cross-ref:** this is the targeted fix that stops the bleeding; the larger convergence of downstream and self-host layouts is the still-open *Gitignore tooling* item below (one would obviate the other by making the two layouts the same).

## Gitignore tooling — zero protocol noise in downstream repos — 2026-06-13 (Operator)

The downstream project currently commits the full `.ai-dev/tooling/` tree (~all protocol source). Operator wants to gitignore it while keeping enforcement.

**Key insight:** tooling serves two purposes — (1) runtime: hook enforcement (shim + engine + deny-rules) + agent context (PROTOCOL.md + assembled role bodies); (2) re-install source (used only when `npx` upgrades). Only (1) needs to stay on disk permanently.

**Three variants (ascending ambition):**

1. **Assemble Claude orchestrator + gitignore tooling** — OpenCode already assembles the orchestrator into `.opencode/agents/ai-dev.md`; do the same for Claude (`.claude/agents/ai-dev.md`), switch CLAUDE.md to import from it. Committed = assembled agents + 3 enforcement files (shim/engine/deny-rules) + quality runner + PROTOCOL.md. Tooling gitignored; `npx` re-vendors on upgrade.

2. **Self-contained shim** — bundle shim + engine + deny-rules into one file with no external imports. Committed = that one file + assembled agents + PROTOCOL.md. Zero tooling.

3. **npx-at-hook-time** — settings.json hook calls `npx ai-dev-protocol@<version> --shim` instead of `node .ai-dev/tooling/...`. Zero code committed. Requires npm publish + network on every tool call.

**Tradeoff for all three:** `git clone` on a new machine = no enforcement until `npx ai-dev-protocol@latest .` runs. Must be documented (README + `git clone` note).

**Recommended first step:** `research` — scope variant 1 precisely (what files are actually needed at runtime vs install-time; confirm Claude agents/ can load an assembled orchestrator the same way OpenCode does). Prerequisite: npm publish is still deferred.

## Audit 4.19.0 Low-2 — orchestrator length watch — 2026-06-12

`orchestrator.md` sits at the upper edge of "readable in one sitting". The rule for the NEXT side-tool addition: trim or fold, never append past the edge. (Low-1, the `Validation` stamp label, resolved in 4.19.2 — dropped, no live consumer.)

**Token-economy remedy candidate (2026-06-12):** ~11 side-tool "one pass" bodies load every turn though a typical turn uses none (~7.9k tok always-on; floor would be ~3.5k). Precedent: the elicitation catalog already lives in its own file, read at fire time. Candidate refactor: keep the trigger lines ("when it fires") in orchestrator.md, move the procedure bodies to per-tool files read on fire. Measure first — prompt caching absorbs most of the static reload (~10% cost on a warm cache), so the realized saving may be modest; do not refactor on raw size alone.

## [who] axis / operator-scenario presets — retracted from README, parked as a hypothesis epic — 2026-06-12 (Operator decision)

**Decision (Operator, 2026-06-12):** the `[who] × [speed↔quality]` matrix was retracted from `README.md` (4.10.3) — the `[who]` axis had zero implementation and its tech-lead cell ("you see the diff") contradicted `PROTOCOL.md` "Never show code". The honest surface today is the one-axis `profile` dial.

**If/when the non-technical-PM bet is taken** (it is a recorded hypothesis in `docs/product.md` §1, not a served segment), the axis is its own coherent epic, not scattered fixes: a `scenario` (or `operator`) key in `ai-dev.config.json` with 2–3 presets (e.g. `pm` / `tech-lead`) parameterizing diff visibility, question depth, and the auto-decide ceiling; amending "Never show code" into a scenario-conditioned rule; and a friendlier on-ramp. (The lighter-profile compensator — the Reviewer's review-time product-fit check — is a floor checklist item since 4.11.0; the epic may deepen it.)

## Vendor-watch standing item — platform absorption — 2026-06-12 (from product analysis, finding 4)

Claude Code natively ships agent teams, review subagents, deny hooks; vendors absorb orchestration primitives over time (precedent: Agent-OS retired its phases). At each release-audit, check what the platforms absorbed and re-aim: the durable parts are cross-platform parity, the honesty map, and product discovery — never re-wrap a primitive the vendor ships. Related research idea: whether the loop itself could ride Claude Code's dynamic-Workflow primitive (deterministic fan-out) without losing the PM-in-the-loop forks — `research` first, it may be the absorption case in point.

## `audit` — extra dimension candidates — 2026-06-11 (post-restructure queue; trigger shipped 4.12.0)

The proactive trigger is in (orchestrator `## Audit`: offer after ~5 shipped features, state records the last run — 4.12.0). What remains of this item: dimension candidates to fold into auditor sweeps as the need shows (salvaged from prior epics):

- **Single-source drift** — an enum/taxonomy/rule restated outside its one home and drifted (the per-diff Reviewer is blind to cross-file copies that pre-date the diff).
- **Temporal-status conflation** — "planned / interim / temporary" in one doc vs "done / current" in another.
- **Whole-tree code-quality sweep** — legacy or never-diff-reviewed code; cross-cutting patterns invisible per-diff (architectural and functional/integration review types).
- **Instruction-file overreach** — decision/security content sitting in a harness instruction file (CLAUDE.md-class) whose own pointer says it is owned by `docs/` canon; remediation is move-not-copy.
- **Asymmetric failure-naming** (8D ceremony-drift, D7) — a dial/gate whose failure modes are named on ONE side only breeds drift to the unnamed side: sweep for it (doc-quality names bloat but not brevity-to-uselessness; audit cadence names under- but not over-auditing; the profile dial named under-rigor but not over-ceremony until 4.20.0). Each found asymmetry is a candidate fix.
- **Single-source drift includes `.ai-dev/state/current.md`** (8D pointer-lied, D7) — the resume pointer is durable canon, not exempt from invariant 6; the audit's single-source-drift dimension scans it for restated facts (version, shipped-set, PR state) that belong to the tag / CHANGELOG / forge.
- **Implicit counter dependencies** (8D missed-audit-offer, D7) — any cadence/counter rule must name WHERE its counter lives and WHICH mandatory step reads it; sweep rules for counters with no enforced home or reading step (the audit-cadence counter died exactly this way at a state rewrite).

## Fixup-grade spawns with floor-only role bodies — token economy — 2026-06-12

Assembled agents carry every enabled module on every spawn (~3.8k tok of modules over a ~1–2k floor, per seat); a fixup-grade change (typo, one-line fix) pays the full module stack twice (Builder + Reviewer). The fixup Reviewer pass is already "shortened, never skipped" — a floor-only body is a defensible realisation of "shortened". Design questions: where the lane decides body composition (spawn-time flag vs a second assembled variant per role); fail-safe direction (a misclassified non-trivial change spawned floor-only loses module rigor — the "when in doubt, not a fixup" rule is the guard, name it explicitly). Both platforms: Claude resolves at spawn, OpenCode bakes at assembly — a second variant means two assembled files per role there.

## Parallel feature work — Operator request 2026-06-12

Today the loop is strictly serial: one session drives one feature, one branch per PR, the state pointer names ONE active plan. Features with disjoint surfaces could run in parallel — the platform offers concurrent sub-agents and git worktrees. Design questions: per-feature state (the pointer is singular); branch isolation (PROTOCOL `## Git flow`: conflicts ⇒ stale branch, cut fresh — parallel branches invite exactly that); the stamp/merge-gate is already per-topic (holds as-is); Operator bandwidth (plans and merges still serialize through one human — the honest bottleneck). Cheap 80% already allowed: several features batched on one branch serially. The real epic: worktree-per-feature with interleaved Builder spawns. Scope honestly before building. Field notes from the first stacked-PR conveyor (8D, 2026-06-12): a dependent PR auto-closes when its base branch is deleted by a merge — retarget the next PR to main BEFORE merging the current one; a remote squash-merge is asynchronous — verify the content landed before rebasing onto it; the per-topic stamp/merge-gate held throughout (two honest denials).

## npm registry publish — external half of npx distribution — 2026-06-12

The packaging shipped 4.17.0 (`npx github:wirenboard/ai-pm-protocol <target>` — repo renamed at 5.0.0, old `-uni` slug redirects). What remains is external: the Operator's npm account, name-availability check (scoped fallback), `npm publish`, optionally publish-on-tag CI (NPM_TOKEN secret riding the existing auto-tag workflow). Then the README lead becomes `npx ai-dev-protocol@latest`.

## ad-md-editor rollout — first real downstream — 2026-06-11

The Operator asked to roll the protocol into ad-md-editor; this repo's session cannot (the project-boundary deny blocks cross-repo writes, correctly). Run `node src/adapter/install.mjs` against it from its own checkout/session. First real downstream = the strongest install + upgrade test we lack (N=1 → N=2; `docs/product.md` success criterion).

## META: "deficit → prosthesis" as a protocol-design method — 2026-06-06 (Operator-originated)

A generator for features and an audit lens, not a feature. Take a structural LLM weakness, build an EXTERNAL organ that compensates (the address-book pattern: externalize, don't improve). Key asymmetry: **felt vs unfelt deficits** — an unfelt deficit (a hallucinated call-graph edge feels exactly as confident as a real one) cannot rely on an opt-in prosthesis the agent invokes when it notices weakness; unfelt → always-on organ, felt → on-demand acceptable.

Seed catalog (deficit → prosthesis → coverage):

| Deficit | Felt? | Prosthesis | Coverage today |
| --- | --- | --- | --- |
| Hallucinated call-graph edges | no | LSP / tree-sitter graph as ground-truth input | contracts (partial); no tool |
| Single-path sim, misses interleavings | no | property test / harness instead of mental run | concurrency module checklist (4.16.0); harness tool still open |
| Quantity blindness (loop ×10000) | no | execute on representative inputs | performance module checklist (4.16.0); real-run still optional |
| Long-context degradation | partial | durable state + checkpoint-reset | state exists; reset discipline missing |
| Forgot half the scenarios | yes | scenario↔path coverage checklist | Builder plan checklist |
| Overconfidence in own output | no | independent reviewer, cross-model | covered (Reviewer, `auto` model) |

Two artifact tracks: (1) a living deficit catalog (each: prosthesis, felt/unfelt, always-on-or-on-demand) as feature-generator + audit lens; (2) wiring real external tools as INPUT (language server, property tester), not "reason more carefully". Open question: populating the unfelt rows — post-mortems on shipped bugs (the delayed felt signal), differential runs (two models disagree → latent deficit surfaced), injected ground-truth probes.

### Track: grounded code-graph utility + contract anchors

The flagship unfelt-deficit prosthesis. Decided design (Operator, 2026-06-06): a **standalone CLI** (not an MCP server; wrappable later), tiered backend (tree-sitter/ctags → LSP → data-flow tools) emitting ONE normalized graph; **surface uncertainty, don't hide it** — unresolved/dynamic edges marked explicitly (converts the unfelt deficit into a felt one). Contract mapping splits: structural conformance deterministic and cheap (surface drift, forbidden edge, reachability — adapt the existing fitness-function tool class), semantic conformance stays AI-judgment + tests. Prerequisite: contracts carry a machine-resolvable anchor (`path::symbol`), a contract-format change that is its own small feature. Minimal first step: tree-sitter wrapper + surface-drift detector against anchors.

## Per-seat default model matrix — 2026-06-06 (salvaged residual)

The config supports per-seat models; the open part is a recommended DEFAULT matrix (spend thinking where errors propagate furthest). Operator caveat from a failed prior attempt: revisit deliberately; no weak models on generative seats.

**OpenCode caveat (2026-06-15):** on OpenCode a per-seat model pin is **blocked at source** — the `task` runtime ignores subagent `model:` (RESOLVED entry below; research `docs/decisions/opencode-task-capabilities.md` Q1). A matrix's OpenCode column is inert until upstream fixes the cluster or a verified prosthesis exists. Claude is unaffected.

**Multimodality note (resolved 2026-06-13):** originally suggested recommending vision for GUI projects in setup. Dropped — the verification ladder (5.9.6) already handles this: functional checks belong to rung 2 (UI driver), visual residuals to rung 3 (named human scenario). Vision would be an optimisation of rung 3, not a gap.

## Platform built-ins survey — safe orchestrator offload — 2026-06-08/09

Survey both platforms' built-in tools/agents and map which are safe for the orchestrator's AD-HOC use (offload instead of inline work): read-only and no role-overlap ⇒ allow (e.g. a read-only explorer for parallel analysis); write-capable generic or role-overlap ⇒ stays denied (`general`/`build`/`plan` — the role-substitution deny). Open question: does a write-capable ad-hoc generic ever have a legitimate seat, and can the deny distinguish intent? Outcome: a documented routing note (which built-ins the orchestrator may use for what) + possibly widened safe offload.

## OpenCode background/parallel spawn — research requested 2026-06-13 (Operator)

The parallel-work value on OpenCode hinges on whether `task` spawns can run concurrently/in background (the tool-map records no background primitive — but that's our record, not a verified absence; the Operator suspects the docs may show one). Research the current OpenCode docs/SDK: concurrent task calls, background sessions, async child-session prompting. Outcome updates `tool-map.json` (+ the parallel-work decision doc's honest-bottleneck note) either way. Sibling of the continue-subagent entry below AND the `task`-ignores-`model:` finding above — one research pass covers all three (concurrency, resume, per-spawn model).

## OpenCode continue-subagent prosthesis — researched 2026-06-12, parked (Operator decision)

Research verdict on `continue-a-sub-agent: null` for OpenCode: the built-in `task` tool has no resume/session-id parameter (docs confirm — each call is a fresh child session), so the tool-map `null` + fresh-spawn fallback stays honest. BUT a prosthesis is feasible: the SDK exposes `client.session.prompt({id})`, plugins get `client` in context and can register custom tools — our adapter plugin could add `continue_subagent(session_id, message)`. Open questions: how the orchestrator learns the child session id from the `task` result; the deny rule "Builder only, never the Reviewer" (the plugin already resolves the actor). Parked because the vendor is moving in this zone — human prompting of child sessions broke on Desktop/Web in 1.4.0 (issue anomalyco/opencode#22830, open) and may return as a native primitive that obsoletes the prosthesis. Re-assess at the next release-audit (vendor-watch). Sources: opencode.ai/docs/agents, /docs/plugins, /docs/custom-tools, issue #22830.

## OpenCode `task` spawn ignores the agent `model:` frontmatter — cross-model reviewer unrealised — RESOLVED 2026-06-15

**Resolution (shipped):** confirmed a genuine OpenCode platform limitation (research: `docs/decisions/opencode-task-capabilities.md` Q1 — open upstream bugs #21632 / #17870 / #18615, fix PR #14961 closed unmerged, no fix through 1.17.7). The adapter now treats an OpenCode concrete pin like `auto`/`session`: `resolveModelPin` returns `null`, no `model:` line is baked, the reviewer honestly runs on the session model — the false silent claim of cross-model independence is gone. The WHY is documented in three durable homes: `src/agents/orchestrator.md` `## Your seat` honesty note (widened) + `## Setup` step-2 model question, and `src/adapter/tool-map.json` `models.opencode._note`. A recorded pin stays in config to auto-heal if upstream fixes the cluster. Re-check at each release-audit (vendor-watch on #21632 / #17870 / #6651). The (impossible) automated path may be replaced by a *manual* UI-model-switch prosthesis — see the candidate entry below.

**Original downstream symptom report**

**Downstream symptom report (ad-md-editor-class OpenCode session):** a reviewer pinned to a different model (`deepseek/deepseek-v4-flash`) via config was correctly baked into `.opencode/agents/dev-reviewer.md` frontmatter by `install-agents.mjs`, but the spawned reviewer ran on the **session model**. Reported: a test reviewer spawn returned the session model; proceeded honestly with same-model reviews (the honesty rule allows it). Cost: ~5 reviewer spawns lost cross-model independence. *This is a SYMPTOM by the failing model — not a confirmed diagnosis (could be an OpenCode version/format quirk).* 

**Protocol-level finding (mapped):** if true, this falsifies the **core design assumption** documented in `src/adapter/opencode/install-agents.mjs:28-32` — "OpenCode has no per-spawn model arg for a subagent; the model is a frontmatter key, so the install step is where a cross-model reviewer is realised." The whole OpenCode realisation of a per-seat model pin would be non-functional for `task`-spawned sub-agents, and we advertise it (config + baked frontmatter) without warning the loss. Honesty class: a `[mechanical]`-looking realisation that silently doesn't deliver. Undercuts the *per-seat model matrix* and the *deepseek reviewer default* items below — both presuppose frontmatter pinning works.

**Owning files (when fixed):** `src/adapter/opencode/install-agents.mjs` (the assumption + `resolveModelPin`), `src/adapter/tool-map.json` `models.opencode`, and the honesty note in `src/agents/orchestrator.md` `## Your seat` (today it only covers "no second model exists" — not "the pin is silently ignored").

**Next step — RESEARCH FIRST, do not fix blind:** verify against current OpenCode docs/SDK whether `task` honours an agent's `model:` frontmatter, and if not, the real per-spawn model mechanism (SDK `session.prompt({model})`? a different frontmatter key? version-gated?). Fold into the standing OpenCode `task`-behaviour research below (background/parallel spawn + continue-subagent) — one pass covers all three. If confirmed: either wire the working mechanism, or make the adapter REFUSE to silently swallow a cross-model pin (fail loud at install, or honest "not realisable here" like `auto` does today).

## OpenCode manual UI-model-switch as a cross-model-reviewer prosthesis — 2026-06-15 (candidate — think through, do not build)

Subagents on OpenCode inherit the PRIMARY/session model (the root cause of the resolved `task`-ignores-`model:` finding above). That same mechanic is also a lever: if the Operator switches the active model/identity in the OpenCode UI to a non-session reviewer model *before* the reviewer spawn, the spawned reviewer would inherit THAT model — yielding genuine cross-model review through a **manual** step instead of the (impossible) automated frontmatter bake. Candidate idea: a procedure that, on an OpenCode reviewer spawn where the Operator wants cross-model independence, offers them this manual UI switch (switch model → spawn reviewer → switch back) as the realistic cross-model path while the automated one is blocked upstream. **Open questions to think through before building:** does the orchestrator's own session survive an Operator model-switch mid-turn (or does the switch reset context)? how to fit a manual human step into the spawn flow without breaking the loop's automation? is the friction worth it vs just accepting honest same-model review? where it would live (a `## Your seat` / Setup note, or a side-procedure). This may REPLACE the automated path entirely if upstream never fixes the cluster. Operator's idea, 2026-06-15. Do NOT build yet — capture and assess.

## deepseek-v4-flash as the OpenCode default cross-model reviewer — 2026-06-10 (idea)

Cross-model independence needs the Reviewer on a *different* model, not a *weaker* one. If `deepseek-v4-flash` is review-grade, it could be the OpenCode reviewer default via the adapter's model policy. Validate review quality before defaulting; opt-in until then.

**Blocked-at-source (2026-06-15):** an OpenCode reviewer pin does NOT currently run cross-model — the `task` runtime ignores subagent `model:` (RESOLVED entry above; research `docs/decisions/opencode-task-capabilities.md` Q1). A deepseek reviewer default is unrealisable on OpenCode until upstream fixes the cluster or a verified prosthesis (e.g. the manual UI-switch candidate below) lands.

## Flag-controlled mode: project-generated docs not committed to the product repo — 2026-06-05 (idea)

A mode where the protocol's generated docs stay local (agents read them) but are not committed into the product repo. Hard tension: cross-session durability of state and audit history. Needs `research` (how others separate meta from product) before any plan.

## Automation-opportunity scanner over a finished process doc — 2026-06-04 (idea, docs-kind)

A pass over a finished SOP/instruction that flags AUTOMATABLE steps, proposes how, and on approval bridges into building it. Suggestion-only, proportional (a terminal human artifact like "how to solder" is not automated).

## Accepted audit cohort notes — skip re-raising in future audits

- **Pre-stamp-gate cohort (audit 2026-06-04):** `on-hardware-blast-radius-preflight` (v2.12.0), `threat-model-ownership-and-lifecycle` (v2.13.0) — reviewed before the stamp format existed.
- **Pre-protocol-migration (audit 2026-06-03):** four plans (`template-v2`, `contract-centric-product-map`, `diagnostic-probe-mode`, `protocol-builtins-realignment`) predate the trail discipline.
- **OpenCode dogfood-spike cohort (audit 2026-06-08):** six OpenCode sub-slices built + reviewed-in-loop on the integration branch without persisted `_review.md`; accepted-with-context (functionally verified, suites green, driven live).
