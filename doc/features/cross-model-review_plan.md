# cross-model-review — plan

Source: PM directive 2026-06-05, sharpening backlog #101 (cross-model review) into project-level config. **Narrative:** *plan and code on the session model; review and audit can run on a different model (different blind spots).* A different model catches what the maker-model misses — proven live this session (a Sonnet review caught a real gap in `agent-reporting-discipline` the Opus passes missed). The load-bearing idiom — running the **built-in** `code-review` inside a subagent pinned to a different model — was **execution-verified by a throwaway spike** (subagent reported `claude-sonnet-4-6`, `code-review` available + produced a real finding). Worked locally during the repo-transfer window — no push/PR/merge until the new remote URL lands. Stacked on `feature/stack-idioms-library` (C).

## Scenarios

1. **Four project settings in a single-source file `.ai-pm/review-config.md`** (mirroring `.ai-pm/decision-authority.md`):
   - `review-diff-model` — per-diff code review (Pass-2, every feature).
   - `review-full-model` — whole-codebase quality sweep (`/pm-audit` `## Technical quality`).
   - `audit-model` — protocol-compliance audit (`pm-auditor`).
   - `review-scope: auto | high-risk` — which per-diff changes get a non-session review model (`auto` = all; `high-risk` = only security-surface / irreversible / PM-flagged; others stay on session). Fine-tune; default `auto`.
   The three model settings take **`session | auto | opus | sonnet`**. **Default `session`** (back-compat — today's behavior, review on the session model; cross-model is an explicit opt-in). `auto` = a review-capable model **different from the session**. **Absent / unrecognized ⇒ `session`** (no behavior change for an unconfigured project). The rule (enum, `auto` semantics, default, mechanism, fallback, Haiku-blacklist) is single-sourced in `workflow/review-typology.md` `### Cross-model review`; consumers reference it by name.
2. **Haiku is blacklisted for review.** The enum omits `haiku`; `auto` selects **only among review-capable models (Opus / Sonnet), never Haiku** — even when the session runs on Haiku, `auto` resolves to a stronger reviewer. An explicit `haiku` is **refused with a warning** and treated as `session`.
3. **`review-diff-model` — built-in `/code-review` pinned, no custom reviewer.** When it resolves to a model ≠ session, the orchestrator runs the built-in `code-review` inside a subagent pinned to that model (spike-verified) and the findings land in the existing `## Code review` trail unchanged (stamp gate untouched). `review-scope` gates which diffs this applies to.
4. **`review-full-model` — engine chain, model-pinned where it is ours.** The sweep keeps its existing engine selection and gains the model knob, as a chain: **`code-review-orchestrator` if installed → `/code-review ultra` → built-in `/code-review`**. The orchestrator is **just a skill with no model of its own**, so running it in a subagent pinned to `review-full-model` runs it (and its fan-out) on that model — **pinnable**. The built-in path is **pinnable** (spike). **`ultra` is the one exception** — it runs in the cloud (multi-agent, model not ours); on the ultra path the model knob does not apply and the orchestrator announces "ultra selects its own models". *To-verify before relying (spike-gate discipline): that the orchestrator skill's fan-out subagents inherit the pinned model; recorded as a verify-before-rely, not asserted as fact.*
5. **`audit-model` — `pm-auditor` pinned.** `pm-auditor` is the protocol's own agent (an Agent spawn), so the orchestrator pins its model directly via the Agent model override. Cleanly pinnable.
6. **Fallback — never an error, never false diversity.** If a resolved model **equals** the session or is **unavailable**, the activity runs on the session model and the orchestrator announces "no cross-model this run (review model = session / unavailable)". Review/audit always still runs.

## UX flow

- **Bootstrap asks once.** `/pm-bootstrap` asks: "Plan & code run on your session model. Review and audit can run on a **different** model for independent blind spots — keep them on the session model (default), or set a cross-model (`auto` / `opus` / `sonnet`)?" Writes `.ai-pm/review-config.md`.
- **Read fresh per review/audit + announce.** The orchestrator reads `.ai-pm/review-config.md` **right before each review/audit** (not cached at session start) and **announces the model it uses** each time — e.g. "Code review on Sonnet (independent of your Opus session)". **No session restart is ever needed** for a config change: the review runs in a spawned worker pinned to the configured model (spike-verified — a worker runs on a different model than the session), so the orchestrator simply reads the current value before spawning. A change applies **from the next review**. (The only thing a restart governs is the *session* model — what you plan/code on — a Claude Code relaunch, unrelated to this config.)
- **Change via an explicit command, dialog scoped to the command.** The PM does not hand-edit the file in the normal flow; a command opens a dialog that **asks only what the command did not already specify** (`AskUserQuestion`):
  - **which + value both named** ("review diff on opus") → no dialog; confirm + write.
  - **which named, value missing** ("change the auditor") → one question: set `audit-model` to `session | auto | opus | sonnet`. Only that setting — the command scopes it; diff/full/scope are untouched.
  - **unspecified** ("change the review model") → step 1: which setting(s) — **multi-select** (one or several) → step 2: value(s) for the picked setting(s). One write covers all picked.
  Then write `.ai-pm/review-config.md` and confirm; the change applies from the next review — **no restart**. Direct file edits remain possible for power users; the command path is the supported UX.

## Existing behaviors this feature touches

- **Step 5 Pass 2** (`workflow/pipeline.md` / `WORKFLOW.md`) — resolve `review-diff-model`; when ≠ session, run the built-in review pinned. `## Code review` stamp, trail, and `pm-pr-prep` gate **unchanged** (only the model changes).
- **`/pm-audit` `## Technical quality` sweep** (`.claude/commands/pm-audit.md`) — gains `review-full-model` over the existing engine chain (engine-selection unchanged; this adds the model).
- **`pm-auditor`** — gains `audit-model` (the orchestrator pins its spawn model when running `/pm-audit`).
- **`### Review typology`** (`workflow/review-typology.md`) — gains `### Cross-model review` as a sibling of engine-selection (engine = which reviewer; model = which brain; orthogonal).
- **`/pm-bootstrap`** — the setup question + writes the config (mirrors decision-authority `mode:`).
- **Pass-1 (`pm-plan-checker`)** — **unchanged / session model** (out of scope v1; the narrative is review + audit).

## Contracts

(no Product Contract — protocol-configuration feature; operational knobs, documented, not a product API.)

## Stack expectations touched

- **Claude Code Agent/subagent model override** running the built-in `code-review` skill — **execution-verified** by the spike (subagent on `claude-sonnet-4-6`, skill available, real finding). The orchestrator-skill fan-out model-inheritance is a recorded **verify-before-rely**, not an asserted fact. (No `docs/stack-notes.md` in this markdown-prose repo; the spike is the verification of record.)

## Interaction scenarios

Provably isolated at the prose level (settings + orchestration routing + bootstrap question + a migration entry). One runtime interaction: when a review runs in a model-pinned subagent, its output must land in the normal trail/stamp exactly as in-session (spike-confirmed for the built-in path).

## Migration (downstream)

- **`MIGRATIONS.md`** — add a `### Pending-migration detection` entry + procedure: an existing downstream project bumping the template has **no `.ai-pm/review-config.md`** → **absent ⇒ `session`**, so **nothing changes by default** (non-disruptive). `/pm-audit` (or the next `/pm-plan`) **offers** to set up the config (the same bootstrap question), but does not force it. The migration is purely additive and back-compat-safe — no existing review behavior changes unless the PM opts in.

## Test plan

- Existing tests that must pass: all of `tests/hooks.sh` — untouched (no hook); confirm 73/73.
- New tests: **none automated** — protocol orchestration-prose + a config file in a markdown-prose repo with no runtime/linter to host a "did review run on the configured model" test. Mechanism verified by the throwaway **spike** (recorded) per the spike-gate discipline. Verification is editorial (Pass-1 + Pass-2) + the spike + validation-by-use.

## Docs to update

- `doc/architecture.md`: decision record — the four settings, default `session` (back-compat) + opt-in cross-model, the built-in-pinned mechanism (spike-verified), the full-review engine chain (orchestrator-pinned / ultra-cloud / built-in-pinned), `audit-model` via the pm-auditor spawn, the bootstrap/announce/change-via-dialog-+-restart UX, the downstream migration, Haiku-blacklist; sharpens #101. `pm-architect`.
- `workflow/review-typology.md`: `### Cross-model review` single-source rule — `pm-coder`.
- `workflow/pipeline.md` (Step 5) + `.claude/commands/pm-audit.md` (`## Technical quality` + the audit-model spawn) + `.claude/commands/pm-bootstrap.md` (question) + `MIGRATIONS.md` (migration): wiring — `pm-coder`.
- `.ai-pm/review-config.md` (this repo, dogfood — default `session`) + `doc/_templates/` (downstream template config + `CLAUDE.md.tmpl` pointer): config file — `pm-coder`.
- `README.md`: short note — review/audit can run cross-model (default session; how to set/change) — README-currency trigger fires; `pm-architect`.

## Out of scope

- **Pass-1 (`pm-plan-checker`) cross-model** — v1 covers diff review + full sweep + compliance audit; plan-compliance stays session model.
- **A custom reviewer agent / re-encoded review prompt** — rejected (a hand-rolled reviewer would be worse than the polished built-in). We reuse the built-in `code-review` / the orchestrator skill, only changing the model.
- **Forcing the session model itself** — the protocol cannot change the running session's model (a launch choice); it only pins review/audit subagents. "Cheaper everywhere" = run the session on Sonnet at launch, noted in docs.
- **Changing the session model** (what you plan/code on) — that is a Claude Code relaunch, outside this config; this feature only sets the model review/audit *workers* run on. (A review-config change itself needs **no** restart — read fresh per review.)
- **A hard gate / hook** — model selection is config + routing; no `PreToolUse` hook (soft-config family, like decision-authority `mode:`).
