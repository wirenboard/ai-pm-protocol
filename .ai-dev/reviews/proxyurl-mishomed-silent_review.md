# Code review: APPROVED

Runtime verification: static — diff read against plan end-to-end; suite — build-beat and review-beat quality tools ran green; entrypoint — `node src/adapter/router-launch.test.mjs` 163/163 PASS (10 new), `node src/adapter/install-drift.test.mjs` 40/40 PASS (src↔deployment setup.md sync confirmed via `diff .ai-dev/procedures/setup.md src/agents/procedures/setup.md` → empty), `node src/quality/neutral-prose.test.mjs` PASS, `semgrep --config p/javascript --config p/security-audit` 0/0 findings; exercised — not run (the warning is a stderr print, not a runnable path at this surface).

## Evidence per checklist item

- **Plan adherence:** A (`setup.md:28` — `proxyUrl` removed from PERSONAL inventory, pointer to `model-routes.local.json` added; identical edit in `.ai-dev/procedures/setup.md` and `src/agents/procedures/setup.md`); B (`router-launch.mjs:307–313` new pure `mislaunchedProxyWarning`; called `router-launch.mjs:614–615`); 10 new test cases (`router-launch.test.mjs:127–147`); PATCH version bump `5.64.3`→`5.64.4` (`package.json`); CHANGELOG entry. Nothing extra, nothing missing.

- **Correctness:** `mislaunchedProxyWarning` (`router-launch.mjs:307–313`) is pure — takes config, returns string|null, no I/O. Returns `null` for: absent/non-object config, absent/non-object `launch`, non-string `proxyUrl`, empty/whitespace `proxyUrl` (`.trim()` at `:310`). `main()` calls it with the merged `config` (not `routesConfig`) at `:614`, writes stderr only when non-null at `:615`. No `throw`/`process.exit` — non-blocking as the plan specifies.

- **Invariant 6 (one home):** No second home introduced. `grep -rn "launch\.proxyUrl"` in `src/` returns only the new function (`:310, :312`) and its test (`:127, :143–144`). The rejected "honour the field" option would have created a second source — correctly rejected per the plan's invariant-6 derivation.

- **Invariant 1/3:** No agent/command/module/contract change. Only doc + launcher warning + tests. Merge-gate floor unchanged.

- **Security:** The warning echoes the value via `JSON.stringify(v)` (`:312`) — safe-escaped, no injection. The function is fail-safe on malformed input (null, non-object, non-string, numeric). No new attack surface.

- **Honesty:** CHANGELOG entry accurately states the two-part fix and the rejected option. The plan correctly corrects the report's mis-mechanism (the external-proxy branch is seat-independent, not seat-gated) and grounds the real defect (doc mis-homing + silent no-op). No over-claim.

- **Neutral-prose:** `setup.md` is machine-facing procedure prose (invariant 5); no bare platform primitive introduced. Neutral-prose test PASS.

- **Tests:** 10 new cases cover all fail-safe paths (absent/empty/whitespace/non-string/non-object) and the positive path with shape assertions (home name, field source, echoed value, non-blocking). Warning string is asserted, not just truthy.

- **No findings.** The fix is well-scoped, correctly grounded in invariant 6, and fully verified.

## Review-beat tool results

| Tool | Result |
| --- | --- |
| `node src/quality/neutral-prose.test.mjs` | PASS (0 violations, 36 surfaces scanned) |
| `semgrep --config p/javascript --config p/security-audit` | 0 findings, 84 rules, 149 files |
| `node src/adapter/router-launch.test.mjs` | 163/163 PASS (10 new) |
| `node src/adapter/install-drift.test.mjs` | 40/40 PASS (setup.md src↔deployment sync confirmed) |
| `npx eslint src/adapter/router-launch.mjs src/adapter/router-launch.test.mjs` | clean (Builder-reported) |
| `npx markdownlint-cli2 .ai-dev/procedures/setup.md src/agents/procedures/setup.md` | 0 errors (Builder-reported) |
