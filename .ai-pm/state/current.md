# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` = **4.16.0** (PRs #25–#40). Merge queue for the Operator (away; merges never inferred), IN ORDER: **#41** (`threat-discovery-npx`, 4.17.0) → **#42** (`inject-ceilings-platform-switch`, 4.18.0, stacked) → **#43** (`verification-ladder-blocked-role`, 4.19.0, stacked). After each squash-merge the next branch gets rebased onto fresh main and retargeted.
**Conveyor:** 4.19.0 was the last well-specified derivable batch. Next: the **proactive audit** (5 features shipped since the 4.14.0 sweep — the cadence fires; it runs while the Operator is away, findings come back dispatched). Remaining backlog is non-derivable (plan-adversary fork, version-bump-confirmation policy, model matrix — Operator's), external (npm publish, ad-md-editor session), or WAIT-gated (nula).

## What was just shipped
- 4.17.0 (#41 pending) — threat discovery (standing model); npx distribution (zero-registry `npx github:` works); autonomy-decision journal (progress-note record + PR-body digest)
- 4.18.0 (#42 pending) — inject blindness fixed (brief nudge fires on installed-but-unfilled projects); loop ceilings; platform switch (re-wire offer + config flip + model revalidation with cross-model intent)
- 4.19.0 (#43 pending) — verification ladder (`Runtime verification:` mandatory stamp line, five rungs); BLOCKED return contract for spawned roles; session-reset hygiene (trigger + checkpoint checklist)

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
