# readme-rewrite — plan

Source: PM-directed 2026-06-04 — "ридми в проекте очень устарело и содержит мусор: миграции тут а не во внешнем файле, не описан путь нового проекта с нуля и в целом страшно".

*Documentation rewrite of the protocol's own `README.md` — the marketing-level front door (Russian; `WORKFLOW.md:1` calls it "a friendlier overview of the protocol"). Three concrete PM complaints: (1) a full v1.x→v2.0 **migration is inlined** in the README (≈42 lines of `git mv` steps) instead of living in the external `MIGRATIONS.md`; (2) the **zero-to-first-feature path for a brand-new project is not described** as a path; (3) the document is **cluttered / intimidating** — 315 lines, three overlapping update/migration sections, a flat 25-bullet risk list, everything front-loaded.*

Meta-feature on the template repo: **software-kind**. The README is non-code, PM-facing front-door documentation owned by `pm-architect` (the same owner as the README front-gate migration and `docs/product.md`). Every scenario subject is the README / a newcomer reading it — but the artifact is the protocol's own marketing doc, not a downstream user-facing runtime feature → no Product Contract, no product-readiness advocate gate, no `## Validation` gate (Pass-2 is `code-review` / editorial). Verification = editorial + clean-grep (install commands still valid; no broken internal links; `tests/hooks.sh` 71/71 — no hook touched).

## Scenarios

1. **Install is near the top; a newcomer meets a quickstart with BOTH onboarding paths.** Per PM direction: **`## Установка` moves up** (right after the one-paragraph intro), since it is the first thing a reader executes. Immediately after it, a **Quickstart** presents **two paths, both fleshed out**:
   - **(a) Новый проект с нуля (greenfield)** — say **«начни проект»** → Claude runs the bootstrap Q&A (product, stack, project-kind, decision-authority) → it scaffolds `docs/` + `CLAUDE.md` + the operational `.ai-pm/` tree → ready for the first feature.
   - **(b) Существующий / легаси проект (per PM — currently missing)** — point Claude at an existing codebase; the two `/pm-bootstrap` legacy modes are described as a real path, not a one-liner: **Быстрый старт** (reads the minimum, scaffolds draft docs with `[?]` gaps, work immediately) vs **Полное документирование** (Claude reads the whole codebase, reconstructs `docs/architecture.md` + `docs/user-journeys.md`, PM only validates — after which the project can be ported to a new stack). This legacy-onboarding path is the gap the PM flagged: today the README mentions it in one line; the rewrite gives it equal weight to greenfield.

2. **Migrations are referenced, not inlined.** The inline v1.x→v2.0 migration (the `git mv` step-list) is **removed** from the README; upgrading is one short section that points to `MIGRATIONS.md` and the "just say «обнови шаблон»" path (the v2.2+ automation already does this). The README states the *what* (the template auto-migrates on bump; the catalogue lives in `MIGRATIONS.md`), never the *how* (no procedure steps inline) — single-source for migration procedures, mirroring the protocol's own move-not-copy discipline.

3. **The three overlapping update/migration sections become one.** Today `## Обновление шаблона`, `## Миграция с v1.x на v2.0`, and `## Миграция между версиями (v2.2+)` overlap. The rewrite consolidates them into a single **"Обновление шаблона"** section (the symlink bump + the copy-mode re-copy for SFS installs, both kept) with one pointer to `MIGRATIONS.md` for version migrations.

