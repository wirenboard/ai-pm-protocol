# automode — design notes

> Re-reviewed 2026-06-04 against the PM-revised plan. Four design changes since the prior
> note: (1) the authority **value** moved from a `CLAUDE.md` line to a dedicated
> `.ai-pm/decision-authority.md` (the semantics stay single-sourced in `WORKFLOW.md`);
> (2) two explicit scopes, one engine; (3) announce-before-act + an **advisory, unenforced**
> `veto-window-seconds`; (4) bootstrap now asks the authority question and writes the file.
> Variants and recommendation updated below.

## Context

The plan adds a **decision-authority mode** (`autonomous | interactive`, default interactive)
that, when `autonomous`, redirects `pm-product-advocate`'s existing gap output through a
*derive-from-cited-canon-or-escalate* gate instead of blanket-relaying every gap to the PM.
The plan's WHAT/WHY is settled by research + the PM forks (10 scenarios, graded/capped,
announce-then-proceed, merge-stays-manual). This note resolves only the **structural placement**
questions the spawn names: where the authority **value** lives vs where its **semantics** live,
whether the two scopes share one engine, the back-compat surface, the shape of the citation
guard, and — new in this revision — whether the advisory veto window is an honest v1.

This is a protocol-spec change in the template repo (no-user-facing-contract exception;
dev-docs in `doc/`). There is no runtime, no shared mutable state, no concurrency — the only
"interactions" are with adjacent **protocol mechanisms** that share the Step 3.5 pipeline or
read the advocate's `## Resolutions` trail. So the usual event-subscription / feedback-loop
analysis (Section B step 2) is N/A; in its place the relevant analysis is *which existing
single-source + owner-split + soft-enforcement precedents this feature must structurally match,
and where this revision deliberately departs from one of them.*

Three precedents are load-bearing and recur below. This feature does not introduce a new family
member — it is a **rider on the already-shipped `pm-product-advocate` family member** (`doc/architecture.md`
"pm-product-advocate: an independent product-axis referee", v-current), and inherits its discipline wholesale:

- **Single-source-of-conditions, referenced by name** — `### Project kind`, `### Security-relevant
  surfaces`, `### Foundational product questions`, `### Pending-migration detection`. Each owns its
  enum + load-bearing default **once** in a protocol-root `.md` (`WORKFLOW.md` / `MIGRATIONS.md`),
  referenced by name from every consumer, never re-encoded. The home for the **semantics** is a
  protocol-root file and **not** `doc/<name>.md` — the `doc/`-vs-`docs/` resolution trap recorded
  in the migrations decision (a `doc/` path resolves in this repo but a downstream reads it at
  `.ai-pm/tooling/`). **This revision keeps the semantics there and moves only the VALUE out** — see
  the value-vs-semantics split below.
- **The advocate is a pure presence-referee (player/referee independence).** `pm-product-advocate`
  reports *which foundational questions have no recorded answer* — presence, never meaning; it never
  addresses the PM and never judges an answer. The orchestrator is the player that both elicits and
  drives toward coding; the advocate is the separate role/context/prompt that breaks that self-check.
  Any redirect logic that taught the advocate to *resolve* a gap would collapse that independence.
- **Soft enforcement, no `PreToolUse` hook; gates key on a loud positive marker.** "Is this gap
  derivable from canon" is a semantic judgement a regex cannot make — the same shape that made the
  threat-model, blast-radius, and advocate decisions all reject a hook. Enforcement is prose at the
  gated Step 3.5 + a presence-keyed backstop at `pm-plan-checker` DoD and `pm-auditor` dimension 1,
  exactly the advocate's two existing backstops.

## The value-vs-semantics split (the central change this revision introduces)

The prior note placed the per-project value as a `## Decision authority: interactive` line in
downstream `CLAUDE.md`, mirroring `### Project kind` byte-for-byte. The PM revised this: the
**semantics stay** single-sourced in `### Decision authority` (`WORKFLOW.md`) — enum + the
`absent file OR unrecognized ⇒ interactive` default, referenced by name, never re-encoded — but the
**value** (`mode:` + `veto-window-seconds:`) moves to a dedicated `.ai-pm/decision-authority.md`.

This is **not** a departure from the single-source precedent; it is a refinement that separates two
things `### Project kind` happens to co-locate:

