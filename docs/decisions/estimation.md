# Decision: estimation methodology — complexity, not file count

**Rule:** estimate by the type and coupling of the change, not by the number of files touched.

## The three questions

Before quoting time, answer:

1. **Is there non-trivial logic?** A 5-line condition in a shared function costs more than 20 prose edits.
2. **Are there tests that could break?** Every parity/install/unit test that touches the changed surface needs a run-and-fix budget.
3. **Are there unresolved design decisions?** If the shape isn't decided, the build estimate is fiction.

## Time buckets per change type

| Type | Typical cost |
| --- | --- |
| Prose edit (doc, agent, README) | 5–15 min each |
| JSON/config value change | 5 min each |
| Logic change (JS function, small) | 15–30 min |
| Test suite run + fix | 20 min (budget always) |
| Review (independent spawn) | 20–40 min |
| Ship (commit + push + PR) | 10 min |

Sum the buckets, not the files.

## Anti-pattern

*"8 files → half a day."* File count is the worst proxy — a 5-line JS change in a shared function outweighs 7 prose edits. Count complexity; files are incidental.

## Where this applies

The Builder quotes an estimate in the plan. The estimate goes in the plan's progress note, not in the guarantee section. It is an approximation; a 2× miss on a sub-hour task is noise, not a failure.
