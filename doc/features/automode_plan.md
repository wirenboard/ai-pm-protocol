# automode — plan

Decision authority: interactive

*(This meta-feature is built interactively; the line above is the very per-feature override mechanism it introduces — here set to its default.)*

A **decision-authority mode** for the protocol: the PM front-loads intent + boundaries at bootstrap, then grants the pipeline authority to resolve product-forks autonomously from the bootstrap baseline + project canon — announcing each decision in console and recording it with a cited rationale, escalating only a fork the canon does not cover, and **always stopping before merge**. The inverse of today's interactive-by-default cadence, and the opposite end of the same dial `pm-product-advocate` sits on. This is a **wiring/redirect** feature: it does not delete the advocate or invent a confidence number — it redirects the advocate's existing gap output through an *announce + derive-from-cited-canon-or-escalate* gate, reusing the `## Resolutions` trail as the auto-decision log.

Settled by research (`.ai-pm/research/automode_research.md`) and the PM forks (2026-06-04):

- **Two scopes, one mechanism.** **Project-wide** (set at bootstrap — every feature runs autonomously) **and per-feature** (project is manual, one feature runs autonomously). Same engine, two entry points; autonomy is an **upper bound**, never required.
- **Announce-before-act + advisory veto window.** Every autonomous decision is printed to console (fork · chosen option · brief rationale · invariants kept) **before** the orchestrator acts; the PM can interrupt at any time. A configurable `veto-window-seconds` (default 15) is recorded as the intended pause; today it is advisory (announce-then-proceed, interruptible) — a hard countdown is a future harness hook.
- **Merge/ship stays the PM's.** In **both** scopes, automode carries a feature to a finished, reviewed result and **stops before merge** (Step 6 A/B/C unchanged). Automode never opens or merges a PR.
- **Durable, isolated setting.** The project-level value lives in a dedicated `.ai-pm/decision-authority.md` (mode + `veto-window-seconds`), not a line buried in `CLAUDE.md` that an edit could drop. Semantics (enum + default) stay single-sourced in `### Decision authority` in `WORKFLOW.md`.
- **Changeable mid-flight.** The PM stops (interrupt) and flips the mode any time — edit `.ai-pm/decision-authority.md` or tell the orchestrator; the change takes effect for all subsequent forks.

## Scenarios

1. **Project-wide autonomous resolution from cited canon.** When `.ai-pm/decision-authority.md` has `mode: autonomous`, every feature's product-forks are resolved autonomously. For each `pm-product-advocate` gap the orchestrator runs the **derivability test** — *is the gap's answer derivable from cited project canon (`docs/product.md` / `docs/architecture.md` / `.ai-pm/contracts/` / prior `## Resolutions` / declared standards) + the bootstrap mandate?* A derivable gap is **announced** (fork · chosen option · brief rationale · invariants) and **auto-resolved**: recorded as a `## Resolutions` entry **marked `auto`**, carrying the **cited canon passage** (a `file` / `### section` reference) + a one-line rationale committed **before** acting — no blocking `AskUserQuestion`.

2. **Per-feature autonomous resolution on a manual project.** When the project default is `interactive` but a feature's plan carries `Decision authority: autonomous`, that one feature runs autonomously (same announce + derive-or-escalate engine), while the rest of the project stays interactive. The override is the top of the effective-authority order.

3. **Escalate what the canon does not cover (the cap).** In autonomous mode a gap that is **not derivable** from canon — OR touches a `### Security-relevant surfaces` item on a security-bearing project — OR belongs to a fork the PM marked irreversible / high-stakes — is **escalated**: recorded as a `## Resolutions` entry **marked `escalated`** and **relayed in the existing one `AskUserQuestion` pass** (the interactive path, narrowed to just the escalation set). Empty escalation set ⇒ fully silent (only announcements). Automode therefore **never confabulates** a product direction the baseline never implied — no canon passage ⇒ no auto-decision.