| Datum | `### Project kind` | `### Decision authority` (revised) |
|---|---|---|
| **Semantics** (enum + default) | `WORKFLOW.md` subsection | `WORKFLOW.md` subsection (unchanged) |
| **Per-project value** | `## Project kind:` line in `CLAUDE.md` | `.ai-pm/decision-authority.md` (dedicated) |
| **Lifecycle of the value** | set once at bootstrap, ~never changed | PM-flippable mid-flight, edited repeatedly |

The lifecycle column is the whole justification, and it holds:

- **Project-kind is set-once.** It is written at bootstrap and effectively never edited again; living
  as one line among many in `CLAUDE.md` is fine because nothing routinely rewrites `CLAUDE.md` around it.
- **Authority is a PM-flippable toggle** (plan Scenario 7: "change authority mid-flight"). A value the
  PM is *expected* to flip repeatedly, buried as one line in a frequently-edited multi-purpose file, is
  exactly the clobber surface the PM flagged — an unrelated `CLAUDE.md` edit (or an agent that rewrites a
  CLAUDE.md section) can silently drop the line, and `absent ⇒ interactive` means a dropped line **fails
  silently to the safe default** with no error. A dedicated single-purpose file isolates the toggle so
  a clobber is far less likely and, if it happens, is visible as a missing file rather than a missing line.

So the divergence from the `CLAUDE.md`-line precedent is **principled, not incidental**: different
lifecycle ⇒ different home for the value, while the semantics stay in the proven single-source subsection.

**The `.ai-pm/decision-authority.md` home does NOT re-open the `doc/`-vs-`docs/` trap.** That trap is
specific to `doc/<name>.md` spec files (resolve here, read at `.ai-pm/tooling/` downstream). `.ai-pm/`
paths are read **natively** in both contexts — `WORKFLOW.md` already places live machine state at
`.ai-pm/state/current.md` and `.ai-pm/contracts/`, both consumed downstream with no rewrite. A value
file under `.ai-pm/` is the same shape as `.ai-pm/state/current.md`, not the same shape as a `doc/` spec.
This single fact is what flips the prior note's case against a dedicated file (see Variant B).

## Adjacent implementations

1. **`### Project kind`** (`WORKFLOW.md` L213–226) — the single-source-**subsection** shape to mirror for
   the *semantics*. One subsection owns the enum (`software | documentation`) + the load-bearing `absent OR
   unrecognized ⇒ software` default; the closing paragraph (L226) names every consumer and states they
   reference it **by name** and **never re-encode the enum or the default**. `### Decision authority` mirrors
   this for its enum + `absent file OR unrecognized ⇒ interactive` default. **Where it deliberately differs:**
   project-kind's *value* is a `CLAUDE.md` line; authority's *value* is the dedicated `.ai-pm/decision-authority.md`
   (lifecycle rationale above).

2. **`.ai-pm/state/current.md` and `.ai-pm/contracts/`** (`WORKFLOW.md` L300–306) — the home-shape `.ai-pm/decision-authority.md`
   actually mirrors: a small machine-read file under `.ai-pm/`, owned by the orchestrator, read natively
   downstream (no `doc/`-vs-`docs/` trap), updated over a project's life. This is the precedent that makes a
   dedicated value file the *right* call, not a smell.

3. **`pm-product-advocate` Step 3.5 gate** (`WORKFLOW.md` L117–124) — the seam being redirected. The advocate
   emits `clean` (silent pass) or `gaps: N`; the *orchestrator* relays all N in one `AskUserQuestion` and
   records each as a numbered `## Resolutions` entry (the Edit-ownership second carve-out — trail is
   orchestrator-owned). The advocate owns through `## Verdict`; it does not write the trail. This is the
   precise insertion point: today the orchestrator blanket-relays; automode inserts a per-gap derivability
   test *before* the relay, so only the escalation subset reaches the one `AskUserQuestion`.

4. **The advocate's two backstops** (`pm-plan-checker` DoD + `pm-auditor` dimension 1) — both already
   presence-key on the *same greppable verdict token*: `clean`, or `gaps: N` with N `## Resolutions` entries.
   The citation guard is strictly additive to this existing count-check: on an `auto`-marked entry, also
   assert a citation token is present. It rides the artifact the backstops already read; it adds no new
   artifact and no new gate.

## Two scopes, one engine (spawn question 2)

The revision names two explicit entry points:

