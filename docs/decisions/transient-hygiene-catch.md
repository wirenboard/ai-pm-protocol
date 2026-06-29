# A mechanical catch for orphaned loop transients

**Question (2026-06-29).** The ship beat deletes a feature's transient working
artifacts — its plan (`.ai-dev/plans/<topic>.md`), its review stamp
(`.ai-dev/reviews/<topic>_review.md`), any audit run (`.ai-dev/audit/<slug>.md`)
(`PROTOCOL.md` beat 5; `orchestrator.md` `## Your seat`). That deletion is
`[persona]`. When a session skips it — forgot, reset between build and ship, or a
batch shipped several features at once — those files **accumulate**, and **nothing
catches them**. The audit's `durable-text hygiene` dimension sweeps the backlog,
the resume pointer, and phase-framing, but it has **no clause** for orphaned
transient files. Should that gap be closed, and how?

This is the same shape as `docs/decisions/audit-cadence-backstop.md`: a persona
discipline with no mechanical catch. The difference that decides the answer is that
transient staleness, **unlike** the audit cadence, is **cheaply derivable** — a
plan/review/audit file whose topic matches no open branch is stale — so a mechanical
advisory is proportionate here where it was not there.

---

## The evidence (a downstream report, triaged to a protocol-level finding)

A downstream project, `adegtyarev-org/noos` (~458 commits, shipped to 0.41.204),
carries **40+ stale `.ai-dev/plans/*` files and 3 `.ai-dev/reviews/*` stamps for
already-shipped features** — among them `mcp-streamable-http-sandbox_review.md`,
whose PR (#472) is **merged**, yet the stamp lingers. The Operator flagged it
plainly: "транзиенты опять же не чистятся" (the transients, again, are not being
cleaned).

The protocol-level finding (not the raw downstream content) is the gap above: the
ship-beat delete is persona-only, a skipped delete is silent, and no later sweep
notices the residue. The `mcp-streamable-http-sandbox` stamp is the clean
illustration — a stamp whose feature demonstrably shipped (the PR is merged) is the
exact thing a topic-vs-branch check flags.

**Not a protocol gap (recorded, no fix manufactured):** noos's oversized
`core/executive_control.py` (6205 lines) is a downstream *adherence* gap — the
protocol already covers absolute file size (the setup size-linter at ~800 lines +
the audit `module-size` dimension), so the catch exists and noos simply has not run
it. Its verbose comments are mostly legitimate `why` (defensive-cap rationale,
env-tuning semantics), not `what`-restating junk; no fix is invented for them.

---

## The fix

A project-agnostic advisory check, `src/quality/transient-hygiene.mjs`, registered
as a `build`-beat `tools.json` row (the `version-skew` pattern), so it ships to
every downstream through the runner and runs in CI and at audit step 1:

- It lists `.ai-dev/plans/*.md`, `.ai-dev/reviews/*_review.md`,
  `.ai-dev/audit/*.md` whose **topic has no matching open local branch** (the
  `feature/`/`fix/` prefix stripped from branch names, the `_review` suffix stripped
  from a stamp's name, before matching).
- It is **advisory — it ALWAYS exits 0**, even with findings, and is silent when
  clean. An overdue cleanup is not a build failure.
- It is **fail-safe**: no git, the dir absent, or not a repo ⇒ a no-op success, never
  a crash and never a false finding (an unknowable branch set yields no nudge).
- Under CI (`GITHUB_ACTIONS`) it additionally emits a GitHub Actions `::warning::`
  annotation per stale file, so the surface reaches the **Operator on the PR** — the
  model-independent audience.

Paired with it, the audit's `durable-text hygiene` dimension gains a clause **(d)
transient hygiene**: the runner row surfaces the candidates mechanically (audit step
1), and the auditor's residual is confirming each flagged file is genuinely shipped
and pruning it — composed exactly like the dimension's existing "byte-level drift is
mechanical, the auditor's residual is completeness" framing.

**Out of scope:** no engine/deny change (this is advisory, the floor is untouched);
no Claude-only inject hook (the parity debt `audit-cadence-backstop.md` M3 rejected);
no auto-deletion (surfacing only — deleting a file the session cannot prove is
shipped is unsafe; pruning stays the audit/Operator's act).

---

## The honesty label (load-bearing)

This makes orphaned-transient detection **mechanically SURFACED, never mechanically
ENFORCED.** The ship-beat delete stays a `[persona]` *decision to act*; only its
*follow-up visibility* becomes mechanical. The check never reds a build, never gates
a merge — it is an **inject-class nudge** (`PROTOCOL.md` `## Enforcement`: nudges,
never blocks). Selling it as "transient cleanup is now enforced" would be a
review-blocking honesty over-claim (`PROTOCOL.md` `## Role contracts`). It narrows
one already-persona window; it adds nothing to the safety floor (broken or unreviewed
code reaching `main`), which is held elsewhere by the merge-gate + remote branch
protection.

This mirrors `audit-cadence-backstop.md` exactly: a persona discipline given a cheap,
model-independent **surface** without being promoted to a gate. The two differ only in
that transient staleness is cheaply derivable (no durable anchor problem), so the
advisory could be built directly rather than parked.

---

## Sources

- Internal: `PROTOCOL.md` beat 5 (the ship-beat transient delete) and `## Enforcement`
  (the inject-class — nudges, never blocks) + `## Role contracts` (over-claim = a
  blocking honesty failure); `orchestrator.md` `## Your seat` (the persona delete
  step) and `## Audit` (the `durable-text hygiene` dimension this extends);
  `docs/decisions/audit-cadence-backstop.md` (the sibling persona-discipline-with-no-
  catch decision this mirrors, incl. its M3 Claude-only-inject rejection);
  `src/quality/version-skew.mjs` + `src/quality/tools.json` (the advisory-row pattern
  this check follows).
- Downstream: `adegtyarev-org/noos` — 40+ orphaned `.ai-dev/plans/*`, 3 lingering
  `.ai-dev/reviews/*` stamps including the merged-PR `mcp-streamable-http-sandbox`
  stamp; Operator report 2026-06-29 ("транзиенты опять же не чистятся"). The
  evidence is read as a protocol-level finding, not copied as downstream content.
- GitHub Actions `::warning::` annotations as a non-failing PR surface — standard
  Actions behaviour, model-independent (confidence: high; the same forge layer branch
  protection relies on).
