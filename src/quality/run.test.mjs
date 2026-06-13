// Self-test for the whole-set quality runner (run.mjs). Drives run() against
// SYNTHETIC temp registries — never the real tools.json (that would recurse: the
// real registry's run-quality row IS this test). Every call passes registryPath
// EXPLICITLY: the runner's default now resolves beside run.mjs itself (the real
// co-located tools.json), so leaning on the default would read — and recurse on
// — the real registry. Covers the four contract paths: all-pass ⇒ 0, a failing
// row ⇒ 1, zero matching rows ⇒ 0, malformed ⇒ 1.
//
// Run: node src/quality/run.test.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "./run.mjs";

let pass = 0;
const fails = [];
function check(name, got, want) {
  if (got === want) { pass++; return; }
  fails.push(`  ✗ ${name}: got exit ${got}, want ${want}`);
}

// A temp dir holding a synthetic tools.json with the given content (a JS object
// ⇒ stringified, or a raw string ⇒ written verbatim for the malformed case).
// Returns { root, registryPath } — root is the execSync cwd, registryPath is the
// explicit registry passed to run() so the default (beside the real run.mjs) is
// never consulted.
function rootWith(content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "qrun-"));
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const registryPath = path.join(root, "tools.json");
  fs.writeFileSync(registryPath, text);
  return { root, registryPath };
}

// Silence the runner's per-row chatter so the test output stays clean; the
// child commands themselves inherit stdio, so a real failure still surfaces.
const realLog = console.log;
const quiet = (fn) => { console.log = () => {}; try { return fn(); } finally { console.log = realLog; } };

// 1. All matched rows pass ⇒ exit 0.
{
  const { root, registryPath } = rootWith({ tools: [
    { id: "ok-a", run: "node -e \"process.exit(0)\"", beat: "build" },
    { id: "ok-b", run: "node -e \"process.exit(0)\"", beat: "build" },
    { id: "other-beat", run: "node -e \"process.exit(1)\"", beat: "review" },
  ] });
  check("all-pass build ⇒ 0", quiet(() => run("build", root, registryPath)), 0);
}

// 2. A matched row fails ⇒ exit 1.
{
  const { root, registryPath } = rootWith({ tools: [
    { id: "ok", run: "node -e \"process.exit(0)\"", beat: "build" },
    { id: "boom", run: "node -e \"process.exit(1)\"", beat: "build" },
  ] });
  check("failing row ⇒ 1", quiet(() => run("build", root, registryPath)), 1);
}

// 3. Zero rows match the beat ⇒ no-op success, exit 0.
{
  const { root, registryPath } = rootWith({ tools: [
    { id: "only-build", run: "node -e \"process.exit(0)\"", beat: "build" },
  ] });
  check("zero matches (ship) ⇒ 0", quiet(() => run("ship", root, registryPath)), 0);
}

// 4. Malformed registry ⇒ fail closed, exit 1.
{
  const badJson = rootWith("{ this is not json");
  check("unparseable JSON ⇒ 1", quiet(() => run("build", badJson.root, badJson.registryPath)), 1);

  const noArray = rootWith({ notTools: [] });
  check("missing tools array ⇒ 1", quiet(() => run("build", noArray.root, noArray.registryPath)), 1);
}

// 5. Absent registry ⇒ no-op success (a downstream may define no checks). The
// explicit registryPath points at a file that does not exist — so the default
// (beside the real run.mjs) is still never consulted.
{
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "qrun-empty-"));
  check("absent tools.json ⇒ 0", quiet(() => run("build", empty, path.join(empty, "tools.json"))), 0);
}

// 6. Unknown beat arg ⇒ non-zero (and never interpolated into a command).
{
  const { root, registryPath } = rootWith({ tools: [{ id: "x", run: "node -e \"process.exit(0)\"", beat: "build" }] });
  check("unknown beat ⇒ non-zero", quiet(() => run("bogus", root, registryPath)) !== 0, true);
}

if (fails.length) {
  console.log("RUN-QUALITY SELF-TEST:");
  fails.forEach((f) => console.log(f));
  console.log(`\nFAIL — ${fails.length} case(s) failed`);
  process.exit(1);
}
console.log(`PASS — ${pass} passed`);
