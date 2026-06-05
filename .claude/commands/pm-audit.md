# pm-audit — project health check

Run when PM says "check the project", "audit", "review the project", "is everything ok?", "проверь проект", "аудит", "всё ок?", "проверь состояние", or similar. Also triggered automatically from `/pm-plan` when N features have accumulated since the last audit.

**IMPORTANT:** Do NOT perform inline ad-hoc checks (reading review files, running tests manually). Always invoke this skill and spawn `pm-auditor` as a subagent — that is the only valid audit path. Inline checks bypass protocol compliance verification and produce no audit artifact.

## Scope decision

Before spawning any agent, compute the protocol's **scope judgement**, then route on **who initiated** the audit (PM-initiated request vs system-initiated nudge) and, for a PM-initiated request, on **whether the PM already named the scope**.

### 1. Compute the scope judgement (the threshold logic — always runs)

This is the protocol's recommendation, used as the menu's **default pre-selection** for a PM-initiated request and as the **announced auto-scope** for a system-initiated one. It is not removed — it is surfaced.

1. Check `.ai-pm/audits/` for the most recent `audit-*.md` (by filename date).
2. If `.ai-pm/audits/` is empty or does not exist → first audit → judgement = `full`.
3. Count `feat:` and `fix:` commits since last audit date:
   ```
   git log --since="<last_audit_date>" --oneline | grep -cE "^[a-f0-9]+ (feat|fix):"
   ```
4. Judgement:
   - No prior audit OR last audit > 60 days ago OR > 15 feature commits → **full**
   - Otherwise → **diff** (protocol only, fast)

### 2. Route on initiator

- **System-initiated** (the retrospective nudge from `/pm-plan` fired, or the orchestrator itself decided to audit) → **announce-and-proceed** with the computed judgement, regardless of authority mode. Tell PM one sentence before starting:
  > "Running a [quick / full] protocol check — [N features / first audit / N days] since last check."

  PM can still redirect naturally: "just a quick one" → `diff`; "go deep" / "everything" / "comprehensive" → `full`.

- **PM-initiated** (the PM asked for a project analysis by intent — "анализ проекта", "проверь проект", "review the project", "аудит") → go to **3** (explicit-scope check), then the **upfront menu** if scope was not named. A PM-initiated analysis is a product/cost fork the PM explicitly asked to own, so the menu is shown **regardless of authority mode** (autonomous mode does not suppress it).

### 3. Explicit scope skips the menu

If the PM's words **already name the scope**, honor it directly — **no scope menu**:
- "полный анализ" / "go deep" / "everything" / "comprehensive" → `full`
- "быстрая проверка" / "just a quick one" / "quick check" → `diff`

For an explicit **`full`**, still surface the review-sweep **depth** choice (the `## Technical quality` depth offer applies — do not ask scope, only depth). For an explicit `diff`, proceed straight to the audit.

### 4. The upfront scope menu (PM-initiated, scope not named)

Present **one** `AskUserQuestion` menu before running anything — the protocol's computed judgement (step 1) is the **recommended / pre-selected** option:

> "What kind of project analysis do you want?"

Two options:
- **Quick** — protocol-compliance only, fast `diff` (commits since the last audit).
- **Full** — the whole project: protocol-compliance **+** the code-quality review sweep over the full tree.

Mark the option matching the step-1 judgement as the recommendation (e.g. "Recommended — N features / N days since last check"). The PM's pick drives `scope` (`Quick` → `diff`, `Full` → `full`); the PM sees and can override the protocol's judgement upfront.

When the PM picks **Full**, also resolve the review-sweep **depth** in the same flow — fold it into this menu (a second question: light `low`/`medium` vs deep `high`/`max`/`ultra`) **or** defer to the `## Technical quality` depth offer, whichever keeps it to a single pass. Do **not** double-ask depth.

## Agent dispatch

All agents below are project agents — use the Agent tool with the exact `subagent_type` shown. Never substitute with `wb-development:code-reviewer` or any other agent — a `PreToolUse` guard in `.claude/settings.json` denies the known `wb-*` role duplicators automatically (see **Hook-level enforcement** in `workflow/enforcement.md`).

| Agent | subagent_type |
|---|---|
| pm-auditor | `"pm-auditor"` |
| pm-plan-checker | `"pm-plan-checker"` |
| pm-codebase-reader | `"pm-codebase-reader"` |
| pm-architect | `"pm-architect"` |

