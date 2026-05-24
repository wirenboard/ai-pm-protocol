# Anti-patterns

Правила «никогда так не делай», выведенные из реального опыта prod-run'ов. Каждый правило фиксирует **что нельзя**, **почему** (с конкретным случаем) и **как поступать вместо**.

---

## AP-1. ADR пишется реактивно, не упреждающе

**Что нельзя:**
- Писать ADR до того, как plan конкретной фичи упёрся в развилку.
- Задним числом документировать «решения, которые мы уже неявно приняли», в форме ADR.
- Писать пакеты ADR (5-10-20 штук) до первой строки production-кода.

**Почему:** В одном из ранних prod-run'ов template'а к моменту запуска bootstrap'а накопилось 18 ADR в статусе Proposed, написанных до первой фичи. Аудит показал: ~8 реально архитектурные, остальное — positioning/brand/strategic/feature-level decisions. оператор не смог переварить 18 решений за один review-проход; ADR-папка превратилась в свалку и утратила сигнальную функцию.

**Как поступать вместо:**
- ADR создаётся **в момент** написания `<topic>_plan.md`, когда AI обнаруживает развилку с долгосрочными архитектурными последствиями.
- AI заводит ADR-файл (Proposed) **в той же ветке**, что и plan/код.
- оператор ревьюит ADR в составе того же PR, в котором фича приходит — не отдельным review-марафоном.
- Pre-ADR решения (стек, основные паттерны) фиксируются в `topology.md` или `strategic-frame.md`, не в ADR.

---

## AP-2. Никаких repo-скелетонов до первой feature spec

**Что нельзя:**
- Создавать `apps/`, `packages/`, `Makefile`, `package.json`, CI workflow до того, как написан хотя бы один `doc/features/<topic>_spec.md` с одобрением оператора.

**Почему:** Repo skeleton отражает архитектуру, которая ещё не подтверждена реализацией. Если первая же фича покажет, что нужна другая декомпозиция (monolith vs split, разные boundary'и), весь skeleton переписывается. В одном из ранних prod-run'ов skeleton с несколькими `apps/*` + `packages/*` был создан до фичи; после смены подхода большая часть была снесена.

**Как поступать вместо:**
- Repo до Stage F содержит только: `README.md`, `doc/`, `.claude/`, `.gitignore`.
- При написании первой `<topic>_spec.md` AI **в plan'е** объявляет, какие новые директории создаются, и почему.
- Skeleton растёт **из фич**, не наоборот.

---

## AP-3. Stage'ы проходятся последовательно, с operator-gate

**Что нельзя:**
- Переходить к Stage B/C/D без подтверждения оператора, что Stage A artifacts его устраивают.
- Драфтить artifacts нескольких стадий «параллельно» в надежде, что оператор их потом отревьюит сразу.

**Почему:** Stage B (threat-model, mvp-scope) опирается на Stage A (personas, journeys). Если personas потом меняются, Stage B переписывается. Без явного gate'а оператор не знает, когда фиксировать понимание.

**Как поступать вместо:**
- AI завершает draft всех artifacts текущего stage'а → объявляет «Stage X готов к ревью» → ждёт operator-маркера.
- оператор маркирует каждый artifact отдельно: ОК / change X / open question.
- Только после `все артефакты Stage X = ОК` → переходим к Stage Y.
- Исключение: разрешено **в параллель** обнаружить, что Stage A пробел требует возврата (например, при draft'е Stage B понял, что нужна ещё одна persona) — это идёт через явное «возвращаюсь в Stage A, причина: …».

---

## AP-4. Specification First — без исключений

**Что нельзя:**
- AI пишет код в `apps/`/`packages/` без предшествующего `<topic>_spec.md` с operator-approval.
- AI пишет код в одном коммите со spec'ом и/или plan'ом (нарушение порядка Step 1 → Step 2 → Step 4).

**Почему:** Spec — контракт между оператор и AI на естественном языке. Если код пишется без spec'а, контракта нет, и любая дискуссия о «правильно/неправильно» сводится к спорам о коде. Если spec и код в одном коммите, нет следа того, что spec был согласован отдельно.

**Как поступать вместо:**
- `<topic>_spec.md` commit'ится первым, с operator-approval-маркером в commit message или PR description.
- `<topic>_plan.md` commit'ится вторым, после operator-approval'а spec'а.
- Код commit'ится третьим (или последующими), после operator-approval'а plan'а.
- CI enforce'ит этот порядок (см. development-protocol.md §9).

---

## AP-5. Tests First для нового кода

**Что нельзя:**
- Писать имплементацию пёрвой, тесты потом.
- Покрывать только happy path; забывать про edge cases из spec'а.
- Использовать общий coverage % как алиби: «80% покрыто, остальное — старый код».

**Почему:** TDD-порядок гарантирует, что spec'овские scenarios действительно реализованы (не «реализация работает, но scenario из spec'а никто не пробовал»). Per-diff coverage блокирует накопление непротестированного кода в любой одной фиче.

**Как поступать вместо:**
- AI пишет тесты в порядке: property-based для invariants → BDD scenarios из spec'а → unit для pure functions → integration для boundaries.
- CI блокирует merge, если **per-diff** coverage новой фичи < 80%.

---

## AP-6. AI не отклоняется от plan'а молча

**Что нельзя:**
- AI в процессе implementation'а решает «лучше сделать иначе» и делает иначе без объявления оператору.
- оператор узнаёт об отклонении только при code review.

**Почему:** Plan — контракт. Отклонение в imp'е без согласования делает operator-review бесполезным (он ревьюит код, а не контракт), и накапливает скрытый дрейф между документами и реальностью.

**Как поступать вместо:**
- Если AI в процессе видит, что plan содержит ошибку или неоптимальность — останавливается, описывает что нашёл, предлагает изменение plan'а.
- оператор либо одобряет правку plan'а (тогда AI обновляет `_plan.md` + продолжает), либо настаивает на исходном (AI делает по plan'у даже если technically «хуже»).
- AI не имеет права override'нуть оператора technical-аргументом. оператор — высший контроль.

---

## AP-7. Документы — living artifacts, но с разной частотой ревизий

**Что нельзя:**
- Считать foundational artifacts (personas, threat-model, positioning) immutable после первого approval'а.
- Менять foundational artifacts молча в составе feature PR.

**Почему:** Реальность меняется. Personas v0 может оказаться неточным после первых интервью с пользователями. Threat-model может потребовать пересмотра после security incident'а. Но изменение personas в составе PR с кодом — повышает риск, что оператор не заметит сдвига.

**Как поступать вместо:**
- Каждый foundational artifact имеет **review cadence**: personas/journeys — quarterly или при сильном insight'е, threat-model — quarterly или после incident'а, positioning — quarterly или при market change.
- Изменения foundational artifacts идут **отдельным PR**, с явным «revisit X because Y» в title и описании.
- В commit message — ссылка на причину (insight, incident, market signal).

---

## AP-13. Пропуск operational / legal / validation артефактов до «потом разберёмся»

**Что нельзя:**

- В new-product mode закрывать Stage B без `legal-brief.md` — «юрист задействуется на этапе 1, тогда и брифинг напишем». Юрист потратит лишнюю неделю на разбор vision / strategic-frame / threat-model.
- В new-product mode с runtime-сервисом закрывать Stage B без `incident-runbook-draft.md` — «процедуры напишем при первом инциденте». В момент инцидента — не время писать процедуру.
- В new-product mode закрывать Stage B без `customer-interview-script.md` — «вопросы придумаем перед интервью». Альфа = chatting без скрипта, не валидация.
- В Stage B `strategic-frame.md` без секций «Обещания и метрики (SLO)» и «Метод валидации гипотез» — SLO формализуются юридически, метод валидации определяет risk проекта.

