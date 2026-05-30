# audit-fixup-hooks-quoted-form — plan

## Audit reference

Combines two blocking findings and one note from `doc/features/audit-2026-05-30.md`.

**Blocking #3** — `.claude/settings.json:32`:
> the ssh-mutating-action regex under-blocks the common quoted form. ... When the orchestrator issues `ssh host "systemctl restart x"` or `ssh host "rm /etc/foo"` (a syntactically standard ssh invocation), the keyword is preceded by `"` not by space, so the regex misses and the prompt is not raised. Verified empirically: `ssh wb6 "systemctl restart wb-mqtt-serial"` and `ssh wb6 "rm /etc/foo"` both pass through silently.

**Blocking #4** — `.claude/settings.json:9-12, 20`:
> the `find` boundary hook under-blocks `find / -name x`. ... `find / -name foo` extracts nothing, hook skips, the full-filesystem search is permitted.

**Note #6** — `.github/workflows/auto-tag.yml`:
> No CI lint pass, no link checker, no schema-validate-of-settings.json. ... The hooks regex bugs found above (findings 3, 4) would have been caught by even a simple shell-based unit test on the regexes.

## Scenarios

1. После выполнения плана hook на ssh + content edit корректно блокирует кейс с кавычками: `ssh host "sed -i ..."`, `ssh host "rm /etc/foo"`, `ssh host "cat > /etc/foo"` — все три формы (двойные кавычки, одинарные кавычки, без кавычек). Verified by `tests/hooks.sh`.
2. После выполнения плана hook на ssh + mutating actions корректно блокирует quoted form: `ssh host "systemctl restart x"`, `ssh host "docker compose up"`, `ssh host "apt install foo"` — все формы.
3. После выполнения плана hook на find boundary корректно блокирует `find / -name x`, `find / -type f`, и любые формы где path = `/`.
4. `tests/hooks.sh` существует и покрывает все 5 hooks (Read boundary, find boundary, ssh content edit, ssh mutating, git force push, git no-verify). Для каждого hook — positive cases (должны deny/ask) и negative cases (должны pass).
5. CI workflow запускает `tests/hooks.sh` на каждом PR, который меняет `.claude/settings.json` или `tests/hooks.sh`. Failed test → блокирует merge.
6. После merge можно с уверенностью утверждать guarantee #10 («все изменения проходят через pipeline»): эта guarantee теперь имеет тестовый gate, не только Markdown инструкцию.

## Existing behaviors this feature touches

