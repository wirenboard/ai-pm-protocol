# orchestrator-read-discipline — plan

Source: PM-directed 2026-06-05 — live structural gap found while dogfooding `workflow-progressive-disclosure` (v2.29.0). The orchestrator applied the decision-authority escalate-cap from stale memory of the pre-shrink `WORKFLOW.md` without reading `workflow/decision-authority.md`, and mis-escalated on a fabricated high-stakes premise. PM chose the fix as **1+2, one feature**.

*Close the orchestrator-side Read-discipline gap the progressive-disclosure restructure left: detailed rules now live in on-demand `workflow/*.md`, and the "Read `workflow/<topic>.md` before X" mitigation was wired into commands/agents (carried by subagents + injected procedures) — but the **orchestrator's own freeform conversational reasoning** has no forcing function to re-read a rule's home, so it can apply a half-remembered rule. Fix: **(1)** give the template repo its **own root `CLAUDE.md`** that `@`-imports the thin `WORKFLOW.md` core, so dogfooding actually loads the thin core + router + cross-cutting invariants for the orchestrator (today the template repo has no `CLAUDE.md` → nothing auto-loads); **(2)** add an **always-on cross-cutting invariant** to the thin `WORKFLOW.md` core — before applying or citing any `workflow/*.md` rule, Read its file in the current turn, never from memory. (1) is the prerequisite that makes (2) reach the orchestrator-as-dogfooder; (2) also reaches every downstream orchestrator (it rides the `@`-imported core).*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = the orchestrator, the template repo's own `CLAUDE.md` config, the `WORKFLOW.md` thin core). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep; `tests/hooks.sh` stays green (no hook touched).

**Honest scope note:** this fixes the **structural** gap (orchestrator can apply an on-demand rule without re-reading it). It does **not** claim to fix general diligence/pacing lapses (acting before fact-checking, rushing) — those are behavioral, not structural, and out of scope.

## Scenarios

1. **The template repo gets its own root `CLAUDE.md`.** A new `CLAUDE.md` at the repo root that **`@`-imports the thin `WORKFLOW.md` core** (`@WORKFLOW.md` — in the template repo `WORKFLOW.md` is at root, not the downstream `.ai-pm/tooling/` path) plus the minimal dogfood essentials (a `## Project kind: software` line, mirroring `doc/_templates/CLAUDE.md.tmpl`; a one-line note that this repo develops itself under its own protocol). Effect: when the protocol is developed by its own pipeline, the orchestrator now auto-loads the thin core + navigation map + cross-cutting invariants — instead of nothing. The `@`-import loads only the ~80-line thin core (the `workflow/*.md` topic files stay on-demand), so the always-loaded cost is the intended ~2.5k tokens.

2. **A new always-on cross-cutting invariant in the thin `WORKFLOW.md` core.** In the `## Cross-cutting invariants (always on)` section, add a one-liner: **before applying or citing any `workflow/*.md` rule, Read that file in the current turn — do not act on it from memory** (the always-loaded core carries only the router pointer + one-liner per topic; the load-bearing detail lives in the topic file and must be pulled before use). It sits with the other always-on invariants so it is present wherever the thin core is loaded — the template repo (via Scenario 1) and every downstream project (via its existing `@.ai-pm/tooling/WORKFLOW.md` import).

3. **Additive, no migration.** The template `CLAUDE.md` is new and template-repo-local (downstream projects already have their own `CLAUDE.md` from `doc/_templates/CLAUDE.md.tmpl`, untouched). The new invariant rides the thin core → downstream picks it up on the next routine submodule bump, like any other `WORKFLOW.md` change. The downstream `@.ai-pm/tooling/WORKFLOW.md` import contract and `WORKFLOW.md`'s path are byte-unchanged. No `MIGRATIONS.md` entry, no template structural migration.

## Existing behaviors this feature touches

(what must not break)

- **The thin `WORKFLOW.md` core stays thin.** The new invariant is a single always-on one-liner in the existing `## Cross-cutting invariants` section — it must not balloon the core or pull topic detail back in (that would undo `workflow-progressive-disclosure`).
- **The downstream import contract** (`@.ai-pm/tooling/WORKFLOW.md`) and `WORKFLOW.md`'s root path — byte-unchanged; the new template-repo `CLAUDE.md` uses `@WORKFLOW.md` (root-relative), distinct from the downstream path.
- **Single-source discipline** — the new invariant references the Read-before-apply discipline generically; it must **not** re-encode any topic rule's content or any enum/default.
- **The template repo's dogfooding flow** — adding a root `CLAUDE.md` must complement, not conflict with, the injected `/pm-*` command procedures (the core + router is always-on context; the procedures are injected on Skill invoke — they coexist).
- **A4 File-layout ↔ tree cross-check** — a new root `CLAUDE.md` makes the module map diverge until updated; `pm-architect` adds the row on the post-coding handoff.
- **`tests/hooks.sh`** — no hook / `.claude/settings.json` touched; 74/74 stays green.

## Contracts

