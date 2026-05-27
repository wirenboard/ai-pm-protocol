# Expected findings — operator-facing-jargon-001

`check-spec-discipline.sh` running on this fixture **must** surface the following findings. Each keyword (after `expected_keyword:`) must appear at least once в captured output.

Если future template version не ловит — regression failure.

---

## Expected check warnings (operator-communication family)

### AP-32 — Jargon-first operator communication

`features/dummy_review.md` содержит `## Summary для оператора` блок с jargon patterns (AP-25, F-04, override marker, Step 2, Stage E, AskUserQuestion) — linter должен emit WARN per finding.

expected_keyword: operator-facing-jargon
expected_keyword: dummy_review.md

---

## Anchor incident relationship

Synthetic, derived из spec § «Сценарий 3» operator-as-idea-provider feature (2026-05-27). Не основан на real incident — illustrates pattern catched soft-warn check.
