# Changelog

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/); versioning: [SemVer 2.0](https://semver.org/).

- **MAJOR** — breaking: incompatible project-structure changes, removed agents or commands
- **MINOR** — new agents, commands, capability modules, template docs
- **PATCH** — fixes, clarifications, non-functional changes

---

## [Unreleased]

---

## [5.18.0] — 2026-06-19

### Added

- **New mechanical-floor denies, holding on BOTH platforms (DENY, not ask — so they survive OpenCode where ask degrades to persona).** Three under-enforcement holes the persona layer alone could not hold are now `[mechanical]`: (1) **F1 — an explicit unreviewed trunk push** (`git push <remote> main`/`master`, `HEAD:main`, `+main`, `refs/heads/main`) with no satisfied review stamp is now DENIED on guarantee profiles — previously it resolved to no topic → the ask-class `merge-topic-unresolvable` → persona on OpenCode → a silent pass (the exact hole a downstream incident fell through); a bare `git push` from main was already denied, this closes the explicit-ref form. Tag pushes stay exempt; a stamped main and any feature-branch push are unaffected; `maintenance`/`mainline` are not mis-classified (whole-token match). (2) **F4a — blind staging** (`git add -A`/`.`/`--all`) is DENIED (stage named paths; a named-path `git add foo` is allowed). (3) **F4b — a direct `git commit` on a configured `main` with history** is DENIED, with a narrow carve-out for the very first commit of a freshly-init'd repo (no history ⇒ nothing to bypass; `setup` bootstrap needs it) and feature branches / `yolo` unaffected. All three read only the bash command + local git HEAD (no actor resolution) so they are mechanical on both Claude and OpenCode. Each ships with both should-DENY and should-ALLOW (false-positive) test coverage.

### Fixed

- **Merge-gate no longer over-blocks read-only `git merge-*` plumbing.** The predicate `/git\s+(merge|push)\b/` let `\b` match the hyphen, so read-only `git merge-base` / `merge-tree` / `merge-file` / `mergetool` were wrongly DENIED (a live false-positive hit during a containment check). The merge match now requires the standalone verb (`git\s+merge(?![-\w])`); a real `git merge <topic>` / `gh pr merge` still denies. ALLOW cases for the plumbing family are pinned in `merge-gate.test.mjs`.
- **Enforcement hook no longer crashes on a malformed config or a bad pattern.** `loadConfig()` (`JSON.parse`) is now wrapped in the Claude shim's `main()` and fails OPEN (exit 0, logged to stderr) — a corrupt `deny-rules.json` lets work through rather than freezing the session (the immutable tooling dir is the compensating control); `new RegExp(pat, "i")` is guarded by `safeTest` and returns no-match on a `SyntaxError` (safe for the inject/nudge class only — a deny-class predicate must never reuse it, enforced by a guard comment). Both are defensive-coding gaps from the v5.11.4 audit (F1+F2).

---

## [5.17.7] — 2026-06-19

### Fixed

- **The OpenCode inject realisation crashed the host on opencode 1.17.8 — every change-verb message killed the session; inject is now persona-only on OpenCode.** The plugin's `chat.message` hook pushed a context part onto `output.parts` (the analog of Claude's `UserPromptSubmit`) to realise the inject class — the lazy-setup / no-brief / change-route nudges. On opencode 1.17.8 that push made `SessionPrompt.createUserMessage` throw `EventV2.InvalidSyncEvent: Expected string aggregate field sessionID` *after* the hook returned (uncatchable in-hook), crashing the session on the first change-verb prompt; injected parts also rendered unreliably upstream. Ground-truthed live on opencode 1.17.8 (a temporary early-return unblocked the session). Fix: the `chat.message` hook is **removed** — the OpenCode plugin now registers only `tool.execute.before` (the real `[mechanical]` deny floor, untouched). The three inject-class rules (`no-config-run-setup`, `no-product-brief-discover`, `change-route-reminder`) fall back to **persona on OpenCode**, recorded per-rule in `src/adapter/deny-rules.json` `fallback` and stated with its reason in `src/adapter/INSTALL.md` (no over-claim — the orchestrator's own loaded prose carries the loop / change-routing / setup-first discipline regardless, so no rigor is lost; the loss is one cosmetic in-prompt nudge). The neutral engine, `decidePrompt`, the Claude `UserPromptSubmit` inject realisation, and parity at the engine-decision level are all unchanged — only the OpenCode adapter stops *applying* the inject. `src/adapter/opencode-inject.test.mjs` is rewritten as the ratchet: it now asserts the `chat.message` hook is absent and the deny hook stays registered (RED against the old push-based plugin, GREEN after). Re-realising the nudge via a supported opencode hook (`experimental.chat.system.transform` / `chat.params`) is a deferred backlog candidate — `experimental.*` is version-brittle and re-introduces the unstable-surface dependence this fix removes.

---

## [5.17.6] — 2026-06-19

### Added

- **The installer now self-verifies the deployed OpenCode plugin actually loads — a silently-broken plugin is now a loud install failure, not a silent floor-off.** Durable D7 prevention for a 3-time recurring class (5.17.4 wrong `../` depth, 5.17.5 missing registration, and an npx-cached stale 5.17.3 deploy) where the OpenCode boundary-deny plugin shipped *deployed but not loading* and the installer still printed success — leaving the entire `[mechanical]` floor off without any signal. `src/adapter/opencode/install-plugin.mjs` `install()` is now async and, immediately after writing `.opencode/plugins/ai-dev.mjs`, dynamically `import()`s the just-written file in its real installed layout; on a load failure it throws (preserving the underlying error via `{ cause }`), naming the plugin path and the hint "the deployed plugin does not load — enforcement would be silently off", and the install exits non-zero with no success summary. Covers every invocation path (the unified installer's child spawn, the standalone CLI, the tests) because the check sits in the single funnel through which the plugin is ever written. A ratchet in `install.test.mjs` drives a deliberately-broken deploy and asserts the loud failure (RED without the self-verify), with a GOOD-install arm pinning the vendor-before-write ordering so a future reorder can't reintroduce a false-fail. **Honesty boundary (stated in `INSTALL.md`):** this proves the plugin *loads* (the path / ES-module-resolution class); it does NOT prove OpenCode *registers* the hook at runtime (the version-drift class — covered separately by the `opencode.json` `plugin`-key registration, its install-test assertion, and the audit-cadence plugin-load probe). A backlog item tracks extending the same self-verify to the Claude hook wiring.

---

## [5.17.5] — 2026-06-19

### Fixed

- **OpenCode 1.17.8 stopped auto-loading project-folder plugins — the `[mechanical]` floor was silently absent again, this time even with the plugin correctly deployed.** 5.17.4 fixed the import path so `.opencode/plugins/ai-dev.mjs` loads as a module; but OpenCode 1.17.8 dropped project-folder plugin auto-discovery entirely (it was present on 1.17.0, where the plugin was verified live). A project plugin now loads ONLY if listed in the `plugin` key of `opencode.json` — which the installer never wrote. Ground-truthed from OpenCode's own bundle: the resolved config listed only global plugins, and a folder-placed plugin (under either `plugins/` or `plugin/`) was ignored until registered in the config key. The installer's `opencode.json` merge (`src/adapter/install.mjs` `wireOpenCode`) now adds `plugin: ["./plugins/ai-dev.mjs"]` to both branches, de-duped so a project's own `plugin` array is never clobbered and re-runs stay idempotent. The path is `.opencode/`-relative (a relative spec resolves from the directory of `opencode.json`, not the project root). The engine, `normalise.mjs`, and the plugin-entry hook bodies were ground-truthed correct and are untouched — the hook arg shape (`input.tool`, `output.args`, `args.filePath`) is unchanged; only the load wiring was missing. `install.test.mjs` gains a ratchet (RED pre-fix) asserting the registration key, its `.opencode/`-relative form, never-clobber, and idempotency. Prevention (the recurring "the test proves the module imports, but the platform never loads it" class): the audit's verification-coverage dimension gains an OpenCode plugin-load probe (boot real opencode → denied write → confirm `[ai-dev] …`), with an opt-in real-opencode E2E backlogged.

---

## [5.17.4] — 2026-06-19

### Fixed

- **OpenCode enforcement plugin never loaded on a downstream install — the entire `[mechanical]` deny layer was silently absent.** `src/adapter/opencode/install-plugin.mjs` `resolveRewrite` left the downstream import path un-rewritten (`return null`), keeping the source's `../../../.ai-dev/tooling/src/adapter`. That path is authored relative to the source file's depth (`src/adapter/opencode/`, 3 levels), but the deployed plugin sits at `.opencode/plugins/ai-dev.mjs` (2 levels) — so the three `../` overshot the project root by one, the plugin threw `ERR_MODULE_NOT_FOUND` on load, and OpenCode skipped it without registering any hook. The downstream branch now drops one `../` (and one `path.resolve` segment), matching the dev rewrite's depth. Confirmed against a live downstream where the strongest deny (a write into `.ai-dev/tooling/`) did not fire. The dev/dogfood layout was coincidentally correct (it rewrites to `../../src/adapter`), which is why this repo's own enforcement worked and every test passed — the downstream path was string-checked but never exercised by importing the generated plugin. `install-plugin.test.mjs` gains the missing guard: it now generates the downstream plugin into a real installed layout and **imports** it, asserting its adapter imports resolve.

---

## [5.17.3] — 2026-06-16

### Changed

- **Repeated-fix ceiling now counts the reported symptom, not the patch.** `src/agents/orchestrator.md` `## When something is off`: the repeated-failed-attempt ceiling keyed on "the same wall" and exempted a "succeeding fix-after-fix firefight" — but a patch can succeed *at its own layer* while the Operator-visible symptom persists, so symptom-chasing across N *distinct* fixes never tripped it. The discriminator now keys on the **user-visible / Operator-reported symptom**: N distinct fixes that each change something yet leave the same failure reported **is** the loop → stop, trace the chain, declinable 8D. The "succeeding firefight" exemption holds only when each fix closes a **distinct, Operator-confirmed** symptom.

### Added

- **Builder "Trace before patch" discipline.** `src/agents/builder.md` `## Build`: a defect spanning multiple layers — trace the whole chain `input → … → observable output`, locate the actual break, fix it once at the true cause; never patch the first plausible layer and re-run. The Orchestrator points at this when building directly on `solo`/`lite`. No `PROTOCOL.md` edit — both are procedure (thin core). `[persona]`. (From a downstream feedback intake: three sequential patches to one bug, no root-cause trace.)

## [5.17.2] — 2026-06-16

### Added

- **The loop's terminal narration — a required completion line after merge.** The narration rule (`PROTOCOL.md` `## Talking to the Operator`) is *pre-act* ("before each significant act"), so it structurally cannot cover the loop's last act: nothing follows the merge to pre-announce, and the session would go quiet exactly at "is it done? can I test it?". `src/agents/orchestrator.md` `## Your seat` now requires, **after the merge is confirmed**, one plain line to the Operator — shipped version · one-line change summary · "ready to test" · how to test it by hand (the verification scenario/command the plan named). Distinct from the PR-open cost relay (that prices the work; this reports completion); no `PROTOCOL.md` edit — the core principle already exists, the concrete terminal requirement stays procedure (thin core). `[persona]`. (From a downstream feedback intake: a fixup's completion went silent.)

## [5.17.1] — 2026-06-16

### Added

- **End-to-end test: the multi-repo boundary is enforced through the real shim on a real layout.** The multi-repo epic (5.15.0–5.17.0) shipped its enforcement, but the suite tested the deny *engine* in-process (`decide()` with an explicit root, bypassing `resolveRoot`). This new `multirepo-e2e` test (`src/adapter/multirepo-e2e.test.mjs`) drives the full installed path — a real `node shim.mjs` subprocess reading a hook payload on stdin, resolving the hub root from a real **git toplevel**, enforcing the widened boundary — against an on-disk fixture of four git-init'd sibling repos. Proven through the real subprocess: declared-sibling read/write allow; undeclared sibling deny; the D6 seam-contract read from the hub session allow (the "widened boundary IS the transport" claim, end-to-end); a declared sibling's `.ai-dev/tooling/` deny (per-root carve-out); the no-manifest single-root tripwire. **No bug surfaced — the shipped mechanism works on a real layout.** OpenCode has no source-loadable subprocess entry, so it is exercised via `decide()` on the same fixture (the asymmetry stated honestly, no faked parity). Validates the deny mechanism, not the `[persona]` coordination prose.

## [5.17.0] — 2026-06-16

### Added

- **Seam-contract transport (multi-repo epic, decision D6).** The last open multi-repo question — how a consuming repo references a seam contract (a frontend↔backend API, a backend↔firmware wire protocol) owned by a producing repo — without reading the producer's tree (project-boundary) or copying into every repo (invariant 6). The answer leans entirely on what already shipped: a seam contract has **one home** in its OWNING component's `docs/contracts/`, and **within a coordinated multi-component session the widened boundary (5.15.0) IS the transport** — the session reads the owner's contract directly, no copy, no new mechanism. A component may declare the seams it owns via an optional, additive `contracts` field on its manifest entry (`{ "path": "...", "consumers": [...] }`); the manifest stays a JSON array and the **security-critical validator ignores the field** (advisory metadata, pinned by characterisation tests so the fail-closed floor stays intact). Outside a coordinated session: reference by pointer, never copy — a drift-guarded snapshot only if a build needs the file present. Rejected (recorded): copy-into-every-repo and an external schema registry (BSR / Pact Broker — not thin, not platform-neutral). (`docs/decisions/seam-contract-transport.md`; schema in `docs/architecture.md` `## Components`; posture in `docs/contracts/project-boundary.md`; `src/agents/orchestrator.md` `## Multi-component coordination`.)

> This completes the multi-repo epic's design. Still open as a separate, layout-independent feature: the firmware flash-and-probe verification rung (backlog).

## [5.16.3] — 2026-06-16

### Fixed

- **Boundary docs now describe the per-root tooling deny accurately** (whole-tree audit findings). `docs/architecture.md` and `docs/contracts/project-boundary.md` had grouped the `.ai-dev/tooling/` self-patch deny with the session-root-anchored denies, but the per-root carve-out (5.15.0's F1 fix) makes it consult the component set to **narrow** — denying `.ai-dev/tooling/` under every declared root (`writesIntoAnyNever`). Corrected to the three-way truth: boundary denies consult the set to widen, the tooling deny to narrow, the rest ignore it. Also: `src/agents/orchestrator.md` no longer claims a sibling repo's push is gated by the one hub stamp (a sibling push resolves its own root where the hub stamp is absent — its own CI is the repo-local re-check, matching the contract residual); `docs/contracts/cross-session-enforcement.md` now names the declared component set rather than "the project root". Docs-only; no behaviour change.

## [5.16.2] — 2026-06-16

### Changed

- **Reviewer flags new code paths that ship without a test.** Closes a downstream-intake signal: the floor's coverage gate was "build tests green + existing not weakened" — silent on whether *new* logic is tested, so a new branch could ship green over only pre-existing paths. The Reviewer's `Tests` checklist item (`src/agents/reviewer.md`) now treats a new code path with no test exercising it as a finding — **blocking** when that path is security- or contract-bearing (deferring to the existing Security / Contracts gates), otherwise a named **advisory** finding (recorded, not blocking; the audit cadence backstops advisory passes; a recorded `deferred: <reason>` clears it). The Builder gains a proactive `New-path coverage` line (`src/agents/builder.md`) so the test is written up front where there is no firefight pressure. Design rationale (felt-vs-unfelt): under pressure the Builder feels the deadline, not the coverage gap, so the independent Reviewer is the load-bearing catch; tying the block to the already-block-worthy classes avoids a new absolute gate that would re-litigate the firefight lane. (`[persona]`.)

## [5.16.1] — 2026-06-16

### Changed

- **Ship cost relay reports token spend.** The orchestrator's one-line ship-time cost relay (`src/agents/orchestrator.md` `## Your seat`) now names **token spend** alongside spawns and wall time — the sum of the spawned roles' reported usage (each sub-agent result carries its own count), plus the session's own where the harness surfaces it. The wording is deliberately honest about what is measurable: report the sum and name what is not surfaced rather than invent a precise-looking total. (Operator-requested; `[persona]`.)

## [5.16.0] — 2026-06-16

### Added

- **Multi-component coordination: the loop can drive one feature across a declared set of repos.** Second PR of the multi-repo epic, the workflow layer on top of 5.15.0's widened boundary (all `[persona]` prose — it shapes orchestrator reasoning, blocks nothing mechanically). A session now **recognises** a multi-component project from the committed `.ai-dev/components.json` (recognise-and-announce, anchored in the understand beat's enumeration — not a declinable offer, since the manifest is authoritative) and runs **one plan / one Builder / one fresh Reviewer over the unified cross-repo diff**, fanning out to a per-repo ship. The new `src/agents/orchestrator.md` `## Multi-component coordination` is the procedure's one home. (`PROTOCOL.md` beat 1; `src/agents/orchestrator.md`.)
- **N-repo git flow.** A cross-component feature keeps git **per-repo**: per-repo branch / commit / PR, **no atomic cross-repo commit**, N Operator merge words, the Operator sets cross-repo merge order. One home in `PROTOCOL.md` `## Git flow`; beat 5 (Ship) and `orchestrator.md` `## Your seat` point at it (the state pointer now names every touched repo's per-repo PR/merge state for lossless N-repo resume).

### Decisions recorded

- The manifest is **committed / repo-owned** (relative paths, changes via git — invariant 4); the hub is the repo whose `.ai-dev/` holds it. The review-stamp and merge-gate stay **session-root-anchored** (one unified review gates all N pushes). The trust-posture residual is stated unsoftened in `docs/contracts/project-boundary.md`: a sibling repo's merge-gate is satisfied by the unified hub review, so its own CI / branch-protection is the only repo-local re-check. (`docs/contracts/project-boundary.md`; `docs/architecture.md` `## Components`.)

## [5.15.0] — 2026-06-16

### Added

- **Multi-component projects: the project boundary can span a declared component set (opt-in, fail-closed).** First PR of the multi-repo epic (Operator chose Option B; research at `docs/decisions/multi-repo-components.md`). A project that is several separate repos — e.g. a React frontend + Python backend + C firmware — can now declare its sibling roots in `.ai-dev/components.json`, and a single agent session may read/find/write across the declared set in one boundary (invariant 2 widened from one root to the declared set). The default is unchanged: **no manifest ⇒ behaviour byte-identical to before** (single root only); the capability is opt-in. The widening is `[mechanical]` on both platforms — only the project-boundary read/find/write denies consult the set; the truncation, self-patch, stamp-write, merge-gate, and orchestrator-content denies stay session-root-anchored. **Fail-CLOSED is load-bearing:** an absent / malformed / wrong-shape / non-existent-root / overbroad (filesystem-root or session-root ancestor) / symlink-escaping manifest collapses the permitted set back to the single session root — the boundary never widens on doubt, and a single bad entry rejects the whole manifest (no partial honour). The `.ai-dev/tooling/` enforcer-source carve-out is denied **per-root** (under every declared root, read+find+write), taking precedence over the component-set allow. (`src/adapter/engine.mjs` `componentRoots`/`isInsideAnyComponent`/`writesIntoAnyNever`; full both-platform parity matrix in `src/adapter/parity.test.mjs`; invariant 2 + `## Enforcement` in `PROTOCOL.md`; `docs/contracts/project-boundary.md`; `docs/architecture.md` `## Components`.)

> Not yet shipped (next PR): the orchestrator coordination layer — how a session learns it is multi-component, drives one plan + one Reviewer over the unified multi-repo diff, and the per-repo git/ship model (N Operator merge words). The firmware flash-and-probe verification rung and a shared seam-contract transport are tracked separately in the backlog.

## [5.14.1] — 2026-06-16

### Changed

- **Firefight lane — batch-review-before-ship made visible, dropping review cadence made un-silent.** Fixes a downstream finding: during a rapid fix-test debugging firefight (sub-minute build-install-test cycles) the Reviewer cadence collapsed into a silent `solo`→`yolo` slide across 9+ changes. Two prose clarifications, no new mechanism: `PROTOCOL.md` beat 4 now states the fresh Reviewer checks the branch's **cumulative diff** — so a branch carrying several atomic fixes is covered by **one** Reviewer before ship (the compliant fast path: batch the fixes, review once, ship once; the floor is unchanged). A route-first **firefight** bullet in `src/agents/orchestrator.md` makes deferring per-fix review to one batch review an explicit **announce-and-acknowledge** step (`[persona]`), never silent — and states plainly that no `[mechanical]` deny catches an in-flight skip (the merge-gate is the only mechanical floor, and it catches the ship, not the drift). (`PROTOCOL.md` beat 4; `src/agents/orchestrator.md` route-first + `## When something is off`.)

---

## [5.14.0] — 2026-06-16

### Added

- **`docLanguage`** — documentation can now follow the Operator's language instead of always English. Invariant 5 (`PROTOCOL.md`) is reworded in place into two audience axes: **machine-facing / cross-team** artifacts (code, comments, commit messages, CHANGELOG, config keys *and* values, IDs/enums, machine grammar embedded in docs) stay **English always**; **human-read documentation** (the `docs/` tree + project `README.md`) follows a new `docLanguage` config field (a language code string; default `"en"`; absent/empty/whitespace ⇒ `"en"`). Setup gains a doc-language question, and a *"делай документацию на X"* mid-stream switch flips the field and offers to translate the existing in-scope docs through the loop. This repo pins `docLanguage:"en"` (dogfood guard — its own `docs/` tree is an English deliverable); the protocol's own source is machine-facing core, never the `docs/` tree, so the field never reaches it. (`PROTOCOL.md` invariant 5 + `## Project config`; `src/agents/{orchestrator,builder,reviewer}.md`; `CLAUDE.md`.)

---

## [5.13.0] — 2026-06-15

### Added

- Installer **dogfood/source mode** (`node src/adapter/install.mjs . --dogfood`): wires the protocol's own source repo to its `src/` tree instead of a vendored copy, skipping vendoring + version-stamping, so a self-reinstall is idempotent against the committed source-mode state (`git status` clean) on both Claude and OpenCode — instead of churning the tracked wiring to the downstream layout. Symmetric **fail-closed** guard: `--dogfood` against a non-source target, and a no-flag install against the source repo, each exit 1 rather than wire the wrong layout. (`src/adapter/install.mjs`; contract `docs/contracts/one-command-install.md`; usage `src/adapter/INSTALL.md`.)

---

## [5.12.1] — 2026-06-15

### Changed

- `src/adapter/tool-map.json` — `spawn-a-sub-agent` now carries a `_doc` recording the OpenCode background-subagent capability (changelog v1.16.2+, present 1.17.x; multiple-concurrent task calls unverified), pointing at `docs/decisions/opencode-task-capabilities.md` Q2. Closes the research's Q2 record half.

---

## [5.12.0] — 2026-06-15

### Changed

- OpenCode adapter no longer bakes a reviewer `model:` line into the assembled frontmatter: the OpenCode `task` runtime parses but does not apply a subagent's `model:` (open upstream bugs #21632 / #17870 / #18615, unfixed through 1.17.7), so a concrete OpenCode reviewer pin is now dropped like `auto`/`session` instead of being silently baked into dead frontmatter. `setup` no longer offers a cross-model reviewer on OpenCode. (`src/adapter/opencode/install-agents.mjs`, `src/agents/orchestrator.md` `## Setup`)

### Fixed

- Honesty: the orchestrator's `## Your seat` note, `src/adapter/tool-map.json` `models.opencode._note`, and `src/adapter/INSTALL.md` no longer claim an OpenCode reviewer can be cross-model — they now document why it cannot. New research decision `docs/decisions/opencode-task-capabilities.md` grounds the verdict (also: background subagent spawn confirmed present v1.16.2+; native `task` resume still absent).

---

## [5.11.5] — 2026-06-13

### Fixed

- `src/modules/ui-ux/reviewer.md` — `[rich]` graphical walkthrough now requires the Operator to have confirmed the real-layer exercise (the offered act) before driving; honest-residual clause extended to cover "or the exercise was not confirmed". Resolves the contradiction with the 5.11.4 floor's "offered, Operator-confirmed, never run by default" rule.
- `docs/decisions/bmad-adoption.md` — browser-walkthrough bullet updated to reflect the 5.11.4 re-anchoring as the graphical deepening of the *offered* real-layer exercise (pointer to `verification-floor.md` added); the stale "Reviewer exercises the live surface" phrasing removed.

---

## [5.11.4] — 2026-06-13

### Changed

- Verification expectation is now **universal and split write-vs-run**, replacing the web-only / depth-gated GUI rows. Every consumer-facing artifact has a *primary integration layer* (a CLI invocation, a browser, a desktop app's IPC, a service's socket, a library's public API); the Builder's plan **always names** the verification scenario + that layer (free, floor), and the Reviewer claims the rung it actually reached without implying a run it didn't do. **Running** the real layer (e2e) is *expensive*, so it is an **offered, Operator-confirmed** act on a user-facing change or batched at the audit cadence — never automatic, never a per-change duty. The two web-only `test-methodology` rows ("UI exercised" / "UI claim backed") are superseded by the floor; ui-ux's browser-walkthrough is re-anchored as the graphical deepening (screenshot + a11y snapshot + console) on top of the offered exercise. Rationale: `docs/decisions/verification-floor.md`; merges the two open siblings from `ratchet-and-verification.md`.

---

## [5.11.3] — 2026-06-13

### Fixed

- Merge-gate accepts a review stamp at **any heading level** (`#`…`######`), not only `##`. A Reviewer authoring a fresh stamp file naturally opens with an H1 title (`# Code review: …`); the old `^##` matcher rejected it and blocked the push, costing a wasted re-review round. The heading level carries no meaning to the gate — only the label + the inline verdict do — so `engine.mjs` now matches `^#{1,6}`; `reviewer.md` documents the tolerance (`##` stays the convention); a `merge-gate` test pins the new acceptance (h1/h3/h6 ⇒ allow, while empty / `NOT YET RUN` / blank-separated / next-heading still deny). 8D `reviewer-stamp-heading-level`; D7 "fire-time anchor"-sibling class — a mechanical consumer must tolerate cosmetically-equivalent producer forms and a test must feed a producer-shaped artifact.

---

## [5.11.2] — 2026-06-13

### Fixed

- Platform-switch offer now fires: the understand beat's lazy-offer enumeration (`PROTOCOL.md` `## The loop` beat 1) lists the platform-mismatch case, pointing to the orchestrator's `## Setup` Platform-switch procedure. Before, the trigger lived only inside `## Setup` ("offer on the understand beat") while the beat itself did not name it — so a session on a harness differing from the config's `platform` (e.g. OpenCode on a `claude`-pinned project) never got the offer. 8D `platform-switch-orphaned-offer`; D7 folds this with the discovery-conclude and missed-audit-offer findings into one "fire-time anchor" class (a `[persona]` trigger must be anchored on the path the role walks when it fires, not only in the feature's own chapter).

---

## [5.11.1] — 2026-06-13

### Fixed

- `src/quality/run.mjs` — the quality runner resolved its registry to `src/quality/tools.json` (the source-repo layout), but the installer co-locates the runner and the registry in a downstream's `.ai-dev/quality/`. So in **every downstream install** the runner found no registry, printed "no tools.json", and exited 0 (green) having run zero checks — the `build` and `review` gates were silently disabled. The default now resolves **beside the runner**, correct in both layouts (they always ship as a pair). (8D: `quality-gate-silent-bypass`; downstream field report.)
- `src/adapter/install.mjs` — the installer gitignored `.ai-dev/state/` but never created it; the orchestrator's first `current.md` write expected the parent directory. `layDownCore` now creates it.

### Changed

- `src/quality/run.test.mjs` — every `run()` call now passes an explicit `registryPath` (synthetic), so the new beside-the-runner default is never consulted by the self-test (no recursion into the real registry).
- `src/adapter/install.test.mjs` — first regression guard exercising the true downstream layout: spawns the laid-down `.ai-dev/quality/run.mjs` against the temp target (no `src/quality/`) and asserts it LOCATES the registry ("no ship-beat tools", never "no tools.json"); plus a `.ai-dev/state/` directory-exists assertion. Would have caught the silent bypass.

---

## [5.11.0] — 2026-06-13

### Added

- `src/templates/product.md` — §7 "The case against" restructured into three explicit fields (Strongest reason / Who it's wrong for / Stop signals) with a conclude-turn guidance blockquote referencing the elicitation catalog. Turns the conclude phase from a free-form blob into a structured mandatory artifact. (8D root cause: `discovery-conclude-skip`.)

### Changed

- `src/agents/orchestrator.md` (`## Product discovery`) — conclude phase is now a **named turn**: "announce it explicitly, apply 2–3 adversarial techniques from the elicitation catalog (Pre-mortem, Persona panel, Red vs blue); all-`[?]` in §7 is the same failure as skipping." Replaces the "at the END" prose that had no structural trigger.
- `src/agents/reviewer.md` — new **Discovery conclude** floor item: when `docs/product.md` is in the diff, confirm §7 is populated (not all-`[?]`); blank or all-`[?]` is a finding.

---

## [5.10.3] — 2026-06-13

### Changed

- `src/agents/reviewer.md` — added `paragraph necessity` to the `## Doc & prose quality` floor item: each block earns its place; a paragraph that only archives the author's reasoning, records a decision the reader doesn't need at this site, or restates context homed elsewhere is a finding. Closes the 8D-identified Reviewer checklist gap (docs-bloat root cause, 5.9.3 / 5.9.4).

---

## [5.10.2] — 2026-06-13

### Added

- `src/quality/version-skew.mjs` + registered `build`-beat quality row — mechanical check that the installed `.ai-dev/VERSION` stamp matches the vendored `.ai-dev/tooling/VERSION`; no-op on a source checkout where the stamp is absent. Closes the gap noted in `docs/decisions/upgrade-migration.md` (the row was planned but shipped as prose-only auditor dimension).
- `PROTOCOL.md` — `upgrade` added to the side-tools enumeration (was referenced in the understand-beat clause but absent from the list); one line pointing to `orchestrator's ## Upgrade`.

### Changed

- `.ai-dev/backlog.md` — added "Gitignore tooling" epic (Operator request 2026-06-13): three variant designs for removing the vendored tooling tree from downstream repos while keeping enforcement.

---

## [5.10.1] — 2026-06-13

### Added

- `docs/contracts/regression-protection.md` — Must-work row recording the ratchet as a product promise: a confirmed defect, once fixed, cannot recur silently — the fix carries the test that pins it (rule home: the 5.9.6 floor, `src/agents/builder.md`).

---

## [5.10.0] — 2026-06-13

Downstream upgrade + migration channel (decision base: `docs/decisions/upgrade-migration.md`). PR 4 of the research batch.

### Added

- **Version stamp + upgrade marker** — the installer writes `.ai-dev/VERSION` every run; on a version change it writes the transient `.ai-dev/UPGRADING.md` marker (old → new, chained bumps preserve the origin) and prints a prominent "restart your session" notice.
- **Migration notes** — `.ai-dev/upgrades.md` laid down every run from the new single home `src/adapter/upgrades.md` (per-version migration notes the session can read; previously trapped under the read-denied tooling dir).
- **`## Upgrade` procedure** (`src/agents/orchestrator.md`) — the understand beat finds the marker and offers the migration (declinable); applicable `(old, new]` notes run through the loop; marker deleted last. Installer half `[mechanical]`, session half `[persona]`.
- **Cross-platform breadcrumb** — the installer writes a minimal marker-delimited pointer to the INACTIVE platform's load surface (`CLAUDE.md` / `AGENTS.md`): a session on a platform the project wasn't wired for now sees the protocol exists and can offer the switch (fixes the OpenCode-installed-opened-in-Claude blind start). Never clobbers a real file; stripped when that platform is wired.
- `## Audit` — version-skew dimension (`.ai-dev/VERSION` vs the tooling's recorded version).
- PROTOCOL.md understand beat — one clause pointing a present upgrade marker at the `## Upgrade` procedure.

### Fixed

- **Vendored installer self-rerun** — `node .ai-dev/tooling/src/adapter/install.mjs <target>` failed with ENOENT (the three paths `layDownCore` reads were never vendored); the documented in-place upgrade command now works. RED-first regression pin added.
- **Hook prune** — the Claude hook merge replaces a stale ai-dev hook group (recognised by a stable path marker) instead of accumulating duplicates across versions.
- `package.json` `files` gains `CHANGELOG.md` (the npx package told upgraders to read a CHANGELOG it didn't ship).

---

## [5.9.6] — 2026-06-13

Ratchet + verification scenario promoted to the role floor (decision base: `docs/decisions/ratchet-and-verification.md`; Operator fork decision: floor, not module).

### Added

- `src/agents/builder.md` floor — **Verification scenario** plan item (user-facing change: one `trigger → action → observable result` path, human-performable now); **Ratchet** (any confirmed defect fix carries a RED-first pinning test or a recorded deferral); **Exhaust the verification ladder** (automatable-first; offer the UI driver where the stack has one; the Operator gets only the machine-unreachable residual with reasons — "Test the app" is never a deliverable).
- `src/agents/reviewer.md` floor — Tests item picks up the ratchet; **Verification not offloaded** item; scenario-walk clause in the Runtime verification ladder.
- `src/agents/orchestrator.md` — Setup step 5: UI/E2E automation joins the proposed tool classes for a GUI stack; Audit step 2: **verification coverage** dimension (registered suite vs actual stack).

### Changed

- `src/modules/test-methodology/` — superseded gate-caught ratchet rows deleted (one home: the floor); remaining rows are genuine depth.
- `src/modules/ui-ux/builder.md` — User-flow check re-anchored as the GUI deepening of the floor's verification scenario.
- Backlog: six entries resolved by 5.9.2/5.9.5/5.9.6 removed.

---

## [5.9.5] — 2026-06-13

Mechanics: CI-suite parity + assembled-artifact drift guard (decision base: `docs/decisions/ci-suite-parity.md`, `assembled-drift-guard.md`).

### Added

- `src/adapter/install-drift.test.mjs` + `tools.json` row `install-drift` — re-assembles all seven generated markdown artifacts under the tracked config, byte-compares against committed, orphan-checks every generated dir (verified RED-first).
- `docs/architecture.md` — class rule: every committed generated artifact carries a mechanical drift guard.

### Changed

- `.github/workflows/checks.yml` — CI invokes the quality runner wholesale (`build` + `review` beats, semgrep via pipx) instead of a hand-picked 2-of-12 subset; future registry rows are picked up with zero CI edits.
- `src/agents/orchestrator.md` — Setup step 5: CI offer is "via the runner, never a re-listed subset"; Your seat: confirm CI green via `gh pr checks` before executing an authorized merge; Audit step 2: no-drift dimension defers to the mechanical rows, auditor's residual is inventory completeness + CI parity.
- Removed the stray `.opencode/plugins/ai-dev.mjs.gen` orphan.

---

## [5.9.4] — 2026-06-13

Template blockquote cleanup — 8D D5/D7 fix.

### Changed

- `src/templates/product.md`, `contracts.md`, `threat-model.md`, `architecture.md` — each instruction blockquote gains `*Delete this guidance block when filling.*` Prevents filled docs from retaining instruction prose (the root cause of the docs-bloat 8D).

---

## [5.9.3] — 2026-06-13

Docs trim pass — all prose cut to one sitting.

### Changed

- `docs/product.md` — §1 dial paragraph to one sentence; §3 intro folded; §6 rework-metric bullet tightened; §5/§7 verbose bullets cut; blockquote header removed.
- `docs/architecture.md` — blockquote header removed.
- `docs/contracts/` — seven contracts trimmed (automated-quality-tooling, disciplined-pipeline, dual-harness-from-one-source, one-command-install, product-foundation, project-boundary, regression-protection).

---

## [5.9.2] — 2026-06-13

Downstream-feedback protocol fixes (ad-md-editor field report).

### Changed

- `orchestrator.md ## Project inception` — README added as a day-zero artifact for OSS projects; step 6 extended with CLI/GUI walking skeleton distinction (CLI = one invocation; GUI = full cycle including configuration) and external-service config verification requirement.
- `src/modules/ui-ux/builder.md` — `[light]` User-flow check bullet: enumerate critical path as (step → UI element → action) for ≥3 steps at plan time.
- `src/modules/ui-ux/reviewer.md` — two `[light]` bullets: Init order / lifecycle (DOM element must exist before initializer runs) and External-service config verification (test action must exist in UI; absent = finding).
- `.opencode/opencode.json` — `edit`, `bash`, `webfetch` permissions set to `allow` (baseline canonical form; Operator-confirmed).
- Both platforms reassembled.

---

## [5.9.1] — 2026-06-13

Git-init gap — the protocol's missing foundation step.

### Added

- `install.mjs` exports `hasGitRepo(targetDir)`; the CLI prints a prominent warning (never a block) when the target has no `.git` repository — names the suggested init command and points to setup's interactive offer.
- `install.test.mjs` — two new tests for `hasGitRepo` (repo-less and `.git`-present fixtures).
- `orchestrator.md ## Setup` gains **step 0** (the repo check): no `.git` ⇒ one structured offer to init or proceed; forge half named; this is the single home of the repo-bootstrap offer.
- `INSTALL.md` documents the new warning and its non-blocking intent.

### Changed

- `PROTOCOL.md` understand beat: one clause — no repository at all ⇒ offer the repo bootstrap first (setup's step 0).
- `orchestrator.md ## Project inception` day-zero ops: the repository itself is day-zero ops; by inception's time it must exist (cross-reference to step 0).
- `.opencode/agents/ai-dev.md` reassembled to match.

---

## [5.9.0] — 2026-06-13

Parallel feature work — worktree-per-feature design + minimal enablement.

### Added

- `src/agents/procedures/parallel-work.md` — the operating procedure for concurrent features: worktree-per-feature inside the root (`.ai-dev/worktrees/<topic>/`), disjoint-surfaces rule, serial ship beat with recut-on-advanced-main, ship-time cleanup. **Pilots the on-demand procedure pattern**: the orchestrator carries a one-line trigger; the body loads only when parallel work is invoked (`docs/architecture.md` names it the third role-content element).
- `docs/decisions/parallel-work.md` — the design record: what parallelizes (Builder/Reviewer wall time), what honestly serializes (Operator approvals, merges, the ship beat), the enforcement caveat (never seat a standalone session inside a worktree — the vendored tooling is absent there), what is consciously deferred (no scheduler, no automatic surface detection).

### Changed

- Installer gitignores `.ai-dev/worktrees/` in downstream projects (alongside `state/` and `feedback/`).

---

## [5.8.1] — 2026-06-12

Token economy — cut redundant agent work without touching the guarantee floor.

### Changed

- Builder continuation is now the **default** across steps of one feature (plan→build, build→address-findings) where the platform offers a continue primitive; fresh-spawn is the fallback (OpenCode records `null` → falls back automatically). The Reviewer is still always a fresh spawn.
- New orchestrator rule: **spawn prompts point, never restate** — an on-disk artifact (plan, verdict) is referenced by path + delta, never copied into the prompt (invariant 6 applied to prompts).
- New reviewer rule: a **re-review round** scopes to the named findings' fixes plus any unexplained change in the diff — not a second full derivation; reconciled with the fresh-read rule (identical bytes stand on round 1).
- Dogfood: this repo's own config migrated to `.ai-dev/config.json` (its own 5.8.0 migration); stale `ai-dev.config.json` references fixed in `dev-setup.fm` (both platforms), `tool-map.json`, `modules/registry.json`; agents and commands reassembled on both platforms.

---

## [5.8.0] — 2026-06-12

Stealth layout — protocol artifacts moved into `.ai-dev/`; downstream project root is now clean.

### Changed

- Installer no longer places `PROTOCOL.md`, `src/agents/`, `src/modules/`, `src/quality/`, or `docs/` templates in the downstream project root — all protocol internals live under `.ai-dev/`.
- Config moved from `ai-dev.config.json` (project root) to `.ai-dev/config.json`.
- Quality runner lands at `.ai-dev/quality/run.mjs` in downstream projects.
- Doc templates (`product.md`, `architecture.md`, etc.) are no longer laid down at install time; they are created on demand by product discovery and doc bootstrap from `.ai-dev/tooling/src/templates/`.
- `CLAUDE.md` imports updated: `@.ai-dev/PROTOCOL.md` and `@.ai-dev/tooling/src/agents/orchestrator.md`.
- OpenCode wiring: `instructions: [".ai-dev/PROTOCOL.md"]`; `AGENTS.md`: `@.ai-dev/PROTOCOL.md`.
- `deny-rules.json` allow-list and inject intent text updated to new config path.
- `INSTALL.md` gains a `### MINOR 5.8.0` migration section for existing downstreams.

### Migration (existing downstreams on 5.0–5.7)

```sh
mv ai-dev.config.json .ai-dev/config.json
npx github:aadegtyarev/ai-dev-protocol . --platform <platform>
```

---

## [5.7.1] — 2026-06-12

Pre-downstream audit dispatch (Opus auditor, WARN) + the missed-audit-offer 8D prevention.

### Fixed

- **Self-report issue filing targets the wrong repo** (audit WARN-1) — the emit step now mandates the explicit flag `gh issue create --repo aadegtyarev/ai-dev-protocol`: a bare `gh issue create` inside a downstream checkout defaults to the downstream's own tracker and would publish the failure report to the wrong, possibly public, place.
- **Raw self-reports were committable** (audit WARN-2) — `.ai-dev/feedback/` (pre-leak-sweep failure context) is now gitignored: the installer's gitignore step covers it (`ensureTransientsGitignore`, +2 install tests) and this repo's own `.gitignore` carries the line. A crash before the post-send delete, or a blind `git add -A`, can no longer commit an un-swept report.
- **Stale module count in `docs/architecture.md`** (audit WARN-3) — the hardcoded "Twelve modules ship" drifted from the 13-row registry; the sentence now points at the registry without restating a count.

### Added

- **Audit-cadence read rides the mandatory ship step** (8D missed-audit-offer, D5/D7) — the post-merge state update now also refreshes the last-audit marker and features-since count; at ≥5 the audit offer goes into the same ship relay. Root cause: the cadence counter had no enforced home and no reading step — an unfelt quantity that died at a state rewrite.

---

## [5.7.0] — 2026-06-12

### Added

- **Downstream self-report — the emitting half of `downstream feedback`** (`orchestrator.md`, ships to every install). When the protocol itself fails a downstream session (a deny blocking legitimate work, a gap, an unsatisfiable gate, contradictory instructions), the session writes `.ai-dev/feedback/<slug>.md` immediately — the failure through its own eyes: what was asked, what the rule said, where it broke, **what its context held at that moment**, what it did instead, the cost. Marked honestly as a symptom report by the model that just failed, never a diagnosis.
- **Direct issue filing with leak control** — with the Operator's explicit OK the report is filed as a GitHub issue against the upstream protocol repo. Mandatory before any send: a leak-sweep (secrets, credentialed URLs, internal paths, project names, personal/business content — stripped to the protocol-level symptom) and **showing the Operator the exact title and body to be published, verbatim** — approval is on the shown text, never a paraphrase. Declined or no `gh` ⇒ the Operator carries the file by hand.

### Changed

- `## Downstream feedback` restructured into the two halves (emit / intake); the intake now also accepts a filed issue, not only a pasted report. `## When something is off` protocol-gap bullet now routes to the emitting procedure. PROTOCOL.md side-tool line updated.

---

## [5.6.0] — 2026-06-12

### Added

- **`elicitation` capability module** (BMAD-inspired, our shape) — angle-changing inquiry at decision points: a drafted brief section, a feature plan, an idea captured to the backlog. A compact ~12-technique catalog (`src/modules/elicitation/catalog.md` — pre-mortem, inversion, user role-play, persona panel, scale shock…) is the one home; the Builder gets a plan-beat fragment; the interactive offer is the orchestrator's new `## Elicitation` (PROTOCOL.md side-tool line added). The entry rule, per the Operator: **depth choice first, always** — light (one technique, default) / deeper / skip; one technique per round; never a block; stop at the first "enough". Closes the capture-time-elicitation backlog item.
- **Browser walkthrough in the ui-ux reviewer fragment** — `[rich]` item: where the environment carries a browser tool (Playwright-class), the Reviewer drives the live surface (screenshot, accessibility snapshot, console, primary-path click-through) with captured evidence per finding; honest residual named where no browser tool exists.
- **`docs/decisions/bmad-adoption.md`** — the research artifact: what BMAD does, what was adopted (three mechanics), what was consciously not (the 12-agent roster, story-file pipelines, the 79-technique catalog size).
- **README `## Acknowledgements`** — credits the projects whose ideas the protocol reshaped: BMAD Method (nominative reference per its trademark guidelines; no code copied), the 8D discipline, Keep a Changelog + SemVer.

---

## [5.5.1] — 2026-06-12

### Fixed

- **Installer adds `.ai-dev/state/` to downstream `.gitignore`** — follow-up to 5.5.0: `install.mjs` calls `ensureStateGitignore` idempotently on every install/re-run. Six new install tests: per-platform `.gitignore` check + F4 migration test (installer succeeds over prior-version artifacts such as `WORKFLOW.md` and `.ai-pm/`, without deleting them).

---

## [5.5.0] — 2026-06-12

### Added

- **State fallback on fresh clone** (`PROTOCOL.md` step 1, `orchestrator.md`) — if `.ai-dev/state/current.md` is absent (fresh clone or first session), fall back: `git log --oneline -5` for recent context, `gh pr list` for any open PR awaiting merge.
- **Two-phase state update per feature** (`orchestrator.md`) — (1) after opening the PR: write "PR #N open, awaiting Operator merge"; (2) after merge confirmed: write "no active branch". Closes the window where a resumed session had no signal about a pending PR.
- **Skip fetch-verify for state-only PRs** (`orchestrator.md`) — post-merge content verification skipped when the PR carried no code or doc artifacts.

### Changed

- **`.ai-dev/state/current.md` is now gitignored** — local-only pointer; not committed to git. Downstream installer update (adding `.ai-dev/state/` to the project's `.gitignore`) is a follow-up item.

---

## [5.4.1] — 2026-06-12

### Fixed

- **Stale comment in `src/adapter/modules.mjs`** — removed archaeology phrase "Slice 2 will branch on it" from `effectiveToggle` JSDoc; the historical build phase is long done.

---

## [5.4.0] — 2026-06-12

### Added

- **Version-bump confirmation** (`orchestrator.md` `## Your seat`) — before committing a MINOR or MAJOR version bump, the Orchestrator confirms the semver level with the Operator: names the contract change and the new version. `[persona]`
- **Release rollback procedure** (`orchestrator.md` `## Your seat`) — named procedure: revert the squash-merge commit on main, re-tag the prior version, push. `[persona]`

### Fixed

- **merge-gate: tag pushes no longer blocked** — `git push origin v5.3.1`, `git push origin refs/tags/…`, and `git push --tags origin` previously triggered the unstamped-review deny (engine fell back to HEAD branch when the push named an explicit non-slashed ref). Fix: new `isTagPush` helper in `engine.mjs` short-circuits both `mergeWithUnstampedReview` and `mergeTopicUnresolvable` for tag pushes; new `pushHasUnparsedExplicitRef` guard prevents the HEAD fallback when an explicit unresolvable ref is present. Three new parity test cases added.

---

## [5.3.1] — 2026-06-12

### Removed

- **`opaque-bash-boundary-risk` ask rule** — removed from `deny-rules.json`, `engine.mjs`, and `parity.test.mjs`. The rule confirmed inline-interpreter + boundary-token commands before running. In practice it interrupted legitimate autonomous work without proportionate gain. Operator decision: friction cost exceeds heuristic value.

---

## [5.3.0] — 2026-06-12

### Added

- **`modularity` capability module** — boundary discipline for a change that touches a module interface or introduces a new inter-module dependency: Builder names the boundary and checks the dependency direction against `docs/architecture.md`; Reviewer verifies no undocumented cross-boundary dependency was introduced and the linter (if registered) is green. `[light]` depth: boundary named + dependency direction; `[rich]` adds linter gap flag + cohesion check. Defaults: `code: rich`, `docs: off`, `mixed: light`.
- **`plan-adversary` capability module** — adversarial self-probe of the plan draft before build: Builder attacks its own plan (most plausible failure, missing scenarios, fuzzy criteria replaced, hidden structural forks surfaced); Reviewer checks that the probe was present and honest. `[light]` depth: failure and missing-scenario check; `[rich]` adds fuzzy-criteria replacement and fork surfacing. Defaults: `code: rich`, `docs: light`, `mixed: rich`.
- **`downstream feedback` side-tool** (`orchestrator.md ## Downstream feedback`) — procedure for triaging a downstream problem report into this repo's backlog or a GitHub issue: Operator carries the report, session maps it to the protocol's structure, deduplicates against the backlog, drafts a protocol-level entry (not raw downstream content), and opens a GitHub issue only on explicit Operator authorization. Design rationale at `docs/decisions/feedback-loop.md`.

---

## [5.2.0] — 2026-06-12

### Added

- **`profile: yolo`** — a named escape hatch explicitly outside the reliability guarantee. `full`/`lite`/`solo` are the guarantee profiles (floor enforced: independent Reviewer, merge stamp, Operator's explicit merge word). `yolo` turns the merge-gate off and requires no Reviewer; the Operator's explicit merge word is the one floor that remains. Compensating control: the audit cadence is `yolo`'s primary safety net. Requires explicit acknowledgement in the setup dialog — absent/unrecognised config still resolves to `solo`, never `yolo`. Touches: `PROTOCOL.md` (profile section reframed, invariant 3 carve-out, enforcement gate-off note); `engine.mjs` (`projectProfile` recognises yolo, `mergeWithUnstampedReview` gate-off, `orchestratorWritingContent` relaxed set); `orchestrator.md` (yolo lane in profile routing, yolo in setup dialog with explicit-acknowledgement requirement); `docs/contracts/disciplined-pipeline.md` + `cross-session-enforcement.md` scoped to guarantee profiles; `docs/product.md` + `README.md` speed-dial description. Tests: `rigor-profile.test.mjs` yolo cases; `parity.test.mjs` yolo push → allow.

---

## [5.1.0] — 2026-06-12

### Added

- **`explore-a-codebase` contract point in `tool-map.json`** — registers the neutral read-only exploration act with per-platform resolutions: Claude Code's native `Explore` subagent type (harness-enforced read-only); OpenCode task with read-only framing (no built-in Explore primitive — `[persona]` on that platform). One-line note added to `docs/architecture.md` Extension points. Closes the tool-map gap noted in the backlog.
- **OpenCode boundary-strict default permissions** — `wireOpenCode` in `install.mjs` now sets `{ edit/bash/webfetch/question: allow }` in the generated `opencode.json`. The protocol plugin is the sole project-boundary guard; native `permission` is the speed dial for inside-the-boundary tool calls. Division of labor documented in `INSTALL.md`. Honest residual named: bash boundary is best-effort (opaque escapes handled by the new ask rule below); edit/read/write checks are exact; webfetch=allow for research.
- **Opaque-bash boundary-risk classifier** (`engine.mjs` + `deny-rules.json`) — new `opaqueBashBoundaryRisk` predicate (class: ask, never deny) fires when a bash command combines an opaque inline-interpreter (`python3 -c`, `node -e`, `perl -e`, `ruby -e`, `bash/sh -c`, base64-decode-pipe-shell, curl-pipe-shell, eval-subst) with a boundary-relevant token in the opaque region (absolute path, `../`, `https://`). Anti-ritual tuning: `python3 -c 'print(1)'` → no boundary token → no flag. Heuristic ceiling stated honestly: raises the bar on obvious escapes, not a sandbox. `[persona]` on OpenCode (no ask-return). Three parity test cases added.
- **Old-protocol migration runbook** (`INSTALL.md` `## Upgrade → Old-protocol migration`) — 5-step mechanical guide: bump + re-run the installer, rename old surface (MAJOR 5.0.0 steps), run doc bootstrap in source mode, delete old docs, accept the closing audit.
- **Doc bootstrap old-protocol source mode** (`src/agents/orchestrator.md` `## Doc bootstrap` step 2) — when old-protocol docs are present, the Builder drafts from them as primary source (compressed into new templates under new ceilings); tree is the verification ground; contradictions surface as findings; old docs deleted once superseded; comment de-water pass; closing audit offered. No new orchestrator section (length watch).

---

## [5.0.0] — 2026-06-12

### Changed (breaking)

- **RENAME: `ai-pm` → `ai-dev` throughout** — the protocol is AI-assisted development, not just project management. Full rename of the "pm" nomenclature: repo `ai-pm-protocol` → `ai-dev-protocol` (GitHub redirects the old URL); package + bin name; the `/pm-setup` command → `/dev-setup`; agent IDs `ai-pm`→`ai-dev`, `pm-builder`→`dev-builder`, `pm-reviewer`→`dev-reviewer`; config file `ai-pm.config.json`→`ai-dev.config.json`; state directory `.ai-pm/`→`.ai-dev/`. No behavioural change — pure mechanical rename. **Migration:** see `INSTALL.md ## Upgrade → MAJOR 5.0.0`.

---

## [4.20.1] — 2026-06-12

### Fixed

- **The resume pointer no longer restates merge-state** (8D outcome — the pointer read "4.19.1, #46/#47 pending" while main was 4.20.0 all merged). Root: `.ai-pm/state/current.md` restated facts homed elsewhere — version (git tag / `package.json`), shipped-set (CHANGELOG), PR state (the forge) — and a restated fact drifts (invariant 6, in the protocol's own resume file); the ship step wrote the version at ship-time while it only goes false at merge-time, and the conveyor masked the staleness by rewriting the pointer each feature, so it surfaced only when work stopped at a merge — exactly the clean-resume moment. Fix: the orchestrator ship step says the pointer **points, never restates** (version/ships/PR-state → canon), carrying only the queue, the cadence markers, and non-canonical conventions; the post-merge sync — which already fires at the truth-flipping event — refreshes the active line. The live pointer is rewritten to follow the rule. The audit's single-source-drift dimension now scopes the state file.

---

## [4.20.0] — 2026-06-12

### Changed

- **Proportionality by default** (the ceremony-drift 8D outcome) — the default rigor profile flips `full`→`solo`: absent/unrecognised ⇒ `solo` (the orchestrator builds directly, plans are fixup-grade). The protocol named every UNDER-rigor failure and no OVER-rigor one, so ceremony was the unpunished attractor; the dial cuts ceremony, the FLOOR holds rigor unchanged in every profile — a fresh separate Reviewer, the stamp, the merge-gate, and the Operator's explicit merge word carry zero profile dependence (verified in code: the only profile-gated predicate is the orchestrator-content deny). Setup leads the profile dialog with `solo`, naming BOTH costs honestly (ceremony burns the Operator's tokens/time; speed costs one independent build-side context), with `full`/`lite` as a conscious opt-up; a mode-switch-by-words clause flips the profile mid-project without a full setup re-run.

### Added

- **Over-ceremony named as a defect** — the profile definition now states that ceremony above a change's risk is a defect the Operator pays for, not extra virtue; a routing-trigger line classifies each change's lane first; the ship relay names the feature's cost (spawns, wall time). The fix-loop ceiling widens to ANY repeated-failed-attempt loop — review findings, debugging experiments, deploy retries (two failed attempts on a live remote target) — and its escalation carries a declinable **8D offer** (the mirror trigger lands in `## 8D`): a repeatedly-failed fix is the symptom-chasing signal that warrants root-cause analysis.

---

## [4.19.2] — 2026-06-12

### Fixed

- **Merge-gate parsing** (the 8D mechanical findings + a review-found HIGH): the topic now resolves from the PUSHED ref first (span-anchored, quote-masked, refspec-aware; HEAD only for bare commands) — pushing branch A from branch B no longer consults the wrong stamp; heredoc bodies are data unless a shell interprets them (fail-toward-deny on ambiguity) — prose about pushes stops tripping the gate, a bash heredoc push still does; **a topic path-traversal guard** at the single fs choke point — a crafted ref (feature/../EVIL) could escape the reviews dir and turn an unstamped push into an ALLOW via a planted file (pre-existing, reviewer-proven end-to-end; now DENY, test-pinned); nested branch names rejected outright (strict, not clever); a heredoc opener no longer yields a phantom write-target. The undocumented Validation stamp label dropped (pre-4.0 artifact, no live consumer). merge-gate 24→52, parity 64→67.

---

## [4.19.1] — 2026-06-12

### Fixed

- **Git discipline from the stacked-merge 8D** — three orchestrator-procedure rules closing the conveyor's live failures: stage named paths only (a blind `git add -A` leaked a transient stamp into durable history — contained same-day by a cleanup commit); a remote merge is asynchronous until verified (a rebase onto a stale fetch produced a tree silently missing the prior PR — caught by the forge refusing the merge); retarget the next stacked PR to main BEFORE merging the current one (a merged base-branch deletion auto-closes dependents). Two mechanical gate findings recorded in the backlog (topic-from-HEAD resolution; heredoc verb false-positive). 8D run-note closed at D8.

---

## [4.19.0] — 2026-06-12

### Added

- **Verification ladder** — "didn't run it" stops being silent: every Reviewer verdict carries a mandatory second stamp line, `Runtime verification: <rung — evidence / NOT RUN — reason>`, rungs **static · suite · entrypoint · exercised · target** — the highest the review *actually performed*, with its evidence cite; claiming a rung without evidence is the hallucinated-compliance failure the Cite-rule already names. `NOT RUN — <reason>` is legal and honest; silence is not. Honestly labelled: the merge-gate reads stamp presence only and never parses the line — `[persona]`, held by the checklist and the auditor's honesty dimension. The disciplined-pipeline contract carries the rung promise.
- **BLOCKED return** — a spawned role that cannot honestly complete its deliverable returns BLOCKED naming exactly what is missing and what would unblock: never a best-effort artifact dressed as done (Builder), never a stamp or guessed verdict (Reviewer). The orchestrator treats BLOCKED as a failed gate's sibling — fix the blocker when it is yours, else stop and report; retry and ceiling bounds unchanged; never substitute. `[persona]`.
- **Session-reset hygiene** — the checkpoint-and-reset discipline gets its trigger (felt degradation — repeated re-reads, contradictory recall, lost thread — or a natural boundary) and checklist (state pointer current · plan note ticked · work committed-or-named); a fresh session resumes losslessly from `.ai-pm/state/current.md`. `[persona]`.

---

## [4.18.0] — 2026-06-12

### Added

- **Platform switch** — the expected migration UX exists: a session whose own tool surface says it runs on a platform the config doesn't name offers (declinable, never a block) to wire this platform — the idempotent install (both wirings coexist; each harness loads only its own surface), the config `platform` flip, **model revalidation** (`auto`/`session` re-resolve per platform by design; a dead concrete pin that differed from the session model recorded a *cross-model* wish — the re-ask leads with the new catalog's cross-model candidates; no second model ⇒ said plainly, no fake independence), and the install-agents re-bake (OpenCode bakes the reviewer model — without it a dead pin survives the config fix). `orchestrator.md ## Setup`, `[persona]`.
- **Loop ceilings** — grinding has a hard stop: 2–3 fix attempts on one finding ⇒ stop, record state, escalate; two Builder↔Reviewer rounds on one finding ⇒ the Operator's judgment call, not a third round. Siblings of the crash-retry line in `## When something is off`. `[persona]`.

### Fixed

- **`no-product-brief-discover` fired for nobody** — the predicate was presence-only while install lands the brief TEMPLATE, so the installed-but-undiscovered project (the nudge's whole audience) never saw it. `productBriefFilled` now treats "present but still the template" as no-brief via two literal substring markers (no regex, fixed path, read-only, unreadable ⇒ nudge): a forward-looking `<!-- ai-pm:template -->` sentinel in the template (discovery deletes it on fill) plus the §0 placeholder as the legacy layer — byte-identical across every shipped template version, so existing installs detect too. +3 parity ordering stages, +4 opencode-inject side-effect cases; zero existing assertions changed.

---

## [4.17.0] — 2026-06-12

### Added

- **Threat discovery** — the product-level threat model gets its standing procedure (the 4.16.0 inception/bootstrap *sketch* is the seed; this is the depth): a template (`src/templates/threat-model.md` — actors / assets / trust boundaries / abuse cases / consciously-out-of-scope / the "currently exposed" conclusion; ~40–80 lines of normal prose, secret locations never values) instantiated by the procedure and never auto-landed by install; an orchestrator `## Threat discovery` section (one axis per round; the conclude phase must be able to say "this is currently exposed" — a model unable to say it is theater); the threat-model module cites the standing document where it exists instead of enumerating from scratch, and a security-relevant change contradicting it is a finding; the understand beat reads it where present. `[persona]`.
- **npx distribution** — `npx github:aadegtyarev/ai-pm-protocol-uni <target-dir> --platform claude|opencode` installs with nothing cloned: `package.json` publish-ready (`bin`, `files` whitelist — state/docs/harness dirs never ship, `license`/`repository`/`engines`, `private` dropped), shebang + a realpathed CLI-entry guard in `install.mjs` (an npm bin shim invokes through a symlink; without the realpath the npx run silently no-oped — reproduced, fixed, e2e-verified). README leads with the npx form. Registry publish stays external (the Operator's npm account).
- **Autonomy-decision journal** — an autonomous announce-then-act call is recorded (the fork, the decision, the canon) in the active plan's progress note at decision time, and ship copies the "Decisions made under autonomy" digest into the PR body before the plan is deleted — chat scrollback stops being the only trace of decisions taken while the Operator is away. `[persona]`, honestly labelled.

---

## [4.16.0] — 2026-06-12

### Added

- **Eight capability modules** — the axis goes 2→10: `test-methodology` (unit-unreachable-layer coverage named in the plan, full-composition integration test, real-browser UI exercise for web e.g. Playwright, gate-caught-bug test-first ratchet), `ui-ux` (adaptivity · accessibility · responsiveness · clarity · adverse states; honours `docs/hmi-conventions.md` where present), `research-methodology` (source ladder, recency vs real dependency versions, triangulated load-bearing claims, confidence + date), `debug-methodology` (reproduce-before-fix, one variable at a time, cause not symptom, debuggable-by-design), `performance` (named scale, no unbounded paths, no N+1/O(n²) on user-scale data, measure-don't-guess), `database` (every schema change a migration, reversible-or-named, rollout-compatible, DB-level integrity), `i18n` (inert single-locale; externalized strings, locale APIs, per-language plurals), `concurrency` (atomic check-then-act, idempotent retries, ordering assumptions, stress/property test over mental interleaving). All self-gating, per-kind defaulted.
- **Assembler: per-kind default-OFF** — the registry may default a module off for a kind (a `docs` project gets no UI/DB/debug/perf/test module); the fail-safe holds: any *named* config value, malformed included, resolves ON — only the registry, our data, may default a kind off. 13 new install-modules cases pin every branch.
- **`## Project inception`** — greenfield onboarding mirror of doc bootstrap (bootstrap reads the tree; inception records the day-zero decisions): researched stack decision → `docs/decisions/stack.md`, environment constraints, day-zero ops (deploy, secrets home, backup + restore-tested, failure visibility), license, architecture seeded from the decisions, walking-skeleton first feature, threat sketch (actors/assets/boundaries → `docs/threat-model.md`) — the sketch mirrored into doc bootstrap for brownfield.
- **Brownfield truth reconciliation** — product discovery gains a draft-first **reconstruction mode** for an Operator who declares the product unfamiliar (provenance-labelled hypotheses from the tree, corrected section by section); doc bootstrap gains a **brief cross-check** step (a factual brief↔tree contradiction surfaces with resolution options — correct / roadmap / investigate); the product-foundation anti-retrofit line scoped honestly (the ban targets confirmation theater when the product is *known*).
- **Audit security dimension** — whole-tree threat-model sweep (committed secrets, injection-prone constructs, fail-open paths, access checks) + known-CVE dependency check; the per-diff module is blind to legacy that predates it. Security lifecycle now: per-change (module) → day-zero (sketch) → cadence (audit) → incident (8D).
- **Reviewer floor sharpened** — Hygiene gains **over-engineering** (complexity paid for by a present need) and **naming** (names in the codebase's own vocabulary; a noise name is a finding); Security gains the untoggleable **secret-value floor**: a password/key/token value in ANY committed artifact — code, config, docs, examples, tests, commit messages — blocks regardless of module toggles. Setup's toolkit names a gitleaks-class secret scanner; setup also gains a declinable **CI-wiring offer**.

### Fixed

- **De-water pass** (doc-quality audit backlog half): PM→Operator rename completed across `docs/contracts/` + `decisions/minimal-core.md` (F1); README states the literal install command, submodule framing dropped (F2); `fixup` got its procedure home — orchestrator `## Fixup` (F3); summary-restate creep cut (frameworks sentence single-homed, README roles/dial compress-and-point, product-foundation guarantee-only); contract files point at `merge-gate.test.mjs` instead of inventorying it; template blockquote 170→57 words; 100+-word bullets split; "old roles" archaeology dropped; registry fail-safe deduped; ship-beat contracts path fixed; INSTALL.md husk deleted. New floor style rule: ≈ one dash-clause per sentence in human-facing docs; size ceilings state the normal-prose proxy (a wall-of-text line games nothing).

---

## [4.15.0] — 2026-06-12

### Added

- **Doc bootstrap for brownfield onboarding** — an existing project adopting the protocol now has a procedure to fill its system canon from its own tree: the Orchestrator offers (declinable, never a block) to draft `docs/architecture.md` and any visible `docs/contracts.md` blocks as a normal loop feature — Builder (codebase-reader fold) reads the tree and drafts into the installed templates; Operator corrects in plain language; Reviewer checks the draft **against the tree** (an invented component or bound blocks). Structural guards against monstrous docs: explicit size ceiling (~60–120 lines; past ~150, cut inventory), fill-or-delete discipline, `[?]` for unmeasured bounds, point-don't-restate. Fires in three modes mirroring product discovery: at onboarding right after discovery (install → setup → discovery → doc bootstrap → first feature); lazily on a work request while `docs/architecture.md` is absent or still the unfilled install template; explicitly on request. Never on a greenfield (no tree to read). `orchestrator.md ## Doc bootstrap` (new section, sibling of `## Product discovery`); `PROTOCOL.md` beat-1 clause; `.opencode/agents/ai-pm.md` regenerated. `[persona]`.

---

## [4.14.0] — 2026-06-12

### Added

- **Stamp-authorship floor** — a new deny rule `orchestrator-writes-review-stamp`: the orchestrator session is denied writing into `.ai-pm/reviews/` (write/edit tools and the bash write forms), so where the platform resolves the actor (OpenCode) a stamp on disk implies a spawned role authored it — stamp fabrication stops being persona-only there. Claude carries no actor signal → fails open → persona, labelled honestly. **Never relaxed by profile**: the Reviewer seat never collapses into the orchestrator, even on `solo`. Deleting the stamp at ship (`rm`) is not a write and stays allowed. Engine predicate + registry rule/data + rigor floor tests (31) + parity divergence case (61); `PROTOCOL.md` map, `architecture.md`, `cross-session-enforcement` contract updated. Closes the product analysis finding 2b.

---

## [4.13.0] — 2026-06-12

### Added

- **`research` realized as a doing side-tool** — it was only named; now it has a procedure (orchestrator `## Research`): frame the question → route like building per the profile (`full` spawns the Builder's stack-researcher fold; `lite`/`solo` may research directly) → land a compact decision-base entry at `docs/decisions/<topic>.md` (the question, the answer, sourced evidence, the decision it grounds — never the search log) → relay in plain language. Retention: one file per topic, supersede-never-accumulate; standalone research is fixup-grade (shortened review, never skipped). Distinct from capability modules: research *does* work, a module shapes thinking.

---

## [4.12.0] — 2026-06-12

### Added

- **Proactive audit cadence** (Operator-designed) — the orchestrator now offers a whole-project audit after roughly five shipped features since the last run (the state pointer records it): a one-line declinable offer; on the go it runs while the Operator steps away and the findings come back dispatched. The cover for light profiles: `solo`/`lite` passes are fast, the periodic sweep catches what speed misses. `orchestrator.md ## Audit` + the `PROTOCOL.md` summary line.

### Fixed

Doc-quality audit (2026-06-12, whole tree, 16 findings) — the fix-now half:

- **CHANGELOG header** — was Russian on a durable English artifact (invariant 5) with a retired "для template" self-description; now English, present-tense.
- **`src/adapter/README.md` archaeology** — "two of yesterday's surfaces" line-counts, the retired-generator ghost-argument, and the `## Status` wall removed; the two integrity guards folded into the No-regex-drift section.
- **`PROTOCOL.md` enforcement map** — the remote in-place edit was misfiled under ask-class (the registry denies it); the `no-product-brief-discover` inject row was missing. The map now matches `deny-rules.json` row-by-row.
- **README shop window** — the 110-word "Product-first" wall broken up (the frameworks name-drop's one home is the product-foundation contract); `## Install` no longer leads with a duplicated status line.
- **Product brief** — §6 carries a measured review-pass cost (≈50–130k tokens per feature, median ≈76k, five reviews) instead of a bare estimate, and the rework-metric formula; §7 records that the dogfood runs on `profile: solo`. Spec Kit dropped from a §5 row it was never introduced in.
- **`docs/architecture.md`** — integration diagram column alignment.

Backlog-disposition findings (summary-restate creep, contract internals inventories, walls, the dash-density style rule) live in `.ai-pm/backlog.md` "Doc de-water pass".

---

## [4.11.1] — 2026-06-12

### Fixed

- **Backlog triaged against the minimal core** — 515 → ~150 lines: entries resolved by shipped versions removed (each removal spot-checked by the Reviewer against the repo); entries referencing the retired template structure re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals). State pointer updated; one invariant-5 fix (a Russian phrase in the English state artifact).

---

## [4.11.0] — 2026-06-12

### Added

- **Merge-gate: unresolvable topic asks, never passes** — a new ask-class rule `merge-topic-unresolvable`: a `git merge`/`push` whose branch topic cannot be resolved (detached HEAD, no branch ref in the command) previously failed OPEN past the stamp check; now the Operator is asked. Engine predicate + rule data + merge-gate tests (5 new cases) + a parity case through both shims; `PROTOCOL.md` ask-class row; `cross-session-enforcement` contract updated.
- **Review-time product-fit compensator for light profiles** — the Reviewer's floor checklist gains "Product fit under a light profile": under `lite`/`solo` the plan ceremony is trimmed, so a user-facing change is checked against `docs/product.md` at review-time; a contradiction blocks. `docs/product.md` §7 superseded accordingly (the descope note replaced by the current truth).
- **`## Upgrade` section in `src/adapter/INSTALL.md`** — the downstream upgrade story: bump, idempotent re-run, CHANGELOG read; MAJOR is the only bump that may break wiring.

### Fixed

- **README parity count retired** — the restated case count went stale twice (55→56→59); README now states the fact without the number (the count's one home is the test output).
- **Backlog hygiene** — three shipped items removed (ship-beat close — 4.9.0; adapter README re-export wording — 4.10.1; continue-a-subagent — 4.10.0).

---

## [4.10.3] — 2026-06-12

### Fixed

- **README `[who]` axis retracted** (Operator decision) — the 2×2 `[who] × [speed↔quality]` matrix claimed an unimplemented axis, and its tech-lead cell ("you see the diff") contradicted `PROTOCOL.md` "Never show code". Replaced with the honest one-axis `profile` dial block matching `docs/product.md` §1; intro spectrum claim replaced with "in plain product language, no code reading required". The axis is parked in the backlog as a hypothesis epic.
- **Parity count** — README said 55/55; the suite reports 56 (stale since 4.0.5).

---

## [4.10.2] — 2026-06-12

### Fixed

- **Product brief truth-fix** — `docs/product.md` corrected against three blocking Reviewer findings: removed the unimplemented `[who]` axis (only the `profile` dial exists); softened the "floor" language to "protocol-held discipline with mechanical backstops" (honest per §7); updated the 2026 competitor field (BMAD v6 Scale-Adaptive Planning, Kiro vibe↔spec toggle, GSD model profiles) and restated the residual gap as the honest compound (cross-platform core + hook-enforced floor + product discovery + honesty map).
- **Product brief scope additions** — §6 now includes success criteria and a token-cost estimate; §7 gains four new case-against entries (dial is table stakes, platform absorption risk, light-profile guarantee mismatch, N=1 dogfood evidence). Non-technical PM re-framed as hypothesis, not served segment.
- **Dual-home cleanup** — removed untracked template stubs `docs/contracts.md` and `docs/README.md`; real contracts live in `docs/contracts/`.

---

## [4.10.1] — 2026-06-12

### Fixed

- **Archaeology sweep** — removed version-specific "live-verified on opencode X.Y.z" and "replaces the inline shell+jq hook set" notes from `INSTALL.md`, `adapter/README.md`, `AGENTS.md`, `claude/hooks.json`. Replaced with present-tense facts.
- **OpenCode inline-definition terminology** — `INSTALL.md` parenthetical "(an own-export entry's deny fails open; an inline-defined one blocks)" contradicted `README.md`; rewritten as "a hook imported and re-exported is NOT registered by the loader" (consistent across all homes).
- **`docs/architecture.md` — removed "Open assumptions" section** — held verified-behavior notes, not open assumptions. Key inline-definition fact moved into the Integration section.
- **Dead citation** — `neutral-prose.test.mjs` comment cited removed `architecture.md "Open assumptions"` section; updated to cite `PROTOCOL.md ## Core and adapter`.

---

## [4.10.0] — 2026-06-12

### Added

- **`continue-a-subagent` optional contract point.** Builder *may* be continued across steps of the same feature (plan→build, build→address-findings) when the platform supports it, saving the re-read token cost. Reviewer is never continued — invariant 3 non-gate carve-out applies only to non-gate roles. Wired across: `PROTOCOL.md` invariant 3 (carve-out sentence) + `## Core and adapter` table (new optional row), `src/adapter/tool-map.json` (`continue-a-sub-agent`: claude=`SendMessage`, opencode=`null`, fallback=`spawn-a-sub-agent`), `src/agents/orchestrator.md` (guidance under `## Your seat`).
- **Reviewer checklist — adapter-realization check.** New bullet in the Tests item: for any change touching an enforcement class on a platform (deny / inject / ask), confirm the adapter has a mechanism that **realises** the verdict (not just that the engine decides it), and that a test drives the mechanism's side-effect. Pattern: `opencode-inject.test.mjs`.

### Fixed

- **`adapter/README.md` — own-export clarified.** "a re-exported plugin is not registered" was ambiguous. Now: "a hook imported and immediately re-exported is **not** registered by the loader, so the entry **defines** its hook functions inline (own-export)".
- **`parity.test.mjs` — misleading test-case name.** `no-config:non-change-prompt-allows` ran against the configured root; renamed to `configured:non-change-prompt-allows`.

---

## [4.9.0] — 2026-06-12

### Added

- **Builder checklist — Visual form item.** New item in `src/agents/builder.md`: for user-facing doc changes, name the intended visual form (table / list / diagram / prose) in the plan. Without it, form is left to the Builder's discretion and may not match Operator intent.
- **Ship beat close — state update.** `src/agents/orchestrator.md` ship section now explicitly lists updating `.ai-pm/state/current.md` as the final step of ship, after push and PR succeed.

### Changed

- **Stamp-gate resilience — split-line verdict accepted.** `src/adapter/engine.mjs` `stampOK()` now also satisfies the merge-gate when the verdict appears on the immediately-next non-blank, non-heading line after `## Code review:` (in addition to the canonical inline form). Edge cases still block: empty, `NOT YET RUN`, verdict after a blank separator, or a heading as the next line. Contracts `docs/contracts/disciplined-pipeline.md` and `docs/contracts/cross-session-enforcement.md` annotated. 8 new tests (`src/adapter/merge-gate.test.mjs`, now 17 total).
- **Readability sweep — `PROTOCOL.md` and `orchestrator.md`.** Prose walls replaced with Markdown instruction lists throughout `src/agents/orchestrator.md`. `PROTOCOL.md` de-watered: removed the "Build top-down — the guarantee before the mechanism" rhetoric paragraph from `## The loop`; trimmed `audit`/`setup`/`8D` side-tool descriptions to one-liners; removed two quality-toolkit bullets already homed in `orchestrator.md`.
- **Reviewer stamp format — explicit instruction.** `src/agents/reviewer.md` now states the verdict must appear inline on the same heading line (`## Code review: APPROVED`).

---

## [4.8.1] — 2026-06-11

### Fixed

- **README — spectrum and matrix.** Two corrections: (1) first paragraph no longer says "and you never read code" (accurate only for the PM end); replaced with "from a non-technical PM who never opens a file, to a technical lead who reviews the diff"; (2) the two separate paragraphs ("Speed↔quality dial" and "Who it is for") replaced by a single 2×2 matrix [PM/founder · Tech-lead] × [Prototype mode · Quality mode] with a floor sentence — the two-axis dial is now visible as a table, matching the product brief's §1 established differentiator.

---

## [4.8.0] — 2026-06-11

### Changed

- **`kind` axis redesigned: `software | documentation` → `code | docs | mixed`.** `code` = machine-executed artifact; `docs` = human-read; `mixed` = both equally (e.g. this protocol repo: docs are the deliverable, code is the transport). Clean rename — no backwards-compat aliases, no live downstream. Fail-safe unchanged: absent/unknown kind → `code` (strict side). Updated across every home: `PROTOCOL.md`, `src/modules/registry.json` (per-kind defaults for both modules), `src/adapter/modules.mjs` (`strictKind()` code + comment), `src/adapter/engine.mjs` (stamp-heading acceptance: `## Code review:` / `## Doc review:` / legacy `Validation:`), `src/agents/reviewer.md` (heading guidance), `src/adapter/install.mjs` (default), `ai-pm.config.json` (this repo reclassified to `kind: "mixed"`), `CLAUDE.md`, `AGENTS.md`, `README.md`, tests.

### Added

- **Estimation methodology** (`docs/decisions/estimation.md`): estimate by complexity, not file count. Three questions before quoting time (non-trivial logic? tests that could break? unresolved design?); time-bucket table per change type. Referenced from `src/agents/builder.md` plan checklist.

---

## [4.7.1] — 2026-06-11

### Fixed

- **Product-values alignment sweep** — three mismatches between the established product brief and the project prose: (1) terminology: "speed↔trust tradeoff" → "speed↔quality dial" in `PROTOCOL.md`, `ai-pm.config.json`, and `docs/decisions/direction.md` (the differentiator is the user-facing quality outcome, not the internal-process trust signal); (2) README public face: added the speed↔quality dial (prototype mode / quality mode / guaranteed floor) and the customer-spectrum (PM↔tech-lead) to "How it works", and replaced "about five plain-language questions" with an accurate description of genuine discovery (gather-first, zero-to-working story, competition researched first, case-against at end); (3) product-advocate builder module: added spectrum guidance to the "Who is this for" checklist item so a Builder working against a spectrum brief can correctly answer with a range, rather than a forced single-persona pick.

---

## [4.7.0] — 2026-06-11

### Added

- **Product-discovery foundation — the onboarding flow is now product-first.** Before, onboarding was mechanics-first (install → setup → build features) with no step establishing *what product, and for whom* — features got built in a vacuum. Now the flow is **install → setup → product discovery → loop**. New: the `product-foundation` contract (a project defines its product + users — a durable brief — through **genuine** discovery run from the user up, posing real forks and the case against and able to conclude "we built the wrong thing", before features; every feature grounds in it); the brief template `src/templates/product.md` (the idea · the customer · the problem · the concrete **zero-to-working story**: discovery/onboarding · continuity/recovery · competition/incumbent · viability · and — at the end — the case-against — grounded in the established discovery frameworks (Working Backwards, Lean Canvas, Cagan, Torres): customer/problem first, competition named, never invented; gathered prejudice-free as a gap-detector, the hard conclusions at the end; the Operator answers); the `orchestrator.md ## Product discovery` procedure (gather-first/conclude-last, gap-detector not judge: anchor on the idea and reason around it, walk the concrete zero-to-working story, ask the customer openly (a spectrum, not a forced fork), research the competition first then ask to correct, weigh the case-against only at the end; a different kind of inquiry each round through the structured-question tool; offered at onboarding, lazily on the first feature to a brief-less project, or explicitly); a lazy-trigger mechanism mirroring the setup nudge (a `no-product-brief-discover` inject + engine predicate, a three-stage ladder: no-config → no-brief → route-reminder). The loop now grounds every feature in `docs/product.md` (the Understand beat, the Builder plan, the product-advocate questions check *against* the brief). The installer lays the brief template down.

---

## [4.6.0] — 2026-06-11

### Added

- **`product-advocate` capability module** — a toggleable `[persona]` module (built on the existing module constructor, mirroring `threat-model`). When ON it deepens the Builder's plan beat with the uncomfortable product-discovery questions — *who is this for · what user pain · is this the right bet · the cheapest test that would tell us · what breaks if we DON'T build it* — each carrying a recorded answer or a conscious "descoped: why"; and deepens the Reviewer with one product dimension (does the shipped change serve the user claim its plan made). The always-on product floor (the plan-checklist product questions, the Reviewer's unanswered-question gap) is unchanged — the module deepens it. Honest: `rich` is a sharper self-check, not an independent voice; the independent plan-time challenge pass is a deferred slice. Per-kind defaults: `software → rich`, `documentation → light`.

---

## [4.5.0] — 2026-06-11

### Added

- **Unified installer** (`src/adapter/install.mjs`): `node src/adapter/install.mjs <target> [--platform claude|opencode]` installs the protocol into a target project in one command — vendors the shared adapter, lays down the core + doc templates (never clobbering a project's real docs), writes a default `ai-pm.config.json`, and wires the active platform (agents · commands · plugin · hooks/imports) by reusing the existing install scripts. Idempotent (a re-run is byte-identical), fail-closed on platform resolution, stays inside the target root, no shell interpolation. Realises the new `one-command-install` contract. Also adds `src/templates/tools.json` — the quality-registry SHAPE a downstream starts from.

---

## [4.4.0] — 2026-06-11

### Changed

- **Merge rule softened — explicit Operator authorization, the Orchestrator may execute.** Before, the Operator pressed the merge button (always manual). Now merge needs the Operator's **explicit, per-merge authorization** (never inferred); with it the Orchestrator MAY execute the merge — the human *decision* stays the floor, only the *execution* is delegable. Updated consistently across every home of the rule (`PROTOCOL.md` invariant 7 / beat 5 / loop / project-config / git-flow, `orchestrator.md`, `ai-pm.config.json`, the `decision-authority` + `disciplined-pipeline` contracts + index, `README.md`, `direction.md`). The merge-gate stamp floor (a merge still needs a passing review) is untouched.

---

## [4.3.0] — 2026-06-11

### Added

- **Automated quality tooling — a protocol promise.** New contract `automated-quality-tooling`: every project gets stack-appropriate automated quality tools (linters, formatters, type-checkers, a SAST scanner) wired and tuned at setup and run every loop — no tool hard-coded, discovered per stack. Realised by a new `setup` step (`orchestrator.md ## Setup` step 5: discover the stack → propose a stack-appropriate toolkit → install/config/register/verify). The AI never loosens a tool's config to make code pass — it fixes the code to the standard; a relaxation is a recorded Operator decision.
- **Build top-down** is now a stated rule (`PROTOCOL.md ## The loop` + the Builder plan checklist): design the guarantee (the contract) before the mechanism; never tool-first or code-first.
- **This repo's own toolkit (downstream #1):** eslint (JS), markdownlint (docs), and semgrep (SAST) wired through the runner — installed, configured with standard rulesets, registered in `tools.json`, green. The repo's code and docs were brought to that standard (no config loosened to dodge a fix).

---

## [4.2.0] — 2026-06-11

### Added

- **`audit` side-tool realized.** `audit` was named in `PROTOCOL.md ## The loop` but had no home; it is now homed in `src/agents/orchestrator.md ## Audit` — a proactive, offered, on-demand whole-project health-check: run the whole quality suite (`node src/quality/run.mjs build`/`review`) plus a fresh independent auditor sweep over the whole tree (invariants, product `contracts/`, doc-quality across the whole surface, honesty labels, drift), then dispatch every finding to a fix or the backlog. It is the **"audit on top"** of a `solo`/`lite` batch. `[persona]`; its run-note is transient (no stored report). Inherited by every downstream.

### Changed

- This repo's own `profile` flipped to `solo` (faster iteration — the Orchestrator builds directly, lighter plans). The floor is unchanged: a separate fresh Reviewer/audit before ship, the honesty gates, the merge stamp, and the Operator merges all hold in every profile.

---

## [4.1.0] — 2026-06-11

### Added

- **Whole-set build-beat runner** (`src/quality/run.mjs`) — runs *every* registered tool for a beat (`build`/`review`/`ship`) from `tools.json`, not a hand-picked subset. Project-agnostic (any stack, any rows), no-op-safe on an empty/absent registry, fails closed on a malformed one. The Builder and Reviewer now invoke it. Closes the gap where only part of the check set was run.
- **8D** — an optional, offered failure-analysis side-tool for a **bug or production incident**: the Orchestrator offers it to drive past a symptom patch to root cause and systemic prevention. Its run-note is transient (deleted once its measures land); the durable output is the mechanism it produces. Named in `PROTOCOL.md` `## The loop`, homed in `orchestrator.md` `## 8D`, inherited by every downstream.
- **Reviewer doc/prose-quality dimension** (always-on floor) — brevity, structure, readability, format tidiness, and *current truth, not archaeology* (invariant 6); plus a project-agnostic **contracts-regression** check. Closes the gap where badly-written or stale-framed prose passed review.

### Fixed

- **Merge-gate now covers any branch prefix.** `resolveMergeTopic` resolved the review topic only from a `feature/<topic>` branch, so a `fix/*` (or other-prefixed) branch escaped the unstamped-review floor. It now reads the topic from HEAD on any branch (prefix stripped), with a dedicated `merge-gate.test.mjs`.

---

## [4.0.5] — 2026-06-11

### Changed

- **Dropped the defunct "eight personas collapse into three" framing in `README.md` + `PROTOCOL.md`.** It described the old pre-collapse persona system, which no longer exists (and stated a miscounted mapping besides). The docs now state the three current roles directly — the one split that carries reliability is that the reviewer is never the builder; PROTOCOL.md's `Folds` column still shows which concerns each role absorbs. Also in `README.md`: a garbled idiom ("wave through" → "catch" its own blind spots) and a stale parity figure (50/50 → 55/55). (Operator-caught.)

---

## [4.0.4] — 2026-06-11

### Changed

- **Readability sweep across the agent + adapter docs** — the same instructions-only treatment that landed on `PROTOCOL.md` (4.0.3), now applied to `src/agents/orchestrator.md` (full rewrite — prose walls → real Markdown lists), `src/agents/builder.md` + `src/agents/reviewer.md` (light pass), `docs/architecture.md`, and `src/adapter/INSTALL.md` (dense paragraphs → bullets). Each file was its own independently-reviewed change. Every directive, exact path, identifier, load-bearing token (the `<!-- ai-pm:modules -->` markers, the review-stamp contract), ASCII diagram, and concrete adapter command/version-fact is preserved unchanged — the cuts were pure water, not facts. Non-functional: no rule changes, gates green throughout (parity 55/0, neutral-prose pass). (Operator-driven readability pass.)

---

## [4.0.3] — 2026-06-11

### Changed

- **`PROTOCOL.md` rewritten instructions-only** — the constitution is de-watered to dense directives and real Markdown lists; preamble, manifesto rhetoric, and section-intro prose are cut (3854 → ~3250 words, −16%). Every invariant, role contract, beat, enforcement row, config field, and core/adapter table row is preserved unchanged in meaning (independently reviewed; one clause dropped in the cut was caught and restored). Non-functional: no rule changes, gates green (parity 55/0, neutral-prose pass). (Operator-driven readability pass.)

---

## [4.0.2] — 2026-06-11

### Changed

- **The `/setup` command is renamed `/pm-setup`** on both platforms — it mimicked an opencode built-in and broke the protocol's `pm-*`/`ai-pm` namespace (the agents are `pm-builder`/`pm-reviewer`/`ai-pm`). Pure rename, no behavior change; the orchestrator's `## Setup` procedure is unchanged — only the user-facing command. (Operator-spotted consistency gap.)

---

## [4.0.1] — 2026-06-11

### Changed

- **The module registry moved into its subsystem:** `modules.json` (root) → **`src/modules/registry.json`**, mirroring `src/quality/tools.json`. The catalog of capability modules is machinery, not project config — it belongs with the modules subsystem, not at the root. Pure move + path rewire (the assembler's `loadRegistry`, the `setup` reference, `ai-pm.config.json` `_modules`, `docs/architecture.md`, `PROTOCOL.md`); registry content unchanged. Root now holds only the entries + project config.

---

## [4.0.0] — 2026-06-11

**The repo dogfoods the clean structure it gives downstream — `docs/` + `src/` (restructure Slice B).** A protocol that must keep documentation and code laconic, structured, and duplicate-free has to model it on itself. **Breaking: the layout changed** (an existing install's paths must update).

### Changed

- **`docs/`** — the human-readable documentation: `architecture.md`; `contracts/` (compacted ~55 → ~25 lines each — guarantee · value · must-work · must-not-break; dead `workflow/*`/`pm-*` paths dropped, git history is the archive); `decisions/` — the compacted compass + rationale + the Operator's **mechanism principle** (*a mechanism counts only if it fires without the Operator's vigilance — if the Operator still has to notice a failure class, the mechanism failed*).
- **`src/`** — the machinery: `adapter/`, `agents/`, `quality/`, `modules/`, `templates/`.
- **Root** keeps only the entries + project config: `PROTOCOL.md` (the harness-loaded operating constitution), `README.md`, `CHANGELOG.md`, `LICENSE`, `ai-pm.config.json`, `modules.json`, `AGENTS.md`, `CLAUDE.md`.
- **Every path rewired** and verified: the Claude deny hook (`.claude/settings.json` → `src/adapter/claude/shim.mjs`), `CLAUDE.md` `@`-imports, the install scripts' root-resolution, the OpenCode plugin trio in lockstep (byte-identity guard holds), the engine/assembler resolution, `tool-map.json`, `INSTALL.md`, the quality run-commands, the neutral-prose surface, every test import, and the **downstream tooling-submodule convention** (`.ai-pm/tooling/src/adapter/…`). Live enforcement (deny hook + merge-gate + plugin) verified from the new paths.

### Migration

An existing downstream updates its adapter path one level: `.ai-pm/tooling/adapter/…` → `.ai-pm/tooling/src/adapter/…` (the deny hook command, the install commands; `src/adapter/INSTALL.md` carries the new convention). No behavioral change — purely structural.

---

## [3.4.2] — 2026-06-11

**Retention discipline — the protocol stops accumulating its own graveyard (restructure Slice A).** Dogfooding pillar 3 on ourselves before the `docs/`+`src/` move (Slice B).

### Changed

- **Transient working artifacts are deleted after use** (`PROTOCOL.md` beat 5, one home): a feature's plan, its review stamp, and any audit run for it are removed at ship — the durable record is the commit + CHANGELOG + contracts; no graveyard accumulates. The stamp goes last (after push + PR), since the merge-gate reads it at push and fails closed. The orchestrator ship procedure points at the rule; the engine/merge-gate predicate is unchanged.

### Removed

- Swept the accumulated `.ai-pm/` graveyard (git history is the archive): 18 spent review stamps, 6 audits, 8 research files, `protocol-feedback/`, 21 superseded `state/archive/` pointers, 2 orphan configs, `tmp/` — ~4279 lines. The keep-set (state, backlog, active plans, the design compass, contracts) is intact.

---

## [3.4.1] — 2026-06-10

**threat-model Slice 2 — the real content + the `depth` toggle.** The first module's skeleton is fleshed into a tight, actionable threat enumeration, and its `depth` toggle is realized honestly.

### Added

- **The threat-model fragments are real** (`modules/threat-model/{reviewer,builder}.md`, 17 lines each): 8 surfaces — attack surface, secrets, data/privacy, trust boundaries, injection/unsafe ops, authz/authn, supply chain, fail-open/closed — each tied to the `file:line` that opens or closes it. Reviewer = verify-named-and-handled (an unhandled exposure or a security over-claim blocks via the verdict); Builder = name-threats-and-mitigations-at-plan. `[persona]` — sharpens judgement, denies nothing.

### Changed

- **The `depth` toggle is realized honestly.** Each checklist item is tagged `[light]` (core) or `[rich]` (full-only); the assembler **strips** the `[rich]` items at `depth: light` so a light project gets genuinely less (not the same prose relabeled), strips the tags, and bakes a `Depth:` banner. **Fail-safe: any non-`light` value ⇒ rich** (the stricter side). One tagged fragment per role (not two variant files) keeps single-home.
- **The Reviewer security floor is generalized** (`agents/reviewer.md`) from a repo-specific committed-template note to the general class: a security-relevant change names its threats and handles its exposures; an unhandled exposure or a security over-claim blocks. Floor (the always-on duty) and fragment (the enumeration) stay single-home.

---

## [3.4.0] — 2026-06-10

**The capability-module constructor + threat-model (pillar 2), Slice 1 — infrastructure + skeleton.** The protocol becomes a *constructor*: capabilities are toggleable modules a project assembles, not a fixed monolith. (Rich threat-enumeration content is Slice 2.)

### Added

- **A capability-module mechanism.** A module's prompt content lives as per-module fragments (`modules/<id>/<role>.md`); **role agents are now assembled from a floor body + the enabled modules' fragments** (a `<!-- ai-pm:modules -->` marker filled in registry order) + frontmatter — generated, not hand-edited, so the floor is the one home of always-on text and each fragment the one home of its text (no drift). A registry **`modules.json`** catalogs the kit (toggle · per-`kind` defaults · targets); `setup` reads it to offer the kit as part of its dialog (defaults over toggles — never a wizard). The shared assembler is `adapter/modules.mjs` (imported by both `install-agents.mjs`, like the engine is shared by both deny shims).
- **`threat-model` — the first module** (skeleton this slice; it deepens the always-on Reviewer security floor, never replaces it). `[persona]` prompt content — sharpens reasoning, blocks nothing. This repo (`software`/`full`) enables it at `rich`.
- **`adapter/install-modules.test.mjs`** (36) — proves compose-enabled / omit-disabled / floor-always-present / fail-safe-to-ON / missing-fragment-throws / root-escape-rejected. `quality/neutral-prose.test.mjs` now scans `modules/<id>/*.md`.

### Changed

- **The assembler is built threat-aware (its own threat model):** a malformed/unknown module toggle **fails safe to ON** (only explicit `false` disables); a fragment pointer that escapes root is rejected (invariant 2); a missing fragment for an enabled module is a **hard error** (never a silent drop of a security section). A bad config can only turn *more* rigor on.
- **The floor holds (same two guards as configurable rigor):** assemble UP from a floor — the overall floor (independent review, honesty, merge-gate, stay-in-root) is never a module-toggle; defaults over toggles. `PROTOCOL.md` +1 clause (modules = an extension axis); the mechanism is homed in `architecture.md` `## Capability modules`.

---

## [3.3.0] — 2026-06-10

**Configurable rigor — the speed↔trust tradeoff becomes the project's choice.** First pillar of the product-engine direction (`.ai-pm/design/direction-product-engine.md`): the protocol is a development *engine*, and a project now picks how much ceremony it pays — without ever cutting the value.

### Added

- **`profile: full | lite | solo`** in `ai-pm.config.json` (absent/unrecognised/malformed ⇒ `full`):
  - **full** — spawn a Builder + spawn a Reviewer + full plan beat (this repo stays `full`).
  - **lite** — the orchestrator builds directly + a separate Reviewer + a light plan.
  - **solo** — the orchestrator builds directly + a separate Reviewer + no plan ceremony.
  The load-bearing split is **builder ≠ Reviewer**, not orchestrator ≠ builder — so "the orchestrator holds the pen" is a legitimate lite/solo lever while a fresh independent Reviewer always reviews. `setup` asks for the profile (recommends `full`, names `solo`'s trust cost, never recommends `solo` silently).
- **`adapter/rigor-profile.test.mjs`** — proves the fail-safe, the relax-only-orchestrator-content scope, and that the floor never relaxes under `solo`.

### Changed

- **The floor is sacred in every profile and is never cuttable:** independent review by a separate fresh context, the honesty gates, the merge-gate stamp, and the Operator merges. A profile that cuts the floor is no protocol.
- **Minimal core touch** (`PROTOCOL.md` +1 line, no new section, still one-sitting): four clause qualifiers mark which rigor is configurable down to the floor. The engine (`adapter/engine.mjs`) now reads the profile and **fails safe to `full`** (a broken config fails *closed*, strict), gating ONLY the orchestrator-content deny; the tooling / out-of-root / truncation / merge-gate floors are separate predicates, never profile-gated. Honest per-platform split: the relaxation is mechanical on OpenCode (the engine resolves the actor) and a no-op on Claude (the content-deny there already fails open).

---

## [3.2.3] — 2026-06-10

**The deployed OpenCode plugin is now generated from source — no more hand-copy drift.** `.opencode/plugins/ai-pm.mjs` was a hand-maintained copy of `adapter/opencode/plugin-entry.mjs` (OpenCode registers hooks only off an inline-defined function, so it can't be a thin re-export). The two had already drifted — the copy had dropped the source's hook comments and diverged on a `catch` binding.

### Fixed

- **`adapter/opencode/install-plugin.mjs`** generates the deployed plugin from the source, rewriting ONLY the adapter import path (on-disk layout detection: downstream `.ai-pm/tooling/adapter` vs dev `adapter`); hook bodies pass through verbatim. The deployed plugin joins the assembled agents/commands as **generated, not hand-edited**. Behaviorally identical to the prior live-verified copy (only inert comments / a `_e` binding differ), so the live-verification carries over.

### Added

- **`adapter/install-plugin.test.mjs`** (build-beat) — asserts the deployed plugin is byte-identical to the generator's output (a future hand-edit or un-regenerated source change now fails the gate) and checks both layout directions. Makes the no-drift guarantee mechanical, not disciplinary — closing the enforcement-layer drift risk the doc audit flagged.

---

## [3.2.2] — 2026-06-10

**Documentation de-duplication + a root-cause guard.** A manifesto-rule-1 audit found duplication that had crept in across the setup-feature slices — and one copy had already begun to rot.

### Fixed

- **De-duplicated the adapter prose (no fact lost — each verified intact in its one home):** the model policy now lives only in `adapter/tool-map.json` `models` (`PROTOCOL.md` and `ai-pm.config.json` `_roles` point to it; the stale `NEVER Haiku` blacklist — which contradicted the home's `allow: ["opus","sonnet"]` allowlist — is dropped); the OpenCode dogfood-verification narrative lives only in this CHANGELOG (`adapter/INSTALL.md` keeps one status line per platform, not six); the shared apply-config mechanism lives in `tool-map.json`/`architecture.md` (each INSTALL.md section states only its per-platform delta); `tool-map.json` `models._note` trimmed from an essay to policy + a cross-link. `adapter/INSTALL.md` −18% words; `PROTOCOL.md` held at 180.
- `architecture.md`'s stale "OpenCode live deny is pending" superseded — it is live-verified (a write into `.ai-pm/tooling/` is mechanically blocked).

### Changed

- **Root-cause guard in the Reviewer's checklist** (`agents/reviewer.md`): the review gate checked each change in isolation against its plan, so a fact accumulating into multiple homes across slices slipped through (the same shape as the earlier inject-class miss — change-in-isolation vs a whole-system property). The single-home check is now a **whole-surface** check: grep the doc surface for an existing home; point, don't restate; an accumulated copy blocks.

---

## [3.2.1] — 2026-06-10

**Setup applies the config it writes; full `/setup` live-verified end-to-end.** Fixes a gap where a cross-model reviewer pin chosen during `/setup` was written to `ai-pm.config.json` but never took effect — the model is baked into the deployed agent only at install time, and `## Setup` never re-assembled after writing. Now setup applies what it writes.

### Fixed

- **`## Setup` re-assembles the agents after writing the config** (new apply step), so a chosen reviewer model actually takes effect; idempotent for zero-config (no pin ⇒ no model line ⇒ byte-identical agents). A neutral `apply-config` contract point (`architecture.md`, `adapter/tool-map.json`) realised per adapter; `adapter/INSTALL.md` corrects the install/setup order note (setup applies after writing, so order no longer silently drops a pin).
- **Honesty:** the `adapter/INSTALL.md` "unit-proven only" caveat on the OpenCode config-write + pin-bake is dropped — the **full `/setup` is now live-verified end-to-end on opencode 1.17.x** (dialog → config write → apply/re-assemble → reviewer model-pin bake of `deepseek/deepseek-v4-flash`; reconfigure shown with a was/now diff).

### Added

- **`README.md` `## Configure`** — a short onboarding section: first-time configuration (discover models → dialog → write config; auto-offered on a fresh project's first work request) and on-demand reconfiguration (re-run `/setup` when models or platform change). Points at the single homes, no restated detail.

---

## [3.2.0] — 2026-06-10

**Setup triggers (Slice B) + the OpenCode `inject` class realized.** The shipped `## Setup` procedure now fires without the Operator hunting for it: **lazily** (a work request to an unconfigured project gets a short "run setup, or proceed on defaults?" offer — not a block) and **explicitly** (a `/setup` command on both platforms). Building the lazy nudge surfaced — and this release fixes — a pre-existing gap: the **`inject` enforcement class was never realized on OpenCode** (its plugin wired only `tool.execute.before`/deny), so the nudge *and* the older `change-route-reminder` never reached the model. Now realized via OpenCode's `chat.message` hook. **Live-verified on opencode 1.17.x** (the orchestrator offered setup instead of editing an unconfigured project; `/setup` discovered the environment + 9 models + ran the dialog).

### Added

- **Setup triggers** — lazy (a `[persona]` act reinforced by the `no-config-run-setup` inject; offer-not-block, declines proceed on zero-config defaults) + an explicit **`/setup`** command on both platforms (one neutral body + per-platform frontmatter, a thin wrapper over `## Setup`). Neutral "detect missing config" / "invoke setup" contract points in `architecture.md`.
- **OpenCode `inject` realization** — a `chat.message` hook routes the user prompt through the shared engine and pushes the inject text as a one-shot context part (the UserPromptSubmit analog). Single-source: the rules stay in `deny-rules.json` + `engine.mjs`; the plugin supplies only the mechanism.
- **`adapter/opencode-inject.test.mjs`** — asserts the deployed plugin *applies* the inject, not just that the engine decides it (the test-strategy gap that let the bug ship to a live run).

### Fixed

- The prior "inject always-on OpenCode" over-claim → replaced with the truth (OpenCode realizes **deny** + **inject**; `ask` = persona), honestly split into live-verified vs unit-proven scope (config write + reviewer model-pin bake remain unit-proven).
- The setup mode question now presents `interactive` as the safe default (invariant 7) instead of recommending `autonomous` — a contradiction caught in the live run.
- The lazy nudge + `## Setup` reactive line made short and deterministic (offer-or-defaults, stop, no repo-exploring/git).

---

## [3.1.0] — 2026-06-10

**The `setup` procedure, realized (Slice A — the "brain").** `setup` was a one-line promise; it is now a neutral, orchestrator-driven procedure: **discover the environment's available models → ask the Operator (structured-question) → write `ai-pm.config.json`**. The protocol asks the environment at config time instead of pre-knowing anyone's models, so it stays agnostic to a downstream's providers (DeepSeek, Claude, Qwen, …). Invoked manually for now; the auto/command triggers are Slice B (deferred — see the backlog).

### Added

- **The `setup` procedure** — single home is the orchestrator's `## Setup`: discover → dialog → write config. A neutral **"list available models"** contract point realized per adapter (Claude = the fixed opus/sonnet pair; OpenCode = `opencode models`, with an honest guided-dialog fallback that never invents an id).
- **`adapter/install-model.test.mjs`** — 11 build-beat checks proving the reviewer model-pin bake (pin → a `model:` line; `auto`/`session`/absent → none).

### Fixed

- **OpenCode reviewer model-pin is now applied.** `adapter/opencode/install-agents.mjs` bakes `model:` into the assembled reviewer frontmatter for a concrete pin and emits none for `auto`/`session` — previously a configured cross-model pin was silently ignored (the documented opt-in was dead code). Zero-config OpenCode review is same-model, now stated plainly.
- **Core-neutrality leak removed** — the neutral orchestrator body no longer hard-codes the Claude mechanism (`opus`↔`sonnet` / "at the spawn"); it states the contract, and each adapter supplies the mechanism (Claude resolves at spawn, OpenCode bakes at install).
- **D4 model-authority truth aligned** in `PROTOCOL.md` and `ai-pm.config.json`: on OpenCode the environment (`opencode models`) is the model authority, not a static allowlist gate — single home in `tool-map.json` `models`.

### Changed

- **The human role is renamed `PM` → `Operator`** across the durable artifacts (constitution, roles, adapter docs, templates). Past CHANGELOG entries are left intact (history, not current truth).

---

## [3.0.0] — 2026-06-10

**Ground-up redesign to a minimal, environment-agnostic core.** The protocol's structural surface had grown past what a person can hold in their head (a 991-line / 17-file constitution, 8 personas at 1219 lines, plus commands, templates, a 508-line hook set, a 749-line plugin, and a 349-line generator). This release replaces all of it with **one neutral core + one thin adapter per platform**: a single `PROTOCOL.md` constitution, **3 roles** (Builder / independent Reviewer / Orchestrator — the one load-bearing split, builder ≠ reviewer, is kept; the other five personas become checklists), a **5-beat loop** (`understand → plan → build → review → ship`), and a **data-adapter** where the deny *rules* are one shared list and each platform supplies only a thin shim. Both **Claude Code and OpenCode are first-class**, each just an adapter over the same core — adding a platform is adapter-only work with zero core edits. This is a breaking change: the old `WORKFLOW.md` + `workflow/*.md`, the 8 `pm-*` agents, the `/pm-*` commands, the generator, and the migration catalogue are all removed. A downstream project on the old template needs a one-time, file-level move to the new layout (tracked as a backlog item; the old surface is recoverable from git history). **Migration required for existing downstream projects.**

### Added

- **`PROTOCOL.md`** — the single-file constitution (manifesto · 3-role model · 5-beat loop · invariants tagged `[mechanical]`/`[persona]` · role contracts · quality-tool layer · project config · honest enforcement map · core/adapter contract · PM-comms · git flow). Designed to be read in one sitting (≤300 lines).
- **`agents/{orchestrator,builder,reviewer}.md`** — three thin role definitions: seat procedure + the role's own checklist (its single home), no copied invariants.
- **`adapter/`** — the data-adapter: `deny-rules.json` (one shared rule list), `tool-map.json` (per-platform tool + model policy), `engine.mjs` (one shared `evaluate()`), per-platform shims (`claude/`, `opencode/`), `INSTALL.md`, and parity/smoke tests.
- **`ai-pm.config.json`** — the one home for a project's choices (mode · roles→agent binding, swappable · per-role model · platform · kind); the core depends on no specific agent.
- **`architecture.md`** (engineer mental model), **`templates/`** (downstream scaffold collapsed 11 files → 3), **`quality/`** (stack-agnostic tool registry: parity + neutral-prose checks).
- **OpenCode adapter** — live-verified on opencode 1.17.0: the session loads as the `ai-pm` orchestrator (a primary agent — opencode runs the session as a primary, unlike Claude's `CLAUDE.md`) and the deny layer mechanically blocks a write into `.ai-pm/tooling/`. A direct-inline plugin entry over the shared engine, loaded from `.opencode/plugins/` (opencode registers a `tool.execute.before` hook only off an inline-defined function, not a re-exported one, and loads agents/plugins from the plural dirs).

### Removed

- `WORKFLOW.md` and all `workflow/*.md`; the 8 `pm-*` agents and the `/pm-*` commands; the generator (`gen/`, `src/manifests/`) and its `.golden/` byte-equivalence snapshots; `MIGRATIONS.md`; the old `tests/` suite and `doc/` dev-history. All recoverable from git history.

### Changed

- The Orchestrator is the one git owner: it commits only reviewed work and holds the ship gate; merge and ship stay manual in every autonomy mode. The merge gate now reads a single review stamp (`.ai-pm/reviews/<topic>_review.md`, `## Code review:` heading).

---

## [2.36.0] — 2026-06-05

Relicenses the template from **AGPL-3.0 → MIT** (`Copyright (c) 2026 Alexander Degtyarev`). The `LICENSE` file now carries the standard MIT text; the `README.md` `## Лицензия` line is rewritten to describe MIT accurately (permissive — free including commercial use, no copyleft, modifications need not be returned), dropping the former AGPL copyleft claim; the `doc/architecture.md` module-map `LICENSE` cell reads `MIT.`. A repo-wide sweep confirms no AGPL/Affero reference remains; the downstream `README.md.tmpl` keeps its neutral `<license>` placeholder. Downstream projects pick up the new license on the next `git submodule update --remote`. No code or structural change — **no migration**.

### Changed

- **`LICENSE`** — full GNU AGPL v3 text replaced with the canonical MIT License (`Copyright (c) 2026 Alexander Degtyarev`).
- **`README.md`** (`## Лицензия`) — rewritten for MIT: free use including commercial, no copyleft, modifications may stay closed (the prior "модификации возвращаются в open source" copyleft claim removed as false under MIT).
- **`doc/architecture.md`** — module-map `LICENSE` row cell `AGPL v3.` → `MIT.`.

---

## [2.35.0] — 2026-06-05

Ships **diagnostic-flow-discipline** — three additions to the "doesn't work in production" debugging flow (`workflow/incident.md`) that keep diagnosis honest and bounded without changing what the protocol is allowed to touch. **Passive-observation carve-out:** read-only inspection (logs, status, metrics, a read of running state) is explicitly distinguished from a state-changing probe, so the Blast-radius preflight applies where it matters and doesn't tax harmless looking. **Bisect:** when a regression's introduction point is unknown, narrow it by halving the suspect range instead of guessing, before forming a fix hypothesis. **Anti-thrash tripwire + mid-debug stack-research:** after repeated failed fix attempts on the same symptom, stop trying variations and escalate — either to stack-research (consult the actual stack/library behaviour mid-debug) or back to the PM — rather than thrashing. Safety is unchanged: the existing Blast-radius preflight, the remote-system boundary, and the probe rules all stay exactly as they were — this only sharpens *how* diagnosis proceeds inside those guardrails. Additive and back-compatible — **no migration**.

### Added

- **Passive-observation carve-out** (`workflow/incident.md`) — read-only inspection is named and separated from a state-changing probe, so the Blast-radius preflight scopes to actions that change state, not to looking.
- **Bisect step** (`workflow/incident.md`) — for a regression with an unknown introduction point, halve the suspect range to localize it before hypothesizing a fix.
- **Anti-thrash tripwire + mid-debug stack-research escalation** (`workflow/incident.md`) — after repeated failed fix attempts on one symptom, stop varying the fix and escalate to stack-research or to the PM instead of thrashing.

### Notes

- Safety guardrails unchanged: Blast-radius preflight, remote-system boundary, and probe rules are untouched — this sharpens diagnostic *procedure* only.
- Dogfood: feature diff is clean (changeset-hygiene in force). `tests/hooks.sh` unaffected — no hook touched.

---

## [2.34.0] — 2026-06-05

Ships **test-wiring-parity** — a PM-relayed review-scope fix: closing the hole where a feature can pass green tests *and* both review passes yet still not work, because the test wired its dependency differently than the production path does (only hardware caught the real BLE-provider regression). The fix is a soft, single-sourced discipline: a feature whose correctness depends on init/registration/wiring **order** must carry at least one test that drives the **production registration path** (not a hand-rolled equivalent setup) and asserts the observable post-condition; `pm-plan-checker` blocks a plan that bypasses it. Sibling of the existing Stack-spec test rule, judgement-triggered (no hook), single-sourced in `/pm-plan` and referenced by name from the checker. Moves a slice of Step 5.5 (run-it-for-real) earlier into the test discipline. Additive and back-compatible — **no migration**.

### Added

- **Test-wiring-parity rule** (`.claude/commands/pm-plan.md`) — sibling to the Stack-spec test rule: a wiring-dependent feature must carry ≥1 test that drives the production registration path and asserts the observable post-condition, not a hand-rolled equivalent.
- **Wiring-parity blocking clause** (`.claude/agents/pm-plan-checker.md` "Implementation compliance") — blocks a plan whose tests bypass the production registration path; references the `/pm-plan` rule by name (single-source, no re-encoded trigger list).
- **`### Test-wiring-parity` decision record** (`doc/architecture.md`) — records the rule + checker enforcement, the judgement-triggered / no-hook framing, the single-sourcing, the sibling relationship to the Stack-spec test rule, and that it moves a slice of Step 5.5 earlier (the `code-review` built-in finding-half stays out of scope).

### Notes

- Dogfood: this feature's own diff is clean (changeset-hygiene from v2.33.0 in force). `tests/hooks.sh` stays 73/73 — no hook touched (judgement-triggered, not deny-listed).

---

## [2.33.0] — 2026-06-05

Ships **changeset-hygiene** — feature A of the PM-sequenced reviewability track (the PM doesn't read code, colleagues do; the changeset shouldn't be painful to review). Two soft, single-sourced disciplines land, plus a legibility rule referenced by name. **Clean-diff discipline:** `pm-coder` step 6 now sharpened so the changeset carries only plan-serving hunks — cosmetic-only / whitespace / reformat-of-untouched-lines / reordering / opportunistic micro-opt are excluded even when harmless, with a necessary-incidental carve-out (such edits are NOT noise); step 34 routes worthwhile unrelated finds to the report (→ backlog), not the diff. **Reviewer surfacing:** `pm-plan-checker` gains a non-blocking **Diff-noise structural note** beside the preserved feature-scope-expansion note — a structural product note, never a hard block, never prose-policing. **Human-text legibility:** a single-source `## Human-facing text legibility` subsection in `workflow/pm-comms.md` (read-before-ship, rewrite-if-unclear, never paste agent output verbatim into a durable artifact), referenced by name from `pm-coder` (comments) and `pm-pr-prep` (CHANGELOG/PR text). Structure-only, soft-enforced (no hook, no hard block), additive and fully back-compatible — **no migration**.

### Added

- **Single-source `## Human-facing text legibility` subsection** (`workflow/pm-comms.md`) — sibling of `## How to talk to the PM`, governs durable authored text: read-before-ship, rewrite-if-unclear, never paste agent output verbatim into a durable artifact. Referenced by name (not re-encoded) from `.claude/agents/pm-coder.md` (code comments) and `.claude/agents/pm-pr-prep.md` step 4 (CHANGELOG/PR text).
- **Diff-noise structural note (non-blocking)** (`.claude/agents/pm-plan-checker.md` "Implementation compliance") — hunk-level cosmetic noise surfaced as a structural product note in wire-token-note shape, never a hard block, never prose-policing; necessary incidental changes are explicitly NOT flagged.
- **`### Changeset hygiene` decision record** (`doc/architecture.md`) — records the three disciplines, the soft / non-blocking framing within the soft-enforced + single-sourced family, the legibility rule single-sourced in `workflow/pm-comms.md` and referenced by name, and the A→B→C sequencing (B linters #218/#211, C idioms #227).

### Changed

- **`pm-coder` clean-diff sharpening** (`.claude/agents/pm-coder.md`) — step 6 now requires the changeset carry only plan-serving hunks (cosmetic-only / whitespace / reformat / reorder / opportunistic micro-opt excluded even when harmless), with the necessary-incidental carve-out; step 34 routes worthwhile unrelated finds (functional or cosmetic) to the report → backlog, not the diff. Atomic-commit step 10 unchanged.
- **`pm-pr-prep` legibility reference** (`.claude/agents/pm-pr-prep.md`) — step 4 now cites `## Human-facing text legibility` by name for CHANGELOG/PR text; step-0 stamp gate and version/CHANGELOG mechanics unchanged.

### Notes

- Plan-check: Pass-1 **approve** (all 4 scenarios single-sourced; scenario-4 necessary-incidental boundary present in both coder rule and reviewer note); code-review (Pass-2): **zero defects** over the full diff; verdict approve (`.ai-pm/reviews/changeset-hygiene_review.md`, stamped `## Code review: 2026-06-05 — built-in code-review (high effort), no defects — passed`).
- `tests/hooks.sh` **73/73** (no hook touched). Structure-only / no prose-policing; the prose is verified editorially per the documented markdown-prose boundary. **Dogfood:** the diff is itself clean — every hunk traces to a scenario or the docs-to-update list, no cosmetic churn. Out of scope: B (linters), C (idioms), code-readability-of-code, the deeper #386 comment-restraint rubric, any hard block on diff-noise. Back-compat: additive only, **no migration**.

---

## [2.32.0] — 2026-06-05

Ships **periodic-codebase-review** — two structure-only refinements to how whole-codebase review is engaged: **review-engine-selection** unblocks the `code-review-orchestrator` skill in the routing hook and gives the review typology a single-source engine-selection rule (per-diff Pass-2 stays built-in; the whole-codebase sweep prefers the orchestrator when available, with built-in fallback and a `WB_REVIEW_ORCHESTRATOR=off` override); and **audit-scope-menu** turns a PM-initiated analysis request into one upfront `AskUserQuestion` scope menu (Quick `diff` / Full) instead of an auto-decision, while keeping the threshold logic as the recommended default and preserving system-initiated announce-and-proceed. Both reference their canonical rules **by name** (no double-encoding), both are structure-only with no prose-policing, and the change is additive and fully back-compatible — **no migration**.

### Added

- **Single-source engine-selection rule for the review typology** (`workflow/review-typology.md`) — states once that per-diff Pass-2 stays built-in `/code-review` and the whole-codebase sweep prefers `code-review-orchestrator` when available (built-in fallback; `WB_REVIEW_ORCHESTRATOR=off` forces built-in). Referenced by name from `.claude/commands/pm-audit.md`, `workflow/enforcement.md`, and the architecture record.
- **`### Review-engine selection` decision record** (`doc/architecture.md`) — records the engine-selection decision and that it supersedes `deny-review-orchestrator` (v2.25.1), prior history intact.
- **Upfront scope menu on a PM-initiated analysis request** (`.claude/commands/pm-audit.md` `## Scope decision`) — a PM-initiated request with no scope named now shows one `AskUserQuestion` menu (Quick `diff` / Full = whole project + quality sweep) before running, with the 60-day / 15-commit / first-audit judgement preserved as the pre-selected recommended default; explicit scope skips the menu (explicit Full still surfaces sweep depth); the menu shows in both authority modes; system-initiated stays announce-and-proceed.

### Changed

- **`code-review-orchestrator` unblocked in the routing hook** (`.claude/settings.json`) — the orchestrator deny arm and the `WB_ALLOW_REVIEW_ORCHESTRATOR=1` escape guard are removed; the skill now falls through to the let-through. The 7 `wb-*` role-duplicator denies are byte-identical to before (verified).
- **`pm-audit` `## Technical quality` selects the engine by reference** (`.claude/commands/pm-audit.md`) — the sweep names the engine via the `### Review typology` rule rather than re-encoding it; the `## Scope decision` rename propagated into the first-run-precedence cross-ref (no dangling `Auto-scope`).
- **`workflow/enforcement.md` orchestrator note** — one line clarifying the orchestrator is off the deny-list and the named deny set is exactly the 7 role-duplicators.

### Notes

- Plan-check: Pass-1 **approve** for both features (single-source / no-double-encoding verified); code-review (Pass-2): **zero findings** on both, security-relevant hook change reviewed accordingly; verdicts approve (`.ai-pm/reviews/review-engine-selection_review.md`, `.ai-pm/reviews/audit-scope-menu_review.md` — both stamped `## Code review: 2026-06-05 — passed`).
- `tests/hooks.sh` **73/73** (net -1 from deleting the obsolete `WB_ALLOW_REVIEW_ORCHESTRATOR` flag-escape case; new let-through + role-deny-still-fires cases added). Both features are **structure-only / no-prose-policing**; the prose halves are verified editorially per the documented markdown-prose boundary. Back-compat: additive only, **no migration**.

---

## [2.31.0] — 2026-06-05

Ships **orchestrator-read-discipline** — closes the orchestrator-side Read-discipline gap left by `workflow-progressive-disclosure`: the decision-authority kernel moves into the always-on `WORKFLOW.md` core (decision-critical rule **present in context, authoritative over recall** — not another please-read instruction) + the template repo dogfoods its own pipeline via a root `CLAUDE.md` that `@`-imports the thin core + the boundary criterion is recorded. A **structural fix**, not a discipline note. Single-source preserved (the kernel has one home, declarations deleted from `workflow/decision-authority.md`); the `### Decision authority` heading is unmoved so all by-name references resolve. Additive, fully back-compatible, **no migration**.

### Added

- **Root `CLAUDE.md` dogfood entry point** (`CLAUDE.md`) — the template repo gets its own root `CLAUDE.md` that `@`-imports the thin `WORKFLOW.md` core, so when the protocol is developed by its own pipeline the orchestrator auto-loads the core/router/invariants (previously nothing auto-loaded).
- **Boundary-criterion decision record** (`doc/architecture.md`) — records the criterion (a rule the orchestrator applies in freeform reasoning keeps its kernel always-on) as a decision record, plus the File-layout row for the new root `CLAUDE.md`.

### Changed

- **Decision-authority kernel relocated into the `WORKFLOW.md` core** (`WORKFLOW.md`, `workflow/decision-authority.md`) — the `### Decision authority` kernel (enum + `absent ⇒ interactive` default + derivability test + 3-trigger escalate-cap + announce-before-act + merge-always-manual) now lives in the always-on core as a cross-cutting invariant (its single home); the declarations were deleted from `workflow/decision-authority.md`, which now defers to the core and keeps only elaboration (no double-encoding — single-source preserved). The core stays thin (79→81 lines).
- **"Read before apply" demoted to a secondary backstop** — the decision-critical rule is now present in the always-loaded context and authoritative over memory; the explicit Read step is a full-detail-only secondary backstop rather than the primary mechanism.

### Notes

- Plan-check: Pass-1 **approve** incl. no-double-encoding single-source verified; code-review (Pass-2): **zero findings**; verdict approve (`.ai-pm/reviews/orchestrator-read-discipline_review.md` — stamped `## Code review: 2026-06-05 — passed`).
- `tests/hooks.sh` 74/74. The `### Decision authority` heading is **unmoved** → all by-name references resolve. Back-compat: the downstream `@.ai-pm/tooling/WORKFLOW.md` contract and the `WORKFLOW.md` path are **byte-unchanged**; additive only, **no migration**.

---

## [2.30.0] — 2026-06-05

Ships **readme-currency** — README currency + template-conformance are now actively watched during ordinary work instead of drifting silently. Two structure-only, no-hook mechanisms: a judgment-triggered **per-feature README-currency check** in `/pm-plan` (when a feature touches install/packaging/quick-start/the architecture one-liner/a doc pointer, the plan must name `README.md` in "Docs to update" and `pm-architect` refreshes it on the existing post-coding handoff), and a **`pm-auditor` README-conformance dimension** (generalizing the A4 install↔Integration-contract pairing into the audit). Both reference the canonical README shape **by name** — neither re-encodes the beats — and both are structure-only with **no prose-policing**. Additive, fully back-compatible, **no migration**.

### Added

- **Per-feature README-currency check in `/pm-plan`** (`.claude/commands/pm-plan.md`) — judgment-triggered, **no hook**: when a feature touches install/packaging, quick-start, the architecture one-liner, or a doc pointer, the plan must list `README.md` under "Docs to update"; `pm-architect` then refreshes README on the **existing** post-coding handoff. Silent when none of those surfaces is touched. References the canonical-README-shape authoring rule by name — never re-encodes the beats.
- **`pm-auditor` README-conformance dimension** (`.claude/agents/pm-auditor.md`) — structure-only note per missing beat: asserts install/quick-start + `## License` + `docs/product.md` pointer present, and install ↔ `## Integration contract` match (generalizing the A4 pairing into the audit; skipped silently when the contract is N/A). Never prose-polices wording, quality, or currency-of-content; references the canonical shape by name.

### Changed

- **Handoff notes now list `README.md`** (`.claude/agents/pm-architect.md`, `workflow/pipeline.md` Step 4) — one-line additions noting that `README.md` rides the existing "Docs to update" post-coding handoff so the currency check has a home to route through.

### Notes

- Plan-check: Pass-1 **approve**; code-review (Pass-2): **zero findings**; verdict approve (`.ai-pm/reviews/readme-currency_review.md` — stamped `## Code review: 2026-06-05 — passed`).
- `tests/hooks.sh` 74/74. Both mechanisms are **structure-only / no-prose-policing / no-hook**. Back-compat: additive only, **no migration**. Also validated the v2.29.0 `workflow/*.md` structure by use during this feature.

---

## [2.29.0] — 2026-06-05

Ships **workflow-progressive-disclosure** — a progressive-disclosure restructure of `WORKFLOW.md` from a 564-line eager-`@`-imported monolith into a thin **~79-line constitution + router** at the same path plus **15 on-demand `workflow/*.md` topic files** that consumers read just-in-time via the Read tool. ~40 live by-name references were repointed to their new topic homes and explicit "Read `workflow/<topic>.md` before X" steps added at the consumers that need them. Net effect: the always-loaded spec context drops **~17k → ~2.5k tokens (~85% cut)** for the main loop **and** every subagent, since the spec is no longer eager-imported wholesale. Additive, fully back-compatible — the downstream `@.ai-pm/tooling/WORKFLOW.md` import line and the `WORKFLOW.md` path are **byte-unchanged**, and the new topic files ride the existing submodule. **No migration.**

### Added

- **15 on-demand `workflow/*.md` topic files** (`workflow/decision-authority.md`, `enforcement.md`, `examples.md`, `foundational-questions.md`, `incident.md`, `maintenance.md`, `mandatory-matrix.md`, `pipeline.md`, `pm-comms.md`, `project-kind.md`, `protocol-gap.md`, `review-typology.md`, `roster.md`, `security-surfaces.md`, `state.md`) — the spec content decomposed out of the monolith into topic homes, read just-in-time via the Read tool rather than eager-`@`-imported. The single-source disciplines (`### Decision authority`, `### Review typology`, etc.) keep their canonical homes in these files; consumers reference them by name.
- **Claude Code context-loading stack-note** (`doc/stack-notes.md`) — documents the context-loading model that motivates the restructure: `@`-imports are eager (always loaded into every context), Read-tool reads are on-demand, so moving spec detail behind the router shrinks the always-loaded footprint for the main loop and every subagent.

### Changed

- **`WORKFLOW.md` → thin constitution + router** (`WORKFLOW.md`) — reduced from 564 lines to ~79; now holds only the load-bearing constitution plus a router pointing at the `workflow/*.md` topic files. The path and the downstream `@.ai-pm/tooling/WORKFLOW.md` import line are **byte-unchanged**.
- **~40 live by-name references repointed + explicit Read steps added** — references that pointed into the old monolith now point at their `workflow/<topic>.md` homes, and explicit "Read `workflow/<topic>.md` before X" steps were added at the consumers that need the detail (including decision-authority Read steps at the autonomous-branch consumers).
- **Architecture File layout + Integration contract** (`doc/architecture.md`) — File layout records the new `workflow/` topic-file tree; the Integration contract records that the `@`-imported `WORKFLOW.md` path is unchanged and the topic files load on-demand.

### Notes

- Plan-check: Pass-1 approve after one fix (an explicit decision-authority Read step at the autonomous-branch consumers); code-review (Pass-2): **zero findings**; verdict approve (`.ai-pm/reviews/workflow-progressive-disclosure_review.md` — stamped `## Code review: 2026-06-05 — passed`).
- `tests/hooks.sh` 74/74. Back-compat: the `@.ai-pm/tooling/WORKFLOW.md` import line and the `WORKFLOW.md` path are **byte-unchanged**; the new `workflow/*.md` files ride the existing submodule. Additive only. **No migration.**

---

## [2.28.0] — 2026-06-05

Ships **ai-minimums-linter-wiring** — makes the `### AI-specific minimums` deterministically **enforced by the downstream project's own linter** instead of self-policed by prose discipline. `pm-stack-researcher` now produces a per-stack AI-minimum→linter-rule mapping (doc-URL cited) that `/pm-bootstrap` wires into the project's `<lint command>` config across all three stack-setup paths, so a diff crossing a minimum fails the Pipeline lint step. Numbers stay single-sourced (the linter **encodes**, never re-declares); minimums a linter cannot express are recorded **convention-only**, honestly, and routed to the `### Review typology` smell type. The deterministic half of backlog #211, sharpened by DriveBox #224. Discipline + agent capability only; additive, fully back-compatible, **no migration**.

### Added

- **AI-minimums→linter-rule mapping** (`.claude/agents/pm-stack-researcher.md`) — step 6 produces a per-stack mapping from each expressible `### AI-specific minimum` to a concrete linter rule (e.g. `max-module-lines=300`), with the rule's documentation URL cited. Per-stack rules appear as **examples only**, never a fixed protocol list. Unexpressible minimums (cross-file / accumulated) are recorded **convention-only**, explicitly, and tied by name to the `### Review typology` smell type.
- **Bootstrap wiring of the AI-minimums into the linter** (`.claude/commands/pm-bootstrap.md`) — the researcher mapping is wired into the project's `<lint command>` config across **all three** stack-setup paths (greenfield, legacy stack-literacy, legacy codebase-reader), so a diff crossing an expressible minimum fails the Pipeline lint step deterministically.
- **dim-9 validator discipline extended to AI-minimums encoding, both cadences** (`.claude/agents/pm-plan-checker.md`, `.claude/agents/pm-auditor.md`) — Variant A: the plan-checker's Pipeline-green DoD is extended **in place** to confirm the linter encodes the expressible minimums; pm-auditor dim-5 gains a periodic, **non-blocking** note for the un-wired-project case. No new gate, no new dimension; `code-review` is explicitly **not** made a third owner.
- **Template notes — AI-minimums are linter-enforced, not self-policed** (`doc/_templates/CLAUDE.md.tmpl`, `doc/_templates/architecture.md.tmpl`) — a pointer added next to the existing single-source home; the five minimum number-lines are **unchanged** (pointer only, no number re-declared).
- **Architecture decision record** (`doc/architecture.md`) — records linter-enforcement as the deterministic half of the AI-minimums discipline, the researcher↔bootstrap↔dim-9 ownership split, the honest convention-only boundary (#211), and the smell-type handoff. References `### AI-specific minimums` by name rather than re-listing the numbers.

### Notes

- Code-review: 1 finding fixed in-pass (`723b950`) — a single-source violation in the decision record itself (a five-number prose enumeration → a reference to `### AI-specific minimums`); plan-check approve; verdict approve (`.ai-pm/reviews/ai-minimums-linter-wiring_review.md` — stamped `2026-06-05 — passed`).
- `tests/hooks.sh` 74/74. `.claude/settings.json` + `tests/hooks.sh` byte-unchanged — no hook added; enforcement lives in the downstream project's linter, not this repo's hooks. Additive only. **No migration.**

---

## [2.27.0] — 2026-06-05

Ships **review-typology-framework** (EPIC review-typology, slice 1) — a single-sourced `### Review typology` registry in `WORKFLOW.md` that names the protocol's distinct review **types**, each with its own cadence · depth · scope · deterministic-half · AI-half, mirroring the `### Decision authority` single-source discipline. The protocol already reviews every change by diff and audits compliance periodically, but had no layered review **typology**. Research-backed (`.ai-pm/research/review-typology_research.md`), validating the layered model, the **"review new/changed code, not already-clean code"** (Clean-as-You-Code) cadence rule, and the structural→deterministic / semantic→LLM split (backlog #211). This slice lays the framework (5 types — 2 built, 3 registered as later slices) and implements the first, lightest type: **smell / hygiene**, operationalized through `/pm-audit`'s `## Technical quality` hook. Discipline + `/pm-audit` capability only; additive, fully back-compatible, **no migration**.

### Added

- **`### Review typology` registry** (`WORKFLOW.md`) — a canonical, single-sourced discipline naming the 5 review types (per-diff · smell/hygiene · architectural · functional/integration · criticality-prioritization), each with cadence · depth · scope · deterministic-half · AI-half. Two types are built (per-diff exists; smell/hygiene shipped here); the 3 heavier types are **registered as named later slices** (cadence/depth/det-vs-AI sketched, not built). Consumers reference the registry by name; the enum/cadence lives once. Includes the marker↔audit-report coupling caveat for future non-audit sweep triggers.
- **Smell / hygiene sweep via `/pm-audit`** (`.claude/commands/pm-audit.md`) — the `## Technical quality (full scope only)` hook is strengthened into the smell/hygiene sweep: runs the `code-review` skill over a **proportional scope** (new-code gating — `git diff <last-sweep-sha>..HEAD` + first-run-full + periodic full re-sweep, recorded via a `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>` marker line in the audit report, no new artifact), at a **selectable depth** (low…ultra; never silently the costliest), with findings routed through the existing fix-now / next-sprint / accept-with-context triage (`accepted (quality-sweep-<date>)`), and an **autonomous procedural gate bounded by the proportionality rule** (never a full-tree ultra sweep every audit). The interactive yes/no offer wording is preserved.
- **`pm-audit.md` added to the `### Decision authority` consumer list** (`WORKFLOW.md`) — the smell-sweep autonomous gate makes the `/pm-audit` command a named consumer of the decision-authority discipline (single-source-drift guard).
- **Architecture decision record** (`doc/architecture.md`) — records the framework as a new whole-system review discipline (EPIC slice 1), registry home = `WORKFLOW.md` `### Review typology`, and the last-sweep marker = a line in the audit report.

### Notes

- Code-review: 6 findings fixed in-pass (`182db36`) + a registry-cadence alignment follow-up (`f6aea8c`); plan-check approve; verdict approve (`.ai-pm/reviews/review-typology-framework_review.md` — stamped `2026-06-05 — passed`).
- `tests/hooks.sh` 74/74. `.claude/settings.json` + `tests/hooks.sh` byte-unchanged — the smell deterministic-detection half is **named** as a future hook, not built in this slice. Additive only; the existing `## Technical quality` offer is strengthened, not removed. **No migration.**

---

## [2.26.0] — 2026-06-05

Ships **readme-template-canonical-shape** — bakes the canonical README front-door shape (что → зачем → install → details → license) into the downstream template `doc/_templates/README.md.tmpl` and adds a `pm-architect` authoring rule so newly-scaffolded projects start from the right shape. Follow-up to `readme-rewrite` (v2.24.1), which fixed this protocol's own README; this slice carries that shape into the template that downstream projects inherit. The template's front-gate stays intact and the install / License / `product.md`-pointer blocks are byte-preserved. Template/doc capability only; additive, fully back-compatible, **no migration**.

### Added

- **Canonical-shape guidance into `doc/_templates/README.md.tmpl`** — a top guidance comment plus a front-gate prohibition encoding the что → зачем → install → details → license ordering, so downstream-scaffolded READMEs open with the canonical front-door shape. Front-gate intact; install / License / `product.md`-pointer blocks byte-preserved.
- **`pm-architect` authoring rule** (`.claude/agents/pm-architect.md`) — directs README authoring to follow the canonical shape baked into the template.

### Notes

- Editorial code-review: 2 LOW (1 latent observation, 1 blank-line nit fixed); plan-check approve; verdict approve (`.ai-pm/reviews/readme-template-canonical-shape_review.md` — stamped `2026-06-05 — passed`).
- `tests/hooks.sh` 74/74. Back-compat: additive only — existing template content (install / License / pointer) unchanged. **No migration.**

---

## [2.25.1] — 2026-06-05

Ships **deny-review-orchestrator** — a surgical hardening of the shipped `.claude/settings.json` routing hook so the wb-*skill `wb-development:code-review-orchestrator` no longer auto-intercepts this protocol's own `/code-review` (Pass-2). Its broad auto-trigger would silently hijack the protocol's review loop in every downstream project (the hook ships via the submodule), so the hook now **denies** that one skill by name with a clear "use `/code-review` instead" reason. For the rare case where the skill is genuinely wanted, a narrowly-scoped per-skill env-escape **`WB_ALLOW_REVIEW_ORCHESTRATOR=1`** bypasses only this single deny — every other hook and every other wb-* deny stays active. Tooling/config only; additive, fully back-compatible, **no migration**.

### Changed

- **Routing hook denies `wb-development:code-review-orchestrator` by name** (`.claude/settings.json`) — added as a dedicated `case` arm with a "would auto-intercept this project's own `/code-review` (Pass-2); use `/code-review` instead" reason, separate from the existing wb-* role-duplication deny list.

### Added

- **Per-skill env-escape `WB_ALLOW_REVIEW_ORCHESTRATOR=1`** — when set, the hook exits early for `wb-development:code-review-orchestrator` only, bypassing this one deny without touching any other hook or deny. Must be set on the Claude Code process (`WB_ALLOW_REVIEW_ORCHESTRATOR=1 claude` or `export` before start), documented in `README.md`.
- **README install/usage note** — a new "Скилл `code-review-orchestrator` отключён по умолчанию" section documenting the deny, the downstream-via-submodule reach, and the env-escape semantics.
- **3 hook tests** (`tests/hooks.sh`) covering the new deny and the env-escape — suite at **74/74**.

### Notes

- `.claude/settings.json` is a security-relevant hook: this change adds a deny-by-default with a single narrowly-scoped env-escape, independently reviewed and confirmed correctly scoped (`.ai-pm/reviews/deny-review-orchestrator_review.md` — code-review no defects, stamped `2026-06-05 — passed`).
- Back-compat: additive only — existing routing behavior is unchanged except for the new deny. **No migration.**

---

## [2.25.0] — 2026-06-04

Ships **state-model-section** — slice 4 of the cross-document-consistency auditor EPIC (slice 1 = `invariants-index`, v2.21.0; slice 2 = `taxonomy-drift-sweep`, v2.22.0; slice 3 = `nfr-operational-limits-prompt`, v2.23.0), the third whole-system-property gap. Closes the **state-model** gap: a stateful project that scatters its lifecycle states, transitions, and terminal/illegal states across feature docs with **no single authority**, because the protocol had no prompt forcing *"what are this system's states, and which transitions are legal?"*. `/pm-plan` gains a **conditional State-model check** that fires only when the orchestrator judges the feature **state-bearing** (a lifecycle / status field / explicit state machine), silent otherwise, beside the existing Stack-component / Interaction-scenario / Security-surface / NFR conditional checks. The state model gets a **home**: a **new conditional `## State model`** section in `architecture.md` (states, legal transitions, terminal & illegal states), with `pm-architect` walking it (A2) and excluding it from the default skeleton (A4) so it appears only when warranted. Conditional / proportional, judgment-not-regex, no hook and no hard gate; additive, fully back-compatible, **no migration**.

### Added

- **Conditional State-model check in `/pm-plan`** — fires only when the orchestrator judges the feature state-bearing (lifecycle / status field / explicit state machine); silent otherwise, beside the existing Stack-component / Interaction-scenario / Security-surface / NFR conditional checks.
- **New conditional `## State model` section in `architecture.md.tmpl`** — the home for a system's states, legal transitions, and terminal / illegal states, with a worked example obeying its own column-level drift-bound.
- **`pm-architect` State-model handling** — A2 walks the State-model section, A4 excludes it from the default skeleton so it appears only when warranted, plus authoring guidance.
- **Architecture decision record + repo's own `N/A` section** — the state-model gap and its conditional-section resolution recorded in `doc/architecture.md`, including the repo's own `N/A` State-model placement grounded to an existing anchor.

### Notes

- Conditional / proportional and judgment-not-regex: no hook, no hard gate — the check fires on orchestrator judgment of state-bearing features, stays silent otherwise.
- This feature was **selected autonomously** per `### Decision authority` (shipped in v2.24.0, `automode-procedural-gates`); the plan carries a `Source:` line recording the basis of the selection.
- Back-compat: additive only — the new `## State model` section and the `/pm-plan` check appear only when warranted. **No migration.**

## [2.24.1] — 2026-06-04

Ships **readme-rewrite** — a PM-directed rewrite of the protocol's own `README.md` front door, documentation-only (no agent / template / command / code change). The README is reordered to the canonical что→зачем→установка→подробности→лицензия shape: install moves up top, a two-path quickstart (greenfield + legacy onboarding) replaces the single flow, the risk list is strongly cut and lifted up as the "why", and the update / migration sections are consolidated. The inline v1.x→v2.0 migration walkthrough is removed from the README and now lives in `MIGRATIONS.md`. Newcomer-first, no behavior change.

### Changed

- **`README.md` rewritten and reordered (newcomer-first)** — canonical что→зачем→установка→подробности→лицензия order: install raised to the top, a two-path quickstart added (greenfield + legacy onboarding), the risk list strongly cut and moved up as the "why", and the update / migration sections consolidated. One editorial finding fixed in-pass.

### Removed

- **Inline v1.x→v2.0 migration walkthrough removed from `README.md`** — the front door now points to `MIGRATIONS.md` instead of carrying the migration steps inline.

### Notes

- Documentation-only change to the template repo's own front door; no protocol capability added or changed, so a PATCH bump. No Product Contract touched, no migration.
- Versioned above the latest landed CHANGELOG heading (`[2.24.0]`); v2.25.0 (state-model-section, PR #214) ships separately and is not in this branch's history.

---

## [2.24.0] — 2026-06-04

Ships **automode-procedural-gates** — generalizes the shipped automode (`### Decision authority` engine) from a single-gate capability into a **graded procedural-gate progression**. In autonomous mode the routine procedural gates — feature-selection, plan-approval, arch-offer, retrospective / migration nudges, contract-existence — become **announce-and-proceed**: the orchestrator states the call and continues without a stop. A **genuine product fork** still derives-or-escalates (no silent product decision), and **merge / ship stays manual** regardless of mode. The autonomous branches cite their basis (a `Source:` line) so an announced call remains auditable. Additive over the existing engine, fully back-compatible, **no migration**.

### Added

- **`### Decision authority` generalized + autonomous rider (`WORKFLOW.md`)** — the engine grows from feature-selection alone to the full set of routine procedural gates; an autonomous-mode rider makes each an announce-and-proceed call while genuine product forks still derive-or-escalate, and Step 6 reflects that merge / ship remains a manual gate.
- **5 autonomous procedural-gate branches in `/pm-plan`** — feature-selection, plan-approval, arch-offer, retrospective / migration nudge, and contract-existence each gain an autonomous branch that announces the call and proceeds, every branch carrying a `Source:` line so the basis of the call is auditable.
- **Autonomous first-feature selection in `/pm-bootstrap`** — the bootstrap first-feature gate honors autonomous mode, announcing and proceeding from canon instead of stopping for selection.
- **Selection-citation backstop in `pm-plan-checker`** — verifies an announced autonomous selection cites its source, so an announce-and-proceed call cannot ship without a recorded basis.
- **Architecture decision record** — the procedural-gate generalization recorded in `doc/architecture.md` (graded scope of the Decision authority engine, announce-and-proceed vs derive-or-escalate vs manual merge / ship).

### Notes

- Back-compat: additive only — the engine still behaves exactly as before in interactive mode; autonomous mode gains the announce-and-proceed progression. **No migration.**
- The manual / autonomous boundary is deliberate: routine procedural gates proceed announced, genuine product forks derive-or-escalate, and merge / ship stays a manual gate in every mode.
- Renamed mid-flight from `automode-feature-selection` to `automode-procedural-gates` once the scope broadened from a single gate to the procedural-gate progression; all branch commits ship under the final name.

---

## [2.23.0] — 2026-06-04

Ships **nfr-operational-limits-prompt** — slice 3 of the cross-document-consistency auditor EPIC (slice 1 = `invariants-index`, v2.21.0; slice 2 = `taxonomy-drift-sweep`, v2.22.0). Closes the **NFR / operational-limits** gap the downstream review found: a resource-constrained / scale-bearing project that writes its resource and scale budget **nowhere**, because the protocol had no prompt forcing *"what is this feature's / the system's resource and scale budget?"*. `/pm-plan` gains a **conditional NFR / operational-limits check** that fires only when the orchestrator judges the feature **scale-bearing** or the platform **resource-constrained** (signal from `docs/stack-notes.md` / `docs/architecture.md` `## Architectural constraints`) — silent otherwise, beside the existing Stack-component / Interaction-scenario / Security-surface conditional checks. NFRs get a **home split by audience**: user-facing limits → the Product Contract `## Must not break`; resource budgets → a **new conditional `## Operational limits & budgets`** section in `architecture.md`. Conditional / proportional, judgment-not-regex, no hook and no hard gate; additive, fully back-compatible, **no migration**.

### Added

- **`/pm-plan` conditional NFR / operational-limits check** — a judgment-triggered pre-draft check that fires when the feature is scale-bearing **or** the platform is resource-constrained, surfaces the resource and scale budget question, and routes the answer to its audience-split homes. Silent on a non-scale feature / non-constrained platform (proportional, no hook); an unquantifiable budget is recorded as `[?]`, never invented.
- **New conditional `## Operational limits & budgets` section in `architecture.md`** — resource budgets (RAM ceiling, boot-time, CPU headroom, system-level max-N) get a home, placed beside `## Architectural constraints` and born `N/A — <reason>` for projects with no quantified budget. Added to the architecture template (`doc/_templates/architecture.md.tmpl`) and authored/refreshed by `pm-architect` on the post-coding "Docs to update" handoff.
- **`pm-architect` ownership of the new section** — added to the Section A **A2 walk-list** and refresh triggers, and **A4-EXCLUDED** (authored engineering content with no source-tree artifact to diverge from — same cross-check exclusion the `## Behavioral contract` section carries) so an authored budget never manufactures a self-inflicted "diverges from the tree" finding.
- **Contract template note** — a one-line note in `doc/_templates/contract.md.tmpl` `## Must not break` that a quantified **user-facing limit** (max devices / endpoints supported, perceived throughput) is a valid Must-not-break item — its home.
- **Architecture decision record** — the NFR / operational-limits prompt recorded in `doc/architecture.md` as EPIC slice 3 (fire-rule, audience-split homes, proportional / judgment-not-regex / no-hard-gate), with this repo's own section carried as `N/A`.

### Notes

- Back-compat: additive only — existing projects gain the prompt at their next `/pm-plan` and the `N/A` section at their next architecture refresh; nothing retroactive. **No migration.**
- Slice 3 of the cross-document-consistency auditor EPIC; the state/event-model slice and other NFR classes (reliability, latency SLOs) are deferred to later slices.
- No hard gate by design: the fire-condition is a semantic judgement no regex can evaluate, so the prompt degrades silently if misjudged — the audience-split homes make a *recorded* budget durable and auditable.

---

## [2.22.0] — 2026-06-04

Ships **taxonomy-drift-sweep** — slice 2 of the cross-document-consistency auditor EPIC (slice 1 = `invariants-index`, v2.21.0). `pm-auditor` dimension 5 gains a **journey identifier-restatement check**: when a journey is moved (not copied) into the Behavioral contract, the auditor verifies the journey's identifier is restated at its single home and flags drift where a backticked token names a journey that no longer lives where it is referenced. The check is **gated to backticked tokens** (so prose mentions never false-trigger) and **exempts the Behavioral-contract reference** itself. The move-not-copy rule is backstopped by `pm-auditor`, with `pm-architect` carrying a one-line note pointing at that backstop. Additive, fully back-compatible, **no migration**.

### Added

- **`pm-auditor` dimension-5 journey identifier-restatement check** — verifies that a journey moved into the Behavioral contract restates its identifier at its single home, and flags drift when a backticked token names a journey no longer co-located with its reference. The check is gated to backticked tokens (sc1) and exempts the Behavioral-contract reference; the silent-condition (sc3) was corrected in-pass.
- **`pm-architect` move-not-copy backstop note** — a one-line note recording that the journey move-not-copy rule is backstopped by `pm-auditor` dimension 5.
- **Architecture decision record** — the taxonomy-drift-sweep decision (gate sc1 to backticked tokens, exempt the Behavioral-contract reference) recorded in `doc/architecture.md`.

### Notes

- Back-compat: additive only — projects with no moved journeys are unaffected. **No migration.**
- Slice 2 of the cross-document-consistency auditor EPIC; builds on the v2.21.0 `### System invariants` index.

---

## [2.21.0] — 2026-06-04

Ships **invariants-index** — the first slice of the cross-document-consistency auditor EPIC. The `## Behavioral contract (taxonomies & invariants)` section in `architecture.md` gains a single **`### System invariants`** index: one entry point for cross-cutting system invariants, each listed **by reference to its single home** (inline, an `SCn` by ID, or a journey by name). `SCn` invariants are indexed by ID and **never relocated** — mirroring the existing threat→constraint-by-ID pattern, so there is no duplication. `pm-architect` authors the index; `pm-auditor` dimension 5 gains a **structural, presence-conditional note** (triggered only when there is ≥1 `SCn` and/or ≥1 journey `**Invariants:**` block — it is not security-bearing) that flags unindexed invariants **without blocking**. Additive, fully back-compatible, **no migration**.

### Added

- **`### System invariants` index in the Behavioral contract** — a single home-by-reference index for cross-cutting system invariants in `architecture.md`. Each invariant points to its one home (inline / `SCn` by ID / journey by name); `SCn` invariants are listed by ID and stay where they live — no duplication, no relocation.
- **`pm-architect` owns index authoring** — the architect writes and maintains the System-invariants index as a subsection of the Behavioral contract.
- **`pm-auditor` dimension-5 presence-conditional note** — a structural check that fires only when the project actually carries invariants (≥1 `SCn` and/or ≥1 journey `**Invariants:**` block). It surfaces unindexed invariants as a **note, not a blocker**, and is explicitly not a security gate.

### Notes

- Back-compat: additive only — existing projects with no System-invariants index are unaffected. **No migration.**
- First slice of the cross-document-consistency auditor EPIC; later slices build on this index.

---

## [2.20.0] — 2026-06-04

Adds **automode** — a decision-authority mode that lets the protocol resolve advocate gaps on its own when the canon already answers them, instead of stopping to ask the PM for every fork. The mode is `autonomous | interactive`, **defaults to interactive**, and is graded and capped: autonomy applies only to deriving a decision from cited canon — **merge and ship stay manual in both modes**. Two scopes share one engine: a project-wide setting in a dedicated `.ai-pm/decision-authority.md`, and a per-feature override on the plan's `Decision authority:` line. Fully back-compatible — an absent file or an unrecognized value falls back to `interactive`, and there is **no migration**.

### Added

- **Decision-authority engine (single source + autonomous branch)** — `### Decision authority` defines the `autonomous | interactive` mode and the Step 3.5 autonomous branch. When autonomous, an advocate gap runs a **derive-from-cited-canon-or-escalate** gate: if the answer is derivable from cited canon the protocol resolves it; otherwise it escalates to the PM. Every autonomous decision is **announced in the console** and recorded as an `auto` or `escalated` entry under `## Resolutions`.
- **Two scopes, one engine** — project-wide authority lives in `.ai-pm/decision-authority.md`; a per-feature override lives on the plan's `Decision authority:` line. Same gate, same trail, two homes.
- **Citation-presence backstops** — `pm-plan-checker` and `pm-auditor` now guard that every `auto`-resolution entry carries a citation, so an autonomous decision cannot land uncited.
- **`veto-window-seconds`** is **recorded** alongside autonomous resolutions for honesty/auditability. Note (timer-honesty caveat): in v1 this value is recorded only — it is **not** enforced as a live countdown.

### Notes

- Back-compat: an **absent** `.ai-pm/decision-authority.md` or an **unrecognized** mode value ⇒ `interactive`. No migration is required.
- Scope of autonomy is intentionally narrow: deriving a resolution from cited canon. Merge and ship remain a manual PM action in both modes.

---

## [2.19.0] — 2026-06-04

Generalizes the v2.18.0 process flavor (which shipped **too narrow** — deliverable = a single rigid SOP) into a broader **documentation** flavor. The protocol now develops documentation projects of any shape — SOPs/runbooks, guides, specs, diagrams — not only a single SOP. The kind axis becomes `software | documentation`, the deliverable is open (one or several documents in a dedicated `deliverable/` directory), and the v2.18 dry-run stamp generalizes into one `## Validation` stamp with a declared method. Backward-compatible (`absent OR unrecognized ⇒ software`); reuse-not-new-surface — no new command, agent, or hook. This template repo stays software-kind (the machinery is dormant here except as the template it ships).

### Added

- **`MIGRATIONS.md` detection + procedure** that renames a stale downstream `## Project kind: process` line → `documentation`.

### Changed

- **Project-kind flavor `process` → `documentation`** (`WORKFLOW.md` `### Project kind`): the enum is now `kind = software | documentation`, and the default is extended to a load-bearing `absent OR unrecognized ⇒ software` for back-compat. The protocol now develops documentation projects of any shape — SOPs/runbooks, guides, specs, diagrams — not only a single SOP.
- **Open deliverable**: one or several documents (md / diagrams / images) in a dedicated `deliverable/` directory, distinct from the dev-docs in `docs/`. `process.md.tmpl` is demoted to an optional `doc/_templates/starters/sop.md.tmpl`, joined by a new `starters/guide.md.tmpl`; no mandated deliverable scaffold.
- **Validation stamp generalized**: the v2.18 `## Dry-run` stamp becomes one `## Validation: <date> — <method> — passed` stamp (method `dry-run` for actionable docs, `sign-off` for reference docs; the plan declares the method, default by doc type), gated by `pm-pr-prep` step 0 and `pm-auditor` dimension 1. The software `## Code review` path is unchanged.
- **Advocate tier generalized**: the `process` foundational-questions tier becomes a general `documentation` tier (audience / scope / coverage / decision-points / exceptions+recovery / zero-to-done); `pm-product-advocate` reused.

### Notes

- This template repo stays software-kind (the machinery is dormant here except as the template it ships). The full per-feature artifact-kind axis and the automation-opportunity scanner remain deferred (backlog).

---

## [2.18.0] — 2026-06-04

The protocol can now develop **process/documentation projects** (SOPs, runbooks) — not only software. A whole-project `kind = software | process` axis splits the pipeline: `process`-kind projects ship a written deliverable artefact with no executable code, validated by a no-code gate instead of a code build. The split is additive and reuses existing surfaces — no new command, agent, or hook — and is fully back-compatible: a project with no `## Project kind` line behaves exactly as before (software). This is the v1 slice; the full per-feature artifact-kind axis and the automation-opportunity scanner are deferred to the backlog.

### Added

- **`### Project kind` single-source rule** (`WORKFLOW.md`): a `kind = software | process` enum with a load-bearing `absent ⇒ software` default, carried as `## Project kind:` in `CLAUDE.md.tmpl` — the one place that defines what a project kind is and how it routes the pipeline.
- **`doc/_templates/process.md.tmpl`** — a Standard-Operating-Procedure artefact (purpose, scope, roles/RACI, inputs+outputs/SIPOC, procedure, decision points, exceptions+recovery, references, revision history), additive to `user-journeys.md` and contracts.
- **No-code validation gate** — a dry-run/tabletop load-bearing stamp (`## Dry-run: <date> — passed`), cloned from the review-stamp triad, gated by `pm-pr-prep` step 0 and `pm-auditor` dimension 1, plus a markdownlint pre-gate and a DoD/sign-off checklist. Pass 2 routes on project kind: a `process`-kind feature runs editorial + dry-run instead of code-review.
- **`process` tier in `### Foundational product questions`** so `pm-product-advocate` finds gaps in an SOP (roles, prerequisites, decision points, failure/recovery, zero-to-done).

### Changed

- **"What is mandatory when" table gains a project-kind rider** (`WORKFLOW.md`): for `process` kind, tests + code-review + build are inert, while plan/journeys/contracts/threat-model/audit/state still apply — existing software rows unchanged.
- **`pm-coder` remit generalized** to "author the plan's deliverable artefact" (the `docs/` ban is preserved).
- **`/pm-bootstrap` asks the project kind** and scaffolds accordingly.
- **Architecture decision record** (`doc/architecture.md`): records the whole-project kind split for v1, the reuse-not-new-surface shape (kind rider, dry-run stamp cloned from the review triad, advocate process tier), and the deferral of the full per-feature artifact-kind axis + automation-opportunity scanner.

---

## [2.17.0] — 2026-06-04

The **semantic complement** to the mechanical `### Pending-migration detection`. A template-version bump can introduce not just structural changes but new *content disciplines* (a populated threat-model lifecycle, foundational user-journeys, a value-first product story) — and the existing `pm-auditor` dimension-5 docs-currency check already detects when those disciplines are missing or stale. This release wires that detection into a PM-collaborative semantic remediation: when a docs-currency finding maps to a discipline a new template version introduced, `/pm-audit`'s fix-now relays that discipline's foundational questions so `pm-architect` can author the content with the PM, rather than leaving "your product story fell behind the template" as an untracked gap. Shipped **remediation-only** after a code-review rework removed a duplicate detector — no new command, agent, dimension, or hook; detection reuses the unchanged dimension 5.

### Added

- **`### Expected-discipline manifest` in `MIGRATIONS.md`**: a registry mapping each template version's content disciplines (populated threat-model lifecycle, foundational user-journeys, value-first product story) to the existing `pm-auditor` dimension-5 finding that detects each one, plus the foundational-question source used for remediation.

### Changed

- **`/pm-audit` stale-docs remediation enhanced** (`.claude/commands/pm-audit.md`): the existing "stale docs → pm-architect" remediation now recognizes when a docs-currency finding maps to a manifest discipline. On fix-now, the orchestrator relays that discipline's foundational questions in one `AskUserQuestion` and `pm-architect` authors the content (PM-collaborative semantic migration); accept-with-context remains the conscious-defer escape hatch.
- **`WORKFLOW.md` § Maintenance**: after a template submodule bump, run `/pm-audit` so the content disciplines a new template version introduced surface for PM-collaborative fill.
- **Architecture decision record** (`doc/architecture.md`): records the remediation-only shape — the semantic complement to the mechanical `### Pending-migration detection`, generalizing the "product story fell behind" idea, with detection reusing the unchanged dimension 5 (no new command/agent/dimension/hook).

---

## [2.16.0] — 2026-06-04

Two coupled, backward-compatible structural moves on the protocol surface. First, the bootstrap raw-drafter agent is renamed `pm-legacy-reader` → `pm-codebase-reader`: "legacy" mis-narrowed the role — a pre-existing codebase may be perfectly modern, just not greenfield — and the agent's job is to read code while writing doc drafts, which "codebase-reader" names accurately. Second, ownership of `docs/user-journeys.md` is consolidated under `pm-architect`, completing the established "reader drafts raw → pm-architect finalizes and owns" pattern (already in force for `architecture.md` and `threat-model.md`) for the one doc where it was still missing. `pm-codebase-reader` continues to draft journeys from code at bootstrap; `pm-architect` now owns per-feature updates, gap-fill, stale remediation, and finalizing that bootstrap draft. No downstream migration is required and the agent roster count is unchanged at 8.

### Changed

- **Renamed agent `pm-legacy-reader` → `pm-codebase-reader`** (`.claude/agents/pm-codebase-reader.md`): a pure existing-codebase raw-drafter at bootstrap. "Legacy" mis-narrowed the role — the codebase may be modern, just pre-existing — and the agent reads code while writing doc drafts, which the new name reflects.
- **`docs/user-journeys.md` ownership consolidated under `pm-architect`**: `pm-architect` now owns per-feature updates, gap-fill, stale remediation, and finalizing the reader's bootstrap journeys draft — completing the established "reader drafts raw → pm-architect finalizes/owns" pattern (already in force for `architecture.md` and `threat-model.md`) for the one doc where it was missing. `pm-codebase-reader` still drafts journeys from code at bootstrap.
- **Architecture decision record** (`doc/architecture.md`): records the rename and ownership move; agent roster name updated, count unchanged at 8.

### Migration

- **No downstream migration required.** The agent reaches downstream via the symlinked `.claude/agents/` plus `subagent_type`; no template names the old agent, so no downstream copy is stale. Historical artifacts retain the old name.

---

## [2.15.0] — 2026-06-04

Adds the **product axis its first independent referee**. Until now the technical axis had four checks (plan-checker, code-review, architect, auditor) while the product axis had none — every product question was self-checked by the same role that wrote the plan, which research shows is undermined by self-preference bias. `pm-product-advocate` is the product-axis twin of `code-review`: an independent referee that generates the foundational product-question gaps and **blocks the coder handoff on user-facing features** until the PM answers each gap or consciously descopes it. The gate is **block-but-sovereign** (it stops the handoff but the PM can always override by resolving or descoping — never a permanent veto) and **proportional** (backend, docs, trivial, and diagnostic-probe changes stay un-gated). It runs at two points: a pre-coding gate in `/pm-plan` (Step 3.5, user-facing changes only, scoped via human-role-subject extraction) and a foundational-question pass in `/pm-bootstrap` (forcing the zero-to-working story: discovery / onboarding / invite / recovery / device-change / why-not-incumbent / viability). The checklist lives single-source as `### Foundational product questions` in `WORKFLOW.md` (two tiers), referenced by name. Enforcement is soft (no hook) with load-bearing backstops keyed on a greppable `gaps: N` / `clean` verdict token: `pm-plan-checker` carries it as a DoD item and `pm-auditor` as dimension 1. This is the **anchor of the "technical-over-product bias" epic**.

### Added

- **`pm-product-advocate` — independent product-axis referee** (`.claude/agents/pm-product-advocate.md`): a read-only referee, the product-axis twin of `code-review`. It surfaces foundational product-question gaps on user-facing features and blocks the coder handoff until the PM answers or consciously descopes each gap — block-but-sovereign (never a permanent veto). Emits a greppable `gaps: N` / `clean` verdict token; owns its `## Resolutions` trail under a second edit-ownership carve-out.
- **Product-readiness gate in `/pm-plan` and `/pm-bootstrap`** (`.claude/commands/pm-plan.md`, `.claude/commands/pm-bootstrap.md`): `/pm-plan` runs the advocate as a pre-coding gate at Step 3.5 for user-facing changes only (scoped via human-role-subject extraction); `/pm-bootstrap` runs it as a foundational-question pass forcing the zero-to-working story (discovery / onboarding / invite / recovery / device-change / why-not-incumbent / viability).
- **Single-source foundational checklist** (`WORKFLOW.md`, `### Foundational product questions`): a two-tier checklist referenced by name, the single source the gate and both backstops draw from.

### Changed

- **Load-bearing backstops for the product-readiness gate** (`.claude/agents/pm-plan-checker.md`, `.claude/agents/pm-auditor.md`): `pm-plan-checker` carries the gate as a DoD item and `pm-auditor` as dimension 1, both keyed on the greppable `gaps: N` / `clean` verdict token so the soft (hook-less) gate has independent enforcement.
- **Edit-ownership carve-out for the advocate's resolution trail** (`WORKFLOW.md`): a second carve-out under "the role that drives a process owns its outputs" — the advocate owns its `## Resolutions` trail.
- **Architecture decision record** (`doc/architecture.md`): records the `pm-product-advocate` decision and grows the agent roster 7→8.

---

## [2.14.0] — 2026-06-04

Makes the Pass-2 code-review stamp **load-bearing** instead of by-discipline, across two linked themes. **Theme 1 — the stamp now gates the release.** Review files are born with a loud `## Code review: NOT YET RUN` marker (never a deceptively-empty heading), so an unstamped trail is visible rather than silently passing as "done". `pm-pr-prep` gains a pre-flight step 0 that refuses to prepare a release for any feature whose `## Code review` section is unstamped; `pm-auditor` blocks an unstamped trail in dimension 1; and `MIGRATIONS.md` adds a downstream migration to detect and normalize old empty placeholders into the loud marker. The `WORKFLOW.md` edit-ownership rule gains an explicit carve-out — the orchestrator owns the Pass-2 `## Code review` trail — reframed under the general model "the orchestrator writes the outputs of processes it drives". **Theme 2 — protocol-gap feedback obligation.** A new `WORKFLOW.md` section, "When the protocol itself has a gap", requires the orchestrator to write a structured report to `.ai-pm/protocol-feedback/<topic>.md` for upstreaming on discovering a structural protocol-spec gap, instead of silently working around it. This release is also the gate's first live test — it ships through its own newly-added step 0.

### Added

- **Born-honest code-review trail** (`.claude/agents/pm-plan-checker.md`): every new review file is created with a loud `## Code review: NOT YET RUN` marker rather than an empty heading, so an unstamped trail is conspicuous and the downstream gates have an unambiguous unstamped state to key on.
- **`pm-pr-prep` pre-flight stamp gate** (`.claude/agents/pm-pr-prep.md`, new step 0): before bumping the version, committing, or pushing, `pm-pr-prep` verifies every in-scope `_review.md` whose `## Code review` section is present is stamped `## Code review: <date> — passed`; an unstamped trail returns a BLOCKED report and stops the release. The rule is keyed on section presence (no filename special-casing); section-absent trails are exempt.
- **`pm-auditor` blocks unstamped trails** (`.claude/agents/pm-auditor.md`): dimension 1 now treats an unstamped `## Code review` section as a blocking finding, so an audit catches a load-bearing-stamp gap independently of the release gate.
- **Migration: normalize unstamped code-review trails** (`MIGRATIONS.md`): a downstream migration detects old empty `## Code review` placeholders and normalizes them to the loud `## Code review: NOT YET RUN` marker so existing projects gain the conspicuous-unstamped state.
- **Protocol-gap feedback section** (`WORKFLOW.md`, "When the protocol itself has a gap"): on discovering a structural protocol-spec gap, the orchestrator writes a structured report to `.ai-pm/protocol-feedback/<topic>.md` for upstreaming instead of silently working around it.

### Changed

- **Edit-ownership carve-out for the Pass-2 trail** (`WORKFLOW.md`): the edit-ownership rule gains an explicit carve-out — the orchestrator owns the Pass-2 `## Code review` trail — reframed under the general "the orchestrator writes the outputs of processes it drives" model, making the load-bearing stamp consistent with the edit-ownership invariant.
- **stamp-grep tightened** (`.claude/agents/pm-pr-prep.md`): the step 0 stamp detection greps `^## Code review(:.*)?$` so it tests the stamp line and its `— passed` date, excluding the separate `## Code review findings` heading from the gate.
- **Architecture decision record** (`doc/architecture.md`): records the edit-ownership carve-out (orchestrator owns the Pass-2 `## Code review` trail) and the protocol-gap feedback obligation.

---

## [2.13.0] — 2026-06-04

Adds a full **threat-model lifecycle** as new protocol behaviour, owned by the existing `pm-architect` (no new agent). The lifecycle is gated on security-bearing projects, signalled by the mere presence of `docs/threat-model.md` — the same artifact-driven gating invariant that `MIGRATIONS.md` conditions already use. Bootstrap now drafts the threat-model *populated* (real assets, threats, and mitigations) instead of laying down an empty skeleton; a feature that touches a security-relevant surface must update it, enforced as a `/pm-plan` trigger and a `pm-plan-checker` block; and `pm-auditor` flags an empty threat-model (blocking) or a stale one (note) plus dangling or orphan `SCn` wiring (note). Threats now wire one-way into architecture: a Threats-row Mitigation references `SCn` IDs in `architecture.md` § Security constraints (move-not-copy), and the template gains a dated `Last reviewed` field and an `SCn`-keyed Mitigation column. Origin: real downstream pain — the wb-mqtt-matter "untrusted server" project left its scaffolded threat-model an empty skeleton, so the protocol never made anyone fill it in. The README was also brought to currency in the same release. `tests/hooks.sh` 71/71.

### Added

- **Threat-model lifecycle owned by `pm-architect`** (`WORKFLOW.md`, `.claude/commands/pm-bootstrap.md`, `.claude/commands/pm-plan.md`, `.claude/agents/pm-plan-checker.md`, `.claude/agents/pm-auditor.md`): `docs/threat-model.md` gains a full lifecycle gated on security-bearing projects (signalled by the file's presence), with no new agent. Bootstrap drafts it populated, not an empty skeleton. A feature touching a security-relevant surface must update it — a `/pm-plan` trigger and a `pm-plan-checker` block. `pm-auditor` flags an empty threat-model (blocking) or a stale one (note), and dangling/orphan `SCn` wiring (note).
- **Single-source "Security-relevant surfaces" list** (`WORKFLOW.md`): one durable list of the surfaces that trigger a threat-model update, referenced by name from `/pm-plan` and `pm-plan-checker` (and keyed off the durable artifact by `pm-auditor`) rather than copied — the same single-source-of-conditions invariant as `MIGRATIONS.md`.
- **threat → constraint wiring** (`doc/_templates/threat-model.md.tmpl`, `doc/_templates/architecture.md.tmpl`): a Threats-row Mitigation now references `SCn` IDs in `architecture.md` § Security constraints (one-way, move-not-copy). The threat-model template gains a dated `Last reviewed` field and an `SCn`-keyed Mitigation column; `architecture.md.tmpl` § Security constraints gains stable `SC` IDs to anchor the references.

### Changed

- **Architecture decision record** (`doc/architecture.md`): records the threat-model ownership-and-lifecycle decision — `pm-architect` owns `docs/threat-model.md`, gating is by artifact presence, the "Security-relevant surfaces" list is single-sourced in `WORKFLOW.md` and referenced by name, and threat→constraint wiring is one-way via `SCn` IDs.
- **README brought to currency** (`README.md`): added the threat-model risk-reduction line; condensed the stale per-version migration sections (stuck at v2.3) into the generic "обнови шаблон" path plus a pointer to `MIGRATIONS.md` (the v1.x→v2.0 manual section was kept); added the v2.12 Blast-radius preflight mention; and added `threat-model.md` to the downstream `docs/` tree.

---

## [2.12.0] — 2026-06-03

Adds a new domain-agnostic protocol behaviour: the **Blast-radius preflight** gate. Before any on-hardware "run it for real" or a diagnostic probe that restarts or structurally mutates a live target, the orchestrator now stops and asks one question — *does the effect reach an external stateful peer whose state a local revert will not undo?* — and if the live target is coupled to such a peer, it surfaces the blast radius to the PM before acting. This guards the trap *reversible locally ≠ reversible for a coupled external peer*: a probe's "throwaway / I revert it afterwards" framing is false when the side effect lives outside, in a paired external system's own record of the target. The gate is defined once in `WORKFLOW.md` and single-sourced from Step 5.5 and Step A.5; the originating wb-mqtt-matter live-paired-bridge incident is named only as the worked example, never as protocol vocabulary. Purely additive — it adds a precondition before acting and relaxes none of the Step A read-only default or the Step A.5 probe rules. `tests/hooks.sh` 71/71.

### Added

- **Blast-radius preflight gate** (`WORKFLOW.md`, new section under "When you say it doesn't work in production"): one named, domain-agnostic concept — before an on-hardware/live action whose effect reaches an external stateful peer that a local revert won't undo, the orchestrator stops and surfaces the blast radius to the PM. It offers safe alternatives first (separate/throwaway target, separate identity), keeps structural mutations off the user's live coupled target by default, and proceeds against a live coupled target or down a re-commission/re-pair recovery path only on explicit PM consent with the recovery planned as a mandatory step. The wb-mqtt-matter case (a structural device test on a live paired bridge corrupted the ecosystem's own device record, which reverting the bridge did not heal) is the worked example only.

### Changed

- **Step 5.5 and Step A.5 reference the gate** (`WORKFLOW.md`): Step 5.5 ("run it for real") and Step A.5 ("diagnostic probe") now invoke the single-sourced Blast-radius preflight before exercising or probing a live target, instead of restating the rule.
- **Diagnostic-probe row qualifier** (`WORKFLOW.md`, the "What is mandatory when" table): the "Diagnostic probe / spike" row now notes the Blast-radius preflight still applies — a coupled live target is stop-and-surface even for a skip-all probe.
- **Architecture decision record** (`doc/architecture.md`): records that the preflight is enforced by soft prose plus orchestrator discipline, not a `PreToolUse` hook — coupling to an external peer is runtime state a regex guard cannot read, consistent with the 2026-06-02 rejection of a hard edit-ownership guard — and that the rule is phrased domain-agnostically with the wb-mqtt-matter incident as worked example only.

---

## [2.11.2] — 2026-06-03

Mechanical whitespace fix for blank-line correctness on PM-facing rendered markdown — no wording change. PRIMARY: a durable one-paragraph markdown-authoring rule is added to `WORKFLOW.md` ("surround lists/tables/headings with blank lines; never two adjacent soft-break lines"), read by every doc-writing agent so authored and generated markdown stays blank-line-correct going forward. SECONDARY: a one-time fix of 7 already-shipped static/generator instances the rule cannot retroactively reach. `tests/hooks.sh` 71/71.

### Added

- **Markdown-authoring rule** (`WORKFLOW.md`, near the PM-communication guidance): one paragraph instructing every doc-writing agent to surround block elements — lists, tables, headings — with blank lines and never place two adjacent non-blank soft-break lines, so authored/generated markdown renders correctly in non-CommonMark renderers and passes markdownlint MD022/MD032.

### Fixed

- **Product-map generation output** (`.claude/commands/pm-bootstrap.md`, the `## Product map generation procedure` Output format and Worked example): a blank line now separates each `### [<contract>]` heading from its `- **User value:**` bullets, so every downstream `product-map.md` renders the list correctly on its next regeneration.
- **Shipped template whitespace** (`doc/_templates/CLAUDE.md.tmpl`, `doc/_templates/threat-model.md.tmpl`, `doc/_templates/ui-guide.md.tmpl`): added the missing blank line before flagged lists and the Tech-stack table.

### Changed

- **Architecture record** (`doc/architecture.md`): the contract-centric product-map entry now notes that the generated map keeps lists/tables/headings blank-line-separated per the markdown-authoring rule in `WORKFLOW.md`, and adds `doc/features/markdown-blank-line-sweep_plan.md` to its Source list.

---

## [2.11.1] — 2026-06-03

Pure structural refactor, no behavior change. The migration catalogue — the `### Pending-migration detection` conditions plus every per-version migration procedure — is extracted out of `.claude/commands/pm-bootstrap.md` into a new protocol-root reference `MIGRATIONS.md` (sibling to `WORKFLOW.md`), referenced by bare filename so it resolves both in this repo and downstream at `.ai-pm/tooling/MIGRATIONS.md`. `pm-bootstrap.md` keeps a short pointer; the `## Product map generation procedure` stays there (migration procedures cross-reference it). The single-source-of-conditions invariant is preserved — `/pm-plan`, `/pm-audit`, `pm-auditor`, and `pm-plan-checker` reference the one home by name. `tests/hooks.sh` 71/71.

### Changed

- **Migration catalogue extracted to `MIGRATIONS.md`** (new protocol-root reference; out of `.claude/commands/pm-bootstrap.md`): the `### Pending-migration detection` conditions and the per-version migration procedures now live in one file, sibling to `WORKFLOW.md` and referenced by bare filename (resolves in this repo and downstream at `.ai-pm/tooling/MIGRATIONS.md`). `pm-bootstrap.md` retains a short pointer to it; the `## Product map generation procedure` deliberately stays in `pm-bootstrap.md` because the migration procedures call it.
- **References re-pointed to the single home** (`.claude/commands/pm-plan.md`, `.claude/commands/pm-audit.md`, `.claude/agents/pm-auditor.md`, `.claude/agents/pm-plan-checker.md`): each now names `### Pending-migration detection` in `MIGRATIONS.md` instead of `pm-bootstrap.md`, preserving the single-source-of-conditions invariant across the move.
- **Architecture record** (`doc/architecture.md`): added the "Migration catalogue is a single protocol-root reference `MIGRATIONS.md`, sibling to `WORKFLOW.md`" decision and a File-layout row for the new file.

---

## [2.11.0] — 2026-06-03

Adds a protocol convention: the orchestrator surfaces substantive PM decision-forks — scope choices, accept-vs-fix, which-of-N, prioritization — via the AskUserQuestion tool rather than plain-prose "(A)/(B)?" forks, while simple proceed/confirm gates (merge-authorization, "ready?", plain yes/no) stay prose to avoid tool-spam. The convention is recorded in WORKFLOW.md and reinforced by a short clause appended to the UserPromptSubmit route-reminder. Motivation: the orchestrator drifted to plain-prose forks with nothing nudging it back.

### Added

- **AskUserQuestion convention for PM decision-forks** (`WORKFLOW.md`, near the PM-communication guidance): substantive forks — scope, accept-vs-fix, which-of-N, prioritization — are presented through the AskUserQuestion tool (structured, side-by-side options with previews); simple proceed/confirm gates (merge-auth, "ready?", plain yes/no) stay prose so the structured form does not become tool-spam.

### Changed

- **Route-reminder clause** (`.claude/settings.json`, `UserPromptSubmit` hook): the `additionalContext` text now carries a short clause pointing at the AskUserQuestion convention. Text-only addition — the matcher, the trigger regex, and the `hookSpecificOutput.additionalContext` output shape are unchanged.
- **Architecture currency note** (`doc/architecture.md`): added a dated note recording that the route reminder now points at the AskUserQuestion convention, with the convention itself owned by `WORKFLOW.md`.

---

## [2.10.0] — 2026-06-03

Extends the two-layer docs split into feature contracts (slice 4). A contract's `## User value` / `## Out of scope` are now the token-free PM layer (plain product language), while machine grammars — topic conventions, `<x>_<y>` id/format grammars, status enums, dotted config keys, `retain` / `QoS` flags, raw wire ranges — are single-owned in `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` and referenced from `## Must work` / `## Must not break`, never restated inline. A structural wire-token lint backs the split, and existing token-laden contracts get a move-not-copy migration that preserves every guarantee. Motivation: caught live on wb-mqtt-matter 2026-06-03 — wire-tokens leaked through a contract's `## Out of scope` into the PM-facing product-map.

### Added

- **Contract two-layer split** (`doc/_templates/contract.md.tmpl`): `## User value` and `## Out of scope` are marked the **token-free PM layer** (plain product language, no wire-tokens); `## Must work` and `## Must not break` now instruct to **reference** `docs/architecture.md` `## Behavioral contract (taxonomies & invariants)` for machine grammars instead of restating them inline.
- **Structural wire-token lint (non-blocking)** (`.claude/agents/pm-plan-checker.md` on a plan/contract change, `.claude/agents/pm-auditor.md` on the project sweep): flags wire-token *shapes* in a contract's PM-facing sections (`## User value` / `## Out of scope`) and in the generated product-map's `- **User value:**` / `- **Out of scope:**` lines. Wire-tokens are topic paths (leading-slash MQTT-style, e.g. `/devices/.../on`), `<x>_<y>` id/format grammars, dotted config keys (`bridge.*`, `mqtt.socketPath`), protocol flags (`retain` / `QoS`), raw wire ranges (`0..254`). It is a structural pattern match on token shapes — **not prose-policing** — and domain vocabulary (`DimmableLight`, `Matter`, `fabric`) is never flagged. A relative `docs/architecture.md` `## Behavioral contract` reference is the intended token-free form and is never flagged.
- **Move-not-copy contract migration** (`.claude/commands/pm-bootstrap.md` `### Pending-migration detection`; offered at `.claude/commands/pm-plan.md` and `.claude/commands/pm-audit.md`): for existing token-laden contracts, `pm-architect` relocates grammars into the single-owner `## Behavioral contract` and rephrases the PM sections token-free, preserving every `## Must work` / `## Must not break` guarantee.
- **Migration guarantee-preservation check (blocking)** (`.claude/agents/pm-plan-checker.md`): on a contract two-layer migration, compares the migrated contract against the original (`git show` the pre-migration version) and **blocks** if any Must-work / Must-not-break guarantee is dropped or weakened.

### Changed

- **Architecture record** (`doc/architecture.md`): added the "Contracts are two-layer; wire-tokens are single-owned in the Behavioral contract and referenced" decision, recording this as slice 4 of the two-layer-docs sequence (extending slice 3, the Behavioral contract).

---

## [2.9.1] — 2026-06-03

Two coupled protocol-enforcement fixes. The `UserPromptSubmit` route-reminder trigger vocabulary in `.claude/settings.json` is broadened to cover removal/edit verbs, closing a gap where requests like "убери ..." fired no reminder. And `pm-pr-prep` no longer pins `model: haiku` — it now inherits the session model like every other `pm-*` agent, after pinned Haiku produced factual errors in PM-facing CHANGELOG entries.

### Fixed

- **Route-reminder vocabulary** (`.claude/settings.json` `UserPromptSubmit` hook): the keyword gate now also matches removal/edit verbs — `remove`/`delete`/`drop`/`rename`/`extract`/`update` and `убери`/`убрать`/`удали`/`сними`/`вынеси`/`переименуй`/`обнови` — so change requests phrased with an edit/removal verb fire the protocol reminder. The keyword gate is kept (non-change prompts stay silent).
- **`pm-pr-prep` model unpinned** (`.claude/agents/pm-pr-prep.md`): removed `model: haiku` from the frontmatter; the agent now inherits the session model like every other `pm-*` agent. Pinned Haiku produced repeated factual errors in PM-facing CHANGELOG entries (CHANGELOG authoring is PM-facing text, not pure mechanics). No agent pins `model:` now.

### Changed

- **Decision-reversal record** (`doc/protocol-vs-builtins-analysis.md`): documented that the prior "keep `haiku` on `pm-pr-prep`" decision is reversed; the model-tier conclusion and Step 0 of the action plan are annotated accordingly.
- **Architecture currency note** (`doc/architecture.md`): added a dated note recording that `pm-pr-prep` no longer stays `haiku` and that the route-reminder vocabulary was broadened.

### Tests

- **6 new `UserPromptSubmit` cases** (`tests/hooks.sh`): 5 removal/edit-verb prompts (RU + EN) assert the reminder fires, plus one question phrasing ("как это обновляется?") asserts it stays silent. Suite now 71/71.

---

## [2.9.0] — 2026-06-03

Makes on-disk artifact strings English-canonical: all scaffolded and regenerated files (`product.md`, product-map, templates, agent/command prose) use English headers and labels. Conversation language unchanged — agents relay artifacts to the PM in the PM's language. Existing downstream projects with Russian headers are offered a headers-only migration (preserving authored prose), with automatic detection preventing false-positive "missing header" flags during transition.

### Added

- **English-canonical artifact strings**: `product.md` funnel headers (`## Why this exists` / `## What it does today` / `## Documents` / `## Features`), product-map labels (`- **User value:**` / `- **Out of scope:**` / `Built by:`, replacing Russian `Что даёт:` / `Границы:` / `Чем построено:`), and `↑ same work` repeat marker — all new scaffolds carry English.
- **Russian-header product.md migration**: when an existing downstream `product.md` carries Russian funnel headers, a headers-only migration is offered at `/pm-plan` and `/pm-audit` — `pm-architect` (owner of `product.md`) rewrites the four headers to English, preserving the authored prose verbatim (no machine-translation).
- **Broadened old-format-map detection** (`pm-bootstrap.md` `### Pending-migration detection`): a product-map triggers the format-refresh note if it carries the pre-v2.6 `Guarantees:` label **or** the v2.6 Russian `- **Что даёт:**` label; regeneration yields English labels automatically.
- **Language-canon record** (`WORKFLOW.md`, `CLAUDE.md.tmpl`): "Conversation language: the user's. On-disk artifacts (files, code, commits, agent-authored docs): English." Recorded once so all agents and downstream projects inherit the rule.

### Changed

- **Product-map generation** (`.claude/commands/pm-bootstrap.md`): output format, procedure, and worked example now emit English labels for newly scaffolded projects.
- **Agent references** (`pm-auditor`, `pm-architect`, `pm-bootstrap`, `pm-plan`, `pm-audit`, `CLAUDE.md.tmpl`, `architecture.md.tmpl`, `doc/architecture.md`): all funnel-header and map-label prose align to English strings and correctly route Russian headers/labels to migration procedures.
- **Architecture record** (`doc/architecture.md`): documented English-canonical decision and the two-axis rule (conversation ↔ PM's language; on-disk artifacts ↔ English). Owner: `pm-architect`.

### Fixed

- **No false-positive missing-header flag on Russian-header projects**: `pm-auditor` now detects Russian headers as a migration *trigger* (format note), never as a missing-header *finding*, so the grep flip and downstream migration ship together without breaking live projects during transition.

---

## [2.8.0] — 2026-06-03

Adds a new home for technical taxonomies and invariants (`## Behavioral contract` in `architecture.md`) and rewrites journey-step guidance into human language, eliminating protocol identifiers and format tables from step bodies and journeys' Invariants fields. Journeys now reference the Behavioral contract section move-not-copy, establishing single-source-of-truth for all format/taxonomy invariants.

### Added

- **Behavioral contract section** (`doc/_templates/architecture.md.tmpl:65`): new top-level `## Behavioral contract (taxonomies & invariants)` section, distinct from `## Integration contract`, serves as the single owner for status enums, topic/ID grammars, QoS levels, reachability rules, and other domain invariants. Includes guidance for `N/A — <reason>` when projects have no taxonomies.
- **Human-language journey guidance** (`doc/_templates/user-journeys.md.tmpl:13–28`): step guidance rewritten to demand human-language text ("what the user does / expects / can go wrong") with **no** protocol identifiers, field names, QoS, or retain flags in step bodies. The `**Invariants:**` field now routes all format/taxonomy invariants to `## Behavioral contract` by reference (move-not-copy), eliminating duplication and drift.
- **Agent walk-list sync** (`pm-architect.md:18`, `pm-bootstrap.md:141`): both now include `Behavioral contract (taxonomies & invariants)` in their lists; `pm-architect` A4 cross-check set explicitly kept unchanged (File layout / Release flow / Integration contract only — Behavioral contract is authored content, not auto-checked).
- **Legacy-reader routing** (`pm-legacy-reader.md:70`): new guidance routes observed identifiers (status enums, topic/ID names, QoS, retain, reachability rules) into the architecture draft's `## Behavioral contract` section, never into journey step bodies.

### Changed

- **Architecture record** (`doc/architecture.md`): recorded that technical taxonomies and invariants are owned by a single Behavioral contract section; journeys are human-language and reference it move-not-copy. Owner: `pm-architect`.

---

## [2.7.0] — 2026-06-03

README front-gate (two-layer-docs slice 2): the scaffolded README no longer owns a capability list. `## What it does` is removed from the template and replaced with a single pointer to `docs/product.md`, so `docs/product.md` `## Что умеет сегодня` is the single owner of "what it does / for whom / limits" — eliminating the cause of README↔product.md drift. For existing downstream projects (README is authored, not regenerated), a move-not-copy migration is offered.

### Added

- **README template front-gate** (`doc/_templates/README.md.tmpl`): the `## What it does` capability list is removed and replaced with a one-line pointer to `docs/product.md`; Quick start / Architecture / Development / License unchanged. New scaffolds carry no capability list. No status line.
- **Old-template README migration** (`pm-bootstrap.md` → `### Pending-migration detection` + the README front-gate migration procedure): an existing `README.md` carrying a `## What it does` list is detected (positive presence of the heading; new-structure READMEs not flagged) and offered a **move-not-copy** migration — `pm-architect` reconciles the README's capabilities into `docs/product.md` `## Что умеет сегодня` first, then removes the README list and inserts the pointer. Install / Quick start preserved (pm-architect A4 cross-check stays valid). Precondition: an authored `docs/product.md` must exist (run the v2.3 migration first if absent).
- **Detection surfaces** (`pm-auditor.md`, `pm-plan.md`, `pm-audit.md`): a non-blocking structure-only note and migration nudge for the old-template README, each referencing `### Pending-migration detection` by name (the condition is not re-encoded).

### Changed

- **Architecture record** (`doc/architecture.md`): documented that the README owns no capability statements, `docs/product.md` is the single owner, and existing projects are migrated move-not-copy. Owner: `pm-architect`.

---

## [2.6.0] — 2026-06-03

Reorders product contract blocks to lead with user value and boundary statements, demoting the technical build table to a secondary position, addressing real-project feedback on contract readability and facilitating format-refresh detection for maps still using deprecated `Guarantees:` labels.

### Added

- **Value-first contract layout** (`pm-bootstrap.md` §2): product-map contract blocks now lead each feature/non-infra bucket with `Что даёт:` (from `## User value`) and `Границы:` (from `## Out of scope`), placing the technical build table under a plain `Чем построено:` label below. Worked example updated.
- **Old-format detection** (`pm-bootstrap.md` §2.1 `### Pending-migration detection`): condition for maps using deprecated `Guarantees:` label added (distinguishes content-stale audit finding from format-upgrade offer). Auditor, `/pm-audit`, `/pm-plan` surfaced as non-blocking reminders.

### Changed

- **Contract block structure** (`pm-bootstrap.md` step 2): technical table moved under `Чем построено:` heading; `Границы:` now omitted when `## Out of scope` is empty per existing rule.
- **Architecture record** (`doc/architecture.md` §3): documented the value-first rendering pattern (markup-only projection, no HTML `<details>`) and old-format detection route. Owner `pm-architect`.

---

## [2.5.0] — 2026-06-02

Makes detection of an un-migrated template structure reliable and turns the passive "map missing" note into an active offer to run the pending migration (backlog #4).

### Added

- **Single-sourced detection** (`pm-bootstrap.md` § `Pending-migration detection`): new named subsection consolidates both un-migrated conditions (lingering `docs/features/_index.md`; or generated `docs/product.md` + frozen v2.3 signature with no `docs/product-map.md`) and the frozen signature string in exactly one place. Cited by name from `pm-auditor`, `pm-audit`, `pm-plan` — no re-encoding.
- **Auditor reliability** (`pm-auditor.md`): inventory sourced from `git log` only (lingering `_index.md` flagged as un-migrated structure, never an inventory source); `product-map.md`-exists check moved to hard early gate (line 110) before re-derivation; greenfield/feature-less exemption made stricter (precondition: no `_index.md` + no contracts + no plans).
- **Active offer path** (`/pm-audit`): when un-migrated structure is found, auditor flags it read-only; orchestrator offers a remediation branch ("The auditor only flagged it; run `/pm-bootstrap` to migrate"). `/pm-plan` adds a sibling retrospective-check nudge (cloned from 5+-features block), PM-authorized, never auto-runs.

### Changed

- `pm-bootstrap.md`: migration procedures (v2.2/v2.3 steps) unchanged; detection prose moved to named subsection, procedures now reference by name.
- `pm-auditor.md`, `pm-audit.md`, `pm-plan.md` — route detection to named subsection; auditor retains read-only, offer/action lives in orchestrator commands.

---

## [2.4.0] — 2026-06-02

Aligns `architecture.md` template and agents with drifted coherence, addressing backlog findings #2, #3, #5: template enriched with coarse module-map section, integration-contract clarification, and release-flow guidance; agent/auditor prose aligned to match; one self-contradiction in the protocol's own `doc/architecture.md` fixed.

### Added

- **Template enrichment** (`doc/_templates/architecture.md.tmpl`): new sections `File layout (module map)` (coarse directory/module → responsibility map, not per-function; distinct from PM-facing `docs/product.md` "## Документы"), `Integration contract`, and `Release flow`. Renamed `Key decisions → Architectural decisions` and `Constraints → Architectural constraints` for clarity.
- **Agent prose alignment**: `pm-architect.md` A4 cross-check section lists, `pm-bootstrap.md` section enumeration now literally match enriched template (no phantom sections, no skips).
- **Auditor anchor refinement** (`pm-auditor.md` §5 Docs currency): check keys on named `File layout (module map)` section, stopping phantom "components must be listed" soft-requirement the template couldn't satisfy.

### Fixed

- **`doc/architecture.md:115`**: self-contradiction — absolute claim "hooks are `PreToolUse`-only" replaced with "`PreToolUse` guards plus one `UserPromptSubmit` route reminder", consistent with line 100 and `.claude/settings.json` configuration (which ships both routes).

---

## [2.3.0] — 2026-06-02

Splits the product documentation into two layers, addressing real-project feedback from wb-mqtt-matter: an authored PM front door (funnel) and a generated contract-to-features map.

### Added

- **`docs/product.md` as authored PM front door** (owned by `pm-architect`) — a funnel scaffolding why the product exists / what it does today / key documents / functions. Never regenerated by the auditor. Includes the "что пока НЕ умеет" boundary example. Validated one-pass by PM from bootstrap product Q&A.
- **`docs/product-map.md` as generated contract→features map** (rebuilt by `pm-auditor` / Product map generation) — clickable contract links, user-value guarantees from the contract's `## User value` section, status legend, and collapsing for multi-contract features (`↑ та же работа`).
- **Invariants for each writer** (`pm-architect` / `pm-auditor` / product map procedure): "writes only X, never Y" — enforced in procedures and arch notes to prevent concurrent regeneration of the same layer.
- **Migration (v2.3, idempotent, Variant A):** `/pm-bootstrap` detects pre-split state (signature line present in `product.md` AND `product-map.md` absent), `git mv`s to the generated file, and scaffolds fresh authored `product.md` from template. Signature coupling (frozen detection string) preserved to ensure two-guard idempotency.

### Changed

- `pm-bootstrap.md`, `pm-auditor.md`, `pm-architect.md`, `pm-plan.md` — retargeted to split ownership (map generation / front-door authoring).
- `doc/_templates/product.md.tmpl` — new authored template, includes "что пока НЕ умеет" boundary example, marked as not-generated.
- `doc/_templates/CLAUDE.md.tmpl` — added `docs/product-map.md` row; noted `product.md` as authored funnel.
- `doc/architecture.md` — documented authored/generated split; "deliberate exception" note covers both files.
- `README.md` — v2.3 migration section, capability descriptions reflect split.
- `tests/hooks.sh` — unchanged; 65/65 pass.

### Migration (downstream projects)

After `git submodule update --remote`, run the v2.3 migration: tell the agent **«мигрируй на v2.3»** (or re-run `/pm-bootstrap`, which detects it) — if the old merged-document structure is present (signature line found), the agent splits `docs/product.md` into authored funnel + `docs/product-map.md`, scaffolds the new front door, and removes the signature line. One run, idempotent, safe on greenfield projects. See README § "Миграция на v2.3.0".

---

## [2.2.3] — 2026-06-02

### Fixed

- `pm-pr-prep`: in release commit step 4, now stages feature review artifacts from `.ai-pm/reviews/` and `.ai-pm/arch/` alongside CHANGELOG + metadata. Root-cause fix: PR #158's review file (`fixup-orchestrator-no-external-state_review.md`) was committed in the feature branch but not re-staged into the release commit, leaving it orphaned on merge. Recovers the artifact.

### Changed / Docs

- `.ai-pm/backlog.md`: recorded four protocol findings from downstream wb-mqtt-matter feature review (PR #158): edit-ownership enforcement gap, `architecture.md` module-map section, template/tooling desync, product-map migration trigger + auditor detection bug. Deferred to `/pm-plan` cycle.

---

## [2.2.2] — 2026-06-02

### Changed

- `.claude/settings.json`: added top-level `"autoMemoryEnabled": false` to disable orchestrator auto-memory (private state store outside project root). All protocol state lives in project artifacts (`.ai-pm/`, `doc/`, plans, reviews).
- `.gitignore`: added `.claude/tmp/` as sanctioned project-local scratch directory (git-ignored, passes path-boundary hooks).
- `WORKFLOW.md`: documented `.claude/tmp/` as throwaway/diagnostic scratch dir inside project root (not `/tmp`).
- `README.md`: noted orchestrator auto-memory is off and `.claude/tmp/` is the scratch directory.

---

## [2.2.1] — 2026-06-02

### Changed

- Docs: updating the template can be requested in plain language ("обнови шаблон" / "bump ai-pm-protocol to vX.Y") — documented in README and WORKFLOW.md as orchestrator chore work (submodule bump on a branch + any pending migration), no `/pm-plan` needed.

---

## [2.2.0] — 2026-06-02

Realignment of the protocol around best-in-class built-in skills/tools, a contract-centric product map, and a PM-authorized diagnostic-probe mode.

### Added

- **Agent/skill routing guard** (`PreToolUse`): denies `wb-*` role duplicators (`coder`, `code-reviewer`, `design-review`, `plan-feature`, `pr-prep`, `wb-git:workflow`, `wb-git:pr-author`) with a pointer to the `pm-*` equivalent. Named deny-list — `code-review`, `deep-research`, and `wb-*` knowledge skills stay available.
- **UserPromptSubmit route reminder**: reasserts the protocol route on change-intent prompts (RU + EN), silent on chit-chat; exempts PM-authorized diagnostic probes.
- **Explicit `tools:` frontmatter** on all seven `pm-*` agents (read-only reviewers can no longer edit code; Web confined to `pm-stack-researcher`; `Skill` kept for `pm-coder`/`pm-stack-researcher`).
- **PR-review-response path** (WORKFLOW Step 7): orchestrator-driven loop for review comments on an open PR — fetch, triage, fix via `pm-coder`, reply, resolve.
- **`verify`/`run` adoption** (WORKFLOW Step 5.5): optionally exercise a feature for real before ship.
- **`docs/product.md`** — contract-centric product map (group → contract → features + reviews + Infrastructure bucket), generated and audit-verified; **Product map generation procedure**.
- **`Built/changed by`** section in `contract.md.tmpl`.
- **`pm-plan-checker` DoD** artifact-completeness item (the per-feature gate that replaced the index).
- **PM-authorized diagnostic-probe mode** (WORKFLOW Step A.5): a throwaway, runtime/local probe to confirm a hypothesis, proposed to the PM in plain language with before→after, never editing a repo-owned file in place.
- Design/plan docs: `doc/protocol-vs-builtins-analysis.md` and feature plans for the realignment, product map, and probe mode.

### Changed

- `pm-*` judgment agents drop pinned `model:` to inherit the orchestrator model; `pm-pr-prep` stays `haiku`.
- `/pm-research` and `pm-stack-researcher` delegate search + adversarial verification to the built-in `deep-research` engine, keeping only their frame.
- `pm-coder` may load `wb-*` knowledge skills (codestyle, packaging, platform); WebSearch is tool-locked out.
- `pm-auditor` dimension 5 checks `docs/product.md` currency instead of the feature index.
- `pm-bootstrap` / `pm-plan` generate and maintain `docs/product.md`.
- `README.md` synced to v2.2.0 (product map, diagnostic-probe mode, mechanical route discipline, built-in delegation).

### Removed

- `docs/features/_index.md` (feature index) — replaced by the contract-centric `docs/product.md`.

### Migration (downstream projects)

- After `git submodule update --remote`, run the v2.2 migration: tell the agent **«мигрируй на v2.2»** (or re-run `/pm-bootstrap`, which detects it) — it generates `docs/product.md` from your existing contracts / plans / reviews and removes the orphaned `docs/features/_index.md`. One command, nothing else changes. See README § "Миграция на v2.2.0".
- The agent/skill guard now denies `wb-*` role agents — switch to the `pm-*` equivalents. `wb-*` knowledge skills are unaffected and encouraged.

---

## [2.1.7] — 2026-06-01

### Fixed

- `pm-auditor` халтурил, читая предыдущие аудиты как источник истины. Два корневых бага:
  1. Таблица contract-check перемещена на шаг 3 (до применения любых dimension), чтобы экстракция субъектов происходила до формирования выводов.
  2. Предыдущие аудит-файлы явно запрещены как источник доказательств. При загрузке контекста читается только дата последнего аудита, не содержимое. Добавлено hard rule.

---

## [2.1.6] — 2026-06-01

### Fixed

- `pm-auditor` всё ещё пропускал отсутствующие контракты — модель применяла суждение о категории фичи поверх правила извлечения субъекта. Таблица contract-check добавлена как обязательная секция в формат выходного файла: аудитор вынужден заполнить строку для каждой фичи до написания Blocking/Notes.

---

## [2.1.5] — 2026-06-01

### Fixed

- `pm-auditor` пропускал контракты для packaging-фич несмотря на правило из v2.1.2. Корень: «identify the role» — это суждение, которое модель переопределяла категорией фичи («packaging = infrastructure»). Заменено на обязательный шаг механического извлечения: аудитор выписывает подлежащее первого предложения каждого сценария ДО вынесения вердикта. Категория фичи при этом игнорируется.

---

## [2.1.4] — 2026-06-01

### Added

- После diff-аудита оркестратор явно сообщает что проверка была частичной и предлагает полный аудит через `AskUserQuestion`. Предотвращает ситуацию когда pre-existing пробелы (например, старые фичи без контрактов) остаются незамеченными.

---

## [2.1.3] — 2026-06-01

### Fixed

- `pm-audit` не триггерился на русскоязычные команды ("проверь проект", "аудит" и т.п.) — оркестратор делал ручную inline-проверку вместо вызова скилла. Добавлены русские триггеры и явный запрет на inline-проверки.

---

## [2.1.2] — 2026-06-01

### Fixed

- `pm-auditor` пропускал отсутствующие контракты у packaging/deployment фич — критерий «user-observable» интерпретировался как «видно в UI». Теперь аудитор явно выводит роль пользователя (end-user, integrator, operator) и use case из каждого сценария плана. Если роль называется → контракт обязателен.

---

## [2.1.1] — 2026-06-01

### Changed

- `docs/features/_index.md` — обогащён формат индекса: добавлены колонки `Planned`/`Done` (из git), `Review` и `Contract` (ссылки на артефакты). Авто-группировка по компонентам из `docs/architecture.md`. Процедура генерации вынесена в `pm-bootstrap.md` и переиспользуется из `pm-plan`. `pm-auditor` проверяет корректность ссылок и актуальность группировки.

---

## [2.1.0] — 2026-06-01

### Added

- `docs/features/_index.md` — автоматически поддерживаемый индекс фич. Статус выводится из артефактов: `done` (есть `.ai-pm/reviews/<topic>_review.md`), `active` (текущая задача), `planned` (план без ревью). Создаётся при `pm-bootstrap`, обновляется после каждого `/pm-plan` и при approve от `pm-plan-checker`. `pm-auditor` проверяет полноту и актуальность статусов в dimension 5.

---

## [2.0.2] — 2026-06-01

### Fixed

- Оркестратор мог выбрать неверный агент при spawn (например, `wb-development:code-reviewer` вместо `pm-auditor`) — все 4 командных файла дополнены dispatch-таблицами и явными `subagent_type` в каждой spawn-инструкции.
- Имена планов при ремедиации назывались `audit-fixup-<area>` вместо `<area>` — исправлено в `pm-audit.md`.

### Changed

- Собственные артефакты протокола перенесены из `docs/` в `.ai-pm/`; обновлён README.

---

## [2.0.1] — 2026-06-01

### Fixed

- Устранены 19 проблем по результатам полного ревью шаблона:
  - **Blocker:** `pm-bootstrap` ссылался на несуществующий `.claude/agents/docs-extractor.md` — legacy full mode падал при попытке spawn агента. Исправлено на `pm-legacy-reader.md`.
  - **Blocker:** hard rule в `pm-legacy-reader` запрещал запись в `.ai-pm/contracts/` — самопротиворечие с основными инструкциями агента. Правило расширено.
  - **Blocker:** greenfield и shallow bootstrap не создавали `.ai-pm/research/` и `.ai-pm/audits/` — `/pm-research` падал при первом запуске.
  - **Deadlock:** DoD item 8 требовал doc updates в ветке, но никто не был назначен их выполнять (pm-coder не трогает `docs/`). `pm-plan` и WORKFLOW теперь явно routing-ят doc updates: после pm-coder оркестратор spawning pm-architect (для `architecture.md`) или pm-legacy-reader (для `user-journeys.md`).
  - **Gap:** hotfix mode упоминался в WORKFLOW, но `pm-plan` ничего не знал о нём. Добавлена секция hotfix mode: topic `hotfix-<area>` требует раздел `## Incident facts` в плане; pm-plan-checker блокирует при его отсутствии.
  - **Naming sweep (13 мест):** `plan-feature` → `/pm-plan`, `reviewer` → `pm-plan-checker` / `code-review`, `docs-extractor` → `pm-legacy-reader`, `commands/fixup.md` → `commands/pm-fixup.md`, `Reviewer dim 1/2` → `pm-plan-checker`, `/bootstrap` → `/pm-bootstrap` во всех файлах включая шаблоны `contract.md.tmpl`, `stack-notes.md.tmpl`, `CLAUDE.md.tmpl`.
  - **Overcomplication:** таблица агентов WORKFLOW разделена на Agents (`.claude/agents/`) и Commands (`.claude/commands/`) — добавлены пропущенные `/pm-bootstrap` и `/pm-plan`; описание `/pm-audit` исправлено (scope решает оркестратор, а не PM).
  - **Overcomplication:** `pm-pr-prep` step 2 больше не блокирует на подтверждении при наличии других PR — информирует в отчёте.
  - **Overcomplication:** критерии Architect check в `pm-plan` стали domain-neutral (`new entity type` вместо `new device type`).

---

## [2.0.0] — 2026-06-01

### Breaking changes

- Все агенты и команды переименованы с префиксом `pm-`: `auditor` → `pm-auditor`, `reviewer` → `pm-plan-checker`, `coder` → `pm-coder`, `architect` → `pm-architect`, `stack-researcher` → `pm-stack-researcher`, `docs-extractor` → `pm-legacy-reader`, `pr-prep` → `pm-pr-prep`. Команды: `plan-feature` → `pm-plan`, `audit` → `pm-audit`, `bootstrap` → `pm-bootstrap`, `fixup` → `pm-fixup`, `research` → `pm-research`. Устраняет коллизии с другими тулсетами.
- `docs-extractor` переименован в `pm-legacy-reader` — отражает реальную роль (читает легаси-кодовую базу). Роль разделена: pm-legacy-reader пишет черновик `architecture.md`, pm-architect финализирует до канонического формата и владеет файлом.
- `plan-feature` переименован в `pm-plan` — команда планирует не только фичи, но и хотфиксы и рефакторы.
- Все операционные артефакты протокола перенесены из `docs/` в `.ai-pm/`: `docs/audits/` → `.ai-pm/audits/`, `docs/backlog.md` → `.ai-pm/backlog.md`, `docs/research.md` → `.ai-pm/research/`, `docs/features/*_review.md` → `.ai-pm/reviews/`, `docs/features/*_arch.md` → `.ai-pm/arch/`. `docs/` теперь содержит только документацию проекта: `architecture.md`, `stack-notes.md`, `user-journeys.md`, `features/*_plan.md`.

### Changed

- **Аудит переработан** — из 9-мерного технического code review в 5-мерную проверку соответствия протоколу: артефакты есть (план, ревью, контракт)? план совпадает с реализацией? реализация покрыта планом? контракты актуальны? docs свежи? Технический код-ревью — работа pm-plan-checker + встроенного `code-review` per feature.
- **`pm-plan-checker`** (бывший `reviewer`) урезан до единственной ответственности — соответствие плану: сценарии реализованы, контракт соблюдён, interaction scenarios покрыты тестами, DoD выполнен. Технические dims 2–9 убраны — их делает встроенный `code-review` skill.
- **Review loop** перестроен: два последовательных прохода полностью скрыты от PM. Pass 1 — pm-plan-checker (plan compliance), замечания → pm-coder → повтор. Pass 2 — `code-review` (technical quality), оркестратор записывает findings в `.ai-pm/reviews/<topic>_review.md`, pm-coder читает и правит → повтор. PM слышит только финальное "готово" + product notes.
- **`pm-audit`** автоматически выбирает scope (diff/full) по дате последнего аудита и количеству фич — PM не выбирает параметры. При full scope предлагает запустить `code-review ultra` — PM решает. Pre-protocol-migration артефакты группируются в одно finding, принимаются массово.
- **`pm-plan`** добавил обязательный раздел **Interaction scenarios**: фичи с разделяемым состоянием, async-операциями или внешним I/O обязаны описать конкурентные и постусловные сценарии и покрыть их тестами. pm-plan-checker блокирует при отсутствии. Триггеры универсальные (не привязаны к конкретному стеку).
- **Retrospective check** в `pm-plan` теперь считает фичи с последнего аудита и предлагает `/pm-audit` — вместо подсчёта фич с последнего обновления `architecture.md`.
- **pm-architect (Section A)** — явное разделение greenfield vs legacy finalization режимов. В legacy режиме черновик pm-legacy-reader является источником правды о фактах; pm-architect не изобретает, не перезаписывает, ставит `[?]` там где нет данных без кода.

### Added

- **Interaction scenarios** — новый обязательный раздел плана для фич с разделяемым состоянием. Включает тесты конкурентных сценариев в test plan. pm-plan-checker и pm-auditor проверяют наличие.

---

## [1.13.0] — 2026-05-31

### Added

- `.claude/commands/plan-feature.md` — new "Before every PM question — product vs technical check" block before AskUserQuestion. Surfaces the WORKFLOW.md notes-routing rule (product = PM decides, technical = orchestrator decides) into plan-feature's clarifying-question loop. Product trade-offs (user-visible alternatives, scope, deferral) surface to PM; technical details (file layout, naming, library specifics, unit file shape) the orchestrator decides and documents in Key design decisions. Concrete re-framing example: "PM chooses between systemd / Docker / k8s" → wrong question; "integrator experience: single canonical install or component-by-component setup?" → right question. Closes a real recurring pattern observed in the downstream `audit-fixup-confed-schema-delivery` cycle. (9d71a0d)

### Notes

- Shipped via `/fixup` fast path (+7 LOC, edit-only, no stack-notes touch, no new source file — all four conditions met). Trivial-mode review trail at `doc/features/fixup-plan-feature-product-vs-technical_review.md`: approve, DoD pass, no notes. (612f7f8)

---

## [1.12.0] — 2026-05-30

### Added

- `.claude/commands/fixup.md` — new `/fixup` slash-command: fast path for changes meeting all four conditions (≤50 LOC, no user-visible behavior change, no stack-notes touch, no new source file). Skips `plan-feature`; coder runs with compact prompt; reviewer runs in `--mode=trivial`. Mutually exclusive with `/plan-feature` on a single PR. Third of four optimizations in `optimize-without-losing-rigor` plan. (d563b02)
- `reviewer` agent — new `--mode=trivial`: re-validates the four `/fixup` conditions against the actual diff (only escape hatch), applies trivial DoD (scope + pipeline + docs), skips all other dimensions, writes a short verdict file at `docs/features/fixup-<topic>_review.md`. No Notes — if it is worth noting, it is not trivial. (d563b02)
- `auditor` agent — new `--scope=diff` mode for routine in-progress audits: reads only files changed since the most recent `docs/audit-*.md` plus their direct cross-references (imports / requires / file paths). Output filename unchanged; heading prefixed with `(diff scope)`. Full sweep remains default and is explicitly recommended quarterly. (310695d)
- `/audit` command — exposes `scope` parameter and routes the choice to the auditor. (310695d)
- `WORKFLOW.md` — new "What is mandatory when" decision matrix: 4-row table (User-facing feature / Backend / Docs-only / Trivial) collapsing scattered conditions from `coder.md`, `reviewer.md`, and `plan-feature.md` into one reference. Each row specifies state required, contract required, DoD scope, stack expectations. Introduces the "Skip with one-line reason" convention: `Skips Product Contract: <reason>` in commit message; reviewer accepts when present, blocks when absent on a backend change. Second of four optimizations. (e441949)

### Changed

- `reviewer` and `auditor` agents — 11 dimensions merged into 8 without coverage loss. Three overlapping pairs collapsed: dim 1 (Plan compliance + Plan completeness + Categorical coverage) + dim 11 (Product Contract compliance) → new dim 1 "Plan & Contract compliance"; dim 3 (Security) + dim 4 (Stability) → new dim 3 "Correctness (security + stability)" — same defect class, two reading modes (attacker / operator-on-call); dim 8 (Docs vs code) + dim 10 (Stack expectations) → new dim 7 "Documentation and canon compliance" — both compare code against a documented source of truth. Renumbered to 1..8. All defect classes still caught; only the heading collapses. DoD checklist in reviewer unchanged (items reference behavioral checks, not dimension numbers). Cross-references in `coder.md` / `auditor.md` updated to new dim numbers and full names. First of four optimizations. (d09ac14)
- `README.md` — flow diagram updated: "11 измерениям" → "8 измерениям". Three stale `dim 11` references at lines 108 and 122 updated to `dim 1 (Plan & Contract compliance)`. (d09ac14, b176c1c)
- `doc/architecture.md` — `dimension 11` reference at line 78 updated to `dimension 1`. File layout updated: "Four slash-commands" → "Five (adding fixup)". New "Architectural decisions" entry for the four optimizations (dim merge + matrix + fixup + audit scope) citing all four feature commits and the plan path. (b176c1c, 44a180d)
- `WORKFLOW.md` — agent table extended with `/fixup` and `/audit` (with scope explanation) rows; decision matrix backend row typo fixed: "items 1, 2, 4, 6, 7" → "1, 2, 4, 5, 7" (item 6 is Product Impact Report which is N/A for backend; item 5 is state updated which IS required). (b176c1c, d563b02, 310695d)
- `doc/_templates/contract.md.tmpl` — stale `dimension 11` reference updated to `dimension 1`. Template that downstream projects copy, so this matters more than a cosmetic doc fix. (87070d9, 362bc99)

### Notes

- Four orthogonal optimizations shipped as one PR per PM directive: reviewer/auditor 11 → 8 dimensions, decision matrix in WORKFLOW.md, `/fixup` fast path, auditor `--scope=diff` mode. No gate removed. Every defect class previously caught is still caught; only the form changes. Categorical scope: chose text consolidation + new fast path + new parameter; siblings (gate removal, modes redesign, content migration) explicitly Out of scope. Plan + review trail in `doc/features/optimize-without-losing-rigor_plan.md`. Review v1 surfaced three stale dim-11 references + matrix typo + missing architecture decisions entry; fix-pass closed all (b176c1c, 44a180d). Review v2 approved with one trivial note (contract.md.tmpl dim-11), also fixed (87070d9, 362bc99). Reviewer ran the new 8-dim form on itself during review v1 — dogfooding held.

---

## [1.11.0] — 2026-05-30

### Changed

- `README.md` — three inline blockquote cross-references added to sections "Как это работает", "Какие риски шаблон снижает", "Что остаётся за PM". Each cross-ref points to `WORKFLOW.md` as the canonical orchestration spec (rules detail / PM communication reference). No content migration; the README stays a Russian marketing/quickstart overview. (7f180c6)
- `WORKFLOW.md` — one-line header note above "Workflow agents" declaring it the canonical orchestration spec read by agents and downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`, with `README.md` as the friendlier Russian overview. Tie-breaker rule made explicit: when the two documents disagree, `WORKFLOW.md` wins. (7f180c6)

### Notes

- Closes task #24 (audit-fixup-readme-workflow-split). Drift between README and WORKFLOW now surfaces at review time because the cross-references are explicit. Plan + review trail in `doc/features/readme-workflow-split_plan.md` and the review-trail commit (8dbe74e, 42c60e9).

---

## [1.10.1] — 2026-05-30

### Fixed

- `CHANGELOG.md` — backfilled missing `## [1.6.0]` entry for the orphan tag (released without a CHANGELOG entry or GitHub Release at the time) and added a `## [1.6.0 → 1.7.0 intermediate work]` aggregate block for PRs #142–#145 that landed on `main` between the two tags without their own intermediate version tags. v1.6.0 entry covers 9 commits (Added / Fixed / Changed split per actual ranges from `git log v1.5.1..v1.6.0`). No existing entry mutated. Closes task #26 (audit-fixup-changelog-backfill). Plan + review trail (v1 request-changes → v2 approve after attribution fix) in `doc/features/changelog-backfill_plan.md`, `doc/features/changelog-backfill_review.md`, `doc/features/changelog-backfill_review.v2.md`. (aecf82f, 8f5eddf, e85e82d)

### Notes

- Surfaced by `pr-prep` on PR #146. GitHub Release for v1.6.0 not backfilled retroactively — out of scope; release notes live in CHANGELOG.

---

## [1.10.0] — 2026-05-30

### Added

- `architect` agent — second responsibility: owns canonical `docs/architecture.md` (in template: `doc/architecture.md`) in addition to existing per-feature arch notes. New Section A workflow: read `docs/stack-notes.md` + `CLAUDE.md` + architecture.md template, walk every template section (mark N/A with one-line reason), cite every decision (commit SHA / PR / doc / bootstrap conversation), cross-check file layout / release flow / integration contract against repo state, then write. Section B (per-feature arch notes) unchanged. Allowed writes tightened to `docs/architecture.md` and `docs/features/<topic>_arch.md` only. (e0fc4c9)
- `bootstrap` command (greenfield) — spawns `architect` Section A after `stack-researcher` returns, instead of orchestrator writing `docs/architecture.md` inline. The architect now owns the file end-to-end on the greenfield path. (e0fc4c9)
- `WORKFLOW.md` — agent table row for `architect` extended to mention canonical `docs/architecture.md` ownership alongside per-feature structural review. (e0fc4c9)
- `doc/backlog.md` — new file for observations recorded during reviews/audits. First entry: bootstrap full-mode (legacy adoption path) still has orchestrator writing `docs/architecture.md` inline after docs-extractor — greenfield/legacy asymmetry to reconcile in a future plan. (0f88a49)

### Notes

- Closes task #27 (template gap: architecture.md ownership, surfaced in meta-audit). Removes the workaround language used in `audit-fixup-self-docs-architecture` where orchestrator invoked architect with an extended prompt. Plan + review trail in `doc/features/architect-owns-architecture-md_plan.md` and `doc/features/architect-owns-architecture-md_review.md`. (c28d5fa, 0f88a49)

---

## [1.9.0] — 2026-05-30

### Added

- `doc/_templates/state.md.tmpl` — Execution State Protocol artefact: Status (idle | in-progress | blocked) / Done / Remaining / Touched files / Next step / Validation. Single source of truth for the active task; overwritten as progress lands, archived on completion. Agent step 1 reads it; agent step last updates it. (b599700)
- `doc/_templates/contract.md.tmpl` — Product Contract artefact (one per user-facing feature): User value / Who uses it / Must work / Must not break / Acceptance checks / Out of scope / Last reviewed. Backend-only changes don't need a contract; user-facing features must have one. (b599700)
- `coder` agent: reads `.ai-pm/state/current.md` as step 1; reads Product Contract for touched user-facing features as step 4; updates state at end (step 9); new Product Impact Report section in the closing report when contracts are touched. (49d83c1)
- `reviewer` agent: new dimension 11 'Product Contract compliance' — silent behavior change blocks merge; missing contract for touched user-facing feature blocks; failing Acceptance check blocks. New 'Definition of Done' section in verdict format with 7 explicit checks; pass requires all checked, fail requires request-changes regardless of Blocking count. (49d83c1)
- `auditor` agent: load context now includes `.ai-pm/contracts/` and `.ai-pm/state/current.md`; new dimension 11 'Product Contract integrity' mirrors reviewer dim 11 project-wide — missing contracts, stale contracts, drift between contract and code, phantom Acceptance checks. (49d83c1)
- `docs-extractor` agent: legacy bootstrap full mode now drafts initial Product Contracts from discovered journeys, mapped one-to-one. Drafts marked '(extracted from legacy — needs PM validation)' on Last reviewed. Cap of 8 contracts per extraction; remaining journeys surfaced as 'Pending contracts'. (49d83c1, d60612a)
- `bootstrap` command (greenfield, legacy-shallow, legacy-full): creates `.ai-pm/state/current.md` from `state.md.tmpl` with Status: idle, plus `.ai-pm/state/archive/` and `.ai-pm/contracts/` directories. Surfaces draft contract count in the PM brief. (18dc48c)
- `plan-feature` command: reads `.ai-pm/state/current.md` first (warns PM if active task exists); reads `.ai-pm/contracts/` in read-list. After plan approval: initialises Execution State; runs Product Contract check (asks PM one product question — drafts contract from plan Scenarios + Existing behaviors + Test plan if user-facing, notes 'no contract' if backend-only). Names explicit template path `.ai-pm/tooling/doc/_templates/contract.md.tmpl`. (18dc48c, d60612a)
- `WORKFLOW.md` — new 'How state is kept' section between release and prod-incident: `.ai-pm/state/current.md` as resume-from-pause artefact; `.ai-pm/contracts/` as user-facing feature contracts; PM read-only on both. New 'Three channels surface to PM, not one' subsection: Coder's Product Impact Report, Reviewer's product Notes, Reviewer's DoD line. The DoD rule (pass with unchecked box is contradiction) lives here. (1803b4c, d60612a)
- `doc/architecture.md` — three new architectural decisions cited from the integrate-consultancy plan: Execution State as single source of progress, Product Contracts as product-side complement to stack-notes, Definition of Done as explicit reviewer subsection. File layout updated with `state.md.tmpl` + `contract.md.tmpl` and a note about downstream `.ai-pm/state/` and `.ai-pm/contracts/` created at bootstrap. (1803b4c)

### Changed

- `README.md` — 'Что гарантирует' renamed to 'Что снижает риск'; guarantees reworded from absolutes (гарантирует) to risk reductions (реже). Three new entries: state persistence (context loss reduced), silent behavior change (Product Impact Report + dim 11), Definition of Done (objective 'done'). Section header grammar fixed; flow diagram updated with contract-draft step between plan approval and architect; reviewer dimension count 10 → 11; DoD pass | fail line added. (1803b4c, d60612a)
- `.gitignore` — dropped v0.x leftovers: `.bootstrap-state.local.md` (bootstrap state machine removed in v1.0.0 template-v2 rewrite); AP-16 local-trace mode (AP-N anti-patterns system removed in same rewrite); `.ai-pm/.reviews/release-*.json` exception (release-PR tracing model retired with auto-tag workflow). What remains: editor swp files, `.DS_Store`, `.reviews/`, Claude Code worktree scratch dir. Closes audit-fixup #23 in-line. (3f96a2b)
- `architect` agent — `design-review` reference (planned but never shipped in template-v2) rewritten as 'architecture review'. (3f96a2b)

### Notes

- Integrates external consultancy parts 1, 2, 7, 10. Rejects part 3 (modes-vs-agents, conflicts with subagent isolation), part 4 (strict One Logical Step, kept as guidance), part 6 (additional doc fragmentation). Plan and review trail in `doc/features/integrate-consultancy_plan.md`, `doc/features/integrate-consultancy_review.md`, `doc/features/integrate-consultancy_review.v2.md`. (277a90b, e7f0d9b)

---

## [1.8.1] — 2026-05-30

### Fixed

- `.claude/settings.json` hook regexes: ssh content-edit and ssh mutating-action gates now match the quoted form (`ssh host "sed -i ..."`, `ssh host 'rm /etc/foo'`, `ssh host "systemctl restart x"`), closing blocking #3 of `doc/features/audit-2026-05-30.md`; find boundary gate now blocks bare-root `find / -name x` / `find / -type f`, closing blocking #4. (7012c4d)

### Added

- `tests/hooks.sh` — 44 POSIX-shell unit cases over all 5 PreToolUse hooks (Read boundary, find boundary, ssh content-edit, ssh mutating, git force-push, git no-verify), with positive (deny/ask) and negative (pass) coverage and full `hookSpecificOutput` shape assertion (`hookEventName`, `permissionDecision`, `permissionDecisionReason`) on every positive case. (b3cca9c, 28e763c)
- `.github/workflows/lint-hooks.yml` — CI gate runs `tests/hooks.sh` on every PR/push that touches `.claude/settings.json`, `tests/hooks.sh`, or the workflow itself; failing tests block merge. Closes note #6 of `doc/features/audit-2026-05-30.md`. (dfac399)

### Changed

- `doc/architecture.md` — `tests/` directory and `.github/workflows/lint-hooks.yml` added to File layout; "no automated tests by design" constraint refined: tests on meta-infrastructure (hook regexes) are allowed, runtime/feature tests still are not. (6dd28dd)
- `WORKFLOW.md` — Hook-level enforcement section notes the new test-gate so PM sees rules are now verified, not only declared. (6dd28dd)

---

## [1.8.0] — 2026-05-30

### Added

- `doc/architecture.md` for the template itself: 7 in-scope sections (Project, Tech stack pointer into `doc/stack-notes.md`, 9 architectural decisions each citing commit SHA / PR / doc path, constraints, file layout, integration contract, release flow) + 5 explicit N/A sections (Security, Code conventions, Deploy, Database, UI) — every line of the template's own `architecture.md.tmpl` walked through. Closes finding #1 of `doc/features/audit-2026-05-30.md`. Second of 7 self-* audit-fixup plans in meta-audit priority order. (7bb6e05)

---

## [1.7.0] — 2026-05-30

### Added

- `doc/stack-notes.md` for 6 self-*components (architect, planner, coder, reviewer, pr-prep, auditor): documents the protocol's own stack — markdown spec, agent persona conventions, hook scripts, install layout. Closes finding #2 of `doc/features/audit-2026-05-30.md`. First of 7 self-* audit-fixup plans in meta-audit priority order. (4f71ab0)

---

## [1.6.0] — 2026-05-29

### Added

- Require `AskUserQuestion` tool for all PM decisions; plain-text questions no longer allowed in the orchestrator dialog (b94b1d2)
- Pre-PR checkpoint — ask PM how to proceed after approve (manual testing / open PR test before merge / ship now) (c86fb00)
- After-deploy checklist for option A — give PM short list of what to verify (7b1a05f)

### Fixed

- PM reports findings after testing, no longer forced to say 'ready' (bf84440)
- Deploy in option A follows `docs/architecture.md` deploy section (596939f)
- Offer deployment help in manual-testing option A (b642b4c)
- Pre-PR checkpoint wording made generic — any project, not hardware-specific (1352ed7)
- `architect` agent — do not search filesystem for external reference projects (#140, 14dcd0d)

### Changed

- Install instructions: explicit `settings.json` symlink line added (#141, 2626106)

### Note

This release was tagged at the time but never had a CHANGELOG entry or
GitHub Release published. Backfilled in v1.10.1 — see audit-fixup-changelog-backfill plan.

---

## [1.6.0 → 1.7.0 intermediate work] — 2026-05-29 to 2026-05-30

The following PRs landed on `main` between the `v1.6.0` tag and the
`v1.7.0` release without their own intermediate version tags. Their
changes are part of the v1.7.0 baseline; recorded here for traceability.

- Protocol integrity + stack literacy — close 5 structural gaps (#142, 6e1bf14)
- /audit spawns auditor subagent instead of reading in main (#143, cf889c6)
- Post-cycle lessons: notes split, edit ownership, pr-prep flexibility (#144, 9f81f64)
- Hook-level enforcement: ssh-edit boundary + force-push + no-verify (#145, ac5827a)

---

## [1.5.1] — 2026-05-29

### Fixed

- Enforce project root boundary in all agents: hard rule prevents navigation above git toplevel, architect establishes boundary before any file search (d72da4e)

---

## [1.5.0] — 2026-05-29

### Added

- Bootstrap docs-extractor subagent: dedicated agent for deep legacy codebase reading, extracts patterns and conventions before bootstrap planning (14726cf)

---

## [1.4.1] — 2026-05-29

### Fixed

- Bootstrap full-mode gaps: self-resolve doubts without PM escalation, add coverage checklist (forms, DB procedures, exports, backups, settings screens), inline optional docs list for legacy bootstrap (13a01e0)

---

## [1.4.0] — 2026-05-29

### Added

- Two-tier findings and backlog mechanism: structured backlog for findings with PM approval gate to promote items to the main queue (6dd6c42)

---

## [1.3.0] — 2026-05-29

### Added

- Structured reviewer dimensions: distilled 8 review dimensions (security, stability, test coverage, regressions, conventions, simplification, docs drift, infrastructure) with severity levels and explicit "what NOT to flag" rules (5645844)
- Audit command: new optional /audit command for full-project health check using same review dimensions, generates PM-facing report in `docs/audit-<date>.md` (5645844)

---

## [1.2.0] — 2026-05-29

### Added

- Legacy bootstrap modes for agents and compatibility: two-mode bootstrap procedure, documentation gap handling, porting guidelines (8510e35)

### Fixed

- Release workflow: checks for GitHub Release existence instead of git tag (c240181)
- Release workflow: merge auto-tag and create-github-release into single workflow (ad3d30f)

---

## [1.1.0] — 2026-05-29

### Added

- Set model per agent: haiku for pr-prep/release-helper, sonnet for coder/reviewer/architect (870679a)

### Fixed

- Release workflow: release-helper runs on feature branch, auto-tag on merge to main (5bb8e24)
- Release-helper: remove confirmation gate before commit, report after execution (2ffb6ef)
- Pr-prep: no confirmation gate, execute and report PR URL to orchestrator (ac809b8)

---

## [1.0.7] — 2026-05-29

### Added

- auto-open release PR workflow on branch push — no gh CLI needed locally (eca5b45)

### Fixed

- 9 protocol gaps: bootstrap detection, coder frontmatter, research output path, reviewer cycle, architect trigger, bugfix branch naming, --no-verify in bootstrap, retrospective artifact, submodule command placement (6f74a4d)
- git workflow gaps: atomic commits, feature/fix branch naming, manual release steps (34414c0)

### Changed

- release model: tag main directly instead of release/vX.Y.Z branch + PR ceremony (ba5f613)
- WORKFLOW.md: full reviewer verdict cycle + Maintenance section for submodule update (6f74a4d)

---

## [1.0.6] — 2026-05-28

### Added

- Split CLAUDE.md into static project part + dynamic WORKFLOW.md — separates project config from orchestration workflow (dec55b4)

### Fixed

- orchestration flow: show PM what was built at each step (234cfe2)
- reviewer: checks hardcoded config values and missing infrastructure (acdee68)

## [1.0.5] — 2026-05-28

### Fixed

- coder: must not create directories outside project root — no /tmp/probe dirs. Library API research via WebSearch or project node_modules/ (88449ea)

## [1.0.4] — 2026-05-28

### Fixed

- research command: output path — feature research beside plan in `docs/features/<topic>_research.md`, project-level research in `docs/research.md` (2558671)

## [1.0.3] — 2026-05-28

### Added

- `/research` command: WebSearch-based analysis of existing solutions and analogues. PM-readable output with pros/cons/fit. Saves to `docs/research/<topic>_research.md`. (bc93ba6)
- bootstrap: asks PM about research at project start
- plan-feature: suggests research when feature area might benefit from existing libraries

### Fixed

- architect: reverted WebSearch (wrong place); scope strictly current repo only (1403b92)

## [1.0.2] — 2026-05-28

### Fixed

- Renamed architect agent output from `_design.md` to `_arch.md` — consistent with agent name, no confusion with UI/UX design artifacts (df2935b)

---

## [1.0.1] — 2026-05-28

### Fixed

- CLAUDE.md.tmpl: added explicit "Workflow agents" table so orchestrator uses template agents instead of similarly-named agents from other toolsets (5d9254d)

---

## [1.0.0] — 2026-05-28

### Breaking Changes

- **Full template rewrite (v2).** Downstream projects using v0.x cannot adopt v1.0.0 without a full re-bootstrap. Removed: development-protocol.md, bootstrap state machine (stages A-D), AP-1..AP-33 checklist, domain-*.md files, spec.md format with frontmatter, all bootstrap agents (greenfield/legacy/resume/template-sync), planner agent, shell scripts, regression test cases, review trail mechanism — 120+ files, ~22 000 lines. (#121)

### Added

- CLAUDE.md.tmpl as primary orchestration artifact — contains PM communication protocol, orchestration logic, and project context (#121)
- `architect` agent — optional structural pass between planning and coding (#121)
- `pr-prep` agent — squash and PR creation (#121)
- `/bootstrap` command — project initialization with hook detection, no-code state handling, platform UI vs custom UI distinction (#121, c800851, 4f1e0b9, c0225cd)
- `/plan-feature` command — interactive planning with PM, stale doc detection, retrospective trigger (#121)
- Templates: `README.md.tmpl`, `architecture.md.tmpl`, `ui-guide.md.tmpl`, `user-journeys.md.tmpl`, `threat-model.md.tmpl` (#121)
- PM communication protocol in CLAUDE.md.tmpl — plain language rules for all agents (#121)
- Architectural retrospective trigger in plan-feature — suggested every 5 features (#121)
- Company/team standards support in architecture.md.tmpl and bootstrap (#121)

### Changed

- `coder.md` rewritten — compact, declarative, reads CLAUDE.md for pipeline and conventions (#121)
- `reviewer.md` rewritten — broad mandate, test quality check (verifies tests encode scenarios from plan), security adversarial thinking (#121)
- `release-helper.md` rewritten — removed all v0.x references (#121)
