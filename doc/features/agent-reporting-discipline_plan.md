# agent-reporting-discipline — plan

Source: PM-relayed reliability incident (backlog "Agents must not assert VCS / repo state from narrative — verify-or-stay-silent, and stay in their lane"). `pm-architect` reported a tracked file as "untracked" — a confabulated git-state claim it never verified, made outside its remit (git is the orchestrator's domain). PM framing: "мы же надеемся на них, а они врут" — a fabricated repo-state claim in an agent report is a trust tax on every report the orchestrator relays. **Worked locally during the repo-transfer window — no push / PR / merge until the new remote URL lands.**

## Scenarios

1. **Verify-or-stay-silent for repo/VCS facts.** Any agent claim about repository state — tracked/untracked, committed, branch, file presence, "byte-identical to main", test/pass counts — must be **backed by a command the agent ran this turn**, or **not stated**. This codifies the good habit several agents already follow (`pm-coder` cites real `hooks.sh` counts; `pm-plan-checker` re-runs the suite; `pm-pr-prep` runs git) and bans the narrated-from-memory variant.
2. **Lane discipline — doc/review agents do not narrate git/tracking state.** A doc/review agent (`pm-architect`, `pm-auditor`, `pm-codebase-reader`, `pm-plan-checker`, `pm-product-advocate`) authors its artifact and reports on **that**; it does **not** narrate git / tracking / branch / commit state — that is the orchestrator's domain (the existing "git workflow — orchestrator owns this, not subagents" boundary). If a tracking observation is irrelevant to the agent's task (it is, for a doc owner), stay silent.
3. **Single-sourced + referenced by name.** The rule lives **once** in `workflow/enforcement.md` (extending the existing "## Git workflow — orchestrator owns this, not subagents" boundary), and the reporting agents reference it **by name** — never re-encode it. The agents that already read `enforcement.md` (`pm-coder`, `pm-plan-checker`, `pm-product-advocate`) inherit it; the reporting agents that do **not** currently read it (`pm-architect`, `pm-auditor`, `pm-codebase-reader`, `pm-stack-researcher`, `pm-pr-prep`) gain a one-line by-name reference in their Output/Report section so the rule actually reaches them (the offender `pm-architect` is the proof case — it does not read `enforcement.md` today).
4. **Honest scope — discipline, not a mechanical guarantee.** This is a prompt/discipline fix; an LLM can still confabulate. The rule narrows the surface (don't volunteer VCS claims; cite-or-omit) and the lane boundary removes the most common occasion for it. No hook (a regex cannot judge "did the agent verify this claim") — the same no-hook-for-semantic-judgement family as the changeset-hygiene / test-wiring-parity disciplines.

## Existing behaviors this feature touches

- `workflow/enforcement.md` "## Git workflow — orchestrator owns this, not subagents" — extended with the reporting clause; the existing git-ownership boundary, the boundary/edit-ownership rules, and the hook-level enforcement section are unchanged.
- The reporting agents' Output/Report sections — gain a by-name reference (one line each) for the agents that don't already read `enforcement.md`; their actual output formats are unchanged.
- Agents that already cite real command output (`pm-coder` hooks.sh, `pm-plan-checker` suite re-run, `pm-pr-prep` git) — the rule **affirms** their existing habit; no behavior change for the good cases.

## Contracts

(no Product Contract — protocol agent-reporting discipline; not user-facing product behavior.)

## Stack expectations touched

(none — Markdown agent/orchestration prose; no library/format/external-system idiom touched.)

## Interaction scenarios

Provably isolated: prose additions to `workflow/enforcement.md` + one-line by-name references in agent definition files. No shared mutable state, no concurrency, no I/O. The references all point at the single rule home; no cross-agent interaction beyond the shared reference.

## Test plan

- Existing tests that must pass: all of `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: **none** — Markdown protocol-discipline change in a markdown-prose repo with no runtime/linter to host a test for "did the agent verify its claim." Verification is editorial: Pass-1 plan-compliance (the rule is single-sourced in `enforcement.md`, referenced by name from the reporting agents that don't already read it, not re-encoded) + Pass-2 `code-review` over the diff + validation-by-use. Documented-boundary, matching the recent prose-feature precedent.

## Docs to update

- `doc/architecture.md`: a short decision record — "Agent reporting discipline: verify-or-stay-silent for repo/VCS facts + doc/review agents do not narrate git state (orchestrator's lane); single-sourced in `workflow/enforcement.md`, referenced by name; no hook (semantic-judgement family)." Note the motivating confabulation incident. Authored by `pm-architect` post-coding. *(Irony noted: the offending agent authors the record of its own fix — fine, the record is about the rule, and the rule now governs it.)*
- `workflow/enforcement.md` + the reporting agent files: the actual rule + references — protocol source, authored by `pm-coder`.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change; README-currency trigger does not fire.)

## Out of scope

- **A hook / mechanical enforcement** — rejected; "did the agent verify this claim" is not regex-decidable (the no-hook-for-semantic-judgement family). Soft discipline + lane boundary only.
- **Rewriting agents that already cite real command output** — `pm-coder` / `pm-plan-checker` / `pm-pr-prep` already verify-and-cite; the rule affirms, it does not rework them.
- **The reviewability track B (linters) / C (idioms)** and the other open items — separate features.
- **Changing what git operations agents may perform** — unchanged; this is about *narrating/asserting* git state in reports, not about who runs git (that boundary already exists).
