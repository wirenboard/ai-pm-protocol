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
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
MANIFESTS = SRC / "manifests"


def load_manifest(harness: str) -> dict:
    path = MANIFESTS / harness / "adapter.json"
    if not path.is_file():
        raise FileNotFoundError(f"no adapter manifest for harness '{harness}': {path}")
    return json.loads(path.read_text(encoding="utf-8"))


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
