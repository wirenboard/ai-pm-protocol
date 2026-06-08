# OpenCode compact one-pass reviewer + control-layer model + ultra removal — design notes

## Context

The plan (`doc/features/opencode-compact-reviewer_plan.md`) GATES three structural pieces on this note before coding:

- **(A)** compress the wb multi-agent `code-review-orchestrator` skill (`SKILL.md` ≈17.6 KB + 11 aspect briefs ≈42 KB total) into ONE single-pass OpenCode `code-review` engine body at ~¼ size, without losing the load-bearing discipline (severity defs, dedup/reasonableness filter, plan-compliance as a hard blocker, architecture as non-blocking proposals, the consolidated-report + verdict rubric).
- **(B)** make "the reviewer's model governs the whole checking layer" work on OpenCode, which has NO native cross-agent model inheritance, with the PM's choice surviving a template bump.
- **(C)** rewrite the `### Review typology` engine-selection rule after `ultra` is removed entirely.

I have read the plan, the full wb skill + all 11 references, `workflow/review-typology.md`, `workflow/roster.md`, `src/commands/pm-audit.body.md`, the OpenCode adapter (`adapter.json`, `gen/generate.py` harness_local mechanism, the current `code-review.{body,fm}`, `opencode.json`), the README review section, and the backlog item "Per-agent model configuration + survive-template-bump".

This is a structural-choice change with multiple plausible homes for each mechanism — the arch gate applies. Piece (C) is the **one cross-harness piece** (it edits shared `workflow/*.md` + `src/commands/` → `.claude/` golden must be re-frozen); (A), (B) are OpenCode-only.

## Adjacent implementations

1. **Current OpenCode `code-review` engine** at `src/manifests/opencode/harness_local/body/code-review.body.md` (≈40 lines, ≈3.5 KB) — a thin single-agent generic pass: get the diff, two dimensions (correctness bugs, reuse/simplification), flat findings list, no severity grammar, no plan-compliance, no verdict. This is the file (A) replaces — same generation slot (`harness_local_agents`), new body. Its frontmatter (`code-review.fm`) is the model-pin host (relevant to B).

2. **The wb `code-review-orchestrator` skill** (`.ai-pm/tmp/wb-review-refs/`) — the compression *source*. Dispatch axis: one subagent per aspect (10 aspects) spawned in parallel (Step 3), a coordinator/judge pass (Step 4) that dedups/re-categorizes/filters/re-rates across subagents, then one consolidated report (Step 5) with a verdict rubric. Per-aspect logic lives in `shared-reviewer-rules.md` (severity + output + global do-not-flag) + 11 briefs. The load-bearing discipline to preserve is in `shared-reviewer-rules.md` + the Step-4 judge rules + the Step-5 report shape + the verdict rubric — NOT in the fan-out mechanics.

3. **The Claude cross-model mechanism** (`### Cross-model review` in `workflow/review-typology.md` + `.ai-pm/review-config.md`) — the *runtime* model-pinned-subagent path. Relevant to (B) as the **divergent precedent**: Claude pins a subagent's model at spawn time from a config file read fresh each review; OpenCode cannot (PR #17577 closed-not-merged — no runtime per-task override), so OpenCode pins **statically in frontmatter at generation time**. (B) must reconcile "static generation-time pin" with "survives a template bump (regenerated)".

4. **The generator model-injection path** (`gen/generate.py:175-291`, `adapter.json` `models` block) — `inject_model_pin` / `inject_variant` insert `model:`/`variant:` lines into each `control_agents` member's frontmatter from the single-source `models` block. This is the existing single-source-but-bump-fragile mechanism (B) must retire or rework: `control`/`control_variant`/`control_agents` are exactly the Slice-9 keys the plan piece 5 removes.

## Behavioral risks in this area

This is config + prose generation, not event-driven runtime code, so there is no subscription/feedback-loop class. The behavioral risks are:

