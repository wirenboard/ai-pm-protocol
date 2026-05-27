# Frontmatter convention для feature artifacts

On-demand reference для секции «Pointers» в `CLAUDE.md`. Читай при создании / обновлении `<topic>_spec.md` / `_plan.md` / `_review.md`.

## Spec frontmatter (canonical schema)

Каждый `<topic>_spec.md` имеет frontmatter:

```yaml
---
topic: auth-signup
mode: feature  # или: new-product (если первая фича) | rework
lite-mode: no  # или: yes, bugfix, small-fix — означает упрощённый workflow
version: 1  # spec.v1 (default); spec.v2 / v3 для rework mode. См. AP-21 ограничение на бесконечные итерации.
created: YYYY-MM-DD
spec_approved: YYYY-MM-DD  # operator-marker; пусто пока не approved
plan_approved: YYYY-MM-DD
acceptance: pending | ok | failed
merged: no | yes (PR-url)
review_url: ...
# OPTIONAL — Layer 3 cross-feature anti-drift (AP-31 / AP-33)
last_modified: YYYY-MM-DD  # bumped при bug fix / refactor; fallback на spec_approved для staleness check
affects_features: [topic1, topic2]  # cross-feature scope hint (другие feature'и, чьи invariants spec затрагивает)
deprecated: YYYY-MM-DD  # если feature retired
---
```

## Layer 3 optional fields (AP-31 / AP-33)

- **`last_modified:`** — `YYYY-MM-DD` дата последнего behaviour-changing edit'а. Bumped при bug fix / refactor / spec update. AP-31 staleness check (`check-spec-discipline.sh --check spec-staleness`) сравнивает с git log timestamps на implied code paths. Fallback на `spec_approved:` если поле отсутствует. Configurable threshold: `staleness_days:` в `.ai-pm/.bootstrap-state.md` (default 30).
- **`affects_features:`** — list topic'ов других feature'ей, чьи invariants spec может затронуть. Populated при `topology_impact: yes` или явном shared component. Optional — отсутствие = AP-33 linter fall back на pairwise scope (O(N²) cross-check всех specs). При populated scope'ит до targeted O(N) check. См. AP-33 в `doc/anti-patterns/AP-33.md`.
- **`deprecated:`** — `YYYY-MM-DD` если feature retired. Сопровождается reason + `replacement:` reference в body. AP-31 staleness не triggers'ит для deprecated spec'ов.

Bootstrap-agent + main session обновляют эти поля по мере прохождения Step'ов. Это даёт programmatic state без отдельного state-file per feature.

## Spec versioning (AP-21)

`version: 1` для new spec'а; для rework mode — увеличивается на каждую следующую iteration (`spec.v2.md` → `version: 2`, `spec.v3.md` → `version: 3`).

При `version: 3+` reviewer **обязан** через AskUserQuestion подтвердить осознанность: «3-я iteration — адресует ли findings v2? Или split / abort?». Это exit condition против бесконечного цикла rework'ов (см. AP-21).
