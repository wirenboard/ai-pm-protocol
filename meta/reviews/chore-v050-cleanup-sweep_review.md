---
pr: TBD
branch: chore/v050-cleanup-sweep
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

v0.5.0 post-tag cleanup sweep. Documentation reflects current reality (per operator feedback): no historical «упразднено в v0.3.0» / «merged артефакт (v0.3.0)» notes — это в CHANGELOG, не в active docs.

# Coverage

## README.md
- Убраны «§ 1 / § 2 (включает)» mentions из Stage A/B/D artifact list
- Убран «Stage C упразднён в v0.3.0» note
- «v0.4.0+» tags removed from discipline-advisor / Advisor preset / spec gates
- Stage E description simplified
- PM/Developer pain framing preserved

## doc/development-protocol.md
- § 4 header: «Пять stages (v0.3.0: Stage C упразднён, fold в Stage D)» → «Пять stages»
- Stage C explanation paragraph removed
- File structure block updated (tech-stack.md / positioning / ui-style-guide-base + per-kind / legal / maintenance-playbook вместо topology.md / competitive-analysis / brand-voice / legal-brief / dependency-policy / refactor-playbook)
- Stage E checklist: tech-stack.md instead of topology.md, legal.md instead of legal-brief.md, удалены competitive-analysis + brand-voice (merged)
- Stage F structural read-pass: Stage A-C → Stage A/B/D, topology.md → tech-stack.md
- adr-only-from-plan catalogue check: «Stage C bootstrap commit» → «Stage D bootstrap commit для foundational ADRs»
- Review cadence: «positioning / brand-voice» → «positioning / ui-style-guide-base.md § brand voice»

## doc/anti-patterns.md
- Stage A-C → Stage A/B/D refs
- topology.md → tech-stack.md
- legal-brief → legal references

## doc/_templates/ (active templates)

Cross-refs обновлены:
- `strategic-frame.md.tmpl`: legal-brief.md → legal.md
- `vision.md.tmpl`: competitive-analysis.md → positioning.md § 1
- `dev-environment.md.tmpl`: dependency-policy.md → maintenance-playbook.md Part A, topology.md → tech-stack.md
- `0000-adr-template.md.tmpl`: topology.md → tech-stack.md
- `database-design-base.md.tmpl`: topology.md → tech-stack.md
- `feature-spec.md.tmpl`: competitive-analysis.md → positioning.md § 1 (3 mentions в Competitive UX scan section)
- `ui-style-guide-base.md.tmpl`: brand-voice.md → § 2 (self-reference внутри документа)
- `bootstrap-state.md.tmpl`: удалены checklist items competitive-analysis / brand-voice (merged); legal-frame → legal

Historical notes stripped (per operator: documentation reflects current reality, история в CHANGELOG):
- `positioning.md.tmpl`: «Merged артефакт (v0.3.0): absorbed competitive analysis...» → «Содержит две секции: § 1 competitive landscape + § 2 positioning»
- `ui-style-guide-base.md.tmpl`: «v0.3.0: absorbed раньше отдельный `brand-voice.md`...» → удалено
- `maintenance-playbook.md.tmpl`: «Merged артефакт (v0.3.0): combines ранее отдельные...» → «Maintainability playbook: dependency updates (Part A) + refactor discipline (Part B)»
- `tech-stack.md.tmpl`: «Merged артефакт (v0.3.0)... Stage C — упразднён» → «Technical foundation: stack choice + topology + db_kind references + deployment topology»
- `legal.md.tmpl`: «Merged артефакт (v0.3.0): combines ранее предполагавшийся...» → «Legal foundation: общая legal rama (§ 1) + actionable brief (§ 2)»

## doc/_templates/*.md.tmpl (deprecated redirect stubs)

`skip_eligibility:` frontmatter stripped из 6 stubs (`competitive-analysis` / `brand-voice` / `legal-brief` / `dependency-policy` / `refactor-playbook` / `topology`). Эти артефакты deprecated в v0.3.0 — skip_eligibility metadata (от v0.4.0 mass-add) ошибочно добавлено к ним; redirect stubs не active artifacts, skip rules не нужны.

# Cross-cutting findings

## Spec coverage

Cleanup PR (chore type). Closes operator feedback session 2026-05-25 «не осталось ли устаревших _templates и лишнего в протоколе? в антипаттернах дублей и сложностей?» + «нафига ты в ридми то затащил что было упразднено, это место в чейнджлоге; ридми всегда отражает реальность».

**Findings про дубли в anti-patterns** — false alarm. Что выглядит как дубли (AP-1↔AP-24 / AP-13↔AP-14 / AP-19↔AP-20 / AP-3↔AP-22 / AP-5↔AP-23) — это intentional complementary pairs. Documented relationship в AP-24 explicitly.

**Длинные AP** (>50 LOC: AP-14 / AP-12 / AP-18 / AP-15 / AP-16) — potential tightening backlog, не блокирует HeartVault.

## Test discipline

N/A — docs cleanup. Verification: grep clean (no remaining `competitive-analysis` / `brand-voice` / `legal-brief` / `legal-frame` / `dependency-policy` / `refactor-playbook` / `topology.md` / Stage C / Stage A-C / Stage A-E references в active docs).

Spot-check passed:
- README: только current state, no «упразднено в vX.Y» / «v0.3.0+» / «v0.4.0+» tags
- development-protocol.md: file structure + Stage table + checklist all current
- _templates/ active artifacts: cross-refs all point к current merged docs
- _templates/ redirect stubs: clean (no skip_eligibility, only redirect content)

## Security / architecture

- AP-12 clean (техтермы wrapped, no new anglicisms introduced)
- AP-17 clean
- AP-1 / AP-24 relationship preserved (Stage D bootstrap commit ADR exception preserved in catalogue)

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (docs cleanup only)
- ✅ AP-3: scope утверждён operator feedback session
- ✅ AP-12: clean
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (post-v0.5.0 cleanup — current reality в docs)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 1 — `extract-topology.py.tmpl` + `extract-all.sh.tmpl` всё ещё generate intermediate `topology.md` output (operator integrates manually в `tech-stack.md` § 2 на Stage D). Not blocking — это operational implementation, не user-facing artifact. Future enhancement: scripts могут generate directly section content для `tech-stack.md` § 2.

# Out of scope

- AP-14 / AP-12 / AP-18 / AP-15 / AP-16 tightening — backlog (не блокирует HeartVault)
- Redirect stubs eventual removal — нужны для `template-sync-doc-migrate.py` detection of existing legacy projects на v0.X
- Tag v0.5.1 — этот cleanup можно tag'нуть как PATCH (docs cleanup), но v0.5.0 уже tagged; этот cleanup идёт как post-tag хвост в Unreleased section
