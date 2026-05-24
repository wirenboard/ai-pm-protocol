# Mode matrix redesign + legacy adoption + template versioning

**Status:** approved, implementation pending
**Date:** 2026-05-24
**Closes:** tasks #48 (template-apply mode), #56 (legacy-partial design)
**Discussion branch:** `design/mode-legacy-partial`

---

## Контекст

Текущие 4 mode'а (`new-product` / `new-feature` / `rework-feature` / `bug-fix`) предполагают что bootstrap либо делается **сейчас** (Mode 1), либо **уже сделан** (Mode 2/3/bugfix). Это не покрывает 2 распространённых случая:

1. **Legacy adoption** — проект существовал ДО шаблона, оператор хочет применить дисциплину без недель retrofit'а.
2. **Template versioning gap** — проект сделан по старой версии шаблона, шаблон ушёл вперёд (типичный случай для multi-month projects на основе шаблона).

Plus два insight'а от operator review:

- **Per-feature scope:** для добавления одной фичи не нужно «разбирательство про аудиторию всего проекта», достаточно research'а на ЦА **этой конкретной фичи**.
- **Auto-extract:** что AI может определить сам (стек, design tokens, schema), пусть определяет — не задавать вопросы оператору о том, что в коде уже есть.

И ключевое — **трейд-офф explicit framework:** оператор сам выбирает между **детализацией документации** на старый проект и **скоростью добавления новой фичи** с ограниченным control'ом. Должен понимать, что выбирает.

**Цель этого design'а:**

- Переосмыслить классификацию modes.
- Добавить foundation-state как orthogonal concept.
- Поддержать legacy adoption через tier'ы (auto-extract / mini-research / promotion / opt-out с trade-off framework).
- Добавить template versioning + sync.

---

## A. Modes (5 linear)

| Mode | Когда | Status |
|---|---|---|
| `new-product` | Greenfield: новый продукт, нет ни кода ни docs | existing |
| `feature` | Новая фича (любое состояние проекта) | renamed from `new-feature` |
| `rework` | Modify existing feature | renamed from `rework-feature` |
| `bug-fix` | Lite variant of `feature` | existing |
| `template-sync` | Bump template version в template-native проекте | **NEW** |

**Rename rationale (`new-feature` → `feature`):** «new-» redundant — все modes в production phase. Greenfield = explicit `new-product`. Legacy first feature = same `feature` mode (с adoption flow), не отдельный mode.

---

## B. Project state — orthogonal concept

В `.ai-pm/.bootstrap-state.md`:

```yaml
foundation_completeness: complete | partial | minimal | none
adoption_path: greenfield | legacy-quick | legacy-staged | legacy-skip | null
template_version_applied: v0.X.Y
adoption_overrides:
  - skip: <component>
    reason: <why>
    accepted-risk: <what breaks>
```

### Семантика полей

| Поле | Что описывает | Значения |
|---|---|---|
| `foundation_completeness` | Глубина AP-14 read-pass requirements | `complete` (full Stage A-D), `partial` (некоторые есть), `minimal` (только auto-extract), `none` (ничего, всё lazy) |
| `adoption_path` | Как проект попал в текущее состояние | `greenfield` (Stage A-E formal), `legacy-quick` (auto-extract), `legacy-staged` (manual select), `legacy-skip` (zero adoption), `null` (для greenfield projects) |
| `template_version_applied` | Какая версия шаблона применена | SemVer (e.g. `v0.2.0`) |
| `adoption_overrides` | Declared trade-offs | List с reason + accepted-risk |

---

## C. Greenfield entry → `new-product` mode

Без изменений. Stage A-E formal. После Stage E closed:
- `foundation_completeness: complete`
- `adoption_path: greenfield`

---

## D. Legacy entry — 3-choice через AskUserQuestion

При first session в проекте без `.ai-pm/`, project-bootstrap detect'ит legacy и явно представляет оператору **3 варианта** с trade-off objяснениями (Quick первым, **recommended**):

### Choice 1: Quick auto (5-10 min, recommended)

Что делает AI автоматически:
- Tier 0 auto-extract (см. § F)
- Stage E infrastructure: CI hooks (Layer 2), git hooks (Layer 4), branch protection (Layer 5)
- Создаёт `.bootstrap-state.md` с:
  - `foundation_completeness: minimal`
  - `adoption_path: legacy-quick`
  - `template_version_applied: v0.X.Y` (latest)

