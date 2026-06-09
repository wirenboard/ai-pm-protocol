# Product Contract: dual-harness-from-one-source

User-facing contract for the guarantee that **the protocol runs on two AI coding harnesses from a single source of truth** — both adapters are generated from one harness-neutral source, the instruction prose names every harness-specific concept with a neutral noun, and enforcement is faithful on both harnesses (with OpenCode labeled preview). The *user* is the AI agent (which loads a faithful adapter on whichever supported harness it runs) and the PM (who can adopt the protocol on either harness without losing guarantees).

---

## User value

The protocol's guarantees should not be tied to one AI coding tool. This guarantee lets it run on two harnesses (Claude Code, and OpenCode in preview) without maintaining two divergent copies: a single harness-neutral source generates both adapters, and the shared instruction prose refers to every harness-specific concept by a neutral noun (the project entry file, the structured-question tool, the enforcement layer, the instruction-loading mechanism) resolved per harness through one reference table. The PM can adopt the protocol on either harness and get the same disciplined behavior; the agent loads an adapter that is faithful to the single source.

## Who uses it

The AI agent (which loads the generated adapter for its harness), and the PM/maintainer (who gets two-harness support without a divergent-copy maintenance burden).

## Must work

- Both adapters are generated from one harness-neutral source by a deterministic generator — neither adapter is independently hand-maintained.
- The shared instruction prose names every harness-specific concept with a neutral noun, resolved per harness through one harness-reference table.
- Downstream receives plain, pre-built adapter files with no downstream build step, toolchain, or generator — the build step exists on the development side only.
- The generated Claude adapter is byte-identical to the prior hand-authored one, frozen as a golden reference and guarded by a byte-equivalence check.
- Enforcement is faithful on both harnesses — the same rules, realized through each harness's own enforcement primitive.

## Must not break

- The downstream "plain files, no build" property is preserved — adding a development-side build never imposes a build on downstream.
- The generated Claude adapter stays byte-identical to the golden reference — the byte-equivalence test and the regenerate-and-compare check guard it.
- A behavioral skew between harnesses (e.g. a guard with no "ask" outcome on one harness, the per-prompt vs always-on route reminder) is labeled and documented, never silently divergent.
- OpenCode stays labeled **preview** until certified — the not-yet-in-preview pieces (install auto-detect, the bash-`find` boundary guard and "ask"-class guards, a protocol-owned review/research engine, the repo split) are honestly disclosed, never implied as complete. *(The earlier "cross-model model pins" gap was dropped: the baked per-agent cross-model pins were retired and replaced by a single-session default plus a bump-surviving personal-`opencode.json` control-layer-model pattern — see `doc/architecture.md` § "OpenCode compact one-pass reviewer …" — so it is no longer a deferred preview gap.)*

## Acceptance checks

- `tests/generator.sh` (byte-equivalence) + the `single-source-diff-clean` regenerate-and-compare check — verify the generated Claude adapter equals the golden reference.
- `doc/architecture.md` § "Agents are plain Markdown files" (the 2026-06-07 dual-harness amendment) — verifies the two-axis split and the preserved downstream no-build property.
- The harness-reference table (`gen/harness-reference.md`) + `workflow/enforcement.md` § "Hook-level enforcement" (harness-neutral realization) — verify the neutral-noun resolution and the per-harness enforcement realization.

## Out of scope

- Harnesses beyond Claude Code and OpenCode — the architecture generalizes to N adapters, but Cursor, Codex CLI, Aider, and similar are not built.
- Full OpenCode certification this slice — OpenCode is a labeled preview gated on tracked upstream gaps; the source/distribution repo split (stage b) is PM-gated/pending.
- Imposing a build, toolchain, or generator on downstream — downstream always gets pre-built plain files.

## Last reviewed

2026-06-07 — by pm-architect, against current main

## Built/changed by

- opencode-harness-support — 2026-06-07 — the build-time single-source two-repo split, the generator, both adapters, the byte-equivalence integrity checks, and the OpenCode preview labeling.
- harness-neutral-prose — 2026-06-07 — the neutral-noun instruction prose and the harness-reference resolution table.

---

## Behavioral contract

The dual-harness rules are single-sourced, not restated here: the build-time single-source decision, the two-axis (dev-build / downstream-no-build) split, and the byte-equivalence guard in `doc/architecture.md` § "Agents are plain Markdown files" (2026-06-07 amendment); the neutral-noun resolution in the harness-reference table (`gen/harness-reference.md`); the harness-neutral realization of enforcement in `workflow/enforcement.md` § "Hook-level enforcement".
