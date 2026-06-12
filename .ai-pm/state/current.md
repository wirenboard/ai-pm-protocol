# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` = **4.16.0** (PRs #25–#40). Merge queue for the Operator (away; merges never inferred): **PR #41** = branch 2 (`threat-discovery-npx`, 4.17.0) → **PR #42** = branch 3 (`inject-ceilings-platform-switch`, 4.18.0, stacked on 2). Merge in order; after each squash-merge the next branch gets rebased onto fresh main.
**Conveyor (Operator: "дальше без меня автоматом, от веточек отпочкуй"):** branch 4 next, STACKED on branch 3 — verification ladder (mandatory `Runtime verification: <rung / NOT RUN — reason>` verdict field) + blocked-role return contract (a recognized "blocked" outcome for spawned roles + session-reset checkpoint discipline). Epics with non-derivable forks (parallel-work, [who]-axis) wait for the Operator.

## What was just shipped
- 4.16.0 (#40) — de-water pass complete; capability axis 2→10 + assembler per-kind default-OFF; `## Project inception` + CI offer + audit security dimension; brownfield truth reconciliation; reviewer floor sharpened (over-engineering, naming, secret-value floor)
- 4.17.0 (PR #41 pending) — threat discovery (standing model: template + procedure + module linkage); npx distribution (zero-registry `npx github:` works; registry publish external); autonomy-decision journal (progress-note record + PR-body digest)
- 4.18.0 (PR #42 pending) — inject blindness fixed (brief nudge fires on installed-but-unfilled projects; two-layer literal markers); loop ceilings (fix 2–3 / review 2 rounds ⇒ escalate); platform switch (declinable re-wire offer + config flip + model revalidation with cross-model intent + re-bake)

## Up next
Detail in `.ai-pm/backlog.md`:
- **Branch 2** (see "Next in flight" above) — threat discovery + npx + autonomy journal
- ad-md-editor rollout — first real downstream (run install.mjs from ITS session; boundary blocks it from here); live test for doc bootstrap + the new modules
- `no-product-brief-discover` inject blindness — shared template-sentinel detection
- Fix/review-loop ceilings; plan-adversary; verification ladder (salvaged residuals)
- [who]-axis epic (hypothesis); vendor-watch at each release-audit

**Last audit:** 2026-06-12 — product-deep sweep at 4.14.0 (4 findings, all dispatched: F1–F3 shipped in 4.16.0 de-water, F4 → nula-migration item). Cadence: offer the next after ~5 shipped features (next ≈ after 4.20.0).

## Conventions
Russian chat; English artifacts. `interactive` mode. `kind: mixed`, `profile: solo`, `threat-model: rich`. **Remotes:** `uni` (`aadegtyarev/ai-pm-protocol-uni`) — live fork; `origin` OLD. After squash-merge: `git fetch uni && git reset --hard uni/main`. State rides the next feature branch (merge-gate denies stampless main pushes).
