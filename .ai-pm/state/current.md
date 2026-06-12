# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` = **4.19.1** (PRs #25–#45). **Active:** `fix/merge-gate-parsing` = **4.19.2**, shipping (review APPROVED whole-branch incl. the traversal HIGH); `proportionality by default` cut next, stacked.

## What was just shipped
- 4.17.0 (#41) — threat discovery (standing model); npx distribution; autonomy-decision journal
- 4.18.0 (#44, replaced auto-closed #42) — inject blindness fixed; loop ceilings; platform switch with model revalidation
- 4.19.0 (#43) — verification ladder (`Runtime verification:` stamp line); BLOCKED return contract; session-reset hygiene

## Up next
Operator-ordered queue (2026-06-12): (1) **merge-gate parsing fixes** — traversal addendum in build; (1.5) **proportionality by default** (8D ceremony-drift outcome, Operator-grown): default profile → `solo` (floor untouched), routing trigger, over-ceremony named as a defect, cost line in ship relay, setup explains both costs — all in the SHIPPED bodies (downstream-universal); rigor-profile tests updated deliberately; (2) **RENAME ai-pm-protocol → ai-dev-protocol, MAJOR 5.0.0** (Operator decision: FULL depth — repo renamed to `ai-dev-protocol` (clean, no -uni), package/bin, titles, AND internals: `.ai-pm/`→`.ai-dev/`, `ai-pm.config.json`→`ai-dev.config.json`, agent id `ai-pm`→`ai-dev`, every path in hooks/engine/tests; INSTALL Upgrade gains the MAJOR what-to-rename entry + the F4 migration test rides — cheapest now at 0 downstreams); (3) **old-protocol migration** (design DECIDED — see backlog; written in post-rename names); (4) **modularity module**; (5) **plan-adversary** (fork at planning: Reviewer mode vs module); (6) **downstream feedback-as-issues** (When-something-is-off extension + .github issue template; ask-class consent covers opt-in).
Also in `.ai-pm/backlog.md`: ad-md-editor rollout (its own session, post-rename); audit Low-2 length watch; version-bump-confirmation policy, model matrix, parallel-work epic (Operator's); npm registry publish (external, post-rename name `ai-dev-protocol`).

**Last audit:** 2026-06-12 — proactive whole-tree sweep at 4.19.0: **HEALTHY** (zero drift, zero secrets, 0 npm vulns, contracts hold); 2 Lows dispatched. Next ≈ after 4.24.0.
**Last 8D:** 2026-06-12 — stacked-merge conveyor failures: root causes = async-merge-treated-as-settled, scope-blind `git add -A`, gate topic-from-HEAD; fixes = 3 git-discipline bullets (4.19.1) + 2 backlog items + field notes in the parallel-work epic.

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`, then VERIFY the content landed. State rides the next feature branch (merge-gate denies stampless pushes).
