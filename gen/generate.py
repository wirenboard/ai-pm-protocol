#!/usr/bin/env python3
"""generate.py — deterministic generator: neutral source + per-harness manifest
-> a full harness adapter.

Builds the Claude adapter (slice 1) or the OpenCode adapter (slice 2) from the
SAME neutral bodies under src/agents|commands/*.body.md — no re-carving. The
generator is thin by design (arch note 'How thin the metalanguage can be'): for
each adapter file it

  * inlines the neutral body (src/agents|commands/<name>.body.md), and
  * for agents, prepends the harness frontmatter from the manifest
    (src/manifests/<harness>/frontmatter/<name>.fm),
  * for harness-local agents (an OpenCode-only section — the protocol-owned
    review/research engines, where the OTHER harness has a native built-in),
    inlines a body AND frontmatter that BOTH live under the manifest dir,

then for the harness's capability artifacts (settings.json on Claude;
opencode.json + AGENTS.md on OpenCode) copies the verbatim bytes from the
manifest. There is NO parsing and NO re-serialization of any file, so the output
is byte-identical to the carved source by construction — which is exactly what
makes the byte-equivalence (Claude) and diff-clean (both) guarantees hold.

Determinism across BOTH harnesses: same inputs -> byte-identical outputs on
every run. The only inputs are files under src/; agent/command names are taken
in the manifest's listed order; artifacts are processed in the manifest's listed
order; bytes are copied, never reformatted. Nothing in the generator reads the
clock, the filesystem ordering, or any other non-deterministic source — the two
harnesses share this one code path, so neither can drift from the other.

Usage:
    python3 gen/generate.py [--harness claude|opencode] [--out <dir>]

  --harness  which harness manifest to build (default: claude).
  --out      override the output root (default: the manifest's output_root,
             i.e. .claude or .opencode). Used by tests to build into a scratch
             dir and compare without disturbing the live adapter. A root_relative
             artifact (e.g. OpenCode's AGENTS.md, which lives at the repo root,
             not under .opencode/) is emitted as a sibling of the output root so
             a scratch build keeps the AGENTS.md / .opencode/ relationship.

Exit code 0 on success; non-zero with a diagnostic on any missing input.
"""

import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
MANIFESTS = SRC / "manifests"


