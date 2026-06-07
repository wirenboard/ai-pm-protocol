# Execution State

> Resume pointer — lean by design. Recent steps in brief; older work compressed to one-liners; full detail lives in `doc/features/*_plan.md`, `.ai-pm/arch/`, and the commit log. Keep it this way (don't log every step in full).

- **Task:** OpenCode dual-harness support + token-frugality, dogfooded on THIS repo. Branch `feature/opencode-harness-support` = local main for the effort: **NO remote / NO push / NO PR**; sub-branch → review → merge-back; never merges to the real `main`; later **extracted** to a new source repo (PM provides target). Conversation: Russian. Artifacts: English. **Decision authority: autonomous** (procedural gates announce-and-proceed; product forks → PM; merge/ship manual).

- **Status:** OpenCode adapter functionally complete + faithful — verified LIVE on OpenCode 1.16.2 / DeepSeek, deployed + driving the pipeline correctly in the `nula` downstream (`/home/adegtyarev/Develop/Hobby/nula`).

- **Recent:**
  - `s16` (merged): per-agent reasoning `variant: minimal` on control agents (token-COUNT lever), single-sourced in the `models` block.
  - **NOW:** (A) plan the **leaner-always-on / targeted-reading** feature — the dominant token-COUNT lever (INPUT ≈84% of tokens); **MUST not break protocol correctness** → /pm-plan + arch note. (B) this state.md leaned (done).

- **Next:** plan+build (A) carefully → then input-leanness rollout. **Extraction stays PM-gated** ("after your real tests" + new-repo target + history-preservation choice).

- **Done — OpenCode effort (one-liners; detail in plans/commits):** s1 Claude generator+byte-equiv (golden) · s2 OpenCode adapter · s3 CORE enforcement plugin+config fix · s4 orchestrator question-seat · s5 plugin ESM-load fix · s7 review/research engines (code-review, deep-research) · s8 find-boundary deny · s9 cross-model pins (session v4-pro / control v4-flash) · s10 neutralize bodies + vocabulary/reference-table + golden re-freeze · s11 neutralize WORKFLOW+workflow/*.md · s12 ai-pm primary orchestrator · s13 orchestrator write path-scope · s14 orchestrator pipeline-order persona (decision-authority-aware) · s16 effort variant tier. Spikes A (submodule→symlink) + B (#5894 subagent containment WORKS on 1.16.2) execution-verified. Docs/contracts: doc/{product,product-map,user-journeys}.md + 10 Product Contracts (LLM/agent = the user) + architecture decision records + stack-notes execution-verified flips.

- **Deferred / backlog:** extraction (source/dist split) · install-prose neutralization (allowlist debt) · bash-write deny plugin (s15, defense-in-depth — persona holds well live) · "ask"-class enforcement guards · CI source→dist · test-infra no_proxy/stub robustness.

- **nula deploy:** submodule `.ai-pm/tooling`→this build; `.opencode/{agent,command,plugin}` symlinks; root `opencode.json` (default_agent: ai-pm, model v4-pro, instructions [WORKFLOW.md, AGENTS.md], question:allow); `AGENTS.md`→`CLAUDE.md`; plugin npm stub in `.opencode/node_modules` (proxy workaround). All git changes uncommitted for the PM.
