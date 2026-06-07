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
  * for OpenCode CONTROL agents (the cross-model review/audit layer named in the
    manifest's `models.control_agents`), injects a single `model: <control>` line
    AND — when `models.control_variant` is set — a `variant: <control_variant>`
    line (the per-operation reasoning-effort tier: control/review ops run at low
    effort) into the generated frontmatter, and substitutes the session model into
    opencode.json — the model + variant choices are single-sourced in the
    manifest's `models` block (OpenCode has no runtime per-task model override,
    PR #17577, so the cross-model pin is static; the variant is likewise a static
    per-agent frontmatter key). The Claude manifest has no `models` block, so no
    pin and no variant are injected and the Claude adapter stays byte-identical.

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


# Where the rendered reader-facing harness-reference table is written. A GENERATED
# build artifact (single-sourced from capabilities.json's `harness_reference`
# block), kept next to the generator — NOT authored doc/ content. Regenerate with
# `python3 gen/generate.py --harness reference`; the diff-clean guard fails on a
# stale render or a hand-edit, the same discipline as the adapters.
REFERENCE_TABLE = ROOT / "gen" / "harness-reference.md"


def render_reference_table() -> str:
    """Render the human-readable harness-reference table from the SINGLE source —
    capabilities.json's `harness_reference` block. The shared prose names every
    harness-specific concept with a neutral noun; this table is the one home a
    reader consults to resolve a neutral noun -> the Claude / OpenCode concrete.
    Deterministic: entries are emitted in the manifest's authored key order, no
    clock / filesystem dependence. The mapping lives ONLY in capabilities.json —
    this render is a derived view, asserted drift-free by tests/neutral-prose.sh
    (`reference-table-matches-capabilities`)."""
    caps = json.loads((MANIFESTS / "capabilities.json").read_text(encoding="utf-8"))
    ref = caps.get("harness_reference")
    if not ref:
        raise ValueError("capabilities.json has no `harness_reference` block to render")

    lines = []
    lines.append("# Harness-reference table\n")
    lines.append(
        "> **GENERATED — do not edit by hand.** Rendered from "
        "`src/manifests/capabilities.json` (`harness_reference` block) by "
        "`gen/generate.py --harness reference`. The single source of the "
        "neutral-noun -> concrete mapping is that manifest; this file is a derived "
        "view. A hand-edit or a stale render trips "
        "`reference-table-matches-capabilities` in `tests/neutral-prose.sh`.\n"
    )
    lines.append(
        "The protocol's shared instruction prose (the `pm-*` agent and command "
        "bodies) names every harness-specific concept with a **neutral noun**, "
        "never a bare Claude or OpenCode primitive. A reader (human or model) who "
        "needs the concrete for their harness resolves it here.\n"
    )
    lines.append("| Neutral noun | Claude | OpenCode |")
    lines.append("|---|---|---|")
    for entry in ref.values():
        if not isinstance(entry, dict) or "neutral_noun" not in entry:
            # Skip the `_note` documentation key (not a mapping row).
            continue
        noun = entry["neutral_noun"]
        claude = entry["claude_concrete"]
        opencode = entry["opencode_concrete"]
        marker = " ⚠" if entry.get("skew") else ""
        lines.append(f"| {noun} | `{claude}` | `{opencode}`{marker} |")

    # Behavioral-skew footnotes (the route reminder differs in TIMING, not just
    # naming — name the intent neutrally, each adapter doc states its timing).
    skews = [e for e in ref.values()
             if isinstance(e, dict) and e.get("skew")]
    if skews:
        lines.append("")
        lines.append(
            "⚠ **Behavioral skew (not just naming).** The two harnesses differ in "
            "*behavior*, not only in the name of the primitive:"
        )
        for e in skews:
            lines.append(f"- **{e['neutral_noun']}** — {e['skew']}")

    return "\n".join(lines) + "\n"


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


def inject_model_pin(fm: bytes, model: str) -> bytes:
    """Inject a `model: <model>` line into an agent's frontmatter, immediately
    after the opening `---` fence. Used for the cross-model CONTROL agents on
    OpenCode: the model is single-sourced in the manifest's `models` block and
    pinned here at build time (OpenCode has no runtime per-task model override —
    PR #17577 closed-not-merged — so the cross-model review degrades to a static
    frontmatter pin). Thin + deterministic: a single fixed-position insert, no
    YAML parse/reserialize. The .fm files carry NO `model:` line, so the model id
    lives in exactly one place (the manifest); changing it is edit-two-values +
    regenerate, never a per-file edit."""
    opener = b"---\n"
    if not fm.startswith(opener):
        raise ValueError(
            "frontmatter does not start with a '---' fence — cannot inject the model pin"
        )
    pin = f"model: {model}\n".encode("utf-8")
    return opener + pin + fm[len(opener):]


