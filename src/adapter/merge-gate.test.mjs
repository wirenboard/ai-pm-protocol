// Merge-gate command-parsing coverage — the unstamped-review floor holds on ANY
// branch prefix, reads the stamp of the branch actually PUSHED, and never trips
// on heredoc data.
//
// The bugs these blocks pin (each hit live):
//   1–2. resolveMergeTopic once matched only `feature/<topic>` — an UNSTAMPED
//        fix/ push resolved null → failed open → the floor escaped.
//   3–4. stamp-form and unresolvable-topic edges (split-line verdicts, detached
//        HEAD ⇒ ask, never a silent pass).
//   5.   the checkout (.git/HEAD) once OUTRANKED the command's ref — pushing
//        branch A from branch B's checkout read B's stamp (4.19.x conveyor).
//   6.   the verb rules once matched INSIDE heredoc bodies — a python3 heredoc
//        whose prose mentioned pushes was denied as a push (4.19.x).
//   7.   the accepted stamp labels are exactly the documented two (the pre-4.0
//        `## Validation:` label was dropped — an intentional removal, pinned).
//   8.   a crafted ref (`feature/../EVIL`) once resolved topic `../EVIL` and the
//        stamp path ESCAPED reviews/ — a planted stamp satisfied the floor. The
//        topic is now validated as a single clean segment at the stamp boundary.
//
// Run: node src/adapter/merge-gate.test.mjs

import { evaluate, loadConfig, _internals } from "./engine.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig(HERE);
const { resolveMergeTopic, bashWriteTargets } = _internals;

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

// ── 4. UNRESOLVABLE TOPIC — ask, never a silent pass ──────────────────────────
// Guards the no-silent-pass companion (merge-topic-unresolvable, ask-class): when
// neither HEAD nor the command yields a topic, the stamp is UNCHECKABLE — the old
// behavior allowed the push (fail open); now the Operator is asked.
console.log("UNRESOLVABLE TOPIC (ask, never pass):");

// A root whose HEAD is DETACHED (raw sha, no ref) — the HEAD signal yields nothing.
function rootDetached() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-mergegate-det-"));
  fs.mkdirSync(path.join(root, ".git"));
  fs.writeFileSync(path.join(root, ".git", "HEAD"), "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678\n");
  return root;
}

// 4a. Detached HEAD + bare push (no branch ref in the command) ⇒ ASK.
{
  const root = rootDetached();
  const v = evaluate({ act: "bash", root, command: "git push" }, config);
  check("detached-bare-push:asks", v.verdict, "ask");
  check("detached-bare-push:ruleId", v.ruleId, "merge-topic-unresolvable");
  fs.rmSync(root, { recursive: true, force: true });
}

// 4b. Detached HEAD + a refspec with no slash (HEAD:main) ⇒ still unresolvable ⇒ ASK.
{
  const root = rootDetached();
  const v = evaluate({ act: "bash", root, command: "git push uni HEAD:main" }, config);
  check("detached-refspec:asks", v.verdict, "ask");
  fs.rmSync(root, { recursive: true, force: true });
}

