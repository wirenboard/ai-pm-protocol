# Backlog

Observations and follow-ups recorded during reviews/audits. Triaged 2026-06-12 against the minimal core: entries resolved by shipped versions removed; entries referencing the retired template structure (workflow/*.md, the pm-* roster, gen/) re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals).


## Protocol-surface optimization — lever 3 deferred, lever 2 closed — 2026-06-30 (from `docs/decisions/protocol-surface-optimization.md`)

Levers 1+4 shipped (5.42.1, ~0.5k tokens off the every-session surface). Remaining:
- **Lever 3 (DEFERRED, higher risk) — `PROTOCOL.md` editorial density pass.** A lose-no-rule tightening of the 35.8k constitution (the bigger always-loaded half) could reclaim ~10–15% more, but it's higher risk (cutting nuance from the constitution) for a marginal gain over levers 1+4. Revisit ONLY if more window budget is genuinely needed; its own careful feature + full review. The autonomous descope call: not worth the constitution-risk now.
- **Lever 2 (CLOSED, no action) — phantom.** The research assumed capability modules compose reasoning fragments into the always-loaded ORCHESTRATOR; they do not (modules target `builder`/`reviewer` only; no orchestrator marker/fragment exists). The "reasoning lands in the spawned workers, not the router" end-state is already the design. No saving was ever available. Recorded so it isn't re-investigated.

## Audit dispatch — post-multi-model batch (v5.37–5.41) — 2026-06-30 (closed-out)

Whole-tree sweep, VERDICT HEALTHY. **All findings shipped:** H1 (40k orchestrator → 5.42.0 decompose + size-guard, further trimmed 5.42.1), MED-1 (dangling decision doc committed → 5.41.1), LOW-1 (stale seam-contract pruned → 5.41.1), LOW-2 (install.test.mjs split → 5.42.0), NIT-1 (size-guard → 5.42.0), NIT-2 (mirror V7 → 5.41.1). Nothing open.


## WATCH: split planning onto the orchestrator if cheap-builder plans need rework (option B) — 2026-06-30 (Operator, watch-not-build)

**Context.** The Builder both plans AND builds, on ONE model (`roles.builder.model`). Planning is high-value thinking, building is more mechanical — so a cheap builder pays for mechanical work but may under-plan. The orchestrator's plan oversight is SHALLOW (it relays the plan in plain language + the Operator approves; neither deeply vets technical plan quality). The deep plan check is the Reviewer's, but POST-build (built-diff-vs-plan) — so a weak plan surfaces late, as rework.

**Why not just split now.** A 4th Planner agent = the role-swarm the protocol deliberately collapsed (thin-core manifesto) — rejected. A per-phase model split inside the Builder (plan@strong, build@cheap, same role) is NOT cleanly possible on Claude (one baked model per agent) — it would need two baked agents = the same swarm. So the only no-swarm split is **option B: planning moves to the orchestrator** (already on the capable launch model, already in the plan loop), Builder becomes a pure cheap executor. That is a CONSTITUTIONAL change (Builder's "plans before it builds" contract in `PROTOCOL.md` `## Role contracts` + the orchestrator-routes-never-works rule), so not worth doing on spec.

**The watch.** Leave it as-is (option A). **Trigger for option B:** if plans drafted by a cheap builder seat repeatedly go to rework (the Reviewer blocks on plan-quality, or builds miss the mark because the plan was thin) — i.e. real, observed evidence, not a guess. On trigger: a decision doc for option B (orchestrator owns the plan beat; Builder contract narrows to build-only; the Reviewer independence is unchanged), then the loop. Full reasoning: this session's discussion (2026-06-30). Do NOT add a Planner role/agent.

## modelpipe: rewrite the README — outdated + awkward to use — 2026-06-30 (Operator-reported)

The standalone `modelpipe` README is out of date and inconvenient as a getting-started surface (Operator's read). Incremental edits this session bolted on `forImagesModel` + the `vision` flag sections, but the whole doc needs a rewrite: a clean quick-start, the route-config ergonomics, and how it relates to a client's setup.

**Positioning (Operator-set 2026-06-30): modelpipe is Claude-Code-FIRST, standalone, usable WITHOUT ai-dev-protocol.** The protocol is just one consumer; other Anthropic-format clients are an OPTIONAL/secondary section. So the README must carry a first-class **"Claude Code setup"** section that owns the **env-var story** — `ANTHROPIC_BASE_URL` → the proxy; the alias→model mapping `ANTHROPIC_DEFAULT_{SONNET,HAIKU,OPUS}_MODEL`; the guard via `ANTHROPIC_SMALL_FAST_MODEL`; `CLAUDE_CONFIG_DIR` for a separate profile — i.e. the full "how do I actually point Claude Code at modelpipe and map slots to my backends" recipe, which today lives only in our heads / the protocol. Other platforms get a short "any Anthropic-format client" note, not the spotlight.

**Pair with the multi-model setup UX design** (`docs/decisions/multi-model-setup-ux.md`, in flight) — once it ratifies the simple end-to-end flow, modelpipe's README should reflect the SAME flow (alias-vs-id chain, the proxy as the routing source of truth, the `MODEL_ROUTER_LOG` verification), so the transport doc and the protocol's setup tell one coherent story. The Claude-Code env-var recipe is OWNED by modelpipe's README (the protocol's setup points at it, doesn't restate). Lands in the modelpipe repo (its own loop). Do after the UX design ratifies, so the README isn't rewritten twice.

## modelpipe: expose the configured models + their params (discoverable, reusable) — 2026-06-30 (Operator idea)

The proxy knows its full route table (model globs → backend, auth scheme, forImages/forImagesModel, vision flag). Idea: **expose that configured set** — the models and their parameters — so it can be **reused** downstream instead of re-declared. Use cases to scope: a client/setup dialog discovering "what models/routes are configured here" to offer them; a `modelpipe --list` CLI dump; or a read-only HTTP introspection endpoint. Open questions before any build: **what exactly is safe to expose** (model ids + capabilities + base_url host = fine; the **keyEnv NAMES** maybe; NEVER key values or the auth secrets — the no-secret-logging posture extends here); shape (JSON over a localhost endpoint vs CLI stdout vs a generated file the protocol's setup reads); and who consumes it (the protocol's `/dev-setup` routing dialog is the obvious first consumer — it could read the running proxy's config instead of asking). Lands in modelpipe (transport owns its own config), the protocol consumes. Needs `research`/design (the expose-shape + the safe-surface boundary) before build.

## WATCH: `ANTHROPIC_SMALL_FAST_MODEL` is deprecated — the guard's only independent knob (G1) — 2026-06-30 (from the multi-model setup UX, protocol-consume PR)

Per code.claude.com/docs/model-config, the harness's background/"guard" model is now owned by `ANTHROPIC_DEFAULT_HAIKU_MODEL` (the haiku slot); `ANTHROPIC_SMALL_FAST_MODEL` is its **deprecated predecessor** (still honoured today). Decision **G1** (recorded in `docs/decisions/multi-model-setup-ux.md` `## Requirement 7`): keep the separate `guard` seat mapped to `ANTHROPIC_SMALL_FAST_MODEL`, because the modern haiku-slot path folds the background model INTO the haiku slot — which in a typical routed setup is also the builder seat (e.g. haiku→deepseek) — so the deprecated var is the **only** way to set the background model independently of the haiku slot. **Watch:** the next Claude Code release(s) for `ANTHROPIC_SMALL_FAST_MODEL`'s removal. On removal, the independent guard knob is gone (background folds into the haiku slot) — the `guard` seat would then need re-mapping to the haiku slot or dropping. The installer writes `launch.guardModel` → `ANTHROPIC_SMALL_FAST_MODEL` into `.claude/settings.json` `env` (`src/adapter/install-claude.mjs` `mergeLaunchEnv`); that mapping is the line to revisit.

## BUG: assembled orchestrator exceeds Claude Code's 40k memory limit — 2026-06-30 (Operator-reported, HIGH) — RESOLVED 5.42.0/5.42.1

Assembled `.claude/ai-dev.md` was 57.6k > the 40k limit, risking silent truncation of later orchestrator sections. Fixed by decomposing section bodies to read-on-demand `.ai-dev/procedures/*.md` (triggers stay in-core) — 57.6k → 25.7k (5.42.0) → 24.1k (5.42.1) — plus a mechanical `agent-size` quality guard (<39k) so it can't silently regrow. Closed.

## Proxy as a git submodule — 2026-06-30 — SUPERSEDED (not doing)

Superseded by the ratified `docs/decisions/proxy-consume-mechanism.md` Option 3 (synced drift-guarded vendor-copy, shipped 5.39.0): the in-repo router is a pinned mirror of modelpipe with a drift guard — a submodule would break the vendoring one-command install (`--recurse-submodules` not run on a plain copy / npx fetch). Closed; an npm dependency remains the recorded future end-state once both repos publish to npm.

## Enforcer bug: commit-on-main gate resolves the branch by session-root, not the cwd repo — 2026-06-30 (BUG, found this session)

The `commit-on-unstamped-main` deny anchored to the session-root project (the one with `.ai-dev/config.json`) and blocked a legitimate `git commit` executed in a NESTED separate git repo (`_scratch/modelpipe`, on its own feature branch) purely because the PARENT repo's HEAD was `main`. The commit targets the nested repo's `.git`, not the parent's main — the gate misfired. Recent #298 ("scope the deny floor correctly across a nested separate git repo") fixed the BOUNDARY denies (read/write/find) for nested repos but the commit-to-main gate still resolves the branch/stamp against the session root rather than the repo the `git commit` actually runs in (cwd). **Fix:** the commit-gate (and the merge-gate by symmetry) should resolve the git repo from the command's cwd / the staged repo, not the session root, before checking the branch + stamp. Workaround used this session: the parent repo was on a feature branch anyway (legitimate parent work), which incidentally cleared the misfire — but a contributor committing in a nested repo while the parent sits on main would hit a false block.


## Branch-protection floor unverified live + Reviewer ran a delta-only check — 2026-06-30 (downstream intake)

A downstream project on the protocol shipped whole-tree-broken code to `main`, blocking every later PR. Two protocol-level gaps (downstream specifics stripped — the finding only; **Operator decision 2026-06-30: record, do not build now** — the downstream-side firefight is the Operator's, on that repo):

- **F-A — the "mechanical remote floor" is RECORDED as intent, never VERIFIED live.** Setup step 5 + `docs/decisions/persona-floor-external-substitute.md` name forge branch-protection (required CI status-check + `enforce_admins: true`) as THE floor that holds regardless of model/platform/plugin. But we ship only F2-1: the Orchestrator *prints* the `gh api` recipe and records the Operator's accept/decline — **nothing in any later beat probes the LIVE forge protection.** Downstream proof: protection existed with `required_approving_review_count: 1` but `required_status_checks: NONE` and `enforce_admins: false` — review-count wired, CI-check never wired — so a red whole-tree CI merged on an approval alone. The claimed floor never existed; no beat caught the gap. **Fix candidates:** (1) **audit gains a live branch-protection verification dimension** — read `gh api repos/{o}/{r}/branches/main/protection`, flag when the CI context is absent from `required_status_checks` or `enforce_admins` is false (small checklist change, platform/model-independent, catches recipe-printed-but-never-applied; the cheap high-leverage fix); (2) raise the **F2-2** priority (agent applies the recipe on confirm — see "Persona floor collapses…" below) — this incident is its concrete justification. The existing persona rule "confirm `gh pr checks` green before merge" (`## Your seat`) covers the per-merge check; this incident confirms persona alone is insufficient — the mechanical floor must be wired AND verified live.

- **F-B — the Reviewer ran a delta-only check, not the whole-tree runner.** The Reviewer lint-checked changed files but did not run the whole-tree type-checker the registry/CI runs; a whole-tree type error introduced by the delta (a change in file A breaking types in an untouched file B) was invisible to the per-diff pass and reached main red. Canon already says CI must invoke the quality runner WHOLESALE ("a re-listed hand-picked tool subset is a finding" — `## Audit`) — the gap is that this is stated for CI, **not the Reviewer.** **Fix:** `src/agents/reviewer.md` checklist + the quality-tools home make explicit that the Reviewer runs the registered review-beat suite via the runner (`run.mjs review`) over the whole tree, never a hand-picked tool on the diff — CI parity; the type-checker especially is whole-tree because a delta breaks types in untouched files. Sibling of the "run BOTH beats locally" process lesson below (that one: build-vs-review beat; this one: delta-vs-whole-tree within a beat).

## Audit dispatch — post-multi-user sweep (v5.26.0) — 2026-06-28 (closed-out)

Whole-tree audit after the 8-feature multi-user batch. HEALTHY, 0 BLOCK/HIGH. **All actionable findings SHIPPED this session** (pruned per the durable-text-hygiene discipline — git/CHANGELOG hold the record): MED-1/LOW-3/NIT-1 in the dispatch PR; **MED-2** size linter → 5.26.3; **the procedures-readability bug** found during LOW-2 prep → 5.26.4; **LOW-2** orchestrator decompose 367→223 → 5.26.5; **LOW-1** install.mjs 832→225 → 5.27.1 + engine.mjs 966→351 → 5.27.2. Only standing item:

- **LOW-4 — 3 moderate dev-only CVEs, accepted (watch).** `npm audit`: js-yaml + markdown-it (transitive under `markdownlint-cli2`), a quadratic-DoS class over the repo's OWN trusted markdown — no untrusted-input path, fix needs a breaking `markdownlint-cli2` downgrade. Re-check on the next `markdownlint-cli2` major.

## This-session follow-ups (autonomous batch 2026-06-28) — open

- **`install.test.mjs` decompose (875 > 800).** The `install.mjs` decompose (5.27.1) left its test file over the soft size threshold; the `max-lines` warn surfaces it. Behaviour-preserving split of the test by the sections it exercises. Effort S, lower priority (a test file).
- **Process lesson — the Reviewer must not mutate the working tree.** In the procedures-readability review (5.26.4) the dev-reviewer ran `git checkout src/adapter/install.mjs` (then restored it) — a scope breach (the Reviewer's only write is its verdict file; it judges the diff, never mutates it). Candidate: a line in `reviewer.md` forbidding any tree-mutating git/command; consider whether the deny layer can catch a Reviewer-context `git checkout`/`git restore`/`git reset` of a tracked file.
- **Process lesson — run BOTH beats locally for a core/doc change.** A 5.26.4 PR passed local `build` but CI caught a `neutral-prose` leak (the review beat) — the local check only ran `build`. Candidate: the orchestrator/Builder/Reviewer run `node src/quality/run.mjs review` (not only `build`) before handing back a core/doc change; CI is the backstop but a local review-beat run avoids the round-trip.

## Config-driven pre-approved remote-op allowlist — ask-class ⊥ unattended autonomy — 2026-06-20 (Operator-reported)

**Symptom (Operator, working autonomously in a downstream):** the ask-class `ssh-mutating-action` rule (`ssh` + systemctl/docker/apt/npm/kubectl/rm/cp/mv/mkdir/touch) fired on a legitimate `ssh … 'sudo -n mkdir -p … && tar czf …'` backup, demanding per-command confirmation. **Correctly classified — NOT a false positive:** a `sudo` mkdir/tar write on a remote prod controller IS a remote mutation; the pattern must NOT be weakened (dropping mkdir/tar/sudo would pass genuinely dangerous remote mutations for every downstream).

**The real gap:** ask-class ⊥ unattended autonomy. A legitimate, repetitive remote op (backup-before-risk, D3) asks every time; in a TRULY unattended autonomous session the ask has no one to answer and deadlocks. Autonomy deliberately does NOT lift the remote-mutation gate (invariant 7: the consequential/irreversible class stays human-gated — correct) — but there is no conscious-pre-approval escape.

**Proposed feature (Operator chose: backlog, 2026-06-20):** a config-driven allowlist the engine consults BEFORE returning `ask` for the remote-mutation rule — mirroring how the boundary denies consult `components.json`:
- The Operator declares pre-approved remote-op patterns in `.ai-dev/config.json` (host glob + command-class anchor), a repo-owned, git-tracked, recorded decision (invariant 4 — a conscious risk acceptance, not a model bypass).
- Engine: a remote-mutation match → consult the allowlist → matched ⇒ allow silently; else ⇒ ask (today's path).
- **Fail-safe:** absent / empty / malformed allowlist ⇒ ask everything (byte-identical to today; fail-safe to MORE rigor, the untrusted-config discipline every other field follows).
- **Security posture (design carefully):** matching a shell command is injection-prone — a too-loose glob over-approves. Anchor on host + command PREFIX, not substring; reject `..`/wildcard-host-escapes; the floor (default ask) is unchanged for anyone who doesn't opt in. Document the threat in the threat-model template.
- **Scope (not started):** engine change + config-schema field + validator + tests (the ask path, the fail-safe-to-ask, the allowlist matcher's over-approval guards) + the `## Setup` / config doc. Companion honesty note: on OpenCode the whole ask-class is already persona (no ask-return), so this allowlist is a Claude-relevant refinement; the OpenCode remote-mutation gate stays persona regardless (cross-link the persona-floor epic).

## Post-re-unification audit (2026-06-20) — LOW/NIT housekeeping dispatch

Whole-tree audit after the fork→canon squash re-unification: **HEALTHY** — 0 BLOCK, 1 HIGH (resolved this same session: H1 two orphaned tests wired into the registry + an inverse orphan-guard, 5.19.3), plus these non-blocking residuals to fold on a future touch (run-note: `.ai-dev/audit/post-reunification-2026-06-20.md`, deleted once dispatched):

- **L1 — RESOLVED 2026-06-30** (folded: the "Multi-repo epic follow-ups" item 2 now reads RESOLVED, seam-contract shipped 5.17.0).
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
- **F2 RESOLVED-as-F2-1 (this feature)** — the forge branch-protection + required-CI offer is now a MANDATORY, recorded accept-or-decline step in `## Setup` (the printed `gh api` recipe), named openly as THE ask-class substitute on OpenCode. Research/decision: `docs/decisions/persona-floor-external-substitute.md`. **STILL OPEN — F2-2 (deferred fast-follow):** the agent runs the `gh api` branch-protection call itself on the Operator's confirm (a forge-mutating action; admin scope) instead of printing the recipe. **Priority raised 2026-06-30 by a downstream incident** (see "Branch-protection floor unverified live…" at top): F2-1's printed recipe was never applied with the CI-check, so the floor never existed — concrete proof F2-1 alone is insufficient; that entry also adds the genuinely-new F-A (audit must VERIFY the live protection, not just record the intent).
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

## Audit-lens candidate — two safeguards evolving independently, no test exercises them together — 2026-06-16 (downstream intake)

**Class** (mapped from a downstream bug, abstracted — no downstream specifics). Two defensive mechanisms are added in separate changes, each correct in isolation and each tested in isolation; neither's test exercises the OTHER's effect on shared state, and one silently undoes or mis-handles what the other already did. A per-diff Reviewer sees each safeguard as locally sound; the interaction failure is invisible without a test that drives BOTH together. Sibling of the existing *Producer/consumer format coupling* entry below, but a distinct angle: that one is consumer-vs-producer cosmetic coupling; this is safeguard-vs-safeguard state coupling. **Audit-sweep candidate:** when two independent guards touch the same shared structure (history, a buffer, a queue), require a test that runs them in sequence — the second guard fed the first guard's output. Add to the auditor's whole-tree code-quality dimension.

## Multi-repo epic follow-ups — deferred from the shipped epic — 2026-06-16

The multi-repo-components epic shipped (boundary mechanism 5.15.0 + coordination workflow 5.16.0; research `docs/decisions/multi-repo-components.md`). Two items were consciously kept OUT and are their own future features:

1. **Firmware flash-and-probe verification rung.** The real-layer verification offer (`src/agents/orchestrator.md` `## Your seat`) is described only generically (CLI / IPC / socket / API). An embedded firmware component needs a concrete "flash the artifact to the device and probe it" rung — with its blast-radius safety (a device that can be bricked). Needed in ANY layout, not just multi-component. Likely overlaps prior on-hardware-preflight thinking.

2. **Seam-contract transport (epic decision D6) — RESOLVED, shipped 5.17.0** (`docs/decisions/seam-contract-transport.md`: a consuming repo reads the seam contract from the owner's `docs/contracts/` within a coordinated session; pointer-not-copy outside one). No longer open.

## Process lessons — git/stamp friction caught live — 2026-06-16

Two mechanical foot-guns hit during the multi-repo ship; both cost a push round, neither leaked:

1. **Stamp filename must track the branch topic.** The merge-gate derives the topic from the branch name and looks for `.ai-dev/reviews/<branch-topic>_review.md`. A branch whose topic differs from the plan/epic name (e.g. an epic plan `multi-repo-components` shipped on a branch `feature/multi-repo-coordination`) gets a stamp at the wrong path and the gate blocks the push. **Fix direction:** the orchestrator derives the stamp filename from the branch topic (one source), or the merge-gate also accepts a stamp matching the active plan topic; document the "branch topic == stamp/plan topic" rule in `## Your seat`.

2. **Never combine the version-bump `git commit` and `git push` in one shell block.** The merge-gate hook inspects the whole block; a block containing `git push` is denied wholesale, so a `git commit` earlier in the same block never runs. A version bump committed this way silently does not land, and a later bare push ships the prior commit at the stale version (this happened — corrected by a follow-up release-marker PR). **Fix direction:** an orchestrator operating note in `## Your seat` — bump+commit and push are always separate tool calls. Low severity (caught mechanically), but it cost a corrective PR.

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

## Gitignore tooling — zero protocol noise in downstream repos — 2026-06-13 (Operator)

The downstream project currently commits the full `.ai-dev/tooling/` tree (~all protocol source). Operator wants to gitignore it while keeping enforcement.

**Key insight:** tooling serves two purposes — (1) runtime: hook enforcement (shim + engine + deny-rules) + agent context (PROTOCOL.md + assembled role bodies); (2) re-install source (used only when `npx` upgrades). Only (1) needs to stay on disk permanently.

**Three variants (ascending ambition):**

1. **Assemble Claude orchestrator + gitignore tooling** — OpenCode already assembles the orchestrator into `.opencode/agents/ai-dev.md`; do the same for Claude (`.claude/agents/ai-dev.md`), switch CLAUDE.md to import from it. Committed = assembled agents + 3 enforcement files (shim/engine/deny-rules) + quality runner + PROTOCOL.md. Tooling gitignored; `npx` re-vendors on upgrade.

2. **Self-contained shim** — bundle shim + engine + deny-rules into one file with no external imports. Committed = that one file + assembled agents + PROTOCOL.md. Zero tooling.

3. **npx-at-hook-time** — settings.json hook calls `npx ai-dev-protocol@<version> --shim` instead of `node .ai-dev/tooling/...`. Zero code committed. Requires npm publish + network on every tool call.

**Tradeoff for all three:** `git clone` on a new machine = no enforcement until `npx ai-dev-protocol@latest .` runs. Must be documented (README + `git clone` note).

**Recommended first step:** `research` — scope variant 1 precisely (what files are actually needed at runtime vs install-time; confirm Claude agents/ can load an assembled orchestrator the same way OpenCode does). Prerequisite: npm publish is still deferred.

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