def inject_variant(fm: bytes, variant: str) -> bytes:
    """Inject a `variant: <variant>` line into an agent's frontmatter, immediately
    after the opening `---` fence — the per-operation reasoning-effort tier for
    the cross-model CONTROL agents on OpenCode. The variant is single-sourced in
    the manifest's `models.control_variant` and injected here at build time: the
    control/review layer runs at LOW reasoning effort (a routine/check tier) to
    cut reasoning-token COUNT, while producers + the orchestrator keep their
    default reasoning (they get no variant line). Mirrors inject_model_pin: a
    single fixed-position insert, no YAML parse/reserialize, so the output stays
    deterministic. Applied AFTER inject_model_pin, so a control agent's fence is
    followed by `model:` then `variant:`. Verified 1.16.2: a per-agent `variant:`
    is accepted; a top-level `variant` in opencode.json is not (so the tier is
    per agent). The .fm files carry NO `variant:` line — the tier lives in exactly
    one place (the manifest); changing it is edit-one-value + regenerate."""
    opener = b"---\n"
    if not fm.startswith(opener):
        raise ValueError(
            "frontmatter does not start with a '---' fence — cannot inject the variant"
        )
    line = f"variant: {variant}\n".encode("utf-8")
    return opener + line + fm[len(opener):]


def generate(harness: str, out_root: pathlib.Path) -> list:
    """Build the adapter for `harness` into `out_root`. Returns the list of
    written paths (relative to out_root), in deterministic order."""
    manifest = load_manifest(harness)
    written = []

    # --- Cross-model pins (OpenCode): the model is single-sourced in the
    #     manifest's `models` block. `control_model` is pinned into each CONTROL
    #     agent's generated frontmatter (the review/audit layer runs a DIFFERENT
    #     model than the session — an independent cross-model check); the session
    #     model is injected into opencode.json (see the artifacts loop). The
    #     PRODUCERS are NOT pinned — they inherit the session. OpenCode has no
    #     runtime per-task model override (PR #17577 closed-not-merged), so the
    #     pin is STATIC. Absent `models` (e.g. the Claude manifest) -> no pins,
    #     so the Claude side stays byte-identical. ---
    models = manifest.get("models") or {}
    control_model = models.get("control")
    control_agents = set(models.get("control_agents", []))
    if control_agents and not control_model:
        raise ValueError("manifest `models.control_agents` is set but `models.control` is missing")
    # `control_variant` (per-operation effort tiering): the per-agent reasoning
    # effort `variant` injected into the SAME control agents, single-sourced here.
    # Optional — absent (e.g. the Claude manifest) -> no variant injected, so the
    # Claude side stays byte-identical; producers + the orchestrator never get one.
    control_variant = models.get("control_variant")

    # --- Agents: frontmatter + body ---
    agents = manifest["agents"]
    body_dir = SRC / agents["body_dir"]
    fm_dir = MANIFESTS / harness / agents["frontmatter_dir"]
    out_agents = out_root / agents["output_dir"]
    out_agents.mkdir(parents=True, exist_ok=True)
    for name in agents["names"]:
        fm = read_bytes(fm_dir / f"{name}{agents['frontmatter_suffix']}")
        if name in control_agents:
            fm = inject_model_pin(fm, control_model)
            if control_variant:
                fm = inject_variant(fm, control_variant)
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
            # A harness-local engine can also be a CONTROL agent (code-review is —
            # it runs the cross-model independent check), so apply the same pin AND
            # the same per-operation effort variant.
            if name in control_agents:
                fm = inject_model_pin(fm, control_model)
                if control_variant:
                    fm = inject_variant(fm, control_variant)
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
        data = read_bytes(src_art)
        # Single-source the OpenCode session model: the source opencode.json
        # carries a `__SESSION_MODEL__` placeholder in its top-level `model` key,
        # substituted here with models.session. The rationale (PROVISIONAL preview
        # default) cannot live in opencode.json itself — OpenCode validates it as
        # strict JSON and rejects unrecognized keys — so it stays in adapter.json's
        # _comment. Deterministic: a single fixed substitution of a string literal.
        placeholder = art.get("session_model_placeholder")
        if placeholder:
            session_model = models.get("session")
            if not session_model:
                raise ValueError(
                    f"artifact {art['output_file']} declares a session_model_placeholder "
                    "but the manifest has no `models.session`"
                )
            token = placeholder.encode("utf-8")
            if token not in data:
                raise ValueError(
                    f"artifact source {art['source_file']} is missing the session model "
                    f"placeholder {placeholder}"
                )
            data = data.replace(token, session_model.encode("utf-8"))
        out_art.write_bytes(data)
        written.append(rel)

    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate a harness adapter from neutral source.")
    ap.add_argument("--harness", default="claude", help="harness manifest to build: claude|opencode (default: claude); `reference` renders the harness-reference table")
    ap.add_argument("--out", default=None, help="output root override (default: manifest output_root); for `--harness reference`, the output file path")
    args = ap.parse_args()

    # `reference` is not an adapter build — it renders the reader-facing
    # harness-reference table from capabilities.json (single source). Kept on the
    # same CLI so the build surface is one entrypoint.
    if args.harness == "reference":
        try:
            rendered = render_reference_table()
        except (FileNotFoundError, ValueError) as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        out_path = pathlib.Path(args.out).resolve() if args.out else REFERENCE_TABLE
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered, encoding="utf-8")
        print(f"rendered harness-reference table -> {out_path}")
        return 0

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
