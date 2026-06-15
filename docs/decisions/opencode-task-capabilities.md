# OpenCode `task` tool — model pin, background, resume

Verified 2026-06-15 against OpenCode docs + GitHub issues; environment under
test: `opencode 1.17.7` (the installed CLI). Three questions about the `task`
spawn primitive our adapter rests on.

## Q1 (PRIMARY) — does `task` honour a subagent's `model:` frontmatter?

**Verdict: CONDITIONAL, effectively FALSE on the current line.** The docs say
yes; the runtime does not, across the whole 1.2 → 1.4+ range, and 1.17.7 (ours)
is past every confirmed-broken version with no changelog fix.

- **Docs claim it works.** opencode.ai/docs/agents: *"Use the `model` config to
  override the model for this agent."* and *"If you don't specify a model …
  subagents will use the model of the primary agent that invoked the subagent."*
  Markdown frontmatter format is confirmed correct on our side — key `model:`,
  value `provider/model` (e.g. `anthropic/claude-sonnet-4-20250514`), directory
  `.opencode/agents/` (plural). So `install-agents.mjs` bakes the *right* key in
  the *right* place; the format is not the defect.
- **Runtime ignores it — a cluster of OPEN bugs, no fix shipped:**
  - #21632 *"subagent model variants are parsed but not applied at runtime in
    v1.4.0"* (OPEN, regression from 1.3.17): *"The config is parsed correctly,
    but the effective request behavior does not reflect the configured model
    variant."* Config-visible via `opencode debug agent`, dead at execution.
  - #17870 *"Subagent spawned via Task tool uses global config model instead of
    inheriting parent session's active model"* (OPEN, v1.2.27).
  - #18615 *"Model parameter ignored when launching subagent with agent name"*
    (OPEN, v1.2.27) — the SDK `model` param is dropped for the agent's fallback
    chain.
  - Siblings, same class, OPEN: #20859 (Copilot provider), #22130 (subagent in
    `opencode.json` treated as primary), #6636, #8896, #5623.
- **No per-spawn escape hatch landed.** PR #14961 added an optional `model`
  parameter to the Task tool (resolution `params.model` > `agent.model` > parent
  session) — **CLOSED unmerged** (auto-closed 2026-04-26, 60 days idle). #6651
  remains an OPEN feature request for exactly this. The changelog shows **no**
  entry fixing subagent model application through the current line.

**Downstream symptom is a genuine platform limitation (a), not our bug (b/c).**
The report (reviewer baked with `deepseek/deepseek-v4-flash`, ran on the session
model) is the documented #21632/#17870 behaviour. Our frontmatter is correct;
OpenCode does not apply it at `task` runtime.

**What the adapter changed (DONE).** The old `install-agents.mjs` assumption ("the
install step is where a cross-model reviewer is realised") was **false on OpenCode**,
so the adapter now takes option (2): `resolveModelPin` returns `null` for an
OpenCode concrete pin exactly as it does for `auto`/`session`/absent — no `model:`
line is ever baked, the reviewer runs on the session model, and nothing claims a
cross-model independence the runtime can't deliver. The reason is documented in
three durable homes: the honesty note in `orchestrator.md ## Your seat` (widened
from "no second model exists" to also cover "the pin is silently swallowed on
OpenCode"), the `## Setup` step-2 model question (do not offer an OpenCode pin as
independence), and `tool-map.json models.opencode._note`. A recorded pin is kept
in config so it auto-heals the day upstream fixes the cluster or the project moves
to Claude. Option (3) — a plugin prosthesis spawning the child via SDK
`session.prompt({ model })` — stays parked (note #18615 says the SDK param is
*also* ignored for a named agent — verify before building); a separate backlog
candidate explores a *manual* UI-model-switch prosthesis (subagents inherit the
primary/session model). Re-check option (2)'s necessity at each release-audit —
the day the cluster is fixed upstream, the bake path can return.

## Q2 — can `task` spawns run in the background / concurrently?

**YES, recently.** Changelog **v1.16.2**: *"Running subagents can now be sent to
the background so you can keep working."* Our environment (1.17.7) has it. This
flips the `tool-map.json` honest-absence note and the parallel-work
honest-bottleneck note — background subagent spawn is now a real OpenCode
primitive, not an assumed gap. (Concurrency of *multiple* simultaneous `task`
calls beyond background-one is **unverified** — the changelog names backgrounding,
not a documented parallel fan-out count.)

## Q3 — does `task` support resume/continue of an existing subagent?

**No native `task` resume — 2026-06-12 finding stands, with a nuance.** No
`task`-tool session-id/resume parameter exists; each call is a fresh child
session. The SDK `session.prompt` **does** take an existing session via its
`path` (the session `id`) plus a `model`/`parts`/`noReply` body, so the plugin
prosthesis (custom `continue_subagent(session_id, message)` tool) remains
feasible. Changelog session-replay entries (v1.16.0 ACP replay, v1.15.5
`--replay`) are general session history, **not** subagent continuation —
unverified as a substitute. Keep `continue-a-sub-agent: null` + fresh-spawn
fallback honest; the prosthesis stays parked (vendor still moving here).

## Decisions grounded

- **Q1:** the OpenCode cross-model-reviewer realisation is **non-functional** on
  the current line — a feature must make it honest (fail-loud or "not realisable")
  rather than silently bake a pin we know is ignored. Blocks the *deepseek
  reviewer default* and *per-seat model matrix* items on OpenCode until upstream
  fixes the cluster or a verified SDK path exists. Re-check at each release-audit
  (vendor-watch): watch #21632 / #17870 / #6651 for a fix.
- **Q2:** parallel-work on OpenCode is **viable** — update `tool-map.json` and the
  parallel-work note to record background subagent spawn (v1.16.2+) as present.
- **Q3:** no change — `null` + fresh-spawn fallback stays; prosthesis parked.

## Sources

opencode.ai/docs/agents · opencode.ai/docs/sdk · opencode.ai/changelog (v1.16.2,
v1.16.0, v1.15.5) · github.com/anomalyco/opencode issues #21632, #17870, #18615, #6651, #20859, #22130, #6636, #8896, #5623 and PR #14961 (closed unmerged) · installed `opencode 1.17.7`. Where the changelog names no fix, the absence is recorded as "no fix shipped through the current line", not "fixed".
