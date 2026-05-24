---
pr: TBD
branch: fix/scripts-location-consistency
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A (consistency fix PR)
---

**Verdict:** approve

v0.2.0 Scope (B-4 из post-refactor audit). Закрывает defect: `_templates/scripts/*.tmpl` headers и `development-protocol.md` § 9.2 ссылались на `.ai-pm/tooling/scripts/...`, противоречиво с § 5.2 / § 11.2.4 которые правильно говорят что скрипты живут в product `scripts/`. Tooling submodule (`.ai-pm/tooling/`) — read-only, scripts генерируются из `.tmpl` на Stage E в product `scripts/`.

# Coverage

## Header fixes в .tmpl файлах

14 файлов `doc/_templates/scripts/*.tmpl` обновлены — first 10 lines (shebang + comment block) — заменено `.ai-pm/tooling/scripts/` → `scripts/`:
- `check-spec-discipline.sh.tmpl`
- `check-spec-precondition.sh.tmpl`
- `check-git-safety.sh.tmpl`
- `install-git-hooks.sh.tmpl`
- `update-bootstrap-state.sh.tmpl`
- `promote-foundation.py.tmpl`
- `template-sync-doc-migrate.py.tmpl`
- 7 файлов `auto-extract/*.{sh,py}.tmpl`

## Body fix в install-git-hooks.sh.tmpl

Lines 56-57 ссылались на `.ai-pm/tooling/scripts/check-spec-discipline` в runtime invocation — это **wrong**: после `make setup` script установлен в product `scripts/`. Заменено на `scripts/check-spec-discipline`.

## Protocol fix § 9.2

`development-protocol.md` § 9 (line 453, 477) — обновлено:
- Line 453: `.ai-pm/tooling/scripts/check-spec-discipline` → `scripts/check-spec-discipline` (product repo), explicit что генерируется на Stage E из `_templates/`
- Line 477: same fix + clarification что bootstrap-agent адаптирует под `doc_root`

Согласованно теперь с § 5.2 (existing canonical convention) и § 11.2.4 («Важно: все скрипты живут в product репозитории»).

# Cross-cutting findings

## Spec coverage

Этот PR — **B-4 из post-refactor audit**. Audit doc служит spec'ом.

## Plan adherence

Соответствует v0.2.0 Scope из плана v3 PR 3 (B-4 + High findings). High findings в отдельном PR.

## Test discipline

N/A — это template content fix, не code change. Verification — grep clean на `.ai-pm/tooling/scripts/` в production scope (template/protocol).

## Security / architecture

- AP-17 clean
- AP-12: техтермы wrapped

## Code hygiene

- 16 файлов изменено (~30 строк)
- Semantic preservation: scripts targeting `scripts/` (product) — единая convention

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (template defect fix)
- ✅ AP-3: scope утверждён через утверждённый план v3
- ✅ AP-4: spec coverage — audit doc
- ✅ AP-6: scope без deviation
- ✅ AP-12: clean
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (scripts path consistency)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Out of scope

- B-1 mode renaming sweep — PR #28
- B-2 + B-3 feature artifacts — PR #29
- High findings batch — next PR
- Silent-break gaps 1-3 + AP-24 + size gate — отдельные PR'ы
