# The adapter layer

The protocol is one neutral core (`../../PROTOCOL.md`, `../agents/`) plus one thin adapter per platform. This directory is where a platform plugs in. The contract is fixed and small (`PROTOCOL.md` `## Core and adapter`); an adapter realises it and nothing more.

## How it's shaped

```text
deny-rules.json   the registry — every guard, as data (intent + class + predicate + params)
tool-map.json     neutral noun → per-platform concrete tool; which return-classes a platform supports
engine.mjs        the shared check engine — holds the PREDICATES; one copy, every platform
claude/shim.mjs   Claude shim: stdin hook payload → engine → verdict JSON on stdout
opencode/         OpenCode shim: normalise.mjs (pure normalise + decide) + plugin.mjs (the
                  single-export entry — async actor lookup, throw-to-deny)
```

The split that makes this work: **rules are data, the check is code.** A deny rule's *intent, class, and parameters* (the role-deny list, the change-verb pattern, the orchestrator-writable prefixes) live in `deny-rules.json`. The *predicate* that decides — "does this path resolve outside the root", "is this an empty write over a non-empty file" — is a function in `engine.mjs`, shared by every platform. So there is exactly one copy of each rule and one copy of each check.

## What a platform adapter does

A platform shim is the only platform-specific code. It:

1. **normalises input** — turns the harness's hook/plugin payload into the neutral shape `{act, path, command, content, spawnTarget, actor, prompt}`;
2. **calls the engine** — `evaluate(input, denyRules)` returns `allow | deny | ask | inject` with a reason;
3. **maps the verdict** to the harness's own mechanism — a Claude `PreToolUse` hook emits the deny/ask JSON; an OpenCode `tool.execute.before` plugin throws on deny.

A class the platform can't realise (OpenCode has no `ask`) **falls back to persona** for those rules — named in each rule's `fallback`, and the honest enforcement map in `PROTOCOL.md` already labels them. Nothing is silently dropped.

## Adding a new platform

Write `<platform>/` only: the input-normaliser, the three-class verdict mapper, and the install glue. Map its tools in `tool-map.json` and its `class_support`. **Zero edits to `engine.mjs`, `deny-rules.json`, or the core.** If a new platform forces an edit to any of those, the boundary leaked — that is the design's one failure condition.

## No regex drift — by construction

The danger: a guard's pattern (the change-verb regex, the ssh idioms, the role-deny list) drifts between the Claude realisation and the OpenCode one, so the *same* command is blocked on one platform and waved through on the other.

Here there is **no second copy to drift**: the patterns live once in `deny-rules.json`, and both shims `import` the same `engine.mjs`, which applies them with the same regex engine at runtime. The residual risk — a shim re-implementing a predicate instead of calling the engine — is held by two mechanical guards in `parity.test.mjs`:

- **Parity** — a shared fixture of `{input → expected verdict}` cases runs through each shim's full path (normalise → engine → verdict); both must return the identical class for every case, bar the one documented actor divergence (orchestrator-content: mechanical on OpenCode, persona on Claude).
- **Single-engine** — a shim must contain no rule logic of its own (only input-normalising + verdict-mapping); the test greps each shim for inline patterns/role-lists and fails if a rule leaked out of the registry or the engine.

Install glue is in `INSTALL.md` (where each file lands, the Claude hook fragment, the OpenCode plugin entry). The OpenCode entry defines its hook functions inline and imports only the rule logic — a hook imported and re-exported is not registered by the loader. Per-class support is in `tool-map.json`.
