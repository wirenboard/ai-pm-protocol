# review-engine-selection — plan

Source: backlog #372/#378 (review-typology engine selection) + #269 (periodic whole-codebase review — found already shipped by the smell/hygiene slice v2.27.0, so this plan is the engine-selection residue only); PM directive 2026-06-05 — "remove the block on `code-review-orchestrator` so it is legally usable; within the protocol's own movement it just must not be auto-invoked on diffs where the simple built-in `code-review` is enough." Selected autonomously per `### Decision authority` (the next-candidate in `.ai-pm/state/current.md`), then the product fork was decided by the PM directly.

## Scenarios

1. **The orchestrator is no longer blocked.** When anyone — PM or operator — invokes `wb-development:code-review-orchestrator` in an ai-pm project, it runs. The `PreToolUse` deny that previously refused it (and its `WB_ALLOW_REVIEW_ORCHESTRATOR=1` launch-escape) are removed. The 7 `wb-*` *role-duplicator* skills stay denied exactly as before — only the orchestrator leaves the deny.
2. **The protocol's per-diff Pass-2 stays on the built-in `code-review`.** Within the pipeline's own movement (Step 5 Pass 2, every feature), the protocol reviews the change's diff with the built-in `/code-review` skill — it never auto-escalates a routine per-diff review to the orchestrator. This is protocol routing discipline, not a user block: a human is free to call the orchestrator whenever; the *automated* per-diff loop simply uses the lighter built-in engine that is enough for a single diff.
3. **The whole-codebase sweep prefers the orchestrator.** The `/pm-audit` `## Technical quality` smell/hygiene sweep — the protocol's existing periodic whole-codebase review (shipped v2.27.0) — uses `wb-development:code-review-orchestrator` as its **preferred engine when available**, because it is the multi-aspect whole-project reviewer that review type calls for. When the orchestrator is **not** installed, the sweep falls back to the built-in `/code-review` at the selected depth (`ultra` for a deep/first/legacy sweep). All existing sweep behavior (proportional new-code-gating, depth selection, findings → backlog triage) is unchanged — only the engine choice is added.
4. **An environment off-switch forces the built-in engine for the sweep.** `WB_REVIEW_ORCHESTRATOR=off` makes the whole-codebase sweep use the built-in `/code-review` even when the orchestrator is installed — for controlling cost or staying on the built-in engine. Default (unset) = prefer the orchestrator when available. This flag governs only the sweep's engine preference (read by the `/pm-audit` prose); it is not a hook and does not block anything.

## Existing behaviors this feature touches

