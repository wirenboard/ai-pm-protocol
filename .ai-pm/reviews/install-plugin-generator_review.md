## Code review: approve

All six verification items checked; all gates pass. Evidence by item:

---

### 1. Generator correctness

`adapter/opencode/install-plugin.mjs` — confirmed.

- **Comment stripping only.** `generate()` at line 74 strips the leading comment block (`/^(?:\/\/[^\n]*\n|\s*\n)*/`) then prepends the generated-file header. Every non-comment line is carried through by the `rewrite` function or left untouched.
- **Hook bodies verbatim.** The `tool.execute.before` deny body (`plugin-entry.mjs:41–44`), the `chat.message` inject body (`plugin-entry.mjs:54–63`), and `isOrchestrator` (`plugin-entry.mjs:27–35`) are carried through unchanged — the generator touches only the two import specifiers and the `ADAPTER` `path.resolve` call.
- **Rewrite targets.** `resolveRewrite()` at lines 44–64 replaces exactly:
  - `SOURCE_IMPORT_DIR` = `"../../.ai-pm/tooling/adapter"` → `"../../adapter"` in the two `from` specifiers (`plugin-entry.mjs:19–20`).
  - `SOURCE_RESOLVE_SEGS` = `'"..", "..", ".ai-pm", "tooling", "adapter"'` → `'"..", "..", "adapter"'` for the `ADAPTER` constant (`plugin-entry.mjs:22`).
- **Layout detection is sound.** `resolveRewrite()` checks `fs.existsSync(path.join(root, ".ai-pm", "tooling", "adapter"))` first (downstream → no rewrite), then `fs.existsSync(path.join(root, "adapter"))` (dev/this repo → rewrite). The `layout` parameter at line 45 lets a test force either branch without filesystem state.

---

### 2. Behavioral equivalence

`git diff HEAD -- .opencode/plugins/ai-pm.mjs` shows three categories of change:

1. **Two comment blocks added** — the generated-file header (lines 1–2) and the `isOrchestrator` doc comment (lines 10–13 of the new file). Both are inert.
2. **`catch { return false; }` → `catch (_e) { return false; }` (line 20).** The old hand-maintained file omitted the binding; the generator faithfully carries through `catch (_e)` from `plugin-entry.mjs:34`. `_e` is never used; the behavior is identical (optional catch binding, ES2019+). This is the generator aligning the deployed file to its source, not a behavioral change.
3. All import specifiers, the `ADAPTER` path, the `tool.execute.before` body, the `chat.message` body, and the `isOrchestrator` logic are **byte-for-byte identical** to the prior hand-maintained committed file.

Conclusion: no behavioral byte changed. The prior live-verification on opencode 1.17.x (recorded in `CHANGELOG.md` and `adapter/INSTALL.md:61`) carries over. No new live run is required.

---

### 3. Anti-drift test

`adapter/install-plugin.test.mjs` — confirmed on all three sub-items:

- **Byte-identity guard** (line 42): generates to a temp path via `install()`, reads both the temp output and the committed `.opencode/plugins/ai-pm.mjs`, asserts `generated === committed` with strict equality. A hand-edit to either file, or a source change left un-regenerated, fails this check.
- **Both layout directions tested** (lines 50–51 for dev, lines 54–56 for downstream): the dev layout asserts `from "../../adapter/engine.mjs"` is present and no `".ai-pm/tooling/adapter"` path remains; the downstream layout (forced via `generate(ROOT, "downstream")`) asserts the tooling-submodule import path and ADAPTER resolve segments are intact.
- **Registered in `quality/tools.json`** (lines 29–35): id `install-plugin`, `beat: "build"`, command `node adapter/install-plugin.test.mjs`.

---

### 4. Gate results — all pass

| Gate | Result | Count |
|---|---|---|
| `node adapter/parity.test.mjs` | PASS | 55 passed, 0 failed |
| `node adapter/opencode-inject.test.mjs` | PASS | 10 passed, 0 failed |
| `node adapter/install-plugin.test.mjs` | PASS | 6 passed, 0 failed |
| `node adapter/install-model.test.mjs` | PASS | 11 passed, 0 failed |
| `node adapter/install-commands.test.mjs` | PASS | 10 passed, 0 failed |
| `node quality/neutral-prose.test.mjs` | PASS | core is platform-neutral |

---

### 5. Docs single-home

- `adapter/INSTALL.md:54` is the one full treatment of the generator: what it does, the layout param, the byte-identity guard, the re-run trigger. No second copy exists.
- `adapter/tool-map.json:15` (`apply-config._doc`) names `install-plugin` in one sentence and explicitly points to `adapter/INSTALL.md` and the `'Enforce deny + inject'` note — it does not restate the detail. The pattern is point-don't-restate; no duplication violation.
- `adapter/tool-map.json:17` adds the `install-plugin` key to the opencode `apply-config` commands object — the single machine-readable home for "what to run when applying config on OpenCode".
- Whole-surface grep (`grep -rn "install-plugin"`) found no second prose treatment outside the generator's own source comment (its own WHY, the one home) and the test's own comment. No orphaned pointer; no accumulated copy.

---

### 6. Scope

Changed files: `adapter/opencode/install-plugin.mjs` (new), `adapter/install-plugin.test.mjs` (new), `.opencode/plugins/ai-pm.mjs` (regenerated), `quality/tools.json` (new row), `adapter/INSTALL.md` (one-sentence update), `adapter/tool-map.json` (doc + key added). No hook logic, no engine, no deny-rules, no other adapter files touched.
