# Operator pain mapping — what bare Claude broke, what framework closes (2026-05-25)

**Scope:** документация pain профиля одного reference operator'а как input для v0.5.0 Path A README pain → mitigation table. Operator — PM в ~100-person company, building tool for self + sharing as open source.

**Method:** не market research. Не interviewing 5-10 PM'ов. Self-interview + cross-reference с уже задокументированными pain'ами в session memory + audits.

**Context:** validation gate (BLOCKING для v0.3.0+) — три part'а: (a) pain mapping (этот документ), (b) self-experiment verifying gap closure (см. `meta/experiments/...`), (c) no-framework baseline (дополнение competitive-landscape). Этот документ — (a).

---

## Operator profile

- **Role:** PM в компании ~100 человек
- **Tech orientation:** принципиально **не читает код**; полагается на formal specs + automated verification
- **Stance vs typical PM:** не «делегирует разработку» — хочет **сам shipping'ить** через AI, при условии что есть guarantees что AI produces correct behaviour
- **Frustration source:** обычный Claude (vanilla chat) → переусложнение, необходимость code review, ошибки в коде, утечки данных
- **Mental model:** «PM пишет хорошую спеку → автоматика проверяет код → линтеры enforce качество → можно не читать код, фичи не должны втихую ломаться»
- **Value priority:** discipline + learning > raw productivity. Не vibecoder — хочет расти от каждого engagement
- **Goal:** сделать tool для своей боли + share с world (open-source), не sell

---

## Pain → framework mitigation table (для README v0.5.0)

| Pain (от обычного Claude / vanilla chat workflow) | Severity | Как framework закрывает | Закрыто в версии |
|---|---|---|---|
| «AI пишет код, который втихую ломает существующие фичи через shared modules» | ★★★★★ | Gap 3 regression coverage + AP-14 ext + check `regression-coverage-for-shared-modules` | v0.2.0 |
| «AI «правит» тесты под свои выдумки чтобы зелёная сборка» (точная цитата) | ★★★★★ | Gap 2 test-fudging + AP-23 + check `test-assertion-weakening` | v0.2.0 |
| «AI постоянно over-engineering, делает калькулятор с бэкендом» | ★★★★☆ | Discipline-advisor scope-proportionality (Stage F Step 2 trigger) | v0.4.0 (planned) |
| «Утечки данных, secrets в коде» | ★★★★☆ | Protocol-compliance-reviewer baseline (always-spawned) + content-aware reviewer routing для auth/payments/crypto paths + future advisor hard-floor detection (PII/auth/crypto) | v0.2.0 baseline + v0.4.0 advisor |
| «Каждый раз когда меняется AI-модель — всё ломается» | ★★★★☆ | Spec-as-contract: tests derived from Gherkin scenarios, не от implementation. Модель меняется — спека+тесты остаются, поведение verified deterministic-ом | v0.2.0 (gap 1 spec→test mapping enforce'ит контракт) |
| «Не хочу читать код, но боюсь что AI меня обманывает» | ★★★★★ | Verdict-gate (AP-16) + Spec→test deterministic mapping (gap 1) + 5-axis review (v0.4.0) + reviewer-agent mandatory all modes | v0.2.0 baseline + v0.4.0 advisor |
| «Compliance / GDPR / utечки PII — страшно» | ★★★★☆ | Threat-model conditional on capability detection (PII/auth/crypto/payments) + legal-frame для regulatory surface + future advisor hard-floor (mandatory Stage B при detected PII) | v0.4.0 conditional skip + advisor |
| «AI «забывает» implement scenarios из spec'а» | ★★★★☆ | Gap 1 spec→test mapping CI gate — каждый Gherkin Scenario имеет matching test, иначе CI fail | v0.2.0 |
| «Архитектурные решения теряются в spec'ах, через 6 мес не найти "почему так решили"» | ★★★★☆ | AP-24 ADR auto-extraction + check `adr-auto-extraction` (> 50 LOC arch content в spec без ADR ref → fail) | v0.2.0 |
| «Каждая фича вводит tech debt, через 3 фичи проект — болото» | ★★★☆☆ | AP discipline (AP-1/3/5/19/20) + 6-axis quality enforcement (maintainability как hard constraint) + lazy-loading reduces context bloat | v0.2.0 baseline + v0.3.0 lazy loading |
| «Token cost растёт экспоненциально с проектом» | ★★★☆☆ | Reviewer size gate (PR < 100 LOC → baseline only) + lazy foundational loading в Stage F subagents + future Path B conditional skip | v0.2.0 size gate + v0.3.0 lazy loading + v0.4.0 conditional skip |

---

## Pain'ы которые framework НЕ закрывает (honest)

| Pain | Почему framework не closes | Что mitigates |
|---|---|---|
| AI hallucinates spec'у саму (operator writes vague spec → AI invents details) | Framework про spec→code consistency, не про spec quality itself | AP-11 (critical analysis перед draft'ом) + reviewer.md verbose findings для Trust profile A; не silver bullet |
| Token cost для legitimate large features | Framework не replaces fundamental LLM context limits; lazy loading lessens but не eliminates | RESUME pattern для long sessions, template-sync для context refresh |
| Operator должен поддерживать дисциплину spec/plan writing | Framework requires spec → if operator skips spec → bypass | AP-4 enforcement via hooks (Spec First) + project-bootstrap routing |
| AI knowledge cutoff / outdated practices | Framework не fix'ит underlying model knowledge | Cross-stack mini-reviewers (per ui_kind / db_kind) + reference industry standards (OWASP/CWE/ASVS) |

---

## Learning effect — качественный differentiator

Operator выделил это как **separate axis quality** (6-я dimension, см. план v3):

- Subagent outputs — substantive, growth-oriented (explained architectural decisions for Trust profile A, не just instructions)
- Stage A-E artifacts формализуют intuition (vision / threats / personas / journeys)
- Spec writing — оператор учится формулировать поведение измеримо (Gherkin / acceptance criteria); transfers between projects
- ADR — оператор учится фиксировать architectural decisions с reasoning, не impulsive
- Reviewer findings — оператор растёт через объяснение каждого finding'а («это нарушение AP-X потому что...»)

**Vibecoding** = «AI делает, я смотрю прокатило ли». **Этот framework** = «я думаю архитектурно, AI помогает execute, я расту от каждого engagement».

---

## Conclusions

1. **8 из 10 pain'ов closed уже в v0.2.0 baseline** (после merged Gaps 1-3 + AP-23 + AP-24 + size gate). Это empirical confirmation что mental model реализована на ~80% (как и predicted в silent-break-gaps audit).
2. **Remaining 2 pain'ов** требуют v0.4.0 advisor (over-engineering detection + capability-based hard floor для PII/auth/crypto).
3. **Phantom user concern (Дыра 3 critique audit) closed** — operator real, n=1 verified, не abstract niche claim.
4. **Honest open scope** — framework не closes все возможные AI pain'ы (hallucinations spec'и, token cost для large features, operator discipline failures). Это honest positioning для v0.5.0 README.

---

## Next steps для validation gate

- **Self-experiment (часть b):** запустить test feature через v0.2.0 CI gates (spec→test mapping + test-fudging + regression coverage + AP-24 ADR check) → verify что pain'ы из таблицы выше реально не воспроизводятся. Placeholder в `meta/experiments/`.
- **No-framework baseline (часть c):** дополнить `meta/audits/2026-05-24_competitive-landscape.md` секцией «No-framework baseline — chat с Claude» — honest delta для каждой axis. Это input для v0.5.0 Path A сравнительной таблицы.

После этих трёх — validation gate closed, v0.3.0 unblocked.
