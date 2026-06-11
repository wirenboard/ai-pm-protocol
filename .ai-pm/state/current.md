# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` = `9e85b36` (**4.12.0**). PRs #25–#36 merged. Branch clean.

## What was just shipped
- 4.11.0 (#34) — merge-gate ask-on-unresolvable-topic; light-profile product-fit compensator; INSTALL.md `## Upgrade`
- 4.11.1 (#35) — backlog triaged to the minimal core (515 → ~150 lines)
- 4.12.0 (#36) — proactive audit cadence (offer after ~5 features); doc-quality audit dispatched (fix-now half shipped, rest in backlog "Doc de-water pass"); product analysis fully covered (measured costs, rework formula, solo note)

## Up next
Detail in `.ai-pm/backlog.md`:
- **Doc de-water pass** — the audit's backlog half (summary-restate creep, contract internals, walls, dash-density style rule) — nearest concrete work
- `research` as a doing side-tool — artifacts in `docs/decisions/`, authorship fork to resolve
- Stamp-authorship signal on OpenCode (merge-gate second half)
- ad-md-editor rollout — first real downstream (run install.mjs from ITS session; boundary blocks it from here)
- HMI/adverse-state amendments; plan-adversary; verification ladder (salvaged residuals)

**Last audit:** 2026-06-12 — whole-tree doc-quality sweep at 4.11.1 (16 findings; fix-now half shipped 4.12.0, rest in backlog "Doc de-water pass"). Cadence: offer the next after ~5 shipped features.

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`. State rides the next feature branch (merge-gate denies stampless main pushes).
