---
pr: TBD
branch: feat/gap2-test-fudging
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A (v0.2.0 fix wave PR — coder-style implementation)
---

**Verdict:** approve

v0.2.0 fix wave — закрывает **gap 2** из `meta/audits/2026-05-24_silent-break-gaps.md`: agent ослабляет existing test assertions под свои выдумки (`toBe(100)` → `toBeGreaterThan(50)`), runner зелёный, никто не заметил. Failure mode — silent break в test surface, самый опасный класс регрессий, потому что framework reports «всё хорошо», а behaviour деградировало.

# Coverage

## Spec ↔ implementation

Operator brief:

1. CI check `test-assertion-weakening` в `doc/_templates/scripts/check-spec-discipline.sh.tmpl` — **готово** (lines 319-383).
2. AP-23 в `doc/anti-patterns.md` с full структурой (Что нельзя / Почему / Mode / Как поступать / Use cases / Hard floor / Cross-references) — **готово** (после AP-22 по convention descending-order).
3. Catalogue row в `doc/development-protocol.md` § 9.1 — **готово** (после `pr-ordering-for-multi-domain`).
4. `requires-ADR` paradigm, не hard block — **готово** (Mode-секция AP-23 это явно фиксирует, compatible с AP-22).
5. Detect через `git diff --diff-filter=M` (coarse, robust) — **готово**. Semgrep fine-grained deferred на enhancement позже, как plan v3 § Open question 1a и предписывал.

## Design choices

**Coarse detection (git diff)**, не semgrep:
- Robust для всех stack'ов через regex по file extensions.
- Не требует extra dependency (semgrep heavy для template'а).
- Trade-off: пропустит case'ы где assertion ослаблен внутри test, который **также** добавляет новый assertion в том же файле (modified ≠ pure addition). Это **acceptable miss** — добавление test'а одновременно с loosening — паттерн редкий и обычно tied с rework mode (всё равно ADR нужен).

**Patterns coverage** (file extensions):
- `*_test.{go,py}` — Go, pytest
- `test_*.py` — pytest alt naming
- `*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs}` — JS / TS / React (jest / vitest)
- `*_spec.rb` — RSpec
- `*Test.{java,kt}` — JUnit / kotlin-test
- `*Tests.cs` — .NET
- `*.feature` — Cucumber / Gherkin

Не покрыто: Elixir (`_test.exs`), Rust (tests usually inline в `mod tests`), Lua. Можно добавить отдельным PR через operator request — но typical stack'и из template recipe-cache (Go / Python / TypeScript) полностью покрыты.

**Pure additions skip** через `--diff-filter=M`: новые test-файлы (status `A`) и renames (`R`) не триггерят. Adding test = OK без декларации (это **поощряется**).

**Override modes:**
- `ADR-NNNN` regex `[0-9]{4}` — 4-digit standard, matches и existing ADR conventions в repo.
- `[test-modify-override: <reason>]` — explicit marker для trivial cases (test data refresh, helper rename). Marker visible в git log forever — audit trail без heavy ADR ceremony.

**Hard floor** для security-touching кода: marker недостаточен, ADR обязателен. Это уже declared в AP-23 prose; enforcement сейчас на reviewer-agent (Step 7) — он читает diff и эскалирует если modified test в security path был приклеен только override marker'ом. Stronger CI-level enforcement (path-based pattern matching) — opt-in enhancement позже.

## --staged-only path

Добавлен в `case` dispatcher: при `--staged-only` (pre-commit hook calling) экспортируется `STAGED_ONLY=1`, запускается **только** `check_test_assertion_weakening` (другие checks работают по filesystem, не имеют staged-aware версии — `STAGED_ONLY` flag — будущее расширение). Это means pre-commit fast path для нового gate работает, не блокируя на heavy checks.

В `--staged-only` режиме `diff_args=--cached` (index vs HEAD); commit message читается из `.git/COMMIT_EDITMSG` если он есть (стандартная pre-commit-hook convention), иначе fallback на `git log -1`.

## Testing

Manual проверка не запускалась (template-level PR, ни test fixtures ни runnable scripts в repo для самого template'а). Sanity checks:

- `bash -n` syntax check — clean.
- Regex против sample patterns (см. operator brief) — все 6 test-file naming conventions match.
- Edge case: empty `modified_tests` → log_ok early return. Edge case: HEAD~1 не существует (initial commit) → log_ok early return.

## AP-12 anglicism check

Wrap'нул tech-terms в backticks (test-runner output, file patterns, regex `ADR-NNNN`, marker syntax `[test-modify-override: ...]`). Free-form prose в AP-23 — на русском, общие слова русские (декларация, ослабление, обман, выдумки, тривиальные). Англицизмы оставлены только для устоявшегося vocabulary (assertion, mock, refactor, coverage, trade-off, fork, override, marker — всё либо tech-vocabulary либо в backticks при первой встрече).

## AP-17 (downstream names)

Никаких product-specific имён в AP-23 или коде. Use case examples используют generic `user.amount`, `discount` логику, `user.email` fixtures — всё neutral.

## Mode terminology (named modes only)

Использованы только `rework`, `bug-fix`, `lite-mode: bugfix` — никаких «Mode 1/2/3». Aligned with B-1 sweep'ом.

# Не сделано (deferred per плану v3)

- Semgrep fine-grained pattern detection (loosened comparators, removed assertions, new mock'и) — defer на v0.3.0 если coarse gate окажется недостаточным. Coarse достаточно для operator pain зафиксированного в audit'е.
- Path-based hard-floor enforcement для security-touching кода в CI (currently rests on reviewer-agent vigilance) — opt-in enhancement позже когда `security_paths:` поле появится в state file.

# Cross-cutting verification

- AP-22 parallel — declared trade-off через explicit reason, identical paradigm. AP-23 cross-references AP-22 в "Cross-references" секции, как brief'ом и просили.
- AP-1 — ADR пишется реактивно (при architectural fork), не upfront. AP-23 говорит явно «ADR при test-assertion change пишется реактивно, как при любом architectural fork» — compatible.
- AP-5 — tests-first. AP-23 эскалирует к AP-5: если weakening нужен, скорее всего tests-first был нарушен (нужно failing-test-first PR перед production code change). Educational pointer, не enforcement.
- AP-6 — no silent deviation. AP-23 frames assertion-weakening exactly as silent deviation в test surface.
- Gap 1 (spec-test-mapping) — orthogonal: gap 1 защищает от **missing** test'а для scenario; gap 2 защищает от **weakened existing** test'а. Independent gates, no overlap.

# Verdict justification

Implementation matches operator brief полностью. Coarse-detection paradigm защищает от reported pain (`toBe(100)` → `toBeGreaterThan(50)`) при минимальной dependency footprint. Declared trade-off pattern (AP-22-style) keeps gate flexible — legitimate test changes proceed через ADR / marker, silent fudging blocked.

AP-23 prose даёт reviewer + agent material для educational pointer'а (use case examples — concrete, не abstract). Hard floor для security сохраняет critical-path discipline.

Готово к merge после operator approval. PR — automation-friendly: pre-commit и CI gates обновятся при следующем `pnpm install` в продуктах с install'ом template'а.
