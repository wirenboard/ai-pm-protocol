# audit-fixup-self-docs-architecture — review

**Reviewed file:** `doc/architecture.md` (uncommitted, written by `architect` with extended prompt).
**Plan:** `doc/features/audit-fixup-self-docs-architecture_plan.md`.

---

## Plan compliance

- ✓ All 7 in-scope sections present with substantive content — `Project`, `Tech stack`, `Architectural decisions`, `Architectural constraints`, `File layout`, `Integration contract`, `Release flow`. Each is more than a stub; each makes the template's own structural choices legible to a downstream reader.
- ✓ All 5 N/A sections present with header + one-line reason — `Security constraints`, `Code conventions`, `Deploy / runtime`, `Database / state`, `UI guide`. None deleted, none blank.
- ✓ `Tech stack` section is a directory into `doc/stack-notes.md`, not a duplicate. The six components in the table (Markdown frontmatter, Claude Code hooks API, jq, git, gh, GitHub Actions) match one-for-one with the six entries in `stack-notes.md`. Conventional Commits / SemVer / Keep-a-Changelog are correctly noted as intentionally out of scope (consistent with `stack-notes.md`'s scope decision).
- ✓ Every architectural decision carries a citation. Spot-checked four:
  - PR #145 (`ac5827a`) — commit message describes exactly the three ssh + force-push + no-verify hook gates the architecture.md "Hooks layer for cross-session enforcement" decision claims. Match.
  - PR #143 (`cf889c6`) — commit message describes the auditor subagent extraction; matches the "Auditor / stack-researcher / docs-extractor as read-only subagents" decision.
  - PR #142 (`6e1bf14`) — commit message confirms the categorical scope check + stack-researcher introductions; matches both the "Categorical scope check at plan-feature stage" decision and the stack-researcher attribution.
  - PR #144 (`9f81f64`) — commit message describes the notes split + edit-ownership rule; matches the "Edit-ownership split" decision.
- ✓ Every architectural constraint has a one-line reason + source citation. All four (no automated tests, template stays application-agnostic, settings.json delivered as symlink, hooks PreToolUse-only) trace to either a plan file, a commit, or an empirical observable in `.claude/settings.json` (verified: `jq '.hooks | keys'` returns `["PreToolUse"]` only).
- ✓ `File layout` section matches actual repo state. Cross-checked against `ls -la` of project root, `.claude/`, `doc/`, `doc/_templates/`, `.github/workflows/`, and `git ls-tree -r --name-only HEAD`. Seven agents and four commands listed exist; seven `_templates/*.tmpl` files listed all exist. `.claude/settings.local.json` correctly noted as local-only / not delivered (verified via `git check-ignore`).
- ✓ `Release flow` section matches `.github/workflows/auto-tag.yml` step by step. Trigger (`push` to `main`), workflow-level `permissions: contents: write`, `actions/checkout@v4` with `fetch-depth: 0`, the `grep -m1 '^## \[[0-9]'` extraction, the `gh release view` idempotency check, the `if: steps.detect.outputs.is_release == 'true'` gate, the `awk "/^## \[${VERSION}\]/,/^## \[[0-9]/"` slice, and `gh release create "$TAG" --title "Release $TAG" --notes-file /tmp/release_notes.md` — all present in the workflow exactly as described.
- ✓ `Integration contract` section matches `README.md § Установка`. The three symlinks listed (`.claude/agents`, `.claude/commands`, `.claude/settings.json`) are exactly the three `ln -s` lines in the install snippet. The submodule path `.ai-pm/tooling` matches `git submodule add … .ai-pm/tooling`. The WORKFLOW.md import via `@.ai-pm/tooling/WORKFLOW.md` matches README's "Структура downstream-проекта" description.

---

## Blocking

None.

---

## Notes (product)

1. **Two template sections — "External standards" and "Dependencies" — are omitted entirely**, neither rendered nor explicitly marked `N/A — <reason>`. The plan said: "Каждый раздел, отсутствующий из шаблона, явно отмечается как «N/A — <reason>» вместо удаления, чтобы downstream-читатель понимал что шаблон сам прошёл по своей же структуре." Strict reading of the plan would require N/A entries for both. Architect raised this as an open question because both sections are PM-project-only categories (no external standards apply to a documentation-only template; no runtime dependencies to declare), so adding `N/A — not applicable` rows feels mechanical. Either choice is defensible for the meta-case. Decision is the PM's: (a) add both as N/A for strict 1:1 fidelity, (b) accept the omission and consider documenting in the plan or template that these are project-only sections, (c) accept as-is and move on.

---

## Notes (technical)

1. `doc/architecture.md:126` — citation `README.md § "Установка" + § "Обновление шаблона"` — `Обновление шаблона:` is not a `##` section header in README, it is an inline line (`README.md:74`) inside the "Установка" section. Cleanest fix: collapse to `README.md § "Установка"` (the line is inside that section already). Routing: respawn `architect` with this single citation correction batched in with any product-note fix the PM picks.

2. `doc/architecture.md` release-flow section opens with a 4-step prose flow that mixes the developer-side steps (branch, PR, merge) with the workflow-side steps (`auto-tag.yml` runs on push). A reader who only wants to know "what does CI do" has to skip past steps 1–3 first. Optional structural polish (split into "Developer side" and "CI side" subsections), not blocking — the current form is correct and traceable. Routing: drop on merge — phrasing-only, no factual fix needed.

3. The list of seven persona names appears three times in the document: once in the `Project` section (as the agent roster description), once in `File layout` (as `.claude/agents/` content), and implicitly across `Architectural decisions` (the subagent decision names them). Three mentions of the same list look like duplication on a quick scan, but each mention is anchored to a different concern (who-uses-the-template, where-files-live, why-this-split). Deduplication risks losing the structural information. Routing: drop on merge — duplication has structural purpose.

---

## Verdict

**approve**

This PR adds `doc/architecture.md` to the template — the document the template tells every downstream project is mandatory, finally written for the template itself. The document walks its own architecture template, marks irrelevant sections as `N/A — <reason>` instead of deleting them, records nine architectural decisions with PR / commit citations, lists four hard constraints with sources, and cross-checks the file layout against `ls`, the release flow against `.github/workflows/auto-tag.yml`, and the integration contract against the README install instructions. One product note (two template sections omitted rather than marked N/A) is for the PM to weigh — not blocking. Three technical notes are routed to the architect or dropped on merge.
