// The whole-set quality runner — the one command that runs EVERY tool for a
// beat, so "run the build-beat checks" is a single reliable act instead of an
// agent eyeballing tools.json and invoking rows by hand (PROTOCOL.md
// `## Quality tools`). It is project-AGNOSTIC: it carries no tool name itself,
// only the mechanism — it reads whatever rows the project's tools.json defines.
//
// Honesty: this makes "run the whole set" reliable; it does NOT make "the agent
// invoked it" mechanical. That invocation stays a persona act — a runner cannot
// force a positive act (PROTOCOL.md `## Enforcement`).
//
// Usage: node src/quality/run.mjs <build|review|ship>
//
// Exit codes: 0 = every matched row passed (or no rows matched, or no registry);
//             non-zero = a row failed, a bad beat arg, or a malformed registry.
//
// Security: the executed commands come ONLY from the tracked, reviewed
// tools.json (first-party, changes through git). The <beat> arg is used SOLELY
// as an equality filter (row.beat === beat) and is NEVER interpolated into a
// command — a hostile arg cannot reach a shell.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const BEATS = ["build", "review", "ship"];

// Run every tools.json row whose beat === `beat`, from `root`. Returns an exit
// code (0 = all matched rows passed / none matched / no registry; non-zero =
// failure or malformed registry). `registryPath` overrides the default location
// (the self-test points it at a synthetic registry).
export function run(beat, root, registryPath) {
  if (!BEATS.includes(beat)) {
    console.error(`run.mjs: unknown beat "${beat}" — expected one of ${BEATS.join(" | ")}`);
    return 2;
  }

  const file = registryPath || path.join(root, "src", "quality", "tools.json");

  // Absent registry ⇒ no-op success: a downstream may legitimately define no checks.
  if (!fs.existsSync(file)) {
    console.log(`run.mjs: no tools.json — no ${beat}-beat tools`);
    return 0;
  }

  // Present-but-malformed ⇒ fail closed: a broken registry must not pass as green.
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`run.mjs: malformed tools.json (${file}): ${e.message}`);
    return 1;
  }
  if (!registry || !Array.isArray(registry.tools)) {
    console.error(`run.mjs: malformed tools.json (${file}): missing "tools" array`);
    return 1;
  }

  const rows = registry.tools.filter((r) => r && r.beat === beat);
  if (rows.length === 0) {
    console.log(`run.mjs: no ${beat}-beat tools`);
    return 0;
  }

  let failed = 0;
  for (const row of rows) {
    if (typeof row.run !== "string" || !row.run) {
      console.error(`FAIL  ${row.id ?? "<no id>"} — row has no runnable "run" command`);
      failed++;
      continue;
    }
    try {
      execSync(row.run, { cwd: root, stdio: "inherit" });
      console.log(`PASS  ${row.id}`);
    } catch {
      console.log(`FAIL  ${row.id}`);
      failed++;
    }
  }

  console.log(`\n${beat}: ${rows.length - failed}/${rows.length} passed${failed ? ` — ${failed} FAILED` : ""}`);
  return failed ? 1 : 0;
}

// Self-locate the project root from this script's path: src/quality/run.mjs ⇒
// root is two levels up (mirrors neutral-prose.test.mjs).
function projectRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "..");
}

// CLI entry — only when invoked directly, not when imported by the self-test.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const beat = process.argv[2];
  if (!beat) {
    console.error(`Usage: node src/quality/run.mjs <${BEATS.join("|")}>`);
    process.exit(2);
  }
  process.exit(run(beat, projectRoot()));
}