**Почему:** на одном из ранних prod-run'ов template'а Stage B был закрыт без этих 3 артефактов и 2 секций. Meta-анализ показал: каждый отложенный артефакт — будущая операционная боль. Юрист — лишняя неделя. Альфа без скрипта — потерянная валидация. SLO без формулировки — пустое обещание.

**Mode-aware применение:**

| Mode | legal-brief | customer-interview-script | incident-runbook-draft | SLO + метод валидации |
|---|---|---|---|---|
| **new-product mode** | Обязательно | Обязательно | Обязательно (если есть runtime) | Обязательно |
| **feature mode** | Условно (если фича меняет legal surface) | Условно (если меняет ключевой journey / добавляет персону / меняет цену) | Условно (если добавляет новый класс инцидентов) | Условно (если меняет SLO продукта) |
| **rework mode** | Условно (если rework меняет legal/regulatory) | Условно (если UX переделка, не internal refactor) | Условно (как feature mode) | Условно (как feature mode) |
| **Lite-mode / bugfix** | Нет | Нет | Нет | Нет |

**Решение mode-aware применимости** принимает оператор при создании feature-spec — отмечает в frontmatter `legal_impact: yes|no`, `validation_required: yes|no`, `incident_impact: yes|no`. Если `yes` — соответствующий артефакт обновляется через PR.

**Как поступать вместо:**

- В Stage B чек-листе bootstrap-state.md.tmpl добавить 3 артефакта (mode-aware: для new-product mode обязательно, для feature/rework modes условно).
- В strategic-frame.md.tmpl добавить 2 обязательные секции (SLO + метод валидации) для new-product mode.
- В feature-spec.md.tmpl добавить frontmatter поля для mode-aware impact assessment.
- Bootstrap-агент при закрытии Stage B проверяет наличие этих 3 артефактов (для new-product mode) — если нет, не позволяет закрыть.

---

## AP-22. Adoption-override без declared trade-off

**Что нельзя:**

- Записывать `adoption_overrides` entry в `.bootstrap-state.md` без полей `reason` и `accepted-risk`.
- AI самостоятельно добавлять `adoption_overrides` (только operator-initiated через explicit instruction).
- Override без `declared_at` timestamp (затрудняет audit trail).
- Skip Stage E infrastructure hooks без override — это hard floor для adoption (AP-16 enforcement не работает без hooks).

**Почему:** `adoption_overrides` — это операторская декларация risk acceptance при legacy adoption (см. design doc `meta/design/2026-05-24_mode-matrix-and-adoption.md` Tier 3). Это **разрешённый** механизм для declared trade-offs (например, «skip threat-model.md потому что продукт без production users»), но **требует явного reason + accepted-risk**, иначе теряется audit trail и оператор не понимает что выключает. AI самостоятельно override'ить — нарушение AP-3 operator-gate.

**Как поступать вместо:**

- Override добавляется только operator-initiated через explicit ask. AI **не предлагает** override proactively — только когда оператор требует «skip X».
- Format в `.bootstrap-state.md`:
  ```yaml
  adoption_overrides:
    - skip: <component>          # обязательно
      reason: <why>              # обязательно
      accepted-risk: <what breaks>  # обязательно
      declared_at: YYYY-MM-DD    # обязательно
      expires_at: YYYY-MM-DD     # опционально — sunset date forces re-evaluation
  ```
- AI prompts при добавлении override: «Skip `<component>` означает: `<consequence>`. Confirm с reason и accepted-risk?» через AskUserQuestion.
- Optional `expires_at` для time-bounded overrides — после даты reviewer surface'ит «override expired, re-evaluate or extend».
- Reviewer-agent читает `adoption_overrides` from state и downgrades findings attributable к overridden component до `[question]` с tag `adoption-trade-off accepted by operator`. Surface override list в review summary.

**Use case override examples:**

- `skip: threat-model-for-security-path` — `reason: «продукт без production users, low risk surface»` — `accepted-risk: «AP-14 security check incomplete, риск compliance / audit issues при scaling»`
- `skip: customer-interview-script` — `reason: «MVP demo для internal stakeholders, не для customers»` — `accepted-risk: «validation gap до alpha cohort»`
- `skip: ui-style-guide-extract` — `reason: «backend-only продукт, минимальный UI»` — `accepted-risk: «AP-15 enforcement не применяется, UI inconsistency возможна»`

**Hard floor** — override **не разрешён** для:
- `stage-e-hooks` — без них AP-16 enforcement полностью soft, AI может open PR без trail. Critical.
- `trust_profile` — без него agents не знают как общаться.
- `stack` — без него нельзя ai-linting-rules или security catalogue (Tier 0 auto-detected, оператор не должен skip явно).

Если оператор настаивает на skip даже этих — это сигнал для re-discussion adoption approach, не для override. AI отказывает и эскалирует.

См. также AP-16 (review-override mechanic — parallel pattern) и design doc § I.

---

## AP-21. Бесконечный rework без exit condition

**Что нельзя:**

- rework mode: `spec.v1` → operator не одобрил → `spec.v2` → не одобрил → `spec.v3` → … — без явного exit condition.
- AI пассивно ждёт operator-approval, не задавая вопрос «адресует ли v3 findings v2 или мы зашли в тупик».
- Repeated re-spec'и одной фичи в попытке угадать operator intent.

**Почему:** rework mode (`rework`) разрешает iteration spec'ов через `_spec.v<N>.md`. Это полезный механизм для серьёзной переработки фичи. Но без верхнего предела — это **потенциально бесконечный цикл**: каждая новая версия может породить новые findings и привести к следующей. Audit finding [H-2] выявил, что reviewer не имеет explicit exit check'а. Цикл может вытянуть недели работы оператора без сходящегося результата — это противоположно цели шаблона (атомарная продуктивная работа per feature).

**Как поступать вместо:**

