# Execution State

- **Status:** coding — `diagnostic-flow-discipline` (folds two PM-relayed diagnostic-flow feedback items into one feature). Plan: `doc/features/diagnostic-flow-discipline_plan.md`.
- **Decision authority:** `autonomous` (project-wide) — procedural gates announce-and-proceed; merge/ship manual. **Product forks go to the PM** ("продуктовые решения со мной"). Conversation language: Russian.
- **Branch:** `feature/diagnostic-flow-discipline` (cut fresh from main after #240/v2.34.0 merged; carried the "diagnostic-flow gap (2)" backlog entry onto Step 0).
- **Last shipped (this session):** v2.32.0 (#238 review-engine-selection + audit-scope-menu), v2.33.0 (#239 changeset-hygiene), v2.34.0 (#240 test-wiring-parity) — all merged to main.
- **This feature — four additions to `workflow/incident.md` + 1 line to `pm-stack-researcher.md`:**
  1. Step A names **passive observation** (tcpdump / BLE-mDNS scan / bus capture) as read-only — no Step A.5 auth, no Blast-radius preflight; bounded **observe-vs-emit** (emitting toward a coupled peer stays under A.5 + preflight).
  2. **Bisect before you hypothesize** — cheapest path-splitting observation first.
  3. **Stop-and-research tripwire (anti-thrash)** — two failed fixes on the same symptom → consult the canonical source, not another patch.
  4. **Stack-research as mid-debug escalation** — spawn `pm-stack-researcher` when reality contradicts an already-cited stack rule (not only up-front); `pm-stack-researcher.md` records the added context.
- **Done (coder):** `workflow/incident.md` — Step A extended with passive observation + observe-vs-emit boundary; "Bisect before you hypothesize"; "Stop-and-research tripwire (anti-thrash)"; "Stack-research is a mid-diagnosis escalation" (all additive; Step A.5 / Blast-radius preflight / line 18 "relaxes nothing" untouched). `.claude/agents/pm-stack-researcher.md` — one mid-debug invocation-context line, up-front contexts kept. hooks.sh 73/73.
- **Remaining:** none for coder.
- **Docs to update (pm-architect, post-coding):** `doc/architecture.md` decision record — **landed**. `### Diagnostic-flow discipline: passive observation is read-only, bisect-before-hypothesize, an anti-thrash tripwire, and mid-debug stack-research` added under `## Architectural decisions` (additive; relaxes none of the Blast-radius / Step A.5 rules; no-hook semantic-judgement family; reuses pm-stack-researcher; Source: the plan).
- **Touched files:** `workflow/incident.md`, `.claude/agents/pm-stack-researcher.md`, `doc/architecture.md`, `.ai-pm/state/current.md`.
- **Next step:** review loop — `pm-architect` arch handoff **done** → `pm-plan-checker` Pass 1 → `code-review` Pass 2. hooks.sh stays 73/73 (no hook). Stamps end `— passed`.
- **Out of scope:** the Blast-radius preflight rule (unchanged); new agent/command/hook (reuses pm-stack-researcher); Steps B/C/D + Step 5.5; mechanical auto-detect of "two failed fixes"; the other open items (agent-VCS reliability; reviewability B linters / C idioms).
- **Dogfood:** clean diff — additive prose only, no reflow of untouched lines.