def load_manifest(harness: str) -> dict:
    path = MANIFESTS / harness / "adapter.json"
    if not path.is_file():
        raise FileNotFoundError(f"no adapter manifest for harness '{harness}': {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def extract_wb_deny_roles() -> list:
    """Single-source the wb-* role-duplicator deny set: extract it from the ONE
    authored copy — the Claude settings.json Task|Agent|Skill matcher's
    case-pattern. Reproducing that matcher's escaped shell bytes from a neutral
    source is risky, so settings.json stays the verbatim home of the role set and
    the OpenCode plugin DERIVES its copy here at build time. There is therefore
    exactly one authored copy and the two adapters cannot drift (the single-source
    test in tests/opencode.sh asserts the emitted set equals what is extracted
    here). Order is preserved from the case-pattern, so the output is
    deterministic."""
    settings_path = MANIFESTS / "claude" / "settings.json"
    if not settings_path.is_file():
        raise FileNotFoundError(f"missing settings.json for role-set extraction: {settings_path}")
    settings = json.loads(settings_path.read_text(encoding="utf-8"))
    cmd = None
    for grp in settings.get("hooks", {}).get("PreToolUse", []):
        if grp.get("matcher") == "Task|Agent|Skill":
            cmd = grp["hooks"][0]["command"]
            break
    if cmd is None:
        raise ValueError("no Task|Agent|Skill matcher found in settings.json — cannot extract the wb-* role set")
    # The deny set is the shell `case "$NAME" in <a>|<b>|...)` pattern.
    m = re.search(r'case "\\?\$NAME" in ([^)]+)\)', cmd)
    if not m:
        raise ValueError("could not locate the case-pattern role set in the Task|Agent|Skill matcher command")
    roles = [r.strip() for r in m.group(1).split("|") if r.strip()]
    if not roles:
        raise ValueError("extracted an empty wb-* role set from settings.json")
    return roles


def read_bytes(path: pathlib.Path) -> bytes:
    if not path.is_file():
        raise FileNotFoundError(f"missing source input: {path}")
    return path.read_bytes()


def generate(harness: str, out_root: pathlib.Path) -> list:
    """Build the adapter for `harness` into `out_root`. Returns the list of
    written paths (relative to out_root), in deterministic order."""
    manifest = load_manifest(harness)
    written = []

    # --- Agents: frontmatter + body ---
    agents = manifest["agents"]
    body_dir = SRC / agents["body_dir"]
    fm_dir = MANIFESTS / harness / agents["frontmatter_dir"]
    out_agents = out_root / agents["output_dir"]
    out_agents.mkdir(parents=True, exist_ok=True)
    for name in agents["names"]:
        fm = read_bytes(fm_dir / f"{name}{agents['frontmatter_suffix']}")
        body = read_bytes(body_dir / f"{name}{agents['body_suffix']}")
        out = out_agents / f"{name}{agents['output_suffix']}"
        out.write_bytes(fm + body)
        written.append(out.relative_to(out_root))

    # --- Harness-local agents (OpenCode only): frontmatter + body, BOTH from the
    #     manifest dir, NOT from the shared src/agents/. These are agents that only
    #     ONE harness ships because the other harness has a native built-in for the
    #     same job — on OpenCode the protocol-owned `code-review` / `deep-research`
    #     engines (OpenCode has no built-in equivalents; Claude keeps its built-ins,
    #     so these are NOT added to the Claude adapter). Unlike the shared `agents`
    #     section (body from src/agents/, frontmatter from the manifest), here BOTH
    #     the body and the frontmatter live under src/manifests/<harness>/ — they are
    #     harness-specific bodies, not neutral ones. Same thin assembly (frontmatter
    #     + body, byte-copied, manifest order), so the diff-clean guarantee holds.
    #     They land in the SAME output dir as the shared agents (.opencode/agent/),
    #     and the filename is the agent id. See opencode-harness-support plan
    #     scenario 6 (no built-in review/research engine). ---
    local_agents = manifest.get("harness_local_agents")
    if local_agents:
        la_body_dir = MANIFESTS / harness / local_agents["body_dir"]
        la_fm_dir = MANIFESTS / harness / local_agents["frontmatter_dir"]
        out_local = out_root / local_agents["output_dir"]
        out_local.mkdir(parents=True, exist_ok=True)
        for name in local_agents["names"]:
            fm = read_bytes(la_fm_dir / f"{name}{local_agents['frontmatter_suffix']}")
            body = read_bytes(la_body_dir / f"{name}{local_agents['body_suffix']}")
            out = out_local / f"{name}{local_agents['output_suffix']}"
            out.write_bytes(fm + body)
            written.append(out.relative_to(out_root))

    # --- Commands: body only (no frontmatter on Claude) ---
    commands = manifest["commands"]
    cmd_body_dir = SRC / commands["body_dir"]
    out_commands = out_root / commands["output_dir"]
    out_commands.mkdir(parents=True, exist_ok=True)
    for name in commands["names"]:
        body = read_bytes(cmd_body_dir / f"{name}{commands['body_suffix']}")
        out = out_commands / f"{name}{commands['output_suffix']}"
        out.write_bytes(body)
        written.append(out.relative_to(out_root))

    # --- Enforcement plugins (OpenCode only): emit each plugin from its template
    #     with the single-sourced wb-* role deny-list injected. The role set is
    #     EXTRACTED from the Claude settings.json (the one authored copy) and
    #     substituted into the __WB_DENY_ROLES__ placeholder as a deterministic
    #     JSON literal (case-pattern order preserved). The rest of the template is
    #     copied verbatim — no parsing of the JS — so the output is deterministic.
    #     See https://opencode.ai/docs/plugins/ (tool.execute.before throws to
    #     deny). ---
    plugins = manifest.get("plugins")
    if plugins:
        roles = extract_wb_deny_roles()
        roles_literal = json.dumps(roles)  # deterministic: ["a","b",...] in order
        out_plugins = out_root / plugins["output_dir"]
        out_plugins.mkdir(parents=True, exist_ok=True)
        for spec in plugins["files"]:
            tmpl = read_bytes(MANIFESTS / harness / spec["template"]).decode("utf-8")
            placeholder = spec["role_placeholder"]
            if placeholder not in tmpl:
                raise ValueError(
                    f"plugin template {spec['template']} is missing the role placeholder {placeholder}"
                )
            rendered = tmpl.replace(placeholder, roles_literal)
            out = out_plugins / spec["output_file"]
            out.write_bytes(rendered.encode("utf-8"))
            written.append(out.relative_to(out_root))

    # --- Verbatim capability artifacts (Claude: settings.json; OpenCode:
    #     opencode.json + AGENTS.md). Copied byte-for-byte from the manifest, in
    #     listed order, so the output is deterministic. A root_relative artifact
    #     (OpenCode's AGENTS.md) lands beside the output root, not inside it. ---
    for art in manifest.get("artifacts", []):
        src_art = MANIFESTS / harness / art["source_file"]
        if art.get("root_relative"):
            out_art = out_root.parent / art["output_file"]
            rel = out_art.name
        else:
            out_art = out_root / art["output_file"]
            rel = out_art.relative_to(out_root)
        out_art.parent.mkdir(parents=True, exist_ok=True)
        out_art.write_bytes(read_bytes(src_art))
        written.append(rel)

    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate a harness adapter from neutral source.")
    ap.add_argument("--harness", default="claude", help="harness manifest to build: claude|opencode (default: claude)")
    ap.add_argument("--out", default=None, help="output root override (default: manifest output_root)")
    args = ap.parse_args()

    try:
        manifest = load_manifest(args.harness)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    out_root = pathlib.Path(args.out).resolve() if args.out else (ROOT / manifest["output_root"])

    try:
        written = generate(args.harness, out_root)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(f"generated {len(written)} files for harness '{args.harness}' -> {out_root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
