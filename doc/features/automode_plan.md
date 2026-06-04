# automode — plan

*Decision authority for this feature: interactive (this meta-feature is built interactively; the field below is the very mechanism it introduces).*

A **decision-authority mode** for the protocol: the PM front-loads intent + boundaries at bootstrap, then grants the pipeline authority to resolve product-forks autonomously from the bootstrap baseline + project canon — recording each auto-decision with a cited rationale, and escalating only a fork the canon does not cover. The inverse of today's interactive-by-default cadence, and the opposite end of the same dial `pm-product-advocate` sits on. This is a **wiring/redirect** feature: it does not delete the advocate or invent a confidence number — it redirects the advocate's existing gap output through a *derive-from-cited-canon-or-escalate* gate, reusing the `## Resolutions` trail as the auto-decision log.

Settled by research (`.ai-pm/research/automode_research.md`) and the three PM forks (2026-06-04):

- **Graded, per-feature, capped** — a project default (`## Decision authority` in `CLAUDE.md`) **plus** a per-feature plan override; autonomy is an **upper bound**, never required.
- **Decide-and-log, no veto window** — an auto-resolved fork proceeds immediately; the PM reviews the batch after the fact via the trail.
- **Merge/ship stays with the PM** — Step 6 (A/B/C) is unchanged; automode never opens or merges a PR.

## Scenarios

1. **Autonomous gap resolution from cited canon.** On a feature whose **effective decision authority** is `autonomous`, when `pm-product-advocate` reports `gaps: N`, the orchestrator does not blanket-relay them. For each gap it runs the **derivability test** — *is the gap's answer derivable from cited project canon (`docs/product.md` / `docs/architecture.md` / `.ai-pm/contracts/` / prior `## Resolutions` / declared standards) + the bootstrap mandate?* A derivable gap is **auto-resolved**: recorded as a `## Resolutions` entry **marked `auto`**, carrying the **cited canon passage** (a `file` / `### section` reference) + a one-line rationale, **without** an `AskUserQuestion`.

2. **Escalate what the canon does not cover (the cap).** In `autonomous` mode a gap that is **not derivable** from canon — OR touches a `### Security-relevant surfaces` item on a security-bearing project — OR belongs to a fork the PM marked irreversible / high-stakes — is **escalated**: recorded as a `## Resolutions` entry **marked `escalated`** and **relayed in the existing one `AskUserQuestion` pass** (the interactive path, now narrowed to just the escalation set). If the escalation set is empty the gate is fully silent; if non-empty the PM answers only the genuinely-unresolvable gaps. Automode therefore **never confabulates** a product direction the baseline never implied — no canon passage ⇒ no auto-decision.

