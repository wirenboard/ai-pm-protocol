# Harness-neutral prose — plan

Source: PM-found via a real OpenCode/DeepSeek deployment in the `nula` downstream (2026-06-07). Realizes the item the `opencode-harness-support` plan **explicitly deferred** (`doc/features/opencode-harness-support_plan.md` line 100: "The wholesale reword of every inline Claude-primitive mention is **scoped by the architecture decision**, not assumed here"). Continues on the local integration branch `feature/opencode-harness-support` (no remote, no PR, sub-branches merged back — the established git-flow override for this effort).

> **STATUS: DRAFT / UNAPPROVED.** Central design fork (prose form + golden treatment) is **gated on a `pm-architect` arch note** (see Key design decisions). PM decisions so far: **scope = full corpus** (bodies + `WORKFLOW.md` + `workflow/*.md`); **form = "neutral nouns + one harness-reference table", NOT scattered build-time tokens** (AskUserQuestion 2026-06-07). No coding until the arch note settles the form and the PM greenlights.

## Problem

The dual-harness **structure** works (both adapters generate, load, enforce, cross-model — slices 1–9, all merged). But the shared neutral-source **prose** is written in Claude-specific terms throughout, so an OpenCode session reads instructions about Claude primitives that don't exist / differ on OpenCode. Audit of the shared bodies (`src/agents/*.body.md` + `src/commands/*.body.md`): `CLAUDE.md` — 9 files / 33 hits; `AskUserQuestion` — 6 files / 15 hits; `.claude/` — 2 files / 5; `@.ai-pm/tooling` / `settings.json` / `PreToolUse` — 1 each; `.git/hooks` — 1 file / 3. **`WORKFLOW.md` + nearly all `workflow/*.md`** (the always-on core OpenCode loads via the `instructions` array) carry the same Claude-flavored prose — and are the **most** load-bearing surface, since they are read on every session.

## Scenarios

1. **The protocol's instruction prose reads correctly on any harness.** A reader (human or model) of any neutralized file — a `pm-*` agent/command body, `WORKFLOW.md`, a `workflow/*.md` topic — sees harness-agnostic **neutral nouns** for every harness-specific concept ("the project entry file", "the structured-question tool", "the enforcement layer", "the instruction-loading mechanism", "the change-intent route reminder"), never a bare Claude primitive (`CLAUDE.md`, `AskUserQuestion`, `settings.json` `PreToolUse` hook, `@`-import, `UserPromptSubmit`) presented as the only/native form.
2. **A single harness-reference table is the one home that maps neutral nouns → each harness's concrete primitive.** The protocol carries exactly one named reference (the realization of the already-built harness-neutral vocabulary layer / `src/manifests/capabilities.json`) mapping every neutral noun to its Claude and OpenCode concretes (entry file → `CLAUDE.md` / `AGENTS.md`; structured-question → `AskUserQuestion` / `question`; enforcement → `settings.json` `PreToolUse` hook / the `tool.execute.before` plugin; instruction-loading → `@`-import / `instructions` array; route-reminder → `UserPromptSubmit` hook / always-on `AGENTS.md` content). A reader who needs the concrete consults that one table; the prose itself stays neutral.
3. **Harness-specific concretes live only in the per-harness adapter layer.** Where a procedure genuinely needs the concrete (e.g. the install/bootstrap step naming `CLAUDE.md` vs `AGENTS.md`, the enforcement-mechanism mention), the concrete is **extracted to the adapter layer** (the harness-reference table + the per-harness manifest/AGENTS.md), not woven through the shared prose. The shared prose names the neutral concept and points at the table.
4. **Both adapters still generate and load; the Claude adapter's behaviour is governed by the arch-note form decision.** Regenerating produces a valid `.claude/` and `.opencode/`; `tests/hooks.sh` stays green; the OpenCode adapter loads and an OpenCode session reads neutral (not Claude-flavored) instructions. Whether the Claude `.claude/` stays **byte-identical** (generator resolves neutral nouns → Claude concretes) or **changes to neutral nouns** (golden re-frozen) is the central fork the arch note settles.
5. **The protocol's own dogfood reads neutral too.** Because post-extraction the protocol consumes its own dist as a submodule and "develops itself as a downstream project" (PM realization 2026-06-07; the `nula` deployment is the first instance of this model), the neutralized prose serves the protocol's **own** future dogfood on either harness, not just an external downstream. The neutralization is the protocol's documentation-quality standard for a dual-harness world.
6. **No Claude-ism regresses in.** A guard fails if a neutralized file reintroduces a bare Claude primitive outside the reference table (the standard is mechanically enforced, the same way `single-source-diff-clean` enforces single-source).

## Existing behaviors this feature touches

(What must not break — the protocol develops itself under its own protocol on Claude Code.)

