# Plan-compliance review — anti-corner-cutting Piece 0b + self-patch ban + plugin structural fix

Branch: `feature/opencode-harness-support--anti-corner-cutting-p0b-transparency`
Range: `feature/opencode-harness-support...HEAD` (`ccc043a` transparency rider, `41d50aa` self-patch ban, `b5bdfc4` plugin + tests + persona)
Plan: `doc/features/orchestrator-anti-corner-cutting_plan.md` § "Transparency rider (Piece 0b)" + EXTENSION. The self-patch ban + `.ai-pm/tooling` hole + doc/docs fix were discovered live (nula incident) and folded in as the same enforcement-hardening slice — in scope.

## Plan completeness
- ✓ Touches a stack component (OpenCode plugin) — plan has "Stack expectations touched" with source URLs (lines 92–98).
- ✓ Touches shared mutable state / async (plugin per-instance state + hooks) — plan has "Interaction scenarios" (lines 100–105).
- ✓ Non-security project (no `docs/threat-model.md`) — threat-model gate does not fire.
- ✓ `Source:` line present (PM-directed, not autonomously selected — selection-citation backstop does not fire).

## Plan compliance
- ✓ Transparency rider (Piece 0b) — `workflow/pm-comms.md` § "How to talk to the PM" carries the announce-read-for-context-BEFORE + no-relay rule with ✓/✗ examples; `workflow/enforcement.md` carries the cross-ref ("transparency rider, single-sourced in workflow/pm-comms.md"); OpenCode persona body echoes it; test `oc-transparency-rider-persona` exists and passes.
- ✓ Self-patch-the-enforcer ban — `workflow/enforcement.md` states the block-on-legitimate-work → protocol-feedback + STOP/escalate, NEVER edit the enforcer / `.ai-pm/tooling` / deployed adapter (changed only via submodule bump); explicitly framed as the same family as never-self-substitute. Remote-system-boundary rule extended with the matching forbidden bullet + Submodule-exclusion cross-ref. Persona echoes it; test `oc-self-patch-ban-persona` exists and passes. `protocol-feedback` directory convention is single-sourced in `workflow/protocol-gap.md` (referenced, not dangling).
- ✓ Plugin structural fix — `isOrchestratorAuthorable` now: `.ai-pm/` exempt EXCEPT `.ai-pm/tooling/**` (closes self-patch hole) AND accepts `docs/features` (plural, downstream) alongside `doc/features`. Two-line code change; verified the ONLY non-comment code change in the whole plugin diff.
- ✓ Unit coverage — `.ai-pm/tooling/**` write/edit/bash-cat-bypass DENIED (4 cases incl. the deployed enforcer self-patch target); `docs/features/<topic>_plan.md` + `doc/features/...` ALLOWED; `.ai-pm/state|reviews|contracts` regression ALLOWED (3 cases). All non-vacuous (would fail on revert).
- ✓ (f)/(g)/(h) guards unchanged — diff confirms no non-comment code touched outside `isOrchestratorAuthorable`; merge-gate (h) intact. ESM single-export intact (one `export const AiPmEnforcement`).
- ✓ Persona plan-path made convention-agnostic (`doc/features/` or `docs/features/`) — no longer contradicts a docs/-using downstream.
- ✓ Cross-harness — `WORKFLOW.md`/`workflow/*`/pm-comms non-generated → Claude golden byte-identical (generator 4/4); neutral-prose 5/5 clean; persona OpenCode-only (AGENTS.md correctly NOT in diff). Deployed plugin == template byte-identical save the expected `__WB_DENY_ROLES__` substitution. Deployed persona body == manifest body.
- ✓ No existing test/invariant weakened — oc-plugin-unit 63/63, opencode 39/39, generator 4/4, hooks 79/79, neutral-prose 5/5 all green; only-additive test changes.