**Trade-off (explained to operator перед choice):**
- Pro: «быстрый старт, шаблон применён через 5-10 минут»
- Con: «первая фича каждого нового domain'а потребует Tier 1 mini-research (persona / journey / threat — 10-30 min на фичу). AP-14/15/18 enforce'ы limited до момента когда foundation заполнится»

### Choice 2: Manual staged (часы-дни)

Что делает AI:
- AskUserQuestion multi-select: «Какие Stage A-E artifacts адаптировать сейчас?»
  - Stage A: personas / user-journeys / competitive-analysis / brand-voice / ui-style-guide
  - Stage B: threat-model / mvp-scope / strategic-frame / legal-brief
  - Stage C: topology / foundational ADRs
  - Stage D: ai-linting-rules / dev-environment / database-design
  - Stage E: infrastructure (always required)
- AI extracts baseline + ведёт через formal Stage process для выбранных artifacts
- Создаёт state с:
  - `foundation_completeness: partial` (если не все Stage A-D) или `complete` (если все)
  - `adoption_path: legacy-staged`

**Trade-off:**
- Pro: «полный AP-14 enforcement сразу после adoption, standard workflow без per-feature overhead»
- Con: «часы-дни upfront. Может быть невозможным если нет capacity сейчас»

### Choice 3: Skip adoption (sub-minute)

Что делает AI:
- Только absolute minimum:
  - `trust_profile` (AskUserQuestion)
  - `stack` (auto-detected, no question)
  - Stage E hooks (обязательно — без них AP-16 enforcement не работает)
- Создаёт state с:
  - `foundation_completeness: none`
  - `adoption_path: legacy-skip`

**Trade-off:**
- Pro: «zero upfront. Можно сразу приступить к первой фиче»
- Con: «каждая фича требует mini-research для context. AP-14/15/18 enforce'ы limited. Reviewer downgrades certain checks за accepted trade-off»

### Hard floor — что нельзя skip даже в Choice 3

- **Stage E infrastructure hooks** — без них AP-16 review enforcement soft, AI может open PR без trail. Critical для дисциплины.
- **`trust_profile`** — без него agents не знают как общаться (verbose vs terse output).
- **`stack`** — без него нельзя ai-linting-rules или security catalogue.

Если оператор настаивает на skip даже этих — explicit `adoption_overrides` с reason + accepted-risk (см. § H).

---

## E. Architecture overview — standalone keyword routing

**Use case:** оператор хочет picture of проекта **без trigger'а adoption** — например, для onboarding нового dev, или чтобы решить какой adoption path выбрать.

**Mechanism:** project-bootstrap routing matrix extension:

| Operator intent (keyword) | Routing |
|---|---|
| «составь архитектуру проекта» / «architecture overview» / «extract topology» / «опиши проект» | Tier 0 auto-extract read-only pass → output `meta/architecture-extract-<date>.md` (template repo) или `doc/architecture-extract-<date>.md` (product). **НЕ меняет state**, **НЕ trigger'ит adoption** |

**Output content:** stack / `ui_kind` / `db_kind` / topology sketch / ui-style summary / database-design summary. Plain markdown с метаданными (file paths, deps, schema).

---

## F. Tier 0 — auto-extract (instant, AI без вопросов)

**Что AI делает автоматически:**

