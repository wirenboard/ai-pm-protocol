# Backlog

Observations and follow-ups recorded during reviews/audits. Triaged 2026-06-12 against the minimal core: entries resolved by shipped versions removed; entries referencing the retired template structure (workflow/*.md, the pm-* roster, gen/) re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals).

## Audit 4.19.0 Lows — stamp label gap + orchestrator length watch — 2026-06-12

Two Low findings from the proactive sweep (HEALTHY overall), neither merge-blocking:

- **Low-1, one-home gap:** `engine.mjs:159` accepts a third stamp label `Validation` (`stampOK("Validation")`) that no doc names — `reviewer.md` documents only `## Code review:` / `## Doc review:`. Either document it as the forward-compat downstream label (one line in the Verdict bullet) or drop it from the engine; ride the next feature touching either file.
- **Low-2, length watch:** `orchestrator.md` at 224 lines / 11 sections sits at the upper edge of "readable in one sitting". Not a violation; the rule for the NEXT side-tool addition: trim or fold, never append past the edge.

## Merge-gate topic + verb parsing — two 8D findings — 2026-06-12

1. `resolveMergeTopic` (`engine.mjs:124`) reads `.git/HEAD` first and the command's ref only as a fallback — pushing branch A from branch B's checkout reads branch B's stamp (hit live during the stacked-merge conveyor; contained by pushing from the right checkout). Fix direction: parse the pushed ref from the command FIRST, HEAD as the fallback for a bare push; + merge-gate test cases for a cross-branch push.
2. The bash verb parser matches the verb words INSIDE a heredoc payload (hit live: a heredoc writing prose ABOUT pushes was denied as a push). Fix direction: strip heredoc/quoted-string bodies before verb matching, or anchor the match to command position; + a false-positive test case. Sits beside the recorded `Validation` stamp-label Low.

## [who] axis / operator-scenario presets — retracted from README, parked as a hypothesis epic — 2026-06-12 (Operator decision)

**Decision (Operator, 2026-06-12):** the `[who] × [speed↔quality]` matrix was retracted from `README.md` (4.10.3) — the `[who]` axis had zero implementation and its tech-lead cell ("you see the diff") contradicted `PROTOCOL.md` "Never show code". The honest surface today is the one-axis `profile` dial.

**If/when the non-technical-PM bet is taken** (it is a recorded hypothesis in `docs/product.md` §1, not a served segment), the axis is its own coherent epic, not scattered fixes: a `scenario` (or `operator`) key in `ai-pm.config.json` with 2–3 presets (e.g. `pm` / `tech-lead`) parameterizing diff visibility, question depth, and the auto-decide ceiling; amending "Never show code" into a scenario-conditioned rule; and a friendlier on-ramp. (The lighter-profile compensator — the Reviewer's review-time product-fit check — is a floor checklist item since 4.11.0; the epic may deepen it.)

## Vendor-watch standing item — platform absorption — 2026-06-12 (from product analysis, finding 4)

Claude Code natively ships agent teams, review subagents, deny hooks; vendors absorb orchestration primitives over time (precedent: Agent-OS retired its phases). At each release-audit, check what the platforms absorbed and re-aim: the durable parts are cross-platform parity, the honesty map, and product discovery — never re-wrap a primitive the vendor ships. Related research idea: whether the loop itself could ride Claude Code's dynamic-Workflow primitive (deterministic fan-out) without losing the PM-in-the-loop forks — `research` first, it may be the absorption case in point.

## `audit` — extra dimension candidates — 2026-06-11 (post-restructure queue; trigger shipped 4.12.0)

The proactive trigger is in (orchestrator `## Audit`: offer after ~5 shipped features, state records the last run — 4.12.0). What remains of this item: dimension candidates to fold into auditor sweeps as the need shows (salvaged from prior epics):

- **Single-source drift** — an enum/taxonomy/rule restated outside its one home and drifted (the per-diff Reviewer is blind to cross-file copies that pre-date the diff).
- **Temporal-status conflation** — "planned / interim / temporary" in one doc vs "done / current" in another.
- **Whole-tree code-quality sweep** — legacy or never-diff-reviewed code; cross-cutting patterns invisible per-diff (architectural and functional/integration review types).
- **Instruction-file overreach** — decision/security content sitting in a harness instruction file (CLAUDE.md-class) whose own pointer says it is owned by `docs/` canon; remediation is move-not-copy.

## `research` as a doing side-tool — 2026-06-11 (post-restructure queue)

Modules shape *thinking* (checklists); `research` should *do* work: investigate (market / competitor / user / stack), synthesize a COMPACT decision-base artifact in `docs/decisions/` (the home already exists), with retention discipline — compact, human-readable, superseded-not-accumulated. Pairs with the product-advocate module: the advocate ASKS "who's the user?", research ANSWERS with evidence. Design fork to resolve: who authors the artifact (a spawned role, per invariant — the orchestrator routes, never authors canon).

## Parallel feature work — Operator request 2026-06-12

Today the loop is strictly serial: one session drives one feature, one branch per PR, the state pointer names ONE active plan. Features with disjoint surfaces could run in parallel — the platform offers concurrent sub-agents and git worktrees. Design questions: per-feature state (the pointer is singular); branch isolation (PROTOCOL `## Git flow`: conflicts ⇒ stale branch, cut fresh — parallel branches invite exactly that); the stamp/merge-gate is already per-topic (holds as-is); Operator bandwidth (plans and merges still serialize through one human — the honest bottleneck). Cheap 80% already allowed: several features batched on one branch serially. The real epic: worktree-per-feature with interleaved Builder spawns. Scope honestly before building. Field notes from the first stacked-PR conveyor (8D, 2026-06-12): a dependent PR auto-closes when its base branch is deleted by a merge — retarget the next PR to main BEFORE merging the current one; a remote squash-merge is asynchronous — verify the content landed before rebasing onto it; the per-topic stamp/merge-gate held throughout (two honest denials).

## npm registry publish — external half of npx distribution — 2026-06-12

The packaging shipped 4.17.0 (`npx github:aadegtyarev/ai-pm-protocol-uni <target>` works now). What remains is external: the Operator's npm account, name-availability check (scoped fallback), `npm publish`, optionally publish-on-tag CI (NPM_TOKEN secret riding the existing auto-tag workflow). Then the README lead becomes `npx ai-pm-protocol@latest`.

## ad-md-editor rollout — first real downstream — 2026-06-11

The Operator asked to roll the protocol into ad-md-editor; this repo's session cannot (the project-boundary deny blocks cross-repo writes, correctly). Run `node src/adapter/install.mjs` against it from its own checkout/session. First real downstream = the strongest install + upgrade test we lack (N=1 → N=2; `docs/product.md` success criterion).

## Old-template downstream (nula) → minimal core — one-time migration — 2026-06-10

A deployed downstream on the OLD template (nula: `.ai-pm/tooling` submodule + symlinks to the old `.claude/agents/pm-*` + `WORKFLOW.md`) needs a one-time, file-level move to the minimal core (`install.mjs` now does the wiring; the migration is the cleanup of the old surface). Design when the nula WAIT lifts. Harness note kept from those sessions: a long OpenCode session can hit a SQLite session-insert failure that kills every subagent spawn — restart OpenCode; an environment crash is a failed gate, never a license to self-substitute the verdict (invariant 3). Audit 2026-06-12 (F4): when this migration (or the first MAJOR) lands, add a migration test — installer re-run over a PRIOR version's artifacts; the idempotency test covers only two fresh installs, and the "MAJOR names what to rename" path has never been exercised.

## Downstream→upstream protocol-feedback loop — 2026-06-07

Formalize the existing hand-relayed channel: a downstream's model emits a raw problem report about the protocol as it experienced it; the upstream model maps it onto the protocol's structure (root cause, owning file, minimal fix, dedup against backlog). Open questions: transport without violating the project boundary (the report is authored downstream, CARRIED by the Operator — never the upstream model reading into a downstream repo); privacy (no downstream content leaks); opt-in per downstream.

## Ideation / capture-time elicitation + accessibility — 2026-06-06 (downstream: nula)

Product discovery (shipped) covers the PRODUCT level; nothing scaffolds the per-idea level: a non-trivial idea captured to the backlog gets no design-space interrogation (actors and addressing/identity, multi-party isolation, loss/failure/recovery modes, privacy/deniability surface, accessibility incl. assistive tech), so parked ideas carry deep holes invisibly and completeness falls on Operator memory. Fix direction: capturing a non-trivial idea is an elicitation act — a short cross-domain probe, suggestion-only and proportional (a trivial idea gets no six-axis interrogation). Accessibility's review-time half shipped in the ui-ux module (4.16.0); what remains here is its place in the capture-time probe.

## META: "deficit → prosthesis" as a protocol-design method — 2026-06-06 (Operator-originated)

A generator for features and an audit lens, not a feature. Take a structural LLM weakness, build an EXTERNAL organ that compensates (the address-book pattern: externalize, don't improve). Key asymmetry: **felt vs unfelt deficits** — an unfelt deficit (a hallucinated call-graph edge feels exactly as confident as a real one) cannot rely on an opt-in prosthesis the agent invokes when it notices weakness; unfelt → always-on organ, felt → on-demand acceptable.

Seed catalog (deficit → prosthesis → coverage):

| Deficit | Felt? | Prosthesis | Coverage today |
|---|---|---|---|
| Hallucinated call-graph edges | no | LSP / tree-sitter graph as ground-truth input | contracts (partial); no tool |
| Single-path sim, misses interleavings | no | property test / harness instead of mental run | concurrency module checklist (4.16.0); harness tool still open |
| Quantity blindness (loop ×10000) | no | execute on representative inputs | performance module checklist (4.16.0); real-run still optional |
| Long-context degradation | partial | durable state + checkpoint-reset | state exists; reset discipline missing |
| Forgot half the scenarios | yes | scenario↔path coverage checklist | Builder plan checklist |
| Overconfidence in own output | no | independent reviewer, cross-model | covered (Reviewer, `auto` model) |

Two artifact tracks: (1) a living deficit catalog (each: prosthesis, felt/unfelt, always-on-or-on-demand) as feature-generator + audit lens; (2) wiring real external tools as INPUT (language server, property tester), not "reason more carefully". Open question: populating the unfelt rows — post-mortems on shipped bugs (the delayed felt signal), differential runs (two models disagree → latent deficit surfaced), injected ground-truth probes.

### Track: grounded code-graph utility + contract anchors

The flagship unfelt-deficit prosthesis. Decided design (Operator, 2026-06-06): a **standalone CLI** (not an MCP server; wrappable later), tiered backend (tree-sitter/ctags → LSP → data-flow tools) emitting ONE normalized graph; **surface uncertainty, don't hide it** — unresolved/dynamic edges marked explicitly (converts the unfelt deficit into a felt one). Contract mapping splits: structural conformance deterministic and cheap (surface drift, forbidden edge, reachability — adapt the existing fitness-function tool class), semantic conformance stays AI-judgment + tests. Prerequisite: contracts carry a machine-resolvable anchor (`path::symbol`), a contract-format change that is its own small feature. Minimal first step: tree-sitter wrapper + surface-drift detector against anchors.

## Salvaged residuals from the parked protocol-hardening branch — 2026-06-06 (re-implement fresh; AGPL-era branch deleted)

Still-open ideas (the rest of that plan shipped in other forms — cross-model review, semgrep, test discipline):

- **Plan-adversary pass**: an adversarial review of the PLAN DRAFT itself (what breaks, what's missing, fuzzy expected values, hidden structural forks) — the plan is the review's ground truth, so an error IN the plan is caught by no one. Distinct from post-build review. Could be a Reviewer mode or a capability module.
- **Version-bump confirmation + release rollback**: a bump above PATCH confirmed with the Operator; "roll back the release" as a named procedure (revert the merge commit, re-tag).
- **Per-seat default model matrix**: the config supports per-seat models; the open part is a recommended DEFAULT matrix (spend thinking where errors propagate furthest). Operator caveat from a failed prior attempt: revisit deliberately; no weak models on generative seats.

## Platform built-ins survey — safe orchestrator offload — 2026-06-08/09

Survey both platforms' built-in tools/agents and map which are safe for the orchestrator's AD-HOC use (offload instead of inline work): read-only and no role-overlap ⇒ allow (e.g. a read-only explorer for parallel analysis); write-capable generic or role-overlap ⇒ stays denied (`general`/`build`/`plan` — the role-substitution deny). Open question: does a write-capable ad-hoc generic ever have a legitimate seat, and can the deny distinguish intent? Outcome: a documented routing note (which built-ins the orchestrator may use for what) + possibly widened safe offload.

## state/current.md + backlog.md tracking — gitignore or feature-branch-only? — 2026-06-10

The resume pointer is per-session orchestrator bookkeeping yet git-tracked — a recurring tension with "never commit to main": a state refresh between features has no branch to ride (hit again 2026-06-12: the merge-gate denies a stampless push of main, so state rode the next feature branch). Decide: gitignore `.ai-pm/state/` (pure local pointer) vs keep tracked-but-feature-branch-only (current de-facto). Same question, lighter, for `backlog.md`.

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
