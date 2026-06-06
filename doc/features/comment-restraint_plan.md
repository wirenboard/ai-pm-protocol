# comment-restraint — plan

Decision authority: autonomous

Source: selected autonomously per ### Decision authority; source: `.ai-pm/backlog.md` § "Comment-restraint + documentation-minimalism: the over-documentation 'noodles'" (2026-06-05).

## Scenarios

1. **Downstream project's `CLAUDE.md` carries a comment-restraint convention.** A project bootstrapped from the template inherits the comment-restraint rule in its `### Code conventions` section: comment WHY-when-non-obvious only; rationale belongs in the plan / arch / contract / test, not inline; no inline rule-ID citations (`# SC1`, `# AC6`); no docstrings on trivial / private functions; do NOT wire docstring-presence linters. The coder reads and follows the convention; the per-diff `code-review` checks it under the existing semantic/AI review.

2. **`pm-stack-researcher` seeds inline-rule-ID-ban and docstring-only-function Semgrep rules from the library.** When documenting a Python project, `pm-stack-researcher` reads `doc/_templates/stack-idioms/python.md` and inherits two new entries: `inline-rule-id-ban` (Semgrep rule: detects inline rule-ID citations `# SC1`, `# AC6` etc. in code comments) and `docstring-only-function` (Semgrep rule: detects functions whose entire body is a docstring with no implementation). These become the starting set before the researcher documents project-specific idioms.

3. **"Don't wire docstring-presence linters" is a stated protocol rule.** The `### Code conventions` section of the downstream CLAUDE.md template explicitly states: do NOT wire docstring-presence linters (pydocstyle / ruff `D` / pylint missing-docstring / interrogate / darglint) — they enforce docstring presence, the opposite direction of comment restraint; wiring them would amplify over-documentation.

## Existing behaviors this feature touches

- **`doc/_templates/CLAUDE.md.tmpl` `### Code conventions` section** — gains comment-restraint rule + "don't wire docstring-presence linters" note. Existing AI-specific minimums (file length, function length, complexity, coverage) are unchanged.
- **`doc/_templates/stack-idioms/python.md`** — gains two new Semgrep entries following the existing schema. The three existing entries (exception-crosses-module-boundary, dict-subscript-vs-get, pin-lower-version-bound) are unchanged.

## Contracts

(No Product Contract — template + library additions. All scenario subjects are system actors: pm-stack-researcher, pm-bootstrap, downstream coders. No user-facing behavior change.)

## Stack expectations touched

- **Markdown frontmatter (YAML in Claude Code agent files):** `doc/_templates/CLAUDE.md.tmpl` and `doc/_templates/stack-idioms/python.md` are template files, not agent files — no YAML frontmatter to preserve. Source: `doc/stack-notes.md` § "Markdown frontmatter".
- **Stack-idioms library entry schema:** each new entry in `doc/_templates/stack-idioms/python.md` must follow the existing schema: `idiom name → Edge case covered → Deviation = bug → Semgrep rule YAML → Linter encoding (if applicable) → Source → Contributed by`. Source: `doc/_templates/stack-idioms/python.md` (header + existing entries).

## Interaction scenarios

Provably isolated: additions to `doc/_templates/CLAUDE.md.tmpl` and `doc/_templates/stack-idioms/python.md`. No shared mutable state, no concurrent operations, no I/O, no adjacent feature interference.

## Test plan

- Existing tests that must pass: all `tests/hooks.sh` — 73/73 (no hook touched, no `settings.json` change).
- New tests: **none** — markdown-prose repo with no runtime. Verification is editorial: Pass-1 plan-compliance (all three scenarios implemented; comment-restraint convention in template; two Semgrep entries in python.md; "don't wire" rule present) + Pass-2 `code-review` over the diff. Consistent with `stack-idioms-library` and other template-addition precedents.

## Docs to update

- `doc/architecture.md`: decision record — "Comment-restraint + documentation-minimalism: comment-restraint convention added to `doc/_templates/CLAUDE.md.tmpl` `### Code conventions` (WHY-not-WHAT, no inline rule-IDs, no trivial docstrings, no docstring-presence linters); two Semgrep entries added to `doc/_templates/stack-idioms/python.md` (`inline-rule-id-ban`, `docstring-only-function`)." Authored by `pm-architect` post-coding.

## Key design decisions

- **Comment-restraint convention lives in `doc/_templates/CLAUDE.md.tmpl`, not WORKFLOW.md.** The CLAUDE.md template governs coder behavior in downstream projects — it is the right home for coding conventions. WORKFLOW.md carries cross-cutting invariants for the orchestrator; it has no `### Code conventions` section. This is additive to the existing AI-specific minimums in the template.
- **Semgrep rules land in `doc/_templates/stack-idioms/python.md`, not as new top-level files.** Consistent with the stack-idioms-library mechanic: Python-specific rules accumulate in `python.md`; the library grows via the existing contribute-up path.
- **`docstring-only-function` (function body = only a docstring) rather than `trivial-function-docstring` (function ≤N lines).** The backlog mentions "docstring on a function ≤N lines" but the ≤N threshold is arbitrary and noisy (legitimate short utility functions exist). The `docstring-only-function` pattern is unambiguous: if the body is only `"""..."""` with no implementation, the docstring is either dead or a placeholder — a real finding in both cases. The comment-restraint convention (scenario 1) handles the semantic "trivial function" case without Semgrep.
- **`inline-rule-id-ban` targets protocol-style rule-ID citations specifically.** Pattern: `#\s*[A-Z]{2,3}\d+\b` (2–3 uppercase letters followed by digits) — catches `# SC1`, `# AC6`, `# NFR3`. Wide enough to catch the pattern; the `[A-Z]{2,3}` constraint avoids matching common comment prefixes like `# TODO` or `# FIXME` (single-word all-caps with no digit suffix).
- **"Don't wire docstring-presence linters" stated explicitly.** The backlog notes this is the "trap" — most documentation linters enforce presence. The convention states this explicitly so a bootstrap session or future pm-stack-researcher doesn't add them.
- **Vale / proselint / write-good (prose quality tools) are OUT OF SCOPE.** The backlog mentions them as possible tools; they're more relevant to downstream documentation projects than to code repos. Their Semgrep/linter wiring would require `/pm-research`. Deferred.

## Out of scope

- **Comment-density / comment-to-code ratio gate** — the backlog mentions this as a possible deterministic check; it's noisy (large comment blocks are sometimes appropriate) and the threshold is project-specific. Not included.
- **Vale / proselint / write-good** — prose quality tools for documentation projects; require `/pm-research` for setup. Deferred.
- **`function ≤N lines` docstring rule** — replaced by the less-ambiguous `docstring-only-function` pattern (see Key design decisions).
- **Sweeping existing downstream project code** — the Semgrep entries are added to the library for future use; no retroactive sweep.
- **Adding the convention to WORKFLOW.md** — the convention governs downstream project coders; WORKFLOW.md governs the orchestrator. Different audiences, different homes.