## Execution

1. **Spawn the `pm-auditor` agent** — Agent tool, `subagent_type: "pm-auditor"`. **Resolve `audit-model` first** per `### Cross-model review` in `workflow/review-typology.md` (read `.ai-pm/review-config.md` fresh — absent/unrecognized ⇒ `session`); when it resolves to a model **≠ session** and available, **pin the spawn to that model** via the Agent model override and announce it ("Compliance audit on Sonnet…"), else spawn on the session and announce the fallback. Read the rule by name; do not re-encode the enum/default/Haiku-blacklist/fallback. Pass:
   - Project root
   - Audit date (today, ISO)
   - `scope`: as decided above
   - Optional focus area

   Wait for it to complete. It writes `.ai-pm/audits/audit-<YYYY-MM-DD>.md` and returns the structured summary.

2. **Read the structured summary** — drives the PM-facing flow below.

## PM-facing flow

3. **Tell PM the headline:**
   > "Check complete. Found [N blocking / N notes]. Full report in `.ai-pm/audits/audit-<YYYY-MM-DD>.md`."

   If scope was `diff` — after the headline, ask PM via AskUserQuestion:
   > "This was a quick diff check — only commits since the last audit were scanned. A full audit sweeps the entire project history and can surface gaps that predate the last check (e.g. missing contracts on older features). Run a full audit now?"
   
   Options: **Yes, run full audit** / **No, continue with these findings**.
   If yes — re-spawn `pm-auditor` with `scope: full` before walking through findings.

   **No double-prompt.** This offer fires **only when a Quick / `diff` audit actually ran**. When the upfront scope menu (Scope decision, step 4) already chose **Full** — or the PM named an explicit Full — scope is `full`, so this offer does not fire; the PM already made that call upfront.

4. **Walk PM through blocking findings** using the auditor's priority order. For each:
   > "Blocking #<n>: <short title>. **Fix now** (run the remediation step next), **next sprint** (backlog), or **accept-with-context** (note the reason, skip next time)?"

   Three valid answers:
   - **Fix now** → run the remediation step after this conversation (step 6).
   - **Next sprint** → add to `.ai-pm/backlog.md` with reference to this audit.
   - **Accept-with-context** → add to `.ai-pm/backlog.md` marked `accepted (auditor-<date>): <reason>`.

   Never auto-batch. Each blocking gets its own PM decision.

   **"Fix it all" shortcut** — if PM says this before the loop, confirm the full list:
   > "I'll fix all N findings in order: 1. X, 2. Y, 3. Z. Starting with #1."
   Then run step 6 in order. Never start without this confirmation.

5. **Walk PM through notes** briefly:
   > "Note <n>: <short title>. **Fix now / backlog / ignore?**"

