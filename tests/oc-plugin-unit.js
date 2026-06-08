// tests/oc-plugin-unit.js — deterministic, CI-safe unit test for the OpenCode
// CORE enforcement plugin's tool.execute.before hook
// (opencode-harness-support, stage (a), slice 3 — case `oc-enforcement-plugin-throws`;
// slice 5 — ESM-load rework + `oc-plugin-esm-loadable` regression guard;
// slice 15 — the two ACTOR/PATH-aware write guards: (f) out-of-root write deny
// for ALL actors, (g) orchestrator content-authoring deny with subagents exempt.
// The hook now reads input.sessionID and does an actor lookup via
// ctx.client.session.get; this test injects a MOCK ctx whose session.get returns
// a chosen {data:{agent,parentID}} to drive BOTH the orchestrator (no parentID /
// agent `ai-pm`) and a subagent (parentID set), plus a fail-open lookup case).
//
// NO LLM, NO OpenCode runtime, NO network. It loads the GENERATED plugin
// (.opencode/plugin/ai-pm-enforcement.js) THE WAY OPENCODE DOES — as an ES
// module — and exercises its hook:
//
//   1. Copy the generated plugin to a temp `.mjs` file and `import()` it
//      dynamically (matching the runtime's ESM load; a plain `require()` of the
//      CommonJS shape is NOT how OpenCode loads, which is exactly the slice-5
//      bug the old test missed).
//   2. LOAD-SHAPE GUARD (`oc-plugin-esm-loadable`): assert the plugin entry
//      export `AiPmEnforcement` is a function AND that the module exposes no
//      non-function export (OpenCode treats EVERY export as a plugin function, so
//      a non-function export — e.g. the old exported `WB_DENY_ROLES` array —
//      makes the real runtime fail with "Plugin export is not a function — failed
//      to load plugin"). This guard would have caught the slice-5 defect.
//   3. CALL `AiPmEnforcement({ directory: <tmp project root> })` to obtain the
//      `tool.execute.before` hook, then run SYNTHETIC (input, output) pairs,
//      asserting it THROWS for each deny case (wb-* task, wb-* skill, out-of-root
//      read, truncating write, and a `find` with an absolute path outside the
//      root) and ALLOWS the legitimate cases (incl. relative/in-root `find` and
//      a non-find bash command). The OpenCode tool/arg shapes used here are the
//      ones the 1.16.2 runtime passes (task.subagent_type, skill.name,
//      read.filePath, write.filePath+content, bash.command) and the documented
//      plugin contract
//      (https://opencode.ai/docs/plugins/ — throwing in tool.execute.before
//      blocks the call).
//
// The live subagent-containment truth came from Spike B (recorded in
// .ai-pm/state/current.md); the live ESM-load-success came from a real
// `opencode run` (slice 5). This test is the deterministic form/behavior guard
// for the hook's logic AND its load shape, run in CI without OpenCode.
//
// Exit 0 if every assertion holds; non-zero with a diagnostic otherwise.

"use strict";

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const url = require("node:url");

const ROOT = process.cwd();
const PLUGIN = path.join(ROOT, ".opencode", "plugin", "ai-pm-enforcement.js");

let pass = 0;
let fail = 0;
function ok(name) { console.log("PASS: " + name); pass++; }
function bad(name, detail) { console.log("FAIL: " + name + (detail ? " — " + detail : "")); fail++; }

if (!fs.existsSync(PLUGIN)) {
  console.error("FAIL: generated plugin missing at " + PLUGIN + " (run gen/generate.py --harness opencode)");
  process.exit(1);
}

// Scratch dir: the temp .mjs copy (ESM load) + the read/write boundary cases.
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "oc-plugin-unit-"));