- **The Claude `.claude/` adapter + the frozen golden + `generated-claude-adapter-byte-equivalent`.** This is the crux the arch note decides: form (a) re-freezes the golden (Claude prose becomes neutral nouns); form (b) keeps it byte-identical (generator resolves neutral → Claude concretes). Either way `tests/hooks.sh` stays green and the Claude self-host pipeline keeps working.
- **The `@`-import chain** `CLAUDE.md` → `@WORKFLOW.md` → on-demand `workflow/*.md`. Neutralizing `WORKFLOW.md`/`workflow/*.md` must not change what a Claude session is *able to do* — only how the prose *names* harness-specific concepts. The on-demand Read-of-topic-files mechanism (harness-agnostic) is unchanged.
- **The OpenCode adapter (slices 1–9) — agents, commands, plugin, opencode.json, AGENTS.md, cross-model pins.** Unchanged in mechanism; the prose they carry/point at becomes neutral.
- **The harness-neutral vocabulary layer `src/manifests/capabilities.json`** (built in slices 1–3). This feature **extends/realizes** it as the reader-facing reference table; must stay the single source of the neutral↔concrete mapping (no second copy).
- **`MIGRATIONS.md`, `doc/_templates/*`** — if they carry the same Claude-isms, they are in the same corpus; the arch note + scope decide whether they ride this slice or a follow-up (they are delivered downstream too).

## Contracts

N/A — this template repo has **no user-facing Product Contracts** (recorded exception in `doc/architecture.md` § "Contract-centric product map"). No contract created or changed.

## Stack expectations touched

(From `doc/stack-notes.md` § "OpenCode" — execution-verified on 1.16.2.)
- **Instruction entry — config-listed `instructions` array; no in-file `@`-import** (`execution-verified`). `WORKFLOW.md`/`workflow/*.md` reach an OpenCode session via the `instructions` array, so their **prose is read every session** — neutralizing it is the highest-value part. Source: <https://opencode.ai/docs/config/>, <https://opencode.ai/docs/rules/>
- **Entry file is `AGENTS.md`, not `CLAUDE.md`; OpenCode does not read a project `CLAUDE.md`** (`execution-verified`). The "project entry file" neutral noun maps to `CLAUDE.md` (Claude) / `AGENTS.md` (OpenCode). Source: <https://opencode.ai/docs/rules/>
- **`question` / `skill` tools present; no `UserPromptSubmit`-equivalent; enforcement = `tool.execute.before` throw** (`execution-verified`). These are the concretes the reference table maps the neutral nouns to. Source: <https://opencode.ai/docs/tools/>, <https://opencode.ai/docs/plugins/>
- **The harness-neutral vocabulary layer** (`src/manifests/capabilities.json`, this repo) is the existing single-source mapping this feature turns into the reader-facing reference table — extend, don't duplicate.

## Interaction scenarios

