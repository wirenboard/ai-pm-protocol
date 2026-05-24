---
topic: session-resume-state
mode: feature
lite-mode: small-fix
created: 2026-05-24
spec_approved: 2026-05-24
plan_approved: 2026-05-24
acceptance: pending
merged: no
review_url:
pr_ordering: null
template_version_applied: v0.6.0
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: no
topology_impact: yes
---

# Session-resume state

**Stage E artifact, Step 1.** Status: draft.

## Контекст

Новая AI-сессия не знает «где мы». Все важные **решения** уже фиксированы в `_spec.md` / `_plan.md` / ADR — это не теряется. Что теряется — это маленький **флоу-указатель**: на какой ветке, на каком шаге, есть ли работающий sub-agent. Без него каждый restart требует scan'а веток / PR'ов / последних коммитов чтобы войти в курс.

Хотим лёгкий файлик, который пишется по ходу и читается на старте. Если что-то потеряется — не катастрофа, пройдём микрошаг заново.

## User stories

- **As any operator**, я хочу чтобы AI на старте сессии увидел «ты на feature/X, Step 4, planner запущен» — без моего пересказа.
- **As AI**, я хочу один auto-discoverable файл с координатами, чтобы не сканировать репо в первые 30 секунд каждой сессии.

## Сценарии (Gherkin)

```gherkin
Scenario: Multi-day resume
  Given оператор работал на feature/F-01, остановился на Step 4
  When через 2 дня запускает claude в репе
  Then SessionStart hook печатает содержимое state-файла
  And AI видит: topic=F-01, step=4, last_update=<timestamp>

Scenario: Sub-agent in flight
  Given AI запустил planner-agent, main session обнулилась
  When новая session старт
  Then state-файл содержит pending_agent: planner (started at T, expected output: doc/features/F-01_plan.md)
  And AI проверяет существование output'а — если есть, читает; если нет, ждёт / перезапускает

Scenario: Branch switch
  Given AI работал на feature/F-01
  When оператор переключается на feature/F-02
  Then state обновляется при следующем write/edit в F-02 (через PostToolUse hook)
```

### Edge cases

- **State устарел / противоречит git?** State — это hint, git — source of truth. AI обновляет state, не наоборот.
- **State потерян (machine switch, не sync'нулся)?** AI восстанавливает через `git branch --show-current` + `gh pr list` + scan'ом активных feature-файлов. Микрошаг повторяется при необходимости.

## Дизайн

**Файл:** `.ai-pm/.session-state.md` (gitignored, local-only).

Один файл на репо, потому что:
- Per-topic файлы создают noise в release diff и требуют cleanup при merge
- Gitignore решает release-conflict вопрос целиком
- «Multi-machine sync» проблему оператор объявил приемлемой — потеря = микрошаг

**Минимальное содержимое:**

```markdown
# Session state (local, gitignored)

current_topic: F-01
current_branch: feature/F-01
current_step: 4 (coder)
last_update: 2026-05-24T22:15:00Z

pending_agents:
  - role: planner
    started_at: 2026-05-24T21:00:00Z
    expected_output: doc/features/F-01_plan.md
    notes: "extracting 5 ADRs"

blocker: waiting for operator-acceptance

active_pr_series:
  - closed: [#13, #14, #15]
  - open: [#16]
  - queued: [#17, #18, #19, #20]
```

Все поля опциональны кроме `current_topic` / `current_branch` / `current_step` / `last_update`. Если ничего интересного — файл может быть короче.

**Обновление:**

- **PostToolUse hook** (`Write|Edit`) — после write в `doc/features/<topic>_spec.md` / `_plan.md` / `_review.md` обновляет `current_step` и `last_update`. Скрипт сам понимает шаг по факту изменённого файла.
- **Operator trigger** — оператор может попросить «зафиксируй state» явно, AI обновит руками. Для редких случаев когда hook не сработал (например, переключение веток без write'а).
- **SessionStart hook** — печатает текущее содержимое в первые секунды сессии. Если файла нет — печатает «session state file отсутствует, AI восстановит по git/gh».

## Что НЕ покрываем

Сознательно out-of-scope:
- **Chat-derived решения** — они и так должны попадать в `_spec.md` / `_plan.md` / ADR через нормальный флоу. Дублировать в state-файл не нужно.
- **Audit trail** — `git log` и commit history достаточны.
- **Multi-machine sync** — gitignored файл по дизайну local-only. Микрошаг при пересадке — приемлем.
- **Dashboards / UI** — нет.
- **LLM-based decision summarisation** — не protocol feature.

## NFR

- AI читает state за < 5 секунд (один Read call на файл < 2 KB)
- SessionStart hook не должен задерживать сессию > 1 секунды
- Update в hook не должен блокировать Write/Edit (быстрый skip если файл не feature-related)
- Robustness vs git: state расходится с git — git wins, state перезаписывается

## Impact

- `topology_impact: yes` — новый файл `.ai-pm/.session-state.md`, новый PostToolUse hook поведение, новый SessionStart action.
- Остальные impacts `no`.

## Принятые решения

**Формат файла — markdown с YAML-блоком в body.** Соответствует существующей конвенции `.bootstrap-state.md.tmpl`: human-readable через `cat` в SessionStart hook, парсится тем же AWK-подходом что и другие state-файлы (`check-skip-reprompts.sh` уже умеет).

**Определение step'а — эвристика по имени файла.** Hook сам определяет шаг по тому что было записано:

| Файл | Step |
|---|---|
| `doc/features/<topic>_spec.md` | 1 (spec) |
| `doc/features/<topic>_plan.md` | 2 (plan) |
| Code in `apps/` / `packages/` / `src/` / `lib/` | 4 (coder) |
| `doc/features/<topic>_review.md` или `.ai-pm/.reviews/*.json` | 7 (review) |

Эвристика может ошибаться — оператор может override'нуть явной командой («запиши step 6 acceptance»). Соответствует подходу `check-security-floor.sh` / `check-spec-discipline.sh` — детерминированная эвристика по умолчанию, override через explicit operator action.

## Scope

**In:**
- Файл `.ai-pm/.session-state.md` (gitignored)
- PostToolUse hook update script (`scripts/update-session-state.sh`)
- SessionStart hook print
- CLAUDE.md строчка «при старте читай .ai-pm/.session-state.md если есть»
- `.gitignore` запись

**Out:**
- Chat-decision capture
- Multi-machine sync mechanism
- Per-topic файлы
- Cross-topic dashboards
