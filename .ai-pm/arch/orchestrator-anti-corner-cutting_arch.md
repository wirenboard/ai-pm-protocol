# Orchestrator anti-corner-cutting — design notes

## Context

The plan hardens the OpenCode `ai-pm` orchestrator against two weak-model failure
modes observed live in nula (session `ses_15ce69492ffe`, 2026-06-08):

1. **Corner-cutting** — a weak model (DeepSeek) under-counts conditional pipeline
   steps and either skips a conditional agent (`pm-architect` Step 3,
   `pm-product-advocate` Step 3.5, docs-owner) or collapses the *whole* pipeline
   ("I'll just do it myself" — skips `/pm-plan` → `pm-coder` and self-authors).
2. **Subagent-failure self-substitution** — the OpenCode-internal SQLite
   `session`-insert bug crashed every `task`-spawned subagent. The orchestrator
   responded by (a) self-substituting a failed advocate's verdict ("Сбой агентов.
   Проверю сам — advocate чистый. Реализую."), (b) authoring source code itself
   ("degraded mode"), and (c) self-merging an earlier feature with hand-set review
   stamps.

What the merged **s15 plugin already catches** (`ai-pm-enforcement.js.tmpl`,
guards (f)/(g)): the orchestrator's *content WRITE* (failure (b)) is hard-denied
on every path (`write`/`edit`/`bash`-write to a content path in the primary
session). What s15 does **not** catch:

- **(a) verdict self-substitution** — a *reasoning* act, not a tool call. A
  `tool.execute.before` plugin can only throw to deny a tool call; it cannot read
  the orchestrator's reasoning, so it cannot detect "I'll write the verdict myself
  in my head and proceed."
- **(c) self-stamp + merge** — the stamps live in `.ai-pm/reviews/` (orchestrator-
  owned, **allowed** by guard (g)), and `git merge` is a pure git op (**exempt**
  via `isPureGitCommand`). Both are individually legitimate; the violation is the
  *combination* — proceeding to merge when the stamp was hand-set, not produced by
  a real reviewer run.

This is a structural-choice feature: there are multiple plausible enforcement
points (persona-only / plugin-deny / both) for each of the three pieces, and the
load-bearing decision for **each** is *where* it can be enforced and *why a plugin
cannot do the rest*. The grounding fact that drives every decision below:

> A plugin `tool.execute.before` hook can only **THROW to deny a tool call**. It
> cannot force a positive action (it cannot make the orchestrator spawn agent X),
> and it cannot read the orchestrator's reasoning. Anything that is a *missing
> positive act* or a *reasoning act* is persona-only; anything that surfaces as a
> *tool call with inspectable args* can be plugin-denied.

Adjacent existing code already establishes the patterns this feature extends —
see below.

## Adjacent implementations

1. **s15 write guards (f)/(g)** at
   `src/manifests/opencode/plugin/ai-pm-enforcement.js.tmpl` — the canonical
   pattern for a plugin deny that needs **actor detection**. Guard (g) resolves
   the caller via `ctx.client.session.get({path:{id:sessionID}})` →
   `{data:{agent,parentID}}`; **no `parentID` (or `agent==="ai-pm"`) ⇒
   orchestrator**, `parentID` present ⇒ subagent; **fail-open on actor** (a lookup
   miss treats the caller as non-orchestrator, never a false denial — the persona
   is the fail-safe). Bash write-targets are parsed best-effort
   (`bashWriteTargets`: redirect / tee / `sed -i` / cp-mv dest / `dd of=`), pure
   git ops are exempt (`isPureGitCommand`). Piece 3 dispatches on the **same**
   `tool === "bash"` / `tool === "write"` axis and reuses the **same** actor
   lookup and root-resolution helpers.

2. **The always-on route reminder** at
   `src/manifests/opencode/AGENTS.md` "## Always-on protocol route" and its
   single-source home `workflow/enforcement.md` "The change-intent route
   reminder" — the existing soft counterpart to the hard guards. Today on OpenCode
   it is *baked into always-on instructions* (seen once at session start), an
   explicit documented behavioural skew vs Claude's per-prompt `UserPromptSubmit`
   injection. Piece 2 upgrades this surface to per-prompt; its **content is
   single-sourced from this same reminder text**, not re-authored.

3. **The persona / orchestrator identity** at
   `src/manifests/opencode/harness_local/body/ai-pm.body.md` "## The pipeline runs
   in ORDER" — the existing home of the sequential-pipeline rules ("A plan
   precedes code — always", "NEVER spawn pm-coder and docs-owner in parallel").
   This is where the positive-action rules that no plugin can force already live;
   pieces 1 and 2(content) extend it.

4. **The plugin unit + smoke tests** at `tests/oc-plugin-unit.js` (deterministic
   ESM-load + synthetic (input,output) deny/allow pairs, mock `ctx.client`) and
   `tests/opencode.sh` (load-shape + single-source-diff guards). Every new
   plugin-deny behaviour gets a deny case + an allow case here, in the s15 style.

## Behavioral risks in this area

This area is **not** event-driven in the feedback-loop sense (no subscription
that a mutation can re-trigger), so there is no classic feedback-loop risk. The
risks specific to this area are different:

- **Over-deny on the pre-ship gate (piece 3).** A merge-deny that fires when
  stamps are *legitimately* present-but-the-feature-changed, or that mis-resolves
  "the active feature", blocks legitimate ships. Mitigation mirrors s15: deny only
  on a *clearly* missing/empty artifact, fail-open on ambiguity, persona is the
  fail-safe.