6. **Run the chosen remediations** in priority order. One at a time:
   - Missing plan → `/pm-plan <topic>` (retroactive)
   - Missing review → respawn `pm-plan-checker` agent (`subagent_type: "pm-plan-checker"`) on that feature's commits
   - Missing contract → PM validates; orchestrator drafts `.ai-pm/contracts/<feature>.md`
   - Stale contract → PM validates update; orchestrator updates the contract
   - Orphaned implementation → `/pm-plan <topic>` (retroactive)
   - Stale docs → spawn `pm-architect` (`subagent_type: "pm-architect"`) for `docs/architecture.md`, `docs/user-journeys.md`, or `docs/threat-model.md` (pm-architect owns all three); spawn `pm-codebase-reader` (`subagent_type: "pm-codebase-reader"`) only for a bootstrap-validation code re-read (re-read module X, the docs are wrong).
     **Content-discipline gap (template bump).** When a dimension-5 doc finding corresponds to a **content discipline registered in `### Expected-discipline manifest` in `MIGRATIONS.md`** — a missing/skeletal `docs/user-journeys.md` journey, a missing/empty `docs/product.md` funnel, or a skeletal `docs/threat-model.md` — and the PM chose **fix-now**, the remediation is not a bare refresh: the **orchestrator relays that discipline's foundational questions in one `AskUserQuestion`** (the manifest entry's named question source — `### Foundational product questions` in `workflow/foundational-questions.md`, or the bootstrap threat-model Q-set), then spawns `pm-architect` (`subagent_type: "pm-architect"`) to author the content from the answers. No `pm-product-advocate` spawn — the gap is already identified and the question source is a fixed named list. `accept-with-context` (record in `.ai-pm/backlog.md` marked `accepted (auditor-<date>): <reason>`, not re-raised) remains the conscious-defer escape hatch. This enhances the existing dimension-5 finding's fix-now path; it adds **no** new finding type.
   - Un-migrated template structure / missing generated map (a lingering `docs/features/_index.md`, or `docs/product-map.md` missing — per `### Pending-migration detection` in `MIGRATIONS.md`) → offer to run the pending migration now, in plain language:
     > "This project is still on an older template structure (`docs/product-map.md` hasn't been generated yet). I can run the pending `/pm-bootstrap` migration to bring it up to the current format — nothing else changes. Run it now?"

     PM decides. On yes, invoke the existing (untouched) `/pm-bootstrap` migration procedure, which acts with this consent. The auditor only flagged it; the orchestrator runs it.
   - Old-format (pre-value-first) product map — the auditor's non-blocking format-refresh note (an existing `docs/product-map.md` with at least one contract block still carrying the literal `Guarantees:` label **or** the pre-English-canonical `Что даёт:` label, per `### Pending-migration detection` in `MIGRATIONS.md`; a contract-less / infra-only map has no contract blocks and no value lines and is **not** old-format — it gets no note) → offer to regenerate now, in plain language. This is distinct from the missing/un-migrated-map note above: the map exists and is content-current, it is only in the old presentation format. It is **not** a structural migration:
     > "Your product map is current but in the old format — it leads with a build-history table instead of what each feature gives the user. I can regenerate it to the value-first format now (rebuilt from your contracts, nothing else changes). Regenerate it?"

     PM decides. On yes, regenerate `docs/product-map.md` via the **Product map generation procedure** in `pm-bootstrap.md` (idempotent, overwrite-from-source). The auditor only flagged it; the orchestrator runs it.
   - Pre-English-canonical `product.md` (Russian funnel headers) — the auditor's non-blocking format note (an existing `docs/product.md` whose funnel still carries the Russian headers `## Зачем это нужно` / `## Что умеет сегодня` / `## Документы` / `## Функции`, per `### Pending-migration detection` in `MIGRATIONS.md`; a `product.md` already on the English headers is not flagged, a missing/empty one is the separate missing-funnel note) → offer the product.md header-migration now, in plain language. Headers only, prose preserved:
     > "Your product front door uses the old section titles. I can update just the titles to the canonical English names — the text you wrote stays exactly as is. Run it now?"

     PM decides. On yes, run the **product.md header-migration procedure** in `MIGRATIONS.md` (headers only, prose preserved, performed by `pm-architect`). The auditor only flagged it; the orchestrator runs it.
   - Old-template README (front-gate not applied) — the auditor's non-blocking note (an existing `README.md` still carrying a `## What it does` capability list, per `### Pending-migration detection` in `MIGRATIONS.md`; a README with no `## What it does` heading is not flagged) → offer the README front-gate migration now, in plain language. The README keeps its own capability list parallel to `docs/product.md`, which drifts; the fix is move-not-copy, not a blind delete:
     > "Your README keeps its own 'what it does' list, separate from `docs/product.md` — the two can drift. I can run the README front-gate migration: any capability that's only in the README moves into `docs/product.md` first, then the README's list is replaced with a link to it. Install instructions and everything else stay as-is. Run it now?"

     PM decides. On yes, run the **README front-gate migration procedure** in `MIGRATIONS.md` (move-not-copy, performed by `pm-architect`). The auditor only flagged it; the orchestrator runs it.
   - Token-laden contract (two-layer not applied) — the auditor's non-blocking structural token note (a contract whose PM sections `## User value` / `## Out of scope` carry wire-tokens, or whose `## Must work` / `## Must not break` inline machine grammars that belong in `## Behavioral contract`, per `### Pending-migration detection` in `MIGRATIONS.md`; a token-free contract that references the Behavioral contract is not flagged) → offer the contract two-layer migration now, in plain language. The contract mixes technical tokens into the product-language sections; the fix is move-not-copy, preserving every guarantee:
     > "One of your feature contracts mixes technical detail (topic formats, value ranges) into the parts meant for plain product language. I can run the contract two-layer migration: the technical grammar moves into the single architecture reference, the user-facing parts are rephrased in plain language, and every promise the contract makes is preserved. Nothing the user sees changes. Run it now?"

     PM decides. On yes, run the **contract two-layer migration procedure** in `MIGRATIONS.md` (move-not-copy, performed by `pm-architect`, preserves every guarantee). The auditor only flagged it; the orchestrator runs it.

   **Plan naming rule.** Topic = what is being fixed, not where it came from. `confed-schema-delivery`, not `audit-fixup-confed-schema-delivery`. The audit finding belongs in the plan's context or git history — not in the filename.

   **Update vs create.** If `docs/features/<area>_plan.md` already exists and the finding is a missing scenario or gap within that feature's scope → add to the existing plan rather than creating a new file. Create a new plan only when the fix is genuinely new standalone work that has no existing plan.

   Doc-only remediations (missing plan for already-correct code, stale docs) do not require `pm-coder`.