## Definition of Done
- [x] All plan scenarios implemented and tested (Piece 0b transparency rider + self-patch ban + plugin fix; persona + plugin + prose-grep tests)
- [x] Interaction scenarios have concurrent-state tests (plan's interaction scenarios belong to pieces 1–3, shipped in sibling branches; this slice adds no new shared-state path beyond the existing per-instance classifier — covered by the existing regression cases)
- [x] Stack expectations respected; stack-spec tests pass (ESM single-export + `tool.execute.before` JS-throw-to-block honored; unit suite green)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change (`cross-session-enforcement.md` — all Must-work/Must-not-break preserved; the named-deny-list discipline holds, the docs-plural fix REMOVES a false denial, the tooling denial is a named carve-out not a blanket; `tests/hooks.sh` 79/79)
- [x] Pipeline green (oc-plugin-unit 63, opencode 39, generator 4, hooks 79, neutral-prose 5)
- [x] State file updated (`.ai-pm/state/current.md` records piece 0b)
- [x] Product Impact Report present (when contract touched) — behavioral detail single-sourced to `workflow/enforcement.md` which is updated; see product note 1 on recording the new guarantee in the contract
- [ ] Docs updates landed — see note 2: `doc/architecture.md` decision-record extension is plan-deferred to a post-coding `pm-architect` handoff and is NOT in this branch
- [x] Expected artifacts exist (plan, this review; no per-feature contract is user-facing-new for this slice)
- [n/a] Product-readiness gate (the protocol "user" is the orchestrator/PM; this is an enforcement-hardening change to an existing contract surface, not a new user-facing feature requiring an advocate pass — sibling pieces carried the advocate work)
- [n/a] Validation gate (software-kind project)
- [x] Failure-inventory negative-space tests present (self-patch-route denials + cat-bypass are the negative-space tests for the self-patch failure path)

**DoD: pass** (the one unchecked item is a plan-acknowledged post-coding deferral, surfaced as a product note, not a blocking gap — consistent with how the sibling merged branches sequenced it)

## Blocking
(none)

## Notes (product)
1. The self-patch ban introduces a NEW user-facing protection — "the enforcer cannot be edited to route around itself; `.ai-pm/tooling` and the deployed adapter change only via a submodule bump." The `cross-session-enforcement.md` contract single-sources its detail to `workflow/enforcement.md` (now updated), so no edit is strictly required, but this is a meaningful new guarantee. Why it matters: a PM reading the contract's Must-work list would not learn the enforcer is now self-protecting. Consider adding a Must-work line (e.g. "an in-place edit of the deployed enforcer / protocol submodule is denied") so the guarantee is discoverable at the contract, not only in the single-sourced rule file.
2. `doc/architecture.md` anti-corner-cutting decision record is NOT extended in this branch (no mention of self-patch / piece 0b / the `.ai-pm/tooling` partition). The plan (lines 53, 131) owns this as a post-coding `pm-architect` handoff, and the state file marks it "DUE next" across all sibling slices. Why it matters: the architecture record is accumulating debt across several merged anti-corner-cutting branches — the design rationale (self-patch is the worst gate-integrity variant; the plugin/persona split; the docs-plural false-deny root cause) is not yet captured in canon. Track that the deferred `pm-architect` arch-record pass actually lands before the umbrella feature is considered done.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker. -->
## Code review findings
Pass-2 `code-review` (cross-model Sonnet) on the security-critical plugin change (`isOrchestratorAuthorable`) + tests → **`[]` (clean, no findings)**. Verified: (1) the hole is genuinely closed — the orchestrator's edit of the deployed plugin via the `.opencode/plugin` symlink reaches it only through the REAL path `.ai-pm/tooling/.opencode/plugin/...`, now DENIED by `parts[1] !== "tooling"` (the `.opencode/`-prefixed path was already denied); (2) no `docs/features` false-allow (`docs/features/../architecture.md` normalizes via `path.resolve` to `docs/architecture.md` → denied); (3) the bash-cat-bypass test exercises the real bash → `bashWriteTargets` → guard (g) path; (4) all 9 new unit tests non-vacuous; (5) guards (f)/(g)/(h)/(i) byte-identical (only `isOrchestratorAuthorable` body + 2 comments changed). One doc-grade note (NOT a defect): the plugin comment implies the hook receives a symlink-FOLLOWED path, but `path.resolve` does not follow symlinks — the guard is correct either way (both the symlink-prefixed path and the real `.ai-pm/tooling` path are denied), only the comment's rationale is loose → recorded as a tiny backlog tidy. Pass-1 product notes (non-blocking): the self-protecting-enforcer guarantee isn't yet in the `cross-session-enforcement.md` contract Must-work (optional — single-sourced in enforcement.md); the `doc/architecture.md` decision-record extension is plan-deferred (post-coding pm-architect).

## Code review: FIXED — n/a (clean; 0 findings). `b5bdfc4` (+ prose `ccc043a`/`41d50aa`).
Re-verified: oc-plugin-unit 63/63, opencode 39/39, core-delegation 2/2, generator 4/4 (Claude byte-identical), neutral-prose 5/5, hooks 79/79, targeted-reading 7/7, ultra-absent 2/2.

## Verdict (Pass 2): approve