- **Project-wide** — `.ai-pm/decision-authority.md` `mode: autonomous`.
- **Per-feature** — the plan's `Decision authority: autonomous` line on an otherwise-interactive project.

These are two **reads of the effective-authority value**, not two engines. Both resolve to the same
boolean ("is this fork's effective authority autonomous?") via the resolution order, and from there both
feed the **single** Step 3.5 announce → derivability-test → auto-resolve-or-escalate path. The per-feature
override is simply the top of the resolution order; the project value is the next rung; `interactive` is
the floor. There is no second copy of the derive-or-escalate logic and there must not be — a duplicated
engine would drift. **Confirmed: one engine, two entry points** — and the structural way to keep it one is
that the only scope-dependent step is *computing the effective-authority value*; everything downstream of
that value is scope-agnostic. The plan honors this (Scenario 1 and 2 both say "same engine").

**Effective-authority order (confirmed):** per-feature plan `Decision authority:` line → `.ai-pm/decision-authority.md` `mode:` → `interactive`. An absent file OR unrecognized value ⇒ `interactive` (back-compat: every existing downstream behaves exactly as today; the machinery is dormant unless `autonomous` is explicitly declared; no migration).

## Announce-before-act + the advisory veto window — is this an honest v1? (spawn question 3)

**Yes — with one wording risk to close.** The shape is: every autonomous decision is printed to console
(fork · chosen option · brief rationale · invariants) **before** acting; the orchestrator then proceeds;
the PM can interrupt (Esc) at any time. `veto-window-seconds` (default 15) is **recorded** as the intended
pause but is **not enforced** as a literal countdown in v1 — there is no Claude Code primitive that waits N
seconds for *optional* input (PM-confirmed), so a hard countdown is a future hook.

This is sound and does not over-promise *as a behavior*: announce-then-proceed + always-interruptible is a
real, deliverable v1, and "merge stays manual in both scopes" means the highest-stakes gate is never
auto-crossed regardless of the timer. The honest framing is **graded autonomy with a human-revocable
license**, which the announce + interrupt mechanism genuinely provides.

**The one structural risk this revision introduces is a NAMING/HONESTY gap, not a behavior gap.** A recorded
setting named `veto-window-seconds: 15` strongly *reads as* "the orchestrator pauses 15 seconds for a veto."
A future reader (or a downstream PM) will mistake the recorded number for an enforced countdown — the setting
**looks like a promise the v1 does not keep.** This is the field-named-for-a-behavior-it-doesn't-have antipattern.

Recommendation to the spec (this is the part to get right):

- **State the gap at the field's single source.** In `### Decision authority`, where `veto-window-seconds` is
  defined, say in one sentence: *"v1 records this value but does not enforce a literal countdown — autonomous
  decisions are announced and the orchestrator proceeds immediately, remaining interruptible at any time; the
  number is the intended pause for a future countdown hook."* The honesty must live at the **definition**, not
  only in an Out-of-scope bullet, so every consumer that reads the field also reads the caveat.
- **Make the name carry the caveat where it appears.** Prefer describing it as the *"intended/advisory veto
  window (recorded, not yet enforced)"* in prose, so the word "advisory" travels with the value. The plan
  already does this in Scenario 4 and the Out-of-scope bullet — the gap to close is ensuring the **`### Decision
  authority` single source itself** (the place every consumer references by name) carries the not-enforced
  caveat, not just the plan's narrative scenarios.
- **Do not phrase the announce line as a countdown.** The plan's announce template ends `(proceeding —
  interrupt to override)` — that wording is correct and honest (it says it is proceeding, not "waiting 15s").
  Keep it; never render the recorded seconds in the console line as if it were a live timer.

With those, the timer is an honestly-recorded-future-setting, not a phantom feature. I'd treat the
"caveat lives at the single source" point as **blocking** — it is the same class of risk as a re-encoded
default: a load-bearing fact stated only in a secondary place where a reader can miss it.

## Bootstrap now writes the file (spawn question 4)

Previously out of scope; now in scope: `/pm-bootstrap` asks one neutral question and writes
`.ai-pm/decision-authority.md` (`mode` + `veto-window-seconds: 15`) from the answer, referencing
`### Decision authority` by name and never re-encoding the default. Two structural notes:

