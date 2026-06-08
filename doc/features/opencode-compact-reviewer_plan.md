# OpenCode compact one-pass reviewer + control-layer model + ultra removal + single session default — plan

Source: PM 2026-06-07/08 conversation. Live nula review exposed several things at once: the baked `flash` cross-model layer was too weak; the OpenCode per-diff reviewer (`code-review` engine subagent) is a thin generic pass; and `/code-review ultra` is awkward (absent on OpenCode, clunky on Claude). The PM's consolidated direction below. Continues on the local integration branch `feature/opencode-harness-support` (sub-branch `--compact-reviewer`; no PR/main).

> **STATUS: DESIGN AGREED (PM 2026-06-07/08).** Scope settled through the conversation; the structural pieces (how to compress the multi-aspect orchestrator into one pass; how the control-layer model resolves) are GATED on a `pm-architect` arch note before coding. The mechanical pieces (ultra removal, hide build/plan, single default) can proceed once planned.

## The five pieces (PM-confirmed)

1. **A compact, single-agent, one-pass reviewer for OpenCode per-diff Pass-2.** Built by compressing the wb `code-review-orchestrator` skill (`wirenboard/wb-agent-tools` → `plugins/wb-development/skills/code-review-orchestrator`, private; SKILL.md ≈17.6 KB + 11 `references/*.md` aspect briefs) to roughly **a quarter of its size** and collapsing its **multi-agent fan-out** (one subagent per aspect + a coordinator) into **ONE subagent doing all aspects in a single pass**. It replaces the current thin shipped `code-review` engine subagent on OpenCode. Aspects to preserve (from the skill): security, stability, conventions, regressions, test-coverage, simplification, plan-compliance (blocking when a plan exists), architecture (forward-looking, non-blocking) — plus the shared severity/output discipline. **OpenCode-only** (Claude keeps its built-in `code-review`; PM 2026-06-07).
2. **Whole-codebase sweep fallback → the compact reviewer, not ultra.** Today the `/pm-audit` whole-codebase sweep prefers `wb-development:code-review-orchestrator` when installed and falls back to `/code-review ultra`. New rule: when the orchestrator is **not installed**, fall back to **the compact reviewer run over the whole codebase** (not ultra). The original multi-agent orchestrator stays the preferred whole-codebase engine when present.
3. **Remove `ultra` everywhere.** `/code-review ultra` is gone from the protocol — absent on OpenCode, clunky on Claude. Clean it from `workflow/review-typology.md`, `workflow/roster.md`, `src/commands/pm-audit.body.md` (→ regenerated `.claude/commands/pm-audit.md`), and `README.md`. (Cross-harness: touches Claude prose → the `.claude/` golden is re-frozen.)
4. **Control-layer model follows the reviewer (OpenCode only).** Every *checking* agent — the compact reviewer (`code-review`), `pm-auditor`, `pm-plan-checker`, `pm-product-advocate` — runs on the **reviewer's model when one is set, else the session model**. One choice governs the whole control layer; no other baked pins. *(Mechanism is the arch-note question — OpenCode has no native "inherit another agent's model", so this needs a generator-side single-source + a bump-surviving user-override layer; see Key design decisions + the arch note.)*
5. **Single session-model default + hide build/plan.** Retire the baked `flash`/`control`/`control_variant` cross-model pins — every agent inherits the session model by default (no per-agent baked pins). Ship `agent.build.disable = true` + `agent.plan.disable = true` so the personality picker shows only the protocol's own. (Spike-verified: `disable`, config-level `agent.<id>.{model,variant}` override, `mode:all` inherit-session all accepted on 1.16.2.)

## Existing behaviors this feature touches

- **`### Review typology` engine-selection rule** (`workflow/review-typology.md`): the two-engine rule changes — per-diff Pass-2 on OpenCode becomes the compact reviewer (Claude stays built-in `/code-review`); the whole-codebase fallback becomes the compact reviewer (not ultra); ultra removed. This is the single source — `pm-audit.md` references it.
- **The OpenCode `code-review` engine subagent** (harness-local generated): its body is rebuilt as the compact one-pass reviewer (compressed from the wb skill). Same generation mechanism (`harness_local_agents`); new body.
- **Slice-9 cross-model + effort-tiering**: retired (the `models.control*` keys + per-agent pins removed). Cross-model intent moves to the reviewer-model-follows mechanism (piece 4).
- **`/pm-audit` sweep prose** (`src/commands/pm-audit.body.md`): the fallback + ultra removal.
- **Claude self-host**: byte-identical EXCEPT the ultra-removal prose (pieces 3) which legitimately edits shared `workflow/*.md` + `src/commands/` → `.claude/` golden re-frozen. Pieces 1,2,4,5 are OpenCode-only.
- **`tests/`**: `oc-effort-tier`/cross-model assertions replaced; new assertions for the compact reviewer, control-layer model, build/plan disabled, ultra-absent.

