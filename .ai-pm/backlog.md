# Backlog

Observations and follow-ups recorded during reviews/audits. Triaged 2026-06-12 against the minimal core: entries resolved by shipped versions removed; entries referencing the retired template structure (workflow/*.md, the pm-* roster, gen/) re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals).

## `profile: yolo` — a named escape hatch OUTSIDE the reliability guarantee — Operator decision 2026-06-12, queue position ~1.7

The Operator wants a fourth profile for hypothesis-checking and prototyping: the orchestrator does EVERYTHING alone — no Builder spawn, no per-change Reviewer, AND **no batch review before merge** (the mechanical merge-gate goes off for a yolo project). The plan collapses into a RUNNING SPEC kept current during the run; the durable artifact is the docs, which survive even when the code is discarded. Conscious tech-debt for maximum speed; the code is then either brought to standards or rewritten from scratch against the spec through the normal loop.

**This is a constitutional amendment, not a profile addendum — scope it as such:**

- **The manifesto must be reframed honestly.** Today: "a profile that cuts the floor is no protocol; the floor holds in every profile." yolo cuts the floor, so the claim becomes false unless reframed: full/lite/solo are the GUARANTEE profiles (floor enforced); **yolo is a named escape hatch that trades the guarantee for speed, under informed consent.** The manifesto keeps integrity by NAMING this, not by pretending the floor is universal. The product promise ("reliability that doesn't depend on remembering") reworded to scope it to the guarantee profiles.
- **The mechanical merge-gate becomes profile-aware** — a `[mechanical]` deny going OFF for yolo: a security-relevant enforcement change needing its own threat pass (what stops a project silently sitting in yolo? the honest answer: the Operator chose it, setup disclosed it, the audit cadence catches drift).
- **The one floor yolo KEEPS:** the Operator's explicit per-merge authorization. That is not independent review — it is the Operator consciously taking the risk, which is the whole basis of "responsibility on the user." (The Operator did NOT ask to remove this.)
- **Compensating control:** the audit cadence becomes yolo's PRIMARY safety net (not a supplement) — offered every N features as a full-review "bring to standards" sweep; the yolo setup framing states this is the catch-up gate.
- Touches: PROTOCOL.md manifesto + `## Project config` + invariant 3 phrasing; the merge-gate deny + engine `projectProfile`; `disciplined-pipeline.md` / `cross-session-enforcement.md` contracts; the product promise; setup's profile dialog (the fourth option, with brutally honest disclosure: debt is conscious, the mechanical gate is off, code-discard is a legal outcome); rigor-profile + merge-gate tests. Its own threat-discovery-grade pass on the gate-off surface.

## Audit 4.19.0 Low-2 — orchestrator length watch — 2026-06-12

`orchestrator.md` sits at the upper edge of "readable in one sitting". The rule for the NEXT side-tool addition: trim or fold, never append past the edge. (Low-1, the `Validation` stamp label, resolved in 4.19.2 — dropped, no live consumer.)

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
- **Asymmetric failure-naming** (8D ceremony-drift, D7) — a dial/gate whose failure modes are named on ONE side only breeds drift to the unnamed side: sweep for it (doc-quality names bloat but not brevity-to-uselessness; audit cadence names under- but not over-auditing; the profile dial named under-rigor but not over-ceremony until 4.20.0). Each found asymmetry is a candidate fix.

## `research` as a doing side-tool — 2026-06-11 (post-restructure queue)

Modules shape *thinking* (checklists); `research` should *do* work: investigate (market / competitor / user / stack), synthesize a COMPACT decision-base artifact in `docs/decisions/` (the home already exists), with retention discipline — compact, human-readable, superseded-not-accumulated. Pairs with the product-advocate module: the advocate ASKS "who's the user?", research ANSWERS with evidence. Design fork to resolve: who authors the artifact (a spawned role, per invariant — the orchestrator routes, never authors canon).

## Parallel feature work — Operator request 2026-06-12

Today the loop is strictly serial: one session drives one feature, one branch per PR, the state pointer names ONE active plan. Features with disjoint surfaces could run in parallel — the platform offers concurrent sub-agents and git worktrees. Design questions: per-feature state (the pointer is singular); branch isolation (PROTOCOL `## Git flow`: conflicts ⇒ stale branch, cut fresh — parallel branches invite exactly that); the stamp/merge-gate is already per-topic (holds as-is); Operator bandwidth (plans and merges still serialize through one human — the honest bottleneck). Cheap 80% already allowed: several features batched on one branch serially. The real epic: worktree-per-feature with interleaved Builder spawns. Scope honestly before building. Field notes from the first stacked-PR conveyor (8D, 2026-06-12): a dependent PR auto-closes when its base branch is deleted by a merge — retarget the next PR to main BEFORE merging the current one; a remote squash-merge is asynchronous — verify the content landed before rebasing onto it; the per-topic stamp/merge-gate held throughout (two honest denials).

## npm registry publish — external half of npx distribution — 2026-06-12

The packaging shipped 4.17.0 (`npx github:aadegtyarev/ai-pm-protocol-uni <target>` works now). What remains is external: the Operator's npm account, name-availability check (scoped fallback), `npm publish`, optionally publish-on-tag CI (NPM_TOKEN secret riding the existing auto-tag workflow). Then the README lead becomes `npx ai-pm-protocol@latest`.

## ad-md-editor rollout — first real downstream — 2026-06-11

The Operator asked to roll the protocol into ad-md-editor; this repo's session cannot (the project-boundary deny blocks cross-repo writes, correctly). Run `node src/adapter/install.mjs` against it from its own checkout/session. First real downstream = the strongest install + upgrade test we lack (N=1 → N=2; `docs/product.md` success criterion).

## Old-protocol migration — design DECIDED (Operator, 2026-06-12); queue position 2

**The insight (Operator):** an old-protocol downstream is a brownfield whose DOCS are more accurate than its code as a source — the old protocol's discipline kept them true, just bloated. So the content migration is doc bootstrap with a richer source, not a new procedure.

**Decided shape (no new orchestrator section — the length watch holds):**

1. **Content procedure → `## Doc bootstrap` source mode** (~5-6 lines): old-protocol docs present ⇒ the Builder drafts FROM the old docs as primary source, compressed into the new templates under the new ceilings; the TREE is the verification ground — an old-doc claim contradicting the code surfaces as a finding, never migrates silently; old docs are DELETED once their truth moves (supersede, one home); then a comment de-water pass over the code (wall comments duplicating docs go; the local *why* stays — invariant 6 on code); then a closing whole-project audit is offered.
2. **Wire runbook → `INSTALL.md ## Upgrade`**: the mechanical half — the one-command install lays the new structure; cleanup of the old surface (old pm-* agent roster, WORKFLOW.md, `.ai-pm/tooling` submodule/symlinks); the MAJOR-bump framing already lives there.
3. **F4 migration test** rides: installer re-run over a PRIOR version's artifacts (the idempotency test covers only fresh installs).

Live case: nula (execution still in ITS session when the WAIT lifts). Harness note kept: a long OpenCode session can hit a SQLite session-insert failure killing every spawn — restart; an environment crash is a failed gate, never a license to self-substitute (invariant 3).

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
