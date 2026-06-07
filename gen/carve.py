#!/usr/bin/env python3
"""carve.py — one-shot, lossless carve of the frozen golden .claude/ adapter
into the harness-neutral source tree.

This is NOT the generator (that is gen/generate.py, the source -> adapter
direction). carve.py runs ONCE, in the opposite direction, to bootstrap the
neutral source from the golden reference: for each agent it splits the file
losslessly into (a) a harness-neutral body and (b) the Claude-specific
frontmatter block; for each command it copies the whole body (commands carry
no frontmatter on Claude); settings.json is copied verbatim as the Claude-side
artifact of the deny-list/route-reminder capability.

"Lossless" is mechanically guaranteed: for every agent, frontmatter_bytes +
body_bytes == original_bytes exactly (verified per file). The split point is
the byte immediately after the closing `---\\n` frontmatter fence; the blank
line that separates frontmatter from prose stays with the body, so the
generator's job is a pure concatenation with no separator insertion.

Run from the repo root:  python3 gen/carve.py
Idempotent: re-running reproduces byte-identical source files.
"""

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GOLDEN = ROOT / ".golden" / "claude"
SRC = ROOT / "src"

# The 8 agents and 5 commands of the current adapter surface.
AGENTS = [
    "pm-architect", "pm-auditor", "pm-codebase-reader", "pm-coder",
    "pm-plan-checker", "pm-pr-prep", "pm-product-advocate", "pm-stack-researcher",
]
COMMANDS = ["pm-audit", "pm-bootstrap", "pm-fixup", "pm-plan", "pm-research"]


def split_frontmatter(data: bytes):
    """Return (frontmatter_bytes, body_bytes) for a YAML-frontmatter markdown
    file. Lossless: frontmatter + body == data. Raises if the file does not
    open with a `---\\n` fence followed by a closing `---\\n` fence."""
    if not data.startswith(b"---\n"):
        raise ValueError("file does not start with a '---' frontmatter fence")
    # Closing fence is the next line that is exactly '---'. Search for the
    # '\n---\n' that closes the opening fence (start search at byte 3 so the
    # opening fence's own trailing newline is the anchor).
    idx = data.find(b"\n---\n", 3)
    if idx == -1:
        raise ValueError("no closing '---' frontmatter fence found")
    close_end = idx + len(b"\n---\n")
    return data[:close_end], data[close_end:]


def main() -> int:
    (SRC / "agents").mkdir(parents=True, exist_ok=True)
    (SRC / "commands").mkdir(parents=True, exist_ok=True)
    (SRC / "manifests" / "claude" / "frontmatter").mkdir(parents=True, exist_ok=True)

    # Agents: split into neutral body + Claude frontmatter manifest entry.
    for name in AGENTS:
        data = (GOLDEN / "agents" / f"{name}.md").read_bytes()
        fm, body = split_frontmatter(data)
        assert fm + body == data, f"lossy split for agent {name}"
        (SRC / "agents" / f"{name}.body.md").write_bytes(body)
        (SRC / "manifests" / "claude" / "frontmatter" / f"{name}.fm").write_bytes(fm)

    # Commands: pure body, no frontmatter on the Claude side. The whole file is
    # the neutral body.
    for name in COMMANDS:
        data = (GOLDEN / "commands" / f"{name}.md").read_bytes()
        (SRC / "commands" / f"{name}.body.md").write_bytes(data)

    # settings.json: the Claude-side artifact of the deny-list / route-reminder
    # capability. JSON, not body+frontmatter — copied verbatim into the Claude
    # manifest so it regenerates byte-identically (re-serialization is avoided
    # on purpose; see gen/generate.py).
    settings = (GOLDEN / "settings.json").read_bytes()
    (SRC / "manifests" / "claude" / "settings.json").write_bytes(settings)

    print(f"carved {len(AGENTS)} agent bodies + frontmatter, "
          f"{len(COMMANDS)} command bodies, 1 settings.json -> {SRC}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
