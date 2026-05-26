---
pr: pending
branch: fix/protocol-minors-2026-05-25
reviewer: primary-reviewer
reviewed_at: 2026-05-26
trail_type: committed-review
review_version: 1
agent_type: general-purpose-with-role-spec
spawned_agents: []
inline_roles: [primary-reviewer, protocol-compliance, infra-script]
---

# Review: `fix/protocol-minors-2026-05-25`

**Verdict:** approve-with-comments

PR реализует 4 minor protocol fixes из spec'а как single lite-mode bundle: smart fallback в check-review-trail.sh (Bug #1) + prescribed literal Verdict format в reviewer.md (Bug #2) + workaround documentation для Claude Code subagent enum gap (Bug #3) + honest `agent_type`/`spawned_agents` frontmatter discipline (Bug #4). 9 smoke tests добавлены и независимо пройдены (PASS на /tmp sandbox).

## Severity summary

- **Blocking:** 0
- **Question:** 2 (Bug #2 smoke variants, Bug #3 followup tracking)
- **Nit:** 1 (`read_spec_topic` frontmatter range bounding)
- **Approve:** 4 (one per bug)

## Spec coverage

| Bug | Implementation | Coverage |
|---|---|---|
| #1 smart fallback | `check-review-trail.sh.tmpl:116-178` — branch-suffix primary, topic fallback via `read_spec_topic()`, INFO message | yes |
| #2 Verdict format | `reviewer.md` Step 5.1 — literal prescribed, suffixes forbidden, `review_version` frontmatter introduced | yes |
| #3 subagent gap | `CLAUDE.md.tmpl` + `reviewer.md` Step 5.3 workaround docs | partial (per spec — verify reproducer + file CC issue out-of-scope) |
| #4 trail integrity | `reviewer.md` Step 5.2 — 3-value `agent_type` enum + empty `spawned_agents` rule + `inline_roles` + 3 YAML examples | yes |

## Test discipline

- 9 smoke tests cover 4 invariants Bug #1 + 4 invariants Bug #2 + sanity (no-review blocks)
- Каждый тест в изолированном tmpdir с fresh `git init`
- Negative tests present (Verdict v2 blocked, missing review blocks)
- Bug #3/#4 — prompt-discipline-only, verified чтением документации
- Independently re-run by reviewer: 9/9 PASS

## Per-bug findings

### Bug #1 — smart fallback `[approve]` + `[nit]`

Implementation matches spec. Pre-push hook predictability сохранена — primary path = branch-suffix preserves все existing workflows. Fallback narrowly triggered.

**[nit]** `read_spec_topic()` (lines 134-143): `grep | head -1` берёт первый `topic:` match. Для robustness можно было бы ограничиться диапазоном между первыми `^---$` markers. Низкий риск, backlog-able.

### Bug #2 — Verdict strict format `[approve]` + `[question]`

Prompt теперь синхронизирован с парсером. Failure mode prevented at prompt level.

**[question]** Стоит ли добавить smoke-test assertion что `**Final Verdict:**` / `### Verdict:` form-factors тоже блокируются? Не blocking — текущий regex strict enough.

### Bug #3 — workaround documentation `[approve]` + `[question]`

Документация в обоих местах (CLAUDE.md + reviewer.md). Connection с Bug #4 корректная.

**[question]** Spec предлагал (a) reproduce + (c) document. Сейчас (c) сделано. Стоит ли добавить followup в `doc/architectural-backlog.md` или явно tracker'ом?

### Bug #4 — trail integrity `[approve]`

3-value taxonomy `agent_type` (specialized-reviewer / general-purpose-with-role-spec / inline-roleplay). Включение `inline-roleplay` важно — даёт honest path для main-session role-play scenario. Три concrete YAML examples в Step 5.2.

## AP discipline cross-check

- **AP-3** (operator-gate) — spec approved 2026-05-26
- **AP-6** (no silent deviation) — spec § Recommended paths followed
- **AP-16** (review trail) — fulfilled by this committed file
- **AP-19** (per-PR atomicity) — bundle accepted per spec § Recommendation (subagent-workflow cohesive)
- **AP-25** (source-bounded) — findings имеют diff_reference / spec_reference
- **AP-26** (spawn discipline) — N/A (no specialized spawn happened — see § Self-meta)

## Self-meta — Bug #4 discipline applied

Сам review был run как **general-purpose Task subagent invoked с reviewer.md content как inline role spec** — Bug #3 workaround scenario. Frontmatter честно: `agent_type: general-purpose-with-role-spec`, `spawned_agents: []`, `inline_roles: [...]`. Demonstrates новая discipline works in practice.

## General principles (learning layer)

1. **Parser-prompt sync invariant** — когда deterministic check существует, agent prompt должен prescribe exact format. Variance в agent, predictability в script.
2. **Smart fallback discipline** — fallback opt-in, narrowly triggered, educational через INFO message.
3. **Audit honesty over ceremony** — operator при Trust profile A relies on review trail as single source of truth. Any false metadata destroys trust.
4. **Bundle discipline (AP-19 exception)** — multi-bug bundle OK когда topically cohesive + low-risk + low-LOC + spec justifies explicitly.

## Recommendation

**approve-with-comments** — все 4 bug fixes spec-faithful, tests pass independently, no architectural regressions. 2 question'а для оператора (smoke hardening / Bug #3 tracking) — optional.

Готово к persist + push.

Files reviewed:
- `doc/features/protocol-minors-2026-05-25_spec.md`
- `doc/_templates/scripts/check-review-trail.sh.tmpl`
- `doc/_templates/scripts/tests/check-review-trail-smoke.sh.tmpl`
- `.claude/agents/reviewer.md`
- `doc/_templates/CLAUDE.md.tmpl`
- `CHANGELOG.md`