## Technical quality — the smell / hygiene sweep (full scope only)

After the protocol findings are walked through, if scope was `full`, run the **smell / hygiene sweep** — the first concrete review **type** of `### Review typology` in `workflow/review-typology.md`. **Read `workflow/review-typology.md` before running the sweep** (the registry; do not re-encode the type list, cadence, or engine-selection rule here — reference it by name). It is a **whole-codebase** review type, so its engine is **selected per the engine-selection rule in `### Review typology`**: prefer `wb-development:code-review-orchestrator` when it is available and `WB_REVIEW_ORCHESTRATOR` is not `off`, otherwise fall back to the built-in `/code-review` skill at the selected depth (below). The chosen engine runs over the **proportional scope** to surface functionality-preserving hygiene issues (dead code, duplication, high cognitive complexity, over-complexity, simplification) — distinct from a per-diff bug.

**Which *model* the sweep runs on — `review-full-model` (`### Cross-model review` in `workflow/review-typology.md`).** Orthogonal to engine selection above (engine = which reviewer; model = which brain). Resolve `review-full-model` per `### Cross-model review` (read `.ai-pm/review-config.md` fresh — absent/unrecognized ⇒ `session`) and apply it over the existing engine chain, **model-pinned where the engine is ours**: when the engine is `code-review-orchestrator` (no model of its own) or the built-in `/code-review`, run it **inside a subagent pinned to the resolved model** and announce it; **`ultra` is the one exception** — on the ultra path the model knob does not apply and the orchestrator announces "ultra picks its own models". When the resolved model is `session` / equals the session / unavailable, run on the session and announce the fallback. The engine-selection + depth behavior below is **unchanged** — this adds only the model. Read the rule by name; do not re-encode it. Its deterministic **detection** half (an enumerable smell catalog a hook/linter should own) is a **named downstream/future path, not run here** (this protocol repo has no linter to host it — see `### Review typology`); the AI **prioritization / root-cause** half is this sweep.

**1. Derive the proportional scope from the last-sweep marker (no new file).** When the sweep actually runs, it writes its outcome as a **real sweep-marker line** in the `audit-*.md` report the auditor already produces:

> `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>`

where **`<sha>` is HEAD at sweep time** (the commit the sweep reviewed up to). This extends the auditor's existing "derive the diff cutoff from the latest `audit-*.md`" pattern (`pm-auditor.md` step 2) from date-only to date+SHA — **no dedicated `.ai-pm/` file**. A **skip** (step 2) writes **no such line** — only a plain note — so the steady-state reader is never undefined. To scope the next sweep:

- **First-run precedence (overrides the skip gate).** If **no** `audit-*.md` anywhere carries a **real** `## Quality sweep: <date> — swept <sha>..HEAD at depth <d>` line, this is a **first-run = full** sweep — reuse the auditor's existing fallback verbatim (`pm-audit.md` Scope decision, step 1: "empty or does not exist → first audit → judgement = `full`"; `pm-auditor.md` step 2). Do not invent a parallel "first sweep" rule. The skip/silent gate (step 2) applies **only** when a prior real sweep-marker exists AND nothing changed since its `<sha>`.
- **Incremental scope.** Otherwise, find the **latest `audit-*.md` that contains a real `## Quality sweep: … swept <sha>..HEAD …` line** (a skip note is **not** such a line; a `diff`-scope audit may write a report but run no sweep), read its `<sha>`, and scope the `code-review` pass to **`git diff <that sha>..HEAD`** — the code changed since the last sweep (Clean-as-You-Code new-code gating, per `### Review typology`). Legacy / never-diff-reviewed code is **not** chased per-incremental (there is no signal to compute "never-swept" incrementally) — it is covered by the **first-run full** sweep above and the **periodic full re-sweep** (cadence-drift), the two mechanisms `### Review typology` names for legacy coverage. *(Coupling: the marker exists only where an `audit-*.md` does — safe while the `## Technical quality` full-scope hook is the sole sweep trigger.)*