None. A new config file (template-repo `CLAUDE.md`) + a one-line always-on invariant in `WORKFLOW.md`. No API, data shape, schema, or downstream-consumed runtime artifact changes (the `@`-import contract is unchanged).

## Stack expectations touched

(from `doc/stack-notes.md` § "Claude Code context-loading model" — the platform facts this feature rests on)

- **Claude Code context-loading model**: "Imported files are expanded and loaded into context at launch" — the basis for Scenario 1 (a root `CLAUDE.md` with `@WORKFLOW.md` makes the thin core auto-load for the orchestrator). Source: <https://code.claude.com/docs/en/memory>
- **Claude Code context-loading model**: CLAUDE.md is loaded at session start; "an `@`-imported spec cannot be made lazy by `@`-splitting alone — load-on-demand requires the Read tool against non-imported files" — the basis for Scenario 2 (the topic files are NOT auto-loaded, so the orchestrator must Read them; the invariant makes that a rule). Source: <https://code.claude.com/docs/en/memory>
- **Claude Code context-loading model**: CLAUDE.md "target under 200 lines" — the new `CLAUDE.md` + the `@`-imported ~80-line core stay well under the budget. Source: <https://code.claude.com/docs/en/memory>

## Interaction scenarios

Provably isolated: a new static config file + a one-line addition to a doc — no runtime, no shared mutable state, no concurrency, no I/O, no adjacent-feature state. The only coupling — the `CLAUDE.md` `@`-import ↔ the thin core ↔ the A4 File-layout pairing — is read sequentially and covered by Scenarios 1–3 + the clean-grep.

## Test plan

*Repo discipline: no automated tests by design — verification is editorial + clean-grep; `tests/hooks.sh` stays green (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (74/74 — unchanged).
- New tests: none (config + doc change). Verification instead:
  - **Template `CLAUDE.md` present + correct.** A `CLAUDE.md` exists at the repo root; it `@`-imports `@WORKFLOW.md` (root-relative, the thin core); it carries `## Project kind: software` and a one-line dogfood note; it stays small (well under the 200-line guidance) and pulls in only the thin core, not the topic files.
  - **Always-on invariant present + correct altitude.** `WORKFLOW.md` `## Cross-cutting invariants (always on)` carries the Read-before-apply invariant as a one-liner; it does not re-encode any topic rule/enum/default; the core stays thin (no topic detail pulled back).
  - **Downstream contract intact.** `@.ai-pm/tooling/WORKFLOW.md` and `WORKFLOW.md`'s path byte-unchanged; downstream `doc/_templates/CLAUDE.md.tmpl` untouched.
  - **A4 cross-check.** `doc/architecture.md` `## File layout` lists the new root `CLAUDE.md`; the table still matches `git ls-tree -r --name-only HEAD`.
  - **No-migration check.** No `MIGRATIONS.md` entry; no `.claude/settings.json` / `tests/hooks.sh` change.
  - **Dogfood validation-by-use.** With the template `CLAUDE.md` in place, a subsequent session opened in this repo auto-loads the thin core (confirmable by the file existing + the `@WORKFLOW.md` line resolving) — the structural fix is in effect.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none beyond the editorial check that the design respects the cited context-loading rules (this repo has no automated harness).

## Docs to update

- `CLAUDE.md` (repo root) — **the deliverable (part 1)**, new file (Scenario 1). Authored by `pm-coder` (template-repo config, the dogfood counterpart of `doc/_templates/CLAUDE.md.tmpl`).
- `WORKFLOW.md` — **the deliverable (part 2)**: add the always-on Read-before-apply invariant to `## Cross-cutting invariants (always on)` (Scenario 2). Authored by `pm-coder` (template-repo source).
- `doc/architecture.md` `## File layout` — add the root `CLAUDE.md` row (Scenario / A4). Owned by `pm-architect`; spawned on the post-coding Docs-to-update handoff.
- *(No `MIGRATIONS.md` entry, no `doc/stack-notes.md` change — the context-loading entry already exists — no new validator, no `doc/_templates/CLAUDE.md.tmpl` change.)*

## Out of scope

- **General diligence / pacing lapses** (acting before fact-checking, rushing into Step 0, not reading the source) — behavioral, not structural; this feature only closes the structural "apply an on-demand rule without re-reading it" hole.
- **A `PreToolUse` / `UserPromptSubmit` hook that force-reads a topic file** — rejected: the trigger ("about to apply a `workflow/*.md` rule") is a semantic judgement a regex cannot make; a hook would be blunt and noisy. The always-on invariant + the auto-loaded core are the proportional mechanism.
- **Changing `doc/_templates/CLAUDE.md.tmpl` or the downstream import path** — downstream already `@`-imports the tooling `WORKFLOW.md`; the new invariant rides that core unchanged.
- **The periodic whole-codebase review feature** (#372) — deliberately dropped to do this first; it returns afterward, unstarted (nothing was branched).
- **Sibling elements of categorical choices** — none; the feature has no categorical product fork.
