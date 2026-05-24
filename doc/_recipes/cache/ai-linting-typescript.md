---
stack: typescript
last_reviewed: 2026-05-22
stack_versions:
  typescript: ">=5.4"
  node: ">=20"
  eslint: ">=9"
  pnpm: ">=9"
  vitest: ">=1.0"
---

# AI-linting recipe: TypeScript

**Реализует** `development-protocol.md § 7.1` (Code linting catalogue) для TypeScript / Node.js / Browser стека.

**Целевой стек:**
- TypeScript ≥ 5.4 (strict mode)
- Node.js ≥ 20
- pnpm monorepo
- eslint ≥ 9 (flat config)
- prettier для форматирования
- dependency-cruiser для архитектурных constraints (§ 8)
- semgrep для custom security/architecture rules (§ 10)
- vitest для тестов

---

## Mapping: catalogue → concrete rules

### Debug-артефакты

- `eslint`: `no-console: error`, `no-debugger: error`
- `semgrep`: custom rule `no-debug-artifacts.yaml` — ловит `breakpoint()`, alert-style logging, lingering `debugger;`

### TODO/FIXME без issue-ref

- `semgrep`: custom rule — match `TODO`/`FIXME` без `(#NNN)` рядом. Fail-level.
- `eslint`: `no-warning-comments: warn` (default `["todo", "fixme"]`)

### Закомментированный код

- `eslint`: нет идеального встроенного правила; кастомный rule через `eslint-plugin-no-comments`
- `semgrep`: pattern `// $X` где `$X` matches JS/TS syntax patterns (variable declaration, function call, etc.) — heuristic
- Manual review остаётся последней линией

### Длинные функции / глубокая вложенность

- `eslint`:
  - `complexity: [error, 10]`
  - `max-lines-per-function: [error, 60]`
  - `max-depth: [error, 4]`
  - `max-nested-callbacks: [error, 3]`

### Слишком много параметров

- `eslint`: `max-params: [error, 5]`. Override через явный `// eslint-disable-next-line max-params -- reason: ...`

### Magic numbers / strings

- `eslint`: `no-magic-numbers: [error, { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, enforceConst: true }]`
- Strings без правила; ловится через `i18next/no-literal-string` (см. ниже) для user-facing

### Unchecked types / `any`

- `tsc`: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- `eslint` (`@typescript-eslint`):
  - `no-explicit-any: error`
  - `no-unsafe-assignment: error`
  - `no-unsafe-call: error`
  - `no-unsafe-member-access: error`
  - `no-unsafe-return: error`
  - `no-unsafe-argument: error`

### Mutable defaults / bare catch

- TypeScript: mutable defaults в JS не существуют (объекты создаются заново). Но shared references — ловятся через:
  - `eslint`: `no-shadow: error`, `prefer-const: error`
- Bare catch:
  - `eslint`: `@typescript-eslint/no-explicit-any: error` (catches `catch(e: any)`)
  - `@typescript-eslint/use-unknown-in-catch-callback-variable: error`

### Inconsistent naming

- `eslint`: `@typescript-eslint/naming-convention` с явной конфигурацией — `camelCase` для variables, `PascalCase` для types/components, `UPPER_CASE` для constants.

### Dead code / unused imports

- `eslint`:
  - `@typescript-eslint/no-unused-vars: error`
  - `import/no-unused-modules: error`
- `knip` (отдельный tool) для project-wide dead-code detection
- `dependency-cruiser`: `no-orphans` rule

### Floating promises / unhandled async

- `eslint` (`@typescript-eslint`):
  - `no-floating-promises: error`
  - `no-misused-promises: error`
  - `require-await: error`
  - `await-thenable: error`

### Naïve datetime

- `eslint`: `no-restricted-syntax: error` с pattern блокирующим `new Date($_, $_, ...)` без timezone library
- Force usage `date-fns-tz` / `luxon` через `import/no-restricted-paths`

### Sync I/O в async handlers

- `semgrep`: custom rule `no-sync-in-async.yaml` — ловит `fs.readFileSync` / `fs.writeFileSync` / `child_process.execSync` внутри `async function`

### Relative imports вне workspace

- `eslint`: `import/no-relative-packages: error`
- `dependency-cruiser`:
  - `no-deep-imports` — запрет глубоких import'ов внутрь пакета (только через index)
  - `no-circular` — циркулярные deps

### Magic comments / disable-rule без объяснения

- `eslint`: `eslint-comments/require-description: error` (нужен plugin `eslint-plugin-eslint-comments`)

### Hardcoded user-facing strings

- `eslint`: `i18next/no-literal-string: error` для user-visible слоёв (components, pages)
- `semgrep`: custom rule `no-hardcoded-user-strings.yaml` — на JSX content и Toast/alert calls

### Inline secrets / API keys

- `gitleaks` в pre-commit + CI
- `semgrep`: дефолтный pack `p/secrets`

---

## Что добавить в `package.json`

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "arch-check": "depcruise --config .dependency-cruiser.cjs src",
    "semgrep": "semgrep --config ci/semgrep-rules --error",
    "ci-local": "pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run arch-check && pnpm run semgrep && pnpm run test"
  }
}
```

## Что добавить в pre-commit (`.husky/pre-commit` или `lint-staged`)

```bash
pnpm run lint:fix
pnpm run format
pnpm run typecheck
gitleaks protect --staged
```

## Что добавить в CI (`.github/workflows/ci.yml`)

Все шаги обязаны быть **блокирующими** (`continue-on-error: false`). См. `development-protocol.md § 5`. Список:

1. `pnpm install --frozen-lockfile`
2. `pnpm run lint`
3. `pnpm run format:check`
4. `pnpm run typecheck`
5. `pnpm run arch-check`
6. `pnpm run semgrep`
7. `pnpm run test` + coverage report
8. `pnpm audit --audit-level moderate`
9. `gitleaks detect`

---

## Custom semgrep rules — список под создание

Кастомные rules, которые typically не существуют в default packs:

- `no-debug-artifacts.yaml`
- `no-todo-without-issue-ref.yaml`
- `no-sync-in-async.yaml`
- `no-hardcoded-user-strings.yaml`
- `english-only-comments.yaml` (если есть language policy в overlay)
- Stack-specific (например `no-math-random-in-crypto.yaml` для crypto-heavy проектов)

Кладутся в `ci/semgrep-rules/*.yaml`. Каждый rule имеет fixture-тесты в `ci/semgrep-rules/tests/<rule-name>/{ok.ts, bad.ts}`.

---

## Версионирование recipe'а

| Версия recipe | TS | Node | eslint | примечания |
|---|---|---|---|---|
| v0 (текущий) | ≥ 5.4 | ≥ 20 | ≥ 9 (flat) | initial |

При major-обновлении одного из tools — recipe пересматривается.

---

## Применение в Stage D

Bootstrap-агент в new-product mode, при работе над Stage D:

1. Спрашивает оператора: «стек TypeScript?».
2. Читает этот recipe.
3. Создаёт в проекте `.ai-pm/doc/ai-linting-rules.md` со ссылкой на этот recipe + project-specific дополнения (если есть).
4. Создаёт скелеты `.eslintrc`, `tsconfig.base.json`, `.dependency-cruiser.cjs`, `ci/semgrep-rules/` со ссылкой на этот recipe.
5. Проверяет: все 17 категорий из `development-protocol.md § 6.1` имеют конкретное правило в маппинге. Если нет — flag оператору.
