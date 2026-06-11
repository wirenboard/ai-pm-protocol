# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` (**4.14.0** once #38 merges). PRs #25–#38.

## What was just shipped
- 4.12.0 (#36) — proactive audit cadence (offer after ~5 features); doc-quality audit dispatched; product analysis fully covered
- 4.13.0 (#37) — `research` realized as a doing side-tool (decision-base in `docs/decisions/`)
- 4.14.0 (#38) — stamp-authorship floor: orchestrator denied writing review stamps where the actor resolves (OpenCode); persona on Claude, honestly labelled; never relaxed by profile

## Up next
Detail in `.ai-pm/backlog.md`:
- **Doc de-water pass** — the audit's backlog half (summary-restate creep, contract internals, walls, dash-density style rule) — nearest concrete work
- ad-md-editor rollout — first real downstream (run install.mjs from ITS session; boundary blocks it from here)
- HMI/adverse-state amendments; plan-adversary; verification ladder (salvaged residuals)
- [who]-axis epic (hypothesis); vendor-watch at each release-audit

**Last audit:** 2026-06-12 — whole-tree doc-quality sweep at 4.11.1 (16 findings; fix-now half shipped 4.12.0, rest in backlog "Doc de-water pass"). Cadence: offer the next after ~5 shipped features.

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`. State rides the next feature branch (merge-gate denies stampless main pushes).
