# Product Contract: project-boundary

User-facing contract for the guarantee that **agents stay within the project, and repo-owned files change only through git** — no agent reads, searches, or writes outside the project root, and a file the repo owns is never silently edited in place on a remote system. The *user* is the PM (whose project stays self-contained and whose source of truth stays in git) and the AI agent (which is mechanically confined to the project and to the git change channel).

---

## User value

An AI agent loose on the filesystem — reading sibling repos, editing production files in place — is a trust and integrity hazard. This guarantee draws two hard lines. First, every agent stays inside the project root: no parent directories, no sibling repositories, no protocol-internal submodule content beyond the named shipped surface. Second, any file the repository owns changes through git, never by an in-place edit on a remote system — so the git history stays the single source of truth and a "tiny obvious fix" on a server cannot silently diverge from the repo. The PM gets a self-contained project whose real state always lives in git.

## Who uses it

Every AI agent (confined to the project root and to the git change channel), and the PM (whose project stays self-contained with git as the source of truth).

## Must work

- Every agent stays within the project root (`git rev-parse --show-toplevel`) — it never reads, searches, or writes outside it.
- A downstream agent never descends into the protocol submodule beyond the named shipped surface (the workflow spec, the migrations reference, the adapter directory, the templates).
- A repo-owned file (code, schema, config template, unit file, manifest) changes through git — never by an in-place edit on a remote system.
- Runtime state, deployment actions, dev experiments, and PM-initiated remote maintenance remain permitted — the boundary is about the source of truth, not about whether remote access is allowed at all.

## Must not break

- A silent in-place content edit to a repo-owned file on a remote system is blocked (the enforcement-layer deny), so the git source of truth cannot be quietly destroyed.
- The boundary holds across sessions — it is mechanically enforced at the tool boundary, not dependent on a session re-reading the rule.
- Legitimate read-only diagnostics and the project's own deployment/CI channel are never blocked — the bright line is "does the remote file have a sibling in the repo?", not "is remote access allowed?".
- A doc/review agent reports only on its own artifact and never asserts an unverified repo/VCS fact (the reporting-discipline boundary), so the boundary's integrity is not undermined by fabricated state claims.

## Acceptance checks

- `tests/hooks.sh` — the unit suite asserting the path-boundary guards and the ssh-content-edit deny against the PreToolUse JSON contract.
- `workflow/enforcement.md` § "Boundary, delegation & gate integrity, and remote-system rules (full)" — verifies the project-boundary rule, the submodule exclusion, and the remote-system forbidden/allowed lists.
- `doc/architecture.md` § "Hooks layer for cross-session enforcement of WORKFLOW rules" — verifies the boundary guards are wired as enforcement-layer hooks, not prose-only.

## Out of scope

- Blocking legitimate remote work — read-only diagnostics, deployment via the project's own channel, and PM-initiated maintenance proceed; only silent edits to repo-owned files are forbidden.
- Enforcing semantic ownership judgements a regex cannot make — the edit-ownership rule (who writes which artifact) is orchestrator discipline plus gates, distinct from the path/remote guards this contract enforces.
- Reaching into the protocol submodule's internal history — that surface is excluded by design.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- [protocol-integrity-and-stack-literacy](../../doc/features/protocol-integrity-and-stack-literacy_plan.md) — early structural-gap closure including boundary integrity.
- [protocol-builtins-realignment](../../doc/features/protocol-builtins-realignment_plan.md) — the enforcement-layer guards including the path-boundary and ssh-content-edit denies.
- [orchestrator-read-discipline](../../doc/features/orchestrator-read-discipline_plan.md) — read-discipline within the boundary.
- [agent-reporting-discipline](../../doc/features/agent-reporting-discipline_plan.md) — the verify-or-stay-silent and lane-discipline reporting rules that keep boundary/VCS claims honest.

---

## Behavioral contract

The project-boundary rules are single-sourced, not restated here: the project-boundary rule, the submodule exclusion, and the remote-system forbidden/allowed lists in `workflow/enforcement.md` § "Boundary, delegation & gate integrity, and remote-system rules (full)"; the hook-level realization in `workflow/enforcement.md` § "Hook-level enforcement" and `doc/architecture.md` § "Hooks layer for cross-session enforcement of WORKFLOW rules"; the reporting-discipline boundary in `workflow/enforcement.md` § "Reporting discipline".
