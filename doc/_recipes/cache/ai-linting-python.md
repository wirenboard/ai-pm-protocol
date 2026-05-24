---
stack: python
last_reviewed: 2026-05-22
stack_versions:
  python: ">=3.11"
  ruff: ">=0.5"
  mypy: ">=1.10"
  pytest: ">=8.0"
---

# AI-linting recipe: Python

**Реализует** `development-protocol.md § 7.1` для Python 3.11+ стека.

## Mapping: catalogue → concrete rules

### 1. Debug-артефакты

- `ruff`: `T201` (print), `T203` (pprint).
- `flake8-debugger` plugin или встроенный в ruff `T100` (debugger).
- `semgrep`: custom rule `no-debug-artifacts.yaml` — `breakpoint()`, `pdb.set_trace()`.

### 2. TODO/FIXME без issue-ref

- `ruff`: `FIX001` (todos), `FIX002` (fixmes).
- `semgrep`: custom rule с regex `TODO(\s|:)` без `(#\d+)`.

### 3. Закомментированный код

- `ruff`: `ERA001` (commented-out code, eradicate).

### 4. Длинные функции / глубокая вложенность

- `ruff`: `C901` (mccabe complexity, default ≤ 10), `PLR0915` (too many statements), `PLR0912` (too many branches).
- `mypy-extension` или `radon` для extra metrics.

### 5. Слишком много параметров

- `ruff`: `PLR0913` (too-many-arguments, default ≤ 5).

### 6. Magic numbers / strings

- `ruff`: `PLR2004` (magic-value-comparison).

### 7. Unchecked types / `Any`

- `mypy`: `--strict` + `disallow_any_explicit`, `disallow_any_generics`.
- `ruff`: `ANN401` (any-type in annotations).

### 8. Mutable defaults

- `ruff`: `B006` (mutable-argument-default).

### 9. Bare catch

- `ruff`: `E722` (bare-except), `BLE001` (blind-except).

### 10. Inconsistent naming

- `ruff`: `N801`-`N818` (naming conventions).

### 11. Dead code / unused imports

- `ruff`: `F401` (unused-import), `F841` (unused-variable).
- `vulture` для project-wide dead code detection.

### 12. Floating promises / unhandled async (async-aware Python)

- `ruff`: `RUF006` (asyncio-dangling-task).
- `mypy` async-checks для proper `await`.

### 13. Naïve datetime

- `ruff`: `DTZ001`-`DTZ012` (datetime-without-timezone).

### 14. Sync I/O в async handlers

- `ruff`: `ASYNC100`-`ASYNC230` (flake8-async).

### 15. Relative imports

- `ruff`: `TID252` (banned-relative-imports), `import-linter` для granular control.

### 16. Magic comments / suppressions без объяснения

- `ruff`: `RUF100` (unused-noqa). Дополнительно — custom regex check «`# noqa:`» without `# reason:`.

### 17. Hardcoded user-facing strings

- Project-specific custom rule (нет defaults в ruff). Semgrep `no-hardcoded-user-strings.yaml`.

### 18. Inline secrets

- `gitleaks` в pre-commit + CI.
- `bandit`: `B105`, `B106`, `B107` (hardcoded passwords).

### 19. Resource leaks

- `ruff`: `SIM115` (open-file-with-context-handler), `B017` (assertraises-exception).

### 20. Date arithmetic вручную

- Project-specific check (heuristic): use `datetime.timedelta`, не manual ms arithmetic.

### 21. Test discipline (mock-everything, vacuous assertions)

- `pylint`: project-specific custom checks.
- Heuristic CI script: count mocks per test file, fail if > N.

### 22-25. Inconsistent error handling, etc.

- Большая часть covered by `ruff` + `mypy`.

---

## Architecture linting (§ 8)

- **import-linter** (`backend/config/.importlinter`) — declarative contracts для layered architecture, plugin isolation, encapsulation.
- **pydeps** — visualization.
- **deptry** — unused/missing dependencies.

---

## Security scanning (§ 10)

- `bandit` — SAST для Python (CWE coverage).
- `pip-audit` или `safety` — dependency CVEs.
- `gitleaks` — secrets.
- `semgrep` — OWASP/CWE rulesets:
  - `--config p/python`
  - `--config p/owasp-top-ten`
  - `--config p/cwe-top-25`

---

## CI workflow skeleton (GitHub Actions)

```yaml
jobs:
  ai-pm-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install ruff mypy bandit pip-audit
      - run: ruff check . --output-format=github
      - run: ruff format . --check
      - run: mypy . --strict
      - run: bandit -r . --severity-level medium

  ai-pm-security:
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@v4
      - run: semgrep --config p/owasp-top-ten --config p/cwe-top-25 --config p/python --error

  ai-pm-spec-discipline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash .ai-pm/tooling/scripts/check-spec-discipline.sh
```

---

## Применение в Stage D

Init-agent в new-product mode при stack=python:
1. Использует этот recipe как стартовую точку.
2. Создаёт `.ai-pm/doc/ai-linting-rules.md` со ссылкой + project-deltas.
3. Скаффолдит конфиги: `pyproject.toml` с `[tool.ruff]` + `[tool.mypy]` блоками, `bandit.yaml`, semgrep rules, pre-commit.
4. Проверяет catalogue coverage — все ли категории mapped?