- `.claude/settings.json` уже содержит 5 hooks (после PR #145). Этот план **корректирует** regex'ы двух из них и добавляет тесты, не меняет hook architecture.
- `.github/workflows/auto-tag.yml` — release flow. Этот план **добавляет** новый workflow (separate file `.github/workflows/lint-hooks.yml`), не модифицирует существующий.
- `doc/stack-notes.md` — секция «Claude Code hooks API» уже описывает PreToolUse + hookSpecificOutput contract. Если в ходе работы найдём новые edge cases regex semantics — researcher респавн отдельным fixup'ом, не в этом плане.

## Categorical scope check

«Hook events» — категориальное множество в Claude Code API: `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, etc. (per `doc/stack-notes.md` Claude Code hooks API section).

PM выбирает scope: **только `PreToolUse`** (consistent с архитектурным решением в `doc/architecture.md` — «Hooks are PreToolUse-only»).

**Out of scope** (явные братья):
- `PostToolUse` — отдельным планом, если возникнет need
- `SessionStart`, `Stop`, `UserPromptSubmit`, `Notification` — отдельным планом
- Глобальная переработка hook architecture — out of scope; этот план только корректирует regex'ы + добавляет тесты

«Hook permission decisions» — ещё одна категория: `allow`, `ask`, `deny`. В scope все три (consistent с текущим settings.json — деsign не меняется).

## Stack expectations touched

Из `doc/stack-notes.md` (см. секцию «Claude Code hooks API»):

- **PreToolUse event input contract.** Hook receives JSON on stdin with `tool_name` and `tool_input` fields. Source: `doc/stack-notes.md` Claude Code hooks API → Idioms, citation `https://docs.claude.com/en/docs/claude-code/hooks`.
- **`hookSpecificOutput.permissionDecision` enum** — `allow`, `ask`, `deny`. Source: same.
- **`if:` field на hook entry** — Bash-pattern filter, форма `Bash(<pattern>)` с glob'ом для tool input matching. Source: same. Tests should verify the `if:` filter triggers correctly per pattern.
- **`matcher` field** — selects tool name (e.g., `"Read"`, `"Bash"`). Source: same.

Из `doc/stack-notes.md` секции **jq**:
- **`-r` raw output** flag for piping through grep. Source: jq manual.
- **`.field // empty`** idiom для absent-field safety. Source: jq manual.

Из `doc/stack-notes.md` секции **git**:
- **`git rev-parse --show-toplevel`** возвращает project root, exit 128 если вне git repo (используется в hook command как guard). Source: git man page.

## Contracts

**Modified:**
- `.claude/settings.json` — regex'ы для двух hook commands (ssh content edit, ssh mutating, find boundary). Регексы расширяются на quoted form (`"` и `'` как лексическая граница вместо только space) и на bare-root case (`find /<space>`).

**New:**
- `tests/hooks.sh` — POSIX shell script, не зависит от bash 4+. Сimulates hook input через stdin pipe, проверяет exit code/stdout matching expected `permissionDecision`. Покрывает все 5 hooks с positive + negative cases. Standalone (можно запустить локально). Exit 0 если все pass, 1 если хоть один fail.
- `.github/workflows/lint-hooks.yml` — runs `tests/hooks.sh` on PRs that touch `.claude/settings.json` or `tests/hooks.sh` itself. Uses `paths:` filter on push/pull_request events. Minimal — checkout + bash tests/hooks.sh.

## Test plan

Validation by test (это первый план, который шаблон сам себе вводит реальные автотесты — это note #6 из meta-audit'a, не нарушение принципа «no automated tests by design»: тесты на тесты, не на runtime behaviour).

**`tests/hooks.sh` обязан покрыть:**

- **Read boundary hook** — positive: путь вне `git rev-parse --show-toplevel` → deny; negative: путь внутри → pass.
- **find boundary hook** — positive: `find / -name x`, `find /etc`, `find /usr/share` → deny; negative: `find . -name x`, `find $PWD -name x` → pass.
- **ssh content edit hook** — positive: `sed -i`, `vi`, `vim`, `nano`, `tee`, `> file` форма; включая **quoted form**: `ssh host "sed -i ..."`, `ssh host 'rm /etc/foo'`, `ssh host "cat > /file"`; negative: read-only diagnostics (`ssh host cat`, `ssh host ls`, etc.).
- **ssh mutating hook** — positive: `systemctl restart`, `docker compose up`, `apt install`, `npm install`, `kubectl apply`, `rm`, `cp`, `mv`, `mkdir`, `touch`; включая **quoted form**; negative: read-only.
- **git force push hook** — positive: `git push --force`, `git push -f`, `git push --force-with-lease`; negative: `git push origin x`.
- **git no-verify hook** — positive: `git commit --no-verify`, `git commit --no-gpg-sign`; negative: `git commit -m x`.

**Coverage minimum:**
- Each hook: ≥ 3 positive cases, ≥ 2 negative cases.
- Quoted-form cases: at least 2 per content-edit and mutating hooks (`"` and `'`).
- find / case: at least 2 forms (`find / -name x`, `find / -type f`).

**Stack-spec tests** (per `plan-feature.md` rule):

- Test that hook input JSON matches the PreToolUse contract from `doc/stack-notes.md` (`tool_name` + `tool_input` fields).
- Test that hook output JSON contains exactly `hookSpecificOutput.hookEventName` + `permissionDecision` + `permissionDecisionReason` fields (no extra, no missing).

**CI workflow** verification:
- Workflow file `.github/workflows/lint-hooks.yml` validates against GitHub Actions YAML schema (manual inspection by reviewer).
- Workflow `paths:` filter включает `.claude/settings.json` + `tests/hooks.sh` + `.github/workflows/lint-hooks.yml` (self-reference).

## Docs to update

- `doc/architecture.md` § «File layout» — добавить `tests/hooks.sh` и `.github/workflows/lint-hooks.yml`.
- `doc/architecture.md` § «Architectural constraints» — корректировать «no automated tests by design» constraint: добавить exception «tests covering meta-infrastructure (hook regexes) are allowed; runtime/feature tests are not». Cite этот план как точку решения.
- `WORKFLOW.md` § «Hook-level enforcement» — добавить short note про tests/hooks.sh и CI workflow (для PM transparency: правила теперь имеют test-gate).
- `CHANGELOG.md` — pr-prep сам добавит entry.

## Out of scope

- `PostToolUse` / `SessionStart` / other event types — другим планом.
- Hook architecture redesign — only regex fixes + tests.
- Schema validation of `.claude/settings.json` против формального JSON Schema (Claude Code не публикует one) — может появиться отдельным fixup'ом, если выйдет.
- Link checker / general markdown lint — отдельные planы (note #6 говорит про hook regex tests конкретно, не общий lint).
- Migration tests на старые формы hook config — `.claude/settings.json` уже в текущем формате; backward-compat не требуется.

## Handoff

1. PM подтверждает план.
2. Орчестратор спавнит `coder` с инструкцией fix два regex + write tests/hooks.sh + new workflow + update doc/architecture.md + WORKFLOW.md hook-enforcement note. Coder читает `doc/stack-notes.md` § Claude Code hooks API как контракт.
3. Coder запускает `tests/hooks.sh` локально — все positive/negative должны pass. Pipeline: existing tests/lint (нет) + новый `bash tests/hooks.sh`.
4. Орчестратор спавнит `reviewer` — особое внимание на dim 9 (delivery layer: CI workflow привязан правильно), dim 10 (stack expectations против Claude Code hooks API), dim 1 (test plan coverage).
5. При approve — `pr-prep` оформляет PR.
6. PM мерджит. После merge: `.github/workflows/lint-hooks.yml` начинает gate'ить будущие PRs.

Architect не требуется — нет структурной развилки (regex fixes + new test file + new workflow, no internal layout choice).