- **Model-resolution risk (B).** Whether a checking agent spawned as a Task by the orchestrator actually *resolves* to the intended model is the one fact that needs a runtime confirm (see "Residual risk"). The spike verified `agent.<id>.{model,variant}` in `opencode.json` IS applied to that agent and that an unpinned `mode:all`/subagent inherits the session — but the resolution *for a task-spawned checking agent under the orchestrator* is the specific path to confirm.
- **Discipline-loss risk (A).** Compressing the fan-out away risks silently dropping the judge-pass discipline (dedup, confidence-weighted reasonableness filter, plan-compliance-never-softened). The design below keeps these as explicit single-agent self-discipline steps so the compression is lossless on judgement, lossy only on orchestration.
- **Golden-drift risk (C).** (C) touches shared prose that both harnesses generate from; forgetting the `.claude/` golden re-freeze is a self-inflicted generator-test failure.

---

## (A) Compression: multi-agent orchestrator → one single-pass reviewer at ~¼ size

### Design

One subagent reads the diff ONCE and reports ALL aspects in the shared structured findings format. The fan-out collapses into a single agent's internal pass; the coordinator/judge pass collapses into that same agent's self-discipline (it has all findings in one context, so cross-subagent dedup is unnecessary, but the *judgement* the judge applied is kept as explicit instructions).

**Size target.** The source is ≈60 KB (SKILL 17.6 KB + 11 refs ≈42 KB). The new body targets **~¼ of the SKILL.md** the plan anchors on (≈4–5 KB, ≈120–160 lines) — a real upgrade over today's ≈3.5 KB thin body, far under the 60 KB source. This is achievable because most of the source bulk is fan-out plumbing and per-aspect prose that distils to 1–3 "flag / don't-flag" lines each.

**What to KEEP near-verbatim (the load-bearing contracts — do NOT paraphrase loosely):**

- **Severity definitions** — exactly `critical` / `warning` / `suggestion` with the wb definitions (critical = outage/data-loss/exploitable, blocks; warning = concrete measurable risk; suggestion = genuine improvement, non-blocking; "unlikely preconditions ⇒ at most suggestion"). Keep `confidence` ∈ high/medium/low with the wb meaning (high = verified by reading surrounding code; low = filtered aggressively).
- **The structured `<finding>` output block** — severity / confidence / aspect / file / lines / title / detail / fix. Keep verbatim; it is the machine-readable contract the orchestrator's downstream triage (review-history dedup, deployment-context triage) expects.
- **The consolidated report shape (Step 5)** — `## Code review — <scope>`, `**Verdict:**`, then `### Critical` / `### Warnings` / `### Suggestions` / `### Test coverage` / `### Plan compliance` / `### Out-of-scope changes` / `### Architecture & design (forward-looking, non-blocking)`. Keep the per-finding entry format and the architecture-proposal options-preserved format.
- **The verdict rubric table** — the full mapping, including the absolute "any plan-compliance deviation ⇒ Request changes / never Approve" row.
- **The "anchor to changed lines, read surrounding code first" mandate** and the **global do-not-flag list** (theoretical risks, defense-in-depth when primary is adequate, unchanged-code issues, unadopted-library preferences, linter-governed style, restating/praising).

**What to INLINE compactly (the 10 aspect briefs → one "review for ALL of these aspects" checklist).** Distil each brief to its essential "what to flag / what NOT to flag" couplet — one tight bullet per aspect, not the full brief. Concretely:

