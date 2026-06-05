# diagnostic-flow-discipline — plan

Source: two PM-relayed protocol-feedback items from the same live BLE-import session — backlog "Diagnostic-flow gap (passive observation + bisect)" and "Diagnostic-flow gap (2): anti-thrash + stack-research as mid-debug escalation". Both edit the `workflow/incident.md` "doesn't work in production" flow, so they ship as **one coherent diagnostic-discipline feature** (two branches editing the same file would conflict and produce noisy diffs — the changeset-hygiene lesson). PM directed "бери дальше по плану, как поедет" — selected to proceed autonomously.

## Scenarios

1. **Passive observation is read-only-grade (Step A).** `workflow/incident.md` Step A names **passive observation of a live signal** — sniffing/scanning/capturing what is already on the wire or the air (tcpdump, a BLE/mDNS scan, a bus capture, reading advertisements) — as read-only-grade diagnostics, the same class as reading a log. It changes nothing and reaches no external peer, so it is **not** a probe: **no Step A.5 authorization, no Blast-radius preflight**. "Reach for it early." **Boundary (observe vs emit):** the carve-out is for *listening* to what is already present — anything that **transmits** toward a coupled external stateful peer (injecting traffic, an active scan that requests scan-responses from a paired peer, pairing/commissioning, writing to a bus) is judged on whether it reaches/mutates that peer and stays under Step A.5 + the Blast-radius preflight.
2. **Bisect before you hypothesize.** When a multi-stage path fails (hardware → driver → transport → protocol → app logic) and the symptom is silent/ambiguous, the **first move is the cheapest observation that splits the path in half** ("does the signal physically reach us at all?"), before reasoning top-down from the most likely software cause. Establish ground truth at the lowest cheaply-observable layer first.
3. **Stop-and-research tripwire (anti-thrash).** If a fix attempt does **not** resolve a "doesn't work" symptom and the observed behavior still contradicts the model of how the component works, the next move is **NOT another patch** — stop and consult the canonical source (the library's reference implementation / official example / spec) before the next code change. **Two failed fixes in a row on the same symptom** is a hard signal that the model is wrong, not the line; reactive patching past that point burns live-system iterations and converges slowly.
4. **Stack-research is a mid-diagnosis escalation, not only an up-front step.** Spawn `pm-stack-researcher` **whenever reality contradicts an already-cited stack rule** (hardware behaves unlike the documented idiom; the high-level API does not do what `stack-notes` says) — not only from `/pm-plan` when a component is undocumented. Re-researching the canonical flow mid-debug, and correcting the stale cited rule, is a **first-class move, not an admission of failure**: prefer "find how the library's own example does it" over "iterate a guess." `pm-stack-researcher.md` records this added invocation context (mid-debug), keeping its existing up-front (`/pm-plan` / `/pm-bootstrap`) contexts.

## Existing behaviors this feature touches

(from `workflow/incident.md` — what must not break)

- **Step A (read-only default)** — extended to name passive observation; the hard boundary against *silent changes* (no `sed`/`vi`, no `restart`, no `apt install`) is unchanged.
- **Step A.5 (probe) + the Blast-radius preflight** — untouched and **not relaxed**: the passive-observation carve-out is read-only and explicitly outside the preflight, exactly as line 18 already states ("relaxes none of the Step A read-only default or the Step A.5 probe rules"); the anti-thrash tripwire sits *around* the probe loop (it gates the *next* move after a failed fix), it does not loosen probe authorization.
- **Steps B / C / D** (findings → hotfix plan → pipeline) — unchanged.
- **`pm-stack-researcher` up-front contexts** (`/pm-plan`, `/pm-bootstrap`) — preserved; the feature **adds** a mid-debug trigger, it does not replace the up-front ones. No new agent.

## Contracts

(no Product Contract — diagnostic-discipline change to the protocol's own flow; not user-facing product behavior.)

## Stack expectations touched

(none — Markdown orchestration prose; no library/format/external-system idiom of *this repo* is touched. The feature is *about* stack-research discipline, but changes no stack component here.)

## Interaction scenarios

Provably isolated: prose additions to `workflow/incident.md` + one invocation-context line in `pm-stack-researcher.md`. No shared mutable state, no concurrency, no I/O. The one adjacency — the passive-observation carve-out must not appear to relax the Blast-radius preflight / Step A.5 — is handled editorially by the explicit observe-vs-emit boundary (scenario 1) and by leaving line 18's "relaxes nothing" statement intact.

## Test plan

- Existing tests that must pass: all of `tests/hooks.sh` — untouched (no hook touched); confirm 73/73.
- New tests: **none** — Markdown orchestration-prose change in a markdown-prose repo with no runtime/linter to host a test for "did the agent bisect first / stop-and-research." Verification is editorial: Pass-1 plan-compliance (the four scenarios land in `incident.md` + the `pm-stack-researcher` context line; the Step A.5 / Blast-radius rules are not relaxed; the observe-vs-emit boundary is explicit) + Pass-2 `code-review` over the diff + validation-by-use. Documented-boundary, matching the changeset-hygiene / audit-scope-menu / test-wiring-parity prose-half precedent.

## Docs to update

- `doc/architecture.md`: a short decision record — "Diagnostic-flow discipline: passive observation is read-only (no Step A.5 / no Blast-radius preflight, bounded observe-vs-emit); bisect-before-hypothesize; a stop-and-research anti-thrash tripwire (two failed fixes → consult the canonical source, not another patch); and `pm-stack-researcher` as a mid-debug escalation, not only an up-front step." Note it is additive to the incident flow and relaxes none of the Blast-radius / Step A.5 safety rules. Authored by `pm-architect` post-coding.
- `workflow/incident.md`, `.claude/agents/pm-stack-researcher.md`: the actual additions — protocol source, authored by `pm-coder`.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change; README-currency trigger does not fire.)

## Out of scope

- **The Blast-radius preflight rule itself** — unchanged; passive observation is explicitly placed *outside* it (read-only), and anything that emits toward a coupled peer stays *inside* it. The feature does not weaken the preflight.
- **A new agent / command / hook** — none. The mid-debug stack-research reuses the existing `pm-stack-researcher` (adds an invocation trigger, not a new agent); the tripwire and bisect are orchestrator-discipline prose, not mechanically enforceable (the same no-hook-for-semantic-judgement family).
- **Step 5.5 on-hardware run + Steps B/C/D** — untouched; this feature sharpens Step A / A.5's *diagnostic* discipline, not the hotfix-planning or deploy steps.
- **Auto-detecting "two failed fixes" / "reality contradicts the cited rule" mechanically** — rejected; these are semantic judgements the orchestrator applies in the flow, not regex triggers (consistent with the protocol's no-hook-for-semantic-triggers family).
- **The other open feedback items** (agent-VCS-state reliability; the reviewability track B linters / C idioms) — separate features, not folded here.
