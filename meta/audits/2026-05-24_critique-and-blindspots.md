# Critique and blindspots — логические дыры в наших же выводах (2026-05-24)

**Scope:** devil's-advocate анализ против собственных выводов из `2026-05-24_competitive-landscape.md` и `2026-05-24_complexity-honesty.md`. Цель — зафиксировать слепые зоны до того, как они станут implementation-level проблемами.

**Method:** systematic challenge каждого ключевого assumption'а в двух исходных audit'ах. Поиск holes в **обосновании**, не в выводах.

**Trigger:** оператор спросил «не делаем ли мы всё верно, нет ли логических дыр» после согласования Paths A/B/C + advisor + mitigations.

---

## 1. Меряем feature count, а не outcomes

**Что предполагали:** наши 7 уникальных опор — competitive advantage.

**Что не так:** ни разу не задались вопросом «**а ускоряет ли фреймворк shipping продукта на самом деле?**» Нет ни case study, ни метрик, ни сравнения «команда А с фреймворком vs команда B без». Все выводы — «у нас X, у них нет X». Feature comparison, не outcome comparison.

**Риск:** возможен сценарий, где фреймворк создаёт **иллюзию прогресса** (артефакты заполнены) при **замедленном shipping** (продукт не выходит). Мы бы не узнали — нет инструментов измерить.

**Что делать:** хотя бы 1-2 self-experiment'а с метриками time-to-PR / time-to-merge на текущем фреймворке vs «голый Claude Code». Без этого все выводы — теоретические.

**Severity:** ★★★★★ (подрывает обоснование существования фреймворка)

---

## 2. Игнорируем «никакой фреймворк» как baseline

**Что предполагали:** сравниваемся с BMAD / Spec Kit / OpenSpec / Agent OS / Kiro.

**Что не так:** реальная альтернатива для **большинства builder'ов** — никакого фреймворка, просто чат с Claude. Это самый популярный «аналог», и мы его не анализировали ни разу.

**Риск:** наша Layer 0 пытается conпeting с OpenSpec (4 артефакта vs 4 артефакта), но настоящий benchmark — «**4 артефакта vs 0 артефактов**». OpenSpec тоже проигрывает «ничему», просто меньше, чем мы.

**Что делать:** добавить «no-framework baseline» в карту аналогов в `competitive-landscape.md`. Возможно, ответ — «мы для тех, кто **уже страдает** от хаоса без фреймворка», и тогда позиционирование другое: не «smart SDD», а «recovery from chat-driven chaos».

**Severity:** ★★★★☆ (methodological gap в анализе, легко закрыть, но меняет positioning)

---

## 3. Phantom user в PM-asymmetry нише

**Что предполагали:** PM без tech intuition + AI development — наша уникальная аудитория, никем не покрытая.

**Что не так:** **кто эти люди реально?**
- PM-ы без tech background обычно **делегируют** разработку, а не учат фреймворки.
- PM-ы, которые лезут в код — обычно с tech-фоном (profile A, не B/C).
- Те самые «коллеги по цеху», ради которых строилось — могут быть **выборкой из одного-двух человек** автора.

**Риск:** мы оптимизируем под нишу, которую не верифицировали. «Уникальное решение для несуществующей проблемы» — классическая ошибка solo-builder'ов.

**Что делать:** опросить 5-10 реальных PM-ов из разных компаний: «использовали бы вы такое для shipping кода с AI?» Если ответ «нет, я просто прошу разработчика» — ниша мнимая, repositioning needed.

**Severity:** ★★★★★ (подрывает обоснование одной из главных уникальных опор)

---

## 4. Path B предполагает, что операторы будут «карабкаться по слоям»

**Что предполагали:** Layered minimal mode (Layer 0 → Layer 4) — operators climb когда нужно.

**Что не так:** в реальности operators **остаются там, где начали**. Если Layer 0 работает — никогда не доберутся до Layer 2. Discipline-advisor должен подталкивать, но его сигналы легко игнорировать («not now, busy»).

**Риск:** мы спроектируем фреймворк, где **все навсегда останутся на Layer 0**, и «уникальные опоры» (Stages A-E, composition matrices, AP discipline, per-kind UI) станут **декоративными** — фигурируют в документации, никем не используются. Это same trap as feature flags, которые никто не enable'ит.

