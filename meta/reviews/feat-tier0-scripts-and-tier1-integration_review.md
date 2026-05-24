---
pr: TBD
branch: feat/tier0-scripts-and-tier1-integration
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-24
trail_type: committed-review
spawned_agents: N/A (scripts + agent prompts + template)
---

**Verdict:** approve

PR3 of 4-PR plan. Tier 0 auto-extract scripts (orchestrator + 6 per-aspect) + Tier 1 mini-research integration в `feature-spec.md.tmpl` + foundation_completeness awareness в `planner.md` / `coder.md` / `reviewer.md`.

# Coverage

## A. Tier 0 auto-extract scripts (NEW directory `doc/_templates/scripts/auto-extract/`)

- ✅ `extract-stack.sh.tmpl` — manifest detection (package.json / pyproject.toml / Cargo.toml / go.mod / etc.) с support для composite stacks + JSON output mode
- ✅ `extract-ui-kind.sh.tmpl` — heuristic via package deps (Node/Python/Go/Rust/Flutter) для web/native-mobile/native-desktop/tui/cli/backend; multi-value support
- ✅ `extract-db-kind.sh.tmpl` — heuristic via deps (sqlite/pg/mongo/Prisma schema reading) для embedded/external/none; auto-detect provider в Prisma config
- ✅ `extract-topology.py.tmpl` — Python stdlib (no deps) FS walk + import graph (TypeScript/Python). Top-level dirs + dependencies edges. Standard ignores (node_modules, .git, etc.). Output `topology.md` skeleton с auto-extracted marker
- ✅ `extract-ui-style.py.tmpl` — extract CSS variables (`:root { --* }`), Tailwind config (colors/spacing/screens/fontFamily), design token packages в deps. Output `ui-style-guide-base.md` skeleton
- ✅ `extract-database-design.py.tmpl` — Prisma schema parser (datasource + models + enums) с fallback на SQL migrations DDL. Detect identifier strategy (uuid/serial/integer). Output `database-design-{kind}.md` per db_kind
- ✅ `extract-all.sh.tmpl` — orchestrator: invokes все 6 scripts; supports `--read-only` mode для architecture-overview keyword routing (writes consolidated extract в `meta/architecture-extract-<date>.md`, не trigger adoption)
- ✅ Scripts executable (chmod +x на .tmpl files preserved через template copy)

## B. Tier 1 mini-research integration в `feature-spec.md.tmpl`

NEW section после `## Контекст`, перед `## User stories`:

- ✅ Mini-foundation sections wrapper (только при `foundation_completeness: minimal | none | partial`)
- ✅ Explicit conditions «когда нужны / когда не нужны»
- ✅ **Mini-persona** (5-min) — имя/роль / контекст / цели / pain points
- ✅ **Journey context** — existing flow before / с этой фичей / triggers / success outcome
- ✅ **Mini-threat-list** — hard floor для security path; T-mini-N entries с mitigation + Standard
- ✅ Cross-ref to Tier 2 promotion (consolidation candidates)
- ✅ User stories section updated — persona sources clarified (project-wide vs mini-persona)

## C. Foundation awareness в subagents

### planner.md
- ✅ Input section: `foundation_completeness` + `adoption_path` reads added
- ✅ NEW «Foundation awareness» section — table per state (complete/partial/minimal/none) → откуда читать foundation для plan'а
- ✅ Plan architectural approach references — adapt cross-refs (full project-wide artifacts vs mini sections в spec'е)
- ✅ Learning layer preserved независимо от foundation state
- ✅ Quality note для `!= complete` («ниже-quality cross-refs, promotion recommended»)

### coder.md
- ✅ NEW «Foundation awareness» section перед Trust profile awareness
- ✅ Statement: implementation discipline не меняется, меняется только source of foundational context
- ✅ Cross-ref на mini sections в spec'е вместо missing project-wide docs

### reviewer.md
- ✅ NEW «Step 1.4: Foundation state detection — adapt cross-checks» (между existing Step 1 и 1.5)
- ✅ Table per `foundation_completeness` → AP-14 / AP-15 / spec sources behaviors
- ✅ `adoption_overrides` handling — downgrade affected findings к `[question]` с tag `adoption-trade-off accepted by operator`
- ✅ Surface override list в review summary

## D. project-bootstrap.md updates

- ✅ Tier 0 routine — added implementation reference («scripts в `scripts/auto-extract/`, orchestrator `extract-all.sh`»)
- ✅ Invocation patterns documented per use case (Quick full / read-only / Staged individual / Skip stack-only)

## E. bootstrap-state.md.tmpl Stage E checklist

- ✅ Added checkbox: «auto-extract scripts generated» — Stage E теперь генерирует actual scripts из `_templates/scripts/auto-extract/*.tmpl`

# Cross-cutting findings

## Spec coverage

PR3 covers все PR3 scope items из plan file:
- Tier 0 auto-extract scripts (7 files в `scripts/auto-extract/`) ✅
- feature-spec.md.tmpl mini-* sections (Mini-persona / Journey context / Mini-threat-list) ✅
- Planner/coder/reviewer awareness of foundation_completeness ✅

NOT covered (deferred к PR4):
- `check-spec-discipline.sh` state-aware logic (read foundation_completeness, downgrade certain checks)
- Reviewer downgrade per adoption_overrides — implemented в prompt, но enforcement через CI script — PR4
- Tier 2 promotion routine implementation (described в project-bootstrap PR2, full implementation в PR4)

## Plan adherence

Соответствует Phase 2 PR3 scope в plan file.

## Test discipline

Manual verification scripts:
- ✅ Shell scripts use `set -e` для fail-fast
- ✅ Python scripts use stdlib only (no pip install needed — critical для works в any environment)
- ✅ Defensive parsing (try/except, fall-through, default values)
- ✅ Output format consistent: stdout = result, stderr = progress/diagnostics
- ✅ Operator marker `<!-- Auto-extracted YYYY-MM-DD. Refine manually. -->` в каждом extracted artifact
- ✅ Standard ignores (node_modules / .git / build / dist / etc.)

## Security / architecture

- ✅ Scripts read-only — никаких destructive operations
- ✅ Output paths derived from state file `doc_root` (не hardcoded)
- ✅ `--read-only` mode для architecture-overview не trigger state changes
- ✅ Temp files cleanup на --read-only path (avoid leaking)

## Code hygiene

- ✅ Shell scripts AP-12 safe (English variable names, Russian comments wrapped)
- ✅ Python scripts PEP 8 style, no external deps
- ✅ Cross-refs consistent (project-bootstrap.md ↔ extract-all.sh)

# Protocol compliance

- ✅ AP-1: нет ADR
- ✅ AP-3: scope утверждён operator
- ✅ AP-6: scope formalized in plan + design doc
- ✅ AP-12: scripts use English variable names + Russian comments (AP-12 safe)
- ✅ AP-16: этот trail
- ✅ AP-17: clean (нет product names)
- ✅ AP-19: mixed scope authorized per consolidation directive (Tier 0 scripts + Tier 1 template + agent awareness — все relate к foundation_completeness implementation)
- ✅ AP-22: foundation overrides handling implemented в reviewer

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Backlog для PR4

- check-spec-discipline.sh state-aware logic
- Adoption overrides enforcement в CI script
- Tier 2 promotion routine full implementation (consolidation logic)
- Documentation migration phase scripts (helper для template-sync Phase 3)