**2. Proportionality gate — silent/skip when nothing changed since the last sweep.** If a prior real sweep-marker exists AND nothing changed since its `<sha>`, announce **"codebase swept-clean since `<date>`"**, write **only a plain skip note** in the report (e.g. `Quality sweep skipped — swept-clean since <date>`), **NOT** a `## Quality sweep: … swept <sha>..HEAD …` sweep-marker line, and **skip** the `code-review` pass. A skip leaves the previous real marker as the latest one, so the next sweep's reader still finds a well-defined `<sha>`. The sweep never re-reviews swept-clean code.

**3. Selectable depth (no hard-wired `ultra`).** Run the selected engine (step intro — orchestrator preferred when available, else the built-in `/code-review`) at a **chosen** depth — never silently the costliest. Depth applies to the built-in fallback's level (low / medium / high / max / ultra); the orchestrator runs its own multi-aspect pass:

- **Interactive:** offer the cost/depth trade-off and let the PM pick:
  > "Protocol check done. Want a smell/hygiene sweep too? It reviews the code changed since the last sweep (or the full tree on a first / periodic re-sweep) for dead code, duplication, and over-complexity. Depth is selectable — light (`low`/`medium`, a few minutes) for a small routine sweep, deep (`high`/`max`/`ultra`, 10–15 min) for a first/legacy/comprehensive sweep. Run it — and at what depth?"

  If PM says no → write no marker, done.
- **Autonomous:** pick a **proportionate** depth and **announce** it (lighter for a small routine sweep; deeper for a first / legacy / PM-requested sweep), then proceed — never silently the costliest. PM can override.

**4. Findings → the existing triage (not lost).** Run the sweep's `code-review` findings through `/pm-audit`'s existing **fix-now / next-sprint(backlog) / accept-with-context** loop (the same flow as protocol findings, above) — one PM decision per finding, no auto-batch. Accepts are recorded in `.ai-pm/backlog.md` marked **`accepted (quality-sweep-<date>): <reason>`** (mirroring `accepted (auditor-<date>)`). Fix-now spawns the normal `/pm-plan` → coder path; the sweep never auto-edits.

**5. Autonomous branch — a procedural gate, bounded by proportionality.** The "run the sweep?" offer is a **procedural checkpoint** per `### Decision authority` in `workflow/decision-authority.md` (announce-and-proceed — it decides *whether to run an optional review step*, not *what the user gets*), **bounded by the proportionality gate in step 2**: it runs only when there is changed surface since the last sweep (or it is a first / periodic full re-sweep), and never auto-launches a full-tree `ultra` sweep on every audit. The interactive yes/no offer wording (step 3) is unchanged for interactive mode. **Merge / ship stays manual** in both modes; findings still go to PM triage (step 4).

This sweep is always offered (interactive) or proportionally auto-run (autonomous), never blanket-assumed. The protocol check is fast and always runs; the smell sweep is scoped, depth-proportionate, and gated.

## Pre-protocol-migration artifacts

If the project has artifacts from before this protocol version (old `docs/audit-*.md` files in root, `audit-fixup-*` plans in `docs/features/`):
- Group them as a single note: "Pre-protocol-migration artifacts: [list]".
- PM can accept all at once: `accept-with-context: pre-protocol-migration` → add one entry to `.ai-pm/backlog.md`.
- Do NOT surface them as individual blocking findings.

## What this command does NOT do

- Does not read source code — that is the auditor's job in its subagent context.
- Does not check technical code quality on its own — that is the `code-review` skill.
- Does not skip PM. Every finding gets an explicit decision.
- Does not silently start remediation without showing PM the list first.

## Hard rules

- Scope routing: a **PM-initiated** analysis request (intent, no scope named) gets the upfront Quick/Full menu (the threshold logic is the recommended default); an explicit scope skips the menu; a **system-initiated** nudge announces-and-proceeds with the computed judgement. Never ask "full or diff?" on a system-initiated audit.
- One PM decision per finding. No batching unless PM says "fix all".
- All remediations go through the normal pipeline — no direct edits.
