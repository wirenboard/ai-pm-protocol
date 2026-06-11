# Backlog

Observations and follow-ups recorded during reviews/audits. Triaged 2026-06-12 against the minimal core: entries resolved by shipped versions removed; entries referencing the retired template structure (workflow/*.md, the pm-* roster, gen/) re-stated as minimal-core touchpoints; the essence kept, the archaeology dropped (git history holds the originals).

## [who] axis / operator-scenario presets — retracted from README, parked as a hypothesis epic — 2026-06-12 (Operator decision)

**Decision (Operator, 2026-06-12):** the `[who] × [speed↔quality]` matrix was retracted from `README.md` (4.10.3) — the `[who]` axis had zero implementation and its tech-lead cell ("you see the diff") contradicted `PROTOCOL.md` "Never show code". The honest surface today is the one-axis `profile` dial.

**If/when the non-technical-PM bet is taken** (it is a recorded hypothesis in `docs/product.md` §1, not a served segment), the axis is its own coherent epic, not scattered fixes: a `scenario` (or `operator`) key in `ai-pm.config.json` with 2–3 presets (e.g. `pm` / `tech-lead`) parameterizing diff visibility, question depth, and the auto-decide ceiling; amending "Never show code" into a scenario-conditioned rule; and a friendlier on-ramp. (The lighter-profile compensator — the Reviewer's review-time product-fit check — is a floor checklist item since 4.11.0; the epic may deepen it.)

## Stamp-authorship signal on OpenCode — 2026-06-12 (from product analysis, finding 2b; second half)

The platform resolves the actor, so the reviewer could write a marker the orchestrator's write path can't produce — narrows the merge-gate's "stamp presence, not authorship". Claude stays presence-only (no actor signal in the hook payload); label honestly. (The first half — merge-gate ask-on-unresolvable-topic — is in since 4.11.0.)

## Vendor-watch standing item — platform absorption — 2026-06-12 (from product analysis, finding 4)

Claude Code natively ships agent teams, review subagents, deny hooks; vendors absorb orchestration primitives over time (precedent: Agent-OS retired its phases). At each release-audit, check what the platforms absorbed and re-aim: the durable parts are cross-platform parity, the honesty map, and product discovery — never re-wrap a primitive the vendor ships. Related research idea: whether the loop itself could ride Claude Code's dynamic-Workflow primitive (deterministic fan-out) without losing the PM-in-the-loop forks — `research` first, it may be the absorption case in point.

## Doc de-water pass — audit 2026-06-12 leftovers (M3–M6, L1–L3, L5, L7, L8) — 2026-06-12

The fix-now half of the doc-quality audit shipped 4.12.0 (CHANGELOG header, adapter-README archaeology, enforcement-map slips, README shop window, two trivia). Remaining findings, one structural pass:

- **Summary-restate creep (M3–M5):** the discovery-frameworks sentence still has two homes (the contract is the keeper; drop the `src/templates/product.md` copy — the README copy went in 4.12.0); the dial block and roles table are mirrored README↔brief↔PROTOCOL (shop-window docs compress and point, never mirror); `docs/contracts/product-foundation.md` restates the orchestrator's discovery procedure clause-for-clause and is already drifting — cut to guarantee-only.
- **Contracts inventory mechanism internals (M6):** `cross-session-enforcement.md` enumerates merge-gate test cases; `disciplined-pipeline.md` restates stamp line-forms — point at the test, don't inventory it (the parity-count disease).
- **Walls (L1, L2):** `src/templates/product.md` header blockquote ~170 words (a downstream Operator's first read); reviewer.md and architecture.md 100+-word bullets.
- **Small (L3, L5, L7, L8):** "four old roles" archaeology in builder/reviewer intros (drop "old", point at the Folds column); registry fail-safe stated twice in-file; `PROTOCOL.md` ship-beat names `contracts.md` where this repo's home is `docs/contracts/`; INSTALL.md leftover verification-status sentence.
- **Style rule (systemic):** ≈ one dash-clause per sentence in human-facing docs — add to the Reviewer's doc-quality floor item when rewriting it (L2), then it polices itself; apply per file on next touch, not as a big-bang rewrite.

## `audit` — extra dimension candidates — 2026-06-11 (post-restructure queue; trigger shipped 4.12.0)

The proactive trigger is in (orchestrator `## Audit`: offer after ~5 shipped features, state records the last run — 4.12.0). What remains of this item: dimension candidates to fold into auditor sweeps as the need shows (salvaged from prior epics):

- **Single-source drift** — an enum/taxonomy/rule restated outside its one home and drifted (the per-diff Reviewer is blind to cross-file copies that pre-date the diff).
- **Temporal-status conflation** — "planned / interim / temporary" in one doc vs "done / current" in another.
- **Whole-tree code-quality sweep** — legacy or never-diff-reviewed code; cross-cutting patterns invisible per-diff (architectural and functional/integration review types).
- **Instruction-file overreach** — decision/security content sitting in a harness instruction file (CLAUDE.md-class) whose own pointer says it is owned by `docs/` canon; remediation is move-not-copy.

## `research` as a doing side-tool — 2026-06-11 (post-restructure queue)

Modules shape *thinking* (checklists); `research` should *do* work: investigate (market / competitor / user / stack), synthesize a COMPACT decision-base artifact in `docs/decisions/` (the home already exists), with retention discipline — compact, human-readable, superseded-not-accumulated. Pairs with the product-advocate module: the advocate ASKS "who's the user?", research ANSWERS with evidence. Design fork to resolve: who authors the artifact (a spawned role, per invariant — the orchestrator routes, never authors canon).

## ad-md-editor rollout — first real downstream — 2026-06-11

The Operator asked to roll the protocol into ad-md-editor; this repo's session cannot (the project-boundary deny blocks cross-repo writes, correctly). Run `node src/adapter/install.mjs` against it from its own checkout/session. First real downstream = the strongest install + upgrade test we lack (N=1 → N=2; `docs/product.md` success criterion).

## Old-template downstream (nula) → minimal core — one-time migration — 2026-06-10

A deployed downstream on the OLD template (nula: `.ai-pm/tooling` submodule + symlinks to the old `.claude/agents/pm-*` + `WORKFLOW.md`) needs a one-time, file-level move to the minimal core (`install.mjs` now does the wiring; the migration is the cleanup of the old surface). Design when the nula WAIT lifts. Harness note kept from those sessions: a long OpenCode session can hit a SQLite session-insert failure that kills every subagent spawn — restart OpenCode; an environment crash is a failed gate, never a license to self-substitute the verdict (invariant 3).

## Test coverage of the client / I-O boundary layer — 2026-06-09 (downstream: nula)

A real bug lived in client glue (fetch + state population) and was caught ONLY by an optional, Operator-initiated E2E; unit coverage gated the pure core only. A whole architectural layer can be untested-by-design and still pass every gate. Minimal-core fix direction: the Builder's plan, when a feature touches a layer unit tests structurally cannot reach (fetch+state, route handlers, adapters), must name how that layer is covered (integration / E2E) or surface the untested-layer risk; an `audit` dimension can flag a layer with ZERO tests (presence-flag, not a %-gate).

## Test-first regression discipline + review-loop ceiling — 2026-06-09 (downstream: nula)

Residuals from the E2E-ownership design (the tier split itself is in: `tools.json` beats — `build` fast tier, `ship` gate tier):

- **On a gate failure**, classify the root cause — app bug vs test drift. App bug → the fix is test-first: write the fast-tier test for the CORRECT behavior, confirm RED on the buggy code, fix, GREEN — every gate-caught bug becomes a cheap fast-tier guard (the ratchet). Test drift (locator stale because the UI legitimately changed) → fix the test, no new guard.
- **Fix-loop ceiling:** cap repeated fix attempts on one finding (2–3) → stop, write state, escalate to the Operator — never grind.
- **Review-loop ceiling (sibling):** two Builder↔Reviewer rounds on one finding → escalate to the Operator as a judgment call.

## Downstream→upstream protocol-feedback loop — 2026-06-07

Formalize the existing hand-relayed channel: a downstream's model emits a raw problem report about the protocol as it experienced it; the upstream model maps it onto the protocol's structure (root cause, owning file, minimal fix, dedup against backlog). Open questions: transport without violating the project boundary (the report is authored downstream, CARRIED by the Operator — never the upstream model reading into a downstream repo); privacy (no downstream content leaks); opt-in per downstream.

## Ideation / capture-time elicitation + accessibility — 2026-06-06 (downstream: nula)

Product discovery (shipped) covers the PRODUCT level; nothing scaffolds the per-idea level: a non-trivial idea captured to the backlog gets no design-space interrogation (actors and addressing/identity, multi-party isolation, loss/failure/recovery modes, privacy/deniability surface, accessibility incl. assistive tech), so parked ideas carry deep holes invisibly and completeness falls on Operator memory. Fix direction: capturing a non-trivial idea is an elicitation act — a short cross-domain probe, suggestion-only and proportional (a trivial idea gets no six-axis interrogation). Accessibility deserves first-class placement in the probe and in any UI-bearing project doc.

## Blocked-role return contract + session-reset hygiene — 2026-06-06 (field-experience essay)

- **Escape hatch:** the orchestrator's failure path exists (retry twice → stop and report); what's missing is the AGENT side — a recognized "blocked / cannot proceed" return for a spawned role, modeled as a first-class expected outcome instead of forcing a best-effort artifact the review then rejects.
- **Session hygiene:** long orchestrator conversations degrade; the durable state (`.ai-pm/state/current.md` + git) makes a reset lossless, but no discipline says WHEN to checkpoint-and-reset. Define the trigger and the checklist.

## META: "deficit → prosthesis" as a protocol-design method — 2026-06-06 (Operator-originated)

A generator for features and an audit lens, not a feature. Take a structural LLM weakness, build an EXTERNAL organ that compensates (the address-book pattern: externalize, don't improve). Key asymmetry: **felt vs unfelt deficits** — an unfelt deficit (a hallucinated call-graph edge feels exactly as confident as a real one) cannot rely on an opt-in prosthesis the agent invokes when it notices weakness; unfelt → always-on organ, felt → on-demand acceptable.

Seed catalog (deficit → prosthesis → coverage):

| Deficit | Felt? | Prosthesis | Coverage today |
|---|---|---|---|
| Hallucinated call-graph edges | no | LSP / tree-sitter graph as ground-truth input | contracts (partial); no tool |
| Single-path sim, misses interleavings | no | property test / harness instead of mental run | optional real-run |
| Quantity blindness (loop ×10000) | no | execute on representative inputs | optional real-run |
| Long-context degradation | partial | durable state + checkpoint-reset | state exists; reset discipline missing |
| Forgot half the scenarios | yes | scenario↔path coverage checklist | Builder plan checklist |
| Overconfidence in own output | no | independent reviewer, cross-model | covered (Reviewer, `auto` model) |

Two artifact tracks: (1) a living deficit catalog (each: prosthesis, felt/unfelt, always-on-or-on-demand) as feature-generator + audit lens; (2) wiring real external tools as INPUT (language server, property tester), not "reason more carefully". Open question: populating the unfelt rows — post-mortems on shipped bugs (the delayed felt signal), differential runs (two models disagree → latent deficit surfaced), injected ground-truth probes.

### Track: grounded code-graph utility + contract anchors

The flagship unfelt-deficit prosthesis. Decided design (Operator, 2026-06-06): a **standalone CLI** (not an MCP server; wrappable later), tiered backend (tree-sitter/ctags → LSP → data-flow tools) emitting ONE normalized graph; **surface uncertainty, don't hide it** — unresolved/dynamic edges marked explicitly (converts the unfelt deficit into a felt one). Contract mapping splits: structural conformance deterministic and cheap (surface drift, forbidden edge, reachability — adapt the existing fitness-function tool class), semantic conformance stays AI-judgment + tests. Prerequisite: contracts carry a machine-resolvable anchor (`path::symbol`), a contract-format change that is its own small feature. Minimal first step: tree-sitter wrapper + surface-drift detector against anchors.

## HMI / platform-convention invariants + adverse-state gate — 2026-06-06 (downstream: matter-import-ble)

A feature passed every gate (plan, review, green tests, on-hardware run) and the Operator still found user-facing defects by hand in minutes: device loss not painted as an error, optimistic state lying about an offline device, no action feedback. The protocol gates function, safety, and security, but nothing asks whether the feature is *usable* per the platform's HMI conventions, or how it behaves in adverse states. Amendments to land (mapped to the minimal core):

- **Adverse-state enumeration in the plan** (strongest): a user-facing feature's plan must list lifecycle transitions and failures (offline, lost command, reconnect, partial failure, restart), not just the happy path — Builder plan checklist; absence is a Reviewer finding. (The Reviewer's correctness item covers error paths of what WAS built; this gates what the plan must consider.)
- **Full-composition integration test**: at least one test exercising production wiring, not a trimmed harness — the slice-tested-but-system-broken class.
- **HMI conventions as a project doc**: the protocol carries only the universal gate ("a user-facing surface must conform to the project's platform-convention invariants"); the CONTENT is project-authored at setup (like a threat model), never hardcoded into the core.
- **Proportionality**: real-use verification mandatory only for features touching the HMI surface, with an escape for trivial label changes.

Cleanest composition: extend the product-advocate module with an HMI/adverse-state dimension rather than erecting a parallel stack.

## Salvaged residuals from the parked protocol-hardening branch — 2026-06-06 (re-implement fresh; AGPL-era branch deleted)

Still-open ideas (the rest of that plan shipped in other forms — cross-model review, semgrep, test discipline):

- **Plan-adversary pass**: an adversarial review of the PLAN DRAFT itself (what breaks, what's missing, fuzzy expected values, hidden structural forks) — the plan is the review's ground truth, so an error IN the plan is caught by no one. Distinct from post-build review. Could be a Reviewer mode or a capability module.
- **Verification ladder + mandatory verdict field**: take the highest reachable rung (entrypoint boots → runs on mocks → runs on target) and force the Reviewer verdict to carry `Runtime verification: <rung / NOT RUN — reason>` so "didn't run it" stops being silent.
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
