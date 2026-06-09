<!--
  Doc-style rules apply: fact-first, current-state-only, supersede-don't-edit,
  provenance-as-pointer, plain-language. Read them in `## Durable-text frugality`
  in `workflow/doc-style.md` — the authority; this comment names the rules and
  points there, it does not restate them.

  This is an on-demand decision file under `doc/decisions/`, sharded out of the
  thin `## Architectural decisions` index in `doc/architecture.md`. Each `###`
  record keeps the exact heading anchor it had in the index, so a reference of the
  form `doc/architecture.md` `### <heading>` still resolves (via the index entry
  that points here). Bodies are current-state-only decision records.
-->
# Template foundation — how the protocol ships and loads

On-demand decision records sharded from `doc/architecture.md` `## Architectural decisions`. See that index for the full set and one-line gists.

---

### Agents are plain Markdown files, not compiled artefacts

Persona files at `.claude/agents/*.md` are Markdown documents with YAML frontmatter. There is no compiled runtime, no plugin manifest, no build step — Claude Code loads them at session start by reading the directory. **Source:** `doc/features/template-v2_plan.md` ("Template repo structure" + "What's removed vs current protocol", v2 full rewrite, commit `eba8ab5 feat: template v2 — full rewrite`).

**Amendment (2026-06-07) — a development-side build step now exists; the downstream "plain files, no build" guarantee is preserved.** The dual-harness work (next decision record) **consciously changes** the "no build step" half of this decision. Under the chosen form C (build-time single-source, two-repo source/dist split), the adapter files for **both** harnesses are now **generated** from one harness-neutral source by a thin deterministic generator (`gen/generate.py` over neutral bodies in `src/` + per-harness manifests in `src/manifests/`), rather than each being the directly-authored runnable file. This is a **two-axis split, not a reversal**: the build step is introduced on the **development** side only; the property the original decision protected — **downstream gets plain files with no downstream build** — is **preserved intact**, because the distribution repo ships the **pre-built** plain `.claude/` (and `.opencode/`) files and downstream still runs `git submodule update --remote` with no build, no toolchain, no generator. What changed is only the *authored form* on the dev side: the source-of-truth is now neutral-source-that-is-built, not the runnable adapter directly. **Rationale (why a build step was accepted):** a single authored source across two harnesses is unachievable without *either* hand-duplicating every shared body (rejected — a self-maintained protocol cannot keep two copies in sync) *or* a build. Of the build forms, runtime-pointer softness (form A: a soft system-prompt pointer the agent must obey, plus Windows-fragile symlinks) and a one-repo build mixing generated files into the dev tree (form B) were both rejected in favour of C, which keeps the dev tree clean-source-only and ships hard, self-contained generated files. The generated Claude adapter is **byte-identical** to the prior hand-authored one — frozen as a golden reference and guarded by a byte-equivalence test (`tests/generator.sh`) plus a `single-source-diff-clean` regenerate-and-compare check — so what a Claude session loads is provably unchanged by the new build. **Status:** adopted; stage (a) (generator + both adapters + the integrity checks) is **built on the local integration branch `feature/opencode-harness-support`, not merged to `main`**; the repo split (stage b) is **PM-gated/pending**. **Source:** `doc/features/opencode-harness-support_plan.md` (pass-4 PM decision 2026-06-07; "Existing behaviors this feature touches" → the DELIBERATELY-CHANGED entry); `.ai-pm/arch/opencode-harness-support_arch.md` (form-C rationale, the dogfood-loop / byte-equivalence treatment); `.ai-pm/state/current.md` (stage-(a) as-built — slices 1–5).

---

### Commands are Markdown procedures

Slash commands at `.claude/commands/*.md` (`pm-bootstrap`, `pm-plan`, `pm-audit`, `pm-research`, `pm-fixup`) are Markdown procedure documents — the same loading mechanism as agents. They are developer-operator shortcuts, not the PM interface. **Source:** `doc/features/template-v2_plan.md` ("Key design decisions" section: "Slash commands are developer shortcuts, not PM interface").

---

### WORKFLOW.md imported into downstream `CLAUDE.md` via `@.ai-pm/tooling/WORKFLOW.md`

The orchestration rules (agent roster, edit-ownership rule, remote-system boundary, git workflow, PM communication style) live in `WORKFLOW.md` at the template root. Downstream projects import it from their own `CLAUDE.md` via the `@.ai-pm/tooling/WORKFLOW.md` import directive, so an update to the template's WORKFLOW.md reaches every downstream project at the next `git submodule update --remote`. **Source:** `README.md` § "Структура downstream-проекта" — "`CLAUDE.md` … (автоматически импортирует `.ai-pm/tooling/WORKFLOW.md`)"; original split decision in commit `dec55b4 feat: split CLAUDE.md into static project part + dynamic WORKFLOW.md`.

---

### Settings.json delivered via symlink, not copy

Downstream installation creates `.claude/settings.json` as a symlink to `../.ai-pm/tooling/.claude/settings.json`, not a copy. A `git submodule update --remote` therefore picks up new hooks immediately without a per-project re-install. **Source:** `README.md` § "Установка" — the `ln -s ../.ai-pm/tooling/.claude/settings.json .claude/settings.json` line, added in commit `2626106 docs: add settings.json symlink to install instructions (#141)`.

---

### Hooks layer for cross-session enforcement of WORKFLOW rules

`WORKFLOW.md` documents the remote-edit boundary and the force-push / no-verify gates as prose rules. The same rules are also wired as Claude Code `PreToolUse` hooks in `.claude/settings.json`, so they hold even when a future session does not re-read WORKFLOW.md. The hooks gate Read/Bash path boundaries, `find` outside root, ssh + content edit, ssh + mutating action, `git push --force / -f / --force-with-lease`, `git commit --no-verify / --no-gpg-sign`. **Source:** PR #145, commit `ac5827a feat(hooks): enforce remote-edit boundary + force-push + no-verify gates`. Cross-referenced in `WORKFLOW.md` § "Hook-level enforcement".

---

### Release flow: CHANGELOG entry → auto-tag → tag + GitHub Release

`.github/workflows/auto-tag.yml` runs on every push to `main`, reads the top `## [<VERSION>]` entry from `CHANGELOG.md`, creates the matching `v<VERSION>` tag if missing, extracts the section as release notes, and calls `gh release create`. No release branch, no manual tagging, no confirmation gates. **Source:** `.github/workflows/auto-tag.yml` (current shape); decision sequence: `3f1ef5b Streamline release workflow: auto-tag + no confirmation gates`, `e14b720 fix: auto-tag reads CHANGELOG instead of commit message`, `ad3d30f fix: merge auto-tag and create-github-release into one workflow`, `c240181 fix: release workflow checks GitHub Release, not tag`.