(Not isolated — the neutralized prose is shared by both adapters + read by the protocol's own dogfood.)
- **When a Claude self-host session reads the neutralized `WORKFLOW.md`/bodies:** it follows the same pipeline as today; the only change is harness-specific concepts are named neutrally (+ resolvable via the reference table or already-Claude-concrete per the form decision).
- **When an OpenCode session reads the same neutralized core via `instructions`:** it reads neutral nouns it can act on (no Claude-only primitives), and resolves concretes via the reference table / its own AGENTS.md.
- **When the generator builds both adapters from the neutralized source:** both produce valid, loadable adapters; the form decision governs whether `.claude/` is byte-identical or neutral-noun.
- **When a Claude-ism is accidentally reintroduced into a neutralized file (e.g. a future edit writes "update CLAUDE.md"):** the Claude-ism guard (Test plan) trips, the same loud-fail discipline as `single-source-diff-clean`.

## Test plan

- **Existing tests that must pass:** all of `tests/hooks.sh` (79/79); the generator / opencode / plugin suites green; `generated-claude-adapter-byte-equivalent` (its golden re-frozen or preserved per the arch-note form).
- **New tests:**
  - `neutral-prose-no-claude-isms`: given the neutralized corpus (the in-scope files), when scanned for bare Claude primitives (`CLAUDE.md`, `AskUserQuestion`, `settings.json` `PreToolUse`, `@`-import-as-the-only-mechanism, `UserPromptSubmit`, `.claude/`), then **none appears** except inside the single harness-reference table (the allowed home) — the standard, mechanically enforced. Given/when/then per the residual-token allowlist the arch note defines.
  - `harness-reference-table-complete`: given the reference table, when each neutral noun used in the prose is looked up, then it has BOTH a Claude and an OpenCode concrete — no neutral noun is unmapped (the table is the complete single source).
  - `both-adapters-still-build-and-load`: given the neutralized source, when both adapters are generated, then `.claude/` and `.opencode/` are produced and load (guarded-skip the runtime load when `opencode` absent); the Claude byte-equivalence holds per the form decision.
- **Interaction scenario tests (one per Interaction scenario above):**
  - `claude-adapter-behavior-unchanged`: regenerate `.claude/`; assert behaviour-equivalence per the form (byte-identical, or neutral-noun-but-golden-re-frozen-and-hooks-green).
  - `opencode-core-is-neutral`: assert the OpenCode-delivered core (`WORKFLOW.md` + `workflow/*.md` as loaded via `instructions`, the `.opencode/` bodies) carries no bare Claude primitive outside the table.
  - `claude-ism-reintroduction-trips-guard`: inject a bare `CLAUDE.md` into a neutralized file; assert `neutral-prose-no-claude-isms` fails (guard is live, not vacuous).
- **Stack-spec tests (one per stack expectation):**
  - `oc-core-loads-neutral-via-instructions`: the `WORKFLOW.md` path in `instructions[]` resolves and the loaded core is neutral. Comment cites <https://opencode.ai/docs/config/>.
  - `reference-table-matches-capabilities`: the reader-facing reference table's neutral↔concrete mapping is the SAME single source as `src/manifests/capabilities.json` (no drift / no second copy). Comment cites the capabilities layer.

## Docs to update

- `doc/architecture.md`: a decision record — **harness-neutral prose standard** (the protocol's instruction prose uses neutral nouns + a single harness-reference table; harness concretes extracted to the adapter layer; the golden treatment chosen by the arch note; this is the protocol's dual-harness documentation-quality standard, and it serves the protocol's own dogfood-as-downstream model). Owned by `pm-architect`, post-coding handoff.
- The **harness-reference table** itself — its single named home (extend `src/manifests/capabilities.json` and/or a reader-facing rendered table the arch note specifies). Authored as part of the groundwork; its location is an arch-note output.
- `doc/stack-notes.md`: no new flips expected (the OpenCode facts are already `execution-verified`); add a note only if the neutralization surfaces a new concrete. Owned by `pm-stack-researcher` if it fires.
- `WORKFLOW.md` / `workflow/*.md`: these ARE the neutralized artifacts (the deliverable), not a side "docs to update" — the coder neutralizes them as the feature body; the arch note + `### Decision authority`-style cross-cutting wording is preserved in meaning.

## Out of scope

- **The form decision itself** — settled by the `pm-architect` arch note (reader-consulted neutral table + golden re-freeze, vs generator-applied substitution keeping Claude byte-identical). The plan finalizes after it.
- **Install auto-detect / extraction / the dogfood-loop mechanism** — separate, PM-gated (extraction is "after the PM's real tests"). This feature only neutralizes the prose; it does not change install or perform extraction.
- **Non-prose harness work** — frontmatter, the enforcement plugin, cross-model pins, the review/research engine (all built, slices 1–9). This is prose-only.
- **Re-wording for clarity beyond harness-neutrality** — this slice neutralizes harness-specific terms; a general prose-quality rewrite is not in scope (do not change meaning, only the harness-specific naming).
- **Sibling downstream targets** — `nula` is the validation instance; this feature changes the protocol source, not any specific downstream.

## Key design decisions

- **Scope = full corpus (PM, AskUserQuestion 2026-06-07).** Bodies (`src/agents/*.body.md` + `src/commands/*.body.md`) **and** `WORKFLOW.md` + `workflow/*.md`. Rationale: `WORKFLOW.md`/`workflow/*.md` are the always-on core OpenCode loads via `instructions` — the most-read surface; neutralizing only the bodies would leave an OpenCode session reading a Claude-flavored core.
- **Form = neutral nouns + one harness-reference table, NOT scattered build-time tokens (PM, AskUserQuestion 2026-06-07).** The PM rejected per-file token substitution as a maintenance burden ("надо это всё поддерживать"); the standard is neutral nouns in the prose + one reference table (the vocabulary layer made reader-facing). **Whether that table is consulted by the READER (prose stays neutral on both harnesses; golden re-freezes) or APPLIED by the GENERATOR (prose resolves to each harness's concrete; Claude byte-identical) is the central structural fork — REOPENED for the arch note**, which must weigh: reader experience (abstract nouns + table vs concrete words per harness), the golden (re-freeze vs preserve), and the maintenance surface (one shipped table vs one generator-applied table). Orchestrator's non-binding lean: a single generator-applied reference table is NOT the "scattered tokens" the PM rejected (the source stays readable neutral nouns, one table drives the resolution) and it preserves the Claude self-host experience byte-for-byte — but this is close and explicitly deferred to the arch note.
- **Dogfood-as-downstream (PM realization 2026-06-07).** Post-extraction the protocol consumes its own dist as a submodule and develops itself as a downstream (the `nula` deployment is the first instance). The neutral prose therefore serves the protocol's own future dogfood on either harness — neutralization is a first-class protocol standard, not OpenCode-only polish.
- **This feature needs an architecture review** — it sets a structural standard for the protocol's self-documentation, decides the prose-form/golden fork, and chooses the reference-table home. Recommend a `pm-architect` arch note before implementation.
