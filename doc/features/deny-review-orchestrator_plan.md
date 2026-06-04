# deny-review-orchestrator — plan

Source: PM-directed 2026-06-05 — "там появился такой скилл в wb-* плагинах … как бы нам сделать так, чтобы он по умолчанию не перехватывал в проекте без явного вызова" + "ну и проекты на базе шаблона" + "deny + env-escape" (PM-chosen) + "хук отключать конкретный а не все" + "в доку пропиши в разделе установка". Escalated from `/pm-fixup` (fails fixup condition 2: adds behavior + a user-read deny message + a documented user-facing env-flag).

*A new wb-agent-tools skill, `wb-development:code-review-orchestrator`, ships a very broad auto-trigger description ("whenever the user asks to review a diff / PR / branch / changes … 'review my changes', 'is this safe to merge', 'did I break anything', 'can this be simplified', even 'take a look at my changes'"). In an ai-pm project it would **auto-intercept the protocol's own `/code-review` Pass-2**. The project already has a `PreToolUse` routing/deny hook in the shipped `.claude/settings.json` (the file every downstream project symlinks via the submodule) that hard-denies the wb-* role skills (coder / code-reviewer / design-review / plan-feature / pr-prep / workflow / pr-author) and routes them to pm-* + `/code-review`. This feature extends that hook to cover the orchestrator skill — but with a **surgical, documented, per-skill env-escape** so an explicit run stays possible without disabling any other hook.*

Non-user-facing meta-feature on the shipped tooling (subjects = the routing hook / the skill / the project / downstream agents). Software-kind. No Product Contract, no product-readiness advocate gate, no `## Validation` gate. Ships to every downstream project via the submodule. Verification = `tests/hooks.sh` green (new cases) + editorial.

## Scenarios

