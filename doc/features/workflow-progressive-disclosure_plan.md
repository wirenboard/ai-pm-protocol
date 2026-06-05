# workflow-progressive-disclosure — plan

Source: PM-directed 2026-06-05 — "огромный воркфлоу, claude code жалуется на ограничения; переделать архитектуру как Клоду работать — не тащить всё в контекст, а набор небольших инструкций с навигацией". Design input: `.ai-pm/arch/workflow-progressive-disclosure_arch.md` (recommends **Variant A** — thin core + on-demand topic files read via explicit Read steps). PM scope decision: **single PR**. **Supersedes** `doc/features/workflow-extract-to-refs_plan.md` (the examples-only companion — now one slice of this broader decomposition).

*Solve the root cause: `WORKFLOW.md` (~563 lines / ~17k tokens) is **eager-`@`-loaded in full at every session start** (and into nearly every subagent, which load the project `CLAUDE.md`) via the downstream `@.ai-pm/tooling/WORKFLOW.md` line — and `@`-splitting cannot make it lazy (cited platform fact). Restructure it into a **thin always-loaded constitution + router (~150 lines)** at the **same path** (so the downstream `@`-line is byte-unchanged → additive, no migration), with the bulk moved into ~15 small **on-demand `workflow/*.md` topic files** inside the submodule that each consuming command/agent reads with the Read tool via an explicit "Read `workflow/<topic>.md` before X" step. No rule is added, removed, or weakened — content is relocated and references repointed; the single-source / by-name / no-migration disciplines are preserved.*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = `WORKFLOW.md` / the new `workflow/*.md` files / the agents+commands that read them / the session+subagent context). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep of the anchor inventory + a per-consumer Read-step checklist; `tests/hooks.sh` stays green (no hook touched).

## Scenarios

1. **`WORKFLOW.md` becomes a thin constitution + router at the same path.** It shrinks to ~150 lines holding only the **always-true cross-cutting invariants** — `pm-*`-not-`wb-*`; the project-boundary rule; the edit-ownership one-liner; the remote-system-boundary one-liner; the git-flow skeleton (never commit to main); the Step 0–7 pipeline skeleton; the PM-comms core one-liners + language canon — plus a **navigation map** ("for decision-authority rules → read `workflow/decision-authority.md`", one line per topic). The downstream `@.ai-pm/tooling/WORKFLOW.md` import line is **byte-unchanged**. Observable result: always-loaded context for the spec drops from ~17k to ~4.5k tokens, in the main loop **and** in every subagent that loads `CLAUDE.md`.

2. **The bulk is decomposed into on-demand `workflow/*.md` topic files.** Following the arch note's map, the bulk splits at the natural `###`/`##` seams into ~15 files inside the submodule (one rule-home per file, each single-source): `roster`, `enforcement` (boundary rules + hook-level enforcement detail), `pipeline` (full Step 0–7 bodies), `mandatory-matrix` (the change-type table), `project-kind`, `decision-authority`, `review-typology`, `security-surfaces` (+ `threat-model` lifecycle), `foundational-questions`, `state` (how state is kept + three-channels), `incident` (the prod / blast-radius / probe flow), `protocol-gap`, `maintenance`, `pm-comms` (the full PM-communication list), `examples` (the illustrative ✓/✗ pairs, ASCII diagram, Matter worked example, probe-proposal template — subsuming the superseded extraction plan). The exact file boundaries follow the arch note; **the section name stays the anchor** in its new home (e.g. `### Decision authority` lives in `workflow/decision-authority.md` under that exact heading).

3. **Every live by-name reference is repointed + carries a procedural Read step.** The arch note inventoried **258** `WORKFLOW.md` mentions; **~140 are in frozen `doc/features/*_plan.md` audit-trail files and are NOT touched**. The ~40 **live** consumer references — `### Project kind` ×20, `### Decision authority` ×16, `### Foundational product questions` ×9, `### Security-relevant surfaces` ×6, `### Review typology` ×2, `### Threat-model lifecycle` ×1, plus PM-comms ×3 / Edit-ownership ×3 / smaller — across `.claude/agents/*.md`, `.claude/commands/*.md`, `MIGRATIONS.md`, and the templates are each rewritten from `` `### X` in `WORKFLOW.md` `` to `` `### X` in `workflow/<topic>.md` `` **and** gain an explicit procedural step ("Read `workflow/<topic>.md` before <the step that needs it>") so the rule is actually loaded at the moment it is needed, not merely pointed at. No reference is orphaned (the name is the stable anchor).

4. **Reliability is preserved by construction, not by hope.** Four layers (arch note): (a) cross-cutting invariants stay **eager** in the thin core; (b) the router is eager → the path to every rule is unmissable; (c) consumers carry **procedural Read steps**, not passive pointers; (d) subagent personas carry their own explicit Read steps (subagents load `CLAUDE.md` → get the core, but do **not** auto-inherit skills or anything beyond it — cited fact). The existing `PreToolUse` / `UserPromptSubmit` hooks remain the **hard floor**, independent of which markdown is loaded.

