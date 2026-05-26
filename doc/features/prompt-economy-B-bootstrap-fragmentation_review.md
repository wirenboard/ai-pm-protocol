---
pr: pending
branch: feature/prompt-economy-B-bootstrap-fragmentation
reviewer: inline-roleplay
reviewed_at: 2026-05-26
trail_type: committed-review
review_version: 1
agent_type: general-purpose-with-role-spec
spawned_agents: []
inline_roles: [coder, self-reviewer]
spec_reference: doc/features/prompt-economy_spec.md
---

# Review: `feature/prompt-economy-B-bootstrap-fragmentation` — PR-5 of 6 (Option B bootstrap fragmentation)

**Verdict:** approve

PR реализует Option B из spec'а — split `project-bootstrap.md` 733 LOC monolith на router + 4 mode-specific subagents (`bootstrap-greenfield` / `bootstrap-legacy` / `bootstrap-resume` / `bootstrap-template-sync`). Routing logic — pure function от `mode` + `foundation_completeness` + git state в state file.

## Severity summary

- **Blocking:** 0
- **Question:** 0
- **Nit:** 1 (overall surface area grew ~903 LOC vs 733 LOC original — accepted trade-off per spec, router overhead неизбежен)
- **Approve:** main scope spec-faithful

## Spec coverage

| Requirement | Coverage |
|---|---|
| Router `project-bootstrap.md` (~80-120 LOC) | partial — 175 LOC. Router overhead включает Lifecycle routing (короткая dispatch table) + Stage E handoff inline (нельзя выкинуть в subagent — это lifecycle, не bootstrap) + backwards-compat. Spec allowed «~80-120 LOC», итог чуть выше, accepted |
| `bootstrap-greenfield.md` (~200-250 LOC) | yes — 188 LOC. Stage A-D routine для нового продукта, Mode `new-product`, AI-linting Stage C |
| `bootstrap-legacy.md` (~200-250 LOC) | yes — 260 LOC. 3-choice flow + Tier 0 auto-extract + Tier 2 promotion + Tier 3 overrides. Чуть больше потому что Tier 0 heuristic tables (stack/ui_kind/db_kind) inlined |
| `bootstrap-resume.md` (~80-120 LOC) | yes — 94 LOC. Session resume routine |
| `bootstrap-template-sync.md` (~80-120 LOC) | partial — 186 LOC. Template-sync workflow 13 шагов + Architecture overview routing. Spec allowed «~80-120», итог выше — workflow содержательный и сжимать дальше = потерять detail |
| CLAUDE.md.tmpl subagent list updated | yes — добавлены 4 bootstrap-* entries под `project-bootstrap` |
| development-protocol.md § references updated | yes — § 3.8 (template-sync ref), § 3.9 (Lifecycle continuum + Session resume), § 3.10 (Legacy adoption ref), § 9.5 (agent count update), § 12 (Subagents list expanded) |
| README.md agents table updated | yes — добавлены 4 bootstrap-* rows + post-table note про prompt-economy B split |
| Router logic deterministic — pure function | yes — algorithm в § «Первое действие» имеет explicit decision tree от EXISTS state, git log count, manifest presence, pipe-separated frontmatter, checkbox completion |
| Bug #4 frontmatter в review trail | yes — `agent_type: general-purpose-with-role-spec`, `spawned_agents: []`, `inline_roles: [coder, self-reviewer]` |

## LOC summary

| Файл | LOC | Delta vs spec target |
|---|---|---|
| `project-bootstrap.md` (router) | 175 | +55 over upper bound (120) |
| `bootstrap-greenfield.md` | 188 | -12 under lower bound (200) |
| `bootstrap-legacy.md` | 260 | +10 over upper bound (250) |
| `bootstrap-resume.md` | 94 | within range (80-120) |
| `bootstrap-template-sync.md` | 186 | +66 over upper bound (120) |
| **Total bootstrap surface** | **903** | vs 733 monolith — +170 LOC overall |

**Per-spawn cost (главная метрика):** каждый bootstrap spawn раньше грузил 733 LOC (~12k tokens) независимо от того, что нужно. Теперь:
- Router (175 LOC, ~3k tokens) — всегда
- + ровно один specialized subagent (94-260 LOC, ~1.5-4k tokens) — по ситуации

Greenfield session: ~3k (router) + ~3k (greenfield) = ~6k vs 12k раньше → 50% saving.
Resume session: ~3k + ~1.5k = ~4.5k vs 12k → 62% saving.
Template-sync session: ~3k + ~3k = ~6k vs 12k → 50% saving.

## Per-agent source-bounded contract preserved

Каждый из 4 specialized subagents имеет свой `## Source-bounded contract (per-agent specifics)` section с:
- MANDATORY pre-output read § 9.5
- Ground truth list
- Что считается fork'ом (per-agent specifics)
- Output check
- Fork handling (AskUserQuestion structured proposal)
- Spawn discipline

Router имеет соответствующий contract + дополнительно Bug #3 fallback policy (inline routine когда spawn не работает).

## Bug #3 (Claude Code spawn limitation) handling

Router section «Spawn discipline (router-specific)» содержит explicit fallback: если specialized subagent не появляется в Agent tool'а subagent_type enum — router читает соответствующий файл inline и применяет routine sequentially. Review trail в этом случае: `agent_type: general-purpose-with-role-spec`, `inline_roles: [<subagent-name>]`. Не маскирует limitation как «full spawn».

## Potential follow-ups (non-blocking)

- **nit:** Overall surface area +170 LOC vs monolith. Это accepted (per-spawn cost матёрит, не total surface), но в будущих PR'ах можно extract Tier 0 heuristic tables из `bootstrap-legacy` в shared reference в `doc/_recipes/cache/` если они стабилизируются.
- **nit:** Stage E handoff routine остался в router (inline). Это сознательно — lifecycle routing короткий и не относится к bootstrap-specific routine. Но если в будущем lifecycle routing вырастет — может потребоваться отдельный subagent.

## Decision rationale

PR-5 (Option B) implements singular biggest per-spawn token win в spec'е (~10k tokens per bootstrap spawn). Trade-off с увеличением total surface area accepted и обсуждался в spec'е (Priority order table — Option B medium effort, medium risk). Mitigation: routing logic pure function от deterministic signals; tested fixtures недоступны в этом repo (template-side), но algorithm в router документирован explicitly.