- **plan-compliance** — *if a `docs/<topic>_plan.md` exists*: every deviation (not-implemented / partial / out-of-scope hunk) is `critical` and blocks; emit the `<plan-item …>` checklist; the only resolution is updating the plan + re-running. *If no plan*: skip this aspect entirely. (Keep this one the fullest — it is the one HARD blocker.)
- **security** — injection / authz-bypass / secrets (every diff) / weak crypto / missing validation at trust boundaries / sensitive-data exposure. Don't flag theoretical attacks needing prior compromise or upstream-validated inputs.
- **stability** — "compiles, passes tests, still wrong": off-by-one, inverted conditions, unhandled errors, null deref, concurrency/races, resource leaks, missing timeouts, unbounded growth, perf at realistic scale, observability gaps. Trace the critical path. Don't flag impossible paths or micro-opts.
- **regressions** — changed signatures/return/error behavior, altered defaults/config, public-API/contract breaks, shared-helper semantic changes, modified existing tests masking a regression. Grep callers.
- **test-coverage** — new/changed non-trivial logic without a test driving each branch; assert-quality (a test that asserts nothing ≠ coverage); bug-fix without a reproducing regression test. First-class, raise even if all else is clean.
- **conventions** — wrong layer/boundary, reimplementing a project helper, naming/placement divergence, violating a documented `CLAUDE.md`/`AGENTS.md` rule. Only against a *documented* or *consistently-existing* pattern.
- **simplification** — over-complex logic with a simpler equivalent, redundancy, heavyweight dep for trivial use, reinventing stdlib, redundant/excessive tests. Usually `suggestion`. Simpler must be genuinely better.
- **documentation** — code vs docstring/README/API-spec disagreement, new public surface undocumented, stale comments, commit/PR rationale hygiene. Point at both code and doc location.
- **architecture** — forward-looking `<proposal>` blocks (options + pros/cons + recommendation), MAY read beyond the diff, does NOT block the verdict (unless the architecture is actively causing a defect in *this* change — then that defect is also a normal finding). Be selective; most changes need none.

**Risk-tier sizing → single-agent internal effort (not a fan-out).** Keep the Trivial / Lite / Full *judgement* but collapse it to how hard the one agent works, not how many agents spawn:
- The agent computes changed-lines + file-count + whether any path is security/system/critical-sensitive.
- **Trivial** (≤10 lines, ≤20 files, no sensitive path) → a light pass: stability + conventions, skim the rest.
- **Lite** (≤100 lines, ≤20 files, no sensitive path) → stability, conventions, test-coverage, simplification.
- **Full** (>100 lines OR >50 files OR *any* security/system/critical path) → all aspects incl. security + architecture.
- **Plan-compliance is added on top of any tier whenever a plan exists — never skipped for cost.**
- **When in doubt, escalate a tier.** (One agent, so "escalate" = spend more reading, not spawn more agents.)

**The judge discipline as single-agent self-discipline (Step 4 collapsed).** The one agent, having produced candidate findings across aspects in one context, applies before writing the report:
- **Reasonableness filter** — drop speculative risks, nitpicks, unadopted-style opinions; low-confidence findings must be verified by reading source before they survive.
- **Re-rate severity** against the definitions; a `critical` needing unlikely preconditions becomes `warning` or is dropped.
- **Plan-compliance exempt from softening** — verify each deviation is real, then keep it `critical`; never downgrade.
- **Coverage of new code checked explicitly** — untested new logic is a finding even if all else is clean.
- **Architecture proposals handled separately** — validate by reading code, preserve options, do NOT collapse to one recommendation, do NOT let them change the verdict (except the active-defect case).
- **Dedup is mostly unnecessary** (single context, single pass) but keep one line: "if the same underlying issue fits two aspects, report it once in the best-fit section at the highest applicable severity."

**What to DROP entirely:**
- Step 3 fan-out / parallel-subagent-spawn mechanics and per-subagent prompt assembly (`<shared-rules> + <brief> + <shared context> + <task>`).
- The cross-subagent dedup framing of Step 4 (a single agent has no separate reviewers to reconcile).
- The "if subagents unavailable, run sequentially" fallback (moot — this *is* the single-agent form).
- The Step-1 shared-context note written "so reviewers don't each re-derive it" (one agent derives once).
- The `code-review-orchestrator help` usage block, the SKILL frontmatter (`name`/`description` for skill discovery), and the project-rules aspect as a *separate* reviewer — fold project-rules into conventions (the wb project-rules brief is Python/`project-rules.md`-specific; the compact reviewer keeps its essence under conventions as "violating a documented project rule" and does not ship the full machine-rule list). Keep the noise-filter step (lockfiles, vendored, minified, generated; keep migrations) as a one-line "ignore generated/vendored noise" instruction.

