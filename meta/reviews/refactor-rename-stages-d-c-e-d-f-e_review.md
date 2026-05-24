---
pr: TBD
branch: refactor/rename-stages-d-c-e-d-f-e
reviewer: self-review (offline AP-16 trail)
reviewed_at: 2026-05-25
trail_type: committed-review
spawned_agents: N/A
---

**Verdict:** approve

Continuous stage letter rename. Stage C был упразднён в v0.3.0 (topology fold в Stage D), оставив gap A/B/D/E/F. Этот PR закрывает gap: D→C, E→D, F→E. Теперь stages A/B/C/D/E continuous.

# Coverage

Rename mappings:
- **Stage D (Process)** → **Stage C (Process)** — tech-stack / dev-environment / ai-linting / etc.
- **Stage E (Bootstrap)** → **Stage D (Bootstrap)** — CI / hooks / branch protection / bootstrap-verify.sh
- **Stage F (Production)** → **Stage E (Production)** — feature spec/plan/review + код + тесты

Plus range updates:
- «Stage A-F» / «Stage A-E» / «Stage A-D» → «Stage A-E» / «Stage A-D» / «Stage A-C»
- «Stage A/B/D» → «Stage A/B/C»
- «Stage A/B/D/E» → «Stage A/B/C/D»
- «Stage A/B/D/E/F» → «Stage A-E»

41 файлов обновлены в active scope:
- README.md (Stage table A/B/C/D/E)
- doc/development-protocol.md (§ 4 stage table + § 5 Stage D Bootstrap details + Stage E Production references)
- doc/anti-patterns.md (Stage refs в AP-1/13/14/15/16/19/20/22/23/24)
- doc/personas.md, doc/user-journeys.md (mode-aware stage progression)
- .claude/agents/* (6 agents — все Stage F refs → Stage E, Stage E refs → Stage D)
- doc/_templates/*.md.tmpl (stage frontmatter + body refs)
- doc/_templates/scripts/* (bootstrap-verify.sh + check-* scripts + auto-extract)
- doc/_recipes/cache/* (stage E references — renamed)

**Excluded from rename** (preserved historical context):
- meta/audits/* — historical context refers to original stage names
- meta/reviews/* — review trails per AP-16 captured state at time of review
- meta/design/* — historical design docs
- meta/experiments/* + meta/research/* — historical results
- CHANGELOG.md — versioned history entries reference stage names в момент их актуальности

# Cross-cutting findings

## Spec coverage

Closes operator feedback session 2026-05-25:
- «блять посмотри стадии в ридми где C?»
- «ПЛЕВАТЬ сделай нормально и чтобы во всем проекте билось»
- «агенты там чтобы стадии нормально понимали в протоколе чтобы было так же»

## Plan adherence

Не plan-driven (operator direct feedback). One-shot rename — continuous letters reflect current 5-stage reality более clean чем letter holes.

## Test discipline

N/A — text rename. Verification:
- `grep -rn "Stage F\b" --exclude-dir=meta --exclude=CHANGELOG.md` → 0 hits в active scope
- `grep -rn "Stage A-F" --exclude-dir=meta` → 0 hits
- Control char `\x02` verification — 0 instances (fixed mid-script bug)
- Sanity: README table = A/B/C/D/E continuous
- Sanity: protocol § 4 = A. Discovery / B. Constraints / C. Process / D. Bootstrap / E. Production
- Sanity: agents — Stage E refs (now Production) match protocol Stage E = Production

## Security / architecture

- AP-12 clean
- AP-17 clean
- AP-1/AP-24 relationship preserved (Stage E Step 2 plan для proactive ADR — was Stage F Step 2)

## Code hygiene

- Symmetric +/- diff stats (~253 insertions / ~253 deletions) — pure rename, no content drift
- Sentinel-based replacement strategy для avoid loop conflicts (D→C while E→D ongoing)
- Mid-script bug fixed (Python string escape `\2` interpreted as `\x02` control char swallowing pipes) — table cells corrected post-fix

# Protocol compliance

- ✅ AP-1: нет архитектурных решений (rename refactor)
- ✅ AP-3: scope direct operator instruction
- ✅ AP-12: clean
- ✅ AP-16: этот trail
- ✅ AP-17: clean
- ✅ AP-19: один логический change (continuous stage letters)
- ✅ AP-22: meta/ history preserved (audit-trail intact)

# Severity summary

- Blocking: 0
- Question: 0
- Nit: 0

# Migration impact для existing downstream projects

Existing template-using projects с `.bootstrap-state.md` имеющим `stage: D` / `stage: E` / `stage: F` frontmatter — need `template-sync` migration:
- `stage: D` → `stage: C`
- `stage: E` → `stage: D`
- `stage: F` → `stage: E`

template-sync-doc-migrate.py должен detect и предложить migration. Это backlog enhancement (script update) — пока ручная coordination.

Tag impact: следующий release — v0.5.2 (PATCH — rename refactor, no functional changes). Documented как breaking-ish via «stage letter remapping» в CHANGELOG.
