# ai-pm-protocol

Универсальный protocol для разработки в связке **соло-PM + AI-агент**, оформленный как репо-шаблон + init-агент.

## Кому это и зачем

**Core product thesis:** есть два архетипа solo-builder'ов с симметричной болью:

- **PM боль:** «знаю что нужно (продукт / users / business), не могу писать код в нужном темпе/качестве».
- **Developer боль:** «умею писать код, не знаю что именно полезно делать».

Template **симметрично закрывает обе** через cross-substitution:

| Сторона | Что получает | Pain закрывается |
|---|---|---|
| **PM** (Persona A) | AI как personal developer + automation/reviewer = peer-review team | «писать код» |
| **Developer** (B/C) | Template как PM-discipline (Stages A-D, enforced spec linkage) | «что делать полезного» |

**Bidirectional learning:** PM по ходу осваивает архитектуру, Developer — соседний стек (B) и продуктовое мышление (B/C). Template — **усилитель компетенций**, не **замена навыков**.

**Чем это не является:** не методология для команд > 1 PM. Не code generator. Не AI hype. Не vibecoding tool.

## Идея в одном абзаце

Любой продуктовый проект проходит шесть стадий: **A. Discovery → B. Constraints → C. Solution shape → D. Process → E. Bootstrap → F. Production**. На каждой — конкретные artifacts, которые AI **драфтит**, PM **маркирует «ОК / поменять X»**. Между стадиями — PM-gate. В Production каждая фича проходит микро-цикл `spec → plan → PM-review → tests-first code → CI gates → acceptance → reviewer-agent`. ADR пишутся **реактивно**. Защита протокола — через **5-layer enforcement** (CLAUDE.md briefing → settings.json hooks → subagent routine → git hooks → CI gates), две из них — **hard блокировки**, которые AI не может обойти.

## Структура репо template'а

```
ai-pm-protocol/
├── README.md                          ← эта страница
├── LICENSE                             ← AGPL-3.0
├── doc/
│   ├── development-protocol.md        ← полный generic protocol
│   ├── anti-patterns.md               ← правила «никогда так не делай»
│   ├── personas.md, user-journeys.md  ← Stage A artifacts template'а самого
│   ├── _templates/                    ← skeleton'ы для каждого artifact'а
│   │   ├── personas.md.tmpl
│   │   ├── user-journeys.md.tmpl
│   │   ├── feature-spec.md.tmpl
│   │   ├── feature-plan.md.tmpl
│   │   ├── feature-review.md.tmpl
│   │   └── ...
│   └── _recipes/cache/                ← stack-specific recipe cache
│       └── ai-linting-typescript.md
└── .claude/
    └── agents/
        └── project-bootstrap.md       ← init-агент для свежеклонированного проекта
```

## Структура продукта, который использует template

```
<product-repo>/
├── doc/                              ← committed product content (Mode 1, top-level)
│   ├── personas.md, user-journeys.md, threat-model.md, ...
│   ├── ai-linting-rules.md, development-protocol.md
│   ├── architecture-decisions/
│   └── features/
├── .ai-pm/
│   ├── .bootstrap-state.md           ← committed
│   ├── version                       ← committed (template version pin)
│   └── tooling/                      ← submodule / symlink / vendor (см. Setup ниже)
├── CLAUDE.md, .claude/settings.json, .gitignore
└── (rest of product code)
```