4. **Announce-before-act, advisory veto window.** Before acting on any autonomous decision the orchestrator prints a brief console line — `[automode] Fork: <…>. Chosen: <…>. Why: <…> (cites <canon ref>). Invariants: <…>. (proceeding — interrupt to override)` — then proceeds. The PM can interrupt (Esc) at any moment to override or switch modes. `veto-window-seconds` (default 15, configurable in `.ai-pm/decision-authority.md`) is the intended pause length; v1 enforcement is announce-then-proceed + always-interruptible, the literal countdown deferred to a future hook (no Claude Code primitive waits N seconds for optional input).

5. **Effective-authority resolution order + back-compat.** Effective authority = **per-feature plan override** (the plan's `Decision authority:` line, if present) → else **`.ai-pm/decision-authority.md` `mode:`** → else **`interactive`**. An **absent file OR unrecognized value** ⇒ `interactive` — so every existing downstream project (no such file) behaves **exactly as today**, the machinery dormant unless `autonomous` is explicitly declared. Mirrors the `absent OR unrecognized ⇒ software` rule of `### Project kind`; **no migration** is introduced.

6. **Merge/ship authority stays with the PM (both scopes).** Even in autonomous mode, Step 6 (A/B/C ship gate) is **unchanged** — the orchestrator carries the feature through implementation, tests, and the review loop, then **stops before merge** and surfaces the result. Autonomy relaxes only the *product-fork* questions, never merge/release.

7. **Change authority mid-flight.** The PM interrupts and changes the mode at any time — editing `.ai-pm/decision-authority.md` or telling the orchestrator (project scope), or it simply not being set for the next feature (per-feature scope). The new mode governs all **subsequent** forks; already-recorded `auto` decisions stand in the trail for batch review.

8. **Anti-confabulation guard is load-bearing, not by-discipline.** `pm-plan-checker` blocks a feature whose any `## Resolutions` entry marked `auto` **lacks a cited canon reference** — a presence check on the shape (a `file` / `### section` token), never a judgement of whether the citation truly supports the decision (the PM owns meaning at batch review). `pm-auditor` dimension 1 carries the same backstop project-wide.

9. **Categorical coverage.** The `mode` enum = **`autonomous | interactive`** (the full set); both branches specified. Considered-and-excluded siblings (a **blocking** veto-window mode that waits indefinitely; **auto-merge**; a numeric **confidence threshold**) are listed under Out of scope, each with one line on why it is separate.

10. **The advocate agent is unchanged.** `pm-product-advocate` still generates the same gaps from the same `### Foundational product questions` checklist into the same artifact; only the **orchestrator's handling** (relay vs announce-derive-or-escalate) branches on authority. No change to the advocate's prompt.

## Existing behaviors this feature touches

(from the protocol spec — what must not break)

- **Step 3.5 product-readiness gate (interactive relay).** When effective authority is `interactive` (the default, and every existing project) the gate behaves **byte-identically** to today: spawn advocate → `clean` silent-pass, or `gaps: N` relayed in one `AskUserQuestion`. The autonomous branch is purely additive.
- **The advocate `## Resolutions` trail (Edit-ownership second carve-out).** Still orchestrator-owned, still one numbered entry per gap, still count-matched (`gaps: N` ↔ N resolutions). Entries gain an `auto` | `escalated` marker (an interactive answer is the unmarked baseline). `clean` still needs **no** trail.
- **`pm-plan-checker` DoD product-readiness item & `pm-auditor` dimension 1.** The `gaps: N` ↔ N-resolutions count check is unchanged; the citation-presence sub-check is additive and fires only on `auto` entries.
- **The `### Project kind` single-source pattern.** `### Decision authority` mirrors it — one subsection owns the enum + default; consumers reference it **by name** and never re-encode the default. (Difference: the *value* lives in a dedicated file, not `CLAUDE.md`, because authority is a PM-flippable toggle that must survive edits — project-kind is set-once.)
- **`/pm-bootstrap`.** Gains one question (who makes PM-decisions) and writes `.ai-pm/decision-authority.md`; every other bootstrap step is unchanged. Absent answer / older bootstrap ⇒ no file ⇒ interactive.
- **Step 6 ship gate** and **"How to talk to the PM" → substantive forks via `AskUserQuestion`.** Unchanged for interactive; the autonomous rider inserts the announce + derivability test *before* a fork would be raised, and never touches merge authority.

## Contracts

None. Meta-feature on the no-user-facing-contract template repo (the documented exception). No new API or data shape consumed by a downstream runtime — the new declared keys (`mode`, `veto-window-seconds` in `.ai-pm/decision-authority.md`) are the protocol's own spec vocabulary, single-sourced in `### Decision authority`, defaulting to the back-compat-safe `interactive` / `15`.

## Interaction scenarios

Provably isolated: the change is prose-spec only — no runtime, no shared mutable state, no concurrent operations, no I/O. The one cross-artifact coupling (decision-authority file → orchestrator handling → announcement + Resolutions trail → plan-checker/auditor checks) is sequential within a single feature's pipeline and is covered by Scenarios 1–8 and the clean-grep verification.

## Test plan

*Repo discipline: "no automated tests by design — validation by use." Verification is editorial + clean-grep, the same shape as every prior meta-feature; `tests/hooks.sh` (the one executable suite) must stay green — this feature touches no hook.*

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged).
- New tests: none (prose-spec feature). Verification instead:
  - **Editorial walkthrough** — the autonomous Step 3.5 branch is strictly additive; the interactive path is byte-unchanged; the announce-before-act line and merge-stays-manual hold in both scopes.
  - **Clean-grep — single source (blocking, per arch note):** `### Decision authority` is the only place that encodes the enum + the `absent OR unrecognized ⇒ interactive` default; every consumer (`pm-bootstrap.md`, `pm-plan.md`, `pm-plan-checker.md`, `pm-auditor.md`, Step 3.5, the PM-talk rider) references it **by name** and re-encodes neither the enum nor the default.
  - **Clean-grep — back-compat:** no consumer treats an absent `.ai-pm/decision-authority.md` (or unrecognized `mode`) as anything but `interactive`; **no consumer requires the file to exist** (absent ⇒ interactive, never an error); no existing project artifact gains a required field; no `MIGRATIONS.md` change (absence is safe and complete, mirroring project-kind absent⇒software).
  - **Timer-honesty grep:** the `veto-window-seconds` "recorded, not enforced in v1" caveat is present at the single source (`### Decision authority`), not only in the plan; no consumer renders the seconds as a live countdown.
  - **Resolution-trail shape:** the `auto` / `escalated` markers and the `auto`-entry citation requirement are described once in `### Decision authority` and referenced (not re-encoded) by the plan-checker/auditor checks.
  - **Merge-untouched:** no autonomous path reaches `pm-pr-prep` / a merge without the Step 6 PM choice.