4. **The risk list is strongly cut (PM-confirmed "сильно сократить").** The 25-bullet "Какие риски шаблон снижает" is reduced to the **5–7 most important risks, one line each**; the remainder is deferred to `WORKFLOW.md` (and the agent docs) by a single pointer ("полный перечень дисциплин — в `WORKFLOW.md`"). Maximally un-scary. Candidate keepers (pm-architect's final call): code-diverges-from-plan, concurrent-bugs, technical-bugs-through-review, existing-behavior-breaks (contracts), under-defined-product (advocate), silent-prod-edits, decision-authority two modes — collapsed to one tight line each. The cut is **deferral to the canonical source**, not loss: nothing the README drops is unrecorded (it all lives in `WORKFLOW.md` / `.claude/agents/*`).

5. **Canonical README shape (PM-articulated): что это → зачем → как поставить → подробности → лицензия.** Final order (PM-confirmed, revised — since the risk list is now short, it moves UP as the "why"): one-paragraph **Интро** (*что это*) → **Какие риски снижает** (*зачем* — the strongly-cut 5–7-line list, moved up right after the intro) → **Установка** (*как поставить* — submodule + symlinks + SFS copy variant + `/clear`) + **Quickstart** (the two getting-started paths: greenfield «начни проект» / legacy existing-codebase onboarding) → **Подробности**: **Как это работает** (the three flows, tightened) → **Обновление шаблона** (→ `MIGRATIONS.md`, consolidated) → **Что остаётся за PM** → **Структура шаблона / downstream-проекта** → **Лицензия**. The genuinely useful current content — the install commands, the `/clear` note, the two-mode decision authority, the `## Project kind` documentation-flavor note, the structure trees — is **reorganized, not deleted**. *(This canonical what→why→install→details→license shape is the seed of a separate follow-up feature — bake it into `doc/_templates/README.md.tmpl` + a discipline so every downstream README follows it; out of scope here, see Out of scope.)*

6. **Accurate + current.** Version-specific staleness is fixed: no "migrate to v2.0" as a headline path (the template is at v2.25.0); the autonomous decision-authority description matches the shipped behavior (incl. that routine procedural gates announce-and-proceed in autonomous mode, v2.24.0); the structure trees match the current `.claude/` + `.ai-pm/` + `doc/` layout.

## Existing behaviors this feature touches

(what must not break)

- **The install commands** (`## Установка` — submodule + symlinks, and the SFS copy variant + `/clear` note) — must stay byte-accurate; they are the one part of the README a reader executes. Reorganized, not changed in substance.
- **Internal links** — `WORKFLOW.md`, `MIGRATIONS.md`, `.claude/agents/*`, `docs/*` references must all still resolve.
- **`WORKFLOW.md:1`'s description of the README** ("friendlier overview … Russian, marketing-level") — the rewrite stays at that altitude (PM-facing, product language), defers exact rules to `WORKFLOW.md` by reference, and does not duplicate canonical orchestration rules.
- **The README front-gate discipline** (the README is the front door; capability claims live in `docs/product.md` downstream) — this is the *template's own* README, not a downstream project's; the rewrite keeps it an overview-of-the-protocol, not a duplicated capability list that could drift.
- **No downstream impact** — this is the template repo's own `README.md`; downstream projects carry their own. No template structural change, no migration.

## Contracts

None. Documentation rewrite of the repo's own front door. No API, data shape, or downstream-consumed artifact.

## Interaction scenarios

Provably isolated: a single-file documentation rewrite (`README.md`) — no runtime, no shared state, no concurrent operations, no I/O, no other artifact depends on the README's prose (only its existence + internal links, which are preserved).

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep, the same as every prior meta-feature.*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged; no hook touched).
- New tests: none. Verification instead:
  - **Editorial walkthrough** — the rewrite matches Scenarios 1–6: greenfield quickstart present and first; no inline migration procedure (only a pointer to `MIGRATIONS.md`); one consolidated update section; grouped risk list; newcomer-first order; no version staleness.
  - **Clean-grep — no inline migration steps:** the README no longer contains a `git mv`/`mkdir` migration step-list; migration is referenced via `MIGRATIONS.md` only.
  - **Clean-grep — install commands intact:** the symlink install, the SFS copy variant, and the `/clear` note survive verbatim (or with only reorganization).
  - **Clean-grep — links resolve:** every `WORKFLOW.md` / `MIGRATIONS.md` / `docs/*` / `.claude/*` reference points at a real target.
  - **Clean-grep — no capability-list drift:** the README stays an overview, not a second capability statement that could drift from `docs/product.md` (front-gate discipline).
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none.

## Docs to update

- `README.md` — the full rewrite (Scenarios 1–6), authored by **`pm-architect`** (front-door owner): newcomer-first structure, greenfield quickstart added, inline v1.x→v2.0 migration removed in favor of a `MIGRATIONS.md` pointer, the three update/migration sections consolidated into one, the risk list grouped + tightened, version staleness fixed — preserving the install commands (symlink + SFS copy + `/clear`), the decision-authority two-mode + autonomous-procedural-gates note, the project-kind note, and the structure trees.
- *(No `MIGRATIONS.md` change required — the v2.2+ automation already references it; the ancient v1.x→v2.0 manual steps are legacy and covered by the "say «обнови шаблон»" path. If `pm-architect` judges the v1.x→v2.0 procedure worth preserving for the record, it goes into `MIGRATIONS.md`, never back into the README — but this is optional and out of the critical path.)*
- *(No template / agent / `CLAUDE.md` / hook change — README-only.)*

## Out of scope

- **Downstream projects' READMEs** — untouched; this is the template repo's own front door. The README front-gate migration that reconciles a *downstream* README against `docs/product.md` is a separate, already-shipped mechanism.
- **`WORKFLOW.md` / `MIGRATIONS.md` / agent docs** — not rewritten; the README references them, it does not duplicate or restructure them.
- **Re-populating `MIGRATIONS.md` with the v1.x→v2.0 procedure** — optional (`pm-architect`'s call), not required; the critical path is removing it from the README, not preserving it elsewhere.
- **Adding new capabilities or changing protocol behavior** — none; this is a documentation rewrite only. Every described behavior must match the shipped protocol (no aspirational claims).
- **English translation of the README** — out; the README is deliberately Russian (marketing-level, PM-facing), per `WORKFLOW.md:1`. Only the on-disk technical artifacts are English-canonical.
- **Baking the canonical README shape into the protocol** — PM idea 2026-06-04 ("идея для ЛЮБОГО ридми: что это / зачем / как поставить / подробности / лицензия … можно прямо в протокол вшить"). This slice only *applies* that shape to the protocol's own README; **establishing it as a downstream discipline** — restructuring `doc/_templates/README.md.tmpl` to the canonical what→why→install→details→license skeleton + a `pm-architect` authoring rule (and optionally a light `pm-auditor` structural check) so every downstream project's README follows it — is a **separate follow-up feature** (the next pick).
