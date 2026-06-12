# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` = **4.19.0** (PRs #25–#44; tags v4.17–v4.19 auto-fired). The autonomous conveyor is complete and merged. **Active:** `fix/8d-stacked-merge` — 4.19.1 fixup (8D outcome: git-discipline bullets), shortened review pending.

## What was just shipped
- 4.17.0 (#41) — threat discovery (standing model); npx distribution; autonomy-decision journal
- 4.18.0 (#44, replaced auto-closed #42) — inject blindness fixed; loop ceilings; platform switch with model revalidation
- 4.19.0 (#43) — verification ladder (`Runtime verification:` stamp line); BLOCKED return contract; session-reset hygiene

## Up next
Detail in `.ai-pm/backlog.md`:
- **Merge-gate parsing fixes** (8D findings): topic from the pushed ref first; heredoc false-positive — one small mechanical feature
- ad-md-editor rollout — first real downstream (run install from ITS session); live test for bootstrap + modules + npx
- Audit 4.19.0 Lows: `Validation` stamp label undocumented; orchestrator.md length watch
- Non-derivable (Operator's): plan-adversary fork, version-bump-confirmation policy, model matrix, parallel-work epic; external: npm registry publish

**Last audit:** 2026-06-12 — proactive whole-tree sweep at 4.19.0: **HEALTHY** (zero drift, zero secrets, 0 npm vulns, contracts hold); 2 Lows dispatched. Next ≈ after 4.24.0.
**Last 8D:** 2026-06-12 — stacked-merge conveyor failures: root causes = async-merge-treated-as-settled, scope-blind `git add -A`, gate topic-from-HEAD; fixes = 3 git-discipline bullets (4.19.1) + 2 backlog items + field notes in the parallel-work epic.

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`, then VERIFY the content landed. State rides the next feature branch (merge-gate denies stampless pushes).