- Каждый `<topic>_spec.md` и `<topic>_spec.v<N>.md` имеет в frontmatter поле `version: N` (1 для нового spec'а; auto-increment для rework iterations).
- При `version: 3+` reviewer **обязан** через AskUserQuestion явно подтвердить:
  > «Это 3-я iteration этой фичи. Адресует ли spec.v3 findings spec.v2? Если нет — recommend (a) split на отдельное упражнение, (b) abort feature и open backlog item, (c) explicit operator override чтобы продолжить с v4».
- Решение — **оператора**, не AI. AI не продолжает работу до явного ответа.
- `version: 4+` — каждый next iteration требует new AskUserQuestion confirmation; cost растёт намеренно, чтобы дисциплинировать decision.
- В CI gate `check-spec-discipline.sh` опционально (warning-level): при `version: 3+` reviewer должен иметь явный override-маркер в commit body (`[rework-version-override: <reason>]`), аналогично AP-16 review-override.

**Use case override:** редко — например, при rework критической security фичи, где iteration is genuine refinement, а не stuck-in-loop. Override **требует обоснования от оператора**, не от AI.

См. также AP-16 (review-override mechanic — schema похожая) и audit finding [H-2] (`meta/audits/2026-05-24_logic-fitness.md`).

---

## AP-20. Specialized reviewer routing — единый orchestrator, ограниченный spawn

**Что нельзя:**

- Spawn'ить **все** specialized reviewer'ы (backend / frontend / design / database / protocol-compliance) для каждого PR независимо от scope — overhead (cost / время / шум).
- Использовать domain-specific reviewer (backend-reviewer, frontend-reviewer, etc.) **напрямую**, минуя primary reviewer — теряется consolidation logic + cross-cutting checks.
- Полагаться на naive «один agent читает всё» для multi-domain PRs — prompt разрастается, focus теряется.
- Запускать reviewer на mixed-domain PR без recommendation split per AP-19.

**Почему:** оператор на одном из ранних prod-run'ов template'а expressed concern «зачем гонять 5 reviewer'ов на каждый коммит». Naive «all-specialized always» multiplies cost × N (worst case 5 agent spawns per PR). Smart routing reduces это к ровно 2 spawns per typical atomic PR (protocol-compliance always + 1 domain), что соответствует AP-19 per-PR atomicity.

**Решение:**

`reviewer.md` — **primary reviewer (orchestrator)**, единый entry point для всех PR'ов. Detection logic:

1. **Detect PR scope** через Conventional Commits scope + diff paths + diff content
2. **Always spawn** `protocol-compliance-reviewer` (cross-cutting baseline: spec↔plan↔code, frontmatter, AP discipline)
3. **Spawn ONE** domain-specific reviewer based on detected scope:
   - `backend-reviewer` — `feat(backend)` / `feat(api)` / `feat(server)` + paths
   - `frontend-reviewer` — `feat(frontend)` / `feat(ui)` / `feat(web)` / `feat(mobile)` / etc + paths
   - `design-reviewer` — `feat(design)` / `feat(ux)` / `feat(copy)` + design assets paths
   - `database-reviewer` — `feat(db)` / `feat(schema)` / `feat(migration)` + migrations paths
4. **Cross-cutting checks** primary делает сам: structural consistency (AP-14), spec coverage, plan adherence, test discipline, generic security/architecture, code hygiene
5. **Consolidate** sub-reports + primary findings → single verdict + architectural summary

**Worst case spawn count per PR**: 2 (protocol-compliance + 1 domain) для atomic PR. Edge cases (PR touches multiple domains в exception scenarios) → 3 spawns. Никогда не 5 при atomic discipline (AP-19).

**Применение** — все Stage F PRs + template-extension PRs. Mode-agnostic.

**Как поступать вместо:**

- `reviewer.md` — primary entry point (router role)
- `protocol-compliance-reviewer.md` — always spawned, focused process check
- `backend-reviewer.md` / `frontend-reviewer.md` / `design-reviewer.md` / `database-reviewer.md` — domain-specific, focused
- Primary consolidates findings; specialized agents не общаются между собой и не персистят свои reports сами
- AP-19 (per-PR atomicity) enforced concurrently — если PR mixes domains, reviewer returns request-changes recommendation «split per AP-19»

---

## AP-19. Per-PR atomicity — один PR = один domain

**Что нельзя:**

- Помещать в один PR изменения нескольких domains (backend + frontend + db) — review становится multi-domain, finding'и разбросаны, rollback в случае проблемы трудный.
- Делать big-bang fullstack PR (feature touches schema + backend + frontend + UI design в одном merge) — нарушает AP-18 expand-contract by design (один merge = много moving parts).
- Combine schema change + backfill + code update в одном PR — невозможно rollback'нуть отдельно.

**Почему:** один из ранних prod-run'ов template'а имел PRs которые touched schema (DB migration) + backend code (API change) + frontend code (UI update) + tests одновременно. Review такого PR требует expertise во всех 4 domains одновременно, finding'и cross-cutting и hard to prioritize, rollback в случае проблемы требует разнести изменения post-hoc. Plus violates AP-18 expand-contract pattern (один merge = breaking change, нет multi-step safety).

**Решение — split fullstack feature на ordered PRs:**

| Order | PR | Domain |
|---|---|---|
| 1 | `feat(db): add column for X` (additive only) | database |
| 2 | `feat(backend): new endpoint reading X` (dual-write если применимо) | backend |
| 3 | `feat(frontend): UI consuming X endpoint` | frontend |
| 4 | (опционально) `chore(db): drop legacy column after Y days` | database (cleanup phase Contract) |

Каждый PR — atomic, focused, independently deployable + rollback'able. Natural alignment с AP-18 expand-contract.

**Spec frontmatter** для multi-domain features:

```yaml
pr_ordering: [schema, backend, frontend, cleanup]  # optional, для multi-PR features
```

planner.md предлагает PR ordering в plan'е для multi-domain features. Каждый PR имеет свой `<topic>-<order>_spec.md` (или single spec с multiple PR references).

**Допустимые исключения** (документированы):

1. **`chore(release):`** — release PR может touch version files в multiple paths (это admin operation, не feature)
2. **`docs:`** — pure documentation updates (часто touch multiple doc files)
3. **Hotfix для critical incident** — documented exception в commit body с обоснованием (например, «hotfix: cannot split because security incident require atomic deploy»). Visible в git log forever.
4. **Template-extension** в `ai-pm-protocol` repo — может touch multiple template files (это template development, не product feature)

**Как поступать вместо:**

- В Conventional Commits scope использовать **один** domain: `feat(backend):`, `feat(frontend):`, `feat(db):`, `feat(design):`
- planner.md в plan'е предлагает PR ordering для multi-domain features (см. `pr_ordering` frontmatter)
- coder.md implements один scope at a time, не mix
- reviewer.md detect'ит mixed-domain PR и returns request-changes finding «split per AP-19»

**Cross-references:**

- AP-18 expand-contract pattern — naturally aligns с per-PR atomicity (каждый этап expand-contract обычно — отдельный PR)
- AP-20 specialized reviewer routing — atomicity делает routing simple (detect single domain → spawn one specialized reviewer)
- AP-6 no silent deviation — split на PRs делает каждое отклонение visible

---

## AP-18. Unsafe deploys / migrations без rollback guarantee

**Что нельзя:**

- Deploy breaking change (schema / API contract / config format) **без expand-contract pattern** — multi-step rollout с rollback safety на каждом этапе.
- Запускать destructive migration (DROP / ALTER COLUMN TYPE / mass UPDATE) на production **без verified backup** before run.
- Combine schema change + data backfill + code deploy в **одном** PR — невозможно rollback'нуть отдельно: код / схему / данные.
- Использовать **down migrations** на production для отката — running reverse DDL рискован (не tested на production-tier data, может терять writes), вместо этого пишем new forward migration с reverse change.
- Deploy feature что-то меняющее в существующем state без **feature flag** для безопасного отключения (если deploy сломал что-то — можно flip flag, не редеплоить).
- Использовать ORM `db.sync()` / `auto-migrate` на production — ORM не понимает constraints, может silently drop columns или ломать FK.

**Почему:** rollback без guarantee = panic. На production падает что-то, команда пытается revert код, обнаруживается что migration уже применена, schema несовместима с предыдущей версией кода, recovery растягивается с минут на часы. Plus риск потери committed data: «сделал DROP COLUMN, потом понял что нужны были данные» — без backup нет undo. На одном из ранних prod-run'ов было обсуждено как **cross-cutting** discipline (оператор): «разработка относительно больших и важных проектов должна предусмотреть обновление и откат без боли и с гарантией сохранения данных» — не только БД-specific, applies к code / config / schema / data на каждом уровне.

**Применение** — обязательно для **production deploys**; для experimental / pre-MVP допустимы short-cuts с явным labeling.

**Как поступать вместо:**

1. **Expand-contract pattern** для всех breaking changes:
   - Этап Expand: добавляем new structure (column / endpoint / field), keep old работающим
   - Этап Dual-write / dual-read: code пишет/читает оба, без breaking consumers
   - Этап Backfill: data migration в отдельной step (не вместе со schema change)
   - Этап Switch: clients переходят на new
   - Этап Contract: после verified production usage — удаляем old
   - Каждый этап **независимо deployable и rollback'able**

2. **Forward-only schema rollback** на production: если deployed migration ломается, fix — **new migration** с reverse change (не «откатить applied»). Down migrations — только dev/test environment.

3. **Backup before destructive migration** — verified restorable (см. database-design-base.md § 14). RTO/RPO документированы. **Restore drills regularly** — «untested backup = no backup».

4. **Feature flags для risky features** — deploy code disabled, enable progressively (canary / % rollout / per-tenant). Quick rollback через flag flip, не redeploy.

5. **CI runs migrations** на fresh БД каждый PR — catches ordering / dependency / idempotency issues до production.

6. **Pre-flight verification** на production-like staging:
   - Тестируем migration на realistic data volume
   - Measure migration time → если > acceptable downtime, redesign (expand-contract)
   - Rollback runbook написан до production run

7. **Никогда не редактируем applied migrations** (см. database-design-base.md § 7.4) — immutable после apply.

8. **Data preservation invariants** (§ 7.3 database guide):
   - Schema change + backfill + DROP — три separate migrations, не одна
   - Никаких destructive operations в same migration что и new structure creation
   - Verify через CHECK constraint **после** migration что invariants держатся

**Какие level'ы покрыты:**

| Level | Rollback mechanism |
|---|---|
| **Code (app)** | Deploy previous version. Schema остаётся forward (expand-contract guarantees compat) |
| **Config / feature flag** | Disable feature flag → код перестаёт использовать new path. Без redeploy |
| **API contract (server)** | Backend guide § 10 schema evolution: additive default, deprecation/sunset headers, versioning через URI prefix / date header |
| **Schema** | Forward-only: rollback = new migration with reverse change. Backup before destructive (verified restorable) |
| **Data** | Restore from backup (PITR). RTO/RPO документированы. Restore drill quarterly минимум |

**Cross-references:**

- `database-design-base.md` § 7 — migrations discipline в БД
- `ui-style-guide-backend.md` § 10 — API schema evolution + deprecation/sunset
- `incident-runbook-draft.md` (AP-13) — restore procedures, deploy rollback runbook
- AP-3 — Stage'ы operator-gate (применяется к release stages: experimental → staging → canary → production)
- AP-6 — AI не отклоняется от plan'а молча (применяется к deploys: AI не shipping changes которые plan не описывает)

---

## AP-17. Утечка product-specific имён в template

**Что нельзя:**

- В `ai-pm-protocol` (template repo, **публичный** AGPL v3) — упоминать конкретные prod-run продукты по имени.
- В template'ах (`_templates/*.tmpl`), AP документации, README, project-bootstrap, reviewer / planner / coder agent prompt'ах — использовать examples из конкретного prod-run'а без abstraction'а.
- В описаниях PR / commit message'ах / PR review comment'ах template repo — упоминать prod-run продукт по имени.
- Использовать prod-run-specific терминологию в шаблонных примерах (имена domain объектов / actions конкретного продукта) — обобщать через placeholder'ы.

**Почему:** template **публичный** и предназначен для **любого** проекта. Утечка конкретного prod-run product name'а:

1. **Раскрывает confidential info** про prod-run product (если он stealth / private).
2. **Привязывает шаблон к одному use case** в восприятии новых пользователей — «это для VPN», «это для encrypted vault», и т.д.
3. **Создаёт prejudice** — другие потенциальные пользователи думают «у меня не такой продукт, шаблон не подходит».

**Как поступать вместо:**

- Заменять конкретные имена на абстракции: «один из ранних prod-run'ов», «product team», «application», «one of our products».
- Заменять product-specific термины на generic equivalents — generic actions, abstract objects, placeholder'ы.
- При описании AP «Почему» из prod-run incident'а — описывать **класс ошибки**, не **конкретный кейс**: «AI зафиксировал в spec одну архитектуру auth flow, а threat-model описывал другую» вместо raw quote с product name'ом.
- В commit message'ах template — упоминать PR номера / issue links вместо product name'ов.
- В PR description — то же самое.

**Reviewer-agent для template PR'ов** в Step 7 обязан выполнить leak check. Список запрещённых имён хранится в `.ai-pm/.product-names-blocklist` (gitignored, локальный per developer) — список конкретных названий, которые reviewer ищет через grep:

```bash
# .ai-pm/.product-names-blocklist — формат: одно имя на строке (case-insensitive)
# AI / developer не commit'ит этот файл; он locally per machine

while read -r NAME; do
  grep -ri "$NAME" doc/ .claude/ README.md
  git log --pretty=format:"%B" main..HEAD | grep -i "$NAME"
  gh pr view <N> --json body,comments --jq '.. | strings' | grep -i "$NAME"
done < .ai-pm/.product-names-blocklist
```

Любой match — `blocking finding`. Reviewer вернёт `request-changes` с указанием конкретного файла / location'а.

**Memory rule для AI:** при работе с template repo — никогда не упоминать имена prod-run продуктов. Это applies к session memory и persistent memory across sessions. Если оператор просит описать prod-run incident — описать класс, не конкретный кейс. Список конкретных имён к избеганию — в user-level memory `feedback_no_product_name_in_template.md`.

**Обнаружение:** AP добавлен после live incident'а — leak в template примерах и PR description'ах. После cleanup — этот AP как mandatory check.

---

## AP-16. PR создан / merged без зелёного review-trail

**Что нельзя:**

- Создавать (`gh pr create`) или merge'ить (`gh pr merge`) PR если:
  - **(a)** нет зафиксированного **локального** review-trail в одной из 3 форм:
    - **Committed `_review.md`** для Stage F feature/<topic> branch (`doc/features/<topic>_review.md`) — default routine reviewer-agent'а, с обязательной строкой `**Verdict:** approve | approve-with-comments | request-changes` в первых 50 строках
    - **Локальный trace file** `.ai-pm/.reviews/<branch>.json` с полем `verdict` — для chore / docs / template-extension branch'ей
    - **Explicit skip-marker** `[skip-review]` **на отдельной строке** в HEAD commit body (line-anchored — упоминания в prose не считаются) — для trivial chore'ов (typo-fix, dep bump)
  - **или (b)** verdict в найденном trail = `request-changes`. Hook парсит verdict и блокирует, пока review не станет зелёным (`approve` или `approve-with-comments`).
- Полагаться на «я провёл review в head'е» без persisting trail — это **soft reminder**, который AI игнорирует.
- Использовать `gh pr review` как trail-форму. GitHub PR review **не используется вообще** — review живёт локально (в репе или `.ai-pm/.reviews/`), дублирование в GitHub UI не имеет смысла для оператор+AI workflow: оператор читает committed файлы и AI summary в чате, не GitHub web UI.

**Почему:** на одном из ранних prod-run'ов AI забыл запустить reviewer-agent перед `gh pr merge`. оператор поймал. Анализ показал: reviewer.md описывал routine, но не было **hard enforcement** — soft reminders в CLAUDE.md и memory rules игнорировались под нагрузкой длинных сессий с множеством PR'ов. Reviewer-agent — Layer 3 enforcement (subagent routine), без Layer 2 (settings.json hook) он зависит от AI-дисциплины, которая не bullet-proof. Дополнительно: попытка делать review через `gh pr review` после открытия PR создаёт антипаттерн «открыть PR → дождаться comments → гонять fix'ы», который сводит review к bureaucratic theatre — fix'ы должны быть применены **до** PR.

**Решение — offline-first design + verdict-gate.** Layer 2 hook `scripts/check-pr-has-review.sh` блокирует `gh pr create` **и** `gh pr merge` если: нет trail ИЛИ verdict не green. Hook читает HEAD commit body (skip-marker), committed `_review.md` с парсингом `**Verdict:**`, и local trace file с парсингом `.verdict` — **без** обращения к GitHub API. Работает одинаково online и offline, на любой git-платформе (GitHub / GitLab / Gitea / self-hosted). AI **не может** обойти через --no-verify (это запрещено § 14.7).

**Применение** — для всех проектов с PR-flow. Mode-agnostic (одинаково для new-product mode / 2 / 3 / lite).

**Как поступать вместо:**

- В `_templates/scripts/check-pr-has-review.sh.tmpl` — hook script с 3 проверками (skip-marker → committed `_review.md` + verdict-parse → local trace + verdict-parse).
- В `_templates/settings.json.tmpl` — hook entry на Bash matcher (триггерится для `gh pr create` и `gh pr merge`).
- В `.claude/agents/reviewer.md` — обязательная routine «Persist review» с 2 формами trail (committed для Stage F / local trace для прочего) и обязательная строка `**Verdict:**` в первых 50 строках `_review.md`.
- В `.gitignore` (через bootstrap-agent) — `.ai-pm/.reviews/` (local trace, не commit'ится).

**Skip-marker `[skip-review]`** — explicit visible в `git log`, не abuse'ится потому что:
- Видим всем кто читает history
- Должен быть на **отдельной строке** (line-anchored regex `^\[skip-review\][[:space:]]*$`) — упоминание в prose body commit'а не триггерит
- Используется sparingly (typo / dep bump / README only) — каждый use требует осознанного решения оператора

**Human-override `[review-override: <reason>]`** — ручка **человека** (PM при Trust profile A, developer при Trust profile B/C — далее «оператор»; **не AI**) для принятия PR с `request-changes` verdict'ом.

**Discipline:** AI **не принимает никаких решений** по результатам review. Получив verdict `request-changes`, AI:

1. Показывает оператору в чате полный review summary (verdict, findings по severity, architectural context).
2. Через **AskUserQuestion** спрашивает, что делать с findings — варианты:
   - Зафиксить все finding'и (AI применяет fix → перезапускает reviewer → новый verdict, идеально approve)
   - Зафиксить часть, остальное deferred с override (оператор указывает какие именно finding'и deferred + reason / task IDs для backlog'а)
   - Override всё (оператор принимает PR as-is с обоснованием)
3. Выполняет решение оператора. **Никакого `[review-override]` без явного instruction от оператора.**

Use case override: оператор видит, что critical / high finding'и важны для исправления сейчас, а minor / nit / low — мелочи, которые лучше вынести в backlog (создать tasks #N) и не блокировать прогресс. Решение — **оператора**, не AI's.

**Следы в репе обязательны.** Override **не отменяет** review — он только разрешает hook'у пропустить `gh pr create` / `gh pr merge`. Сам review-trail (с verdict `request-changes` и findings) должен **остаться в репе** как honest audit record:

- **Stage F branch (`feature/<topic>`)** — committed `doc/features/<topic>_review.md` уже в репе. Override marker в commit body + committed `_review.md` = двойной след.
- **Non-Stage-F branch (chore / docs / template-extension)** — local trace `.ai-pm/.reviews/<branch>.json` **gitignored**, в репу не попадает. Поэтому при использовании override AI **обязан** вписать сами findings (полный список deferred items с severity и task IDs) в HEAD commit body **после** `[review-override: ...]` marker'а — это попадает в `git log` навсегда. Без этого override превращается в hidden bypass, нарушает audit-trail требование.

Format: `[review-override: <reason>]` на отдельной строке HEAD commit body. Reason **обязателен**, формулирует **оператор** (не AI):

- `[review-override: minor findings → task #42, #43 в backlog]`
- `[review-override: blocking finding ложно-positive, объяснение ниже]`
- `[review-override: defer naming concerns до следующего refactor PR]`

---

## AP-15. UI-фичи без Stage A `ui-style-guide-*` foundation

**Что нельзя:**

- В new-product mode с UI / API составляющей закрывать Stage A без `ui-style-guide-base.md` + соответствующих `ui-style-guide-<kind>.md` файлов. Coder в Stage F будет изобретать визуальный / интерфейсный язык на лету — палитру, типографику, paddings, API conventions, error formats — без shared reference. Результат: непоследовательный UI / API, accessibility-долг, повторные переделки.
- Реализовывать UI / API фичу в Stage F без cross-ref'а в feature spec'е на соответствующий `ui-style-guide-<kind>.md` или existing design system продукта.
- В feature/rework modes фича вводит **новый UI-паттерн или API convention**, не описанный в existing design system — без обновления design system'а через отдельный PR.

**Почему:** на одном из ранних prod-run'ов template'а Stage A был закрыт без формализованного UI guide (он не был в чек-листе). При начале первой UI-фичи AI попытался сделать визуальный дизайн без shared reference — палитра, шрифты, spacing «как у всех». Получился generic результат, не отражающий operator-vision. Plus accessibility / dark theme / responsive были treated как «доделаем потом» — задержали merge feature PR на сутки cleanup'а.

**Архитектура файлов — per-ui-form split.** `ui_kind` в `.bootstrap-state.md` определяет какие файлы пишутся:

- `ui-style-guide-base.md` — **всегда обязателен** (8 фундаментальных принципов, brand voice, i18n, accessibility общая, frameworks-first, общий checklist)
- `ui-style-guide-<kind>.md` — **per каждому значению в `ui_kind`** (multi-value поддерживается)

Поддерживаемые kinds: `web` / `native-mobile` / `native-desktop` / `tui` / `cli` / `embedded` / `backend`.

**Composition examples** (canonical source: `_templates/ui-style-guide-base.md.tmpl` § intro composition matrix; копия здесь для удобства AI при чтении AP — при изменениях обновлять оба места):

| Тип продукта | `ui_kind` | Какие файлы пишутся |
|---|---|---|
| Full-stack web product | `web, backend` | base + web + backend |
| Mobile app с собственным backend | `native-mobile, backend` | base + native-mobile + backend |
| CLI tool с server-side | `cli, backend` | base + cli + backend |
| Pure API product | `backend` | base + backend |
| Local-only CLI | `cli` | base + cli |
| Cross-platform с backend | `web, native-mobile, backend` | base + web + native-mobile + backend |

**Backend rules применяются** к любому продукту с backend частью — даже если основной user-facing kind другой. Frontend UX начинается с backend design (latency / idempotency / structured errors / live delivery).

**Mode-aware применение:**

| Mode | ui-style-guide-*.md |
|---|---|
| **new-product mode с UI / API** | **Обязательно** в Stage A: base + per каждому ui_kind. Без них Stage F фичи **запрещено** начинать |
| **new-product mode без UI / API** (исключительно library / SDK без runtime) | N/A с reason в `.bootstrap-state.md`. Редкий кейс |
| **feature mode в существующем продукте** | **Не создаём** с нуля. READ existing design system. Если в продукте нет формализованных guides — extract'им неформальные через separate `docs/ui-style-guide-extract` PR |
| **rework mode с изменением UI / API** | READ existing + extend для нового паттерна (отдельный PR в `docs/<doc>-update` ветке) |
| **Lite-mode / bugfix** | N/A — не вводит новых паттернов |

**`ui_kind` определяется на Stage A после vision artifact'а**, не на Init — иногда форма продукта не известна без vision / market research. Default `tbd` в state file на момент Init, fill во время Stage A. Может evolve (additive): добавление нового ui_kind позже — update state + write новый файл.

**Что должно быть в каждом файле** (см. `_templates/ui-style-guide-<kind>.md.tmpl`):

- **base** — 8 принципов, brand voice, i18n discipline, accessibility общая, frameworks-first, conflicts priority, общий checklist
- **web** — палитра + 2 темы, типографика, spacing 8pt, shapes, shadows, icons, animations, breakpoints + functional reformat, responsiveness (Web Workers), instant-apply, in-place errors no-toast, WCAG AA detailed, theme switching, frameworks (Tailwind / Radix), web-specific checklist
- **native-mobile** — platform conventions (HIG / Material 3), system colors + Material You, типографика (SF / Roboto), touch targets (44pt / 48dp), navigation patterns, system integration (haptic / share sheet / notifications), safe areas, gestures, accessibility (VoiceOver / TalkBack), frameworks (SwiftUI / Compose / Tauri), distribution (App Store / Play), mobile-specific checklist
- **native-desktop** — window chrome (traffic lights / caption / CSD-SSD), menu bar (global / in-window), keyboard shortcuts (Cmd vs Ctrl), file dialogs, multi-window, theming с reactive switching, DPI / scaling, accessibility (VoiceOver / Narrator / Orca), system integration (notifications / tray / URL schemes), frameworks (SwiftUI / WinUI / GTK / Qt / Tauri), distribution (signing / notarization), desktop checklist
- **tui** — Unicode box-drawing + ASCII fallback, color (256 / 24-bit / NO_COLOR), monospace typography, keybindings (vim / emacs / arrow), spinners + progress, realtime updates / partial redraw, accessibility (screen reader text mode), config XDG, frameworks (ratatui / Textual / Bubble Tea), compatibility matrix, TUI checklist
- **cli** — command structure (verb / noun), flags (POSIX + universal), exit codes, stdout/stderr discipline, pipe-friendly when non-TTY, --json mode, color (NO_COLOR / isatty), help format + examples + man pages + completions, interactive prompts sparingly, progress, signals (SIGINT/SIGTERM/SIGPIPE), config + env vars, errors с typo suggestions, frameworks (clap / cobra / click), distribution, CLI checklist
- **embedded** — platform groups (watch / panel / ring / e-ink / automotive / IoT / POS / MCU), constraints (display / memory / power / input modalities), minimal information density, large touch targets ≥ 9mm, hardware buttons multi-function, rotary / voice / gestures / haptic, OLED true black, accessibility (large text / haptic redundant), connectivity + sync, frameworks (LVGL / Slint / SwiftUI watchOS / Compose Wear), distribution + OTA, embedded checklist
- **backend** — latency budgets + SLO, async 202 patterns, idempotency + idempotency-key, RFC 7807 errors, bulk operations, live delivery (WebSocket / SSE / webhooks / polling), cursor pagination, resource modeling по user mental model, auth (short access + refresh, scopes, rate limiting), caching contract (ETag), schema evolution (deprecation / sunset), observability outward (metrics / status page / health endpoints / structured logs), discoverability (OpenAPI / AsyncAPI / SDK / sandbox), security baseline (TLS / CORS / validation / no secrets in response), frameworks (Echo / Axum / FastAPI / Hono / Ktor), backend checklist

**Как поступать вместо:**

- В `bootstrap-state.md.tmpl` Stage A checklist — `ui-style-guide-base.md` + `ui-style-guide-<kind>.md per каждому ui_kind`.
- В `project-bootstrap.md` Stage A flow для new-product mode — обязательный шаг: определение `ui_kind` после vision + write base + per-kind files; для feature/rework modes — READ existing.
- В `feature-spec.md.tmpl` NFR — соответствующий per-kind checklist (по форме UI которую фича touches).
- В `reviewer.md` — структурный consistency check (UI / API фича без cross-ref на соответствующий ui-style-guide-<kind>.md → blocking finding).
- В `development-protocol.md` § 11.0 (Stage F readiness) — `ui-style-guide-base.md` + per-kind для new-product mode.

---

## AP-14. Пропуск структурного read-pass'а перед feature spec

**Что нельзя:**

- Драфтить feature spec без явного read-pass'а структурных Stage A-C документов (`user-journeys.md`, `threat-model.md`, `mvp-scope.md`, `topology.md`).
- В feature/rework modes фича вводит новый шаг journey'я / меняет вектор угроз / переносит артефакт между фазами scope'а / добавляет новый компонент в топологию — а feature spec этого не отражает.
- Merge feature spec PR без соответствующих docs PR'ов на затронутые структурные документы.

**Почему:** на одном из ранних prod-run'ов (2026-05-23) AI зафиксировал в feature spec одну архитектуру auth flow (single-secret), а `threat-model.md` описывал другую (two-secret split). Конфликт обнаружили только при ручной сверке оператором — если бы оператор не спросил «а в ранних документах ничего менять не надо?», фича была бы реализована вопреки threat-model, который — legal artifact для compliance / audit. Класс ошибок: AI не сверяет spec против Stage A-C, оператор не открывает Stage A-C при review feature spec'а (по дизайну — Trust profile A не читает код **и не вычитывает foundational docs повторно**).

AP-13 закрывает аналогичный пробел для **операционных / юридических / валидационных** документов (legal-brief, customer-interview-script, incident-runbook). AP-14 закрывает то же самое для **структурных** Stage A-C документов.

**Mode-aware применение:**

| Mode | journey-impact | threat-impact | scope-impact | topology-impact |
|---|---|---|---|---|
| **`new-product`** | автоматически (Stage A-C создаются вместе со Step 1) | автоматически | автоматически | автоматически |
| **`feature`** | Условно (вводит новый шаг / новую персону) | Условно (вводит новые векторы / меры) | Условно (переносит артефакт между фазами / меняет границы v0) | Условно (вводит новый компонент / поток данных) |
| **`rework`** | Условно (rework меняет journey-flow) | Условно (rework меняет threat surface) | Условно (rework меняет scope) | Условно (rework меняет топологию) |
| **`bug-fix` / lite-mode** | Нет | Нет (исключение: security path → full ceremony) | Нет | Нет |

**Foundation-completeness применение** (для legacy adoption):

| `foundation_completeness` | AP-14 read-pass behavior |
|---|---|
| `complete` | Standard full read-pass per выше |
| `partial` | Read-pass на existing docs, **Tier 1 mini-research** для missing (mini-persona / mini-journey / mini-threat-list в feature spec inline) |
| `minimal` | Tier 1 mini-research для каждой фичи; **hard floors** enforce'ятся (security path требует formal `threat-model.md` даже в legacy — нельзя только mini) |
| `none` | То же что `minimal`, plus reviewer downgrades affected checks с tag «adoption-trade-off accepted by operator» (см. AP-22) |

**Критерий «security path»** (для исключения lite-mode → full ceremony): фича или баг касается **хотя бы одного** из:

- Аутентификация / авторизация (login, session, password, 2FA, MFA, OAuth, JWT).
- Криптография (KDF, AEAD, ключи, обёртки, signing, verifying).
- Управление ключами или recipients (key derivation, key rotation, key recovery).
- Хранение PII / sensitive данных (БД-схема, миграции содержащие PII, encryption-at-rest).
- Платежи / биллинг / финансовые транзакции.
- Regulatory surface (152-ФЗ, GDPR, AIFC compliance, audit logging).
- Public-facing endpoints без аутентификации.

Этот список — operational criterion, не на интуиции AI. Если возникает сомнение «security path или нет» — считаем что **да** (fail-safe).

**Решение mode-aware применимости** принимает AI при черновике feature-spec (Stage F Step 1 routine). AI обязан проверить каждый из 4 структурных документов на impact и зафиксировать результат в frontmatter spec'и:

```yaml
journey_impact: yes|no       # фича меняет существующий journey / вводит новый шаг / добавляет персону
threat_impact: yes|no        # фича вводит новые векторы атак / меры защиты / меняет существующие T-/M-IDs
scope_impact: yes|no         # фича переносит артефакты между фазами v0 / Этап 1 / Этап 1.5+ или меняет границы фаз
topology_impact: yes|no      # фича вводит новый компонент / поток данных / зависимость / интеграцию
```

Для каждого `yes` AI обязан в § Approval спеки перечислить требуемые docs PR'ы (например, `docs/threat-model-<topic>`, `docs/user-journeys-<topic>`).

**Как поступать вместо:**

- В `feature-spec.md.tmpl` добавить 4 поля в Impact assessment (рядом с существующими `legal_impact` / `validation_required` / `incident_impact` из AP-13). Полный 7-флаговый frontmatter — см. `_templates/feature-spec.md.tmpl`.
- В `project-bootstrap.md` (subagent) при Stage F handoff обязательный шаг **«structural read-pass»** перед спецификацией: AI открывает 4 документа, формулирует ожидаемый impact, объявляет оператору списком, ждёт подтверждения.
- В `reviewer.md` (Step 7 subagent) добавить **structural consistency check** в чек-лист: если в spec'е `*_impact: yes`, reviewer убеждается, что соответствующий docs PR существует (merged или в той же PR-серии). Если не существует — finding'и `request-changes`.
- В `development-protocol.md` § 11 (Stage F readiness) формализовать AP-14 как обязательный шаг перед Step 1.
- (Опционально, отдельным PR) CI-job, валидирующая frontmatter feature-spec'и и наличие docs PR'ов.

**Что делать если структурного документа физически нет** (актуально для feature mode на legacy-проекте, где, например, `topology.md` отсутствует):

1. AI в Stage F handoff routine останавливается на шаге чтения, объявляет оператору: «документа `<file>` нет в проекте».
2. оператор выбирает из трёх вариантов:
   - **Создать пустой / drafted skeleton** через отдельный docs PR (рекомендуется для long-running проектов).
   - **Отложить фичу** до Stage A-C fill-in (для критичных пробелов — например, нет `threat-model.md` в security-fокусированном продукте).
   - **Marк `*_impact: n/a`** с обоснованием в § Open questions спеки (для legacy-проектов с явным трейд-оффом).
3. Routine не продолжается без выбора оператора — это явное решение, не silent skip.

**Что делать если AI и оператор расходятся по impact-оценке** (например, AI считает impact реальным, оператор говорит «нет»):

- AI имеет право задокументировать disagreement в § Open questions спеки и отметить флаг как `pm-overrode: yes` рядом с `*_impact: no`.
- Reviewer-agent в Секции 0 видит маркер и может re-raise finding, если в коде / структурных документах появляются признаки конфликта.

**Дополнительно — отличие от существующего лёгкого упоминания в lifecycle routing:** в `project-bootstrap.md` уже была фраза «Если фича требует новой persona/journey/threat — предложи отдельный PR docs/<topic>». Это **suggestion**, не **routine**. AP-14 превращает это в обязательный читаемый шаг с frontmatter-маркером, который reviewer-agent физически проверяет.

---

## AP-12. Избыточные англицизмы в project artifacts

**Что нельзя:**

- AI пишет artifacts (vision, personas, spec, plan, review) с обилием англицизмов там, где есть нормальные русские эквиваленты.
- Слова «content», «trigger», «wrap», «envelope», «scope», «boundary», «fork», «edge case», «retention», «grace period», «vacation mode», «check-in», «escalation», «onboarding», «upsell», «viral», «horizon», «use case», «early traction» — используются вместо русских аналогов в проектах с `primary_language: ru`.

**Почему:** На одном из ранних prod-run'ов (2026-05-22) оператор пожаловался «очень много англицизмов, мне тяжело». оператор-менеджер (Persona A) уже работает на максимуме cognitive budget — нагружать ещё и переводом каждого второго слова противоречит learning-layer principle ([[feedback-learning-layer-for-pm]]). Brand voice многих проектов (например, restraint + достоинство) конфликтует с англицизмами-блогизмами.

**Как поступать вместо:**

- На init bootstrap-agent определяет `primary_language` из state (default: русский для русскоязычных проектов).
- В artifacts использовать **русский для общих понятий**, англицизмы только для **established технических терминов**:
  - **Переводим:** scope → рамки, trigger → условие срабатывания, wrap → завёрнутый, content → содержимое, metadata → метаданные, boundary → граница, edge case → крайний случай, escalation → последовательность напоминаний, retention → срок хранения, grace period → льготный период, vacation mode → режим отпуска, onboarding → введение, upsell → допродажа, viral → вирусный, horizon → горизонт, use case → сценарий использования, paranoid mode → параноидальный режим, plaintext → открытый текст, ciphertext → шифротекст.
  - **Оставляем как есть** (стандарт индустрии): MVP, ARPU, KDF, AEAD, Argon2id, WebAuthn, passkey, IndexedDB, OWASP, CWE, ASVS, SemVer, GDPR, PWA, E2E, ADR, TLS, JWT, OAuth, SAST, DAST.
- Если AI не уверен — спросить оператора через AskUserQuestion: «оставить англицизм X или перевести как Y?»
- При обнаружении англицизмы в собственном тексте — паузу, проверить «есть русский эквивалент / понятнее оператору?», если да — заменить.

**Anti-pattern observation:** AI часто выбирает англицизм потому что он короче или потому что это термин из его training data. Это не повод писать `vacation mode` вместо `режим отпуска` — оператор просит русский.

### Область применения и честное признание ограничения модели

Оператор поймал AI **трижды в одной сессии** на том же нарушении (2026-05-22):

1. Сначала в артефактах `strategic-frame.md` и `threat-model.md`.
2. Потом в ответе оператору в чате, в момент извинения за первое нарушение.
3. Потом снова, в продолжении того же обсуждения.

**Корень проблемы — систематический пробел в обучении AI, не случайные ошибки.** AI обучен на огромных объёмах английских технических текстов; «plugin architecture», «multi-region», «pricing matrix», «trust profile» для AI идут как единые термины, не как составные. Это пробел в восприятии, не в знаниях. Клятвы «теперь буду внимательнее» **не работают** — следующее же сообщение содержит англицизмы.

**Принятое решение (2026-05-22):** строгая дисциплина в **формальных частях проекта**, регрессия в чате допускается. Это honest acknowledgement ограничения модели — нет смысла бороться там, где невозможно гарантировать результат без внешнего линтера.

**Строгая дисциплина (на `primary_language: ru` проектах):**

| Где | Дисциплина | Кому адресовано |
|---|---|---|
| Артефакты в `doc/` (vision, personas, threat-model, strategic-frame, spec'и, plan'ы, review'ы, ADR-ы) | **Строгая** (обязательная grep самопроверка перед коммитом) | Любым пользователям AI в проекте — оператору, разработчик, дизайнер |
| Сообщения коммитов (`git commit -m "..."`) | **Строгая** | Всем читателям истории репозитория |
| Описания pull-request-ов | **Строгая** | Всем читателям GitHub/GitLab |
| README, CHANGELOG, документация в репозитории | **Строгая** | Всем пользователям проекта |

**Регрессия допускается (без боя):**

| Где | Подход |
|---|---|
| Ответы в чате с пользователем | Стараться, но не пытаться достичь 100% — это в любом случае не получится |
| Внутренние рассуждения AI (мышление) | Не релевантно |

Где можно использовать англицизм даже в строгой зоне — только из явного белого списка (см. ниже). Всё остальное — переводить.

**Перед каждым `git commit` doc-файла на `primary_language: ru` AI обязан запустить самопроверку:**

```bash
# Mandatory grep перед commit'ом любого doc-файла
grep -oiE "\b(launch|content|trigger|wrap(ped)?|envelope|scope|boundary|fork|edge case|retention|grace|vacation|check-in|escalation|onboarding|upsell|viral|horizon|use case|paranoid|plaintext|ciphertext|client-side|server-side|cohort|hardening|adversar(ies|y)|delivery|payment provider|deployment|cross-jurisdictional|incident response|compliance|backup|hint|content-agnostic|pricing|front-loaded|contingency|ongoing|runway|pool|coverage|sandbox|kick-off|production-ready|foundational|working|distribution|constraints|phases|mitigations?|threats?)\b" <файл>.md | sort -u
```

Если найдено больше 3 непереведённых терминов (исключая стандартные технические термины из белого списка ниже) — **остановиться, исправить, повторить grep**, и только потом коммит.

**Если найдена сломанная русская грамматическая конструкция (например, «запуск'а», «launch'ом», англо-русский гибрид) — это явный сигнал что был sed-pass или невнимательность. Переписать раздел заново, не точечно править.**

**Перед каждым ответом в чате оператору на `primary_language: ru` проектах** — мысленно прогнать тот же фильтр. Если в черновике ответа есть «mandatory», «check», «defect», «obvious», «excuse» и подобные — заменить на «обязательный», «проверка», «нарушение», «очевидный», «отговорки».

**Белый список (оставляем как есть, стандарт индустрии):**
`MVP, ARPU, KDF, AEAD, Argon2id, WebAuthn, Passkey, IndexedDB, OWASP, CWE, ASVS, SemVer, GDPR, PWA, E2E, ADR, TLS, HSTS, CT, JWT, OAuth, SAST, DAST, RCE, CDN, VPS, MITM, DDoS, DNS, AIFC, DPA, ToS, CSAM, CCPA, KZT, RUB, EUR, USD, CRM, IFA, PII, API, CI, IP, RF, EU, KZ, UK, US, npm, git, grep, sed`.

Не в белом списке — переводим всегда в `primary_language: ru` проектах.

---

## AP-11. AI transcribes operator input без critical analysis

**Что нельзя:**

- AI получил оператор ответ на bootstrap / spec question → сразу draft'ит artifact (vision / spec / plan).
- Не ищет противоречий в оператора input. Не задаёт clarifying questions. Не предлагает second opinion.
- AI = stenographer вместо thinking partner.

**Почему:** На одном из ранних prod-run'ов оператор ответил на 3 vision questions с rich content (несколько personas, специфическая архитектура, долгосрочные стратегические цели). AI сразу написал draft без анализа. оператору пришлось напомнить: «а ты не будешь анализировать что я написал? полезно второе мнение». Реальные holes (внутренние противоречия в personas; sustainability продуктовых обещаний при scale; regulatory readiness; архитектурные инварианты + legal exposure) остались unexplored.

Critical analysis полезен **обоим**: оператор при Trust profile A — это **единственный second opinion** AI имеет. Developer (Persona B/C) — пишут код сам, но дыр в концепции не видят лучше оператора.

**Как поступать вместо:**

После любого operator ответа на bootstrap / spec question:

1. **Read carefully** — найди противоречия, gaps, underthought areas, internal conflicts.
2. **Identify 3-5 critical clarifying questions:**
   - Внутренние противоречия (X в primary list, но похожее в "не наша аудитория").
   - Underthought areas (claim X — но что про Y?).
   - Scope/focus (4 personas — реально для v0 или dilutes?).
   - Architectural implications (claim X arch — но edge case Y?).
   - Sustainability (claim X economic — but at scale Y?).
3. **Ask** через AskUserQuestion (discriminators) или text (open-ended). Briefly explain WHY asking each.
4. **Wait for answers.**
5. **THEN draft** artifact, reflecting clarifications.

**Format clarifying questions:** «Я заметил X, и вот тут возможна проблема: <suggest конкретный edge case или conflict>. Это намеренно / есть план / надо обдумать?»

Не «is this OK?» (yes/no), а **constructive challenge** с specific scenario.

---

## AP-10. Invented git author from system context

**Что нельзя:**

- AI запускает `git commit -c user.email=<email>` где `<email>` — это значение из system context (`userEmail`, ENV vars, predicted-likely-email, conversation memory).
- AI «угадывает» git identity вместо чтения git config.

**Почему:** На одном из ранних prod-run'ов AI использовал email из system context (`userEmail` переменная) для коммитов вместо реального git email оператора из локальной конфигурации репозитория. Git history записал фейковый author identity. оператор обнаружил и попросил rewrite через `git rebase --exec "git commit --amend --reset-author"`.

`userEmail` в system context — это **account email для какого-то сервиса**, не git identity. AI взял его как ленивую assumption вместо явного чтения git config.

**Как поступать вместо:**

- Перед любым `git commit`:
  1. **Read `git config --local user.email`** и `user.name` (из repo).
  2. **Если local пуст** — read `git config --global user.email` и `user.name`.
  3. **Если global тоже пуст** — ASK оператора через AskUserQuestion (или предложи оператору set'нуть руками).
  4. **Никогда** не invent email из system context, conversation, или predicted-likely.
- Команда `git commit` запускается **без** `-c user.email=...` и `-c user.name=...` — git сам подтянет из config.
- Pre-commit hook проверяет: `[ -n "$(git config user.email)" ]` — fail с message «Run: git config user.email <your-email>» если не set.

**Bootstrap-agent на init:** добавлен step «Verify git config user.email is set» в Stage 0.

---

## AP-9. State file pre-populated from conversation context

**Что нельзя:**

- Bootstrap-agent создаёт `.ai-pm/.bootstrap-state.md` с frontmatter заполненным **по своему мнению**, на основе того, что обсуждалось в чате до этого момента.
- AI «assumes» Mode / Integration / Trust profile / doc_root / stack / capabilities без явного ответа оператора через AskUserQuestion.
- AI carries over decisions из предыдущей сессии в новый bootstrap.

**Почему:** На одном из ранних prod-run'ов bootstrap-agent pre-populated state file всеми values из conversation, полностью bypass'нув operator-gate. оператор узнал об этом только когда заметил «почему ты не спросил мою роль?». Pre-fill — это **lazy carry-over**, который нарушает AP-3 (operator-gate between stages) и принцип явного approval'а.

Trust profile особенно critical — это **продуктовое решение оператора** (как он хочет работать), не technical default. Pre-filling его означает что AI решил за оператора.

**Как поступать вместо:**

- Bootstrap-agent **никогда** не fills state file values from memory.
- Init flow:
  1. Copy template's `bootstrap-state.md.tmpl` as `.ai-pm/.bootstrap-state.md` — c **pipe-separated options** в frontmatter (unfilled).
  2. AskUserQuestion: Mode? Integration? Trust profile? — 1 call, 3 questions, через UI.
  3. После ответа оператор — записываешь values в state file.
  4. ASK или infer doc_root / stack / capabilities — последние **можно** inferr из Stage A-B answers, но **не из conversation memory**.
  5. ASK о stack явно (или discriminator-questions: «какой основной язык?»).
- Если AI обнаруживает state file с pipe-separated options → flag «state не initialized», запускает question flow.
- Anti-pattern наблюдается, когда AI говорит в чате «I already know from context that mode is new-product...» — это сигнал отказаться и спросить.

---

## AP-8. AI optimizes for technically-correct, не usefully-correct

**Что нельзя:**
- AI пишет фичу, которая technically соответствует spec'у, но не привязана к persona / journey / mvp-scope.
- AI добавляет «полезные» вспомогательные фичи, не упомянутые в spec'е, потому что «логично было бы».
- AI делает refactor'ы окружающего кода во время feature implementation'а, расширяя scope.

**Почему:** В соло-оператор workflow Developer pain — «не знаю что полезно делать» (см. core thesis). Если AI оптимизирует только на code-correctness, проект накапливает technically-perfect features, которые users не используют. Это пустая трата ресурсов соло-оператор, у которого ограниченный budget.

**Как поступать вместо:**

- Spec-discipline catalogue § 9 enforce'ит: `mvp-scope-no-orphans`, `spec-references-persona`, `spec-references-journey`. Каждая фича привязана к persona + journey + F-ID.
- В planner'е (Step 2) **Архитектурный подход** должен явно объяснять, какой шаг какого journey фича обслуживает. Если не получается explain — фича premature или мis-scoped.
- В coder (Step 4) — strict adherence to plan. Никакие добавочные «вспомогательные фичи».
- Reviewer (Step 7) — flag findings о scope drift как `[question]` для оператора.
- Lite-mode (bugfix / small-fix) — exception где scope = «narrow fix», но не «opportunity to refactor».

---

## Растёт по мере опыта

Каждый prod-run добавляет новые anti-patterns. Когда AI или оператор ловят паттерн, который явно «так не надо» — фиксируют здесь с конкретным случаем как доказательством.