| Field | Source | Method |
|---|---|---|
| `stack` | `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `Gemfile` / `requirements.txt` | Read manifest, identify primary language |
| `ui_kind` | Heuristic из package deps | React/Vue/Svelte/Angular → `web`; React Native/Flutter → `native-mobile`; Electron/Tauri → `native-desktop`; CLI deps (commander/click/cobra) → `cli`; backend deps (express/fastapi/gin) → `backend` |
| `db_kind` | Heuristic из package deps | sqlite/better-sqlite3 → `embedded`; pg/mysql2/mongodb → `external`; нет DB deps в stateless service → `none` |
| `topology.md` (sketch) | Directory tree + imports graph (для языка) | Walk fs, parse imports, генерировать text representation |
| `ui-style-guide-base.md` extract | CSS variables / Tailwind config / design tokens package | Read CSS files, extract `:root { --color-* }`; read `tailwind.config.{js,ts}`; identify design tokens packages в deps |
| `database-design-*.md` extract | Migrations / Prisma schema / SQLAlchemy models / Drizzle schema | Parse schema definitions, generate text representation tables + columns + indexes |
| Existing API surface | OpenAPI spec / route definitions / handler files | If `openapi.yaml` exists — parse; else heuristic per framework (Express routes, FastAPI decorators, etc.) |

**Implementation:** scripts в `scripts/auto-extract/` (см. § O Implementation files).

**Не auto-extract:**
- Personas — нет signal в коде
- User journeys — нет signal в коде
- Threat model — нужно understanding business risks
- MVP scope — нужно understanding phases
- Brand voice — нужно understanding marketing
- Competitive analysis — нужно external research

Эти — **Tier 1** (per-feature mini-research) или **Tier 2** (promotion to project-wide).

---

## G. Tier 1 — per-feature mini-research (10-30 min)

Когда `foundation_completeness: minimal | none` и фича требует context который Tier 0 не покрывает.

### Когда trigger'ится

Read-pass на feature spec (AP-14) detect'ит:
- Spec scenarios упоминают пользователя / actor → нужна mini-persona если нет `personas.md`
- Spec scenarios связаны с user flow → нужен mini-journey-step если нет `user-journeys.md`
- Spec touch'ит auth/crypto/PII/payments → нужен mini-threat-list если нет `threat-model.md` (это **hard floor** — нельзя skip для security path)
- Spec UI-touching и нет `ui-style-guide-base.md` → trigger extract-or-write flow

### Что делает AI

Inline в feature spec — добавляет optional sections:

```markdown
## Mini-persona (для этой фичи)

[Только если нет project-wide personas.md. Filled через AskUserQuestion 5-min: кто пользователь, что ему нужно, какой контекст использования.]

## Journey context (где встаёт фича)

[Только если нет project-wide user-journeys.md. Filled через AskUserQuestion: какой existing flow меняет / в какой step добавляется.]

## Mini-threat-list (если security path)