3. **Effective-authority resolution order + back-compat.** Effective authority = **per-feature plan override** (the plan's `Decision authority:` line, if present) → else the project default (`## Decision authority` in `CLAUDE.md`) → else **`interactive`**. An **absent OR unrecognized** value ⇒ `interactive` — so every existing downstream project behaves **exactly as today** (the machinery is dormant unless `autonomous` is explicitly declared), mirroring the `absent OR unrecognized ⇒ software` rule of `### Project kind`.

4. **Merge/ship authority stays with the PM.** Even in `autonomous` mode, Step 6 (A/B/C ship gate) is **unchanged** — the orchestrator never opens or merges a PR without the PM's explicit choice. Autonomy relaxes only the *product-fork* questions, never merge/release authority.

5. **Decide-and-log, no veto window.** An auto-resolved gap is acted on immediately; the pipeline does not pause for an override window. The PM's control is **batch review after the fact** — the `## Resolutions` trail with its `auto` / `escalated` markers is the reviewable audit log (the rationale is committed **before** acting, so it resists post-hoc justification).

6. **Anti-confabulation guard is load-bearing, not by-discipline.** `pm-plan-checker` blocks an autonomously-resolved feature whose any `## Resolutions` entry marked `auto` **lacks a cited canon reference** — a presence check on the shape (a `file` / `### section` token), never a judgement of whether the citation truly supports the decision (the PM owns meaning at batch review). `pm-auditor` dimension 1 carries the same backstop project-wide. This is the citation guard the research names as the dominant-risk countermeasure.

7. **Categorical coverage.** `Decision authority` enum = **`autonomous | interactive`** (the full set); both branches are specified. The considered-and-excluded siblings (a third **veto-window** mode; **auto-merge**; a **bootstrap-time authority question**) are listed under Out of scope, each with one line on why it is separate.

8. **The advocate agent is unchanged.** `pm-product-advocate` still generates the same gaps from the same `### Foundational product questions` checklist into the same artifact; only the **orchestrator's handling** (relay vs derive-or-escalate) branches on authority. No new agent, no new command, no change to the advocate's prompt.

## Existing behaviors this feature touches

(from the protocol spec — what must not break)

- **Step 3.5 product-readiness gate (interactive relay).** When effective authority is `interactive` (the default, and every existing project) the gate behaves **byte-identically** to today: spawn advocate → `clean` silent-pass, or `gaps: N` relayed in one `AskUserQuestion`. The autonomous branch is purely additive.
- **The advocate `## Resolutions` trail (Edit-ownership second carve-out).** Still orchestrator-owned, still one numbered entry per gap, still count-matched (`gaps: N` ↔ N resolutions). The entries gain an `auto` | `escalated` marker (an interactive answer is the unmarked/`asked` baseline). A `clean` verdict still needs **no** trail.
- **`pm-plan-checker` DoD product-readiness item & `pm-auditor` dimension 1.** The `gaps: N` ↔ N-resolutions count check is unchanged; the citation-presence sub-check is additive and fires only on `auto` entries.
- **The `### Project kind` single-source pattern.** `### Decision authority` mirrors it exactly — one subsection owns the enum + default; every consumer references it **by name** and never re-encodes the default.
- **Step 6 ship gate** and **"How to talk to the PM" → substantive forks via `AskUserQuestion`.** Unchanged for interactive; the autonomous rider only inserts the derivability test *before* a fork would be raised.

## Contracts

None. Meta-feature on the no-user-facing-contract template repo (the documented exception). No new API, data shape, or config consumed by a downstream runtime — the one new declared key (`## Decision authority`) is the protocol's own spec vocabulary, single-sourced in `### Decision authority`, defaulting to the back-compat-safe `interactive`.

## Interaction scenarios

Provably isolated: the change is prose-spec only — no runtime, no shared mutable state, no concurrent operations, no I/O. The one cross-artifact coupling (advocate gaps → orchestrator handling → Resolutions trail → plan-checker/auditor checks) is sequential within a single feature's pipeline and is covered by Scenarios 1, 2, 6 and the clean-grep verification.

## Test plan

*Repo discipline: "no automated tests by design — validation by use." Verification is editorial + clean-grep, the same shape as every prior meta-feature; `tests/hooks.sh` (the one executable suite) must stay green because no hook changes.*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged; this feature touches no hook).
- New tests: none (prose-spec feature). Verification instead:
  - **Editorial walkthrough** of the autonomous Step 3.5 branch against the interactive one — the autonomous path is strictly additive; the interactive path is byte-unchanged.
  - **Clean-grep — single source:** `### Decision authority` is the only place that encodes the enum + the `absent OR unrecognized ⇒ interactive` default; every consumer (`CLAUDE.md.tmpl`, `pm-plan.md`, `pm-plan-checker.md`, `pm-auditor.md`, Step 3.5, the PM-talk rider) references it **by name** and re-encodes neither the enum nor the default.
  - **Clean-grep — back-compat:** no consumer treats an absent `## Decision authority` line as anything but `interactive`; no existing project artifact gains a required `## Decision authority` line (absence is safe and complete, so **no migration** is needed — mirroring project-kind absent⇒software).
  - **Resolution-trail shape:** the `auto` / `escalated` markers and the `auto`-entry citation requirement are described once in `### Decision authority` and referenced by the plan-checker/auditor checks (not re-encoded).
- Interaction scenario tests: none (provably isolated — see above).
- Stack-spec tests: none (no stack component touched; no `docs/stack-notes.md` entry applies).

## Docs to update

