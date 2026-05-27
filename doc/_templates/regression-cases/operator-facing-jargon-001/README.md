# Regression case: operator-facing-jargon-001

**Class:** AP-32 — jargon-first operator communication. Agent открывает escalation в operator-facing блоке `_review.md` / `_plan.md` с internal IDs (AP-NN / F-NN / override markers / step references / Stage X) вместо business-language reformulation.

**Anchor incident reference:** synthetic — derived из spec § «Сценарий 3: anti-pattern — jargon-first escalation» (operator-as-idea-provider feature, 2026-05-27).

## What this fixture tests

Synthetic case с одним файлом:
- `features/dummy_review.md` — synthetic `_review.md` artifact с явным AP-32 violation внутри `## Summary для оператора` блока:
  - Цитирует `AP-25 fork`, `F-04 invariant`, `[source-bounded-override: ...]`, `Step 2 plan`, `Stage E`, `AskUserQuestion` — все six jargon patterns которые linter должен поймать.

Если future template version не ловит хотя бы один — regression failure.

## Expected behavior

Run `bash scripts/check-spec-discipline.sh --regression` (with `REGRESSION_CASES_DIR=doc/_templates/regression-cases`):

Expected output keywords (см. `expected_finding.md`):
- `operator-facing-jargon` — finding должен surface в output

Linter работает на warning level (soft-warn per AP-32) — finding появляется как `WARN: operator-facing-jargon: ...` в stderr, не блокирует CI.

## How this differs from cross-doc-drift-001

- cross-doc-drift-001 проверяет Layer 2 source-bounded family (содержание artifacts).
- operator-facing-jargon-001 проверяет form/voice of operator-facing блоков (как формулируется communication).

Это разные axes — могут срабатывать independently на одном PR.
