---
topic: dummy
mode: feature
review_kind: regression-fixture
---

# Review: dummy feature

## Findings (technical, internal)

- Plan structure OK.
- Tests cover Gherkin scenarios.

## Summary для оператора

Plan почти готов, но обнаружил AP-25 fork в Step 2 plan'а — coder предлагает добавить компонент `recovery-coordinator` который покрывает F-04 invariant из Stage E spec'а, но без proper spec_reference frontmatter поля.

Чтобы продолжить — нужен `[source-bounded-override: <reason>]` marker в HEAD commit body, иначе linter family source-bounded fail'ит на ADR-0014.

Можно также вместо override — заюзать AskUserQuestion с fork-justification protocol, тогда operator_approved timestamp закроет вопрос на Step 7 reviewer pass'е.

Какой путь выбираем?
