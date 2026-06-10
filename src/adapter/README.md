# The adapter layer

The protocol is one neutral core (`../../PROTOCOL.md`, `../agents/`) plus one thin adapter per platform. This directory is where a platform plugs in. The contract is fixed and small (`PROTOCOL.md` `## Core and adapter`); an adapter realises it and nothing more.

## How it's shaped

```
deny-rules.json   the registry — every guard, as data (intent + class + predicate + params)
tool-map.json     neutral noun → per-platform concrete tool; which return-classes a platform supports
engine.mjs        the shared check engine — holds the PREDICATES; one copy, every platform
claude/shim.mjs   Claude shim: stdin hook payload → engine → verdict JSON on stdout
opencode/         OpenCode shim: normalise.mjs (pure normalise + decide) + plugin.mjs (the
                  single-export entry — async actor lookup, throw-to-deny)
```

The split that makes this work: **rules are data, the check is code.** A deny rule's *intent, class, and parameters* (the role-deny list, the change-verb pattern, the orchestrator-writable prefixes) live in `deny-rules.json`. The *predicate* that decides — "does this path resolve outside the root", "is this an empty write over a non-empty file" — is a function in `engine.mjs`, shared by every platform. So there is exactly one copy of each rule and one copy of each check; the two of yesterday's enforcement surfaces (a 508-line hook set and a 749-line plugin) collapse into one engine + this registry.

## What a platform adapter does

A platform shim is the only platform-specific code. It:
1. **normalises input** — turns the harness's hook/plugin payload into the neutral shape `{act, path, command, content, spawnTarget, actor, prompt}`;
2. **calls the engine** — `evaluate(input, denyRules)` returns `allow | deny | ask | inject` with a reason;
3. **maps the verdict** to the harness's own mechanism — a Claude `PreToolUse` hook emits the deny/ask JSON; an OpenCode `tool.execute.before` plugin throws on deny.

A class the platform can't realise (OpenCode has no `ask`) **falls back to persona** for those rules — named in each rule's `fallback`, and the honest enforcement map in `PROTOCOL.md` already labels them. Nothing is silently dropped.

## Adding a new platform

Write `<platform>/` only: the input-normaliser, the three-class verdict mapper, and the install glue. Map its tools in `tool-map.json` and its `class_support`. **Zero edits to `engine.mjs`, `deny-rules.json`, or the core.** If a new platform forces an edit to any of those, the boundary leaked — that is the design's one failure condition.

## No regex drift — by construction, not by translation

The danger: a guard's pattern (the change-verb regex, the ssh idioms, the role-deny list) drifts between the Claude realisation and the OpenCode one, so the *same* command is blocked on one platform and waved through on the other.

A generator that *translates* one source list into two platform-specific copies narrows this — but it still produces **two copies**, and the translation step itself can diverge; it needs an integrity test to assert the two stay byte-equivalent. This data-adapter goes one better: **there is no second copy and no translation.** The patterns live once in `deny-rules.json`; both platform shims are Node and `import` the *same* `engine.mjs`, which applies those patterns with the *same* regex engine at runtime. A regex can't drift between platforms because there is exactly one regex, read by one evaluator.

The residual risk the generator-test was really guarding — **two implementations of the check logic diverging** — is real here only if a shim re-implements a predicate instead of calling the shared engine. So the integrity guard takes a sharper form than byte-equivalence:

- **Parity test** — a shared fixture of `{input → expected verdict}` cases is run through *each* platform shim's full path (normalise → engine → verdict). Both must return the identical class for every case. A predicate re-implemented or hand-edited in one shim makes its verdict diverge and the parity test fails. This is the mechanical "a manual edit breaks integrity" the design calls for — keyed on *behaviour parity*, which is what actually matters, not on translation byte-equality.
- **Single-engine assertion** — a shim must contain no rule logic of its own (only input-normalising + verdict-mapping); the test greps each shim for a forbidden inline pattern/role-list and fails if a rule leaked out of `deny-rules.json`/`engine.mjs` into a shim.

## Status

Complete and tested. `deny-rules.json` + `tool-map.json` (every `[mechanical]` row in `PROTOCOL.md` `## Enforcement`), `engine.mjs` (the predicates), and both shims — `claude/shim.mjs` (stdin hook → verdict JSON) and `opencode/{normalise,plugin}.mjs` (`tool.execute.before` → throw). `parity.test.mjs` runs all three integrity guards green: parity (every case identical across both shims bar the one documented actor divergence — orchestrator-content is mechanical on OpenCode, persona on Claude), single-engine (no rule logic leaked into a shim), and the node-spike (a Claude hook running `node shim.mjs` emits the deny JSON via stdin; ≈70 ms cold spawn per call, inline shell+jq the fallback for any hot path). The old translate-and-byte-compare generator is obsolete — there is one engine, read at runtime by both shims, so nothing to translate.

Install glue is in `INSTALL.md` (where each file lands, the Claude hook fragment, the OpenCode plugin entry). The OpenCode loader assumption is resolved: a re-exported plugin is **not** registered, so the entry **defines** its hooks inline and imports only the rule logic — and its `chat.message` inject readback is now live-verified on opencode 1.17.x. Both are documented in `INSTALL.md`; the per-class support is in `tool-map.json`.
