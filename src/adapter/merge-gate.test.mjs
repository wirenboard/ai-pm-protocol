// Merge-gate branch coverage — the unstamped-review floor holds on ANY branch
// prefix, not only feature/.
//
// The bug this guards: resolveMergeTopic once matched only `feature/<topic>`, so a
// fix/ (or any other-prefixed) branch resolved to null → the predicate failed open
// → an UNSTAMPED fix/ push was allowed. The floor escaped. (Caught when a doc fix
// shipped on a fix/ branch and the gate never fired.)
//
// Two layers proven here:
//   1. resolveMergeTopic strips ANY prefix (feature/foo→foo, fix/bar→bar,
//      hotfix/x→x, bare topic→topic) — via HEAD and via the command fallback.
//   2. mergeWithUnstampedReview now DENIES an unstamped fix/ push and ALLOWS a
//      stamped one (the security case).
//
// Run: node src/adapter/merge-gate.test.mjs

import { evaluate, loadConfig, _internals } from "./engine.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig(HERE);
const { resolveMergeTopic } = _internals;

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.log(`  ✗ ${name}: got ${got}, want ${want}`); }
}

// A temp root whose .git/HEAD points at `branch` (the reliable signal the gate reads).
function rootOnBranch(branch) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-mergegate-"));
  fs.mkdirSync(path.join(root, ".git"));
  fs.writeFileSync(path.join(root, ".git", "HEAD"), `ref: refs/heads/${branch}\n`);
  return root;
}

// Drop a SATISFIED review stamp for `topic` into a root (so the gate sees it stamped).
function stamp(root, topic) {
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${topic}_review.md`), "## Code review: APPROVED\n");
}

// ── 1. TOPIC RESOLUTION — any prefix stripped ────────────────────────────────
console.log("TOPIC RESOLUTION (any branch prefix stripped):");

// 1a. via the command (no .git/HEAD in this root → command fallback).
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-mergegate-cmd-"));
  for (const [branch, topic] of [
    ["feature/foo", "foo"],   // UNCHANGED — must resolve exactly as before
    ["fix/bar", "bar"],
    ["hotfix/x", "x"],
  ]) {
    check(`cmd:${branch}`, resolveMergeTopic(`git push origin ${branch}`, root), topic);
  }
  // A bare topic in a push command has no slash → not a branch ref → no command
  // match (a remote-only token is correctly ignored); HEAD is the bare-topic path.
  fs.rmSync(root, { recursive: true, force: true });
}

// 1b. via HEAD (the reliable signal) — including the bare, slash-less branch.
for (const [branch, topic] of [
  ["feature/foo", "foo"],
  ["fix/bar", "bar"],
  ["hotfix/x", "x"],
  ["topic", "topic"],       // bare branch, no slash → the whole name is the topic
]) {
  const root = rootOnBranch(branch);
  check(`head:${branch}`, resolveMergeTopic("git push", root), topic);
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 2. THE SECURITY CASE — an unstamped fix/ push is now DENIED ───────────────
console.log("SECURITY CASE (the fix/ hole is closed):");

// 2a. UNSTAMPED fix/ push ⇒ DENY (was ALLOW — the bug).
{
  const root = rootOnBranch("fix/leak");
  const v = evaluate({ act: "bash", root, command: "git push origin fix/leak" }, config);
  check("unstamped-fix-push:denies", v.verdict, "deny");
  check("unstamped-fix-push:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 2b. STAMPED fix/ push ⇒ ALLOW (the gate is satisfied, not blanket-blocking).
{
  const root = rootOnBranch("fix/leak");
  stamp(root, "leak");
  const v = evaluate({ act: "bash", root, command: "git push origin fix/leak" }, config);
  check("stamped-fix-push:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 2c. REGRESSION — an unstamped feature/ push STILL denies (the original floor).
{
  const root = rootOnBranch("feature/foo");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/foo" }, config);
  check("unstamped-feature-push:denies", v.verdict, "deny");
  check("unstamped-feature-push:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 3. SPLIT-LINE STAMP — verdict on the next line is also accepted ───────────
// Guards the stampOK() fallback: a reviewer that writes "## Code review:\nAPPROVED"
// instead of the canonical inline form must still satisfy the gate.
console.log("SPLIT-LINE STAMP (next-line verdict accepted):");

// 3a. Verdict on the next line ⇒ ALLOW (the new fallback).
{
  const root = rootOnBranch("feature/split");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "split_review.md"), "## Code review:\nAPPROVED\n\nFull review body follows.\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/split" }, config);
  check("split-line-stamp:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3b. Empty heading + no next-line content ⇒ DENY (truly empty stamp still blocks).
{
  const root = rootOnBranch("feature/empty");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "empty_review.md"), "## Code review:\n\n\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/empty" }, config);
  check("empty-stamp:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3c. "NOT YET RUN" on the next line ⇒ DENY (the NOT-YET-RUN guard applies to fallback content).
{
  const root = rootOnBranch("feature/nyr");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "nyr_review.md"), "## Code review:\nNOT YET RUN\n\nMore text.\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/nyr" }, config);
  check("next-line-nyr:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3d. Verdict after a blank separator line ⇒ DENY (the fallback matches only the immediately-next line).
{
  const root = rootOnBranch("feature/blanksep");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "blanksep_review.md"), "## Code review:\n\nAPPROVED\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/blanksep" }, config);
  check("blank-separator:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// 3e. A heading as the next line ⇒ DENY (the [^\r\n#] guard excludes it).
{
  const root = rootOnBranch("feature/nextheading");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "nextheading_review.md"), "## Code review:\n## Another section\nAPPROVED\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/nextheading" }, config);
  check("next-heading:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
