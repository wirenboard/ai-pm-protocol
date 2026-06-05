# diagnostic-flow-discipline — Pass-1 plan-compliance review

## Plan compliance

- ✓ **Scenario 1 — Passive observation is read-only-grade (Step A).** Implemented at `workflow/incident.md:20`. Names passive observation of a live signal (`tcpdump`, BLE/mDNS scan, bus capture, reading advertisements) as read-only-grade, the same class as reading a log — explicitly **not** a probe: "no Step A.5 authorization, no Blast-radius preflight. I reach for it early." The **observe-vs-emit boundary is explicit and not hand-wavy**: the carve-out is for *listening* to what is already present; anything that **transmits** toward a coupled external stateful peer (injecting traffic, an active scan soliciting scan-responses from a paired peer, pairing/commissioning, writing to a bus) "is judged on whether it reaches or mutates that peer and stays under Step A.5 + the Blast-radius preflight." The silent-change boundary (`no sed/vi on a repo-owned file, no systemctl restart, no apt install`) is intact in the same paragraph. Verification editorial (markdown-prose repo).
- ✓ **Scenario 2 — Bisect before you hypothesize.** Implemented at `workflow/incident.md:22`. Multi-stage path (hardware → driver → transport → protocol → app logic), silent/ambiguous symptom → "first move is the cheapest observation that splits the path in half" before reasoning top-down; ground truth at the lowest cheaply-observable layer first. Placed directly after Step A, links back to passive observation as the usual cheapest split.
- ✓ **Scenario 3 — Stop-and-research tripwire (anti-thrash).** Implemented at `workflow/incident.md:43`, placed **around the probe loop** (immediately after the Step A.5 probe rules, before Step B) as the plan requires. "Two failed fixes in a row on the same symptom is a hard signal that the model is wrong, not the line"; next move is "**not another patch**" → consult the canonical source (reference implementation / official example / spec). Carries the explicit non-relaxation clause.
- ✓ **Scenario 4 — Stack-research is a mid-diagnosis escalation.** Implemented at `workflow/incident.md:45` ("spawn `pm-stack-researcher` *whenever reality contradicts an already-cited stack rule*... not only from `/pm-plan`"), framed as a first-class move not an admission of failure, paired with the tripwire. The agent file gains **exactly one** mid-debug invocation-context line (`.claude/agents/pm-stack-researcher.md:16`), and the up-front contexts (`/pm-bootstrap` greenfield, `/pm-bootstrap` legacy, `/pm-plan`, Standalone) are all **kept** — the line is purely additive.

## CRITICAL SAFETY CHECK — relaxes nothing

- ✓ **Blast-radius preflight (`incident.md:7–18`) — untouched.** No edit to any preflight line in the diff.
- ✓ **Line 18 "relaxes none of the Step A read-only default or the Step A.5 probe rules" — intact**, verbatim, unchanged by the diff.
- ✓ **Step A.5 probe authorization (`incident.md:24–41`) — untouched.** No diff hunk touches the probe proposal or the probe rules.
- ✓ **Passive observation is placed outside the preflight ONLY because it is genuinely read-only/non-emitting** — the observe-vs-emit boundary is stated explicitly (listening vs transmitting), and anything that reaches/mutates a coupled peer is kept inside Step A.5 + the preflight. Not hand-wavy.
- ✓ **The tripwire adds a brake, not a relaxation** — "it relaxes nothing in the Step A read-only default or the Step A.5 probe rules — authorization for the next touch is still required exactly as before."
- No hunk loosens probe authorization or weakens the preflight. **No blocking safety finding.**

## Docs

- ✓ `doc/architecture.md` decision record landed (`### Diagnostic-flow discipline...`, additive under `## Architectural decisions`) — records all four disciplines, the "relaxes NONE of the safety rules" stance, the no-hook-for-semantic-judgement family placement, reuses-pm-stack-researcher/no-new-agent, and `**Source:** doc/features/diagnostic-flow-discipline_plan.md`.
- ✓ README correctly **not** touched (no install/quickstart/architecture-one-liner/doc-pointer change; README-currency trigger does not fire), as the plan states.

## Test plan / verification

- ✓ **No new automated test is correct.** Markdown orchestration-prose change in a markdown-prose repo with no runtime/linter to host a "did the agent bisect / stop-and-research" test; documented-boundary, matching the changeset-hygiene / test-wiring-parity prose-half precedent. Verification is editorial (this Pass-1) + Pass-2 + validation-by-use.
- ✓ `bash tests/hooks.sh` → **73/73 passed** (re-run this review); no hook touched.

