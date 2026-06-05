# Stack idioms — Python

Seam-completeness idioms for Python projects. Each entry is a Semgrep-executable rule encoding
one idiom, the edge case it pre-solves, and the deviation that constitutes a bug.

Load-on-demand: read this file with the Read tool; it is NOT @-imported into any session.
Do not rediscover entries already present here — include them as the starting set when
documenting a Python component in `docs/stack-notes.md`.

---

### exception-crosses-module-boundary (python)

**Edge case covered:** a caller importing from a library sees `requests.exceptions.ConnectionError`
(or any other third-party exception class) instead of the project's own `TransportError` — the
caller cannot catch it without a direct dependency on the library that originally raised it.
Naked third-party exceptions crossing a module boundary leak implementation details and create
hidden coupling.

**Deviation = bug:** `raise` without wrapping → naked third-party exception crosses the seam;
callers that only depend on this module cannot catch it predictably.

**Semgrep rule:** `python.seam.exception-crosses-module-boundary`

```yaml
rules:
  - id: python.seam.exception-crosses-module-boundary
    languages: [python]
    severity: WARNING
    message: "exception-crosses-module-boundary: wrap the caught exception in a project-defined
      exception before re-raising across a module boundary; callers should not need a dependency
      on the originating library to handle this error"
    patterns:
      - pattern: |
          except $EXC as $E:
            ...
            raise $E
      - pattern-not: |
          except $EXC as $E:
            ...
            raise $PROJ_EXC(...) from $E
```

**Note:** the pattern catches bare `raise $E` (re-raise of the caught exception object). A
`raise` (bare, re-raises in-place) is a different form and is acceptable inside the same module;
the rule targets `raise <var>` with the original exception escaping the except block without
wrapping. Adjust `pattern-not` to match the project's own exception base class if it is known.

**Linter encoding (if applicable):** not expressible as a metric threshold — Semgrep Tier 1 only.

**Source:** https://docs.python.org/3/tutorial/errors.html#exception-chaining (PEP 3134 — exception
chaining; the idiom is to use `raise ProjectError(...) from original` at seam boundaries)

**Contributed by:** ai-pm-protocol (2026-06-05)

---

### dict-subscript-vs-get (python)

**Edge case covered:** a partial record (e.g. from user-editable JSON, a sparse config store,
or an API response where keys are optional) causes `KeyError` at a `d[key]` subscript site when
the key is absent. The most valuable instance is **local inconsistency**: `meta.get("mimeType", "")`
on one line followed by `meta["id"]` on the next line in the same scope — asymmetric paranoia on
the same dict signals the developer knew some keys could be absent but forgot to apply that
knowledge consistently.

**Deviation = bug:** `d[key]` where `key` is not guaranteed present → `KeyError` on partial record.

**Semgrep rule:** `python.seam.dict-subscript-vs-get`

```yaml
rules:
  - id: python.seam.dict-subscript-vs-get
    languages: [python]
    severity: WARNING
    message: "dict-subscript-vs-get: use dict.get(key, default) when a key may be absent;
      d[key] raises KeyError on partial records (e.g. user-editable JSON, sparse config,
      optional API response fields)"
    patterns:
      - pattern: $DICT[$KEY]
      - pattern-not: $DICT[$KEY] = $VAL
      - pattern-not-inside: |
          try:
            ...
          except KeyError:
            ...
```

**Scope note:** `$DICT[$KEY]` matches ALL Python subscript operations — dicts, lists, tuples,
strings, and custom objects. This intentionally broad pattern surfaces every unguarded subscript
that could raise `KeyError` or `IndexError`; downstream teams should review findings and suppress
on sequences where the index is range-safe (e.g. `# nosemgrep: python.seam.dict-subscript-vs-get`).
For a dict-only narrowing, scope the rule to call sites where the variable is annotated as
`Dict[...]` or returned by a known dict-producing function — that requires a project-local
metavariable filter the generic rule cannot express.

**Note on local-inconsistency detection:** the most actionable case — `dict.get(...)` and
`dict[key]` on the same dict in the same scope — is not expressible as a single Semgrep
structural pattern without metavariable tracking across lines. Detect it in code review:
when a scope uses `.get()` on a dict for any key, flag every `dict[key]` subscript on the
same dict in the same scope as asymmetric paranoia. The Semgrep rule above catches the
general subscript-without-guard case; the local-inconsistency signal is the review heuristic.

**Linter encoding (if applicable):** not expressible as a pylint/ruff rule — Semgrep Tier 1 only.

**Source:** https://docs.python.org/3/library/stdtypes.html#dict.get (dict.get documentation);
seam-completeness idiom for optional-key dicts — use `.get(key, default)` not subscript.

**Contributed by:** ai-pm-protocol (2026-06-05)

---

### pin-lower-version-bound (python)

**Edge case covered:** a library update removes a function or changes a call signature silently;
an unpinned install on a new machine or in CI picks up an older or newer version that was never
tested. The project works locally but breaks in CI or a fresh deploy. With only an upper bound
(`library<=2.0`) the install can silently use version 0.1 — an untested, potentially incompatible
older release.

**Deviation = bug:** `library` (no bound) or `library<=2.0` (upper bound only) in
`requirements.txt` / `pyproject.toml` → install may resolve to an untested version;
undiscovered incompatibility surfaces in CI or fresh deploy.

**Semgrep rule:** `python.seam.pin-lower-version-bound`

```yaml
rules:
  - id: python.seam.pin-lower-version-bound
    languages: [generic]
    severity: WARNING
    message: "pin-lower-version-bound: add a lower version bound (>=X.Y) for this dependency;
      an unpinned or upper-bound-only dependency allows installs of untested older versions
      and breaks reproducibility across machines and CI"
    paths:
      include:
        - "requirements*.txt"
        - "pyproject.toml"
        - "setup.cfg"
    patterns:
      - pattern: $PKG<=$VER
      - pattern-not: $PKG>=$MIN,<=$VER
```

**Note:** the generic-language rule matches requirement specifier lines. For `requirements.txt`
bare package names (no version specifier at all), add a complementary rule:

```yaml
  - id: python.seam.pin-lower-version-bound-bare
    languages: [generic]
    severity: WARNING
    message: "pin-lower-version-bound: dependency has no version constraint; pin a lower bound
      (>=X.Y) to prevent installing untested versions"
    paths:
      include:
        - "requirements*.txt"
    patterns:
      - pattern: $PKG
      - pattern-not: $PKG$OP$VER
      - pattern-not-regex: '^(\s*#|\s*-|\s*$|--)'
```

**Scope note for bare-package rule:** the generic-language `$PKG` pattern matches every
non-empty line in `requirements*.txt`, including comment lines (`# runtime deps`), pip options
(`-r base.txt`, `--index-url`, `--extra-index-url`), and blank lines. The `pattern-not-regex`
above excludes the most common non-package prefixes. Verify this exclusion against the project's
actual requirements file format; projects using environment markers (`package ; python_version`)
or editable installs (`-e ./local_pkg`) may need additional `pattern-not-regex` entries.

**Linter encoding (if applicable):** `pip-audit` / `pip-compile` (pip-tools) enforce reproducible
installs via a lockfile; this rule targets the source-of-truth specifier file, not the lockfile.
See also: `deptry` (checks for missing version pins).

**Source:** https://pip.pypa.io/en/stable/reference/requirements-file-format/ (requirements
specifier format); https://peps.python.org/pep-0440/ (PEP 440 — version specifiers, §
"Inclusive ordered comparison").

**Contributed by:** ai-pm-protocol (2026-06-05)
