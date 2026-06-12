# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** Main version = the latest git tag (`git describe --tags`) / `package.json`; recent ships = the CHANGELOG top; open PRs = the forge (`gh pr list`). This pointer does NOT restate them (invariant 6 — a restated number drifts at the next merge; this very 8D). **Active:** `fix/pointer-no-restate` (this fix). Otherwise: working tree clean, resume from here.

## Recent direction (the why, not the version log — that is CHANGELOG's)
The session's arc: onboarding symmetry (doc bootstrap, project inception, threat discovery), the capability-module catalog (2→10), then a hardening run — merge-gate parsing + traversal, and two process 8Ds: stacked-merge git discipline, and proportionality-by-default (the dial's default flipped to `solo`, the floor untouched). Detail in CHANGELOG; rationale in `docs/decisions/` and commit history.

## Up next — Operator-ordered queue (nothing started; each needs the Operator's word)
1. **`profile: yolo`** — a named escape hatch OUTSIDE the reliability guarantee (cuts the mechanical merge-gate). CONSTITUTIONAL amendment, not a profile addendum — full design in `.ai-pm/backlog.md`; needs its own threat pass + honest manifesto reframe (full/lite/solo = guarantee profiles; yolo keeps only the Operator's explicit merge word; audit cadence is its compensator).
2. **RENAME → `ai-dev-protocol`, MAJOR 5.0.0** (Operator decision: FULL depth — repo to `ai-dev-protocol` (clean, no -uni), package/bin/titles, AND internals `.ai-pm/`→`.ai-dev/`, `ai-pm.config.json`→`ai-dev.config.json`, agent id `ai-pm`→`ai-dev`, every path in hooks/engine/tests; INSTALL Upgrade gains the MAJOR what-to-rename entry + F4 migration test rides — cheapest now at 0 downstreams). First-ever MAJOR; the migration story is exercised here.
3. **Old-protocol migration** (design DECIDED — see backlog: docs-first source mode in `## Doc bootstrap` + wire runbook in INSTALL `## Upgrade`; write in post-rename names).
4. **modularity module** — boundary judgment vs architecture.md + boundary/dependency-linter mention in setup (numeric thresholds = project linter config).
5. **plan-adversary** — adversarial review of the plan draft (fork at planning: Reviewer mode vs capability module).
6. **downstream feedback-as-issues** — When-something-is-off extension + `.github` issue template; ask-class consent covers opt-in.

Also in `.ai-pm/backlog.md`: ad-md-editor rollout (its own session, post-rename); audit Low-2 (orchestrator.md length watch); version-bump-confirmation policy; per-seat model matrix; parallel-work epic; npm registry publish (external).

**Recommended before the big items (yolo, rename):** a fresh proactive audit — ~3 features since the 4.19.0 sweep, but the rename is a MAJOR and yolo cuts a floor, so a clean baseline first is cheap insurance.

**Last audit:** 2026-06-12 — whole-tree sweep at 4.19.0: HEALTHY (zero drift, zero secrets, 0 npm vulns, contracts hold). **Last 8D:** 2026-06-12 ×2 — stacked-merge conveyor failures (→ 4.19.1 git discipline) and ceremony-drift (→ 4.20.0 proportionality).

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`, then VERIFY the content landed (8D lesson: a remote merge is async). State rides the next feature branch (merge-gate denies stampless main pushes) — so this file sits uncommitted between features, read from the working tree on resume.
