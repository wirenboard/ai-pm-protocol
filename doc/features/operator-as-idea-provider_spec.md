---
topic: operator-as-idea-provider
mode: feature
lite-mode: no
created: 2026-05-26
spec_approved:
plan_approved:
acceptance: pending
merged: no
review_url:
pr_ordering: null
template_version_applied: v0.6.0
spec_reference: doc/development-protocol.md
legal_impact: no
interview_impact: no
incident_impact: no
journey_impact: no
threat_impact: no
scope_impact: yes
topology_impact: yes
---

# Operator-as-idea-provider — interface redesign под PM-only ЦА

**Stage E artifact, Step 1.** Status: draft (реконструкция после потери `/tmp` spec'а).

## Контекст

После сужения ЦА до **PM-only** (PR #64) и формулировки парадигмы «защита от AI-дрейфа + гарантированное выполнение бизнес-обещаний» обнаружилось — текущий operator interface шаблона **не соответствует ЦА**:

- Шаблон требует от PM понимания плана / ADR / технических альтернатив. PM не должен это читать.
- Каждый agent на каждом шаге пытается educate'нуть PM о технических деталях (verbose learning layer).
- Routing-tables и keyword-mapping предполагают что PM знает названия агентов и стадий.
- Operator-gates срабатывают слишком часто — PM устаёт и approve'ит не глядя (gate degeneration).

**Тезис:** PM — это **дирижёр верхнего уровня**, который описывает идею и валидирует бизнес-результат. AI делает всё остальное silently, поднимая голову только когда нужен strategic decision.

## Three-level architecture

| Уровень | Кто решает | Что обсуждается |
|---|---|---|
| **Strategic** | Operator (PM) | Стек, архитектура, бизнес-логика, security floor |
| **Tactical** | AI silent | План реализации, ADR alternatives, decomposition, tests strategy |
| **Implementation** | AI silent | Код, тесты, модули, refactoring choices |

PM **видит только** Strategic-уровень. Tactical и Implementation не показываются по умолчанию — доступ on-demand через explicit operator request.

## Operator escalation triggers (когда AI обязан спросить)

AI silently работает до тех пор, пока не наткнётся на одно из:

1. **Business-logic hole** — спека не покрывает реальный сценарий, AI не может довывести без operator input.
2. **Business-affecting fork** — архитектурный выбор влияет на видимое поведение / user flow / pricing.
3. **Stack-affecting decision** — новая зависимость / migration / отказ от existing component.
4. **Security floor triggered** — `check-security-floor.sh` срабатывает.
5. **Cross-feature contradiction** (Layer 3) — изменение в F-N нарушает invariant'ы F-M.
6. **Cost / time threshold exceeded** — реализация уходит за лимит из spec'а / `mvp-scope.md`.

Все остальные decision'ы (Tactical и Implementation) AI принимает без operator-gate.

## 6 plain-language rules (operator-facing communication)

Все agent'ы при общении с PM соблюдают:

1. **Concrete first, abstract second** — пример раньше определения.
2. **No jargon без immediate definition** — если нельзя без термина, объяснение через 1 предложение.
3. **Tables followed by «что специфично»** — после таблицы — какие строки реально применяются здесь.
4. **Verification question в конце** — «правильно понял что X?» вместо «надеюсь понятно».
5. **Никаких abstract names** (Q1/Q2/Q3, опция A/B/C без короткого user-recognizable названия).
6. **Internal IDs (F-04, AP-25)** — никогда в operator-facing message. Только user-recognizable descriptions («recovery flow», «source-bounded discipline»).

## Новый AP-29: Jargon-first operator communication

**Что нельзя:** agent открывает диалог с PM терминами из протокола (`Step 2.5 reviewer`, `AP-27 hallucinated component`, `Layer 2 cross-doc bounded`) без объяснения. PM выключается на третьем термине.

**Failure mode:** AI cleanly выполняет Tactical+Implementation, но при escalation спрашивает «нужен `[source-bounded-override]` marker?» — PM не понимает вопроса, approve'ит наугад, gate degeneration.

**Как поступать вместо:** при escalation — formulate question в business / behaviour terms. «Можно ли восстановить аккаунт если пользователь потерял пароль И device?» вместо «AP-25 fork в spec'е: alternative D затрагивает recovery flow без spec_reference, нужен override?»

## Failure modes — текущий шаблон vs new model

| Текущий шаблон (до фичи) | После фичи |
|---|---|
| Каждый Step 2 plan показывается оператору | Plan скрыт, оператор видит только Strategic-affecting parts |
| Каждый ADR — operator-gate | ADR silent если в Tactical-domain (e.g., file layout); operator-gate только при stack/business-affecting |
| Agent объясняет каждый change rationale | Default terse (см. prompt-economy F); rationale только при escalation |
| Routing-tables ждут от PM keyword'ов | Agent читает intent, сам routing'ит, спрашивает только при ambiguity |
| Reviewer findings показываются list'ом из 20 пунктов | Reviewer summarize'ит верхнеуровнево; full list на request |

## Scope изменений

**In scope:**

- Новый раздел в `development-protocol.md` — «Operator interface model» (Three-level + 5 triggers + 6 rules).
- Обновить все 5 agent prompt'ов (`.claude/agents/*.md`) — secton «Operator-facing tone» с rules + escalation thresholds.
- Добавить AP-29 в `doc/anti-patterns/` (после prompt-economy C granularization файлов).
- Обновить `CLAUDE.md.tmpl` — короткая секция «PM-facing communication» со ссылкой на rules.
- Update `keyword-routing.md` — убрать operator-typed-keyword предположения, добавить intent-detection примеры.
- Examples в `_claude/operator-facing-examples.md` — terse/verbose pairs для каждого agent'а.

**Out of scope:**

- Tactical-level decisions persistence для audit (отдельная фича audit-trail-enhancement).
- Multi-PM workflow (текущий шаблон assumes single PM).
- Voice / chat UX выходящий за text-based assistant.

## NFR

- Operator-facing message length: median ≤ 100 слов на confirmation tasks; ≤ 300 слов на escalation.
- Plain-language rules — checkable: `check-operator-communication.sh` grep'ит на internal IDs / abstract names в operator-output.
- AP-29 violations — soft fail в reviewer-agent (не CI block).

## Сценарии

**Сценарий 1: routine feature implementation (silent path)**
1. PM описывает: «нужна возможность для пользователя экспортировать данные в CSV».
2. AI silent: пишет spec, plan, ADR (если fork есть), код, тесты.
3. AI поднимает голову один раз: «спека готова, business invariant — экспортируем только данные текущего user'а, не shared. Подтверждаешь?»
4. После approval — silent до acceptance: «фича готова, могу провести test scenarios или закрыть acceptance?»

**Сценарий 2: escalation на business-affecting fork**
1. PM описывает фичу.
2. AI обнаруживает forking decision: «хранить export'ы временно на сервере для async download, или генерировать в браузере?»
3. Это business-affecting (server hosting → cost / GDPR, browser → performance limit). Escalation.
4. AI спрашивает в business terms: «Большие export'ы (>100MB) можем готовить 5-10 минут на сервере с временной ссылкой (требует хранилище + cleanup), либо мгновенно прямо в браузере с ограничением 50MB. Какой компромисс?»
5. PM выбирает. Дальше silent.

**Сценарий 3: anti-pattern — jargon-first escalation (AP-29 catch)**
1. AI обнаруживает source-bounded fork в plan.
2. AI спрашивает: «`adr-decision-component-bounded` fail на ADR-0013, нужен `[source-bounded-override]`?»
3. Reviewer ловит AP-29 в _review.md → request-changes.
4. AI переформулирует: «компонент `recovery-coordinator` в плане не описан в спеке — это новая идея, или я неправильно понял что спека покрывает? Если новая — стоит описать в спеке отдельно, чтобы не размывать F-current».

## User stories

- Как PM, я хочу описать фичу одним абзацем и получить готовый PR, не читая plan/ADR/код.
- Как PM, я хочу что AI задавал мне только те вопросы которые требуют моего бизнес-решения.
- Как PM, я хочу понимать вопрос AI'я без необходимости знать термины протокола.
- Как PM, я хочу видеть короткие confirmation'ы по умолчанию и подробный rationale только когда сам спрошу.

## Не в scope

- Замена operator-gate механизма на pull-based query (operator-asks-AI).
- Removal of approve markers — они нужны для audit.
- Изменение AP-3 (operator-gate at every stage) — gate'ы остаются, но triggers пересматриваются.

## Open questions

- Где грань между «business-affecting» и «Tactical» fork? Нужен ли explicit list, или judgement-based?
- Нужен ли opt-out для PM который ХОЧЕТ видеть Tactical (verbose mode)?
- AP-29 как soft-fail vs hard-fail в reviewer? Hard может задушить общение.

## Acceptance criteria

- [ ] Все 5 agent prompts содержат «Operator-facing tone» секцию с 6 rules + 5 escalation triggers.
- [ ] AP-29 в `doc/anti-patterns/AP-29.md` с failure mode + examples.
- [ ] `development-protocol.md § Operator interface model` раздел добавлен.
- [ ] `check-operator-communication.sh` существует и flag'ит internal IDs в `_review.md` / `_plan.md` operator-facing блоках (warning-level).
- [ ] Examples-файл `_claude/operator-facing-examples.md` с 6 pairs (terse/verbose per agent).
- [ ] Regression test fixture с примером AP-29 violation, проверяемый через `check-spec-discipline.sh --regression`.
