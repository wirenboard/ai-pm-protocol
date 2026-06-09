# Product Contract: cross-session-enforcement

User-facing contract for the guarantee that **the protocol's rules hold even across separate AI sessions that share no memory** — an enforcement layer mechanically blocks the rule violations a forgetful or fresh session might commit, while leaving legitimate work untouched. The *user* is the AI agent (whose dangerous actions are blocked at the tool boundary regardless of what it remembers) and the PM (who relies on the rules holding without policing each session).

---

## User value

Prose rules in a workflow document only hold while a session remembers to read them. A fresh AI session, a different model, or a long conversation that has paged the rules out would otherwise be free to do the forbidden thing. This guarantee makes the load-bearing rules *mechanical*: a small set of before-tool guards blocks the specific dangerous actions at the moment they are attempted — so the rules survive memory loss, model swaps, and session boundaries. Crucially, the guards are a named deny-list, not a blanket block, so they never get in the way of legitimate diagnostics or deployment.

## Who uses it

The AI agent (whose tool calls pass through the guards), and the PM (who gets durable rule-enforcement without supervising every action).

## Must work

- A role-duplicator agent or skill that would occupy a protocol seat is denied automatically, with a pointer to the correct protocol equivalent.
- A silent in-place content edit to a repo-owned file on a remote system is denied automatically (the silent-fix path the boundary rule blocks).
- A mutating remote action, a force-push, and a no-verify/no-gpg-sign commit are surfaced for confirmation rather than silently allowed or silently blocked.
- An empty or whitespace-only whole-file write over an existing non-empty file is denied (the truncation guard).
- The guards hold without the session having re-read the workflow rules.

## Must not break

- The deny-list stays a *named* list, never an "everything but the protocol agents" block: the built-in review/research engines and knowledge skills are not gated, and the whole-codebase review engine is kept off per-diff by routing discipline, not by a deny.
- Read-only diagnostics (logs, statuses, file reads, `journalctl`, status/info commands) and local mutating dev commands are never blocked.
- Legitimate deployment, PM-initiated remote maintenance, and runtime-state work proceed (the remote guards block only silent edits to repo-owned files and surface mutating actions for confirmation).
- The guards themselves are tested, so a guard regression fails CI rather than silently degrading the gate.

## Acceptance checks

- `tests/hooks.sh` — the unit suite asserting each guard's deny/ask/pass outcome against the PreToolUse JSON contract; gated by `.github/workflows/lint-hooks.yml`.
- `workflow/enforcement.md` § "Hook-level enforcement" — verifies the named deny-list, the ask-class guards, the truncation guard, and the not-gated built-ins.
- `doc/architecture.md` § "Hooks layer for cross-session enforcement of WORKFLOW rules" — verifies the prose-plus-hook double encoding.

## Out of scope

- Enforcing semantic judgements a regex cannot make (is this feature user-facing? is the product under-specified? is this a security-touch?) — those are soft-enforced by gates and backstops, deliberately not hooks.
- Blocking legitimate runtime, deployment, or read-only diagnostic work — the enforcement layer is a targeted deny-list, not a productivity wall.
- Realizing the same guards identically on every harness — the *rules* are harness-neutral, but the wiring and the available outcomes differ per harness (see the dual-harness contract).

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- protocol-integrity-and-stack-literacy — 2026-05-30 — early structural-gap closure feeding the enforcement layer.
- protocol-builtins-realignment — 2026-06-02 — the `wb-*` role-duplicator deny-list with built-ins explicitly not gated.
- bootstrap-write-loss-guards — 2026-06-06 — the empty-write truncation guard.
- deny-review-orchestrator — 2026-06-05 — the per-diff review-engine routing discipline (and its later reframe off a hard deny).

---

## Behavioral contract

The enforcement rules are single-sourced, not restated here: the full guard list, the named deny-list, and the ask-class guards in `workflow/enforcement.md` § "Hook-level enforcement"; the boundary / remote-system / edit-ownership rules in `workflow/enforcement.md` § "Boundary, delegation & gate integrity, and remote-system rules (full)"; the hooks-layer decision in `doc/architecture.md` § "Hooks layer for cross-session enforcement of WORKFLOW rules".
