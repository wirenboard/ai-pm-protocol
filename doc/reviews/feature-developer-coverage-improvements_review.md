---
pr: TBD
branch: feature/developer-coverage-improvements
reviewer: self-review based on async audit (task #44)
reviewed_at: 2026-05-24
trail_type: committed-review (AP-16)
---

**Verdict:** approve

Closes task #44 — PM + Developer coverage balance review. Async audit identified disbalance toward PM coverage (developer ergonomics weak). This PR addresses high-priority gaps:

1. Developer environment foundational artefact + Stage E expansion
2. Trust profile differentiation в subagents (planner / coder / reviewer)
3. Refactor playbook + dependency policy templates
4. Lite-mode extension с `c-fast` variant для Trust profile C

# Findings

## Cross-cutting

- ✅ HeartVault leak grep clean (sanitize'нул prior committed mentions в review trail)
- ✅ Composition matrix consistent (Stage D / Stage E checklists reference new artefacts)
- ✅ AP cross-references work (refactor-playbook references AP-6 / AP-19 / AP-18; dependency-policy references AP-18 + § 10 security catalogue)
- ✅ Trust profile differentiation explicit dual templates в 3 subagents (planner / coder / reviewer)
- ✅ Lite-mode hierarchy clear (bugfix → small-fix → c-fast escalating opt-in criteria)

## Specific changes

### Phase 1: Developer ergonomics

- **`dev-environment.md.tmpl`** (new) — foundational artefact 11 секций (prerequisites / initial setup / day-to-day commands / hot reload / IDE recommendations / debug entry points / dependency management / profiling / troubleshooting / Trust profile differentiation / связи). «From git clone до working state < 5 минут.»
- **`bootstrap-state.md.tmpl` Stage D** — добавлены checkboxes для `dev-environment.md`, optional `dependency-policy.md`, optional `refactor-playbook.md`
- **`bootstrap-state.md.tmpl` Stage E** — добавлены items для developer ergonomics scaffold (Makefile / .editorconfig / VSCode settings / verification: `make setup && make test` runs green)

### Phase 2: Trust profile differentiation (concrete dual templates)

- **`planner.md`** — секция Trust profile awareness переписана с concrete dual templates per profile (Verbose A / Mixed B / Terse C). Hard discipline для security / AP-18 / AP-19 — все profiles одинаково.
- **`coder.md`** — Trust profile awareness переписана с concrete differentiation. Lite-mode hierarchy extended:
  - `lite-mode: bugfix` (existing) — failing test + minimal fix
  - `lite-mode: small-fix` (existing) — < 200 lines + single domain + no security path
  - `lite-mode: c-fast` (NEW) — Trust profile C only, для non-bugfix small features
- **`reviewer.md`** — новая § «Step 1.5: Trust profile detection — adapt review depth». For `lite-mode: c-fast` — skip protocol-compliance-reviewer (PM trust profile C полагается на собственное reading), spawn только domain reviewer (worst-case spawn = 1 vs 2 default).

### Phase 3: Medium-priority artefacts

- **`refactor-playbook.md.tmpl`** (new) — positive guidance complementing AP-6. 9 секций: definition / pre-checklist / execution discipline / common patterns / reviewer expectations / cadence / when to refactor vs accept / AP-6 / AP-19 connect / связи. Закрывает gap «AI/dev знает что нельзя, но не как делать правильно safe refactor».
- **`dependency-policy.md.tmpl`** (new) — cadence + automerge rules. 10 секций: categories + cadence / tooling (Dependabot + Renovate configs) / automerge criteria / minor process / major process / lockfile discipline / security scanning + SLA / special cases / AP-18 connect / связи. Закрывает «Dependabot setup без policy».

### feature-spec.md.tmpl

- Lite-mode options расширены: `lite-mode: bugfix | small-fix | c-fast`

# Что НЕ изменено (правильно)

- README.md framing уже declares обе personas (PM + dev) — no change needed
- Existing AP corpus — no changes (новые AP-19/AP-20 уже в previous PRs)
- Specialized reviewers — no changes (они только что landed в PR #9)
- Foundational Stage A-C artefacts — focused on product side, dev ergonomics rightly в Stage D

# Что НЕ покрыто (deferred backlog)

Из audit findings:

- **Pricing / monetization artefact** — `pricing-model.md.tmpl` — deferred, applicability narrow
- **Performance budget guide** — кратко covered в backend guide § 1 + dev-environment.md § 8 — может требоваться отдельный artefact позже
- **Tech debt registry artefact** — currently covered через TODO(#N) convention в development-protocol § 7 catalogue + AI-linting rules; standalone artefact deferred
- **Roadmap / quarter planning artefact** — out of solo-PM scope (audit suggested defer)
- **Open-source contributor onboarding** — деferred пока template prod-runs solo

# Consolidated severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog impact

После merge:
- Template covers developer side substantially лучше (gap closed)
- Trust profile C получает legitimate opt-in lite-mode для small non-bugfix features (Persona C complaint о excessive ceremony addressed)
- Stage E поддерживает developer ergonomics scaffold (Makefile / .editorconfig / VSCode) рядом с governance scaffold (CI / hooks / branch protection)
- Refactor + dependency discipline доступны как optional Stage D artefacts

Apply в downstream product:
- Submodule bump → новые artefacts available
- Bootstrap-agent generates dev-environment.md per stack
- Stage E generates Makefile + .editorconfig + VSCode settings
- Existing projects: optional retro-fit через `docs/dev-environment-extract` PR
