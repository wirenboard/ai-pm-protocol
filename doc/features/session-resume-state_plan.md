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

# Session-resume state — Implementation Plan

**Stage E artifact, Step 2.** Trust profile A, verbose template с обучающим слоем.

---

## TL;DR (один параграф)

Добавляем два маленьких bash-скрипта (`update-session-state.sh` для PostToolUse, `print-session-state.sh` для SessionStart) и gitignored markdown-файл `.ai-pm/.session-state.md` с YAML-блоком в body. Hook эвристически определяет «где мы во флоу» по имени записанного файла и идемпотентно перезаписывает state. SessionStart cat'ает state в первые секунды. Параллельная регистрация с уже существующими `update-bootstrap-state.sh` / `check-skip-reprompts.sh` через массивы hooks в `settings.json.tmpl`. Никаких architectural forks — это plumbing-уровень, lite-mode small-fix.

---

## Соответствие spec'у

| Scenario из spec'а | Имплементация |
|---|---|
| **Multi-day resume**: оператор вернулся через 2 дня, SessionStart hook печатает state | `print-session-state.sh` зарегистрирован в `settings.json.tmpl` под `SessionStart` параллельно с `check-skip-reprompts.sh`. `cat`'ает `.ai-pm/.session-state.md` в stderr (Claude видит как session bootstrap), exit 0. Если файла нет — печатает «session state отсутствует, AI восстановит через `git branch --show-current` + `gh pr list` + scan `<doc_root>/features/`». |
| **Sub-agent in flight**: planner запущен, main session обнулилась | Schema state-файла включает опциональный массив `pending_agents` (role / started_at / expected_output / notes). Update hook **не пишет** эти поля автоматически — это явно operator/main-agent-driven (см. § Архитектура → «What hook does not infer»). SessionStart hook просто печатает существующее содержимое. |
| **Branch switch**: оператор переключился feature/F-01 → F-02 | На первом же Write/Edit в новой ветке `update-session-state.sh` определяет ветку через `git branch --show-current`, видит несовпадение с `current_branch:` в state, перезаписывает (idempotent overwrite). Эвристика step'а пересчитывается заново по имени записанного файла. |
| **Edge: state устарел / противоречит git** | State — hint, git — truth. Hook **всегда** перезаписывает state из текущей реальности (не merge'ит). Если оператор хочет ручной override — пишет в файл руками или просит AI («запиши step=6 acceptance»). |
| **Edge: state потерян** | SessionStart hook fallback message сообщает AI что делать (git/gh recovery). Микрошаг = OK per spec. |

---

## Архитектурный подход

### Высокоуровневая декомпозиция

Два независимых артефакта + два места wiring'а:

```
doc/_templates/scripts/
  update-session-state.sh.tmpl   ← новый, PostToolUse handler
  print-session-state.sh.tmpl    ← новый, SessionStart handler

doc/_templates/settings.json.tmpl ← extend PostToolUse + SessionStart массивы
doc/_templates/CLAUDE.md.tmpl     ← одна строка про session state file
doc/_templates/scripts/install-git-hooks.sh.tmpl  ← gitignore wiring
                                      (или новое место — см. § "Куда писать .gitignore")
```

State-файл живёт на product-side: `.ai-pm/.session-state.md`. Gitignored — никогда не попадает в коммит.

### Почему именно такая декомпозиция

**Два скрипта, не один.** Соблазн «один скрипт с `--mode=update|print`» отвергнут потому что:

- PostToolUse и SessionStart — два разных hook lifecycle'а с разным contract'ом (один читает stdin JSON, другой не получает ничего полезного). Mixing их в одном файле требует argument dispatch'а в каждом invocation — добавляет complexity без пользы.
- Текущая convention (`update-bootstrap-state.sh` vs `check-skip-reprompts.sh`) уже разделяет update'еры и printer'ы в отдельные файлы — следуем pattern'у.
- Smoke-test на каждый скрипт пишется проще (один stdin shape, одна exit path).

**Параллельная регистрация в settings.json, не замена существующих hook'ов.** PostToolUse в Claude Code hook API позволяет несколько hook entries с одинаковым matcher'ом — все выполнятся sequentially. То же для SessionStart. Это даёт **независимость**: если новый hook fail'нет, старый продолжит работать (и наоборот). Альтернатива «один мега-скрипт вызывающий обе routine» создаёт coupling и worse failure mode — fail в одной части прячет вторую.

**Обучающий момент про PostToolUse non-blocking semantics.** В Claude Code hook API: `PreToolUse` exit≠0 блокирует tool, `PostToolUse` exit≠0 — informational only, не откатит уже выполненный Write. Поэтому в `update-session-state.sh` мы **всегда** `exit 0`, даже на ошибках парсинга stdin. Это критично потому что failed PostToolUse на каждом Write раздражает оператора warning'ами без полезного эффекта.

### Эвристика определения step'а

| Pattern (regex применяется к file_path) | Step | Логика |
|---|---|---|
| `(\.ai-pm/)?doc/features/[^/]+_spec\.md$` | 1 | Spec writing |
| `(\.ai-pm/)?doc/features/[^/]+_plan\.md$` | 2 | Plan writing |
| `(\.ai-pm/)?doc/features/[^/]+_review\.md$` | 7 | Review writing |
| `\.ai-pm/\.reviews/.*\.json$` | 7 | Lightweight review trail (chore/docs paths) |
| `(\.ai-pm/)?doc/architecture-decisions/.*\.md$` | 2 | ADR создаётся в Step 2 per AP-1 |
| `^(apps|packages|src|lib|services|cmd|internal)/` | 4 | Code writing |
| `(\.ai-pm/)?doc/features/[^/]+_spec\.v\d+\.md$` | 6 (rework) | Versioned spec = rework cycle |
| `(\.ai-pm/)?doc/features/[^/]+_plan\.v\d+\.md$` | 6 (rework) | Versioned plan = rework cycle |
| Иначе | skip update | Не feature-related write, не трогаем state |

**Topic extraction:** из `<topic>_spec.md` / `_plan.md` / `_review.md` — basename до первого `_`. Из code path — current_topic не меняется (берём существующий из state). Если state пустой и пишется код вне feature/spec context'а — записываем `current_topic: (unknown)`.

**Branch extraction:** `git branch --show-current` или fallback `git rev-parse --abbrev-ref HEAD`. Если не git repo — skip entirely.

**Обучающий момент про эвристику vs парсинг state'а.** Альтернатива «парсить spec frontmatter чтобы узнать что это за этап» отвергнута: эвристика по имени файла даёт детерминированный результат за < 50ms без YAML-parser dependency. Pattern уже использован в `check-security-floor.sh` / `check-spec-discipline.sh` — это canonical convention для hook scripts. Парсинг frontmatter добавляет fragility (если spec ещё не имеет полного frontmatter'а — fail'ит).

### What hook does not infer (важно для spec scenario «sub-agent in flight»)

Скрипт **не пишет** автоматически:

- `pending_agents:` — только operator/main-agent явно («запиши что planner запущен»)
- `blocker:` — только operator/main-agent
- `active_pr_series:` — только operator/main-agent
- `notes:` под pending_agents — только operator/main-agent

Эти поля — semantic state который hook определить эвристически не может. Hook отвечает за **mechanical** поля: `current_topic`, `current_branch`, `current_step`, `last_update`. Это разделение явно документировано в комментариях скрипта и в template-файле state'а (см. ниже).

**Обучающий момент про границы автоматизации.** Соблазн «hook увидел что AI Write'нул `<topic>_plan.md` → значит planner закончил → удалю `pending_agents` entry» отвергнут. Это inference которая может оказаться wrong (planner мог быть chained и работает дальше). Лучше slightly stale state чем wrong state. Per spec edge case: state — hint, не contract.

### Структура state-файла

`.ai-pm/.session-state.md` — markdown с YAML-блоком в body (НЕ frontmatter):

```markdown
# Session state (local, gitignored)

_Auto-managed by scripts/update-session-state.sh (PostToolUse hook).
Manual edits OK — hook идемпотентно перезаписывает только mechanical поля._

current_topic: session-resume-state
current_branch: feature/session-resume-state
current_step: 2 (plan)
last_update: 2026-05-24T22:15:00Z

# === Опциональные поля (operator/main-agent-driven, hook не трогает) ===

pending_agents:
  - role: planner
    started_at: 2026-05-24T21:00:00Z
    expected_output: doc/features/session-resume-state_plan.md
    notes: ""

blocker:

active_pr_series:
  closed: []
  open: []
  queued: []
```

**Почему markdown + YAML-в-body, не pure YAML.** Соответствует existing convention (`.bootstrap-state.md.tmpl` — markdown с YAML-блоком). SessionStart hook просто `cat`'ает файл — markdown читается человеком в терминале нормально, YAML-блок Claude парсит через тот же AWK-подход что и `check-skip-reprompts.sh` (если когда-то понадобится — для current ticket не нужно).

**Обучающий момент про state schema discipline.** Делим поля на **mechanical** (hook автоматически перезаписывает) и **semantic** (только human/main-agent). Это явное разделение **в комментариях файла**, чтобы оператор не путался почему его правка `current_step: 5` перезатёрлась на следующем Write. Если operator хочет lock на mechanical поле — он его пишет, и hook через несколько минут перезатрёт. Это by-design: hint, не truth.

### Idempotency strategy

Hook **полностью перезаписывает** mechanical поля (current_topic, current_branch, current_step, last_update) каждый раз. Не merge, не append. Если файла нет — создаёт скелет.

Альтернатива (sed in-place patching) отвергнута: добавляет race window (read → modify → write), требует locking, fragility на формат-drift'ах. Полная перезапись через temp file + atomic rename устраняет race entirely.

**Concurrency:** PostToolUse hook'и в Claude Code не вызываются параллельно для одной session'и (sequential per-tool). Между сессиями (рабочий и debug Claude в двух окнах) — теоретически возможно. Mitigation: `mv tmp.state .session-state.md` атомарно на POSIX FS, последний writer wins. Это **acceptable** per spec edge case «state потерян → микрошаг». См. § Risks → R-3.

---

## Tests plan

### Smoke tests (bash-level, не unit framework)

Размещение: `doc/_templates/scripts/tests/session-state-smoke.sh.tmpl` (новый файл) — bash скрипт который вызывает оба скрипта на синтетических stdin'ах и проверяет output. Запускается локально оператором / в CI на template repo.

**Test 1 — update-session-state.sh recognises spec write:**

```
echo '{"tool_name":"Write","tool_input":{"file_path":"doc/features/foo_spec.md"}}' | bash update-session-state.sh
# Assert: .ai-pm/.session-state.md exists, current_topic=foo, current_step=1, last_update=<today>
```

**Test 2 — recognises plan write:**

```
echo '{"tool_name":"Edit","tool_input":{"file_path":".ai-pm/doc/features/foo_plan.md"}}' | bash update-session-state.sh
# Assert: current_step=2
```

**Test 3 — recognises code write, preserves topic:**

```
# Pre-condition: state file имеет current_topic: foo
echo '{"tool_name":"Write","tool_input":{"file_path":"apps/web/src/auth.ts"}}' | bash update-session-state.sh
# Assert: current_step=4, current_topic=foo (unchanged)
```

**Test 4 — non-feature write skips state update:**

```
echo '{"tool_name":"Write","tool_input":{"file_path":"README.md"}}' | bash update-session-state.sh
# Assert: state file unchanged (last_update same as before)
```

**Test 5 — invalid JSON stdin, exit 0:**

```
echo 'not json' | bash update-session-state.sh
# Assert: exit code 0, state file unchanged
```

**Test 6 — print-session-state.sh prints existing file:**

```
# Pre-condition: .ai-pm/.session-state.md exists with known content
bash print-session-state.sh
# Assert: stderr contains "current_topic: foo"
```

**Test 7 — print-session-state.sh missing file fallback:**

```
rm -f .ai-pm/.session-state.md
bash print-session-state.sh
# Assert: stderr contains "session state отсутствует", exit 0
```

**Test 8 — branch switch idempotency:**

```
# Pre-condition: state имеет current_branch=feature/A
git checkout feature/B
echo '{"tool_name":"Write","tool_input":{"file_path":"doc/features/bar_spec.md"}}' | bash update-session-state.sh
# Assert: current_branch=feature/B, current_topic=bar
```

**Test 9 — preserves operator-managed fields:**

```
# Pre-condition: state has pending_agents block with planner entry
echo '{"tool_name":"Write","tool_input":{"file_path":"doc/features/foo_spec.md"}}' | bash update-session-state.sh
# Assert: pending_agents block still present, untouched
```

### Integration test (manual smoke per coder routine)

Documented в `_plan.md` § Acceptance — оператор после Step 4 / 5 проходит:

1. `git checkout feature/test-resume && rm -f .ai-pm/.session-state.md`
2. Write tmpdir/dummy_spec.md → check state appears с current_step=1
3. Write tmpdir/dummy_plan.md → check current_step=2
4. Source new SessionStart hook → check output prints state
5. `git checkout main` (без write'а) → state stale (expected, hint not truth)
6. Любой Write на main → state перезаписывается с branch=main

### Что НЕ тестируем

- Concurrency между sessions (single-machine, low contention, micro-step recovery acceptable per spec)
- YAML schema validation (state — human-editable, schema enforcement добавит fragility)
- Performance (skripts < 100ms each, не на hot path)

---

## Migration / Schema changes

**N/A.** Это greenfield addition в template. Существующие установки протокола (если такие есть) автоматически подхватят при следующем `template-sync` — bootstrap-agent при upgrade'е увидит новые `.tmpl` и предложит сгенерировать local copies.

**Backward compatibility:** существующие установки без `.ai-pm/.session-state.md` продолжат работать — `print-session-state.sh` graceful'но обработает missing file (см. Test 7). `update-session-state.sh` создаст файл при первом feature-related Write'е.

**No data backfill required.**

---

## Wiring details

### `doc/_templates/settings.json.tmpl` diff

PostToolUse — добавить вторую entry в массив `hooks`:

```json
"PostToolUse": [
  {
    "_comment": "После Write в doc/features/ обновляет last_update в .ai-pm/.bootstrap-state.md.",
    "matcher": "Write|Edit",
    "hooks": [
      { "type": "command", "command": "scripts/update-bootstrap-state.sh" },
      { "type": "command", "command": "scripts/update-session-state.sh" }
    ]
  }
]
```

SessionStart — то же:

```json
"SessionStart": [
  {
    "_comment": "...",
    "hooks": [
      { "type": "command", "command": "scripts/check-skip-reprompts.sh" },
      { "type": "command", "command": "scripts/print-session-state.sh" }
    ]
  }
]
```

### `.gitignore` wiring

Два варианта рассматриваются:

**Вариант A (recommended): через `install-git-hooks.sh.tmpl` extension.** Скрипт уже запускается bootstrap-agent'ом на Stage D. Добавляем шаг:

```bash
# Ensure .ai-pm/.session-state.md is gitignored
if [ -f .gitignore ] && ! grep -qE '^\.ai-pm/\.session-state\.md$' .gitignore; then
  echo '.ai-pm/.session-state.md' >> .gitignore
fi
```

Идемпотентно, не дублирует.

**Вариант B:** новый template `.gitignore.tmpl` в `doc/_templates/` который bootstrap-agent merges с product `.gitignore`. Более clean но требует write-pass logic'и которой сейчас нет.

**Решение:** Вариант A — minimal disruption, follows existing pattern (`install-git-hooks.sh.tmpl` уже делает append-if-missing типа правок).

### `CLAUDE.md.tmpl` строчка

В секции «Session start routine» добавить пункт после шага 1 («Прочитай `.ai-pm/.bootstrap-state.md`»):

> **Шаг 1.1: Если есть `.ai-pm/.session-state.md` — прочитай его.**
>
> Это lightweight hint «где мы во флоу» (current_topic / branch / step / pending sub-agents). Если файла нет — восстанови контекст через `git branch --show-current` + `gh pr list --state open` + scan `<doc_root>/features/*_spec.md` без парного `_plan.md`. SessionStart hook уже напечатал содержимое если файл был — но дублирующее чтение защищает от случая когда оператор скипнул hook output.

---

## Новые fitness functions

**Не требуются.** Это infrastructure feature без новых архитектурных invariants для CI enforcement'а. Smoke tests (§ Tests plan) — sufficient verification.

Возможное будущее усиление (out of scope для текущего тикета):

- CI gate «`.session-state.md` не должен быть в `git ls-files`» — защита от случайного `git add -f`. Можно добавить если когда-нибудь забудем и попадётся в diff. Сейчас YAGNI.

---

## Новые ADR

**Не создаём.** Per spec и spec'овый § «Принятые решения» — нет архитектурного fork'а с долгосрочным последствием. Все decisions (формат файла, эвристика по имени, два скрипта а не один) — implementation choices, не architectural commitments. Per AP-1: ADR создаётся когда есть **реальные альтернативы с долгосрочным impact'ом**, не когда «можно зафиксировать».

Edge — если в Step 4 (coder) обнаружится что concurrency между sessions реально проблема и mitigation потребует non-trivial решения (file locking? journal-style append-log?) — это будет момент для ADR. Текущая plan view: атомарный rename достаточен.

---

## Open questions

1. **`<doc_root>` vs `doc/`** — template скрипты сейчас grep'ают `(\.ai-pm/)?doc/features/`. В new-product layout doc_root может быть `doc/`, в legacy `.ai-pm/doc/`. Pattern уже учитывает обе формы. Verify в Step 4 что не пропустили edge case (e.g. оператор перенёс doc в `documentation/`).
2. **`tools/` vs `scripts/` location** — должен `update-session-state.sh` лежать рядом с другими hook скриптами в product `scripts/`? Да, для consistency. Bootstrap-agent на Stage D копирует все `.tmpl` из `doc/_templates/scripts/` в product `scripts/`. Verify pattern в Step 4.
3. **Operator override format** — spec упоминает «оператор может попросить запиши state». Это просто инструкция Claude'у который Edit'ит файл — не требует special tooling. Verify что мы документируем это в state-файла preamble.

Решение open questions: оператор отвечает в Step 3 (если есть concerns), иначе Step 4 решает по best-judgment.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **R-1: Hook падает на edge case stdin → блокирует Write/Edit user'а** | Low | High (UX regression) | PostToolUse non-blocking by API contract — даже exit≠0 не блокирует. Но: дополнительно скрипт всегда `exit 0`, ловит `set -e` отключенным в parsing блоке, defensive checks на пустой `$FILE`. Тест 5 (invalid JSON). |
| **R-2: Эвристика step'а ошибается на новых файлах вне pattern'а** | Medium | Low (stale step, не сломанная функциональность) | Default behavior: если pattern не matched — skip update entirely (Test 4). State остаётся со старым step'ом. Acceptable per spec: «state — hint, git — truth». Оператор override'ит вручную. |
| **R-3: Concurrent sessions race на `.session-state.md`** | Low (single operator, single machine) | Low (микрошаг recovery) | Atomic mv через temp file. Последний writer wins. Per spec edge case: «state потерян → AI recovers через git/gh». Concurrency mitigation NOT a goal. |
| **R-4: State файл leak в git (случайный `git add -f`)** | Low | Medium (PII-style — может содержать topic names операторских проектов) | `.gitignore` запись через `install-git-hooks.sh.tmpl`. State содержит только feature topics и timestamps — не secrets, но засорение release diff'а нежелательно. Future YAGNI: CI gate. |
| **R-5: Bootstrap-agent забывает скопировать новые `.tmpl` при template-sync** | Low | Medium (feature не активируется на upgrade) | Template-sync agent читает `doc/_templates/scripts/` directory целиком — новые файлы автоматически попадают. Verify в Step 4 что pattern работает (smoke test на dummy product repo). |
| **R-6: Existing `settings.json` в product repo при upgrade не получит new hook entries** | Medium | Medium (feature silently не активируется) | Template-sync agent сейчас не auto-merges `settings.json` — оператор делает manually per project conventions. Mitigation: CHANGELOG entry с явной инструкцией «после upgrade добавь два hook entries в settings.json». Verify в Step 5 (test plan). |

**Top-3 risks для operator-decision:** R-1 (UX), R-6 (silent feature-miss на upgrade), R-3 (concurrency — operator должен подтвердить что single-machine assumption OK).

---

## PR ordering

`pr_ordering: null` (single-domain — все изменения в template files, no DB/API/UI split). Один PR, atomic feature.

---

## Scope summary

**In (deliverables Step 4):**

- `doc/_templates/scripts/update-session-state.sh.tmpl` — новый
- `doc/_templates/scripts/print-session-state.sh.tmpl` — новый
- `doc/_templates/scripts/tests/session-state-smoke.sh.tmpl` — новый (smoke tests, см. § Tests plan)
- `doc/_templates/settings.json.tmpl` — extend PostToolUse + SessionStart массивы
- `doc/_templates/CLAUDE.md.tmpl` — добавить шаг 1.1 в session start routine
- `doc/_templates/scripts/install-git-hooks.sh.tmpl` — добавить gitignore append-if-missing блок
- `CHANGELOG.md` — entry под current version
- `doc/development-protocol.md` (overlay) и/или `.ai-pm/tooling/development-protocol.md` — если требует mention новых hook'ов в § Hook stack documentation (verify в Step 4)

**Out (не делаем):**

- ADR creation (см. § Новые ADR)
- CI gate для leak detection (YAGNI)
- Auto-migrate existing installations (template-sync agent handles)
- Multi-machine sync (per spec)
- Chat-decision capture (per spec)
- Per-topic state files (per spec)

---

## Approval

После operator-маркера «поехали» — этот файл commit'ится в `feature/session-resume-state`. AI переходит к Step 4 (coder делегация). Coder использует Tests First (§ 21 generic protocol): сначала пишет `session-state-smoke.sh.tmpl`, потом сами скрипты.