**Что делать:**
- Advisor должен **escalate**, не просто recommend (с увеличивающейся severity со временем).
- Skip'ы должны иметь **deadline-driven re-prompts** (operator подтвердил skip Stage B 3 месяца назад — заново валидируй).
- Иначе Layer 0 = вся продукция, и фреймворк превращается в OpenSpec с лишней документацией.

**Severity:** ★★★☆☆ (implementation-level риск, mitigable advisor-дизайном)

---

## 5. Discipline-advisor — vaporware, на которую мы проецируем выводы

**Что предполагали:** advisor с evidence-based рекомендациями = killer feature, репозиционирует нас vs всех остальных.

**Что не так:** **он не существует.** Все выводы «After-implementation проекции» в `competitive-landscape.md` опираются на то, что advisor работает хорошо. Но:
- **Bad advisor recommendations хуже, чем no advisor** (false confidence).
- Cost-bounded scan (10 sample files) может пропускать критичные сигналы.
- Нет track record, что LLM могут делать stage-selection точно — это classification task, на котором LLM часто галлюцинируют.

**Риск:** мы продаём (себе и второму Claude'у) проекцию выгод от **unbuilt tool**. Если advisor accuracy окажется < 70%, он создаёт **больше проблем**, чем решает.

**Что делать:** в plan'е реализации — **доказательство концепта** на 3-5 реальных проектах ДО того, как advisor become mandatory. Минимальная accuracy gate: 80% на test set из known-correct stage selections. Если ниже — отказаться, оставить static quiz (deterministic floor работает без LLM-judgement).

**Severity:** ★★★★☆ (после-имплементационный риск, можно завалидировать prototype'ом)

---

## 6. AP-инварианты — self-imposed values, не engineering laws

**Что предполагали:** AP-3 / AP-19 / AP-20 — discipline floor, не подлежит обсуждению.

**Что не так:** **почему?** Потому что мы так решили. Operator-gate как hard rule — это **ценностный выбор**, а не закон физики. Operator'ы, которые думают «AP-3 меня замедляет» — могут быть **правы для своего контекста**:
- Personal weekend project → operator-gate add'ит friction без upside.
- Throwaway prototype → atomicity ломает momentum.
- Solo session 1 час → reviewer routing — overkill.

**Риск:** мы prescribe **values** под видом **engineering invariants**. Это morally similar to «true Scotsman» argument — кто не следует AP-3, тот «not really using the framework». Это **dogma**, а не engineering.

**Что делать:** хотя бы документировать **trade-off'ы** AP-инвариантов явно: «когда AP-19 не нужен», «когда AP-3 vredит». Сейчас они представлены как **абсолюты** — это не честно. Каждый AP должен иметь:
- Зачем введён (incident / observation, который к нему привёл).
- Когда применим (default).
- **Когда не применим** (explicit exceptions с reasoning).

**Severity:** ★★★☆☆ (философско-этическая проблема, не technical; но важна для долгосрочной credibility)

---

## 7. Оптимизируем под текущее состояние AI-агентов

**Что предполагали:** AI агенты теряют context, требуют prompt-инжиниринга, следуют инструкциям, нуждаются в structured artifacts для grounding.

**Что не так:** через **12-18 месяцев** многое из этого может измениться:
- Longer context (1M → 10M → бесконечный).
- Persistent memory (memory tool уже work-in-progress).
- Better grounding (less hallucination, лучше следование instructions).
- Real-time collaboration с агентом (вместо session-based interaction).

Большая часть нашего фреймворка решает проблемы **late-2025 AI**, которых может не быть к late-2027.

**Риск:** мы строим **Maginot line**. Decisions, обоснованные технологическими ограничениями момента, могут стать obsolete до того, как фреймворк наберёт аудиторию.

Конкретные artefacts, которые могут deprecate:
- **Foundational doc loading** — если AI помнит проект между сессиями, foundational layer теряет смысл.
- **Multi-subagent architecture** — если single agent имеет 10M context, fan-out не нужен.
- **`.ai-pm/` persistent state** — если у agent'а есть memory tool, state — duplicate.

**Что делать:** разделить **timeless invariants** от **AI-state-specific decisions**:
- Timeless: operator authority, atomicity, review discipline, PM-asymmetry framing, composition decomposition.
- AI-state-specific: foundational loading, subagent fan-out, `.ai-pm/` state, prompt templates.

Первое — фундамент. Второе — может deprecate, и это надо явно документировать как «зависит от текущего state AI-агентов».

**Severity:** ★★★☆☆ (долгосрочный риск, не immediate, но влияет на стратегию)

---

## Сводная таблица severities

| # | Дыра | Severity | Тип | Mitigation cost |
|---|---|---|---|---|
| 1 | Нет outcome data | ★★★★★ | Methodology | Средняя (2 self-experiments) |
| 2 | No-framework baseline проигнорирован | ★★★★☆ | Methodology | Низкая (добавить в audit) |
| 3 | Phantom user в PM-asymmetry | ★★★★★ | Validation | Средняя (5-10 интервью) |
| 4 | Layer-climbing assumption | ★★★☆☆ | Implementation | Низкая (advisor escalation) |
| 5 | Advisor — vaporware | ★★★★☆ | Implementation | Средняя (PoC + accuracy gate) |
| 6 | AP-инварианты как dogma | ★★★☆☆ | Philosophy | Низкая (docs trade-off'ов) |
| 7 | AI-evolution risk | ★★★☆☆ | Strategy | Низкая (разделить timeless / AI-specific) |

---

## Какие дыры самые опасные

**Дыры 1 (нет outcome data) и 3 (phantom user)** — подрывают **обоснование самого существования** фреймворка. Если фреймворк не ускоряет shipping и не решает реальную боль реальных PM-ов — мы построили внутренне согласованную систему, которая никому не нужна.

**Дыры 4-7** — implementation/positioning risks. Решаются инкрементально, не блокирующие.

**Дыра 2 (no-framework baseline)** — methodological gap, легко закрыть в следующем pass'е competitive-landscape.

---

## Грубый вывод

Мы построили **внутренне согласованную систему**, но **не валидировали её против реального мира**. Сравнение с другими фреймворками — это сравнение интерьеров комнат, когда не проверили, есть ли в доме хоть один жилец.

Все выводы предыдущих двух audit'ов — **conditional** на двух недоказанных premise'ах:
1. Фреймворк действительно ускоряет shipping (не verified).
2. Целевая ниша (PM-asymmetric multi-stack discipline) реально существует и востребована (not verified).

Если хотя бы одно из этих неверно — все выводы про positioning / consolidation / advisor нерелевантны. Сначала надо закрыть дыры 1 и 3, потом возвращаться к Paths A/B/C.

---

## Рекомендация

**Не начинать имплементацию Paths A/B/C до закрытия дыр 1 и 3.**

Concrete next steps (последовательно, не параллельно):

1. **Дыра 1 → self-experiment.** Взять 2 одинаковые micro-фичи. Одну сделать через полный Stage F с фреймворком. Вторую — голым чатом с Claude. Замерить: время до first PR, время до merge, количество iterations, finally — quality (bugs caught later). Decision gate: если фреймворк не даёт ≥ 20% improvement on outcome metrics — repositioning required.

2. **Дыра 3 → user research.** Опросить 5-10 PM-ов (не друзей-разработчиков). Вопрос: «как вы сейчас работаете с AI на технических задачах?» Если ответ доминирующий «прошу разработчика» — phantom user confirmed, asymmetry-pillar — irrelevant. Если ≥ 2/10 говорят «хотел бы делать сам, но боюсь» — ниша реальна.

3. **Дыра 2 → дополнить competitive-landscape.** Добавить «no-framework baseline» в карту, посчитать honest delta (наш Layer 0 vs goyl chat).

4. **Дыры 4-7 → отметить в plan'ах Paths A/B/C** как known limitations, mitigation — incremental.

---

## Open questions для оператора

- **Готов ли провести 2 self-experiment'а** (дыра 1) до начала имплементации? Это ~2-3 дня работы.
- **Есть ли доступ к 5-10 реальным PM-ам** для интервью (дыра 3)? Если нет — как иначе валидировать нишу?
- **Готов ли пересмотреть AP-инварианты** как trade-off'ы, а не абсолюты (дыра 6)? Это меняет brand'инг фреймворка с «discipline» на «опции с reasoning».
- **Соглашаешься, что некоторые decisions обусловлены текущим AI-state** (дыра 7), и должны быть document'ированы как deprecate-candidate?