**Neutral-prose constraint.** This body is an OpenCode-local engine body under `src/manifests/opencode/harness_local/body/` — it MAY name OpenCode mechanics (it already does: "running on OpenCode", `read`/`grep`/`glob`/bash tool names). Keep it clean — no Claude primitives, no cross-harness leakage — but it is exempt from the harness-neutral-noun rule that governs shared `workflow/*.md`. The shared-prose changes in (C) MUST stay neutral.

### Trade-offs

- **One pass vs fan-out.** Pro: cheaper (one agent, one diff read), no coordinator overhead, the OpenCode cost profile the plan wants, and the single context means no cross-subagent reconciliation. Con: one agent juggling 9 aspects may go shallower per aspect than a dedicated per-aspect agent — mitigated by the explicit per-aspect checklist + the risk-tier effort sizing (Full forces depth on sensitive diffs). This is the PM-accepted trade ("сократив раза в 4, под одним агентом") — the compact form is explicitly a real upgrade over today's thin body, not a replica of the heavy original (which stays the preferred whole-codebase engine when installed).

### Files that change (A)

- **Rewrite** `src/manifests/opencode/harness_local/body/code-review.body.md` (the new compact one-pass body). OpenCode-only — Claude keeps its built-in.
- **No** change to `code-review.fm` *for (A)* (frontmatter shape is unchanged by the body rewrite; the model line is (B)'s concern).
- **Test:** `oc-compact-reviewer` (plan test plan) — the generated `.opencode/agent/code-review.md` is the single-pass reviewer, covers the aspect set, no fan-out; guarded-skip runtime load check.

### Recommendation (A)

Single variant — it is forced by the plan ("ONE subagent doing all aspects in a single pass"). The only real design freedom is *how* to collapse the judge pass; the recommendation above (keep the judgement as explicit self-discipline steps, drop only the orchestration plumbing) is the lossless-on-judgement choice. No meaningful second variant.

---

## (B) Control-layer model mechanism (OpenCode only)

### The requirement (restated)

The checking agents = the compact reviewer (`code-review`), `pm-auditor`, `pm-plan-checker`, `pm-product-advocate`. When a reviewer model IS set → all four run on it; when unset → all four run on the session model. The PM's choice must be **one place** and **survive a template bump** (so it lives in the PM's own config layer, not the regenerated template).

### The tension (worked honestly)

Two native OpenCode levers, each half-right:

- **Generator single-source pin** (today's `models.control` + `control_agents` → `inject_model_pin` into each agent's frontmatter). Pro: literally one value drives all four. Con: it lives in `adapter.json` — **protocol-template surface**, regenerated on every bump, and editing it edits the template (the exact bump-fragility the backlog item names as load-bearing). Fails "survives a bump".
- **Personal-config `agent.<id>.{model,variant}`** in the PM's own `opencode.json` (spike-verified applied). Pro: survives a bump (the generator never overwrites the PM's `opencode.json` keys it doesn't own — it only substitutes `__SESSION_MODEL__` into `model`). Con: it is **per-agent** — four `agent.<id>` entries, not one knob. There is NO native "set the model for this set of agents in one line" and NO native cross-agent inheritance (PR #17577 closed-not-merged).

So "literally one line for all four, bump-surviving, native" is **not achievable** on OpenCode 1.16.2. Be honest about that and pick the closest robust option.

### The recommended scheme: ship NO pin + a documented one-block personal-config pattern