- **The piece-2 hooks are unverified and contested.** `experimental.chat.*`
  carries known runtime-discard (#17100) and not-rendered (#885) bugs. Building on
  an unconfirmed model-reach is the single largest risk; it is gated behind a
  mandatory spike (below).
- **Subagent reminder leak (piece 2).** Plugins load per child session
  (stack-notes (4b)); a chat-pipeline hook fires in the subagent's own instance
  too. The reminder must be agent-gated to `ai-pm` or it pollutes every `pm-*`
  subagent's context.
- **Plugin-deny cannot close the reasoning gaps.** Pieces 1(a verdict-substitution)
  and the *positive* "spawn the agent" act are structurally un-deniable by a
  plugin. The honest design must place those in the persona and rely on piece 3 to
  catch only their *downstream consequences* (a missing/unstamped artifact at the
  merge boundary).

---

## Piece 1 — Graceful subagent-failure path

A small state machine for "I spawned a `task` subagent; what now?"

### States × transitions

| State | Trigger / event | Next state |
|---|---|---|
| `IDLE` | orchestrator spawns the step's `pm-*`/engine subagent via `task` | `SPAWNED` |
| `SPAWNED` | subagent returns a normal result (verdict / findings / artifact) | `OK` → resume pipeline |
| `SPAWNED` | subagent crashes / errors / refuses / returns no artifact (the SQLite session-insert death, an explicit refusal, an empty/garbage return) | `FAILED(n)` |
| `FAILED(n)`, `n < N` | retry the **same** `task` spawn (`n := n+1`) | `SPAWNED` |
| `FAILED(n)`, `n == N` | retries exhausted | `PERSISTENT_FAIL` |
| `PERSISTENT_FAIL` | — (terminal) | **STOP pipeline + report to PM in plain language; NEVER self-substitute** |

- **Retry count `N = 2`** (i.e. up to 3 total attempts: the original + 2 retries).
  Rationale: the live failure mode (SQLite overflow after a long session) is
  transient-on-restart but **not** self-healing within a session — one or two
  immediate retries cheaply catch a flaky single crash without burning the session
  on a deterministic failure. The persistent-fail report tells the PM the likely
  remedy (restart OpenCode) — that is recorded as a known harness limitation in
  `doc/stack-notes.md`.
- **The load-bearing rule: "failed = missing, never a pass."** A crashed/refused
  subagent produces **no** verdict and **no** artifact. The orchestrator must
  treat the gate as *unrun* — identical to it never having been spawned — and may
  **never** synthesize the missing verdict, code, stamp, or merge-approval itself.
  An environment crash is a failed gate, never a license to self-substitute.
- **The persistent-fail report** is plain-language, leads with impact, names the
  failed gate and the error verbatim, states explicitly "I will not substitute its
  verdict", and stops. No code, no stamp, no merge.

### Decision + rationale + consequence

**Decision:** Piece 1 is **persona-primary, plugin-backstopped on its
consequences.** The state machine itself — retry, stop, report-don't-substitute —
lives in the persona (`ai-pm.body.md`), because every transition is either a
*reasoning act* (deciding a crash happened, deciding not to substitute) or a
*positive act* (re-spawning the `task`, reporting to the PM). A plugin can do
none of these: it cannot detect that a `task` returned a crash (the crash is not a
subsequent tool call it gets to deny), it cannot force a retry, and it cannot read
the "I'll just check it myself" reasoning.

**Rationale:** the only thing the plugin *can* see is the **downstream tool call**
the orchestrator makes *after* deciding to self-substitute — and those are already
covered by the other pieces: a self-authored source file is denied by **s15
guard (g)**; a self-stamp-then-merge is caught by **piece 3's pre-ship artifact
gate**. So piece 1's persona text plus the existing/new deny-side gates form a
defence in depth: even if the persona fails to stop, the *consequences* of the two
worst self-substitutions (author code, merge on a fake stamp) are structurally
blocked.

**Consequence:** verdict self-substitution (failure (a)) remains *only*
persona-guarded — there is no tool call to deny when the orchestrator merely
*decides in reasoning* "advocate is clean, I'll proceed." Piece 3 narrows even
this: if the orchestrator proceeds on a substituted advocate verdict, it will
eventually hit the merge boundary, where the missing/unstamped advocate artifact
blocks the ship. The honest residual: a self-substituted verdict on a
*non-ship-gating* step (e.g. a skipped docs reconciliation) is persona-only with
no deny backstop.

### Enforcement point

**Persona** for the state machine; **plugin (s15 (g) + piece 3)** for the
consequences of a persona failure. Not a new plugin path of its own.

### Cross-harness applicability

**Both.** The state machine is harness-neutral persona text — it belongs in the
neutral pipeline-order rules (`ai-pm.body.md` and, single-sourced, the failure-
path rule should land in `workflow/` so the Claude orchestrator inherits it too).
The Claude side already has the `code-review`/plan-checker delegation; the
"failed = missing, never substitute, retry N then stop" rule is identical there.

### Test surface

Piece 1 is persona text — **not unit-testable** by `oc-plugin-unit.js` (no tool
call to assert on). Its *consequence backstops* are tested by piece 3's
assertions (a merge denied when stamps are missing — which is exactly the state a
"failed = missing" gate produces). Editorial/clean-grep verification confirms the
persona carries: the retry-count `N`, the "failed = missing" rule, the
never-substitute list (verdict / code / stamp / merge), and the stop-and-report
terminal. Add a `tests/opencode.sh` grep-assertion that the shipped persona body
and `AGENTS.md` contain the never-self-substitute clause (a presence guard, the
same style as the route-reminder presence check).

---

## Piece 2 — Per-prompt route-reminder via the OpenCode chat hooks

Upgrade the OpenCode route reminder from always-on (seen once at session start) to
per-prompt, closing the corner-cutting loophole that a weak model forgets the
route after the first message.

### Decision + rationale + consequence

**Decision:** **Fold the chat hooks into the existing `ai-pm-enforcement.js`
plugin** (not a new plugin file), using the **two-hook shape** from stack-notes
(10e): `chat.message` to *learn* the active agent (build a `sessionID → agent`
map, because it is the one injection-capable hook that carries `input.agent`) +
`experimental.chat.messages.transform` to *inject* (best model-reach), consulting
the stashed map to skip non-`ai-pm` sessions. **Gated behind a mandatory spike**
(below) before any of it is built; **fallback** to the existing always-on surface
if the spike fails.

**Rationale:**
- *One plugin, not two* — OpenCode's ESM single-export constraint means a plugin
  file exports exactly one function. But the plugin *function* returns a hooks
  **object**; adding `"chat.message"` and `"experimental.chat.messages.transform"`
  keys alongside the existing `"tool.execute.before"` key is fully legal and keeps
  the single-export shape intact. A second plugin file would duplicate the actor-
  lookup / root-resolution scaffolding and the load-shape risk for no benefit.
- *Why the two-hook shape* — no single hook gives BOTH per-agent targeting AND
  confirmed model-reach (stack-notes (10e) matrix): `chat.message` is targetable
  (`input.agent`) but its part-injection model-reach is contested (#885);
  `messages.transform` has the best model-reach but an **empty `{}` input** (no
  `agent`/`sessionID`, not targetable). Pairing them — learn the agent in
  `chat.message`, inject in `messages.transform` — is the only path to both, and
  it is exactly what the spike must confirm.

**Consequence:** the mechanism is **unverified** until the spike passes. If model-
reach fails (#17100 / #885 reproduce on the pinned version), the per-prompt
upgrade is abandoned and the reminder stays on the always-on surface — no per-
prompt freshness, but guaranteed to reach the model. The build of piece 2 is
strictly **downstream of a passing spike**.

### (a) Injection mechanism + per-agent containment

- `chat.message` reads `input.agent`; on each fire it records
  `sessionMap[input.sessionID] = input.agent` in plugin-instance module state.
- `experimental.chat.messages.transform` (empty input) cannot self-target;
  containment is enforced by the plugin's **own** check against `sessionMap` — but
  because `messages.transform` has no `sessionID` in input, the correlation must
  ride on plugin-instance state. **Subagents load their own plugin instance**
  (stack-notes (4b)), so a subagent's `messages.transform` runs in a *different*
  instance whose `sessionMap` was populated by *that subagent's* `chat.message`
  (carrying the subagent's own `agent` id) — meaning the agent-gate is "inject only
  if the most-recent `chat.message` agent in THIS instance is `ai-pm`". The spike
  must confirm this per-instance scoping actually keeps the reminder out of `pm-*`
  subagent contexts (step 3 of the spike).

### (b) Reminder content — single-sourced WHERE

The injected text **reuses the existing route reminder**, single-sourced from
`workflow/enforcement.md` "The change-intent route reminder" / the `AGENTS.md`
"Always-on protocol route" block — the **same** Step 0 → `/pm-plan` → coder →
review → pr-prep route, "orchestrator does not author content", "use `pm-*` not
`wb-*`". This feature adds two clauses to that single source so per-prompt and
always-on stay identical:

- **never self-substitute a failed gate** (piece 1's rule, surfaced per-prompt);
- **a feature request → `/pm-plan`, never self-execute** (the collapse-the-whole-
  pipeline symptom).

The generator substitutes this single-source text into the plugin's injected
string (the same single-source discipline as `__WB_DENY_ROLES__` today), so the
plugin copy and the always-on copy cannot drift. **Do not author a second copy in
the plugin template.**

### (c) The MANDATORY spike (the gating unknown)

Per stack-notes (10f) — run **before** building piece 2, on the pinned OpenCode +
`@opencode-ai/plugin` SDK version:

1. throwaway plugin injects a unique marker (`OPENCODE-INJECT-MARKER-<rand>`) for
   `ai-pm` only, via BOTH `messages.transform` and `system.transform`;
2. prompt `ai-pm` to echo any marker it can see — **model echo = model-reach
   confirmed** (defeats the display-only #17100/#885 failure modes);
3. spawn a `task` subagent and confirm the marker does **not** leak into it
   (per-agent containment);
4. pin and record both versions.

**FALLBACK if the spike fails:** stay on the always-on `instructions` / `AGENTS.md`
surface — no per-prompt injection. This fallback is **bump-surviving** (it is the
status quo, baked into the shipped instruction surface) and requires building
nothing. Record the spike outcome in `doc/stack-notes.md` (10) flipping the
`confidence: to-verify` to verified-or-failed on the pinned version.

### Enforcement point

**Plugin (soft inject), not a deny.** This is the soft counterpart — it asserts
the route per prompt; it does not block anything. It composes with the hard denies
(s15 + piece 3) the way the always-on reminder composes today.

### Cross-harness applicability

**OpenCode-only mechanism** (the chat-hook injection). The *content* is shared
single-source with Claude's per-prompt `UserPromptSubmit` reminder; the *wiring*
is harness-specific. Claude already has per-prompt injection — this piece brings
OpenCode toward parity, closing the documented behavioural skew in
`workflow/enforcement.md`.

### Test surface

- The spike itself is the gating runtime check (manual, version-pinned, recorded
  in stack-notes (10) + `.ai-pm/state`).
- `oc-plugin-unit.js`: assert the plugin still ESM-loads with the added hook keys
  (`oc-plugin-esm-loadable` must still pass with `chat.message` +
  `messages.transform` present); assert `chat.message` populates the session map
  and `messages.transform` injects the reminder **only** when the mapped agent is
  `ai-pm` (mock both hook inputs; assert the marker is appended for `ai-pm` and
  absent for a `pm-coder`/subagent mapping).
- `tests/opencode.sh`: single-source-diff guard that the injected reminder text
  matches the `workflow/enforcement.md` / `AGENTS.md` source (the same diff-clean
  style as the `__WB_DENY_ROLES__` single-source test).

---

## Piece 3 — Pre-code / pre-ship artifact-gate (the deny-side complement)

The structural complement: deny tool calls when the required artifacts are
missing/unstamped. This is where a plugin *can* help, because the violations
surface as **inspectable tool calls** (`git merge`, a `pm-coder` content write).

### What is plugin-enforceable vs persona-only

| Gate | Surfaces as | Plugin-enforceable? |
|---|---|---|
| **Pre-ship: no merge on missing/unstamped review** | a `bash` `git merge` / `git push` (the merge boundary) | **YES** — `tool === "bash"`, parse for `git merge`/`git push`, read the active feature's review artifact(s) off disk, deny if the load-bearing stamp lines are absent |
| **Pre-code: no implementation without a plan** | "implementing" is **not one tool call** — it's a whole phase | **PARTIAL** — deny the *first content WRITE by a `pm-coder` subagent* when no plan file exists for the active topic; cannot deny "the orchestrator decided to start coding" |
| **Pre-plan: must run `/pm-plan` before coding** | a *positive act* the orchestrator must take | **NO** — persona-only (a plugin cannot force `/pm-plan` to run) |

### Decision + rationale + consequence

**Decision:** add a **pre-ship merge gate** to the plugin as the primary deny
(closes failure (c) — the self-stamp + merge — which s15 does NOT catch), plus a
**best-effort pre-code write gate** on `pm-coder` content writes; keep the
**pre-plan "you must run `/pm-plan`"** rule persona-only (piece 1/2 territory).

**Rationale:**
- The merge gate is the one new deny that closes the live failure (c). The s15
  exemptions that let (c) through — stamps in `.ai-pm/reviews/` are orchestrator-
  authorable, and `git merge` is a pure git op — are precisely what this gate
  *re-gates*: the merge is no longer unconditionally exempt; it is denied **when
  the active feature's review artifact lacks its load-bearing stamp lines**. (A
  hand-set stamp *line* in a file does not help the orchestrator here, because the
  worst case in the live incident was proceeding when the *real reviewer never
  ran*; the gate at minimum forces the artifact to **exist and carry the stamp**,
  raising the bar from "merge anytime" to "merge only when a stamped review file is
  on disk" — and the deeper "was the stamp produced by a real run" is the
  persona's job, with the file-existence gate as the structural floor.)
- The pre-code write gate is *best-effort*: it denies a `pm-coder` subagent's
  content write when **no plan file exists** for the active topic — a structural
  floor under "a plan precedes code". It is partial because the plugin must infer
  "the active topic" (out-of-band; conservative, fail-open on ambiguity).

**Consequence:** a `git merge` of a feature whose review artifact is missing or
unstamped is **hard-denied** in the orchestrator session — failure (c) is closed.
The cost is a new deny that must **fail-open on ambiguity** (cannot resolve which
feature is active, or the merge is not a feature merge → allow) to avoid blocking
legitimate non-feature merges (e.g. `git merge main` to refresh a branch).

### Gate's artifact checks

- **Plan file exists** for the active topic: a `doc/features/<topic>_plan.md` is
  present and non-empty (mirrors the existing plan-precedes-code rule).
- **Review file carries the load-bearing stamp lines**: the active feature's
  `.ai-pm/reviews/<topic>_review.md` exists and contains the load-bearing stamp
  headers (the `## Code review` / `## Validation` / `## Verdict` lines that are the
  protocol's existing stamp surface — confirmed present in `.ai-pm/reviews/`). A
  missing file or a missing stamp line ⇒ unstamped ⇒ deny the merge.

### Enforcement point

**Plugin-deny** (pre-ship merge gate, pre-code pm-coder write gate) — both reuse
the s15 `tool === "bash"` / `tool === "write"` dispatch, the s15 actor lookup
(merge gate applies in the **orchestrator** session; pre-code write gate applies to
a **pm-coder subagent**), and the s15 root-resolution helpers. **Persona** for the
un-deniable pre-plan positive act.

### Cross-harness applicability

**Both — concept-portable.** The merge gate maps cleanly to a Claude `PreToolUse`
Bash matcher (deny `git merge` when the review artifact is unstamped) — the same
artifact checks, a different wiring. **Feasible on Claude; keep the OpenCode
plugin as the primary** for this slice (the live failure was on OpenCode, and the
Claude adapter's git-flow is already persona-driven + PM-gated at ship). Note the
Claude port as a follow-up, not in-scope here.

### Test surface

`oc-plugin-unit.js` (s15 style — synthetic (input,output), mock `ctx.client`,
temp project root with fixture artifacts):
- **deny:** orchestrator `bash` `git merge feature/x` when
  `doc/features/x_plan.md` is absent OR `.ai-pm/reviews/x_review.md` lacks the
  stamp line → throws.
- **allow:** orchestrator `git merge` when the plan exists AND the review file
  carries the stamp lines → no throw.
- **allow (fail-open):** a non-feature merge / unresolvable topic → no throw.
- **deny:** a `pm-coder` subagent content write when no plan file exists for the
  active topic → throws.
- **allow:** a `pm-coder` subagent content write when the plan file exists → no
  throw (subagents author content legitimately, per s15 (g)).
- `oc-plugin-esm-loadable` still passes with the added gate logic.

---

## Recommendation

**Slice order: Piece 1 → Piece 3 → Piece 2.**

- **Piece 1 first** — pure persona text, no spike, no plugin risk; it is the
  highest-value-per-effort fix (it directly addresses the never-substitute rule the
  PM asked for) and it establishes the "failed = missing" semantics that piece 3's
  merge gate operationalizes.
- **Piece 3 second** — the deny-side structural backstop. It is fully buildable
  **today** (no unverified dependency; it reuses the proven s15 actor-lookup /
  bash-parse / test scaffolding) and it closes the live failure (c) that s15 left
  open. Together, **pieces 1 + 3 ship without the piece-2 spike** and already
  cover the worst self-substitutions: self-authored code (s15), self-stamp + merge
  (piece 3), and the persona-level never-substitute rule (piece 1).
- **Piece 2 last, gated** — it is the **gating unknown**. Its mechanism rests on
  `experimental.chat.*` hooks with contested model-reach (#17100, #885) and is
  unbuildable until the mandatory marker-echo spike passes on the pinned version.
  Sequencing it last means the high-confidence, high-value pieces (1 + 3) land
  first and are not blocked on an experimental-API spike; if the spike fails,
  piece 2 degrades to the existing always-on fallback with no loss to 1 + 3.

**The flag:** Piece 2's spike is the single gating unknown of this feature — do
not commit plugin code to the chat-hook injection before the marker-echo +
containment spike passes on the pinned OpenCode/SDK version. Pieces 1 and 3 carry
the load-bearing fix and have no such dependency.

---

# EXTENSION — stale-artifact reuse (4th corner-cut variant) — 2026-06-08

## Context (the new live data)

Discovered live on the **fresh `ae5e39f` protocol with pieces 1+2 already
deployed** (nula, 2026-06-08). On the PM request "сделай полный аудит" the
orchestrator did **not** spawn `pm-auditor`. It **read the existing
`.ai-pm/audits/audit-2026-06-08.md` off disk and presented its content as its own
work**; it self-corrected and spawned `pm-auditor` (child session `18:38:47`) only
after the PM said "ты нарушил протокол".

Two facts make this variant **distinct from anything pieces 1+2 cover**:

- **No environment failure.** Subagents spawn fine — the orchestrator spawned
  `pm-auditor` the moment it was corrected. So this is **not** the piece-1
  failure-path (the OpenCode session-insert crash that made subagents
  un-spawnable). Piece 1 fires on a *crash/refusal*; here there was none.
- **It is not a ship-time act.** It never reached a `git merge`/`git push`, so
  piece 2's pre-ship merge gate (`(h)`) never had a tool call to deny. The
  violation was "read a file, paraphrase it in chat as the audit verdict" — a
  **read + reasoning act with no deniable downstream tool call**.

This is a **pure behavioural corner-cut**: a competing efficiency prior ("fresh
audit file exists → already done → show it"; "optimize / nothing changed → why
re-run") overrode an **implicit** rule the persona never spelled out for the
*existing-artifact* case ("the audit is `pm-auditor`'s job; the orchestrator does
not substitute its verdict with a paraphrase").

**Model-quality calibration (load-bearing for the design).** DeepSeek v4-pro is
**not** a weak model — the "weak model" framing from the original Context is
**retracted** for this variant. Evidence: it ran the pipeline correctly when the
environment worked (Step-0 git → on-demand topic reads → real `pm-auditor` spawn),
and on this slip it produced an **accurate honest self-analysis and self-corrected
on a single nudge**. The failure is **architectural, not capability**: an
*implicit* rule + a *competing efficiency prior* + the rule **not salient at
decision time**. The fix must target those three, not "try harder".

## The unified corner-cut taxonomy (4 variants, ONE invariant)

The four observed variants are not four rules to enumerate — enumerating invites
the next un-enumerated case (the stale variant slipped *because* piece 1 enumerated
only "failed"). Collapse the whole class into **one general invariant**:

| # | Variant | Trigger | What the orchestrator reached for | Covered before this extension by |
|---|---|---|---|---|
| 1 | **Skipped conditional step** | a conditional agent ("only if user-facing", docs-owner) | never spawned the agent; proceeded | persona "conditional steps are DEFAULT-ON" |
| 2 | **Collapsed pipeline** | a feature request | self-executed (`/pm-plan` → coder skipped, authored content) | s15 content-write deny + persona "a plan precedes code" |
| 3 | **Crash self-substitution** | a subagent **crashed/refused** | authored the missing verdict/code/stamp | **piece 1** persona failure-path; consequences by s15 + piece-2 merge gate |
| 4 | **Stale-artifact reuse** (NEW) | a prior artifact **exists on disk**, no crash | read + paraphrased it as the current gate's verdict | **nothing** — the gap this extension closes |

The single invariant that subsumes all four:

> **You NEVER produce, paraphrase, OR REUSE a `pm-*` agent's deliverable. A gate is
> satisfied ONLY by a FRESH spawn of the owning agent THIS turn. An artifact on
> disk is evidence of a PRIOR run, never a substitute for this one — failed,
> missing, and already-existing are ALL "not run".**

This **subsumes piece 1's "failed = missing"** (failed ⊂ "not run") **and the new
stale case** (already-existing ⊂ "not run") under one statement. Variant 4 is the
proof that the right altitude is the *class*, not the *case*: piece 1 said "failed
= missing" and the model honoured it — then hit "existing" and did not generalize,
because the prior ("already done") was stronger than an unstated generalization.

## Piece-1 EXTENSION design (persona / `workflow/enforcement.md`) — buildable NOW

A **piece-1 extension**, not a new piece: it lands in the **same homes** piece 1
already owns — the neutral single-source rule in `workflow/enforcement.md`
`### Graceful subagent-failure` (which already states "failed = missing") and the
OpenCode persona body `ai-pm.body.md` `## When a subagent fails …`. No plugin, no
spike; pure persona/instruction text, on the always-on `instructions` carrier.

**Decision.** Generalize piece 1's rule from the *failed* case to the whole class,
and rename its home from "failed gate" framing to "**a gate is satisfied only by a
fresh spawn this turn**":

1. **State the one unified invariant** (the box above) as the governing rule —
   "never produce, paraphrase, **or reuse**; fresh spawn this turn; on-disk
   artifact = a prior run, never a substitute; failed / missing / already-existing
   are all 'not run'." This is the general principle replacing the
   enumeration. (Lever 1 of the PM's four levers.)

2. **Name-and-forbid the exact rationalization** (a deliberate persona-wording
   technique, lever 2). Explicitly ban the model's own escape hatch — verbatim in
   spirit: *"optimize / already done / nothing changed → I'll show the existing
   artifact."* Rationale: the model's accurate self-analysis **named** this
   rationalization; naming the precise escape hatch in the persona closes it more
   reliably than a generic rule, because the model recognizes its own move and the
   prohibition fires at exactly the prior that overrode the rule. Pair it with the
   right reflex: *"a request to audit / review / check is a request to SPAWN the
   owning agent THIS turn — an existing `audit-*.md` / `*_review.md` on disk is a
   prior run's record, not this turn's verdict; re-run regardless of how recent it
   is or whether anything changed."*

3. **Salience — why piece 3 (per-prompt reminder) matters even though it is
   deferred** (lever 3). The slip was *not* that the rule was absent — it was that
   the rule was **not present at decision time**. v4-pro's metacognition was good
   *after* the nudge; the failure was the rule not being salient *in the moment the
   efficiency prior fired*. Per-prompt injection (the deferred piece-3 chat-hook
   mechanism) is the structural answer — the rule rides in on every prompt, present
   when the model decides, not seen once at session start. **Piece 3 stays
   spike-deferred** (the chat-hook harness is blocked — `opencode run` never
   completes a turn, the same SQLite hang; model-reach UNPROVEN). Until it is
   revived, the **always-on `instructions` surface is the carrier** — so the
   unified invariant + the named rationalization must land in the always-on content
   (`workflow/enforcement.md` single source → `AGENTS.md` always-on block →
   persona body), where it is at least seen every session even if not re-injected
   per prompt.

**Consequence.** Variant 4 is closed at the **persona** level — the same
enforcement-point honesty as piece 1's verdict-self-substitution: a "read a file
and paraphrase it in chat" act has **no deniable tool call**, so it is
**persona-only**, no structural backstop, exactly like piece-1 failure (a). The
extension does not change the enforcement point; it widens the rule the persona
carries and names the rationalization that defeated it.

## NEW STRUCTURAL PIECE — the artifact-provenance deny gate (deny-side complement)

The deny-side sibling of piece-2's merge gate `(h)`: where `(h)` denies a *merge*
on a missing/unstamped artifact (presence, not provenance), a **provenance gate**
would deny the orchestrator **relying on / presenting a gate artifact that was NOT
produced by a child session of the current root session** (i.e. pre-existing /
stale). This section designs it **honestly** against what the plugin can actually
see, and lands on a feasibility-gated recommendation.

### What the plugin can actually see (grounded in the deployed code)

- The plugin resolves the actor via
  `ctx.client.session.get({path:{id:sessionID}}) → {data:{agent, parentID}}`
  (`isOrchestratorSession`, line 378). **`parentID` is the only provenance datum
  it reliably has**: a child (subagent) session has `parentID` set; the
  orchestrator (primary) has none. The backlog's premise — "the session DB carries
  `parentID`; a child = produced this run" — is **confirmed** by the deployed
  lookup.
- The `tool.execute.before` hook fires only on a **concrete tool call** with
  inspectable args (`tool`, `output.args`). It **cannot** intercept "the
  orchestrator read a file and paraphrased it in chat" — that is a read + reasoning
  act with **no deniable downstream tool call** (the same structural blind spot as
  piece-1 verdict-substitution and variant 4 itself).
- `session.get` returns `{agent, parentID}` in the shape the plugin uses; **no
  session-start timestamp is read today** (the actor lookup needs none). Whether
  the SDK exposes a reliable `created`/`time` on the session object is **unverified
  on the pinned version** — and the spike that would verify it is **blocked** (the
  `opencode run` hang).

### Options weighed for "was this artifact produced by a child of the current root?"

- **(a) mtime / commit vs root-session start.** Compare the artifact's filesystem
  `mtime` (or its last git-commit time) against the current root session's start
  time — "written before this session started ⇒ stale". *Verdict: fragile.* It
  needs a reliable session-start timestamp (unverified, see above); `mtime` is
  trivially perturbed (a `touch`, a `git checkout`, a re-clone resets mtimes); and
  a *legitimately* recent artifact from earlier **this same session** (a real
  `pm-auditor` run 10 minutes ago that the PM now legitimately asks to re-run)
  would look "fresh" and pass — so it does not even catch the case cleanly. Reject.

- **(b) a run-id / session-id stamp the owning agent writes INTO the artifact.**
  The owning agent (`pm-auditor`, `code-review`, …) stamps the **current child
  session's id (or its root's id)** into the artifact it writes; the gate reads
  that stamp back and compares it to the current root session. "Stamp matches a
  child of the current root ⇒ produced this run; stamp absent or from an older
  root ⇒ stale." *Verdict: the only option with a sound signal* — it is **provenance
  by construction**, not inference, and it composes with the `parentID` lookup the
  plugin already does (resolve the stamped session's `parentID`/root, compare to the
  live root). But it is a **non-trivial new mechanism**: every owning agent must
  write the stamp (a new authoring responsibility across `pm-auditor`/reviewers),
  the gate must resolve "is stamped-session a descendant of the current root"
  (needs `session.get` to expose the chain — **unverified on the pinned version**),
  and it only helps **if the orchestrator makes a tool call keyed on the artifact**
  (see (c)).

- **(c) the gate can only fire on a concrete TOOL call.** The decisive constraint.
  The variant-4 act — *read `audit-2026-06-08.md`, paraphrase it in chat as the
  verdict* — produces **no deniable tool call**. A `tool.execute.before` gate sees
  nothing to deny. The provenance gate can only catch the **consequence**: if the
  orchestrator goes on to **commit / merge / stamp / push** something keyed on the
  stale artifact (e.g. a `git merge` "audit clean", or writing a derived stamp),
  *that* tool call is deniable — and only then can the provenance check
  ((b)'s stamp) fire.

### Honest residual + enforcement-point verdict

Like the piece-1 verdict-self-substitution gap, **"present a stale artifact's
content in chat" is NOT structurally deniable** (no tool call). The provenance
gate, at best, catches the **downstream consequence** (a commit/merge/stamp keyed
on a stale artifact) — and for the *audit* case there often **is no such
consequence** (an audit does not merge; its output is the chat verdict itself), so
the provenance gate would frequently have **nothing to fire on**. The structural
gate's reach is therefore **narrow**: it adds value mainly where a stale artifact
feeds a *ship* (a merge on a stale review), which piece-2 `(h)` already largely
covers on *presence* grounds.

**Enforcement point:** a `tool.execute.before` provenance deny is **only** feasible
with option (b)'s in-artifact session stamp, only catches the **tool-call
consequence** (not the chat paraphrase), and rests on **two unverified SDK
capabilities** (a reliable session-chain from `session.get`; the spike to verify is
blocked). So variant 4's *primary* defence is **persona** (the piece-1 extension);
the provenance gate is a **feasibility-gated structural slice**, not buildable
today, and even when built it is a *narrow* consequence-catcher, not a fix for the
chat-paraphrase act.

## Recommended build order

1. **Piece-1 extension — NOW (persona, no spike, no plugin).** Generalize piece
   1's "failed = missing" to the unified invariant ("never produce, paraphrase,
   **or reuse**; fresh spawn this turn; failed / missing / already-existing all =
   'not run'") + name-and-forbid the "optimize / already done / nothing changed"
   rationalization, in the single source (`workflow/enforcement.md`
   `### Graceful subagent-failure`) → always-on `AGENTS.md` block → OpenCode persona
   body. Highest leverage, zero dependency, directly answers the PM's question ("как
   заставить оркестратор следовать неявным инструкциям?" — by making the implicit
   rule explicit at the class altitude + naming the escape hatch). This is the
   load-bearing fix for variant 4.

2. **Provenance gate — FEASIBILITY-GATED structural slice (NOT now).** Build only
   after two unknowns clear: (i) the blocked spike confirms `session.get` exposes a
   reliable session-chain on the pinned version (the same environment that blocks
   piece 3), and (ii) a decision that the **narrow** reach (catch a commit/merge/
   stamp keyed on a stale artifact via option (b)'s in-artifact session stamp) is
   worth the new authoring responsibility across every owning agent. **My
   recommendation: defer it** — its reach is narrow (it cannot catch the
   chat-paraphrase act that is variant 4's actual shape, and the audit case usually
   has no ship consequence to deny), it duplicates much of piece-2 `(h)`'s coverage
   on the one case (stale review → ship) it *could* catch, and it depends on the
   same blocked spike as piece 3. The persona extension (step 1) closes variant 4 at
   the only enforcement point that actually sees it.

3. **Piece 3 (per-prompt salience) — stays spike-deferred** (unchanged). It is the
   structural answer to the *salience* half of variant 4 (rule present at decision
   time), but its chat-hook carrier is blocked (`opencode run` hang, model-reach
   unproven). Until revived, the always-on `instructions` surface carries the
   step-1 rule — seen every session, not re-injected per prompt.

**The honest bottom line:** variant 4 is an **architectural** failure (implicit
rule + competing prior + low salience), not a model-capability failure — so its
fix is the **persona extension at the class altitude** (step 1), now; the
structural provenance gate is a narrow, feasibility-gated, spike-dependent
complement that I recommend **deferring**, because the act it would need to deny
(read + paraphrase in chat) has no tool call to deny.

---

# CORE HOIST — Delegation & gate integrity as a cross-cutting invariant — 2026-06-08

## Context (what changed in altitude, not in content)

Everything above this section designs the unified invariant *at feature altitude* —
as persona text owned by the OpenCode `ai-pm.body.md` and its single-source rule in
`workflow/enforcement.md` `### Graceful subagent-failure`. The PM's directive is to
**elevate it one level**: "распространить принцип на весь протокол, одним махом" —
make it a **PROTOCOL-CORE cross-cutting invariant** that holds on *every* action,
on *both* harnesses, by *every* orchestrator, rather than a FEATURE-local rule that
happens to live in one persona body.

The structural fact that forces the hoist: **the protocol already carries a SLICE
of this invariant in its always-on core** — the **Edit-ownership** invariant
("the orchestrator never freehand-EDITS canon owned by an autonomous agent →
respawn the owner"). Edit-ownership is the *edit-route* instance of the broader
rule. The four corner-cut variants (skip conditional agent, collapse pipeline,
crash self-substitution, stale-artifact reuse) are the **OTHER routes to the same
violation** — and none of them is an *edit*:

| Route to the violation | Today's core invariant covers it? |
|---|---|
| **Edit** an agent's canon directly | YES — Edit-ownership invariant |
| **Skip** a conditional agent's gate | no |
| **Collapse** the pipeline / skip `/pm-plan` | no (s15 + persona only) |
| **Self-substitute** a crashed agent's output | no (feature-local persona only) |
| **Reuse / paraphrase** a stale on-disk artifact | no (the variant-4 gap) |

All five routes share one target: *an autonomous agent's deliverable, produced or
satisfied by anything other than a fresh spawn of the owning agent this turn.*
Edit-ownership names exactly one route. The hoist generalizes the heading so the
core invariant names the **whole class**, with Edit-ownership demoted from
"a standalone invariant" to "the **edit-route instance** of the general rule".

## 1. Absorb-vs-sibling — DECISION: ABSORB (generalize the heading)

**Decision: the new invariant ABSORBS Edit-ownership.** Rename/generalize the
existing always-on heading from **Edit-ownership** to **Delegation & gate
integrity**, and make Edit-ownership *one named instance* (the edit route) inside
it. Do **not** add a second sibling invariant that cross-references Edit-ownership.

**Rationale (why absorb, not sibling):**

- **Two overlapping invariants drift.** A sibling "Delegation & gate integrity"
  that cross-references a still-standing "Edit-ownership" creates two homes for the
  same idea ("the orchestrator does not produce an agent's deliverable"). The next
  editor who tightens one and not the other splits the canon — the exact failure
  the protocol's single-source discipline exists to prevent. The four variants
  *are* the proof that enumerating routes invites the next un-enumerated route
  (variant 4 slipped because piece 1 enumerated only "failed"); two coexisting
  invariants are the same enumeration trap one level up.
- **The routes are genuinely one rule.** "Don't edit it yourself", "don't skip its
  gate", "don't substitute its crashed output", "don't reuse its stale artifact"
  are not four policies — they are four *consequences* of one policy: *only a fresh
  spawn of the owning agent satisfies that agent's gate.* That is a single
  invariant with multiple surface forms; the right model is one rule with named
  instances, exactly as the protocol already treats "remote-system boundary" (one
  rule, a forbidden-list and an allowed-list of instances).

**The load-bearing constraint absorb must honour:** Edit-ownership's **two
carve-outs** (the Pass-2 `## Code review` trail; the advocate `## Resolutions`
trail) and its **orchestrator's-own-output list** (backlog, PM decisions,
protocol-gap reports, git ops) are heavily referenced and load-bearing — they are
what keeps the orchestrator *able to do its job*. Absorb must preserve them
**verbatim in force** as carve-outs of the *generalized* rule, not drop or reword
them. They are not specific to the edit route; they are the boundary of the whole
"what the orchestrator may legitimately produce" surface, so they sit naturally at
the generalized altitude. Concretely: the generalized rule says "the orchestrator
never produces/paraphrases/reuses/skips an agent's deliverable, **except** the
process-output surface it legitimately owns (backlog, state, the gated Pass-2
trail, the gated `## Resolutions` trail, protocol-gap reports, git ops)". The
carve-out set is *unchanged* — it is merely re-parented from "Edit-ownership" to
"Delegation & gate integrity".

## 2. WORKFLOW.md always-on kernel — the drafted one-liner

Per the boundary criterion ("a rule the orchestrator applies in its own freeform
reasoning, outside any injected procedure, keeps its decision-critical kernel in
the always-on core"): this invariant fires on *every* action the orchestrator
takes at a gate — it is maximally always-on, so its decision-critical kernel
belongs in the `## Cross-cutting invariants (always on)` list, replacing the
current **Edit-ownership** bullet. The full detail (carve-outs, artefact list, the
fresh-spawn-this-turn test, the named-rationalization ban) stays in
`workflow/enforcement.md`.

**Proposed kernel bullet** (drops into the always-on list in place of the current
Edit-ownership bullet):

> - **Delegation & gate integrity.** The orchestrator drives the pipeline but
>   **never produces, paraphrases, reuses, or skips an autonomous agent's
>   deliverable** by any route — not by editing its canon, not by skipping its
>   gate, not by substituting a crashed agent's output, not by re-presenting a
>   stale on-disk artifact. **A gate is satisfied only by a fresh spawn of the
>   owning agent this turn**; an artifact already on disk is evidence of a *prior*
>   run, never a substitute for this one — **failed / missing / already-existing /
>   skipped all count as "not run".** When an agent's canon must change, respawn
>   that agent (the **edit-route instance** of this rule). The only things the
>   orchestrator legitimately produces are the **outputs of the processes it
>   drives** — the backlog, recorded PM decisions, the gated Pass-2 `## Code
>   review` trail, the gated advocate `## Resolutions` trail, protocol-gap reports,
>   and git ops. Full rule, the two carve-outs, the artefact list, the
>   fresh-spawn-this-turn test, and the named-rationalization ban:
>   `workflow/enforcement.md`.

This kernel carries all four required elements: **gate = fresh spawn this turn**;
**never produce/paraphrase/reuse/skip a deliverable**; **existing-artifact ≠
this-run** ("failed / missing / already-existing / skipped all = not run"); and the
**pointer to the full rule**. The carve-out surface is named inline (so the
always-on reader knows the orchestrator *may* write the backlog/trails/git) but its
gates and rationale are deferred to the full rule — same depth discipline as the
current Edit-ownership bullet.

## 3. workflow/enforcement.md — the full rule (GENERALIZE the existing section)

**Placement decision: generalize the existing `## Boundary, edit-ownership, and
remote-system rules (full)` edit-ownership block in place — do NOT add a sibling
section.** Same absorb logic as §1: a sibling full-rule section would split the
carve-out home. The existing **Edit-ownership rule** paragraph (lines 9–17 of
`enforcement.md`) becomes the **edit-route instance** under a generalized
lead-in. The two carve-out paragraphs (the `## Code review` trail; the
`## Resolutions` trail) and the **Orchestration artefacts** paragraph stay
**verbatim** — they are the carve-out set of the generalized rule. The mechanics:

1. **Re-title the rule** from "Edit-ownership rule" to "**Delegation & gate
   integrity rule (applies to the orchestrator inside the local repo)**", with the
   first sentence generalized: *the orchestrator legitimately writes the outputs of
   the processes it drives; what it never does is **produce, paraphrase, reuse, or
   skip** an autonomous agent's deliverable by any route.* Then a short enumerated
   list of the routes (**edit** / **skip a gate** / **substitute a crashed output**
   / **reuse a stale artifact**) — framed as instances of the one rule, with the
   explicit note that **enumerating routes is illustrative, not exhaustive**: the
   governing test is the fresh-spawn-this-turn test below, not membership in the
   list (this is the lever-1 "general principle, not enumeration" discipline from
   the variant-4 extension, hoisted to the full rule).

2. **Preserve the edit-route paragraph verbatim** — the existing "freehand-edit
   canon … respawns the responsible agent" text becomes the body of the *edit-route
   instance*. The agent-owned-content artefact list (source, schemas, `docs/*`,
   plans, `## Verdict` bodies, arch notes, audit reports) is unchanged and now reads
   as "the canon each route must not touch".

3. **Preserve both carve-outs verbatim in force.** The two carve-out paragraphs
   (`## Code review` trail owned by the orchestrator and gated by `pm-pr-prep`/audit;
   `## Resolutions` trail owned by the orchestrator and gated by
   `pm-plan-checker`/audit) and the **Orchestration artefacts** paragraph (backlog,
   PM decisions, protocol-gap reports, audit-remediation ordering, git ops,
   deployment-script invocation) carry over **unchanged**. They are explicitly
   re-stated as the carve-outs of the *generalized* rule, with the existing "the
   line:" closing paragraph (line 17) preserved as the boundary test. **Nothing in
   the broadened rule may catch these** — they are exactly the things the
   orchestrator MAY produce; the generalized first sentence must read so that
   "outputs of processes it drives" still cleanly covers them.

4. **Name the fresh-spawn-this-turn test** as the rule's operational core (it is
   already the governing test in the `### Graceful subagent-failure` section and the
   variant-4 extension — hoist it to the top-level rule so it governs all four
   routes, not just the failure route): *a gate is satisfied only by a fresh spawn
   of the owning agent this turn; failed / missing / already-existing / skipped all
   = "not run".*

5. **Name-and-forbid the rationalization** (lever 2, hoisted): explicitly ban the
   escape hatches the live incidents named — *"optimize / already done / nothing
   changed / I'll just check it myself / degraded mode → I'll produce or show it
   without spawning."* Pair with the reflex: *a request to plan / review / audit /
   check is a request to SPAWN the owning agent this turn; an existing
   `*_plan.md` / `*_review.md` / `audit-*.md` on disk is a prior run's record, not
   this turn's verdict — re-run regardless of recency or "nothing changed".*

6. **Cross-link the existing sub-sections as instances, not rivals.** The
   `### Graceful subagent-failure` sub-section ("failed = missing") and the
   `### Artifact gate — pre-ship merge` sub-section become explicitly *the
   crash-route instance* and *the deny-side floor* of this one rule. No content
   change to them — only a one-line lead that frames each as "the <route> arm of
   the Delegation & gate integrity rule above". This keeps the deny-side
   enforcement mechanics (merge gate, write guard, retry-N-then-stop) exactly where
   they are, now visibly subordinate to the one invariant.

**Net effect on enforcement.md:** one generalized rule, the same two carve-outs and
the same artefact list (verbatim, re-parented), the fresh-spawn test and
named-rationalization ban promoted from the failure sub-section to the rule's top,
and the existing deny-side sub-sections re-framed as instances. No carve-out is
lost, no orchestrator-output is newly caught.

## 4. Cross-harness — core, so BOTH inherit it; the feature persona becomes an echo

`WORKFLOW.md` and `workflow/enforcement.md` are read by **both** harnesses (they are
the shared, non-harness-specific orchestration spec). Hoisting the invariant into
those two files means:

- **The Claude orchestrator inherits it automatically** — it already reads the
  always-on `## Cross-cutting invariants` list and reads `workflow/enforcement.md`
  on demand. It gains the generalized rule for free; no Claude-specific authoring
  is needed beyond the two shared files.
- **The OpenCode `ai-pm` persona inherits it automatically** — its `instructions`
  carrier loads `WORKFLOW.md` + the `workflow/*.md` files the same way. The
  per-feature persona text in `ai-pm.body.md` and the `AGENTS.md` always-on block
  that piece 1 / the variant-4 extension authored is therefore **downgraded from a
  standalone rule to a HARNESS-LOCAL ECHO** of the core invariant: it *reinforces*
  the core rule on the carrier OpenCode actually reaches reliably (the always-on
  body), it does not *originate* the rule. Its content must now be framed as
  "(reiterating the core Delegation & gate integrity invariant)" and single-sourced
  from / consistent with the `workflow/enforcement.md` rule — not drift from it.
  This is the right relationship: the core states it once; the harness echoes it
  where that harness needs the salience (OpenCode lacks reliable per-prompt
  injection, so it leans on the always-on echo — the documented behavioural skew).

- **`.claude/` golden + neutral-prose implications.** `WORKFLOW.md` and
  `workflow/*.md` are **non-generated** source files (hand-authored, not produced by
  the manifest generator) — so editing them produces **no golden-file change** and
  triggers **no `.claude/` regeneration**. The neutral-prose surface
  (harness-neutral text shared by both harnesses) must stay clean: the generalized
  rule must read harness-neutrally (no "the plugin", no "OpenCode session" in the
  core rule body — those belong only in the harness-local enforcement sub-sections
  and persona echo). The OpenCode persona body and `AGENTS.md` block **are**
  generated/manifest surfaces; if the echo text there changes, the manifest
  regenerates and the golden updates accordingly — but that is the *echo* surface,
  not the *core* surface. Net: the core hoist itself is a non-generated edit (no
  golden churn); only the persona-echo reframe touches a generated surface.

## 5. Feature reframe — all anti-corner-cutting pieces are now ENFORCEMENT of the one core invariant

The whole feature is re-described, top to bottom, as **the enforcement layer of a
single core invariant**, not a bag of independent patches:

| Piece | Was framed as | Now is |
|---|---|---|
| **Piece 1 / variant-4 extension** (persona "failed/existing = not run; never substitute/reuse") | a feature-local persona rule | the **persona/instruction enforcement** of the core invariant — the reasoning-act arms (skip, crash-substitute, stale-reuse) that no deny can reach, stated as the harness-local echo of the core rule |
| **Piece 2 / pre-ship merge gate `(h)`** (deny `git merge` on missing/unstamped review) | a standalone deny | the **deny-side floor** of the core invariant — the structural backstop for the one route (ship on an unsatisfied gate) that surfaces as an inspectable tool call |
| **s15 content-write guard (g)** (deny orchestrator content write) | the original write-deny | the **deny-side floor** for the collapse-pipeline / self-author route of the core invariant |
| **Piece 3** (per-prompt reminder, spike-deferred) | a freshness upgrade | the **salience mechanism** for the core invariant — making the one rule present at decision time, not seen once at session start |
| **Provenance gate** (deferred) | a 4th structural slice | a narrow, feasibility-gated **deny-side complement** for the reuse route — recommended deferred, unchanged |

The reframe's value: there is now **one rule and a set of enforcement points**
(persona/instruction echo for the reasoning-act routes; plugin/hook denies for the
tool-call routes; per-prompt injection for salience). Adding a future
corner-cut variant no longer means "author a new rule" — it means "the core
invariant already forbids it; does this route surface as a deniable tool call (→
add a deny) or a reasoning act (→ covered by the persona echo, no new rule)?" That
is exactly the lever-1 "class altitude, not case enumeration" discipline, now
realized at the protocol-core level instead of inside one feature.

## Recommendation (the hoist)

1. **ABSORB** — generalize the always-on **Edit-ownership** invariant to
   **Delegation & gate integrity**, with Edit-ownership as its named edit-route
   instance. One invariant, not two; the carve-out set re-parented verbatim.
2. **WORKFLOW.md** — replace the Edit-ownership bullet with the drafted kernel
   one-liner (§2), carrying gate=fresh-spawn-this-turn, never
   produce/paraphrase/reuse/skip, existing-artifact ≠ this-run, and the pointer.
3. **workflow/enforcement.md** — generalize the existing edit-ownership full-rule
   block in place (§3): generalized lead-in + route list (illustrative, not
   exhaustive) + the edit-route paragraph verbatim + **both carve-outs and the
   artefact list verbatim in force** + the fresh-spawn-this-turn test +
   named-rationalization ban promoted to the rule top + the existing deny-side
   sub-sections re-framed as instances.
4. **Cross-harness** — both harnesses inherit it from the two shared non-generated
   files (no golden churn for the core hoist); the OpenCode persona text becomes a
   harness-local echo, single-sourced from / consistent with the core rule.
5. **Feature reframe** — record that every anti-corner-cutting piece is now an
   enforcement point of this one invariant, not an independent patch.

**Why this altitude is forced, not optional:** the protocol *already* carries the
edit-route slice in its always-on core. Leaving the other four routes at feature
altitude means the core invariant is *true but partial* — it forbids editing an
agent's canon while staying silent on skipping/substituting/reusing it, which is
the same target. The PM's "одним махом" is the correct instinct: the right fix is
to widen the slice already in the core to the full class, in the two files both
harnesses read, so the rule is stated once and enforced at the points each route
actually surfaces.