## Scope / Out-of-scope

- ✓ Blast-radius preflight rule itself unchanged; passive observation explicitly outside, emitting cases inside.
- ✓ No new agent / command / hook — mid-debug stack-research reuses `pm-stack-researcher` (one added trigger line).
- ✓ Steps B/C/D and Step 5.5 untouched (no diff hunk).
- ✓ No mechanical auto-detect of "two failed fixes" / "reality contradicts the cited rule" — left as orchestrator-discipline prose.
- ✓ Other feedback items (agent-VCS reliability; reviewability B/C) not folded in.
- The `.ai-pm/backlog.md` addition is the recording of the sibling source feedback item the plan's `Source:` line names (PM/orchestrator-owned backlog), not feature-scope expansion — additive, not flagged.

## Product Contract

No Product Contract touched — internal diagnostic-discipline change to the protocol's own flow; non-user-facing.

## Categorical coverage

The diagnostic-flow steps the feature focuses on are bounded: Step A (extended), Bisect (new), Step A.5 (untouched, declared out of scope), tripwire + mid-debug stack-research (new), Steps B/C/D (untouched, declared out of scope). No silent sibling case — every untouched step is named under Out of scope. ✓

## Definition of Done

- [x] All plan scenarios implemented and tested (editorial verification per kind — all four land)
- [x] Interaction scenarios have concurrent-state tests — `Provably isolated:` declared (prose additions, no shared state/concurrency/I/O); the one adjacency handled editorially via the explicit observe-vs-emit boundary + intact line 18
- [x] Stack expectations respected; stack-spec tests pass — none touched (Markdown orchestration prose)
- [x] Product Contract honored; Acceptance checks pass; no silent behavior change — no Product Contract touched
- [x] Pipeline green — `tests/hooks.sh` 73/73; no stack linter (markdown-prose repo per CLAUDE.md)
- [x] State file updated — `.ai-pm/state/current.md` reflects coding done + arch handoff done → review loop
- [x] Product Impact Report present (when contract touched) — n/a, no contract
- [x] Docs updates landed — `doc/architecture.md` decision record present; README correctly untouched
- [x] Expected artifacts exist (plan, this review; contract n/a — non-user-facing)
- [x/n/a] Product-readiness gate resolved — **n/a**: non-user-facing feature; every scenario subject is the system / orchestrator / flow (passive observation, bisect, tripwire, stack-research escalation), no human role subject. Advocate artifact not required.
- [x/n/a] Validation gate resolved — **n/a**: `software`-kind project (`CLAUDE.md` `## Project kind: software`); no `## Validation` section, `## Code review` stamp applies.

**DoD: pass**

## Blocking

None.

## Notes (product)

None. Diff is clean and additive: the one modified line is the Step A paragraph (passive observation is necessarily inserted mid-paragraph — an incidental, plan-serving edit, not noise); everything else is pure insertion. No reflow of untouched lines, no cosmetic churn, no scope expansion. Changeset-hygiene satisfied.

## Verdict

approve

## Code review findings
`code-review` (built-in, high effort) over the diff (`workflow/incident.md`, `.claude/agents/pm-stack-researcher.md`). **No defects (`[]`).**

Markdown orchestration prose — no executable logic. Traced for safety-rule preservation, cross-ref consistency, and dogfood:
- **Safety preserved:** the Blast-radius preflight (lines 7–18), line 18's "relaxes none of …", and the Step A.5 probe rules are untouched. The tripwire paragraph explicitly states "it relaxes nothing in the Step A read-only default or the Step A.5 probe rules — authorization for the next touch is still required exactly as before." Passive observation sits outside the preflight only via the explicit observe-vs-emit boundary (emitting toward a coupled peer stays under A.5 + preflight). No relaxation.
- **Cross-refs consistent:** the bisect paragraph cross-links the passive-observation carve-out; the mid-debug-escalation paragraph pairs with the tripwire; `pm-stack-researcher.md`'s new mid-debug bullet references "the 'Stack-research is a mid-diagnosis escalation' rule in `workflow/incident.md`" by name (matches the actual bold heading — incident.md uses bold-inline headings, not `###`, so a by-name reference is correct).
- **Additive only:** the Step A change is one necessary mid-paragraph insertion; the other three are new paragraphs + one bullet. No reflow of untouched lines, no cosmetic churn (changeset-hygiene honored).
- Voice matches incident.md's first-person orchestrator-discipline style.

## Code review: 2026-06-05 — built-in code-review (high effort), no defects — passed