1. **Generator ships NO per-agent model pin (plan piece 5).** Remove `control` / `control_variant` / `control_agents` from `adapter.json`'s `models` block (keep only `session`, which substitutes into `opencode.json`'s top-level `model`). Retire `inject_model_pin` / `inject_variant` usage (the functions may stay dormant or be removed — coder's call; removing them is cleaner). Result: **every agent inherits the session model by default** — the "unset → session" half of the requirement is satisfied with zero config, and there are no baked per-agent pins to clobber on a bump.

2. **The "reviewer model IS set" half = a documented one-block pattern the PM pastes once into their OWN `opencode.json`.** Ship the canonical block in docs (not as a generated default), e.g.:

   ```jsonc
   // in YOUR opencode.json (survives a template bump — the generator never
   // touches keys it doesn't own). Set the control layer to one model:
   "agent": {
     "code-review":         { "model": "<your-reviewer-model>" },
     "pm-auditor":          { "model": "<your-reviewer-model>" },
     "pm-plan-checker":     { "model": "<your-reviewer-model>" },
     "pm-product-advocate": { "model": "<your-reviewer-model>" }
   }
   ```

   This is FOUR lines, not one — but it is the **closest-to-one-knob** option that is bump-surviving and native: it lives entirely in the PM's config layer, the generator never regenerates it, and it is a single contiguous block with one value repeated (the PM changes one model string, pasted four times, or uses an editor multi-cursor). When the block is absent, all four inherit the session — exactly the "unset → session" default.

3. **Document it as the single home.** The pattern + its rationale ("one model string, the four checking agents, survives a bump because it's your config not the template") goes in `doc/stack-notes.md` (spike facts → `execution-verified`) and is referenced from the OpenCode adapter `_comment` / a short `AGENTS.md` line per the plan's "Docs to update". This is the **reviewer/control-layer slice** of the backlog item "Per-agent model configuration + survive-template-bump" — explicitly call that out (the backlog item's load-bearing requirement (2) "the choice must survive a bump" is satisfied here by the override living in the PM's own `opencode.json`; the general per-agent framework stays parked).

### Alternatives considered (and why not)

- **Keep a generator default pin + document the override.** Rejected: the plan piece 5 explicitly retires the baked pins ("no per-agent baked pins"), and a shipped pin in the template is the bump-fragile thing the backlog item warns against. Shipping NO pin is strictly cleaner — the default *is* session, with nothing to clobber.
- **A protocol-owned config file (like Claude's `.ai-pm/review-config.md`) read at generation/spawn.** Rejected for OpenCode: there is no runtime per-task model override (#17577), so the protocol cannot read a config file and pin a model at spawn the way Claude does. The static-frontmatter route would re-introduce template editing. The personal-`opencode.json` route is the only bump-surviving native path.
- **A `variant`-only control (effort tiering without a model change).** Out of scope here — Slice-9 `control_variant` is retired with the pins; if the PM later wants per-agent effort, the same `agent.<id>.{variant}` personal-config pattern applies (noted for the backlog item, not built).

### Files that change (B)

- `src/manifests/opencode/adapter.json` — remove `control` / `control_variant` / `control_agents` from `models` (keep `session`); update the `_comment` to describe the new "no baked pins, personal-config override" model. (Owned-surface edit by the coder, not me.)
- `gen/generate.py` — stop injecting pins into the four agents (the `if name in control_agents` branches at ~251 and ~284 become inert once `control_agents` is empty; the coder may remove the now-dead `control_model`/`control_variant`/`inject_*` paths).
- `src/manifests/opencode/harness_local/frontmatter/code-review.fm` — drop the "this is a CONTROL agent, model injected" comment + expectation (no model line injected anymore).
- `doc/stack-notes.md` — record the spike facts + the personal-config override pattern as the documented single home.
- **Tests:** `oc-single-model-default` (no baked per-agent pins; `models` has no `control*` keys), `oc-control-layer-model` (the four checking agents resolve to the reviewer model when the personal-config block is present, else session — driven off the documented single source; guarded-skip runtime check).

### Recommendation (B)

**Ship no pin (all default to session) + the documented four-line personal-config block as the single override home, tied to the backlog item.** It is the closest robust option to "one knob, bump-surviving" that OpenCode 1.16.2 supports natively. State plainly in the docs that it is four lines, not one, because OpenCode has no native cross-agent model set — do not over-promise "one line".

---

## (C) Engine-selection rewrite after ultra removal

### Design (neutral prose)

Rewrite the **Engine selection** paragraph of `### Review typology` in `workflow/review-typology.md` to the post-ultra rule, stated once, harness-neutral:

- **per-diff Pass-2** → the compact reviewer on OpenCode / the built-in `/code-review` on Claude. (Neutral framing: "the per-diff review runs on the harness's per-diff review engine — the protocol-shipped compact reviewer where the harness has no built-in, the built-in `code-review` engine where it does." Never auto-route a per-diff to the whole-project orchestrator — unchanged routing discipline.)
- **whole-codebase sweep** → `wb-development:code-review-orchestrator` when installed (and `WB_REVIEW_ORCHESTRATOR` not `off`); **else the compact reviewer run over the whole tree** (NOT `/code-review ultra`). On Claude with no orchestrator, the fallback is the built-in `code-review` over the whole tree — the neutral noun is "the per-diff review engine run over the whole tree", which resolves to the compact reviewer on OpenCode and the built-in on Claude.
- **`ultra` removed entirely** — it is absent on OpenCode and clunky on Claude. Every mention as a *review level* is deleted.

This forces a companion edit in **`### Cross-model review`** (same file): the model-pinnability prose currently leans on `ultra` as "the one non-pinnable path" (the cloud exception). With `ultra` gone, the no-orchestrator full-sweep is a single pinnable path (the compact reviewer / built-in over the whole tree), so the "offer (a) ultra vs (b) built-in" structured-question fork **collapses to one branch** — the pinnable whole-tree reviewer. Remove the `ultra` option and the "ultra picks its own models / one non-pinnable path" carve-outs from `### Cross-model review` and from the per-review announce list. (This is in-scope: it is the same `ultra`-removal, and leaving the carve-out dangling would be a self-inflicted inconsistency.)

### Single-source-by-name discipline (unchanged)

`pm-audit.body.md` **references** `### Review typology` by name and re-encodes neither the type list nor the engine rule. So in `src/commands/pm-audit.body.md`:
- `## Technical quality` step intro: change the fallback wording from "fall back to the built-in `/code-review` skill at the selected depth (`ultra` for a deep/first/legacy sweep)" to "fall back to the compact reviewer / built-in `code-review` run over the whole tree at the selected depth" — keep it as a *reference* to the typology rule, do not re-encode the engine list.
- The no-orchestrator structured-question offer (currently "(a) `/code-review ultra` … (b) built-in over the whole codebase") **collapses to the single pinnable whole-tree path** — drop option (a). Same change mirrors the `### Cross-model review` collapse above.
- Step 3 depth list: remove `ultra` from the selectable depths (`low / medium / high / max`), and from the interactive offer wording ("deep (`high`/`max`, 10-15 min)").
- The `## pm-audit` command-surface line that mentions "optional `code-review ultra`" (the `## Full scope offered …` line) → drop `ultra`.

### roster.md

`workflow/roster.md` line ~32: "Use `ultra` level for deep multi-agent review (a Claude-only path)" → remove the `ultra` sentence; restate the engine line neutrally ("`code-review` … full technical-quality sweep; runs as Pass 2 after every feature and as the optional deep sweep after `/pm-audit`"). Line ~29 (`/pm-audit` description "optional `code-review ultra`") → drop `ultra`.

### README.md

`### Выбор движка ревью` (line ~73, Russian — README is the marketing-level Russian doc, conversation-language, not on-disk-English-canon): update the fallback sentence — `при его отсутствии откатывается на встроенный /code-review ultra` → the compact reviewer / built-in over the whole tree (no `ultra`). Keep it in Russian (README's established language); this is a prose-edit, not a canon-language change.

### Cross-harness flag (load-bearing)

(C) is the **one cross-harness piece**: it edits shared `workflow/review-typology.md`, `workflow/roster.md`, and `src/commands/pm-audit.body.md` — all of which generate into BOTH adapters. The Claude self-host is byte-identical EXCEPT this ultra-removal prose, so **the `.claude/` golden MUST be re-frozen** (`tests/generator.sh`). Flag this explicitly to the coder: pieces (A), (B) are OpenCode-only and do not touch the golden; piece (C) does. Add the `ultra-absent` clean-grep test (no `ultra` as a review level in `workflow/`, `src/commands/`, `README.md`, `.claude/` + the golden).

### Files that change (C)

- `workflow/review-typology.md` — Engine-selection rewrite + the `### Cross-model review` ultra-carve-out removal + per-review-announce ultra-case removal.
- `workflow/roster.md` — engine line + `/pm-audit` description, ultra removed.
- `src/commands/pm-audit.body.md` → regenerated `.claude/commands/pm-audit.md` — fallback rewrite, the no-orchestrator offer collapses, depth list, ultra removed.
- `README.md` — `### Выбор движка ревью` fallback sentence.
- `.claude/` golden — re-frozen (generator output for the shared prose).
- **Test:** `ultra-absent` clean-grep.

### Recommendation (C)

Single variant — the rewrite is mechanical once "ultra is gone and the per-diff/fallback engines are the compact reviewer / built-in". The one judgement call is whether the `### Cross-model review` ultra-carve-out removal is in-scope: **it is** (same removal; a dangling "ultra is the non-pinnable path" line after deleting ultra is an inconsistency). Keep all engine prose **harness-neutral** (the compact reviewer is named as "the protocol-shipped per-diff/whole-tree review engine" in shared prose, never as an OpenCode primitive).

---

## Slicing (build order)

1. **(A) compact reviewer body — independent, OpenCode-only, no golden.** Build + test (`oc-compact-reviewer`) first. It is self-contained (one body file + its test) and unblocks the per-diff engine immediately. No dependency on (B) or (C).
2. **(B) control-layer model — independent, OpenCode-only, no golden.** Build in parallel with or after (A): remove the `control*` keys + pins, ship the documented personal-config block, tests `oc-single-model-default` + `oc-control-layer-model` + `oc-builtins-hidden`/`oc-single-model-default` (the build/plan-disable + single-default pieces 5 ride here). Depends on (A) only insofar as both rewrite parts of the OpenCode adapter — no logical coupling; can land in either order.
3. **(C) ultra removal + engine-selection rewrite — LAST, cross-harness, golden re-freeze.** Build last because it touches shared prose and forces the `.claude/` golden re-freeze + `ultra-absent` grep. Doing it last means (A)/(B)'s OpenCode-only changes are already settled, so the golden re-freeze captures one consistent state. (C) references the engines (A) ships, so the engine prose should describe the compact reviewer that already exists.

**Independent:** (A) and (B) are mutually independent (both OpenCode-only, no golden). **Sequenced:** (C) last (cross-harness, golden). The mechanical piece-5 bits (build/plan disable, single session default) ride with (B) since they all edit the OpenCode `models`/`opencode.json` surface.

---

## Residual risk needing a runtime confirm

- **(B) model resolution for a task-spawned checking agent (the load-bearing confirm).** The spike verified that `agent.<id>.{model,variant}` in `opencode.json` IS applied to that agent and that an unpinned subagent inherits the session. What is NOT yet verified end-to-end is that **a checking agent spawned as a Task by the orchestrator** (e.g. `pm-plan-checker` invoked mid-pipeline, or `code-review` as the per-diff engine) actually *resolves* to the personal-config `agent.<id>.model` at spawn — versus the orchestrator's own model, or the session. Mark this **to-verify, not asserted** (the same spike-gate discipline `### Cross-model review` already applies to the orchestrator-fan-out caveat): the `oc-control-layer-model` test should include a **guarded-skip runtime load check** that confirms the resolved model for a task-spawned checking agent, and until that passes, any announce/doc must reflect only what is actually confirmed (the config key is applied to the agent id) — never a blanket "all four checking agents are on the reviewer model" if the task-spawn path is unconfirmed.
- **(A) per-aspect depth under one agent.** Lower-confidence: whether one agent covers all 9 aspects as deeply as the fan-out on a large/sensitive diff. Mitigated by the risk-tier effort sizing (Full forces depth) and by the heavy wb orchestrator staying the preferred whole-codebase engine when installed. Not a hard gate — a quality observation to watch in the first real reviews, not a blocker.

## No escalation needed

Every fork here is derivable from the plan (PM-agreed design) + the spike facts + the cited canon — no undecidable product call. (A) is forced single-variant; (B)'s "four lines, not one" is the honest native ceiling, recommended explicitly and tied to the backlog item; (C) is mechanical with one in-scope judgement (the cross-model ultra-carve-out removal) resolved above. Nothing requires a PM product call before coding.
