# Backlog

Observations and follow-ups recorded during reviews/audits. Triaged 2026-06-12 against the minimal core: entries resolved by shipped versions removed; entries referencing the retired template structure (workflow/*.md, the pm-* roster, gen/) re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals).


## Downstream field report: cross-platform breadcrumb missing — ad-md-editor, 2026-06-13

The project was created under OpenCode; the Operator later opened it in Claude Code. The Claude session started with ZERO protocol surface — the install wires only the active platform (`opencode.json` + `AGENTS.md` + plugin), so no `CLAUDE.md` import, no hooks, no agents exist for Claude. The session worked the repo as a bare project: no roles, no loop, no review.

The platform-switch offer (orchestrator `## Setup`, "Platform switch") could not fire — it is prose homed in the orchestrator, and the orchestrator only loads through the installed platform's surface. A rule cannot fire on a harness that never loads it. Unfelt deficit (the session doesn't know what it's missing) ⇒ needs a mechanical breadcrumb, not more prose.

**Fix candidate:** the installer always writes a minimal load-surface for BOTH platforms — the active platform gets the full wiring (as today); the inactive platform gets a 3-line pointer file (for Claude: a minimal `CLAUDE.md`; for OpenCode: a minimal `AGENTS.md`): "this project runs the ai-dev protocol, active platform is X — run the installer for this platform and offer the Operator the platform switch." De-duped on re-run like the existing load-instruction merge. Test rows: cross-platform breadcrumb present after install; breadcrumb does not clobber an existing real file (merge, don't overwrite); breadcrumb replaced by full wiring when its platform becomes active.

## regression-protection contract row for the ratchet — 2026-06-13 (builder/reviewer note, 5.9.6)

`docs/contracts/regression-protection.md` rows cover feature-contract promises only; the new floor ratchet ("a defect fix carries the test that pins it", 5.9.6) could gain a must-work row there. Fixup-grade.

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

The packaging shipped 4.17.0 (`npx github:aadegtyarev/ai-dev-protocol <target>` — repo renamed at 5.0.0, old `-uni` slug redirects). What remains is external: the Operator's npm account, name-availability check (scoped fallback), `npm publish`, optionally publish-on-tag CI (NPM_TOKEN secret riding the existing auto-tag workflow). Then the README lead becomes `npx ai-dev-protocol@latest`.

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

**Multimodality note (downstream OpenCode case, 2026-06-13):** GUI projects need vision named in the matrix — a non-multimodal model cannot read screenshots, so the Operator must describe UI bugs in words and the vision-dependent rungs of the UI-verification ladder are unavailable. Setup's model step should name vision as a recommended capability for the Builder/Reviewer seats on a GUI project.

## Platform built-ins survey — safe orchestrator offload — 2026-06-08/09

Survey both platforms' built-in tools/agents and map which are safe for the orchestrator's AD-HOC use (offload instead of inline work): read-only and no role-overlap ⇒ allow (e.g. a read-only explorer for parallel analysis); write-capable generic or role-overlap ⇒ stays denied (`general`/`build`/`plan` — the role-substitution deny). Open question: does a write-capable ad-hoc generic ever have a legitimate seat, and can the deny distinguish intent? Outcome: a documented routing note (which built-ins the orchestrator may use for what) + possibly widened safe offload.

## OpenCode background/parallel spawn — research requested 2026-06-13 (Operator)

The parallel-work value on OpenCode hinges on whether `task` spawns can run concurrently/in background (the tool-map records no background primitive — but that's our record, not a verified absence; the Operator suspects the docs may show one). Research the current OpenCode docs/SDK: concurrent task calls, background sessions, async child-session prompting. Outcome updates `tool-map.json` (+ the parallel-work decision doc's honest-bottleneck note) either way. Sibling of the continue-subagent entry below — one research pass can cover both.

## OpenCode continue-subagent prosthesis — researched 2026-06-12, parked (Operator decision)

Research verdict on `continue-a-sub-agent: null` for OpenCode: the built-in `task` tool has no resume/session-id parameter (docs confirm — each call is a fresh child session), so the tool-map `null` + fresh-spawn fallback stays honest. BUT a prosthesis is feasible: the SDK exposes `client.session.prompt({id})`, plugins get `client` in context and can register custom tools — our adapter plugin could add `continue_subagent(session_id, message)`. Open questions: how the orchestrator learns the child session id from the `task` result; the deny rule "Builder only, never the Reviewer" (the plugin already resolves the actor). Parked because the vendor is moving in this zone — human prompting of child sessions broke on Desktop/Web in 1.4.0 (issue anomalyco/opencode#22830, open) and may return as a native primitive that obsoletes the prosthesis. Re-assess at the next release-audit (vendor-watch). Sources: opencode.ai/docs/agents, /docs/plugins, /docs/custom-tools, issue #22830.

## deepseek-v4-flash as the OpenCode default cross-model reviewer — 2026-06-10 (idea)

Cross-model independence needs the Reviewer on a *different* model, not a *weaker* one. If `deepseek-v4-flash` is review-grade, it could be the OpenCode reviewer default via the adapter's model policy. Validate review quality before defaulting; opt-in until then.

## Flag-controlled mode: project-generated docs not committed to the product repo — 2026-06-05 (idea)

A mode where the protocol's generated docs stay local (agents read them) but are not committed into the product repo. Hard tension: cross-session durability of state and audit history. Needs `research` (how others separate meta from product) before any plan.

## Automation-opportunity scanner over a finished process doc — 2026-06-04 (idea, docs-kind)

A pass over a finished SOP/instruction that flags AUTOMATABLE steps, proposes how, and on approval bridges into building it. Suggestion-only, proportional (a terminal human artifact like "how to solder" is not automated).

## Accepted audit cohort notes — skip re-raising in future audits

- **Pre-stamp-gate cohort (audit 2026-06-04):** `on-hardware-blast-radius-preflight` (v2.12.0), `threat-model-ownership-and-lifecycle` (v2.13.0) — reviewed before the stamp format existed.
- **Pre-protocol-migration (audit 2026-06-03):** four plans (`template-v2`, `contract-centric-product-map`, `diagnostic-probe-mode`, `protocol-builtins-realignment`) predate the trail discipline.
- **OpenCode dogfood-spike cohort (audit 2026-06-08):** six OpenCode sub-slices built + reviewed-in-loop on the integration branch without persisted `_review.md`; accepted-with-context (functionally verified, suites green, driven live).