- `WORKFLOW.md`:
  - New **`### Decision authority`** subsection (single source) — enum `autonomous | interactive`; default `absent OR unrecognized ⇒ interactive`; the per-feature plan override + the effective-authority resolution order; the **derivability test** (cite canon or escalate); the **escalate-regardless cap** (not-derivable / security-surface / PM-marked-irreversible); **decide-and-log, no veto window**; **merge/ship stays manual**; the `## Resolutions` `auto` | `escalated` markers + the `auto`-entry citation requirement. Every other consumer references this subsection by name.
  - **Step 3.5** — add the autonomous branch (advocate spawn unchanged; gaps go through derive-or-escalate; only the escalation set reaches the one `AskUserQuestion`).
  - **"How to talk to the PM"** — a one-paragraph autonomous rider: in `autonomous` mode, before raising a product fork via `AskUserQuestion`, apply the derivability test (decide-and-log if derivable; escalate if not / high-stakes / irreversible). Load-bearing enforcement is at the gated Step 3.5; this rider covers ad-hoc forks.
  - **Edit-ownership second carve-out** — note the Resolutions entries now carry the `auto` | `escalated` marker (the trail is still orchestrator-owned, still gate-backed).
- `doc/_templates/CLAUDE.md.tmpl`: add a `## Decision authority: interactive` line (with an explanatory comment, the same shape as `## Project kind: software`), defaulting to `interactive`.
- `.claude/commands/pm-plan.md`: document the optional per-feature `Decision authority:` override line in the plan format, and that Step 3.5 reads it as the top of the effective-authority resolution order.
- `.claude/agents/pm-plan-checker.md`: add the **anti-confabulation citation check** to the product-readiness DoD path — on an autonomously-resolved feature, every `## Resolutions` entry marked `auto` must carry a cited canon reference; absent → blocking (presence-keyed, shape-not-meaning). The `gaps: N` ↔ N-resolutions count check is unchanged.
- `.claude/agents/pm-auditor.md`: dimension 1 product-readiness backstop gains the same `auto`-entry citation-presence check, project-wide.
- `doc/architecture.md`: decision record — graded/capped autonomy, ODD-as-baseline, the no-number derivability proxy (and why not a confidence threshold), the `### Decision authority` single-source pattern. (Owned by `pm-architect`, post-coding handoff.)
- `README.md`: one marketing-level line noting the two decision-authority modes (interactive default; optional autonomous with a reviewable auto-decision trail).
- `.ai-pm/state/current.md`: set to this feature at plan landing, archive at ship (orchestrator).

## Out of scope

- **Veto-window mode** — the sibling of the chosen decide-and-log (auto-resolve-but-pause-for-override, J3016 L3 / Sheridan rung 6). Excluded by PM decision: it re-introduces synchronous waiting (defeats automode's purpose) and carries the documented L3 hand-off-readiness hazard. A separate plan if ever wanted.
- **Auto-merge / auto-ship** — the sibling that would let automode open and merge PRs. Excluded by PM decision: merge/release is high-stakes and stays a human gate (Step 6). Separate plan.
- **Bootstrap-time decision-authority question** — v1 ships the defaulted `interactive` line in `CLAUDE.md.tmpl`; the PM opts into `autonomous` later (edit / tell the orchestrator / per-feature override). A `/pm-bootstrap` question is a distinct surface and a separate plan; absent⇒interactive makes it unnecessary for v1.
- **Suppressing the `/pm-plan` clarifying-question conversation** — v1 scopes automode to product-fork resolution at the gated Step 3.5 plus the general PM-talk rider. A fully-autonomous planning conversation (no clarifying questions at all) is a larger, riskier surface — future plan.
- **Canon-feedback promotion loop** — auto-decisions are already recorded in the `## Resolutions` trail and contracts that later features read; explicit promotion of an auto-decision into `docs/product.md` / `docs/architecture.md` is a future enhancement, not v1.
- **Calibrated numeric confidence thresholding** — the research is explicit that LLM self-confidence is overconfident; v1 uses the derivability/citation gate, never a numeric threshold. Not a sibling to add later — a rejected approach.
- **Reversal-on-review mis-calibration metric** — a future signal that automode is mis-calibrated (escalation-rate / reversal-on-review). v1 ships the trail that would feed it; the metric itself is later.