5. **Additive — ships downstream via the submodule, no migration.** `@.ai-pm/tooling/WORKFLOW.md` is byte-unchanged; the new `workflow/*.md` files and the slimmed `WORKFLOW.md` ride the submodule (downstream owns no copy of either); symlinked `agents` / `commands` / `settings.json` propagate transparently. Therefore **no `MIGRATIONS.md` pending-migration entry** and no template structural migration. One non-blocking template-owned edit: repoint the `doc/_templates/CLAUDE.md.tmpl` Project-kind comment to the new home (rides the next bump).

## Existing behaviors this feature touches

(what must not break)

- **Every live by-name reference into `WORKFLOW.md`** (the ~40 in Scenario 3) must keep resolving — now to a `workflow/<topic>.md` home under the same section name. A single orphaned reference is a blocking finding.
- **The single-source discipline** — each rule lives in exactly ONE file; the deliberate cross-references stay by-reference; the **"references this subsection by name … never re-encode the enum/default"** clauses of `### Project kind` / `### Decision authority` / `### Review typology` survive the move intact (the enum/default is still declared once, in that topic file).
- **Every rule, gate, and named anchor** — edit-ownership rule + its two `## Resolutions` / `## Code review` carve-outs, remote-system boundary (forbidden/allowed lists), Hook-level enforcement, threat-model lifecycle, the mandatory-when table + its riders, the product-readiness gate, the autonomous decision-authority machinery — preserved in meaning, only relocated.
- **`MIGRATIONS.md`** — its by-name references to `### …in WORKFLOW.md` are repointed (Scenario 3); MIGRATIONS.md's own role and procedures are otherwise unchanged. (This is repointing MIGRATIONS' *content references*, distinct from adding a migration *entry* — there is none.)
- **`tests/hooks.sh` (17 tests)** — no hook regex or `.claude/settings.json` is touched; 17/17 stays green. The lone `WORKFLOW.md` mention in `tests/hooks.sh` is a comment, not a content assertion.
- **Frozen audit-trail plans** under `doc/features/*_plan.md` — not modified (their ~140 `WORKFLOW.md` mentions are historical record; the section names they cite still exist as anchors).
- **Downstream projects** — `@.ai-pm/tooling/WORKFLOW.md` byte-unchanged; no downstream-owned file changes; already-bootstrapped downstream `CLAUDE.md` comments that say "in WORKFLOW.md" remain cosmetically true-enough (the named section still exists; non-resolving prose, non-blocking — noted as residual).
- **A4 cross-checks** (`pm-architect`) — File layout ↔ `git ls-tree` (gains the `workflow/` dir + files) and Integration contract ↔ consumption mechanism (the `@`-line is unchanged; the new files are submodule-internal) stay accurate after the post-coding handoff.

## Contracts

None. A documentation/config restructure (relocate prose into topic files + repoint references + add Read steps). No API, data shape, schema, or downstream-consumed runtime artifact changes; the one consumed artifact (`@.ai-pm/tooling/WORKFLOW.md`) keeps its path and import contract.

## Stack expectations touched

(from `doc/stack-notes.md` § "Claude Code context-loading model" — added by `pm-stack-researcher` 2026-06-05, the grounding this whole feature rests on)

- **Claude Code context-loading model**: "Imported files are expanded and loaded into context at launch" and "Splitting into `@path` imports … does not reduce context, since imported files load at launch" — the rule that makes the monolith expensive and dictates the fix. Source: <https://code.claude.com/docs/en/memory>
- **Claude Code context-loading model**: CLAUDE.md "target under 200 lines … Longer files consume more context and reduce adherence" — the thin-core size target. Source: <https://code.claude.com/docs/en/memory>
- **Claude Code context-loading model**: the only documented lazy surfaces are the Skill body, path-scoped rules, and **Read-tool reads of non-imported files** — "an `@`-imported spec cannot be made lazy by `@`-splitting alone — load-on-demand requires the Read tool against non-imported files." This is why the topic files must be **Read**, not `@`-imported. Source: <https://code.claude.com/docs/en/memory>, <https://code.claude.com/docs/en/skills>
- **Claude Code context-loading model**: subagents "start with a fresh, isolated context window," DO load CLAUDE.md "except the built-in Explore and Plan agents," and do **not** auto-inherit skills (must be named in `skills:`) — why the thin core benefits subagents but each persona still needs explicit Read steps (and why Variant B/Skills was rejected). Source: <https://code.claude.com/docs/en/sub-agents>

## Interaction scenarios

