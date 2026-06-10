// Configurable rigor — the engine respects ai-pm.config.json `profile`.
//
// The ONE mechanical change the profile makes: it relaxes the
// orchestrator-content deny (the orchestrator may author source/doc paths) under
// `lite`/`solo`, and ONLY that predicate. This test proves:
//   1. orchestrator source WRITE is ALLOWED under lite/solo,
//   2. and DENIED under full / absent / unknown / malformed (fail-safe to strict),
//   3. the FLOOR never relaxes — under `solo`, the tooling-submodule, out-of-root,
//      truncating-write, and merge-gate denies ALL still fire.
//
// The profile is read at evaluate-time from input.root, so each case writes an
// ai-pm.config.json into a temp root and asserts the engine verdict directly.
//
// Run: node adapter/rigor-profile.test.mjs

import { evaluate, loadConfig } from "./engine.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig(HERE);

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.log(`  ✗ ${name}: got ${got}, want ${want}`); }
}

// A fresh temp root whose ai-pm.config.json carries `profileLine` verbatim
// (a JSON fragment, or "" for the absent case, or garbage for the malformed case).
function rootWith(profileLine) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-rigor-"));
  let body;
  if (profileLine === "MALFORMED") body = "{ this is not json";
  else if (profileLine === null) body = "{}"; // configured, profile key ABSENT
  else body = JSON.stringify({ profile: profileLine });
  fs.writeFileSync(path.join(root, "ai-pm.config.json"), body);
  return root;
}

// The orchestrator writing a canonical doc — the predicate the profile gates.
function orchWriteVerdict(root) {
  return evaluate(
    { act: "write", root, path: path.join(root, "PROTOCOL.md"), content: "x", isOrchestrator: true },
    config
  );
}

console.log("RIGOR PROFILE — orchestrator-content relaxation:");

// 1. lite / solo ALLOW the orchestrator source write (relaxation fires).
for (const p of ["lite", "solo"]) {
  const root = rootWith(p);
  check(`orch-write:${p}:allows`, orchWriteVerdict(root).verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 2. full / absent / unknown / malformed DENY (fail-safe to strict).
for (const [label, line] of [["full", "full"], ["absent", null], ["unknown", "bogus"], ["malformed", "MALFORMED"]]) {
  const root = rootWith(line);
  const v = orchWriteVerdict(root);
  check(`orch-write:${label}:denies`, v.verdict, "deny");
  check(`orch-write:${label}:ruleId`, v.ruleId, "orchestrator-authors-content");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3. THE FLOOR never relaxes — every case below runs under `solo` (the loosest
//    profile) and MUST still deny.
console.log("THE FLOOR (under solo — the loosest profile — these STILL deny):");

// 3a. tooling-submodule write (self-patch floor). Even the orchestrator, even solo.
{
  const root = rootWith("solo");
  const v = evaluate(
    { act: "write", root, path: path.join(root, ".ai-pm", "tooling", "engine.mjs"), content: "x", isOrchestrator: true },
    config
  );
  check("floor:tooling-write:denies", v.verdict, "deny");
  check("floor:tooling-write:ruleId", v.ruleId, "self-patch-enforcer");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3b. out-of-root write (boundary floor).
{
  const root = rootWith("solo");
  const v = evaluate(
    { act: "write", root, path: "/etc/foo", content: "x", isOrchestrator: true },
    config
  );
  check("floor:out-of-root-write:denies", v.verdict, "deny");
  check("floor:out-of-root-write:ruleId", v.ruleId, "write-outside-root");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3c. truncating write over a non-empty file (truncation floor).
{
  const root = rootWith("solo");
  const target = path.join(root, "existing.txt");
  fs.writeFileSync(target, "real content");
  const v = evaluate(
    { act: "write", root, path: target, content: "   ", contentEmpty: true, isOrchestrator: true },
    config
  );
  check("floor:truncating-write:denies", v.verdict, "deny");
  check("floor:truncating-write:ruleId", v.ruleId, "truncating-write");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3d. merge while review is unstamped (merge-gate floor). No review file ⇒ unstamped.
{
  const root = rootWith("solo");
  const v = evaluate(
    { act: "bash", root, command: "git push origin feature/foo", isOrchestrator: true },
    config
  );
  check("floor:merge-unstamped:denies", v.verdict, "deny");
  check("floor:merge-unstamped:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 4. SANITY — the profile only touches the orchestrator-content predicate.
//    A NON-orchestrator write to the same doc path is unaffected (allowed) under
//    every profile, and a pure-git orchestrator command stays allowed.
console.log("SANITY (profile touches ONLY orchestrator-content):");
for (const p of ["full", "lite", "solo"]) {
  const root = rootWith(p);
  const nonOrch = evaluate(
    { act: "write", root, path: path.join(root, "PROTOCOL.md"), content: "x", isOrchestrator: false },
    config
  );
  check(`sanity:non-orch-write:${p}:allows`, nonOrch.verdict, "allow");
  const git = evaluate(
    { act: "bash", root, command: "git status", isOrchestrator: true },
    config
  );
  check(`sanity:orch-git:${p}:allows`, git.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