`doc/` для Mode 1 (new-product) — top-level. Для Mode 2/3 с existing top-level `doc/` — content в `.ai-pm/doc/` (см. development-protocol.md § 2 для retrofit layout'а).

## Setup для product repo

Template **не копируется** в продукт. Поддерживаются три варианта подключения; bootstrap-agent определяет тип автоматически (submodule / symlink / vendor) и записывает в state.

### Вариант A. Git submodule (рекомендуется)

Подходит для большинства случаев — version-pinned, voспроизводимо на CI / у других разработчиков, один clone тащит всё.

```bash
cd ~/dev/my-product
git submodule add git@github.com:aadegtyarev/ai-pm-protocol.git .ai-pm/tooling
git commit -m "chore: подключён ai-pm-protocol как submodule"
```

После clone'а продукта другие разработчики делают:

```bash
git clone --recurse-submodules <product-url>
# или, если уже clone'нули без --recurse:
git submodule update --init --recursive
```

Обновление template'а до новой версии:

```bash
cd .ai-pm/tooling
git fetch && git checkout <tag-or-commit>
cd ../..
git add .ai-pm/tooling && git commit -m "chore: bump ai-pm-protocol до <ver>"
```

### Вариант B. Symlink

Подходит, если разрабатываешь template и продукт параллельно — изменения в template сразу видны в продукте без commit'а / submodule update.

```bash
cd ~/dev
git clone git@github.com:aadegtyarev/ai-pm-protocol.git
cd my-product
mkdir -p .ai-pm
ln -s ../../ai-pm-protocol .ai-pm/tooling
echo ".ai-pm/tooling/" >> .gitignore
```

Windows: `mklink /D .ai-pm\tooling ..\..\ai-pm-protocol` (cmd) или `New-Item -ItemType SymbolicLink ...` (PowerShell).

Минусы: каждый разработчик клонит template сам, CI требует отдельного шага клонирования template'а перед запуском линтеров.

### Вариант C. Vendor (copy)

Подходит для air-gapped окружений или когда нужно freeze состояние без зависимости от внешнего репо.

```bash
cp -r ~/dev/ai-pm-protocol my-product/.ai-pm/tooling
rm -rf my-product/.ai-pm/tooling/.git
cd my-product && git add .ai-pm/tooling
```

Минусы: template дублируется в каждом продукте, обновление — ручной merge.

### Запуск bootstrap-agent

После подключения template'а любым из вариантов:

```bash
cd my-product
claude  # запустит bootstrap-agent при первой сессии
```

Bootstrap-agent **сам**:
1. Скопирует bootstrap-state.md skeleton (с unfilled options) в `.ai-pm/`.
2. Скопирует CLAUDE.md (root) и `.claude/settings.json`.
3. Спросит Mode + Trust profile (integration mode — детектируется automatically).
4. Поведёт через Stage A-E.

## Как использовать (v0 vision)

**Mode `new-product` (greenfield):**

1. Setup (4 шага выше) — клон template + symlink.
2. `cd new-product-repo && claude` — bootstrap-agent активируется.
3. Bootstrap-agent: «Mode? `new-product` / `new-feature` / `rework-feature`».
3. Bootstrap-agent: «Integration mode? gitignore / submodule / vendor». Default — gitignore.
4. Создаётся `.ai-pm/` skeleton; tooling подключается по выбранному mode.
5. Stage A → B → C → D (content) — bootstrap-agent проводит, PM маркирует.
6. Stage E — bootstrap-agent генерирует concrete infrastructure (CI, линтеры, security) **на основе** Stage A-D content. Не упреждающе.
7. Stage F — обычная feature work.

**Mode `new-feature` / `rework-feature` (existing project):**

1. `cd existing-repo && claude` — bootstrap-agent активируется в существующей репе.
2. Mode + integration выбраны.
3. Bootstrap-agent **сканит** существующий проект (стек по `package.json` / `pyproject.toml` / etc.), читает existing docs (если есть).
4. READ-pass по Stage A-C; опционально WRITE дельт (например, если фича вводит новую persona).
5. Stage E — добавляет ai-pm-specific jobs **в существующий `ci.yml`** (не overwrites). Линтеры, что user уже имеет — отмечает «covered, skip».
6. Stage F — фича / rework по standard workflow.

**Статус:** v0 draft. Шаблон обкатывается параллельно с первым реальным prod-run'ом (private); правила и templates уточняются по мере того, как реальный проект сталкивается с реальностью.

## Multi-layer enforcement (5 слоёв)

Template enforce'ит протокол через 5 защитных слоёв (см. `doc/development-protocol.md` § 5.5):

| Layer | Что | Hard / Soft |
|---|---|---|
| 1 | `CLAUDE.md` briefing — каждая Claude session читает | Soft |
| 2 | `.claude/settings.json` PreToolUse hooks — блокируют Write/Edit/Bash | **Hard** |
| 3 | Subagent routine (planner, coder, reviewer, …) | Soft |
| 4 | Git hooks (pre-commit, commit-msg, pre-push) | **Hard** |
| 5 | CI gates + branch protection | **Hardest** |

Слои 2, 4, 5 **физически блокируют** нарушения протокола (например, попытку Write в `apps/` без spec'а). PM может игнорировать Layer 1 (briefing), но Layer 2 hook не пропустит tool call.

## Anti-patterns, явно запрещённые

См. `doc/anti-patterns.md`. Краткий список:

- ADR upfront (без plan'а фичи, который этого требует)
- Premature Stage E: создание repo skeleton (`apps/`, `packages/`) до того, как написан первый `<topic>_spec.md`
- Документы без PM-gate между стадиями
- AI отклоняется от plan'а без объявления и без обсуждения

## Contributing

Если ты contribute'ишь изменения **в сам шаблон** (а не используешь его в своём продукте) — после клона активируй внутренние git hooks:

```bash
git config core.hooksPath .githooks
```

Это включит pre-push hard-block на прямой push в `main` (development-protocol.md § 14.6). Без этого `.githooks/pre-push` лежит в репке, но git его не видит. Активация идемпотентна и нужна один раз на клон.

Все изменения в шаблоне идут через PR в feature/<topic>, docs/<topic> или chore/<topic> ветки. Direct-push в `main` запрещён § 14.

## Лицензия

**AGPL v3** — см. `LICENSE`. Коммерческое использование разрешено; модификации (включая SaaS-deployment) должны возвращаться в open source под той же лицензией.

SPDX-License-Identifier: `AGPL-3.0-only`
