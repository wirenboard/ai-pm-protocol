# Anti-patterns — index

Правила «никогда так не делай», выведенные из реального опыта prod-run'ов. Каждое правило фиксирует **что нельзя**, **почему** (с конкретным случаем) и **как поступать вместо**.

С v0.8.0 (Option C granularization) каждый AP живёт в отдельном файле `doc/anti-patterns/AP-NN.md` — агент читает только релевантный AP, не весь каталог. Текущий файл — index/table-of-contents.

---

## Note on trade-off documentation (v0.3.0+ direction)

AP-инварианты — **opinionated defaults**, не engineering laws. Каждый AP имеет:

- **Default scope** (когда применим без обсуждения — most cases)
- **Edge cases** (когда не применим — explicit exceptions с reasoning)

**Текущий status:** AP-22 / AP-23 / AP-24 (v0.2.0 additions) уже структурированы в этом формате (Что нельзя / Почему / Решение / Relationship). Для AP-1 .. AP-21 trade-off дополнения вводятся **инкрементально** — добавляются при возникновении real edge case'ов через v0.4.0+. Это **honest признание** что framework состоит из values (когда применять discipline), не absolute engineering laws.

---

## Каталог

| ID | Заголовок | Severity | Domain | Status |
|---|---|---|---|---|
| [AP-1](anti-patterns/AP-01.md) | ADR пишется реактивно, не упреждающе | high | process | active |
| [AP-2](anti-patterns/AP-02.md) | Никаких repo-скелетонов до первой feature spec | high | stage-a | active |
| [AP-3](anti-patterns/AP-03.md) | Stage'ы проходятся последовательно, с operator-gate | high | process | active |
| [AP-4](anti-patterns/AP-04.md) | Specification First — без исключений | critical | process | active |
| [AP-5](anti-patterns/AP-05.md) | Tests First для нового кода | high | testing | active |
| [AP-6](anti-patterns/AP-06.md) | AI не отклоняется от plan'а молча | critical | process | active |
| [AP-7](anti-patterns/AP-07.md) | Документы — living artifacts, но с разной частотой ревизий | medium | foundation | active |
| [AP-8](anti-patterns/AP-08.md) | AI optimizes for technically-correct, не usefully-correct | high | process | active |
| [AP-9](anti-patterns/AP-09.md) | State file pre-populated from conversation context | high | bootstrap | active |
| [AP-10](anti-patterns/AP-10.md) | Invented git author from system context | high | git | active |
| [AP-11](anti-patterns/AP-11.md) | AI transcribes operator input без critical analysis | high | bootstrap | active |
| [AP-12](anti-patterns/AP-12.md) | Избыточные англицизмы в project artifacts | low | language | deprecated |
| [AP-13](anti-patterns/AP-13.md) | Пропуск operational / legal / validation артефактов | high | stage-b | active |
| [AP-14](anti-patterns/AP-14.md) | Пропуск структурного read-pass'а перед feature spec | high | stage-e | active |
| [AP-15](anti-patterns/AP-15.md) | UI-фичи без Stage A `ui-style-guide-*` foundation | high | ui | active |
| [AP-16](anti-patterns/AP-16.md) | PR создан / merged без зелёного review-trail | critical | review | active |
| [AP-17](anti-patterns/AP-17.md) | Утечка product-specific имён в template | high | template | active |
| [AP-18](anti-patterns/AP-18.md) | Unsafe deploys / migrations без rollback guarantee | critical | deploy | active |
| [AP-19](anti-patterns/AP-19.md) | Per-PR atomicity — один PR = один domain | high | review | active |
| [AP-20](anti-patterns/AP-20.md) | Domain section routing — единый reviewer, inline sequential pass | medium | review | active |
| [AP-21](anti-patterns/AP-21.md) | Бесконечный rework без exit condition | medium | process | active |
| [AP-22](anti-patterns/AP-22.md) | Adoption-override без declared trade-off | high | adoption | active |
| [AP-23](anti-patterns/AP-23.md) | Test assertion weakened без declared behaviour change | critical | testing | active |
| [AP-24](anti-patterns/AP-24.md) | Architectural decisions buried in spec без ADR | high | adr | active |
| [AP-25](anti-patterns/AP-25.md) | AI artifact extends beyond source | critical | source-bounded | active |
| [AP-26](anti-patterns/AP-26.md) | Orchestrator architectural injection | critical | source-bounded | active |

## Растёт по мере опыта

Каждый prod-run добавляет новые anti-patterns. Когда AI или оператор ловят паттерн, который явно «так не надо» — фиксируют здесь с конкретным случаем как доказательством.

Новый AP добавляется как `doc/anti-patterns/AP-NN.md` (NN — следующий sequential номер) + строка в таблицу выше. Frontmatter обязателен: `id`, `status` (active/deprecated/superseded), `severity` (critical/high/medium/low), `domain` (свободный tag).
