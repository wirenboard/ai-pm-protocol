# changeset-hygiene — plan

Source: PM directive 2026-06-05 — two related pains, one feature (PM chose "обе одним заходом"), under one motivation the PM gave: *the PM doesn't read code, but their colleagues do — discipline the protocol so the changeset is not painful for a human to review.* (1) the diff accumulates changes that don't serve the feature — drive-by micro-optimizations, whitespace/reformat churn "заодно"; (2) human-facing text the AI authors gets shipped without being read for legibility (the colleague's point 4: "read it twice, rewrite if unclear, don't copy unread"). This is feature **A** of the PM-sequenced track A→B→C; **B** (deterministic linters, backlog #218/#211) and **C** (canonical-idioms / Semgrep library, #227) are the next, separate features and are explicitly out of scope here.

## Scenarios

1. **The coder's changeset contains only hunks that serve the plan.** `pm-coder` does not fold in **cosmetic-only** changes — whitespace-only edits, reformatting of untouched lines, reordering, or opportunistic micro-optimizations — that do not serve a plan scenario, **even when they look harmless**. This sharpens the existing "note unrelated, don't fix it" rule (which today reads as being about *functional* fixes) to also cover cosmetic / churn noise. A worthwhile unrelated change the coder notices is **recorded in its report (→ backlog)**, never folded into the diff.
2. **The Pass-1 reviewer surfaces diff-noise as a structural note.** `pm-plan-checker`'s existing "changes outside the plan scope → note" is sharpened to explicitly include **hunk-level cosmetic noise** (whitespace/reformat/opportunistic micro-optimization hunks not traceable to a plan scenario) — surfaced as a **non-blocking structural note** (the same shape and rationale as the wire-token note: a structural observation, never prose-policing, never a hard block), so the orchestrator/PM can prune it or consciously keep it.
3. **Human-facing text the protocol authors is read-before-ship and rewritten if unclear.** Text the protocol emits into durable human-facing artifacts — CHANGELOG entries, PR bodies, decision records, and code comments — is **read for legibility before it ships** and **rewritten if unclear or hard to read**; agent output is never pasted verbatim into a durable artifact unread. This is single-sourced as a named discipline and referenced by the agents/steps that author such text.
4. **Necessary incidental changes are NOT diff-noise.** A change the feature genuinely requires — a call-site update a renamed symbol forces, an import the new code needs, a touched line a real edit sits on — is in scope and is **not** flagged. The rule targets changes that **don't serve the plan**, not all adjacent edits; the distinction is stated explicitly so legitimate edits are never treated as noise (the same "categorical, not strip-everything" discipline as the wire-token boundary).

## Existing behaviors this feature touches

- `pm-coder.md` step 6 / step 34 ("Stay within the plan's scope"; "If you notice something unrelated worth fixing — note it in your report, don't fix it") — sharpened, not replaced: the existing functional-fix discipline is extended to cosmetic/churn noise. The atomic-commit rule (step 10) is unchanged.
- `pm-plan-checker.md` "Implementation compliance" — its existing `Changes outside the plan scope → note (product: "scope expanded — intended?")` is sharpened to name hunk-level cosmetic noise as a structural note; the feature-scope-expansion note it already emits is preserved.
- `workflow/pm-comms.md` — the "communication to humans" single-source gains the legibility discipline as a new named subsection, distinct from the existing `## How to talk to the PM` (live chat) rules, which are untouched.
- `pm-pr-prep.md` — the CHANGELOG/PR authoring it does must reference the legibility discipline (read-before-ship); its step-0 stamp gate + version/CHANGELOG mechanics are unchanged.

## Contracts

(no Product Contract — this repo has no user-facing contracts by design; protocol-discipline change to agents + conventions.)

## Stack expectations touched

(none — Markdown agent/convention prose; no library / format / external-system idiom touched.)

## Interaction scenarios

Provably isolated: the change edits procedure/convention prose in agent files + one `workflow/` topic file. No shared mutable state, no concurrency, no I/O — it changes what the coder includes and what the reviewer notes, not any runtime machinery. The one adjacency (scenario 2 ↔ the existing feature-scope-expansion note) is handled editorially: the cosmetic-noise note is an addition beside the existing scope-expansion note, not a replacement.

## Test plan

- Existing tests that must pass: all of `tests/hooks.sh` — untouched (this feature changes no hook); confirm it stays 73/73.
- New tests: **none** — this is a Markdown protocol-discipline change (agent prose + a convention) in a markdown-prose repo with no runtime/linter to host an automated test for "did the coder avoid cosmetic churn" or "is the text legible." Verification is editorial: Pass-1 plan-compliance (the four scenarios are implemented in the agent/convention prose; the diff-noise rule is sharpened-not-duplicated; the legibility discipline is single-sourced and referenced) + Pass-2 `code-review` over the diff + validation-by-use. The documented-boundary note matches the engine-selection / audit-scope-menu prose-half precedent.

## Docs to update

- `doc/architecture.md`: a short decision record — "Changeset hygiene: the coder's diff carries only feature-serving hunks (cosmetic/churn noise excluded), the Pass-1 reviewer surfaces diff-noise as a structural note, and human-facing authored text is read-before-ship/rewritten-if-unclear (single-sourced in `workflow/pm-comms.md`)." Note the motivation (human-colleague reviewability) and that **B** (linters #218/#211) and **C** (idioms #227) are the sequenced follow-ons. Authored by `pm-architect` post-coding.
- `.claude/agents/pm-coder.md`, `.claude/agents/pm-plan-checker.md`, `workflow/pm-comms.md`, `.claude/agents/pm-pr-prep.md`: the actual discipline changes (scenarios 1–3) — protocol source, authored by `pm-coder`.

(README not touched — no install/quickstart/architecture-one-liner/doc-pointer change; README-currency trigger does not fire.)

## Out of scope

- **B — deterministic linters** (file ≤300 / function ≤50 / complexity / dead-code / duplication wired into bootstrap; backlog #218/#211) — the next sequenced feature. This feature adds **no** linter and no `CLAUDE.md` Pipeline validator.
- **C — canonical-idioms / Semgrep-rules library** ("how to write code / avoid bug-classes" seeded per stack; backlog #227) — the feature after B, needs `/pm-research` first.
- **Code readability of the code itself** (clear variable names, structure, the colleague's point 3) — that is a code-quality concern owned by `code-review` Pass-2 + B/C, not this prose-discipline feature.
- **The deeper comment-restraint / AI-texture rubric** (backlog #386 — justifies-not-describes, no-trivial-docstrings, inline-rule-ID ban) — this feature's legibility rule is the lighter "read-before-ship, rewrite-if-unclear" discipline; the full comment-restraint convention stays #386's scope.
- **A hard block on diff-noise** — explicitly rejected; "is this hunk feature-related" is a semantic judgement, so it is a non-blocking structural note (the soft-enforcement family: wire-token lint, no hook for semantic triggers), not a `pm-plan-checker` blocking finding and not a hook.
