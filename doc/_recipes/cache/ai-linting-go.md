---
stack: go
last_reviewed: 2026-05-22
stack_versions:
  go: ">=1.22"
  golangci-lint: ">=1.59"
---

# AI-linting recipe: Go

**Реализует** `development-protocol.md § 7.1` для Go 1.22+ стека.

## Mapping: catalogue → concrete rules

### 1. Debug-артефакты

- `golangci-lint`: `forbidigo` (`fmt.Println` в production), `gocritic`.
- `semgrep`: custom rule для `fmt.Print*` outside of main / cli.

### 2. TODO/FIXME без issue-ref

- `golangci-lint`: `godox` (configurable keywords + format check).

### 3. Закомментированный код

- `golangci-lint`: `gocritic` (commented-out check via `commentedOutCode`).

### 4. Длинные функции / глубокая вложенность

- `golangci-lint`: `funlen`, `gocognit`, `gocyclo`, `cyclop`.

### 5. Слишком много параметров

- `golangci-lint`: `funlen` (config max params).

### 6. Magic numbers

- `golangci-lint`: `gomnd` (magic number detector).

### 7. Unchecked types (`interface{}` без обоснования)

- `golangci-lint`: `iface` или `gocritic` checks для `interface{}` overuse. Go 1.18+ — prefer `any`.
- `gocritic`: `typeAssertChain`, `unnecessaryCast`.

### 8. Resource leaks (Go-specific: no defer-close)

- `golangci-lint`: `bodyclose` (HTTP response body not closed), `rowserrcheck` (sql.Rows not closed), `sqlclosecheck`.

### 9. Bare catch — N/A в Go (no exceptions).

- Однако: `errcheck` enforce'ит explicit error handling.

### 10. Inconsistent naming

- `golangci-lint`: `golint` / `revive` (export naming, receiver naming, package naming).

### 11. Dead code / unused imports

- `golangci-lint`: `unused`, `deadcode` (deprecated, use `unused`), `unparam`.

### 12. Floating promises / goroutine leaks

- `golangci-lint`: `goroutinelink` (если есть), или custom static analysis.
- `go vet -vettool=$(which shadow)` для variable shadowing.

### 13. Naïve datetime

- Custom check: detect `time.Now()` without timezone awareness in serialization paths.

### 14. Sync I/O в async handlers — concept N/A.

- Go concurrency model differs. Но: detect blocking calls in goroutines via `ctx.Done()` ignored.

### 15. Relative imports

- Go module system естественно prevents. Но: `gocritic`/`depguard` для cross-package restrictions.

### 16. Magic comments / `//nolint` без объяснения

- `golangci-lint`: `nolintlint` (требует reason в `//nolint` directives).

### 17. Hardcoded user-facing strings

- Project-specific. `semgrep` custom rule.

### 18. Inline secrets

- `gitleaks` в pre-commit + CI.
- `golangci-lint`: `gosec` G101 (hardcoded credentials).

### 19. Inconsistent error handling style

- `errcheck` (errors not checked), `errorlint` (errors.Is/As usage), `wrapcheck` (return uncast errors).

---

## Architecture linting (§ 8)

- **`depguard`** (golangci-lint plugin) — layered architecture, package boundaries.
- **`go-arch-lint`** — declarative architecture rules.
- **`go mod why`** для dependency justification.

---

## Security scanning (§ 10)

- **`gosec`** — SAST для Go (covers G101-G505: crypto, file perms, network, SQL injection).
- **`govulncheck`** — CVEs в dependencies и stdlib.
- **`gitleaks`** — secrets.
- **`semgrep`**:
  - `--config p/golang`
  - `--config p/owasp-top-ten`
  - `--config p/cwe-top-25`

---

## CI workflow skeleton

```yaml
jobs:
  ai-pm-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"
      - uses: golangci/golangci-lint-action@v6
        with:
          version: latest

  ai-pm-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
      - run: go install golang.org/x/vuln/cmd/govulncheck@latest
      - run: govulncheck ./...
      - run: docker run --rm -v $(pwd):/src returntocorp/semgrep semgrep --config p/golang --config p/owasp-top-ten --error /src
```

---

## Применение в Stage E

Init-agent в new-product mode при stack=go:
1. Использует этот recipe.
2. Создаёт `.golangci.yml` с включёнными linters из mapping.
3. Создаёт `gosec.yaml` если нужны custom configs.
4. Generates pre-commit hooks.
5. Validates catalogue coverage.
