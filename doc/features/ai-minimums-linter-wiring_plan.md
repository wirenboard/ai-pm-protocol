# ai-minimums-linter-wiring — plan

Source: PM-flagged 2026-06-04/05 — backlog "Deterministic-enforceable vs AI-evaluated check boundary" (#211) + "AI-specific minimums risk being AI-self-policed" (#218), sharpened by the DriveBox uber-review (#224): `cli.py` grew to 331 lines over many diffs, past the 300-line AI-minimum, because nothing **runs** the rule — it is a `CLAUDE.md` / `architecture.md` convention, not a linter check. The per-diff coder/review never failed on it.

*The protocol declares **AI-specific minimums** (max file 300 lines, max function 50, cyclomatic ≤10, no file-level lint-suppressions, new-code coverage ≥80%) as conventions in `docs/architecture.md` `### AI-specific minimums` + `CLAUDE.md`, and expects the project's `<lint command>` to enforce them — but it never **guarantees** the linter actually encodes them. So they degrade to AI-self-policed: a diff that crosses a minimum passes lint + per-diff review. This slice makes the AI-minimums **deterministically enforced by the project's real linter, run every diff** — the deterministic half of the #211 boundary, made real. The per-stack "how" is `pm-stack-researcher`'s job; the numbers stay single-sourced; a reviewer/auditor check verifies the linter encodes them (so a project cannot silently leave them un-enforced).*

Meta-feature on the template repo: **software-kind**, non-user-facing (subjects = `pm-stack-researcher` / the project's linter config / `/pm-bootstrap` / the reviewer / the Pipeline). No Product Contract, no advocate gate, no `## Validation` gate. Verification = editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched — this is about the *downstream project's* linter, not the protocol's hooks). NB: this template repo is markdown-prose with no linter to host the minimums, so it dogfoods the *discipline*, not a Python linter config.

## Scenarios

1. **At bootstrap, the AI-minimums are wired into the project's real linter (the missing guarantee).** When `/pm-bootstrap` (or `pm-stack-researcher` documenting a stack for the first time) sets up the project's `<lint command>`, it **encodes the AI-specific minimums into the linter's config** for the project's stack, so the Pipeline lint step **fails a diff** that violates a minimum. `pm-stack-researcher` produces the **stack-specific mapping** (each minimum → the concrete rule that enforces it) into `docs/stack-notes.md`, e.g. Python: `pylint` `max-module-lines=300` + `max-args` + mccabe complexity + `R0801` duplicate-code, `ruff` (dead imports), `vulture` (dead code); JS/TS: `eslint` `max-lines` / `complexity` / `no-unused-vars`; Go: `golangci-lint` `funlen` / `gocyclo` / `unused`. The numbers (300/50/10/no-suppression/≥80%) stay single-sourced in `### AI-specific minimums`; the linter config is the **enforcement**, the mapping is the researcher's.

2. **The numbers stay single-sourced; the linter encodes, never re-declares them.** `docs/architecture.md` `### AI-specific minimums` remains the single home for the *values*; the linter config and `stack-notes.md` mapping **reference** those values (the same number, enforced) — they do not become a second authority that can drift. Change a minimum once, in `### AI-specific minimums`; the mapping says which rule carries it.

3. **A reviewer/auditor check verifies the linter actually encodes the minimums.** A diff/audit check confirms the project's lint config **enforces** the AI-minimums it claims (e.g. the `pylint` `max-module-lines` is set to the declared 300, the complexity cap is set, dead-code lint is on) — so a project cannot ship with the minimums stated in `CLAUDE.md` but **un-enforced** by the linter (the exact DriveBox gap). This extends the existing reviewer "validator listed in stack-notes must be present in the Pipeline and actually run" check (dim 9) to the **AI-minimums linter rules**, not a wholly new gate.

4. **Honest partial — minimums a linter cannot express stay convention + AI-review (the #211 boundary).** Where a given stack's linter cannot express a minimum (some linters lack per-file-length or cross-file duplication), the mapping records it as **convention-only**, enforced by the AI per-diff/smell review rather than the linter — explicitly, not silently. The slice is honest that the deterministic half covers *most* minimums on common stacks, not all on all stacks; the AI review (and the review-typology smell type) backstops the rest. This is the deterministic-vs-AI boundary (#211) applied concretely.

5. **Ties to the review typology + the smell type.** The deterministically-linted minimums are the **per-diff deterministic half** the `### Review typology` registry names for the per-diff and smell types; the smell sweep (shipped slice 1) catches the *accumulated* / cross-module cases a single diff's lint can't (cross-module duplication). This slice fills in the per-diff deterministic half the registry pointed at.

6. **Additive, no migration.** New projects get the AI-minimums-encoded linter at bootstrap. Existing downstream projects: at their next `/pm-audit` or stack-notes refresh, the reviewer/auditor check flags an un-enforcing linter as a note (never a retroactive forced rewrite); the PM opts in to wiring it. No template structural migration.

## Existing behaviors this feature touches

(what must not break)

- **`docs/architecture.md` `### AI-specific minimums`** — stays the single home for the *numbers*; unchanged values; the linter encodes, never re-declares them.
- **`CLAUDE.md` Pipeline `<lint command>` + Validators block** — the lint command now must encode the AI-minimums; the validator-presence discipline (reviewer dim 9) is extended to the AI-minimums rules.
- **`pm-stack-researcher`** — its existing job (document a stack's validators + idioms into `docs/stack-notes.md`) gains the explicit AI-minimums→linter-rule mapping per stack.
- **`/pm-bootstrap`** — the stack-setup step wires the AI-minimums into the linter config (or records convention-only where unexpressible).
- **The reviewer (`code-review` / `pm-plan-checker`) + `pm-auditor`** — the "validator present + run" check extends to "AI-minimums encoded in the linter"; no wholly new gate.
- **Proportionality / honesty** — unexpressible minimums are convention-only + AI-backstopped, stated, not silently dropped.

## Contracts

None. Process/tooling change. No API, data shape, or downstream-consumed runtime artifact.

## Stack expectations touched

(from `doc/stack-notes.md`)

- **The stack-notes "Validators wired into pipeline" mechanism** — this feature adds an **AI-minimums→linter-rule** mapping per stack into stack-notes; it is `pm-stack-researcher`'s output, cited per stack with the linter's doc URL (e.g. pylint `max-module-lines`, eslint `max-lines`, golangci-lint `funlen`). Source: the respective linter docs (researcher-supplied per project).
- No stack component of *this* template repo is touched (markdown-prose, no linter); the feature is the *discipline + the researcher role*, exercised on downstream code projects.

## Interaction scenarios

Provably isolated: a prose-spec change to the discipline (`pm-stack-researcher` role + the bootstrap step + the reviewer/auditor check + the CLAUDE.md/architecture.md template notes). No runtime, no shared mutable state, no concurrency, no I/O in the protocol repo. The downstream effect (a linter config) is the project's own pipeline, run sequentially. Covered by Scenarios 1–6 and clean-grep.

## Test plan

*Repo discipline: no automated tests by design — verification editorial + clean-grep; `tests/hooks.sh` 74/74 (no hook touched).*

- Existing tests that must pass: `tests/hooks.sh` (74/74 — unchanged).
- New tests: none (prose-spec). Verification instead:
  - **Editorial walkthrough** — bootstrap/stack-researcher wires AI-minimums into the linter; numbers single-sourced (linter encodes, never re-declares); the reviewer/auditor check verifies encoding; unexpressible minimums are convention-only + AI-backstopped (honest #211 boundary); ties to the review-typology per-diff/smell deterministic half.
  - **Clean-grep — single-source:** the AI-minimums *values* live only in `### AI-specific minimums`; the linter mapping references them, no second authority.
  - **Clean-grep — extends-not-duplicates:** the reviewer check extends the existing dim-9 validator-present-and-run discipline to the AI-minimums rules, not a new parallel gate.
  - **Clean-grep — honest partial:** unexpressible minimums recorded convention-only, not silently dropped; #211 cited.
  - **Proportionality check:** this markdown-prose template repo has no linter — the discipline applies, the AI-minimums numbers stay stated, and no linter config is forced on it.
- Interaction scenario tests: none (provably isolated).
- Stack-spec tests: none new in this repo (the per-stack linter rules are downstream, researcher-supplied; the stack-notes mapping cites each rule's doc URL).

## Docs to update

- `.claude/agents/pm-stack-researcher.md` — add the **AI-minimums→linter-rule mapping** to its job: when documenting a stack, produce the concrete linter rules that encode each AI-specific minimum (referencing `### AI-specific minimums` for the numbers), into `docs/stack-notes.md`; record any minimum the stack's linter cannot express as **convention-only** (AI-review-backstopped). Per-stack examples (pylint/eslint/golangci-lint) as illustration, not a hardcoded list.
- `.claude/commands/pm-bootstrap.md` — the stack-setup step: wire the AI-minimums into the project's `<lint command>` config (or record convention-only), via `pm-stack-researcher`'s mapping.
- `doc/_templates/CLAUDE.md.tmpl` — a one-line note in the Pipeline block that the `<lint command>` must **enforce the AI-specific minimums** (per `docs/stack-notes.md`'s mapping), not just run a default lint.
- `doc/_templates/architecture.md.tmpl` `### AI-specific minimums` — a one-line pointer that these are **enforced by the project's linter** (per the stack-notes mapping), not self-policed; the numbers stay here, the enforcement in the linter.
- **The reviewer check — extend the existing dim-9 "validator present + run" mechanism across BOTH cadences (arch-decided Variant A), no new gate:** (a) `.claude/agents/pm-plan-checker.md` — a one-line clarification to its existing **Pipeline-green DoD**: the project's `<lint command>` must **encode** the AI-specific minimums (per the `docs/stack-notes.md` mapping), not just run a default lint — a per-diff guarantee, free because the linter already runs every diff; (b) `.claude/agents/pm-auditor.md` **dimension 5** — a periodic **non-blocking note** when a downstream project declares the AI-minimums but its lint config does not encode them. Mirrors the existing two-cadence validator discipline (rule-text single-homed in `CLAUDE.md` Pipeline; run by pm-coder; checked per-diff by pm-plan-checker; re-checked periodically by pm-auditor) — extends it, does not fork a new dimension. `code-review` is **not** a third owner — it is the per-diff AI-semantic half backstopping *unexpressible* minimums (Scenario 4).
- **Single-source guard (arch Q2):** the AI-minimums *numbers* are not prose-re-stated outside `### AI-specific minimums`; a linter-config parameter (`max-module-lines=300`) is an acceptable **enforcement encoding**, not a forbidden re-declaration (same principle as threat→`SCn`).
- `doc/architecture.md` — a short decision record: AI-minimums deterministically linter-enforced (the #211 deterministic half, made real; sharpened by DriveBox #224); per-stack mapping = `pm-stack-researcher`; honest partial for unexpressible minimums; ties to the review typology. (pm-architect post-coding handoff.)
- *(No `.claude/settings.json` / hook / `MIGRATIONS.md` change — additive; the linter wiring is the downstream project's, born at its bootstrap/next-audit.)*

## Out of scope

- **Building/forcing a linter on existing downstream projects** — additive; the reviewer/auditor flags an un-enforcing linter as a **note**, the PM opts in. No retroactive rewrite.
- **Cross-module / accumulated checks the smell sweep owns** — duplication-across-modules and whole-codebase smells are the review-typology **smell type** (shipped slice 1) + the AI review, not the per-diff linter. This slice is the **per-diff deterministic** half.
- **A protocol-side linter** — the template repo is markdown-prose; the feature is the discipline + the researcher role, exercised downstream. No linter added here.
- **The common-base-error convention** (a separate DriveBox lesson) — a `docs/stack-notes.md` idiom + an architectural-review-type pattern, its own later note/slice.
- **Hardcoding the per-stack linter rules in the protocol** — rejected; `pm-stack-researcher` derives them per project (the protocol stays stack-agnostic), with examples as illustration only.
- **The reviewer-check owner choice** (pm-auditor dim vs pm-plan-checker DoD vs code-review) and the exact bootstrap wiring mechanics — settled in arch-review.