1. **Auto-intercept is blocked by default.** When the model (or the user's phrasing) would invoke `wb-development:code-review-orchestrator` and `WB_ALLOW_REVIEW_ORCHESTRATOR` is **not** `1`, the `PreToolUse` routing hook returns `permissionDecision: "deny"` with a reason that says the skill duplicates the protocol's `/code-review` Pass-2 — use `/code-review`, or set `WB_ALLOW_REVIEW_ORCHESTRATOR=1` to run it explicitly this session. So the protocol's own review flow is never silently hijacked, in this repo and in every downstream project.
2. **Surgical per-skill env-escape.** When `WB_ALLOW_REVIEW_ORCHESTRATOR=1` is set in the session, the hook lets **only** `code-review-orchestrator` through (exit 0, no output — "no decision; normal permission flow applies"). Every **other** hook and every **other** wb-* deny stays fully active — the escape disables *this one behavior*, not all hooks (unlike `/hooks`, which would disable everything). The PM's "отключать конкретный, а не все".
3. **The other wb-* role skills are unchanged.** `coder` / `code-reviewer` / `design-review` / `plan-feature` / `pr-prep` / `workflow` / `pr-author` stay **hard-denied with no env-escape** — the flag is scoped to `code-review-orchestrator` only. They keep their existing deny message and routing.
4. **Documented in the README install section.** A reader does not have to guess: the README install section states that the protocol denies `code-review-orchestrator` by default (it would auto-intercept `/code-review`) and that `WB_ALLOW_REVIEW_ORCHESTRATOR=1` runs it explicitly for the session without disabling other hooks.
5. **Additive, ships downstream, no migration.** The change is one extra branch in an existing hook + new test cases + one README note. Existing projects pick it up at their next submodule bump; no migration, no template structural change, no new enum value.

## Existing behaviors this feature touches

(what must not break)

- **The existing `PreToolUse` routing/deny hook** in `.claude/settings.json` — the wb-* role-skill denies and their message stay byte-equivalent; the orchestrator skill is added as a *separate* branch with its own message + the env-gate, not folded into the role-skills' case.
- **Every other `PreToolUse` hook** (path-outside-root, find-outside-root, ssh-content-edit, `git push --force`, `git commit --no-verify`, the `UserPromptSubmit` route reminder) — untouched; the env-escape is scoped to the one skill name and never short-circuits another hook.
- **`tests/hooks.sh`** — the existing 71 cases stay green and unmodified; new cases are added.
- **Downstream projects** — they symlink/copy this `.claude/settings.json`, so they inherit the deny + the escape; no per-project action needed.

## Contracts

None. Non-user-facing tooling change. (The env var `WB_ALLOW_REVIEW_ORCHESTRATOR` is an operational escape knob, not a product API; it is documented in the README, not a Product Contract.)

## Stack expectations touched

(from `doc/stack-notes.md` — Claude Code hooks API + jq, last reviewed 2026-05-30)

- **Claude Code hooks API**: `permissionDecision` enum is `"allow" | "ask" | "deny" | "defer"`; the deny path emits `hookSpecificOutput` with `permissionDecision: "deny"` and a `permissionDecisionReason` string **shown to the user verbatim**. Source: <https://code.claude.com/docs/en/hooks>.
- **Claude Code hooks API**: the env-escape "let-through" must be **exit 0 with no output** — "normal permission flow applies" (no-decision). Source: <https://code.claude.com/docs/en/hooks> (the `rm -rf` example: `else exit 0 # no decision; normal permission flow applies`).
- **Claude Code hooks API**: the routing hook reads the skill/subagent name from `tool_input.subagent_type // tool_input.skill` on the `PreToolUse` stdin contract. Source: <https://code.claude.com/docs/en/hooks>.
- **jq**: `hookSpecificOutput` JSON is built with `jq -nc` (the project's existing routing-hook form); the deny object is emitted on stdout. Source: <https://jqlang.org/manual/>.
- **Integration**: artifact `.claude/settings.json` is delivered to downstream via the `.ai-pm/tooling/` submodule symlink/copy; validated by `tests/hooks.sh` exercising the hook command with a representative `tool_input` JSON on stdin.

## Interaction scenarios

Provably isolated: the change is a config edit + test cases + a doc note. The hook is **stateless** (each `PreToolUse` invocation reads its own stdin + the `WB_ALLOW_REVIEW_ORCHESTRATOR` env, decides, exits) — no shared mutable state, no concurrency, no I/O beyond stdin/stdout. The env var is read, never written.

## Test plan

- Existing tests that must pass: `tests/hooks.sh` (71/71 — unchanged; the new cases are additive).
- New tests (added to `tests/hooks.sh`, the routing-hook section, following the existing `run_case` harness):
  - `routing: code-review-orchestrator without flag → deny`: given `tool_input.skill = wb-development:code-review-orchestrator` and `WB_ALLOW_REVIEW_ORCHESTRATOR` unset, when the routing hook runs, then it emits `permissionDecision: "deny"` (full `hookSpecificOutput` shape asserted, as the harness does for deny cases).
  - `routing: code-review-orchestrator with WB_ALLOW_REVIEW_ORCHESTRATOR=1 → no-decision (pass)`: given the same skill and `WB_ALLOW_REVIEW_ORCHESTRATOR=1` exported, when the hook runs, then it exits 0 with no output (let-through / normal permission flow).
  - `routing: wb-development:coder stays denied even with WB_ALLOW_REVIEW_ORCHESTRATOR=1 (escape is per-skill)`: given a role skill and the flag set, when the hook runs, then it still emits `deny` — proving the escape is scoped to the one skill, not a blanket hook-off.
- Stack-spec tests (per the Claude Code hooks API rules above): the three cases verify behavior against the cited contract — `deny` carries the `permissionDecision: "deny"` shape (not the coder's own ad-hoc string), and the let-through is exit-0-no-output (the documented no-decision form), not a custom "allow" object. Each new case cites the hooks-API source in a comment.

## Docs to update

- `README.md` (install section) — a short note: the protocol denies `wb-development:code-review-orchestrator` by default (it would auto-intercept the protocol's `/code-review` Pass-2), and `WB_ALLOW_REVIEW_ORCHESTRATOR=1` runs it explicitly for the session **without disabling other hooks**. Authored by `pm-architect` (README front-door owner), via the post-coding "Docs to update" handoff.
- *(No `docs/architecture.md` decision record required — this is a small additive hook entry, not an architectural decision; the hook's role is already documented in `doc/stack-notes.md` "Claude Code hooks API". No `MIGRATIONS.md` / template structural change.)*

## Out of scope

- **The other wb-* role skills** (coder / code-reviewer / design-review / plan-feature / pr-prep / workflow / pr-author) — the categorical siblings of `code-review-orchestrator`. They stay hard-denied with **no** env-escape (the PM scoped the escape to the orchestrator skill only — the role skills always have pm-* equivalents and never warrant an explicit run). Each remains exactly as today; this feature does not touch their case or message.
- **A blanket "disable all wb-* skills" toggle** — explicitly rejected; the PM asked for a *specific* escape, not an all-hooks-off switch. `WB_ALLOW_REVIEW_ORCHESTRATOR` bypasses only this one deny.
- **`docs/architecture.md` decision record** — not warranted for a single additive hook branch (see Docs to update).
- **Changing the upstream wb skill** — out; we control only our routing hook, not the wb-agent-tools skill's description.
