# z.ai support — GLM the model vs ZCODE the harness

Assessed 2026-06-19 from z.ai docs + web. The Operator asked whether to add
z.ai support to the protocol. The request splits into two unrelated questions
because our adapter axis is the **harness** (hooks, sub-agent spawn, deny layer),
not the model. The model is already a config field (`roles.model`).

## Q1 — GLM-4.6 as a model behind an Anthropic-compatible endpoint

**Verdict: ALREADY SUPPORTED, zero protocol work.** The GLM Coding Plan is a
model plus an Anthropic-compatible endpoint (`https://api.z.ai/api/anthropic`),
consumed by *existing* harnesses — Claude Code, OpenCode, Cline, Kilo Code, and
others — via `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`. Run Claude Code
pointed at that endpoint and the protocol works unchanged: every hook, deny, and
spawn is Claude Code's, which we already adapt. GLM-4.6 benches ~ on par with
Sonnet 4 / 4.5; price $6–60/mo vs Claude's $100–200.

- **What to add:** nothing mechanical. At most one doc line: "to run on GLM,
  point Claude Code (or OpenCode) at z.ai's endpoint; the active adapter is
  still `claude`/`opencode`."
- **Honesty caveat — cross-model independence.** A session pointed at z.ai runs
  *both* Builder and Reviewer on GLM (the endpoint is per-session, global). So
  `auto` for the Reviewer yields no cross-model independence — same situation as
  OpenCode today (`opencode-task-capabilities.md` Q1). Say so plainly; don't
  present GLM-via-Claude-Code as a cross-model reviewer.

## Q2 — ZCODE as a third native adapter

**Verdict: FEASIBLE IN PRINCIPLE, BLOCKED ON A LIVE PROBE.** ZCODE
(`zcode.z.ai`) is z.ai's own first-party CLI/Electron agent, and it is clearly
modelled on Claude Code — the same vocabulary (Skills, Subagents, Hooks, MCP,
commands, Plugins). A plugin "can bundle skills, commands, subagents, and MCP
servers" and includes "automation hooks triggered on specific events." That
shape is promising for an adapter — but the two contract points our guarantees
*rest on* are **not confirmed by the docs**, and one shows an active
contradiction:

| Contract point | Status from docs |
| --- | --- |
| tool-map (read/write/edit/bash) | likely ✅ (CC-shaped) |
| **deny via a blocking hook** (PreToolUse `permissionDecision: deny` equiv.) | ⚠️ **unconfirmed** — hooks exist; the docs do not state a hook can *block* a tool call |
| **custom sub-agent spawn** (Builder/Reviewer) | ⚠️ **contradictory** — the Subagents page says "does not currently support user-defined custom subagents" (only built-in `Explore`); other material implies `~/.zcode/cli/agents/` markdown with `name/description/model/tools` frontmatter |
| continue a sub-agent | ❓ unknown (optional) |
| load instructions (AGENTS/CLAUDE.md equiv.) | ❓ likely, unconfirmed |
| install into a project | ❓ unknown |

**Why those two are load-bearing.** No *blocking* hook ⇒ the entire
`[mechanical]` floor degrades to persona-only (worst case). No custom
sub-agents ⇒ no independent Reviewer spawn ⇒ the core guarantee (reviewer ≠
builder, fresh context) collapses to persona-only too. An adapter that delivers
neither is not a guarantee profile — it is `yolo` with extra steps.

**The known trap — do not build on docs.** Docs claiming a capability the
runtime silently swallows is exactly the fail-open class we were burned by on
OpenCode 1.17.x: the reviewer `model:` pin parsed-but-ignored (Q1 there), and
the enforcer plugin "registered" but never loaded
(`persona-floor-external-substitute.md` lineage). Our own audit lens already
encodes the cure — the plugin-load probe: boot the real platform and confirm a
deny actually fires. ZCODE gets the same treatment before any adapter code.

## The GO/NO-GO probe (settles Q2)

A hands-on capability probe on a real ZCODE install (needs a subscription). GO
only if **both** primaries pass:

1. **Blocking deny:** write a trivial ZCODE plugin/hook that denies a tool call
   (e.g. a write into a forbidden path). Boot a real ZCODE session, attempt the
   write, confirm it is *blocked with a message* — a true mechanical deny, not a
   model refusal. *(Mirror of the OpenCode plugin-load probe in `## Audit`.)*
2. **Custom Reviewer spawn:** define a custom sub-agent (a Reviewer) and confirm
   the primary can spawn it on a *fresh, separate* context that returns a
   verdict. If only `Explore` exists, this fails.

Secondary (shape the adapter, not GO/NO-GO): instruction-load mechanism
(AGENTS/CLAUDE.md equiv.), install glue, optional continue primitive,
per-sub-agent model (cross-model reviewer — likely the same swallow as OpenCode;
verify, don't assume).

## Decisions grounded

- **Q1:** GLM-the-model needs **no adapter** — it is the `claude`/`opencode`
  adapter with an endpoint swap. Capture it as a short usage note when/if a
  downstream actually runs on GLM; record the cross-model honesty caveat.
- **Q2:** ZCODE-the-harness is a **candidate third adapter, gated on the probe
  above** — not started, not promised. Building the adapter on documentation
  alone is the banned move (fail-open lineage). Until the probe runs GREEN on a
  real install, this stays a backlog candidate (vendor-watch: ZCODE is an
  evolving product — the custom-subagent contradiction suggests the docs trail
  the build).

## Sources

z.ai/subscribe · docs.z.ai/devpack/tool/claude (Anthropic endpoint) ·
zcode.z.ai/en/docs/{welcome,agents,subagents,plugin,configuration} · web search
2026-06 (GLM-4.6 coding plan, supported agents). Where a doc page and another
source conflict (custom subagents), the conflict is recorded as unresolved, to
be settled by the live probe — not smoothed.
