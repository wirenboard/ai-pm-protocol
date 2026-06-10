## Code review: approve

Reviewer: fresh context, independent of the Builder. Checked against
`.ai-pm/plans/restructure.md` (Slice A scope) and the approved direction in
`.ai-pm/design/direction-product-engine.md`.

---

### 1. Retention rule (PROTOCOL.md beat 5)

`PROTOCOL.md:54` — beat 5 now reads: "deletes every transient working artifact of
this feature — the plan, the review stamp, and any audit run for it (the stamp last,
*after* the push and PR succeed, since the merge-gate reads it at push time). Their
durable record is the commits, the CHANGELOG, and (for a user-facing change)
`contracts.md`; no graveyard of spent plans, stamps, or audits accumulates."

Single home confirmed: whole-surface grep for "transient.*artifact", "graveyard",
"stamp.*delet", "delet.*stamp", "after.*push.*delet" — zero results outside
`PROTOCOL.md:54` and `agents/orchestrator.md:8`. No restatement anywhere else.
Line count: 183 — within one-sitting range, consistent with plan estimate of ~181.

### 2. Ship ordering (orchestrator.md) + engine untouched

`agents/orchestrator.md:8` adds: "At ship you delete this feature's transient
artifacts (`PROTOCOL.md` beat 5) — and the **review stamp strictly AFTER the push
and PR succeed**, never before: the merge-gate reads `.ai-pm/reviews/<topic>_review.md`
at push time and fails closed on its absence, so deleting it earlier would deny your
own legitimate push." Points to PROTOCOL rule, does not restate it. Sequencing is
correct and explicit.

Engine byte-identity confirmed: `adapter/engine.mjs` md5
`e6c49a5f99fd16ef4ce292cebbe273ad` matches main exactly. `adapter/deny-rules.json`
md5 `e57120267002a52882489c1044bf5474` matches main exactly. Zero diff on either file.

`adapter/rigor-profile.test.mjs` lines 111–121 (FLOOR block): `git push origin
feature/foo` against a root with no review file → verdict `deny`, ruleId
`merge-while-unstamped`. Test ran: PASS 24/24.

### 3. Deletions — only spent artifacts, no live loss, no dangling refs

**Deleted (staged):** 18 review stamps (`reviews/`), 6 audits (`audits/`), 8 research
files (`research/`), 2 protocol-feedback files (`protocol-feedback/`), 21 state
archive files (`state/archive/`), 2 orphan configs (`decision-authority.md` +
`review-config.md`). All are spent artifacts; git history retains them (confirmed:
`git show main:.ai-pm/reviews/configurable-rigor_review.md` resolves).

`.ai-pm/tmp/` was gitignored (`.gitignore` line 9) — no tracked files, no staged
deletion needed.

**Keep-set surviving intact:**
- `.ai-pm/state/current.md` ✓
- `.ai-pm/backlog.md` ✓ (modified, not deleted)
- `.ai-pm/plans/restructure.md` ✓
- `.ai-pm/plans/product-advocate.md` (PAUSED) ✓
- `.ai-pm/design/direction-product-engine.md` ✓
- `.ai-pm/design/minimal-ai-pm.md` ✓
- `.ai-pm/contracts/` (10 files) ✓

**Dangling-reference grep** (whole live surface, excluding git history and plans/ which
reference deleted paths intentionally as history): no reference in any `.md`, `.mjs`,
`.json`, or `.sh` file to a specific deleted filename in the live codebase. The
backlog at line 67 names `.ai-pm/audits/audit-2026-06-08.md` as part of a historical
incident narrative — not a navigation pointer.

The contracts at `.ai-pm/contracts/decision-authority.md:33,35` reference
`workflow/decision-authority.md` and `workflow/pipeline.md` — these predate this
branch (confirmed: `git show main:.ai-pm/contracts/decision-authority.md` is
identical). Not introduced by Slice A; addressed in Slice B (contracts move to
`docs/contracts/`). Not a finding for this review.

**Backlog item:** `.ai-pm/backlog.md:411` — heading marked "DONE (restructure Slice
A)". Entry at line 413 describes what was swept. Confirmed DONE.

### 4. Honesty + scope

Slice A only — no docs/+src/ move. The change is reversible via git history (confirmed
above). The claim "git history is the archive" is true.

The retention rule is honest: `PROTOCOL.md:54` says "deletes" — the mechanical floor
under this is the orchestrator's persona discipline; it is not over-claimed as
mechanical. The gate predicate `mergeWithUnstampedReview` (engine line 126) checks
presence — this is mechanical and correctly labelled `[mechanical]` in the protocol.

### 5. Full test suite

All suites ran green against the working tree:

- parity: 55/55 PASS
- install-modules: 51/51 PASS
- install-model: 11/11 PASS
- install-commands: 10/10 PASS
- install-plugin: 6/6 PASS (byte-identity guard holds)
- opencode-inject: 10/10 PASS
- rigor-profile: 24/24 PASS (FLOOR block explicitly proves unstamped push → deny)
- neutral-prose: PASS (core is platform-neutral, surface unchanged)

No existing test was weakened. No test touches the deleted paths.

### 6. Security (threat-model: rich enumeration)

The plan's security section (`restructure.md` §Security) enumerated every surface.
Slice A's actual risk was the stamp-deletion sequencing — confirmed handled
(`orchestrator.md:8` stamps after push, engine predicate untouched). All other
surfaces (attack surface, secrets, injection, fail-open/closed, data exposure, AuthZ,
supply chain) are unchanged by Slice A — no new input, no new endpoints, no
credential handling, no dependency changes, no path-construction from tainted input.

The merge-gate floor is intact: engine `reviewStampSatisfied` at line 125–126 reads
`.ai-pm/reviews/<topic>_review.md`, unchanged. A push of an unstamped feature is still
denied (rigor-profile FLOOR block confirmed above).

---

No findings. Change is limited to what the plan named. Tests green. Engine and
merge-gate untouched. Keep-set intact. Retention rule stated once at its single home.