- **Question neutrality is a real risk.** The bootstrap question must not steer the PM toward `autonomous`
  (the riskier, newer mode). The plan's wording — *"Who makes the product decisions on this project — you
  each time (interactive), or the pipeline from your bootstrap + project canon (autonomous)?"* with **default
  interactive** — is acceptably neutral: it presents both sides factually and defaults to the safe mode.
  Keep the default explicit so a PM who skips/abstains lands on `interactive`, matching `absent ⇒ interactive`.
  Recommend the bootstrap step also state the *cap* in one phrase (e.g. "merge always stays yours; you can flip
  this any time") so the PM is not choosing under the false impression that `autonomous` cedes the ship gate.
- **Bootstrap-writes-file ⇒ absent-file path still must hold for older projects.** Writing the file at bootstrap
  is additive: every *existing* downstream has no such file and must keep resolving to `interactive` with no
  migration. The plan confirms this (Scenario 5; "older bootstrap ⇒ no file ⇒ interactive"). The structural
  invariant: bootstrap creating the file for new projects must not introduce any consumer that *requires* the
  file to exist — every consumer still treats absence as `interactive`.

## Behavioral risks in this area

No runtime / event subscriptions (prose-spec feature). The one cross-artifact coupling is sequential within a
single feature's pipeline: advocate `gaps: N` → orchestrator derive-or-escalate → `## Resolutions` trail (now
`auto` | `escalated`-marked) → plan-checker/auditor presence-checks. The structural risks are protocol-coherence,
not concurrency:

- **Timer-honesty gap (NEW, dominant for this revision).** See spawn-question-3 section: `veto-window-seconds`
  reads as an enforced countdown but is recorded-only in v1. Countermeasure = the caveat at the single source.
- **Independence erosion.** If the derivability test were placed *in the advocate*, the advocate would stop
  being a pure presence-referee and start resolving — the orchestrator's player-role would leak into the
  referee. The redirect must live in the orchestrator's Step 3.5 handling; the advocate's prompt is byte-unchanged.
- **Two-scopes-two-engines drift (NEW).** If the per-feature and project-wide scopes each grew their own
  derive-or-escalate prose, they would drift. Countermeasure = the only scope-dependent step is computing the
  effective-authority value; everything after is scope-agnostic (one engine).