(async () => {
  // --- (1) Load the plugin the way OpenCode does: ESM dynamic import of an .mjs
  //     copy of the GENERATED file. Copying to `.mjs` forces ESM parsing
  //     regardless of any package.json "type", exactly as the runtime treats a
  //     plugin module. ---
  const mjs = path.join(SCRATCH, "ai-pm-enforcement.mjs");
  fs.copyFileSync(PLUGIN, mjs);

  let mod;
  try {
    mod = await import(url.pathToFileURL(mjs).href);
  } catch (e) {
    bad("oc-plugin-esm-loadable: the generated plugin imports cleanly as an ES module", e && e.message);
    finish();
    return;
  }

  // --- (2) LOAD-SHAPE GUARD `oc-plugin-esm-loadable`: the regression guard for
  //     the slice-5 bug. OpenCode treats EACH export of a plugin module as a
  //     plugin function, so (a) the plugin entry export must be a function, and
  //     (b) NO export may be a non-function (an exported array/object/string is
  //     what produced "Plugin export is not a function — failed to load plugin").
  const exportNames = Object.keys(mod).filter((k) => k !== "default");
  const entry = mod.AiPmEnforcement;
  if (typeof entry !== "function") {
    bad("oc-plugin-esm-loadable: the plugin entry export `AiPmEnforcement` is a function",
        "typeof AiPmEnforcement === " + typeof entry);
  } else {
    ok("oc-plugin-esm-loadable: the plugin entry export `AiPmEnforcement` is a function");
  }

  const nonFnExports = exportNames.filter((k) => typeof mod[k] !== "function");
  if (nonFnExports.length > 0) {
    bad("oc-plugin-esm-loadable: the plugin module exposes no non-function export (OpenCode would fail to load it)",
        "non-function exports: " + JSON.stringify(nonFnExports));
  } else {
    ok("oc-plugin-esm-loadable: every export of the plugin module is a function (no array/object export to break the ESM plugin load)");
  }

  // If the load shape is already broken, the behavior assertions cannot run
  // meaningfully — but we still try, to surface as much as possible.
  if (typeof entry !== "function") { finish(); return; }

  // --- (3) Obtain the hook by calling the plugin with a synthetic ctx, the way
  //     the runtime calls it (ctx.directory = the session's project root). The
  //     slice-15 guards need an ACTOR lookup, so ctx now carries a MOCK
  //     `client.session.get` returning a chosen `{data:{agent,parentID}}`: we
  //     build TWO ctxs — one resolving to the ORCHESTRATOR (no parentID / agent
  //     `ai-pm`), one to a SUBAGENT (parentID set) — and drive both. ---
  function makeCtx(actor) {
    // actor: "orchestrator" -> {agent:"ai-pm", parentID:null};
    //        "subagent"     -> {agent:"pm-coder", parentID:"ses_parent"}
    const data = actor === "orchestrator"
      ? { agent: "ai-pm", parentID: null }
      : { agent: "pm-coder", parentID: "ses_parent" };
    return {
      directory: SCRATCH,
      client: { session: { get: async (_q) => ({ data }) } },
    };
  }

  async function hookFor(actor) {
    const hooks = await entry(makeCtx(actor));
    return hooks && hooks["tool.execute.before"];
  }

  const hookOrch = await hookFor("orchestrator");
  const hookSub = await hookFor("subagent");
  // The legacy assertions (deny-set parity + the in-root content allow cases) use
  // the SUBAGENT hook as the default: the parity DENY cases (wb-* task/skill,
  // out-of-root read, truncating write, find) are actor-agnostic so either hook
  // denies them identically, while the legacy ALLOW cases write in-root content
  // (authored.md, brand-new.md) which only a SUBAGENT may author — the orchestrator
  // is now barred by guard (g), so those must run under the subagent hook. The
  // slice-15 cases pass an explicit hook (hookOrch / hookSub) per assertion.
  const hook = hookSub;
  if (typeof hook !== "function" || typeof hookSub !== "function") {
    bad("oc-enforcement-plugin-throws: the plugin returns a tool.execute.before hook function",
        "got typeof " + typeof hook + " / " + typeof hookSub);
    finish();
    return;
  }

  // The single-source role set is internal now (not exported). Use a known wb-*
  // role literal for the deny assertions — it must match the injected set; the
  // separate `oc-enforcement-plugin-single-source` test asserts the injected set
  // equals settings.json. We read one role out of the generated plugin text so
  // this test stays in step with whatever was injected, without importing it.
  const pluginText = fs.readFileSync(PLUGIN, "utf8");
  const roleMatch = pluginText.match(/const WB_DENY_ROLES = (\[[^\]]*\]);/);
  if (!roleMatch) {
    bad("oc-enforcement-plugin-throws: could not read the injected WB_DENY_ROLES from the generated plugin");
    finish();
    return;
  }
  const denyRoles = JSON.parse(roleMatch[1]);
  if (!Array.isArray(denyRoles) || denyRoles.length === 0) {
    bad("oc-enforcement-plugin-throws: the injected WB_DENY_ROLES is empty");
    finish();
    return;
  }
  const DENIED_ROLE = denyRoles[0];

  // The hook now reads input.sessionID (for the actor lookup); supply a fixed id.
  // `h` defaults to the orchestrator hook so the legacy calls are unchanged.
  async function assertThrows(name, tool, args, h) {
    try {
      await (h || hook)({ tool, sessionID: "ses_test" }, { args });
      bad(name, "expected a throw (deny), but the hook allowed the call");
    } catch (e) {
      ok(name);
    }
  }
  async function assertAllows(name, tool, args, h) {
    try {
      await (h || hook)({ tool, sessionID: "ses_test" }, { args });
      ok(name);
    } catch (e) {
      bad(name, "expected the hook to allow, but it threw: " + (e && e.message));
    }
  }

  // (a) wb-* task spawn -> DENY.
  await assertThrows(
    "oc-enforcement-plugin-throws: (a) wb-* task spawn is denied",
    "task",
    { subagent_type: DENIED_ROLE }
  );

  // (b) wb-* skill load -> DENY.
  await assertThrows(
    "oc-enforcement-plugin-throws: (b) wb-* skill load is denied",
    "skill",
    { name: DENIED_ROLE }
  );

  // (c) read outside the project root -> DENY.
  await assertThrows(
    "oc-enforcement-plugin-throws: (c) read outside project root is denied",
    "read",
    { filePath: "/etc/passwd" }
  );

  // (d) truncating write over an existing non-empty file -> DENY.
  const victim = path.join(SCRATCH, "authored.md");
  fs.writeFileSync(victim, "real authored content that must not be zeroed\n");
  await assertThrows(
    "oc-enforcement-plugin-throws: (d) empty/whitespace write over an existing non-empty file is denied",
    "write",
    { filePath: victim, content: "   \n\t  " }
  );

  // (e) bash `find` with an absolute path argument OUTSIDE the project root ->
  //     DENY (the find-boundary guard ported from the Claude settings.json Bash
  //     matcher; clear-DENY parity).
  await assertThrows(
    "oc-enforcement-plugin-throws: (e) bash `find /etc -name x` (absolute path outside root) is denied",
    "bash",
    { command: "find /etc -name x" }
  );

  // --- ALLOW cases (the hook must not over-block) ---

  // A pm-* task spawn -> ALLOW (not in the deny set).
  await assertAllows(
    "oc-enforcement-plugin-allows: a pm-* task spawn is allowed",
    "task",
    { subagent_type: "pm-coder" }
  );

  // An ordinary read inside the project root -> ALLOW.
  const insideFile = path.join(SCRATCH, "inside.md");
  fs.writeFileSync(insideFile, "x\n");
  await assertAllows(
    "oc-enforcement-plugin-allows: an in-root read is allowed",
    "read",
    { filePath: insideFile }
  );

  // A normal write (non-empty content) over the existing file -> ALLOW.
  await assertAllows(
    "oc-enforcement-plugin-allows: a write with real content is allowed",
    "write",
    { filePath: victim, content: "new real content\n" }
  );

  // A write creating a NEW file with empty content -> ALLOW (no truncation: the
  // file does not yet exist, so nothing authored is zeroed).
  await assertAllows(
    "oc-enforcement-plugin-allows: an empty write creating a new (non-existent) file is allowed",
    "write",
    { filePath: path.join(SCRATCH, "brand-new.md"), content: "" }
  );

  // A relative `find` (no absolute first arg) -> ALLOW (the find-boundary guard
  // gates only an absolute path resolving outside root).
  await assertAllows(
    "oc-enforcement-plugin-allows: bash `find . -name x` (relative, no absolute arg) is allowed",
    "bash",
    { command: "find . -name x" }
  );

  // A `find` rooted at a path INSIDE the project root -> ALLOW.
  await assertAllows(
    "oc-enforcement-plugin-allows: bash `find <root-relative absolute> ...` (inside root) is allowed",
    "bash",
    { command: "find " + path.join(SCRATCH, "sub") + " -name x" }
  );

  // A non-find bash command -> ALLOW (this guard gates only the find boundary;
  // the "ask"-class bash guards are not ported in this slice).
  await assertAllows(
    "oc-enforcement-plugin-allows: a non-find bash command is allowed",
    "bash",
    { command: "echo hello && ls -la" }
  );

  // ====================================================================
  // SLICE 15 — the two structural write guards (actor/path-aware).
  // ====================================================================

  // --- (f) OUT-OF-ROOT WRITE DENY — applies to ALL actors (orchestrator AND
  //     subagent). The boundary is actor-agnostic. ---

  // write tool to /tmp/x -> DENY for BOTH actors.
  await assertThrows(
    "oc-slice15-(f): orchestrator `write` to /tmp/x (out of root) is denied",
    "write", { filePath: "/tmp/oc-plugin-out-of-root-x", content: "data\n" }, hookOrch
  );
  await assertThrows(
    "oc-slice15-(f): subagent `write` to /tmp/x (out of root) is denied",
    "write", { filePath: "/tmp/oc-plugin-out-of-root-x", content: "data\n" }, hookSub
  );

  // edit tool to /tmp/x -> DENY for BOTH actors.
  await assertThrows(
    "oc-slice15-(f): orchestrator `edit` to /tmp/x (out of root) is denied",
    "edit", { filePath: "/tmp/oc-plugin-out-of-root-y" }, hookOrch
  );
  await assertThrows(
    "oc-slice15-(f): subagent `edit` to /tmp/x (out of root) is denied",
    "edit", { filePath: "/tmp/oc-plugin-out-of-root-y" }, hookSub
  );

  // bash `echo x > /tmp/y` -> DENY for BOTH actors.
  await assertThrows(
    "oc-slice15-(f): orchestrator bash `echo x > /tmp/y` (out of root) is denied",
    "bash", { command: "echo x > /tmp/oc-plugin-out-of-root-z" }, hookOrch
  );
  await assertThrows(
    "oc-slice15-(f): subagent bash `echo x > /tmp/y` (out of root) is denied",
    "bash", { command: "echo x > /tmp/oc-plugin-out-of-root-z" }, hookSub
  );

  // --- (g) ORCHESTRATOR CONTENT-AUTHORING DENY — the orchestrator may NOT author
  //     content paths (source / canonical docs); a SUBAGENT may. Allowlist for the
  //     orchestrator = .ai-pm/** + doc/features/**. ---

  // A content write (src/foo.ts) -> DENY for the orchestrator, ALLOW for a subagent.
  await assertThrows(
    "oc-slice15-(g): orchestrator `write` to src/foo.ts (content path) is denied",
    "write", { filePath: path.join(SCRATCH, "src", "foo.ts"), content: "export const x=1;\n" }, hookOrch
  );
  await assertAllows(
    "oc-slice15-(g): subagent `write` to src/foo.ts (content path) is ALLOWED",
    "write", { filePath: path.join(SCRATCH, "src", "foo.ts"), content: "export const x=1;\n" }, hookSub
  );

  // A canonical-doc write (docs/architecture.md) -> DENY for the orchestrator.
  await assertThrows(
    "oc-slice15-(g): orchestrator `write` to docs/architecture.md (canonical doc) is denied",
    "write", { filePath: path.join(SCRATCH, "docs", "architecture.md"), content: "# arch\n" }, hookOrch
  );
  await assertAllows(
    "oc-slice15-(g): subagent `write` to docs/architecture.md (canonical doc) is ALLOWED",
    "write", { filePath: path.join(SCRATCH, "docs", "architecture.md"), content: "# arch\n" }, hookSub
  );

  // The orchestrator's OWN artifacts -> ALLOW for the orchestrator.
  //   .ai-pm/state/current.md (bookkeeping)
  await assertAllows(
    "oc-slice15-(g): orchestrator `write` to .ai-pm/state/current.md (own bookkeeping) is allowed",
    "write", { filePath: path.join(SCRATCH, ".ai-pm", "state", "current.md"), content: "state\n" }, hookOrch
  );
  //   doc/features/x_plan.md (its plan)
  await assertAllows(
    "oc-slice15-(g): orchestrator `write` to doc/features/x_plan.md (its plan) is allowed",
    "write", { filePath: path.join(SCRATCH, "doc", "features", "x_plan.md"), content: "# plan\n" }, hookOrch
  );

  // bash content-write via redirect (the live `cat > src/...` bypass) -> DENY for
  // the orchestrator, ALLOW for a subagent.
  await assertThrows(
    "oc-slice15-(g): orchestrator bash `echo x > src/foo.ts` (content path, the cat-bypass) is denied",
    "bash", { command: "echo x > " + path.join(SCRATCH, "src", "foo.ts") }, hookOrch
  );
  await assertAllows(
    "oc-slice15-(g): subagent bash `echo x > src/foo.ts` (content path) is ALLOWED",
    "bash", { command: "echo x > " + path.join(SCRATCH, "src", "foo.ts") }, hookSub
  );

  // bash content-write to the orchestrator's OWN artifact -> ALLOW for the orchestrator.
  await assertAllows(
    "oc-slice15-(g): orchestrator bash `echo x >> .ai-pm/backlog.md` (own bookkeeping) is allowed",
    "bash", { command: "echo x >> " + path.join(SCRATCH, ".ai-pm", "backlog.md") }, hookOrch
  );

  // ====================================================================
  // SLICE 15 — bashWriteTargets parser hardening (review-loop fix pass).
  //   DEFECT 1 (over-deny): a `>` that lives only INSIDE a quoted string, an
  //   arithmetic `(( a > b ))`, or a `[[ a > b ]]` test is NOT a redirection and
  //   must not be extracted as a write target — else legitimate work (including
  //   the orchestrator's own .ai-pm bookkeeping) is falsely denied.
  //   DEFECT 2 (under-deny): a cp/mv destination must be read UP TO any trailing
  //   redirect, so a `cp src /out/dest > log` no longer lets `log` hijack the
  //   destination and leave the real out-of-root `/out/dest` unchecked.
  // ====================================================================

  // DEFECT 1 — guard (g): a quoted `>` inside `printf 'a > b\n'` is not a target;
  // the genuine `>> .ai-pm/backlog.md` redirect is the orchestrator's OWN
  // bookkeeping -> ALLOWED (no phantom `b` target, no false denial).
  await assertAllows(
    "oc-slice15-fix1-(g): orchestrator bash `printf 'a > b\\n' >> .ai-pm/backlog.md` (quoted `>` is not a target) is allowed",
    "bash", { command: "printf 'a > b\\n' >> " + path.join(SCRATCH, ".ai-pm", "backlog.md") }, hookOrch
  );

  // DEFECT 1 — guard (g): an arithmetic `(( a > b ))` comparison has no
  // redirection -> ALLOWED for the orchestrator.
  await assertAllows(
    "oc-slice15-fix1-(g): orchestrator bash `if (( a > b )); then echo hi; fi` (arithmetic `>`, not a redirect) is allowed",
    "bash", { command: "if (( a > b )); then echo hi; fi" }, hookOrch
  );

  // DEFECT 1 — guard (f): a literal `>` and an absolute path inside a quoted
  // echo string are not a write target -> ALLOWED for a subagent (and so for
  // every actor; the boundary guard must not fire on quoted text).
  await assertAllows(
    "oc-slice15-fix1-(f): subagent bash `echo \"see > /etc/passwd for x\"` (quoted `>` + quoted path, not a target) is allowed",
    "bash", { command: 'echo "see > /etc/passwd for x"' }, hookSub
  );

  // DEFECT 1 — masking must NOT regress a genuine redirect to a QUOTED path: the
  // quoted token immediately after `>` is still captured as the target. Here the
  // quoted path is out-of-root -> DENY for a subagent (guard f).
  await assertThrows(
    "oc-slice15-fix1-(f): subagent bash `echo x > \"/tmp/oc q.txt\"` (quoted out-of-root redirect target) is still denied",
    "bash", { command: 'echo x > "/tmp/oc-plugin-quoted out.txt"' }, hookSub
  );

  // DEFECT 2 — guard (f): the REAL out-of-root cp destination is no longer
  // hijacked by a trailing redirect token. `cp data /tmp/oc-dest.txt > log`
  // (with /tmp/... clearly outside the SCRATCH root) -> DENY for a subagent.
  await assertThrows(
    "oc-slice15-fix2-(f): subagent bash `cp data /tmp/oc-dest.txt > log` (trailing redirect no longer hides the real out-of-root cp dest) is denied",
    "bash", { command: "cp data /tmp/oc-plugin-cp-dest.txt > " + path.join(SCRATCH, ".ai-pm", "log") }, hookSub
  );

  // POSITIVE guard (the masking/cut-at-redirect must NOT regress genuine
  // redirects): orchestrator `echo x > src/foo.ts` still DENIED (guard g),
  // subagent `echo x > /tmp/y` still DENIED (guard f). (Both also asserted
  // above; restated here as the fix-pass regression anchor.)
  await assertThrows(
    "oc-slice15-fix-regress-(g): orchestrator bash `echo x > src/foo.ts` (genuine redirect to content path) is still denied",
    "bash", { command: "echo x > " + path.join(SCRATCH, "src", "foo.ts") }, hookOrch
  );
  await assertThrows(
    "oc-slice15-fix-regress-(f): subagent bash `echo x > /tmp/y` (genuine out-of-root redirect) is still denied",
    "bash", { command: "echo x > /tmp/oc-plugin-regress-y" }, hookSub
  );

  // A pure git op the orchestrator runs (git writes its own files) -> ALLOW.
  await assertAllows(
    "oc-slice15-(g): orchestrator bash `git commit` (pure git op) is allowed",
    "bash", { command: "git add -A && git commit -m x" }, hookOrch
  );

  // FAIL-OPEN on actor: if the session lookup throws, treat as a subagent (no
  // false denial). A content write under a ctx whose client.session.get throws is
  // ALLOWED (the (g) guard cannot confirm the orchestrator, so it does not fire;
  // (f) still applies — this target is in-root so it passes).
  const failOpenHooks = await entry({
    directory: SCRATCH,
    client: { session: { get: async () => { throw new Error("lookup boom"); } } },
  });
  await assertAllows(
    "oc-slice15-(g): a content write under a FAILED actor lookup is allowed (fail-open on actor; no false denial)",
    "write", { filePath: path.join(SCRATCH, "src", "bar.ts"), content: "x\n" },
    failOpenHooks["tool.execute.before"]
  );
  // ...but (f) out-of-root STILL fires under a failed actor lookup (boundary is
  // actor-agnostic; no lookup needed).
  await assertThrows(
    "oc-slice15-(f): an out-of-root write under a FAILED actor lookup is STILL denied (boundary needs no actor)",
    "write", { filePath: "/tmp/oc-plugin-failopen-x", content: "x\n" },
    failOpenHooks["tool.execute.before"]
  );

  // ====================================================================
  // ANTI-CORNER-CUTTING piece 2 — the pre-ship MERGE GATE (h) + the pre-code
  //   downgrade note. These gates read fixture artifacts off the SCRATCH project
  //   root (.ai-pm/reviews/<topic>_review.md, doc/features/<topic>_plan.md) and a
  //   synthetic .git/HEAD, exercised through the same synthetic (input,output)
  //   pairs + mock ctx as the slice-15 cases. The gate rests on the
  //   tool.execute.before throw-to-deny contract + the per-instance subagent-
  //   containment fact (stack-notes (4b)):
  //     https://opencode.ai/docs/plugins/
  //     https://github.com/anomalyco/opencode/issues/5894
  // ====================================================================

  // Fixture helper: write `.ai-pm/reviews/<topic>_review.md` with the given
  // stamp-line text (or omit the file when `stamp === null`).
  function writeReview(topic, body) {
    const dir = path.join(SCRATCH, ".ai-pm", "reviews");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, topic + "_review.md"), body);
  }

  // oc-gate-merge-deny-unstamped — intent: an orchestrator `git merge
  // feature/<topic>` whose review artifact is ABSENT is denied (no reviewer ran).
  // Scenario 5. Stack-notes (4b)/(plugins) throw-to-deny contract:
  //   https://github.com/anomalyco/opencode/issues/5894
  //   https://opencode.ai/docs/plugins/
  await assertThrows(
    "oc-gate-merge-deny-unstamped: orchestrator `git merge feature/<topic>` with a MISSING review artifact is denied",
    "bash", { command: "git merge feature/oc-gate-absent" }, hookOrch
  );

  // oc-gate-merge-allow-stamped — intent: the same merge is ALLOWED once the
  // review artifact carries a satisfied `## Code review:` stamp (no false denial).
  // Scenario 7.
  writeReview("oc-gate-stamped",
    "## Verdict\n\napprove\n\n## Code review: 2026-06-08 — passed\n");
  await assertAllows(
    "oc-gate-merge-allow-stamped: orchestrator `git merge feature/<topic>` with a SATISFIED `## Code review:` stamp is allowed",
    "bash", { command: "git merge feature/oc-gate-stamped" }, hookOrch
  );

  // oc-gate-partial-stamp-denied — intent (interaction scenario 3): a PARTIALLY
  // stamped artifact (plan-checker `## Verdict` present but the Pass-2
  // `## Code review:` line still `NOT YET RUN`) is read as UNSATISFIED -> deny, so
  // a half-stamped artifact left by a failed run cannot be misread as satisfied.
  writeReview("oc-gate-partial",
    "## Verdict\n\napprove\n\n## Code review: NOT YET RUN\n");
  await assertThrows(
    "oc-gate-partial-stamp-denied: orchestrator merge of a PARTIALLY-stamped review (Verdict present, `## Code review: NOT YET RUN`) is denied",
    "bash", { command: "git merge feature/oc-gate-partial" }, hookOrch
  );

  // oc-gate-bookkeeping-still-allowed — intent (s15 regression guard, scenario 7):
  // a non-feature merge (`git merge main`) and the orchestrator's own `.ai-pm`
  // bookkeeping writes stay ALLOWED — the gate fails open on a non-feature topic.
  await assertAllows(
    "oc-gate-bookkeeping-still-allowed: orchestrator `git merge main` (non-feature, unresolvable topic) is allowed (fail-open)",
    "bash", { command: "git merge main" }, hookOrch
  );
  await assertAllows(
    "oc-gate-bookkeeping-still-allowed: orchestrator `.ai-pm/state` bookkeeping write stays allowed (s15 regression)",
    "write", { filePath: path.join(SCRATCH, ".ai-pm", "state", "current.md"), content: "state\n" }, hookOrch
  );

  // Fail-open on a feature merge by a NON-orchestrator actor: the gate applies
  // only in the ship (orchestrator) session — a subagent merge with an absent
  // review is NOT denied by (h) (no false denial outside the ship boundary).
  await assertAllows(
    "oc-gate-merge-nonorch-failopen: a SUBAGENT `git merge feature/<topic>` (absent review) is NOT denied by the pre-ship gate (orchestrator-session-scoped)",
    "bash", { command: "git merge feature/oc-gate-absent" }, hookSub
  );

  // oc-gate-precode-no-plan-deny — DOWNGRADED to a persona rule (no clean
  // structural write->topic signal; a "zero plans" proxy would contradict the s15
  // (g) invariant that a subagent authors content legitimately). The plugin does
  // NOT deny a pm-coder content write for a planless topic; the persona owns "a
  // plan precedes code" and the deny-side FLOOR is the pre-ship merge gate (h)
  // above. This case PINS the downgrade: a pm-coder content write with no plan on
  // disk is ALLOWED at the plugin layer (so the s15 (g) subagent-authoring
  // behavior is unchanged). See the (i) note in the plugin template.
  await assertAllows(
    "oc-gate-precode-no-plan-allowed-by-plugin: a pm-coder content write with no plan is allowed at the plugin layer (pre-code gate is persona-only; downgraded — see plugin (i) note)",
    "write", { filePath: path.join(SCRATCH, "src", "precode.ts"), content: "export const x=1;\n" }, hookSub
  );

  // ====================================================================
  // REVIEW-FIX PASS (orchestrator-anti-corner-cutting-p12) — defects in the
  //   pre-ship merge gate (h) found by Pass-2 code-review.
  //   FIX 1 (false-allow): an EMPTY `## Code review:` heading (the words
  //     `NOT YET RUN` deleted) used to pass — the "skeleton looks filled" bypass.
  //     Satisfied now requires NON-EMPTY content (and not `NOT YET RUN`).
  //   FIX 2 (false-deny on documentation-kind): a documentation-kind review file
  //     carries `## Validation:` and NO `## Code review:` line; the gate must
  //     accept the `## Validation:` stamp too.
  //   FIX 3 (false-deny): a refspec topic `git push origin feature/foo:main` used
  //     to extract topic `foo:main` (terminator class didn't stop at `:`).
  // ====================================================================

  // FIX 1 — an EMPTY `## Code review:` heading (nothing after the colon) is the
  //   "skeleton looks filled" bypass -> still DENY.
  writeReview("oc-gate-empty-heading",
    "## Verdict\n\napprove\n\n## Code review:\n");
  await assertThrows(
    "oc-gate-empty-stamp-denied: orchestrator merge with an EMPTY `## Code review:` heading (NOT YET RUN deleted, nothing after the colon) is denied",
    "bash", { command: "git merge feature/oc-gate-empty-heading" }, hookOrch
  );
  // ...and a whitespace-only heading is equally empty -> DENY.
  writeReview("oc-gate-ws-heading",
    "## Verdict\n\napprove\n\n## Code review:   \t\n");
  await assertThrows(
    "oc-gate-empty-stamp-denied: orchestrator merge with a WHITESPACE-ONLY `## Code review:` heading is denied",
    "bash", { command: "git merge feature/oc-gate-ws-heading" }, hookOrch
  );

  // FIX 1 — a real `FIXED — <sha>` stamp (no `— passed` token) is a legitimate
  //   stamp -> ALLOW (the rule must not require a rigid `— passed`).
  writeReview("oc-gate-fixed-stamp",
    "## Verdict\n\napprove\n\n## Code review: FIXED — abc123\n");
  await assertAllows(
    "oc-gate-fixed-stamp-allowed: orchestrator merge with `## Code review: FIXED — abc123` (real non-`passed` content) is allowed",
    "bash", { command: "git merge feature/oc-gate-fixed-stamp" }, hookOrch
  );
  // ...and the `<date> — passed` form is likewise allowed (explicit, in addition
  //   to oc-gate-merge-allow-stamped above).
  writeReview("oc-gate-date-passed",
    "## Verdict\n\napprove\n\n## Code review: 2026-06-08 — passed\n");
  await assertAllows(
    "oc-gate-date-passed-allowed: orchestrator merge with `## Code review: <date> — passed` is allowed",
    "bash", { command: "git merge feature/oc-gate-date-passed" }, hookOrch
  );

  // FIX 2 — a DOCUMENTATION-kind review file: only a satisfied `## Validation:`
  //   line, NO `## Code review:` line -> ALLOW (no false denial of a validated
  //   documentation-kind merge).
  writeReview("oc-gate-validation-only",
    "## Verdict\n\napprove\n\n## Validation: 2026-06-08 — editorial + clean-grep — passed\n");
  await assertAllows(
    "oc-gate-validation-only-allowed: orchestrator merge with ONLY a satisfied `## Validation:` line (documentation-kind, no `## Code review:`) is allowed",
    "bash", { command: "git merge feature/oc-gate-validation-only" }, hookOrch
  );
  // ...but an EMPTY `## Validation:` heading is equally unsatisfied -> DENY
  //   (the non-empty/not-NYR rule applies to the Validation stamp too).
  writeReview("oc-gate-validation-empty",
    "## Verdict\n\napprove\n\n## Validation:\n");
  await assertThrows(
    "oc-gate-validation-empty-denied: orchestrator merge with an EMPTY `## Validation:` heading is denied",
    "bash", { command: "git merge feature/oc-gate-validation-empty" }, hookOrch
  );

  // FIX 3 — refspec topic mis-extraction: `git push origin feature/foo:main` must
  //   resolve topic `foo` (terminator stops at `:`), so a stamped `foo_review.md`
  //   ALLOWS the push (it must NOT look for a `foo:main_review.md` and fall
  //   through to a missing-artifact deny). A stamped artifact under the true topic.
  writeReview("oc-gate-refspec",
    "## Verdict\n\napprove\n\n## Code review: 2026-06-08 — passed\n");
  await assertAllows(
    "oc-gate-refspec-topic-allowed: orchestrator `git push origin feature/oc-gate-refspec:main` (refspec) resolves topic `oc-gate-refspec` (stops at `:`) and is allowed with its stamped review",
    "bash", { command: "git push origin feature/oc-gate-refspec:main" }, hookOrch
  );
  // ...and the same refspec is still DENIED when the resolved topic's review is
  //   ABSENT (proving the topic resolves to `oc-gate-refspec-missing`, not to a
  //   `…:main` artifact that happens not to exist for an unrelated reason).
  await assertThrows(
    "oc-gate-refspec-topic-denied: orchestrator `git push origin feature/oc-gate-refspec-missing:main` (refspec, topic `oc-gate-refspec-missing`) with a MISSING review is denied",
    "bash", { command: "git push origin feature/oc-gate-refspec-missing:main" }, hookOrch
  );

  // ====================================================================
  // ANTI-CORNER-CUTTING piece 0b — isOrchestratorAuthorable hardening.
  //   (B) close the SELF-PATCH HOLE: `.ai-pm/tooling/**` (the protocol submodule —
  //       the enforcer's own source + the deployed adapter reachable via the
  //       `.opencode/{plugin,agent,command}` symlinks) is NO LONGER orchestrator-
  //       authorable. The `.ai-pm/` exemption is now "under `.ai-pm/` EXCEPT
  //       `.ai-pm/tooling/**`". This stops the live orchestrator editing the
  //       deployed plugin to route around its own guard.
  //   (A) FIX the doc/docs TRIGGER: the DOWNSTREAM plural `docs/features/<topic>_
  //       plan.md` is now accepted as the orchestrator's plan (the singular
  //       `doc/features/` of THIS repo still works). The legitimate downstream
  //       plan write that triggered the incident is unblocked.
  // Each case is NON-VACUOUS: it would FAIL if the isOrchestratorAuthorable fix
  // were reverted (tooling exempted again / docs plural rejected again).
  // ====================================================================

  // (B) oc-self-patch-tooling-denied — the orchestrator may NOT write or edit the
  //     protocol submodule under `.ai-pm/tooling/**`. The deployed plugin itself
  //     (the self-patch target) and a bare submodule file both DENY.
  await assertThrows(
    "oc-self-patch-tooling-denied: orchestrator `write` to .ai-pm/tooling/.opencode/plugin/ai-pm-enforcement.js (the deployed enforcer — self-patch target) is denied",
    "write",
    { filePath: path.join(SCRATCH, ".ai-pm", "tooling", ".opencode", "plugin", "ai-pm-enforcement.js"), content: "// patched\n" },
    hookOrch
  );
  await assertThrows(
    "oc-self-patch-tooling-denied: orchestrator `edit` to .ai-pm/tooling/.opencode/plugin/ai-pm-enforcement.js (the deployed enforcer) is denied",
    "edit",
    { filePath: path.join(SCRATCH, ".ai-pm", "tooling", ".opencode", "plugin", "ai-pm-enforcement.js") },
    hookOrch
  );
  await assertThrows(
    "oc-self-patch-tooling-denied: orchestrator `write` to a bare .ai-pm/tooling/WORKFLOW.md (protocol submodule source) is denied",
    "write",
    { filePath: path.join(SCRATCH, ".ai-pm", "tooling", "WORKFLOW.md"), content: "# patched\n" },
    hookOrch
  );
  await assertThrows(
    "oc-self-patch-tooling-denied: orchestrator bash `echo x > .ai-pm/tooling/.opencode/plugin/ai-pm-enforcement.js` (the cat-bypass self-patch) is denied",
    "bash",
    { command: "echo x > " + path.join(SCRATCH, ".ai-pm", "tooling", ".opencode", "plugin", "ai-pm-enforcement.js") },
    hookOrch
  );

  // (A) oc-docs-plural-plan-allowed — the DOWNSTREAM plural `docs/features/<topic>_
  //     plan.md` is the orchestrator's plan -> ALLOWED. And the singular
  //     `doc/features/<topic>_plan.md` (THIS repo) still ALLOWED.
  await assertAllows(
    "oc-docs-plural-plan-allowed: orchestrator `write` to docs/features/<topic>_plan.md (downstream PLURAL plan) is allowed",
    "write",
    { filePath: path.join(SCRATCH, "docs", "features", "oc-incident_plan.md"), content: "# plan\n" },
    hookOrch
  );
  await assertAllows(
    "oc-docs-plural-plan-allowed: orchestrator `write` to doc/features/<topic>_plan.md (this-repo SINGULAR plan) is still allowed",
    "write",
    { filePath: path.join(SCRATCH, "doc", "features", "oc-incident_plan.md"), content: "# plan\n" },
    hookOrch
  );

  // (regression) oc-aipm-nontooling-still-allowed — the `.ai-pm` exemption MINUS
  //     tooling did not over-deny: the orchestrator's own non-tooling `.ai-pm`
  //     artifacts (state, reviews, contracts) stay ALLOWED.
  await assertAllows(
    "oc-aipm-nontooling-still-allowed: orchestrator `write` to .ai-pm/state/current.md (own bookkeeping) is still allowed",
    "write",
    { filePath: path.join(SCRATCH, ".ai-pm", "state", "current.md"), content: "state\n" },
    hookOrch
  );
  await assertAllows(
    "oc-aipm-nontooling-still-allowed: orchestrator `write` to .ai-pm/reviews/x_review.md (own review trail) is still allowed",
    "write",
    { filePath: path.join(SCRATCH, ".ai-pm", "reviews", "x_review.md"), content: "## Verdict\n" },
    hookOrch
  );
  await assertAllows(
    "oc-aipm-nontooling-still-allowed: orchestrator `write` to .ai-pm/contracts/x.md (own contract) is still allowed",
    "write",
    { filePath: path.join(SCRATCH, ".ai-pm", "contracts", "x.md"), content: "# contract\n" },
    hookOrch
  );

  // ====================================================================
  // ROLE-DELEGATION INTEGRITY — the generic-harness-built-in arm of the named
  // role-substitution deny-list (workflow/enforcement.md `### Role-delegation
  // integrity (full)`). A `task`-spawn whose target subagent is a generic
  // harness built-in (general / build / plan) is denied the SAME way a wb-*
  // role duplicator is. The on-purpose engines (code-review / deep-research)
  // and all pm-* are NEVER gated — they are the designated fillers.
  // ====================================================================

  // oc-generic-builtin-task-denied — a `task` spawn targeting `general`, `build`,
  //   or `plan` (a generic stand-in for a protocol role) -> DENY. Non-vacuous:
  //   would FAIL (the spawn would be allowed) if the generics were not added to
  //   the deny path. Driven via subagent_type (the 1.16.2 task arg), matching the
  //   wb-* task-deny tests above.
  for (const generic of ["general", "build", "plan"]) {
    await assertThrows(
      "oc-generic-builtin-task-denied: a `task` spawn of `" + generic + "` (generic built-in in a protocol seat) is denied",
      "task",
      { subagent_type: generic }
    );
  }
  // Also denied when the runtime supplies the target under the alternate `agent`
  //   arg name (the plugin reads subagent_type OR agent for the generic check).
  await assertThrows(
    "oc-generic-builtin-task-denied: a `task` spawn with agent=`general` (alternate arg name) is denied",
    "task",
    { agent: "general" }
  );

  // oc-protocol-agent-task-allowed (regression) — a `task` spawn of a protocol
  //   agent (pm-coder / pm-auditor) or an on-purpose engine (code-review /
  //   deep-research) is ALLOWED. The role-integrity deny is a NAMED list, not an
  //   "everything-but-pm-*" block: the designated fillers are never gated.
  for (const allowed of ["pm-coder", "pm-auditor", "code-review", "deep-research"]) {
    await assertAllows(
      "oc-protocol-agent-task-allowed: a `task` spawn of `" + allowed + "` (designated protocol agent/engine) is allowed",
      "task",
      { subagent_type: allowed }
    );
  }

  finish();
})().catch((e) => {
  console.error("FAIL: unexpected error in oc-plugin-unit.js — " + (e && e.stack || e));
  fail++;            // mark the unexpected throw as a failure so finish() exits 1
  finish();          // cleanup + Total summary + exit, instead of bypassing them
});

function finish() {
  try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (_e) {}
  console.log("----");
  console.log("Total: " + (pass + fail) + "  Passed: " + pass + "  Failed: " + fail);
  process.exit(fail > 0 ? 1 : 0);
}
