---
pr: TBD
branch: feat/v050-personas-touch-and-journeys-rewrite
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

v0.5.0 Path A (revised после rejected outcome-based attempt). PM/Developer pain framing preserved (Core product thesis). Outdated terminology обновлено под v0.4.0 reality.

# Coverage

## personas.md — 3 minor touch-ups

- Persona A: добавлено `template-sync` mode mention (periodic bump'ы template'а)
- Persona C: добавлено `bug-fix` mode mention (она ж primary user lite ceremony для small changes)
- Resolved decision 1 (Trust profile): init вопросы updated — `Mode + Integration + Advisor preset (v0.4.0+)`

**Структура и personas — не трогаются** (per operator direction «прекрасны, оставить»).

## user-journeys.md — full rewrite

Старая версия имела 3 journeys (new-product / feature / rework) + cross-journey patterns. Outdated terminology:
- 6 stages (теперь 5)
- competitive-analysis / brand-voice / legal-frame / legal-brief / topology / dependency-policy / refactor-playbook standalone (merged в v0.3.0)
- Старый «feature mode для existing repo» framing (теперь legacy adoption — separate journey)

Новая версия — **7 journeys**:
1. `new-product` — обновлён под 5 stages, current artifact names, добавлен advisor_preset init, Stage E 1 checkpoint + bootstrap-verify.sh
2. `feature` — теперь чётко для template-native проектов; добавлены v0.2.0+ CI gates, reviewer size gate, verdict-gate, lazy loading (v0.3.0), advisor opt-in (v0.4.0)
3. `rework` — добавлен advisor invocation на Step 2, AP-21 exit condition note
4. `bug-fix` (NEW) — lite ceremony journey, hard floor для security
5. `template-sync` (NEW) — bump template version, 4 phases (template files / schema / docs migration с verification / PR)
6. **Legacy adoption** (NEW, replaces старый «feature в existing repo») — 3-choice entry с Quick auto / Manual staged / Skip + skip_eligibility framework (v0.4.0)
7. **Architecture overview** (NEW) — read-only Tier 0 scan keyword routing

Success metrics обновлены per current modes:
- new-product ≤ 4 сессии
- feature ≤ 2 сессии
- rework ≤ 3 сессии
- bug-fix ≤ 1 сессия
- template-sync ≤ 1-2 сессии
- Legacy Quick auto ≤ 1 сессия
- Legacy Manual staged ≤ 2-4 сессии
- Architecture overview 5-15 минут

Resolved decisions обновлены:
- decision 4 (Recipe staleness): **deferred в v0.X** per operator discussion 2026-05-25 (рецепты обновляем руками); recipe coverage остаётся sparse (Go/Python/TS only)
- decision 5 (3-choice legacy entry): documented как v0.1.0+ resolved
- decision 6 (Conditional skip per artifact): documented как v0.4.0+ resolved

## README.md — minor sweep под v0.4.0 reality

**PM/Developer pain framing PRESERVED** (Core product thesis — это central differentiator, оператор явно requested keep).

Updates:
- «шесть стадий» → «пять стадий»; Stage C упразднён note
- Stage A artifacts: competitive-analysis + brand-voice как standalone → merged (`positioning.md` § 1, `ui-style-guide-base.md` § 2)
- Stage B artifacts: legal-frame + legal-brief → `legal.md` (§ 1 frame + § 2 brief)
- Stage C row removed (упразднён в v0.3.0)
- Stage D artifacts: dependency-policy + refactor-playbook → `maintenance-playbook.md`; topology → fold в `tech-stack.md`
- Stage E: 1 checkpoint `bootstrap-verify.sh passed` + bootstrap-verify.sh script
- Stage range refs: A-D → A/B/D; A-E → A/B/D/E; A-C → A/B/D
- Bidirectional learning line: Stage C topology → Stage D tech-stack reference
- Init flow: добавлен Advisor preset (v0.4.0)
- Subagents: добавлен `discipline-advisor` с описанием hybrid floor + smart layer + PoC gate
- Spec/use-case linting catalogue: добавлены v0.2.0+ gates (spec-test-mapping / test-assertion-weakening / regression-coverage / adr-auto-extraction)

**Структура README не trogaeтся** — все sections preserved.

# Cross-cutting findings

## Spec coverage

Task #64 v0.5.0 Path A scope: outcome-based positioning + pain table + learning effect.

**Deviation от plan v3 explicit:**
- Outcome-based positioning AS HERO REPLACEMENT — **отвергнут** оператором (per memory `feedback_readme_v050_rejected`). Core product thesis (PM/Developer symmetric pain) preserved.
- Pain table — отвергнут как central section (operator: «PM в компании 100 человек тоже так себе заявление»). Pain framing встроен через original Core product thesis structure.
- Learning effect — sustain как был в original README (через «Bidirectional learning» paragraph).

Это interpretation v0.5.0 Path A через **persona-language** per feedback memory `feedback_docs_reflect_persona_needs`, не через marketing tagline.

## Plan adherence

v0.5.0 wave **complete** после этого PR. Готов к tag v0.5.0.

Concerning items из plan review:
- ✅ All v0.5.0 concerning items addressed (validation gate, AP-24, lazy loading, skip framework — closed в v0.2.0/v0.3.0/v0.4.0)
- ⏳ Downstream feedback loop (concerning missing-4) — будет в task #65 HeartVault first prod-run

## Test discipline

N/A — documentation rewrite. Verification: spot-check на dimensional coverage preservation (each of 6 quality dimensions has dedicated artifact mentioned).

## Security / architecture

- AP-12: техтермы wrapped в backticks
- AP-17 clean — нет product name mentions
- AP-15 preserved: ui-style-guide-base.md remains primary UI artifact

## Code hygiene

3 файла изменены:
- README.md: ~15 lines updated (minor sweep)
- doc/personas.md: 3 minor edits
- doc/user-journeys.md: full rewrite (337 lines, +211 vs предыдущая 195)

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (documentation refresh)
- ✅ AP-3: scope обсуждён с оператором (validation conversation 2026-05-25)
- ✅ AP-4: spec coverage — план v3 + memory feedback
- ✅ AP-6: scope без silent deviation (deviation от plan v3 outcome-based hero — explicit declared в этом review)
- ✅ AP-7: foundational docs (personas, user-journeys, README) — единый logical PR (related refresh)
- ✅ AP-12: clean
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (v0.5.0 final wave — personas/journeys/README refresh)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Out of scope для этого PR

- CHANGELOG v0.5.0 entry — добавлю отдельным commit перед tag (включает explicit note что Path A interpretation persona-language, не outcome marketing per operator feedback)
- Tag v0.5.0 — после merge этого PR
- HeartVault first prod-run (task #65) — следующая wave, отдельная сессия