- **Confabulation from an under-specified baseline (research's named dominant risk).** An `auto` entry with no
  canon citation = a direction the baseline never implied. The citation-presence guard is the countermeasure;
  it must be a *shape* check (a `file`/`### section` token is present), never a *meaning* check.
- **Back-compat drift via a re-encoded default.** Any consumer that hard-codes `interactive` rather than
  referencing `### Decision authority` by name reintroduces the drift the single-source rule prevents — the
  same failure `### Project kind` (L226) calls out. The value moving to a file does **not** change this: the
  *default* is still single-sourced in the subsection; the file holds only the chosen value.
- **Required-file drift (NEW, from bootstrap-writes-file).** A consumer that assumes the file always exists
  would break every older downstream. Absence must stay safe and complete everywhere.

## Variant A: semantics in `### Decision authority` (`WORKFLOW.md`); value in dedicated `.ai-pm/decision-authority.md`; redirect in the orchestrator (revised plan's position)

- **Where the semantics live:** a new `### Decision authority` subsection in `WORKFLOW.md`, sibling to
  `### Project kind` / `### Security-relevant surfaces` / `### Foundational product questions`. It owns, once:
  the enum `autonomous | interactive`; the `absent file OR unrecognized ⇒ interactive` default; the per-feature
  plan override; the effective-authority resolution order (plan override → file `mode:` → `interactive`); the
  derivability test; the escalate-regardless cap (not-derivable / security-surface / PM-marked-irreversible);
  announce-before-act; **the `veto-window-seconds` definition WITH the not-enforced-in-v1 caveat**;
  merge-stays-manual (both scopes); and the `## Resolutions` `auto` | `escalated` markers + the `auto`-entry
  citation requirement.
- **Where the value lives:** the dedicated `.ai-pm/decision-authority.md` (`mode` + `veto-window-seconds`),
  written by `/pm-bootstrap`, edited by the PM mid-flight, read natively downstream (same shape as
  `.ai-pm/state/current.md`). Isolated so a stray `CLAUDE.md` edit cannot clobber it.
- **Where the redirect lives:** the **orchestrator's Step 3.5 handling** branches on effective authority.
  Advocate spawn + prompt byte-unchanged. The `interactive` branch (default, every existing project) is
  byte-identical to today. The `autonomous` branch runs the per-gap derive-or-escalate and relays only the
  escalation subset through the *same* one `AskUserQuestion`. **One engine, both scopes.**
- **Relation to adjacent:** symmetric with `### Project kind` on the *semantics* axis and with the advocate
  gate on the redirect axis; symmetric with `.ai-pm/state/current.md` on the *value-home* axis. The departure
  from `### Project kind`'s value home is principled (lifecycle), not a break.
- **Pros:** every consumer references the subsection by name — the proven single-source shape for the
  semantics, zero re-encoding. The value sits in a clobber-isolated, natively-read `.ai-pm/` file matched to
  its flip-often lifecycle. The autonomous path is **strictly additive** over a byte-unchanged interactive
  path. The advocate stays a pure presence-referee. No `doc/`-vs-`docs/` trap (`.ai-pm/` reads natively). No
  new agent, no new command, no migration.
- **Cons:** introduces one new on-disk file (`.ai-pm/decision-authority.md`) and one new bootstrap question —
  a slightly larger surface than the prior CLAUDE.md-line approach, justified by the clobber-safety and
  lifecycle argument. The `veto-window-seconds` field carries a documentation burden (the not-enforced caveat
  must travel with it).
- **Risks:** the timer-honesty gap (managed by the caveat-at-single-source rule above); the derivability test
  is judgement the orchestrator performs in prose (bounded by the citation guard + the escalate cap).

## Variant B: keep the value as a `## Decision authority:` line in `CLAUDE.md` (the prior note's position)

- **Where the value lives:** a `## Decision authority: interactive` line in downstream `CLAUDE.md`, carried by
  `CLAUDE.md.tmpl` — exactly mirroring `### Project kind`'s value home.
- **Relation to adjacent:** maximally symmetric with `### Project kind` — same value home, same `.tmpl` carry.
- **Pros:** one fewer on-disk file; one less bootstrap write target; the closest possible byte-for-byte
  parallel to the existing precedent (easiest to explain as "just like project kind").
- **Cons (decisive against, given the revision):** the value is a **flip-often toggle** living in a
  frequently-edited multi-purpose file. An unrelated `CLAUDE.md` edit (human or an agent that rewrites a
  section) can silently drop the line, and `absent ⇒ interactive` makes the drop **fail silently** — the PM
  thinks the project is autonomous; it has reverted to interactive with no signal. This is precisely the
  clobber surface the PM named. `### Project kind` tolerates the same home only because it is set-once and
  never re-touched; authority's lifecycle is the opposite. The marginal symmetry benefit is not worth a
  silent-revert hazard on the exact value the feature exists to let the PM toggle.
- **Risks:** silent authority reversion (the dominant risk) is intrinsic to this home, not incidental.

> Note: the prior note's Variant B (a standalone *spec* file + a *new gating agent*) is no longer the
> relevant alternative. That variant's two objections were (a) the `doc/`-vs-`docs/` trap and (b) a new
> agent re-creating the player/referee conflation. The revision's dedicated file is **not** a `doc/` spec
> file and is **not** a new agent — it is an `.ai-pm/` **value** file consumed by the unchanged orchestrator,
> so objection (a) does not apply (`.ai-pm/` reads natively) and objection (b) does not apply (no new agent;
> the redirect stays in the orchestrator). The live trade-off is now value-home-only: dedicated `.ai-pm/`
> file (Variant A) vs `CLAUDE.md` line (Variant B).

## Recommendation

**Variant A (the revised plan's position) — confirmed.** Splitting *semantics* (single-sourced in
`### Decision authority`, `WORKFLOW.md`, referenced by name) from *value* (the dedicated, clobber-isolated,
natively-read `.ai-pm/decision-authority.md`) is the right call: it preserves the proven single-source
discipline for the default while giving a flip-often toggle a home matched to its lifecycle — and crucially
the `.ai-pm/` home does **not** re-open the `doc/`-vs-`docs/` trap that argued against a dedicated file in the
prior note. The redirect stays in the orchestrator (advocate byte-unchanged, autonomous path strictly
additive, one engine for both scopes), and the citation guard rides the advocate's two existing presence-keyed
backstops as a shape-not-meaning check. Variant B's `CLAUDE.md`-line home is rejected for this revision: it
exposes a flip-often value to silent clobber-and-revert, the exact hazard the PM flagged.

**Answers to the four spawn questions:**

1. **Dedicated-file value home — confirmed, with the value/semantics split made explicit.** A dedicated
   `.ai-pm/decision-authority.md` is the right home for the *value* because authority's lifecycle (PM-flippable
   mid-flight) differs from project-kind's (set-once); a flip-often value buried in `CLAUDE.md` is the clobber
   surface the PM named, and `absent ⇒ interactive` makes a clobber a *silent* revert. The *semantics* (enum +
   default) stay single-sourced in `### Decision authority` exactly as `### Project kind` does — so this refines,
   not breaks, the precedent. The `.ai-pm/` home does not re-open the `doc/`-vs-`docs/` trap (`.ai-pm/state/current.md`
   sets the native-read precedent). Back-compat: absent file ⇒ interactive, no migration. Effective order:
   per-feature plan override → file `mode:` → interactive.

