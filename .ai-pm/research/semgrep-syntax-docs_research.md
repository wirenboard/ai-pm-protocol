# Research: Semgrep rule syntax — canonical doc pages for Source field citations

## What we looked for

Which official docs.semgrep.dev pages cover the complete Semgrep rule-authoring surface (pattern syntax, rule YAML format, operator composition, language support, local testing) — specifically for citing in the `Source` field of rules written from scratch, not from the community registry.

---

## Findings

### Four canonical doc pages (the full authoring surface)

Deep-research verified these four pages cover everything needed to write a Semgrep rule from scratch. All findings below are `high` confidence (3/3 adversarial vote) unless noted.

| Page | URL | What it covers |
|---|---|---|
| **Rule syntax** | `https://docs.semgrep.dev/writing-rules/rule-syntax` | YAML structure, required fields, operator composition |
| **Pattern syntax** | `https://docs.semgrep.dev/writing-rules/pattern-syntax` | Metavariables, ellipsis, deep expression, pattern-regex |
| **Supported languages** | `https://docs.semgrep.dev/supported-languages` | Language keys (python, generic), GA status |
| **Testing rules** | `https://docs.semgrep.dev/writing-rules/testing-rules` | Local `semgrep --test`, annotation syntax |

### Confirmed facts (high confidence, verbatim from docs)

**YAML required fields:** `id`, `message`, `severity`, `languages`, and at least one pattern operator (`pattern` / `patterns` / `pattern-either` / `pattern-regex`). The constraint is NOT "exactly one operator" — multiple operators can compose. Source: `rule-syntax` page.

**Operator semantics:**
- `patterns` = logical AND across all child patterns. Order of child patterns does not affect the result.
- `pattern-either` = logical OR across child patterns.
- Source: `rule-syntax` page (verbatim: "The patterns operator performs a logical AND operation on one or more child patterns").

**Metavariables:** must start with `$` and contain only uppercase letters, `_`, or digits. `$X`, `$WIDGET`, `$USERS_2` are valid; `$x`, `$some_value` are explicitly invalid. Source: `pattern-syntax` page (verbatim from docs).

**Ellipsis and deep expression:**
- `...` abstracts zero or more items (arguments, statements, parameters, fields, characters).
- `<... pattern ...>` matches an expression nested at any depth — works in conditionals, binary ops.
- Source: `pattern-syntax` page.

**Generic language:** GA status for Semgrep Code. Matches arbitrary human-readable text files without language-specific parsing — config files, XML, requirements.txt, any text. Source: `supported-languages` page.

**Local testing (`semgrep --test`):** discovers test files by matching the rule's base filename to language-appropriate extensions in the same directory. The four annotation types placed as inline comments before the tested line:

| Annotation | Meaning |
|---|---|
| `# ruleid:<id>` | this line SHOULD match (guards false negatives) |
| `# ok:<id>` | this line should NOT match (guards false positives) |
| `# todoruleid:<id>` | known future positive, not yet caught |
| `# todook:<id>` | known false positive, accepted for now |

Source: `testing-rules` page (updated 2026-03-13).

**Medium-confidence (2/3 vote):** metavariable values must be identical across sub-patterns inside a `patterns` (AND) block; inside `pattern-either` (OR) branches, matching is independent per-branch. Cite the `rule-syntax` page directly, don't paraphrase.

### Refuted — do NOT cite these

- "Exactly one of `pattern` / `patterns` / `pattern-either` / `pattern-regex` is valid" — unanimously refuted (0/3).
- "pattern-not cannot contain `...`" / "`pattern-not` can only match single statements" — unanimously refuted (0/3). Cite the actual page, not a paraphrase.

---

## Source field policy for the stack-idioms library

The existing `doc/_templates/stack-idioms/python.md` rules already follow the correct two-layer Source practice:

**Layer 1 — Idiom authority (what to cite):** the Python doc, PEP, pip doc, or spec that establishes WHY the pattern matters. This is the primary Source field for all 5 current rules:
- `exception-crosses-module-boundary` → Python errors tutorial + PEP 3134
- `dict-subscript-vs-get` → Python stdtypes dict.get doc
- `pin-lower-version-bound` → pip requirements format + PEP 440
- `inline-rule-id-ban` → Semgrep pattern-regex doc (the idiom IS the Semgrep technique)
- `docstring-only-function` → Python property doc + PEP 257

**Layer 2 — Rule mechanics (when to add):** cite a `docs.semgrep.dev` page when the Source field describes a Semgrep-specific technique, not just the idiom rationale. The `inline-rule-id-ban` rule already does this (`https://semgrep.dev/docs/writing-rules/pattern-syntax` for `pattern-regex`).

### Proposed Source field header for `python.md`

Add to the library header:

```
Semgrep canonical docs (for rule-mechanics Source citations):
  Rule YAML format and operators: https://docs.semgrep.dev/writing-rules/rule-syntax
  Pattern syntax and metavariables: https://docs.semgrep.dev/writing-rules/pattern-syntax
  Language support (python, generic): https://docs.semgrep.dev/supported-languages
  Local testing (semgrep --test): https://docs.semgrep.dev/writing-rules/testing-rules
```

This gives rule authors the four stable anchors without having to look them up each time.

---

## Conclusion

The research confirms four stable docs.semgrep.dev pages cover the complete rule-authoring surface. Our existing rules already follow correct citation practice: `Source` cites the idiom's authoritative reference (Python docs, PEP, pip); Semgrep syntax docs are cited only when the technique itself is Semgrep-specific (`inline-rule-id-ban` pattern-regex). No policy change needed for existing rules.

**Recommendation:** add the four doc URLs to the `python.md` library header as a reference block (see above). This is a one-line-per-page addition that saves future contributors from looking up the canonical anchors each time they write a new rule.

**What the research explicitly ruled out:** community registry rules (`semgrep.dev/r/`) — all 5 current rules are correctly written from scratch citing authoritative sources. No community rule was found to overlap cleanly enough to adopt over the scratch-written versions.

---

## Sources

- Rule YAML format: https://docs.semgrep.dev/writing-rules/rule-syntax
- Pattern syntax (metavariables, ellipsis, deep expression): https://docs.semgrep.dev/writing-rules/pattern-syntax
- Supported languages (Generic GA): https://docs.semgrep.dev/supported-languages
- Testing rules (semgrep --test, annotations): https://docs.semgrep.dev/writing-rules/testing-rules
- Semgrep writing rules overview: https://semgrep.dev/docs/writing-rules/overview