- Interaction scenario tests: none (provably isolated — see above).
- Stack-spec tests: none (no stack component touched).

## Docs to update

- `WORKFLOW.md`:
  - New **`### Decision authority`** subsection (semantics single source) — enum `autonomous | interactive`; default `absent file OR unrecognized ⇒ interactive`; **value home** = `.ai-pm/decision-authority.md` (`mode` + `veto-window-seconds`, default `15`); the per-feature plan override + the effective-authority resolution order; the **two scopes** (project-wide / per-feature); the **announce-before-act** console rule + the **advisory veto window** (default 15s) — state at THIS single source the load-bearing caveat that `veto-window-seconds` is **recorded but NOT enforced as a countdown in v1** (announce-then-proceed-interruptible; a hard countdown is a future hook), and that the console line **never renders a live countdown**; the **derivability test** (cite canon or escalate); the **escalate-regardless cap** (not-derivable / security-surface / PM-marked-irreversible); **merge/ship stays manual in both scopes**; **change-mid-flight**; the `## Resolutions` `auto` | `escalated` markers + the `auto`-entry citation requirement. Closing sentence: every consumer references this subsection BY NAME and never re-encodes the enum/default.
  - **Step 3.5** — add the autonomous branch (advocate spawn unchanged; gaps go through announce + derive-or-escalate; only the escalation set reaches the one `AskUserQuestion`; auto entries recorded with citation). Interactive branch byte-unchanged; state the autonomous path is additive. Reference `### Decision authority` by name.
  - **"How to talk to the PM"** — a short autonomous rider: in autonomous mode, before raising a product fork via `AskUserQuestion`, announce the fork + chosen option + brief rationale + invariants and apply the derivability test (proceed if derivable; escalate if not / high-stakes / irreversible); never auto-merge. Load-bearing enforcement is the gated Step 3.5; this rider covers ad-hoc forks.
  - **Edit-ownership second carve-out** — note the `## Resolutions` entries now carry an `auto` | `escalated` marker (still orchestrator-owned, still gate-backed; count-match unchanged).