2. **One engine, two scopes — confirmed.** Project-wide (file `mode: autonomous`) and per-feature (plan line)
   are two reads of the effective-authority value, not two engines. The only scope-dependent step is computing
   that value; everything downstream (announce → derivability test → auto-resolve-or-escalate) is scope-agnostic
   and exists once. No duplicated logic; the per-feature override is just the top rung of the resolution order.

3. **Announce-then-proceed + always-interruptible, timer-as-recorded-setting — sound v1, with one wording fix
   required.** The behavior is honest and deliverable, and merge-stays-manual keeps the highest-stakes gate
   human in both scopes. The risk is a **naming/honesty gap**: `veto-window-seconds: 15` reads as an enforced
   countdown it is not. Fix (treat as blocking): state the *not-enforced-in-v1* caveat at the field's **single
   source** in `### Decision authority` — not only in an Out-of-scope bullet — so every by-name consumer reads
   it; describe the field as the "advisory/intended veto window (recorded, not yet enforced)"; keep the announce
   line's `(proceeding — interrupt to override)` and never render the seconds as a live timer. Same risk class
   as a re-encoded default: a load-bearing fact stated only in a place a reader can skip.

4. **Bootstrap writes the file — confirmed in scope; two structural conditions.** (a) The question must be
   neutral and default to `interactive`; the plan's wording is acceptable — recommend it also state the cap
   ("merge always stays yours; flippable any time") so the PM does not over-read `autonomous` as ceding the
   ship gate. (b) Bootstrap creating the file for new projects must add **no** consumer that *requires* the
   file — every consumer still treats absence as `interactive`, so every older downstream is unaffected and no
   migration is introduced.

## Notes for the plan / PM

- **Close the timer-honesty gap at the single source (blocking).** Ensure `### Decision authority` itself —
  the place every consumer references by name — carries the "v1 records `veto-window-seconds` but does not
  enforce a countdown; announce-then-proceed, always interruptible" caveat. The plan's Scenario 4 and
  Out-of-scope bullet are correct but secondary; the load-bearing single source must state it too.
- **Add a clean-grep for the silent-revert hazard.** The plan already has a back-compat clean-grep (no consumer
  re-encodes the default; no consumer requires the file). Add/confirm one assertion: **no consumer requires
  `.ai-pm/decision-authority.md` to exist** — absent ⇒ interactive everywhere. This is the new file's analogue
  of the re-encoded-default check and should be treated as blocking, same as the by-name-reference check.
- **Single-source clean-grep stays load-bearing.** `### Decision authority` is the only place encoding the enum
  + the `absent OR unrecognized ⇒ interactive` default; every consumer references it by name. Same drift
  `### Project kind` L226 warns about; blocking, not advisory. The value moving to a file does not relax this —
  the *default* still lives only in the subsection.
- **Family-framing for the eventual `doc/architecture.md` decision (post-coding handoff, owned by pm-architect).**
  Record: graded/capped autonomy; two scopes / one engine; ODD-as-baseline; the no-number derivability proxy
  *and why not a confidence threshold*; the **value-vs-semantics split and the lifecycle rationale for the
  dedicated `.ai-pm/decision-authority.md` home vs the `### Project kind` `CLAUDE.md`-line precedent**; the
  **advisory-not-enforced veto window and why no hard countdown in v1**; and the dual backstop (why not
  redundant — drop the `pm-auditor` dim-1 citation check and a skipped/uncited auto-decision lands silently
  project-wide). So a future reader does not "simplify" the dedicated file back into a CLAUDE.md line, mistake
  the timer for an enforced countdown, or strip a backstop.
