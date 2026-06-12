# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-dev/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** Main version = the latest git tag (`git describe --tags`) / `package.json`; recent ships = the CHANGELOG top; open PRs = the forge (`gh pr list`). This pointer does NOT restate them (invariant 6 — a restated number drifts at the next merge; the 4.20.1 8D). **Active:** MAJOR 5.0.0 rename (`ai-pm`→`ai-dev`) in progress on `feature/rename-ai-pm-to-ai-dev`. Resume from here.

## Recent direction (the why, not the version log — that is CHANGELOG's)

The session's arc: onboarding symmetry (doc bootstrap, project inception, threat discovery), the capability-module catalog (2→10), then a hardening run — merge-gate parsing + traversal, and two process 8Ds: stacked-merge git discipline, and proportionality-by-default (the dial's default flipped to `solo`, the floor untouched). Detail in CHANGELOG; rationale in `docs/decisions/` and commit history.

## Up next — Operator-ordered queue (nothing started; each needs the Operator's word)

Detail for each in `.ai-dev/backlog.md`; sequence is the Operator's (not all locked).

1. **OpenCode security bundle** — boundary-strict default permissions (`{edit,bash,webfetch}: allow`, plugin = sole guard) + opaque-bash classifier (opacity→ask/warn, anti-ritual tuned, honest non-airtight ceiling). One pass, same bash-boundary surface. Operator-recommended BEFORE rename (cleaner deny-layer review).
2. **RENAME → `ai-dev-protocol`, MAJOR 5.0.0 — STANDALONE** (Operator: rename alone, it pulls the whole "pm" nomenclature — agent prefixes `pm-*`/`ai-pm`, the `/dev-setup` skill, `.ai-dev/`, `ai-dev.config.json`, every path). First-ever MAJOR; exercises the migration + version-bump-confirmation story. Full scope in backlog.
3. **`profile: yolo`** — constitutional escape hatch OUTSIDE the guarantee (cuts the mechanical merge-gate); its own threat pass + manifesto reframe. Full design in backlog.
4. **Old-protocol migration** (design DECIDED — docs-first bootstrap mode + INSTALL Upgrade runbook; post-rename names).
5. **modularity module**; 6. **plan-adversary** (fork: Reviewer mode vs module); 7. **downstream feedback-as-issues**.

Also in `.ai-dev/backlog.md`: ad-md-editor rollout (its own session, post-rename); audit Low-2 (orchestrator.md length watch); version-bump-confirmation policy; per-seat model matrix; parallel-work epic; npm registry publish (external).

**Recommended before the big items (yolo, rename):** a fresh proactive audit — ~3 features since the 4.19.0 sweep, but the rename is a MAJOR and yolo cuts a floor, so a clean baseline first is cheap insurance.

**Last audit:** 2026-06-12 — whole-tree sweep at 4.19.0: HEALTHY (zero drift, zero secrets, 0 npm vulns, contracts hold). **Last 8D:** 2026-06-12 ×2 — stacked-merge conveyor failures (→ 4.19.1 git discipline) and ceremony-drift (→ 4.20.0 proportionality).

## Conventions

Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-dev-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`, then VERIFY the content landed (8D lesson: a remote merge is async). State rides the next feature branch (merge-gate denies stampless main pushes) — so this file sits uncommitted between features, read from the working tree on resume.