(from `doc/user-journeys.md` / the protocol's own pipeline — what must not break)

- The 7 `wb-*` role-duplicator denies (`coder` / `code-reviewer` / `design-review` / `plan-feature` / `pr-prep` / `wb-git:workflow` / `pr-author`) — must stay byte-identical; this feature removes only the orchestrator arm.
- Every other `PreToolUse` / `UserPromptSubmit` hook (boundary guards, force-push / no-verify gates, the route-reminder) — untouched.
- The per-diff review loop (Step 5 Pass 2) — still the built-in `/code-review`; this feature makes the "per-diff = built-in, not the orchestrator" routing explicit, it does not change the engine.
- The `/pm-audit` smell sweep's proportional new-code-gating, depth selection, and findings-triage — unchanged; only the engine is selected.
- `tests/hooks.sh` — all currently-passing role-skill / boundary / push cases must keep passing.

## Contracts

(no Product Contract — this repo has no user-facing contracts by design, `doc/architecture.md` "Contract-centric product map"; the change is protocol-tooling. The env var `WB_REVIEW_ORCHESTRATOR` is an operational knob documented in README, not a product API.)

## Stack expectations touched

(from `doc/stack-notes.md`)

- **Claude Code hooks API**: `.claude/settings.json` `PreToolUse` — a let-through is `exit 0` with no output ("no decision; normal permission flow applies"); a deny emits `hookSpecificOutput.permissionDecision: "deny"`. Removing the orchestrator from the `case` makes it fall through to the trailing `exit 0` → allowed. Source: `doc/stack-notes.md` § "Claude Code hooks API".
- **jq**: the hook command string parses stdin and emits `hookSpecificOutput` JSON via `jq -nc`; the apostrophe-escaping (`'\''`) in the remaining role-skill arm must stay intact after the orchestrator arm and its guard are excised. Source: `doc/stack-notes.md` § "jq".

## Interaction scenarios

Provably isolated (hook half): the `PreToolUse` hook is **stateless** — each invocation reads its own stdin + env, decides, exits; no shared mutable state, no concurrency, no I/O beyond stdin/stdout (same isolation `deny-review-orchestrator_plan.md` recorded). Removing one `case` arm + the escape guard cannot interact with the other arms.

Engine-selection half (one interaction worth stating):

- When the `/pm-audit` smell sweep runs **and** the orchestrator is unavailable (not installed) **or** `WB_REVIEW_ORCHESTRATOR=off`: the sweep must use the built-in `/code-review` fallback and still write its `## Quality sweep:` marker / run the findings-triage exactly as today — the engine choice must not change the marker, the proportional scoping, or the triage flow.

## Test plan

- Existing tests that must pass: all of `tests/hooks.sh` (the deny-list role-skill cases, boundary guards, force-push / no-verify gates) — minus the orchestrator-specific cases this plan rewrites.
- New / changed tests (in `tests/hooks.sh`):
  - `routing: code-review-orchestrator is NOT denied (let-through)`: given `tool_input.skill = wb-development:code-review-orchestrator` and **no** flag set, when the routing hook runs, then it exits 0 with no output (normal permission flow) — proving the deny is gone. Replaces the old "without flag → deny" case.
  - `routing: wb-development:coder still denied`: given a role skill, when the hook runs, then it emits `deny` — proving removing the orchestrator arm did not loosen the role-duplicator denies. (Keep one such case; the old "even with WB_ALLOW_REVIEW_ORCHESTRATOR=1" framing is dropped since the flag is removed.)
  - Remove the obsolete `routing: code-review-orchestrator with WB_ALLOW_REVIEW_ORCHESTRATOR=1 → pass` case (the flag no longer exists).
- Stack-spec tests (one per stack expectation above):
  - The "is NOT denied" case above verifies the Claude Code hooks-API rule "fall-through = `exit 0` = allowed" against the cited behavior, not a self-consistent mapping (comment references the hooks-API source).
- Note (engine-selection half): the engine-selection / off-switch logic lives in **prose** (`workflow/review-typology.md` + `.claude/commands/pm-audit.md`) — there is no linter/runtime in this markdown-prose repo to host an automated test for it, exactly as the smell-sweep's deterministic detection half is a documented-not-built boundary (`### Review typology`). Verification of the prose half is editorial (Pass-2 `code-review` over the diff + plan-compliance), consistent with this repo's "validation by use" constraint. The deterministic hook half **is** tested (above).

## Docs to update

- `doc/architecture.md`: add a decision record — "Review-engine selection: the orchestrator is the legitimate whole-codebase engine; per-diff Pass-2 stays built-in by protocol routing; the v2.25.1 deny is removed." Note it **supersedes** the `deny-review-orchestrator` decision (the deny is lifted; the per-diff guarantee moves from a hard hook to protocol routing + the existing soft route-reminder). Authored by `pm-architect` post-coding.
- `README.md`: replace the `### Скилл code-review-orchestrator отключён по умолчанию` section — the orchestrator is no longer denied; document that the protocol routes routine per-diff review to the built-in `/code-review` while the whole-codebase sweep prefers the orchestrator, and the `WB_REVIEW_ORCHESTRATOR=off` sweep off-switch. README-currency trigger fires (install/usage section changes). Authored by `pm-architect` (README front-door owner) post-coding.
- `workflow/review-typology.md`: add the **engine-selection rule** to the registry (single-source) — per-diff type → built-in `/code-review`; whole-codebase types (smell built, architectural/functional registered) → orchestrator preferred-when-available → built-in `/code-review (ultra)` fallback → `WB_REVIEW_ORCHESTRATOR=off` forces fallback. This is protocol source (the deliverable), authored by `pm-coder`.
- `.claude/commands/pm-audit.md` `## Technical quality`: the smell sweep's `code-review` invocation becomes engine-selected per `### Review typology` (reference by name; do not re-encode). Authored by `pm-coder`.
- `workflow/enforcement.md`: one-line note that `wb-development:code-review-orchestrator` is a **legitimate engine** (no longer a denied skill), per-diff-routed to the built-in by protocol discipline — so the named deny-list reads correctly (it lists only the 7 role-duplicators). Authored by `pm-coder`.

## Out of scope

- **Per-diff review type** — explicitly stays on the built-in `/code-review`; this feature does not route per-diff to the orchestrator (the whole point of the PM directive). Separate engine, separate cadence.
- **Sibling review types** of the categorical "review type" set — `architectural` / `functional` / `criticality-prioritization` are registered-not-built in `### Review typology`; this feature wires engine selection for the **built** whole-codebase type (smell/hygiene) and states the rule once in the registry so the later types inherit it. Building those types is each its own later slice.
- **The 7 `wb-*` role-duplicator denies** — untouched; they keep their hard deny with no escape (they always have a `pm-*` equivalent). Only the orchestrator leaves the deny.
- **A standalone (non-`/pm-audit`) scheduled whole-codebase sweep** — #269 floated "a scheduled `/code-review ultra` on a cadence." The protocol's sweep trigger stays `/pm-audit`'s `## Technical quality`; a non-audit trigger would need a dedicated last-sweep-marker home (the marker↔audit-report coupling caveat in `### Review typology`) — separate feature.
- **A new product axis / new flag family** — the off-switch reuses one env var read by the sweep prose; no new hook, no new command, no new agent.
