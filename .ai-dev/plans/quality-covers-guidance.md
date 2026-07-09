# Plan: Downstream `covers` guidance

## Goal

Add explicit downstream guidance on marking heavy tests with the `covers` field in `tools.json` so projects with large test suites (1000+ tests) can iterate fast by running only the touched subset during coding/review while keeping the full suite gated once at ship.

## Design

**Where:** `docs/architecture.md` — add a new "## Quality layer" section before "## Extension points" (around line 137). This is the right home because:
- It explains the architectural model downstream'as need to understand
- It sits alongside other core architectural sections (Capability modules, Components)
- The extension point "Add a quality tool" can then reference it

**What:** A plain-language section explaining:
1. What the quality layer is (runner + registry + configs)
2. How the `covers` field works (path filtering by glob)
3. Which tests to mark narrowly vs broadly — concrete examples
4. Why this matters: iteration speed on large test suites
5. The safety floor: cross-cutting tests (security, parity, global lints) stay without `covers` → always run

**Structure:**
- One-line definition: what the quality layer is
- How scope filtering works (`--touched` + `covers`)
- Examples of narrow vs broad `covers` patterns
- Trade-offs: granularity vs maintenance burden
- Link from `setup.md` step 5 to this section

## Files

- `docs/architecture.md` — add new "## Quality layer" section (before "## Extension points")
- `.ai-dev/procedures/setup.md` — add a one-line pointer after the toolkit proposal (step 5, after line 58)

## Verification

- Builder rebuilds the dogfood agents (`node src/adapter/install.mjs . --dogfood --platform claude`)
- Full quality suite passes locally: `node src/quality/run.mjs build` + `node src/quality/run.mjs review`
- Reviewer checks the guidance is downstream-facing (plain language, concrete examples, no jargon without gloss)

## Semver

MINOR — new capability guidance (downstream'ам теперь explicite как оптимизировать тесты)

## Decisions under autonomy

None expected — this is pure documentation addition, no code changes, no security surface.
