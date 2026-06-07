# Per-operation effort/model tiering — plan

Source: PM 2026-06-07 — "у нас гигантский расход токенов" (token COUNT, on the Claude/Opus dev side). PM chose to formalize per-operation effort/model tiering ("делай по протоколу"). Continues on the local integration branch `feature/opencode-harness-support`.

> **STATUS: APPROVED (direction).** Design settled from the discussion + a feasibility spike. Frugal build: one coder pass, verify once.

## Spike findings (orchestrator, 2026-06-07)

- **Per-agent `variant` IS accepted** in OpenCode agent frontmatter (`opencode debug config --pure` exit 0 with `variant: minimal` on an agent). Top-level `variant` in `opencode.json` is rejected — so the tier is set **per agent**, not globally.
- **Reasoning is a minor token share on DeepSeek:** nula totals reasoning 33K / input 359K / output 34K — reasoning ≈ **8%**, INPUT ≈ **84%**. So effort-tiering trims the reasoning slice (larger on Opus-xhigh, small on DeepSeek). **INPUT context per spawn is the dominant COUNT driver** — addressed by fewer spawns (batching) + leaner always-on, NOT by this feature. Recorded honestly; this slice does the cheap, one-place effort tier and flags input-leanness as the bigger follow-up.

## Scenarios

1. **Each OpenCode agent carries a reasoning-effort tier matched to its role.** The single `models` block (`src/manifests/opencode/adapter.json`) gains a per-tier `variant`: the **control/review** agents (code-review, pm-plan-checker, pm-auditor, pm-product-advocate — already on the flash model) get a **low-reasoning** `variant` (e.g. `minimal`); the **producers** (orchestrator, pm-architect, pm-coder, pm-codebase-reader, pm-stack-researcher, pm-pr-prep, deep-research) keep the **default/high** reasoning their work needs. The generator injects the `variant` into each agent's frontmatter from the single config — changeable in one place.
2. **The tiering policy is recorded as a protocol standard, both harnesses.** A decision record + AGENTS.md note state: routine/check operations run at low reasoning effort, hard operations (planning, architecture, coding, orchestration) at high. On **OpenCode** this is the per-agent `variant` (this slice). On **Claude Code** the orchestrator already tiers review/audit via the cross-model config (`.ai-pm/review-config.md`) and chooses a per-subagent model when spawning routine work — documented, not re-mechanised.
3. **Nothing regresses.** Both adapters still generate + load; the control agents keep their flash model pin (slice 9) AND gain the low `variant`; producers unchanged; Claude byte-identical.

## Existing behaviors this feature touches

- **The slice-9 `models` block + cross-model pins.** Extended (a `variant` dimension added to the same single-source block); the existing `control`/`session`/`control_agents` semantics are unchanged.
- **The generated OpenCode agent frontmatter.** Control agents gain a `variant:` line (injected by the generator, like the slice-9 model pin). Producers gain none (default reasoning).
- **Claude self-host.** Untouched — Claude byte-identical (`generated-claude-adapter-byte-equivalent` 4/4); the Claude side is policy/doc only.

## Test plan

- **Existing:** `tests/hooks.sh` 79/79; `tests/generator.sh` 4/4 (Claude byte-equivalent); `tests/opencode.sh` + plugin-unit + neutral-prose green.
- **New:**
  - `oc-effort-tier`: assert each control agent's generated `.opencode/agent/*.md` frontmatter carries the configured low `variant`, and producers carry NONE — driven off the single `models` block (so it stays correct if the values change). Guarded-skip runtime check that the config stays valid (`opencode debug config --pure` exit 0 with the variants present).

## Docs to update

- `doc/architecture.md`: a short decision record — **per-operation reasoning-effort tiering** (routine/check ops low, hard ops high; OpenCode per-agent `variant` from the single `models` block; Claude via per-subagent model + the cross-model config). Owned by `pm-architect`, post-coding. Honest note: effort tiering trims the reasoning slice (~8% on DeepSeek, larger on Opus); the dominant token-COUNT driver is INPUT context per spawn (the leaner-always-on follow-up).
- `AGENTS.md` (generated): one line on the effort tier in the orchestrator/model section.

## Out of scope (the BIGGER follow-up — flagged, not built here)

- **Input-context leanness — the dominant COUNT lever.** Each agent spawn reloads tens of K of input (the always-on core, the large agent bodies, whole docs like the 184KB `architecture.md`). Cutting THAT (agents read targeted sections not whole docs; leaner always-on; smaller bodies; fewer spawns via batching) is where most of the token COUNT lives — a separate, larger feature. Caching reduces COST, not COUNT.
- **The orchestrator's own batching / verify-once discipline** — an operating practice (the orchestrator does this directly), not a protocol artifact.
- **Claude-side per-subagent effort** — Claude effort is the session setting, not per-subagent; only per-subagent MODEL is settable. Documented, not mechanised.

## Key design decisions

- **Single-source the tier in the `models` block.** Add a `variant`/tier field to the existing slice-9 `models` config (one authored place); the generator injects per agent. "Поменять — одно место," consistent with the model pins.
- **Effort is the COUNT lever; model is the COST lever.** A smaller model cuts $/token but not input volume (slice-9 already pins control→flash for cost); a lower `variant` cuts reasoning-token COUNT. This slice adds the COUNT lever (variant) on top of the existing cost lever (model pin).
- **Honest scope:** effort tiering is a real but secondary COUNT win (reasoning ≈ 8% on DeepSeek, larger on Opus-xhigh); the dominant driver is INPUT — flagged as the bigger follow-up, not silently skipped.
