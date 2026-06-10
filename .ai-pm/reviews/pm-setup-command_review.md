## Code review: approved

### Finding 1 — stale command reference (BLOCKER)

**`README.md:37`** — `run **\`setup\`**` is a user-facing instruction telling a reader to issue a command. It was not updated to `run **\`/pm-setup\`**` (or equivalent). Line 39 of the same file was correctly updated to `/pm-setup`, confirming the intent, but line 37 was missed. This is a surviving stale command invocation reference on the public-facing documentation surface; the rename is incomplete.

---

### All other items: pass

**Plan compliance / rename completeness.**
- Staged: `.claude/commands/setup.md` and `.opencode/commands/setup.md` deleted (`git diff --cached`); source files renamed: `src/adapter/commands/setup.body.md` → `pm-setup.body.md`, `src/adapter/claude/commands/setup.fm` → `pm-setup.fm`, `src/adapter/opencode/commands/setup.fm` → `pm-setup.fm`.
- Deployed: `.claude/commands/pm-setup.md` and `.opencode/commands/pm-setup.md` exist and contain the correct bodies (`file:1–6` of each).
- Install scripts: `src/adapter/claude/install-commands.mjs:24–27` and `src/adapter/opencode/install-commands.mjs:27–30` read and write the new names.
- `deny-rules.json:121` — inject intent updated to `/pm-setup`.
- `src/agents/orchestrator.md:28–29`, `.opencode/agents/ai-pm.md:41–42`, `PROTOCOL.md:56` — all `/pm-setup` command references updated.
- `src/adapter/INSTALL.md:44` and `:88` — updated.

**Allowed procedure-name prose (not stale):**
- `PROTOCOL.md:114` — "a reminder to run `setup` first" — names the abstract procedure class in the enforcement taxonomy, not a user command. Accepted as procedure prose.
- `src/agents/orchestrator.md:22` and `.opencode/agents/ai-pm.md:37` — "re-run `setup` or edit the file" — names the procedure, not a command invocation. Accepted as procedure prose.
- `CHANGELOG.md` entries — historical record, explicitly excluded per plan scope.
- `.ai-pm/backlog.md:453` — paused plan, explicitly excluded.

**No behavior change.** The command bodies (`pm-setup.md` for both platforms) are thin pointers to `## Setup` — no dialog copy. `install-commands.test.mjs:53` asserts the pointer is present; `install-commands.test.mjs:56–57` asserts no dialog copy. Body text is unchanged from the old `setup.md` content.

**Tests — strengthened, not weakened.**
- `install-commands.test.mjs:47–48` now asserts `pm-setup.md` (was `setup.md`). The assertion is stronger (exact name match), not loosened.
- Gates: all three test suites pass — `install-commands.test.mjs` 10/10, `parity.test.mjs` 55/55, `neutral-prose.test.mjs` pass.

**Deny hook / merge-gate / engine untouched.** `src/adapter/claude/shim.mjs`, `src/adapter/claude/hooks.json`, `src/adapter/opencode/plugin-entry.mjs`, `src/adapter/opencode/normalise.mjs` — no diff against HEAD.

**Security.** This change touches only command naming and documentation. No new input surfaces, secrets, trust boundaries, or auth paths introduced. No security findings.

**Hygiene.** No placeholders, no invented APIs, no dead code. Comment on `install-commands.mjs:1` correctly states the new name.

---

### Summary

One blocker: `README.md:37` still instructs users to `run **\`setup\`**`. Fix: replace with `run **\`/pm-setup\`**` (matching the corrected line 39). All other surfaces are clean.

---

## Fixup re-review

**Blocker resolved.** `README.md:37` now reads `run **\`/pm-setup\`**` (confirmed by `git diff README.md`; the diff shows the `-` line removing `run **\`setup\`**` and the `+` line adding `run **\`/pm-setup\`**`). `README.md:39` was already correct in the prior review and remains `the \`/pm-setup\` command`.

**Exhaustive class-A sweep — no surviving blockers.**

Every `setup` occurrence across the live surface (root `*.md`, `src/`, `docs/`, `.claude/`, `.opencode/`) was enumerated. No `setup.md` or `setup.fm` filenames remain in the live tree (`find` returned empty). All remaining bare `setup` references are class B:

- `PROTOCOL.md:56` — `**\`setup\`**` names the abstract loop side-tool in the procedure taxonomy ("a neutral procedure, not a platform-specific settings UI"). Not a command invocation.
- `PROTOCOL.md:114` — "a reminder to run `setup` first" — describes what the inject-class nudge conveys internally to the model. Procedure reference, not a user-typed command. Confirmed in prior review; re-confirmed now.
- `src/agents/orchestrator.md:18,22` and `.opencode/agents/ai-pm.md:33,37` — "`setup` writes…" and "re-run `setup` or edit the file" — the orchestrator describing its own procedure section. Not a user-facing command invocation.
- `src/adapter/commands/pm-setup.body.md:1`, `.claude/commands/pm-setup.md:6`, `.opencode/commands/pm-setup.md:6` — all reference the section name `## Setup` as the single home being pointed at. Correct by design.
- `src/modules/registry.json:2` — "the kit `setup` offers" in an internal doc string. Procedure name.
- `docs/architecture.md:104–106` — "setup uses", "setup runs", "invoke setup" — all describe the procedure contract point, not a command string.
- `src/adapter/tool-map.json`, `src/adapter/deny-rules.json`, `src/adapter/*.mjs` — internal identifiers (`promptNeedsSetup`, `no-config-run-setup`, `explicit-setup-command`) and code comments; none are user-facing command strings.

**Gates re-confirmed green this turn:**
- `node src/adapter/install-commands.test.mjs` — 10/10 PASS
- `node src/adapter/parity.test.mjs` — 55/55 PASS
- `node src/quality/neutral-prose.test.mjs` — PASS

**Scope confirmed.** Only `README.md` changed since the prior review (both lines 37 and 39 updated in the same diff; no other files modified).

**Verdict: approved.** The sole blocker is resolved. The rename is complete across all surfaces. No class-A stale references survive. All gates green.
