# Fixup review — quality-sweep quick-wins (`6f019e8`, trivial mode)

Commit `6f019e8` on `feature/opencode-harness-support`. Two test-hygiene quick-wins from the 2026-06-08 quality sweep: (1) `tests/opencode.sh` extracts the `$ORCH` persona body ONCE into `$ORCH_BODY`, reused by the four body-grep sections; (2) `tests/oc-plugin-unit.js` outer-IIFE `.catch()` routes through `finish()`.

## Four fixup conditions
- [x] **1. Diff ≤ 50 lines.** `git show --numstat`: state file 1+/0, `oc-plugin-unit.js` 2+/2-, `opencode.sh` 7+/4- → ~15 code-relevant lines. Well under 50.
- [x] **2. No user-visible behavior change (test internals only).** `$ORCH_BODY` extraction is guarded by `[ -f "$ORCH" ]`, so it only assigns when the file exists. All four consumers (`obody`/`fbody`/`cbody`/`dbody`) live inside the `else` branch of their own `if [ ! -f "$ORCH" ]` guard — they execute only when `$ORCH` exists, i.e. only when `ORCH_BODY` is assigned. Absent-file guard semantics preserved (the `fail` branch still fires on absence). No other consumer of these vars (grep confirmed). The `.catch()` change is happy-path-identical: `finish()` runs the same cleanup + exits 1 on `fail++`; the only difference is a mid-suite throw now also prints the `Total:` summary instead of bypassing it.
- [x] **3. No `docs/`/`stack-notes.md` touch.** Only `.ai-pm/state/current.md` (bookkeeping), `tests/oc-plugin-unit.js`, `tests/opencode.sh`.
- [x] **4. No new source file.** All three paths pre-existing; pure edits.

All four hold → no trivial-fixup violation.

## Trivial DoD
- [x] **Scope respected.** Only the two named cleanups. The unrelated `crbody` awk (~746, file `$CR`) left untouched, confirmed absent from the `ORCH_BODY` consumer set. No other test or shipped artifact touched.
- [x] **Pipeline green.** Re-ran: `opencode.sh` 36/36, `oc-plugin-unit.js` 54/54 — both match the brief. No assertion regressed.

(Product Contract / stack-spec / Impact Report skipped per trivial mode. No product/technical notes per trivial mode.)

## Verdict
approve
