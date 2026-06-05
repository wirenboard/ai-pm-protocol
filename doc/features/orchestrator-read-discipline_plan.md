# orchestrator-read-discipline — plan

Source: PM-directed 2026-06-05 — live structural gap found while dogfooding `workflow-progressive-disclosure` (v2.29.0): the orchestrator applied the `### Decision authority` escalate-cap from stale memory without reading `workflow/decision-authority.md`, and mis-escalated. PM required a **systemic** fix (rejected the first-attempt band-aid). Design: `.ai-pm/arch/orchestrator-read-discipline_arch.md` (Variant A — move the kernel, don't add an instruction).

*Close the orchestrator-side Read-discipline gap **structurally**, not by another please-read instruction. Root cause: the progressive-disclosure boundary was drawn by section-shape, so `### Decision authority` — which the **orchestrator applies in freeform reasoning on every fork** (escalate-or-proceed, the whole announce-and-proceed style) — was filed as an on-demand topic, leaving its decision-critical kernel out of context. The orchestrator then applied it from memory and got it wrong. Fix: **(1)** give the template repo its own root `CLAUDE.md` that `@`-imports the thin `WORKFLOW.md` core (so dogfooding loads the core at all — structural prerequisite); **(2)** **move the decision-authority kernel into the always-on core** as a cross-cutting invariant (its single home), delete the enum/default from `workflow/decision-authority.md` and have that file reference the core kernel (no double-encoding); **(3)** record the **boundary principle** that drove it — a rule the orchestrator applies in freeform reasoning outside any injected procedure keeps its kernel always-on — so the mis-classification cannot recur. The correct rule is now **present in context** (authoritative over memory), not "please remember to Read it."*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = the orchestrator, the template repo's `CLAUDE.md` config, the `WORKFLOW.md` thin core, `workflow/decision-authority.md`). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep (incl. a single-source no-double-encoding grep); `tests/hooks.sh` stays green (no hook touched).

**Honest scope + residual:** this fixes the **structural** gap (the decision-critical rule is in context, not recalled). A platform hard-gate is **impossible** — the trigger "about to apply a workflow rule" touches no tool/path/command, so no hook can fire on it; the systemic ceiling is "kernel present in context, authoritative over memory." It does **not** claim to fix general diligence/pacing lapses (acting before fact-checking, rushing) — those are behavioral, out of scope.

## Scenarios

1. **The template repo gets its own root `CLAUDE.md`** (structural prerequisite). A new `CLAUDE.md` at the repo root `@`-imports the thin `WORKFLOW.md` core (`@WORKFLOW.md`, root-relative — in this repo WORKFLOW.md is at root, not the downstream `.ai-pm/tooling/` path) + a `## Project kind: software` line + a one-line dogfood note. Effect: when the protocol is developed by its own pipeline, the orchestrator auto-loads the thin core + router + cross-cutting invariants — instead of nothing. Loads only the ~80-line core; topic files stay on-demand.

2. **The decision-authority kernel moves into the always-on core (single home); the topic file references it.** In `WORKFLOW.md` `## Cross-cutting invariants (always on)`, add the **decision-authority kernel** as a compact cross-cutting invariant — the **escalate-regardless cap** (its 3 triggers: not-derivable-from-canon / security-surface-on-security-bearing / PM-marked-irreversible-or-high-stakes), the **derivability test** (derivable-from-cited-canon → auto-resolve + announce; else escalate), **announce-before-act**, **merge-always-manual**, and the **enum + `absent ⇒ interactive` default** — ~5–7 lines, the always-applied subset. Correspondingly, **delete the enum/default (and the kernel restatement) from `workflow/decision-authority.md`**; that file keeps only the **elaboration** (the 3 named procedural-gate instances, feature-selection specifics, the `## Resolutions` `auto|escalated` recording mechanics, the value-home file + rationale, per-feature override / resolution order, the veto-window caveat, the consumer list + "never re-encode" prohibition) and **references the core kernel** instead of restating it (the same shape `workflow/enforcement.md` uses for the edit-ownership kernel). The `### Decision authority` **heading stays** in `workflow/decision-authority.md` — the anchor does not move, so all live by-name references resolve byte-identically (zero repointing). Single home for the kernel = the core; single home for the elaboration = the topic file.

3. **The boundary principle is recorded so the mis-classification cannot recur.** Sharpen the thin core's intro with a one-line criterion: *a rule the orchestrator applies in its own freeform reasoning, outside any injected procedure (potentially on every action), keeps its decision-critical kernel in the always-on core; on-demand carries only what is applied inside a procedure (which has its own Read-steps) or at a specific step.* The criterion lives **in the always-loaded core** (not behind a Read — putting the criterion itself on-demand would recreate the recall-trap). It is also recorded as a Decision in this feature's arch note and as a one-line refinement to `workflow-progressive-disclosure`'s boundary decision (Decision 2) in `doc/architecture.md`.

4. **"Read before apply" survives only as a trimmed secondary backstop.** The first-attempt always-on "Read before apply" bullet is **demoted**: it no longer carries decision-critical weight (the kernel is now present), and is trimmed to cover only the **on-demand elaboration** (the full topic-file detail) — "before acting on the *full detail* of a `workflow/*.md` rule, Read its file; the decision-critical kernels are already in this core." Kept as a backstop, not the fix.

5. **Additive, no migration.** The template `CLAUDE.md` is new and template-repo-local (downstream keeps its own from `doc/_templates/CLAUDE.md.tmpl`, untouched). The kernel-move + criterion ride the thin core → downstream picks them up on the next routine submodule bump. The downstream `@.ai-pm/tooling/WORKFLOW.md` import contract and `WORKFLOW.md`'s path are byte-unchanged. No `MIGRATIONS.md` entry, no template structural migration.

## Existing behaviors this feature touches

(what must not break)

- **Single-source discipline (the load-bearing constraint).** The decision-authority enum / default / cap / derivability kernel must exist in **exactly one** place after this change — the core. `workflow/decision-authority.md` must **not** restate it (that double-encoding is the drift the discipline forbids). A no-double-encoding clean-grep is the verification floor.
- **All 16 live `### Decision authority` by-name references** (across `.claude/`, `MIGRATIONS.md`, `doc/`) — must keep resolving. They resolve because the heading stays in `workflow/decision-authority.md`; the only new link is inbound (topic file → core kernel). Zero repointing; no orphan.
- **The thin core stays thin** — net growth ~+4–6 lines (kernel bullet minus the demoted band-aid line); progressive-disclosure's ~12.5k saving is preserved. Only genuinely-cross-cutting kernels return to the core (the criterion bounds this).
- **The downstream import contract** (`@.ai-pm/tooling/WORKFLOW.md`) + `WORKFLOW.md` path + `doc/_templates/CLAUDE.md.tmpl` — byte-unchanged.
- **A4 File-layout ↔ tree** — the new root `CLAUDE.md` row (already added by `pm-architect` this branch) keeps the map matching `git ls-tree`.
- **`tests/hooks.sh`** — no hook / `.claude/settings.json` touched; 74/74 stays green.

## Contracts

None. A config file + a doc-tier reclassification (move a kernel between two protocol-spec files, add a criterion line). No API, data shape, schema, or downstream-consumed runtime artifact changes (the `@`-import contract is unchanged).

## Stack expectations touched

(from `doc/stack-notes.md` § "Claude Code context-loading model")

- **`@`-import is eager (loads at launch)** — basis for Scenario 1 (root `CLAUDE.md` with `@WORKFLOW.md` auto-loads the thin core) and Scenario 2 (a kernel in the `@`-loaded core is *present in context*, the structural fix). Source: <https://code.claude.com/docs/en/memory>
- **Topic files are not auto-loaded — load-on-demand requires the Read tool** — why the kernel must be in the core, not left in the on-demand file. Source: <https://code.claude.com/docs/en/memory>
- **CLAUDE.md "target under 200 lines"** — the new `CLAUDE.md` (~15 lines) + the `@`-imported ~80-line core + ~5 kernel lines stay well under budget. Source: <https://code.claude.com/docs/en/memory>

## Interaction scenarios

Provably isolated: a new static config file + content moved between two static spec files + one criterion line — no runtime, no shared mutable state, no concurrency, no I/O. The only coupling — the kernel's single home ↔ the topic file's reference to it ↔ the 16 by-name references ↔ the A4 row — is read sequentially and covered by Scenarios 1–5 + the no-double-encoding and by-name clean-greps.

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep; `tests/hooks.sh` stays green (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (74/74 — unchanged).
- New tests: none (config + spec-reclassification change). Verification instead:
  - **No-double-encoding clean-grep (single-source floor).** The decision-authority enum (`autonomous | interactive`), the `absent ⇒ interactive` default, the escalate-cap triggers, and the derivability test appear in the **core kernel and nowhere else** — `workflow/decision-authority.md` references them, does not restate them. A second encoding is a blocking finding.
  - **Kernel completeness in the core.** The core kernel carries: the 3 escalate-cap triggers, the derivability test, announce-before-act, merge-always-manual, the enum + default — the always-applied subset, compact (~5–7 lines), no elaboration pulled in.
  - **Elaboration intact + references the core.** `workflow/decision-authority.md` keeps the 3 procedural-gate instances, feature-selection, `## Resolutions` mechanics, value-home rationale, override/resolution-order, veto caveat, consumer list — and points to the core kernel for the enum/default/cap/derivability.
  - **By-name resolution.** Every live `### Decision authority` reference still resolves to the heading in `workflow/decision-authority.md`; zero orphans, zero repointing needed.
  - **Boundary criterion present in the always-loaded core** (not behind a Read); recorded too in this arch note + the `doc/architecture.md` Decision-2 refinement.
  - **"Read before apply" demoted** — trimmed to the secondary-backstop wording (full-detail only), no longer decision-critical.
  - **Template `CLAUDE.md` correct** — `@WORKFLOW.md` import, `## Project kind: software`, dogfood note, small.
  - **A4 + thin-core + no-migration** — File layout lists `CLAUDE.md`; core net growth small; `@`-line byte-unchanged; no `MIGRATIONS.md` entry.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: editorial check against the cited context-loading rules (no automated harness).

## Docs to update

- `CLAUDE.md` (repo root) — **deliverable, new file** (Scenario 1). Already authored on this branch; keep. `pm-coder`.
- `WORKFLOW.md` — **deliverable**: add the decision-authority kernel to `## Cross-cutting invariants (always on)` (Scenario 2); sharpen the intro with the boundary criterion (Scenario 3); demote/trim the "Read before apply" bullet to the secondary backstop (Scenario 4). `pm-coder`.
- `workflow/decision-authority.md` — **deliverable**: delete the enum/default/kernel restatement; keep elaboration; reference the core kernel (Scenario 2). `pm-coder`.
- `doc/architecture.md` — `## File layout` row for the new `CLAUDE.md` (already added this branch by `pm-architect`); **plus** a one-line refinement to the `workflow-progressive-disclosure` boundary decision (Decision 2) recording the freeform-vs-procedure criterion (Scenario 3). Owned by `pm-architect`; spawned on the post-coding handoff.
- *(No `MIGRATIONS.md` entry, no `doc/stack-notes.md` change, no new validator, no `doc/_templates/CLAUDE.md.tmpl` change.)*

## Out of scope

- **The band-aid-only fix** (an always-on "Read before apply" instruction as the primary mechanism) — explicitly rejected by the PM as a crutch; it survives only as a trimmed secondary backstop (Scenario 4). The primary fix is structural (kernel in context).
- **A platform hook to force-read** — impossible (semantic trigger, nothing for a hook to fire on); stated as the honest residual.
- **General diligence / pacing lapses** — behavioral, not structural; out of scope.
- **A broad re-sweep moving other topic files' content into the core** — the arch-note sweep found only decision-authority mis-placed (enforcement/project-boundary/remote-system/language-canon kernels are already in the core); the criterion bounds future moves, this slice moves only decision-authority.
- **Changing `doc/_templates/CLAUDE.md.tmpl` / the downstream import path** — downstream rides the core unchanged.
- **The periodic whole-codebase review feature** (#372) — deferred; returns after this, unstarted.