Provably isolated: a static restructure of Markdown files within one submodule + reference repointing — no runtime, no shared mutable state, no concurrency, no I/O, no adjacent-feature state. The only coupling — live by-name references ↔ the topic-file homes ↔ the consumer Read steps ↔ the A4 File-layout pairing — is read sequentially and is fully covered by Scenarios 1–5, the anchor-inventory clean-grep, and the Read-step checklist.

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep, the same as every prior meta-feature; `tests/hooks.sh` stays green (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (17/17 — unchanged).
- New tests: none (prose/structure change). Verification instead:
  - **Anchor-inventory clean-grep (objective floor).** Every section that was referenced by name now grep-resolves under the same heading in exactly one `workflow/*.md` home; every one of the ~40 live consumer references points to the correct new file. Zero orphans; zero duplicate homes.
  - **Read-step checklist (the reliability floor).** A per-consumer list: every command/agent that needs an on-demand topic carries an explicit "Read `workflow/<topic>.md` before <step>" instruction — not just a renamed pointer. A renamed reference with no Read step is a finding (this is the one risk a name clean-grep alone cannot catch).
  - **Thin-core completeness.** `WORKFLOW.md` retains every always-on invariant (pm-* not wb-*, project boundary, edit-ownership one-liner, remote-system one-liner, git-flow skeleton, Step 0–7 skeleton, PM-comms core + language canon) and the full navigation map; nothing cross-cutting was demoted to a lazy file.
  - **Single-source-redundancy check.** The enum/default of each single-sourced subsection is declared exactly once (in its topic file); the "never re-encode the default" clauses are intact; no rule meaning was dropped (spot-check the deliberately-repeated invariants like "merge/ship stays manual in BOTH scopes").
  - **No-migration / downstream check.** `@.ai-pm/tooling/WORKFLOW.md` byte-unchanged; no downstream-owned file changed; no `MIGRATIONS.md` migration entry added (MIGRATIONS' *content references* are repointed, which is different).
  - **Stack-spec verification (against the cited rule).** Confirm the design actually reduces context per the cited `@`-eager rule: the bulk is reached via **Read**, not re-introduced through any new `@`-import; `WORKFLOW.md` is the only `@`-imported spec file and it is now thin. (Verifies behavior against the stack-notes rule, not a self-consistent restating.)
  - **A4 cross-check.** `doc/architecture.md` `## File layout` lists the `workflow/` directory + files and still matches `git ls-tree -r --name-only HEAD`; `## Integration contract` still accurately describes consumption (the `@`-line + submodule).
  - **Editorial walkthrough.** `WORKFLOW.md` reads coherently end-to-end as a constitution+router; each topic file stands alone; no dangling reference to a moved rule.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: the stack-spec verification bullet above (this repo has no automated test harness; it is an editorial/grep check against the cited rule).

## Docs to update

- `WORKFLOW.md` — **the deliverable (part 1)**: shrink to the thin constitution + router (Scenario 1). Authored by `pm-coder` (in the template repo `WORKFLOW.md` is source).
- `workflow/*.md` — **the deliverable (part 2)**: ~15 new on-demand topic files (Scenario 2), per the arch note's map. Authored by `pm-coder`.
- `.claude/commands/*.md` and `.claude/agents/*.md` — repoint every live by-name reference + add the procedural Read steps (Scenario 3 / the Read-step checklist). Authored by `pm-coder` (template source; downstream consumes these via symlink).
- `MIGRATIONS.md` — repoint its `### …in WORKFLOW.md` content references to the new homes (no migration entry added). Authored by `pm-coder`.
- `doc/_templates/CLAUDE.md.tmpl` — repoint the Project-kind comment to the new home (Scenario 5). Authored by `pm-coder`.
- `doc/architecture.md` `## File layout` (+ verify `## Integration contract`) — add the `workflow/` directory + files; confirm the consumption description still holds. Owned by `pm-architect`; spawned on the post-coding Docs-to-update handoff.
- `doc/stack-notes.md` — **already updated** (the "Claude Code context-loading model" entry, `pm-stack-researcher` 2026-06-05); no further change needed.
- *(No `MIGRATIONS.md` migration entry, no `CLAUDE.md` Pipeline / validator change — additive, no new validator.)*

## Out of scope

- **Changing the `@.ai-pm/tooling/WORKFLOW.md` import line or its path** — it stays byte-unchanged; that invariance is the no-migration anchor.
- **Converting the spec to Skills or to path-scoped `.claude/rules/`** — rejected in the arch note: the protocol's triggers are workflow-step/condition based, not file-path based, so Skills (description-match ≠ pipeline position; subagents don't auto-inherit skills) and path-scoped rules (no glob for "about to relay a PM decision") both fail to load the rule at the needed moment. Read-on-demand is the only fit.
- **Removing, renaming, or weakening any rule, gate, section name, step label, or single-source statement** — pure relocation + repointing; meaning is preserved 1:1. (Any genuine lossless prose-tightening is incidental, never a content cut.)
- **Touching frozen `doc/features/*_plan.md` audit-trail files** — their historical `WORKFLOW.md` mentions stay as-is (the named sections still exist as anchors).
- **Touching `tests/hooks.sh` or `.claude/settings.json`** — no hook changes; the hooks remain the hard enforcement floor.
- **The README-currency protocol gap** raised the same day — a separate `.ai-pm/backlog.md` item, not part of this restructure.
- **Sibling elements of the categorical choice "topic files"** — the full set of WORKFLOW.md sections is being decomposed (no element is singled out); the exact file boundaries are the coder's call within the arch note's map, not a product fork.
