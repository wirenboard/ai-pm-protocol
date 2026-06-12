# Execution State

> Resume pointer — READ FIRST, by this exact path. Deferred detail: `.ai-pm/backlog.md`. History: commits + CHANGELOG.

**Status (2026-06-12).** `main` = `uni/main` = **4.15.0** (PRs #25–#39); `feature/dewater-and-modules` = **4.16.0**, PR pending — awaiting Operator merge.
**Next in flight:** branch 2 STACKED on dewater-and-modules (Operator-approved stacking): threat discovery (full procedure + template + module linkage), npx distribution (bin/shebang/files), autonomy-decision journal (announce-then-act recorded in the plan progress note; ship carries the digest into the PR body). After PR 1 squash-merges: rebase branch 2 onto fresh main (force-push with Operator present, or fresh branch + cherry-pick).

## What was just shipped
- 4.14.0 (#38) — stamp-authorship floor (orchestrator denied writing review stamps where the actor resolves)
- 4.15.0 (#39) — doc bootstrap: brownfield onboarding procedure; `[persona]`
- 4.16.0 (PR pending) — de-water pass complete; capability axis 2→10 (test-methodology, ui-ux, research-methodology, debug-methodology, performance, database, i18n, concurrency) + assembler per-kind default-OFF; `## Project inception` (greenfield mirror) + CI offer + audit security dimension; brownfield truth reconciliation (brief reconstruction mode + bootstrap cross-check); reviewer floor sharpened (over-engineering, naming, secret-value floor)

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