// 4c. Detached HEAD + a slashed branch ref in the command ⇒ RESOLVES via the
// command fallback ⇒ the ordinary deny path, not ask (unstamped here).
{
  const root = rootDetached();
  const v = evaluate({ act: "bash", root, command: "git push origin feature/foo" }, config);
  check("detached-cmd-ref:denies", v.verdict, "deny");
  check("detached-cmd-ref:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 4d. A resolvable, STAMPED push stays ALLOW — the ask rule does not over-fire.
{
  const root = rootOnBranch("feature/ok");
  stamp(root, "ok");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/ok" }, config);
  check("resolved-stamped:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 4e. A non-merge/push git command with no resolvable topic ⇒ ALLOW (scope check).
{
  const root = rootDetached();
  const v = evaluate({ act: "bash", root, command: "git status" }, config);
  check("non-push-detached:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 5. PUSHED REF OUTRANKS HEAD — cross-branch push/merge ─────────────────────
// Guards the 4.19.x live failure: pushing branch A from branch B's checkout read
// B's stamp (HEAD was consulted first). The ref named in the command now wins;
// HEAD remains the bare-push fallback (block 1b).
console.log("PUSHED REF OUTRANKS HEAD (cross-branch push/merge):");

// 5a. On checkout feature/beta, pushing feature/alpha with ALPHA's stamp ⇒ ALLOW
// (the old order read beta's absent stamp ⇒ false deny).
{
  const root = rootOnBranch("feature/beta");
  stamp(root, "alpha");
  const v = evaluate({ act: "bash", root, command: "git push uni feature/alpha" }, config);
  check("cross-branch-stamped:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 5b. Same checkout with only BETA stamped ⇒ DENY — the gate reads the PUSHED
// branch's stamp, never the checkout's (the false-allow direction, the security case).
{
  const root = rootOnBranch("feature/beta");
  stamp(root, "beta");
  const v = evaluate({ act: "bash", root, command: "git push uni feature/alpha" }, config);
  check("cross-branch-unstamped:denies", v.verdict, "deny");
  check("cross-branch-unstamped:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 5c. `git merge <branch>` resolves the MERGED branch: on checkout main, merging
// stamped feature/alpha ⇒ ALLOW (the old order resolved topic `main` ⇒ false
// deny); unstamped ⇒ DENY.
{
  const root = rootOnBranch("main");
  stamp(root, "alpha");
  check("merge-branch-stamped:allows",
    evaluate({ act: "bash", root, command: "git merge feature/alpha" }, config).verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}
{
  const root = rootOnBranch("main");
  const v = evaluate({ act: "bash", root, command: "git merge feature/alpha" }, config);
  check("merge-branch-unstamped:denies", v.verdict, "deny");
  check("merge-branch-unstamped:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 5d. Command-ref parsing forms (no .git/HEAD in this root — the command alone
// must resolve): a flag-bearing push; refspec dst (`HEAD:feature/x` ⇒ the remote
// side, its only named ref); refspec src (`feature/foo:main` ⇒ the local
// feature); quoted prose masked (a `-m` message never resolves).
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-mergegate-ref-"));
  check("flag-form", resolveMergeTopic("git push --force-with-lease uni feature/alpha", root), "alpha");
  check("refspec-dst", resolveMergeTopic("git push uni HEAD:feature/x", root), "x");
  check("refspec-src", resolveMergeTopic("git push origin feature/foo:main", root), "foo");
  check("quoted-prose-masked", resolveMergeTopic('git merge -m "take sprint/3 work" feature/alpha', root), "alpha");
  fs.rmSync(root, { recursive: true, force: true });
}

// 5e. A slashed PATH outside the push's own argument span never resolves — the
// bare push falls back to HEAD (the checkout), exactly as before.
{
  const root = rootOnBranch("feature/beta");
  check("compound-path-not-a-ref", resolveMergeTopic("cd src/foo && git push", root), "beta");
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 6. HEREDOC BODIES ARE DATA — unless a shell executes them ─────────────────
// Guards the 4.19.x live false positive: a python3 heredoc whose PROSE mentioned
// pushes was denied as a push. A non-shell heredoc body is stripped before any
// rule pattern runs; a shell-interpreted body (bash <<EOF) and a malformed body
// (no closing delimiter) stay fully matched — fail toward deny.
console.log("HEREDOC BODIES (data stripped; shell/malformed kept):");

// 6a. python3 heredoc with push PROSE in the body, unstamped checkout ⇒ ALLOW
// (the live-failure replay — the old code denied this).
{
  const root = rootOnBranch("feature/beta");
  const v = evaluate({ act: "bash", root,
    command: "python3 <<'EOF'\nprint(\"git push origin main\")\nEOF" }, config);
  check("python-heredoc-prose:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 6b. Shell heredoc — the body EXECUTES as shell: a real unstamped push in it
// ⇒ DENY, including the path-qualified form (the bypass-shaped cases).
{
  const root = rootOnBranch("feature/beta");
  const v = evaluate({ act: "bash", root,
    command: "bash <<'EOF'\ngit push origin feature/beta\nEOF" }, config);
  check("bash-heredoc-push:denies", v.verdict, "deny");
  check("bash-heredoc-push:ruleId", v.ruleId, "merge-while-unstamped");
  const pv = evaluate({ act: "bash", root,
    command: "/bin/bash <<'EOF'\ngit push origin feature/beta\nEOF" }, config);
  check("path-qualified-shell-heredoc:denies", pv.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// 6c. A real push AFTER a heredoc in the same compound stays caught.
{
  const root = rootOnBranch("feature/beta");
  const v = evaluate({ act: "bash", root,
    command: "python3 <<'EOF'\nprint(\"all about pushes\")\nEOF\ngit push uni feature/beta" }, config);
  check("push-after-heredoc:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// 6d. MALFORMED heredoc (no closing delimiter) ⇒ nothing stripped ⇒ the verb
// words still match ⇒ DENY (fail toward the strict side).
{
  const root = rootOnBranch("feature/beta");
  const v = evaluate({ act: "bash", root,
    command: "python3 <<'EOF'\ngit push origin feature/beta" }, config);
  check("malformed-heredoc:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 7. STAMP LABELS — the documented set, exactly ─────────────────────────────
// `## Validation:` (the pre-4.0 documentation-kind label; no current role writes
// it) was DROPPED from the accepted set — reviewer.md documents `## Code review:`
// and `## Doc review:`, and the engine accepts exactly those. An intentional
// behaviour removal, pinned here.
console.log("STAMP LABELS (Code review / Doc review accepted; Validation dropped):");

// 7a. A `## Validation:` stamp no longer satisfies the gate ⇒ DENY.
{
  const root = rootOnBranch("feature/val");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "val_review.md"), "## Validation: APPROVED\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/val" }, config);
  check("validation-label:denies", v.verdict, "deny");
  fs.rmSync(root, { recursive: true, force: true });
}

// 7b. The `## Doc review:` label (docs-kind projects) still satisfies ⇒ ALLOW.
{
  const root = rootOnBranch("feature/docs");
  const dir = path.join(root, ".ai-pm", "reviews");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "docs_review.md"), "## Doc review: APPROVED\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/docs" }, config);
  check("doc-review-label:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 8. PATH-TRAVERSAL IN THE TOPIC — the stamp path can't escape reviews/ ──────
// Guards the HIGH the Reviewer drove end-to-end: a crafted ref `feature/../EVIL`
// resolves topic `../EVIL`, and `.ai-pm/reviews/../EVIL_review.md` collapses to
// `.ai-pm/EVIL_review.md` — OUTSIDE reviews/. A planted stamp there once ALLOWED
// an unstamped push. The topic is now validated as a single clean segment at the
// stamp boundary (the one choke point every source funnels through); an unclean
// topic leaves the stamp unsatisfiable ⇒ DENY (fail toward deny).
console.log("PATH-TRAVERSAL (topic stays inside reviews/):");

// 8a. THE REVIEWER SCENARIO: a stamp planted at the ESCAPED path + a crafted ref
// ⇒ DENY (was ALLOW — the bypass). The checkout itself is unstamped.
{
  const root = rootOnBranch("feature/beta");
  fs.mkdirSync(path.join(root, ".ai-pm"), { recursive: true });
  fs.writeFileSync(path.join(root, ".ai-pm", "EVIL_review.md"), "## Code review: APPROVED\n");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/../EVIL" }, config);
  check("traversal-planted-stamp:denies", v.verdict, "deny");
  check("traversal-planted-stamp:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 8b. Resolution stays SYNTACTIC — the crafted topic resolves NON-null (`../EVIL`)
// so the gate denies it; nulling it here would fall back to HEAD and could read a
// stamped checkout's stamp (a bypass). Pins the no-second-entry-path design.
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-pm-mergegate-trav-"));
  check("traversal-topic-syntactic", resolveMergeTopic("git push origin feature/../EVIL", root), "../EVIL");
  fs.rmSync(root, { recursive: true, force: true });
}

// 8c. NESTED branch name ⇒ DENY (the pinned choice: reject path separators
// outright — the convention is a single `<prefix>/<topic>`, not `feature/sub/topic`).
{
  const root = rootOnBranch("feature/sub/topic");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/sub/topic" }, config);
  check("nested-branch:denies", v.verdict, "deny");
  check("nested-branch:ruleId", v.ruleId, "merge-while-unstamped");
  fs.rmSync(root, { recursive: true, force: true });
}

// 8d. A CLEAN topic still resolves and satisfies the gate (the guard rejects only
// unclean segments, never a normal topic).
{
  const root = rootOnBranch("feature/clean");
  stamp(root, "clean");
  const v = evaluate({ act: "bash", root, command: "git push origin feature/clean" }, config);
  check("clean-topic:allows", v.verdict, "allow");
  fs.rmSync(root, { recursive: true, force: true });
}

// 8e. SIBLING WRITE-TARGET (the touched scan): a heredoc-borne escaping write
// still DENIES write-outside-root — the phantom-`<<EOF` strip removed only the
// opener noise, never weakened the escape detection.
{
  const root = rootOnBranch("feature/beta");
  const v = evaluate({ act: "bash", root, command: "tee ../../escape.txt <<EOF\nx\nEOF" }, config);
  check("heredoc-write-escape:denies", v.verdict, "deny");
  check("heredoc-write-escape:ruleId", v.ruleId, "write-outside-root");
  fs.rmSync(root, { recursive: true, force: true });
}

// 8f. The LOW: `tee file <<EOF` no longer extracts a phantom `<<EOF` write target
// (the opener is an operator, never a target).
check("heredoc-phantom-gone", JSON.stringify(bashWriteTargets("tee /tmp/out <<EOF")), JSON.stringify(["/tmp/out"]));

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
