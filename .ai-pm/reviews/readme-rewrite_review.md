# readme-rewrite — plan compliance review

Software-kind repo (no `## Project kind:` in CLAUDE.md ⇒ software). No `docs/threat-model.md` ⇒ non-security project. Non-code, non-user-facing meta-feature (README of the template's own front door). Verification = editorial + clean-grep, per plan Test plan.

## Plan completeness
- Stack expectations: none touched (documentation rewrite, no stack component) — section correctly absent.
- Interaction scenarios: plan declares `Provably isolated:` (single-file doc rewrite, no runtime/state/IO) — valid, no concurrent section required.
- Topic is not `hotfix-*` — no Incident-facts requirement.
- Security-relevant surfaces: non-security project (no threat-model.md) — gate never fires.
- Plan is complete.

## Plan compliance
- ✓ sc1 — install moved up (`README.md:17`, right after intro+risks); Quickstart (`:53`) with BOTH paths fleshed out: `### (a) greenfield` (`:57`) and `### (b) legacy` (`:68`) describing the two `/pm-bootstrap` modes — Быстрый старт (`:72`) / Полное документирование (`:73`). The PM-flagged legacy-onboarding gap is closed with equal weight to greenfield.
- ✓ sc2 — no inline migration step-list: grep clean for `git mv`, `Миграция с v1`, `v2.0`, `migrate to v2`. Migration referenced via `MIGRATIONS.md` pointer only (`:165`).
- ✓ sc3 — three update/migration sections consolidated to one: exactly one `## Обновление шаблона` (`:143`), keeping symlink bump + SFS re-copy variant + the «обнови шаблон» path.
- ✓ sc4 — risk list strongly cut to 7 one-line items (`:9–15`) + WORKFLOW.md pointer (`:7`). Within the PM-confirmed 5–7 band.
- ✓ sc5 — canonical order: что это (`:3`) → зачем/risks (`:5`, moved up) → как поставить/install (`:17`) → quickstart (`:53`) → подробности (Как это работает `:77`, Обновление `:143`, Что остаётся за PM `:167`, Структура `:179`/`:190`) → лицензия (`:233`).
- ✓ sc6 — accurate to shipped protocol: no version headline (README hardcodes no version — drift-proof); autonomous announce-and-proceed described (`:15`); structure trees match disk — 8 agents and 5 commands listed (`:183–186`) match `.claude/` on disk; `.ai-pm/` + `doc/` layout (`:179–231`) current.

### Existing behaviors (must-not-break)
- ✓ Install commands intact: symlink (`:22–26`), SFS `cp -R` variant (`:38–42`), `/clear` note (`:29`, `:45`) — preserved.
- ✓ Internal links resolve: `WORKFLOW.md`, `MIGRATIONS.md`, `doc/_templates`, `.claude/agents`, `.claude/commands` all exist on disk. `docs/*` appear only as downstream-project structure text inside code blocks (no markdown `](docs/…)` links) — correctly not repo-local link targets.
- ✓ No capability-list drift: this is the template's own README; the repo has no `doc/product.md` of its own (only `product.md.tmpl`), so there is no downstream capability statement to drift against. README stays an overview, per the front-gate discipline.
- ✓ README stays at marketing-level / Russian (`WORKFLOW.md:1` altitude); defers rules to WORKFLOW.md by reference.

## Categorical coverage
The two onboarding modes (greenfield, legacy) — both covered (sc1). The two legacy `/pm-bootstrap` sub-modes (quick / full) — both covered. The two decision-authority modes (interactive / autonomous) — both stated (`:15`). No silently-implemented sibling.

## Product Contract
No Product Contract touched — this is the template repo's own front-door documentation, not a downstream user-facing runtime feature (plan Contracts section: "None"). Per the plan's own classification, every scenario subject is the README/newcomer but the artifact is the protocol's marketing doc; no contract, no advocate gate, no `## Validation` gate.

## Definition of Done
- [x] All plan scenarios implemented and tested (editorial + clean-grep, per repo discipline — no automated tests by design)
- [x] Interaction scenarios have concurrent-state tests — n/a, provably isolated
- [x] Stack expectations respected; stack-spec tests pass — n/a, none touched
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — n/a, no Product Contract touched
- [x] Pipeline green — `tests/hooks.sh` 71/71 (no hook touched)
- [x] State file updated — `.ai-pm/state/current.md` reflects readme-rewrite coding status
- [x] Product Impact Report present (when contract touched) — n/a, no contract touched
- [x] Docs updates landed — `README.md` rewrite present on branch (commits 4a6fe07 + 884a766)
- [x] Expected artifacts exist (plan, this review; no contract since not a downstream user-facing feature)
- [n/a] Product-readiness gate — non-user-facing meta-feature (subject is the template's own README, not a human role using a downstream runtime feature); exempt, no advocate artifact required
- [n/a] Validation gate — software-kind repo; no `## Validation` section emitted

**DoD: pass**

## Blocking
None.

## Notes (product)
1. The plan's narrative says "the template is at v2.25.0" but the latest tag is v2.24.0 and this release targets ~v2.26.0. The README correctly hardcodes **no** version at all (drift-proof), so there is no in-text staleness — sc6 is satisfied regardless. Noting only so the PM is aware the plan prose carried a contextual version number that did not, and should not, land in the README. Why it matters: confirms the deliberate no-version choice rather than an oversight.

## Verdict
approve

<!-- The trail below is the ONE review section the orchestrator owns, not pm-plan-checker.
     See WORKFLOW.md "Edit-ownership rule" — the Pass-2 code-review trail is the single
     carve-out to "orchestrator does not edit content artefacts". -->
## Code review findings
Editorial Pass-2 (docs rewrite). One real finding, routed through the owner (pm-architect):

1. **`README.md` `## Обновление шаблона` under-states auto-update.** The install intro says agents, commands AND `settings.json` are symlinked (so auto-update on bump), and the symlink block does link `settings.json` — but the update section lists only "Агенты, команды и `WORKFLOW.md` обновляются автоматически", silently omitting `settings.json`. A symlink-install reader could needlessly hand-re-copy it after a bump. **Fix:** add `settings.json` to the auto-update list. (pm-architect.)

Verified clean (editorial): install commands accurate (symlink + SFS `cp -R` + `/clear`); both real markdown links (`WORKFLOW.md`, `MIGRATIONS.md`) resolve; 8 agents / 5 commands match disk; decision-authority + legacy-two-mode descriptions accurate to the shipped protocol; no inline migration; markdown blank-line-correct; canonical order followed, no orphaned/duplicate section; no load-bearing new-user info lost.

## Code review: 2026-06-04 — passed

Editorial Pass-2; one finding fixed in-pass, routed through the owner: pm-architect (`ca1bc0f`) added `settings.json` to the `## Обновление шаблона` auto-update list. `tests/hooks.sh` 71/71; no hook touched.
<!-- The orchestrator replaces THIS WHOLE LINE with `## Code review: <date> — passed`
     only when code-review clears. Until then the section is UNSTAMPED: `pm-pr-prep`
     refuses to release it (step 0) and `pm-auditor` blocks on it (dimension 1).
     Never ship an empty `## Code review` heading — an empty section reads as
     "no findings / passed" to a quick eye or grep; `NOT YET RUN` reads as "not done". -->