## Test plan

- **Existing:** `tests/hooks.sh`; `tests/generator.sh` (golden re-frozen for the ultra-removal prose); `tests/oc-plugin-unit.js` 39/39; `tests/neutral-prose.sh`.
- **New/updated (`tests/opencode.sh` + a prose-grep test):**
  - `oc-compact-reviewer`: the generated OpenCode `code-review` agent is the compact one-pass reviewer (single subagent, covers the aspect set; no fan-out); guarded-skip runtime load check.
  - `oc-control-layer-model`: the checking agents resolve to the reviewer's model when set, else session (driven off the single source).
  - `oc-builtins-hidden`: shipped `opencode.json` disables build + plan.
  - `oc-single-model-default`: no baked per-agent model/variant pins; `models` block has no `control*` keys.
  - `ultra-absent`: a clean-grep that `ultra` no longer appears as a review level in `workflow/`, `src/commands/`, `README.md`, `.claude/` (and the golden).

## Docs to update

- **`pm-architect` arch note (REQUIRED, pre-coding):** (a) the compression design — how to fold the 10-aspect fan-out + coordinator into one single-pass reviewer at ~¼ size without losing the severity/dedup/plan-compliance-blocking discipline (what to keep verbatim, what to inline, what to drop); (b) the control-layer model mechanism on OpenCode (single-source generator pin + bump-surviving user override, given no native cross-agent inheritance); (c) the `### Review typology` rewrite (engine selection after ultra removal + compact reviewer as per-diff/ fallback). Gates pieces 1, 2, 4.
- `workflow/review-typology.md` + `workflow/roster.md`: engine-selection rewrite; ultra removed. Owned by `pm-architect` (canonical workflow prose) / the relevant owner; post-arch-note.
- `src/commands/pm-audit.body.md` → `.claude/commands/pm-audit.md`: sweep fallback + ultra removal.
- `README.md`: the review-engine section (`### Выбор движка ревью`) updated — compact reviewer, fallback, ultra gone.
- `doc/architecture.md`: decision record — compact one-pass OpenCode reviewer (from wb orchestrator, ¼ size, single-agent); control-layer-follows-reviewer model; single session default; build/plan hidden; ultra retired. Owned by `pm-architect`, post-coding (folded with the s15 backstop record).
- `doc/stack-notes.md`: the spike-verified OpenCode facts (`agent.<id>.disable`, config-level model/variant override, `mode:all` inherit-session) → `execution-verified`.
- `AGENTS.md` (generated): reviewer + model lines.

## Out of scope

- **Claude-side compact reviewer** — Claude keeps its built-in `code-review` (PM 2026-06-07). Only the ultra-removal prose touches Claude.
- **Claude-side control-layer model rule** — OpenCode only (PM). Claude cross-model stays the existing review-config mechanism.
- **Re-implementing the orchestrator's full multi-agent fan-out** — the point is the COMPACT single-pass form; the heavy original stays the preferred whole-codebase engine when installed, not something we rebuild.
- **The general per-agent-model / survive-bump framework** (backlog item) — this delivers the reviewer/control-layer slice of it.

## Key design decisions

- **Compress, don't port wholesale (PM: "сократив раза в 4, под одним агентом").** The wb orchestrator's value is its aspect briefs + severity/dedup/plan-compliance discipline; its cost is the fan-out. The compact reviewer keeps the judgement, drops the fan-out — one subagent reads the diff once and reports all aspects in the shared structured format, with plan-compliance still a hard blocker. Cheaper (one agent, one pass) and a real upgrade over today's thin OpenCode `code-review`.
- **One knob for the whole control layer (PM piece 4).** The reviewer's model, when set, governs every checking agent; unset → session. Simple mental model, one place to make the control layer "think harder / cross-model". The OpenCode mechanism (no native cross-agent model inheritance) is the arch-note's to design — likely a generator single-source value (default = session) injected into every checking agent, with the PM's override living in their own config to survive a bump.
- **Ultra retired (PM).** Absent on OpenCode, clunky on Claude; removing it simplifies the engine-selection rule to: per-diff = compact reviewer (OpenCode) / built-in `/code-review` (Claude); whole-codebase = wb orchestrator when installed, else the compact reviewer over the whole tree.
- **Structural pieces gated on the arch note.** The compression design + the control-layer mechanism are the load-bearing structural unknowns → arch note before coding (the protocol's gate for structural change), exactly as for context-leanness.