[Hard requirement для security path features даже в `none` state. Filled через AskUserQuestion + AI suggests common threats per scope.]
```

**Promotion path:** когда оператор готов consolidate, эти mini-* sections извлекаются из spec'ов и объединяются в project-wide `personas.md` / `user-journeys.md` / `threat-model.md` (§ Tier 2).

---

## H. Tier 2 — project-wide promotion (operator-initiated)

**Когда:** после N фич оператор решает «достаточно mini'ев, делаем полный foundation».

**Mechanism:** project-bootstrap keyword routing:

| Operator intent | Routing |
|---|---|
| «promote foundation» / «consolidate» / «адаптируй полностью» | Collect mini-* sections from existing spec'ов, consolidate в full project-wide artifacts. Update `foundation_completeness` accordingly |

**Что делает AI:**

1. Scan `.ai-pm/doc/features/*_spec.md` на наличие mini-persona / mini-journey-step / mini-threat-list sections
2. Aggregate distinct personas / journey steps / threats
3. Draft `.ai-pm/doc/personas.md` / `user-journeys.md` / `threat-model.md` с consolidated content
4. AskUserQuestion: «Готов consolidated draft. ОК / правки / переделать?»
5. После approval — commit + update `foundation_completeness: complete`

---

## I. Tier 3 — adoption overrides (declared trade-offs)

**Mechanism:** parallel к AP-16 review-override.

В `.bootstrap-state.md`:

```yaml
adoption_overrides:
  - skip: stage-e-hooks
    reason: «legacy CI integration conflicts, hooks moved to separate PR scheduled 2026-Q3»
    accepted-risk: «AP-16 enforcement soft, manual review-trail discipline»
    declared_at: 2026-05-24
    expires_at: 2026-09-01  # optional sunset
  - skip: threat-model-for-security-path
    reason: «продукт без production users, low risk surface»
    accepted-risk: «AP-14 security check incomplete, риск compliance / audit issues»
    declared_at: 2026-05-24
```

**Reviewer-agent behavior:**

- Read `adoption_overrides` from state
- При проверке finding, attributable к overridden component → downgrade severity к `[question]` с tag `adoption-trade-off accepted by operator`
- Surface override list в review summary («3 active overrides — expires 2026-09-01»)

**AP integration:** new **AP-22** (см. § O Implementation files) — «Adoption-override без declared trade-off».

---

## J. Template versioning + sync

### J.1. Template-side SemVer

Template repo использует SemVer:
- **MAJOR** — breaking changes (e.g., bootstrap-state.md schema incompatible)
- **MINOR** — additive features (new subagent, new AP, new ui_kind support)
- **PATCH** — fixes / refinements

Release process: `release-helper` extension — release-helper already supports SemVer + CHANGELOG, нужно lightweight extension для **template self-release** (тэги в template repo, не product).

### J.2. Product-side `.ai-pm/version` field

В product `.bootstrap-state.md`:
```yaml
template_version_applied: v0.2.0
```

Fixates **какая версия шаблона применена** на момент last sync. Не auto-updated — только при `template-sync`.

### J.3. `template-sync` mode

**Invoked manually:** оператор пишет «обнови template» / «template-sync» / «bump template».

**Что делает:**

1. Read `template_version_applied` from state
2. Read latest tag from `.ai-pm/tooling/` (submodule) или from template repo URL
3. Compare versions:
   - Equal → «template up to date, no sync needed»
   - Mismatch → continue
4. Generate diff between applied и latest:
   - `.claude/agents/*.md` — usually safe to auto-apply (no product customization)
   - `_templates/*.tmpl` — flag для review (product может custom'ить slot values)
   - `scripts/*.tmpl` → real scripts в product — flag для review (product может tweak'ать)
   - `anti-patterns.md` — apply additive changes (new APs); flag deletions для review
   - `development-protocol.md` — same logic
5. Apply safe changes auto, flag manual review items
6. Generate PR на branch `chore/template-sync-v0.X.Y` с CHANGELOG showing:
   - Apply summary
   - Manual review items
   - Breaking changes (если MAJOR bump)
7. Update `.ai-pm/version` в state
8. Operator reviews + merges

**Auto-suggest:** **disabled** per operator decision. AI не предлагает sync proactively — только on explicit request. (Rationale: respect AP-3 operator-gate, не навязывать.)

---

## K. Backwards compatibility

Existing template-native projects (Stage A-E closed prior to this redesign) должны работать **without forced migration**:

- `foundation_completeness` default = `complete` если поле отсутствует
- `adoption_path` default = `greenfield` если поле отсутствует
- `template_version_applied` default = `v0.0.0` (force template-sync to apply от v0.1.0+)
- Mode rename: existing spec'и с `mode: new-feature` / `mode: rework-feature` остаются valid (alias на `feature` / `rework`)

Project-bootstrap detects missing fields → fills defaults на first session в новой template version, без operator interruption.

---

## L. Workflow examples

### Example 1: Greenfield → Stage A-E

Без изменений. `new-product` mode → Stage A → ... → Stage E closed. State:
```yaml
mode: new-product
adoption_path: greenfield
foundation_completeness: complete
template_version_applied: v0.X.Y
```

### Example 2: Legacy → Quick auto

1. Operator: `claude` в legacy repo
2. Bootstrap detects: no `.ai-pm/`
3. Bootstrap: «3 choice'а — Quick / Staged / Skip. Recommend Quick. Trade-offs: …»
4. Operator: Quick
5. AI: 5 min Tier 0 extract + Stage E hooks setup
6. State:
```yaml
adoption_path: legacy-quick
foundation_completeness: minimal
template_version_applied: v0.X.Y
```
7. Bootstrap: «Готово. Можешь добавлять фичи через `feature` mode.»

### Example 3: Legacy first feature (после quick adoption)

1. Operator: «хочу добавить фичу: email export user data»
2. Bootstrap routing: `feature` mode
3. Spec drafting: AP-14 read-pass detects `personas.md` отсутствует, `journey-steps.md` отсутствует
4. AI: «Foundation minimal — нужны mini-persona и mini-journey для этой фичи (10 min). Поехали?»
5. Operator: ОК
6. AskUserQuestion (mini-persona): кто пользователь export'а, какой контекст
7. AskUserQuestion (mini-journey): existing flow откуда вызывается
8. Draft `_spec.md` с mini sections
9. Standard Stage F continues

### Example 4: Template version bump на template-native project

1. Operator: «обнови template» (template repo released v0.2.0, project на v0.1.0)
2. Bootstrap routing: `template-sync` mode
3. AI: compare versions, generate diff
4. Apply safe changes (subagents, anti-patterns additive)
5. Flag manual review items (custom slot values in _templates, etc.)
6. Generate PR `chore/template-sync-v0.2.0`
7. Operator reviews, merges
8. State updated: `template_version_applied: v0.2.0`

### Example 5: Architecture overview (read-only)

1. Operator: «составь архитектуру проекта»
2. Bootstrap keyword routing: architecture-overview
3. AI: Tier 0 auto-extract pass, NO state change
4. Output: `meta/architecture-extract-2026-05-24.md` (template repo) или `doc/architecture-extract-2026-05-24.md` (product)
5. Operator reads, decides next steps

---

## M. Hard floors (что нельзя lazy / skip без explicit override)

| Component | Hard floor case | Trade-off если skip'нуть |
|---|---|---|
| `threat-model.md` | Фича в security path (auth / crypto / PII / payments / sessions / public endpoints) | AP-14 security check incomplete; compliance / audit risk |
| `topology.md` | Multi-domain фича (AP-19 pr_ordering detect требует actual topology) | AP-19 не enforce'ит pr_ordering на heuristic; mixed-domain PR может пройти |
| `ui-style-guide-base.md` + per-kind | UI feature и нет existing extract'а | AP-15 не enforce'ит design consistency; UI drift |
| `Stage E hooks` | Любая adoption | AP-16 enforcement soft; manual review-trail discipline |

Operator может override любой через `adoption_overrides` (§ I) с явным reason + accepted-risk. **AI не override'ит сам.**

---

## N. New / updated anti-patterns

### AP-22 (NEW) — Adoption-override без declared trade-off

**Что нельзя:**
- Записывать `adoption_overrides` entry без полей `reason` и `accepted-risk`
- AI самостоятельно добавлять override (только operator-initiated)
- Override без `declared_at` timestamp

**Почему:** Override — это операторская декларация risk acceptance. Без явного `reason` и `accepted-risk` теряется audit trail. AI самостоятельно override'ить — нарушение AP-3 operator-gate.

**Как поступать:**
- Override добавляется только operator-initiated через explicit ask
- AI prompts: «Skip X означает: <consequence>. Confirm с reason?»
- Optional `expires_at` для time-bounded overrides (force re-evaluation)

### AP-14 update — handle missing docs through tier framework

Existing AP-14 (structural read-pass) расширяется:
- При `foundation_completeness: complete` — full read-pass per existing rules
- При `partial` — read-pass на existing docs, mini-research для missing
- При `minimal` / `none` — Tier 1 mini-research для каждой фичи, hard floors enforce'ятся

### AP-15 update — handle extract-based foundation

Existing AP-15 (ui-style-guide foundation для UI features):
- Existing rule: requires `ui-style-guide-base.md` + per-kind
- Update: extract-based `ui-style-guide-base.md` (Tier 0 auto-extract) считается valid foundation для adoption-path: legacy-quick
- Promotion (Tier 2) может refine extracted artifacts

---

## O. Implementation files (план изменений по PR'ам)

См. plan file `/home/adegtyarev/.claude/plans/cheerful-swinging-pie.md` § Реализация — 8 PR'ов, 3 phases.

Краткий список:

- `doc/_templates/bootstrap-state.md.tmpl` — schema additions
- `doc/development-protocol.md` § 3 — rewrite
- `doc/anti-patterns.md` — AP-14, AP-15 updates + AP-22 new
- `.claude/agents/project-bootstrap.md` — legacy detection + 3-choice flow + architecture-overview routing + template-sync routine
- `.claude/agents/release-helper.md` — template-side SemVer extension
- `.claude/agents/planner.md` / `coder.md` / `reviewer.md` — `foundation_completeness` awareness
- `doc/_templates/feature-spec.md.tmpl` — optional mini-* sections
- `scripts/auto-extract/` — new directory с Tier 0 extraction scripts
- `doc/_templates/scripts/check-spec-discipline.sh.tmpl` — read state, adapt checks
- `README.md` — Шесть режимов + adoption tiers section
- Template-wide rename `new-feature` → `feature`, `rework-feature` → `rework`

---

## P. Open для рассмотрения после design freeze

- Auto-extract scripts language: shell (consistent с existing template scripts) vs Python (better for tree parsing). Likely mixed: shell для simple manifest parsing, Python для AST-based topology/schema extraction.
- Frontmatter alias handling for renamed modes — backwards-compat via project-bootstrap detection, не template runtime.
- `template-sync` conflict resolution UI — для cases где product custom'нул file который sync хочет обновить. Default: flag для manual merge, не auto-overwrite.