- `.claude/commands/pm-bootstrap.md`: add the **decision-authority question** ("Who makes the product decisions on this project — you each time (interactive), or the pipeline from your bootstrap + project canon (autonomous)?", default interactive) and **write `.ai-pm/decision-authority.md`** from the answer (`mode` + `veto-window-seconds: 15`). Reference `### Decision authority` by name; do not re-encode the default.
- `.claude/commands/pm-plan.md`: document the optional per-feature `Decision authority:` override line in the plan format, and that Step 3.5 reads it as the top of the effective-authority resolution order. Reference `### Decision authority` by name.
- `.claude/agents/pm-plan-checker.md`: add the **anti-confabulation citation check** to the product-readiness DoD path — every `## Resolutions` entry marked `auto` must carry a cited canon reference; absent → blocking. Explicitly **presence-keyed / shape-not-meaning** (never judges whether the citation supports the decision — PM owns meaning at batch review). The `gaps: N` ↔ N-resolutions count check is unchanged; the new check fires only on `auto` entries. Reference `### Decision authority` by name.
- `.claude/agents/pm-auditor.md`: dimension 1 product-readiness backstop gains the same `auto`-entry citation-presence check, project-wide (the same shape as the unstamped-trail and advocate-resolution backstops beside it).
- `doc/architecture.md`: decision record — graded/capped autonomy, two scopes, ODD-as-baseline, the no-number derivability proxy (and why not a confidence threshold), the dedicated-file value home (durability rationale) vs the `### Project kind` precedent, the dual backstop (why not redundant). (Owned by `pm-architect`, post-coding handoff.)
- `README.md`: one marketing-level line — two decision-authority modes (interactive default; optional autonomous with announced, reviewable auto-decisions; merge stays yours).
- `.ai-pm/state/current.md`: orchestrator-owned (set at plan landing, archived at ship).

(No `CLAUDE.md.tmpl` change — authority value moved out of `CLAUDE.md` into the dedicated file, avoiding a second source. No `MIGRATIONS.md` change — absent⇒interactive is safe and complete.)

## Out of scope

- **Hard countdown timer** — a literal "wait N seconds for input, else proceed" is not a Claude Code primitive (PM-confirmed). v1 ships announce-before-act + always-interruptible and records `veto-window-seconds` as the intended setting; wiring a real countdown (hook / external mechanism) is a separate future plan.
- **Blocking veto-window mode** — a window that waits indefinitely for an override (J3016 L3 / Sheridan rung 6). Excluded: it re-introduces synchronous waiting and carries the documented L3 hand-off-readiness hazard; the advisory announce-then-proceed window is the chosen shape.
- **Auto-merge / auto-ship** — letting automode open and merge PRs. Excluded by PM decision: merge/release is high-stakes and stays a human gate (Step 6), in both scopes.
- **Suppressing the `/pm-plan` clarifying-question conversation** — v1 scopes automode to product-fork resolution at the gated Step 3.5 plus the general PM-talk rider. A fully-autonomous planning conversation (no clarifying questions at all) is a larger, riskier surface — future plan.
- **Canon-feedback promotion loop** — auto-decisions are already recorded in the `## Resolutions` trail and contracts that later features read; explicit promotion of an auto-decision into `docs/product.md` / `docs/architecture.md` is a future enhancement, not v1.
- **Calibrated numeric confidence thresholding** — the research is explicit that LLM self-confidence is overconfident; v1 uses the derivability/citation gate, never a numeric threshold. A rejected approach, not a deferred sibling.
- **Reversal-on-review mis-calibration metric** — a future signal that automode is mis-calibrated (escalation-rate / reversal-on-review). v1 ships the trail that would feed it; the metric is later.
