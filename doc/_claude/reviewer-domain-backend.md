# Reviewer domain: Backend

Применяется для PR'ов с domain scope `feat(backend)` / `feat(api)` / `feat(server)`. Проверяет API contracts, идемпотентность, RFC 7807 errors, latency SLO, security серверной стороны, соответствие `ui-style-guide-backend.md`.

## Ground truth (для backend section)

- `<doc_root>/features/<topic>_spec.md` — обращай внимание на NFR (latency / idempotency / errors)
- `<doc_root>/features/<topic>_plan.md` — Backend operational invariants секция
- `<doc_root>/ui-style-guide-backend.md` — **single source of truth** для backend rules
- `<doc_root>/threat-model.md` — относящиеся T-ID/M-ID для серверной стороны
- Backend code в diff'е
- Тесты backend'а в diff'е

## Backend checks

### 1. API contracts

- **HTTP method semantics** правильные? GET для reads, PUT для idempotent updates, DELETE idempotent, POST для creates с `Idempotency-Key` опционально
- **URI conventions** (ui-style-guide-backend.md § 7.2): plural collections (`/v1/users`), singular item (`/v1/users/<id>`), no verbs в CRUD
- **Versioning стратегия** consistent (URI prefix `/v1/` или date header) — не mix
- **Resource modeling** по user mental model, не БД схеме

### 2. Idempotency (AP-13)

- POST creates поддерживают `Idempotency-Key` header (см. backend guide § 2.2)?
- Server stores mapping `(idempotency_key, account_id) → response_snapshot` с TTL ≥ 24h?
- Conflict (same key, different params) → 422 (Stripe convention)?
- PUT / DELETE inherently idempotent — verify (нет side effects при повторе)

### 3. Structured errors RFC 7807

- Content-Type `application/problem+json`?
- Все обязательные поля (`type`, `title`, `status`, `detail`, `instance`)?
- `type` machine-readable URI или дополнительное `code` field stable?
- Validation errors per-field details (`errors[]` с `field` + `code`)?
- `Accept-Language` header → `Content-Language` в response (локализация title/detail)?

### 4. Latency SLO

- SLO defined для каждого interactive endpoint в spec NFR (p50 / p99)?
- Долгие операции (> 1s) возвращают **202 Accepted** с `Location: /jobs/<id>` или `task_id`?
- Statement timeout / lock timeout / connect timeout sensible?
- Retry strategy: exponential backoff **только** для idempotent operations?

### 5. Live delivery (если applicable)

Если фича включает realtime:
- WebSocket / SSE / webhooks / polling выбраны осмысленно per use case (backend guide § 5)?
- Webhooks **signed** (HMAC)?
- Retry policy документирован, at-least-once delivery + Event ID для dedup?
- WebSocket heartbeat (ping/pong) + reconnect с exponential backoff + `last_event_id` resume?

### 6. Pagination

- **Cursor-based** для lists с changing data, не offset?
- ORDER BY включает unique tiebreaker (например, `created_at DESC, id DESC`)?
- `total_count` только если frontend реально использует (expensive COUNT)?

### 7. Auth ergonomics

- **Short access token** (5-60 min) + **long refresh token** pattern?
- Silent refresh при 401 (frontend не видит «session expired» в середине task'а)?
- **Minimal scopes** per token?
- Rate limiting + `X-RateLimit-*` headers + 429 с `Retry-After`?
- **401 Unauthorized** vs **403 Forbidden** правильно различены?

### 8. Caching contract

- HTTP cache headers (ETag / Last-Modified / Cache-Control) для GET?
- Conditional requests (`If-None-Match` → 304) поддерживаются?
- Mutation invalidates соответствующий cache key?
- Optimistic UI frontend support (server-side validation детерминистическая)?

### 9. Schema evolution + deprecation

- Additive changes (без bump) — да?
- Breaking changes (рe-bump): есть **expand-contract** pattern (см. AP-18, base.md § 7.2)?
- Deprecation / Sunset headers + migration link для phased removal?
- Email / dashboard notification к API consumers documented?

### 10. Observability

- Каждый endpoint в metrics (rate / latency p50/p99 / error rate)?
- `request_id` propagation через distributed trace (W3C Trace Context)?
- Structured logs (JSON / logfmt) с request_id, user_id, endpoint, latency, status?
- Health endpoints (`/healthz` / `/readyz` / `/version`) implemented? Не expose'ат sensitive info?
- Error tracking (Sentry / эквивалент) integrated?

### 11. Security baseline

- **TLS 1.3** для transport? HSTS header?
- **CORS** whitelist explicit, не `Access-Control-Allow-Origin: *` для authenticated APIs?
- **Server-side validation** обязательно (frontend = UX, не security)?
- **Parameterized queries** (см. database-design-base.md § 12.1) — никаких string concatenation в SQL
- **Никаких secrets / PII в response** без explicit access check?
- Audit log для auth events / sensitive data access / admin actions?

### 12. Frameworks-first

Использует готовое решение из per-language matrix (Echo / Axum / FastAPI / Hono / Ktor / Phoenix / Rails / etc), не custom?

Custom только с обоснованием в plan'е.

### 13. Discoverability + DX

- OpenAPI / AsyncAPI / SDL / Protobuf spec — single source of truth?
- Client SDK генерируется из spec'а?
- API reference docs (Redoc / Swagger UI / эквивалент)?
- Sandbox / test mode environment available?

## Backend severity tags

- **`[blocking]`** — security baseline violations, missing idempotency для creates, нарушение API contracts (verbose methods, breaking changes без expand-contract)
- **`[question]`** — borderline cases (например, latency SLO не defined но endpoint выглядит fast), unclear scope
- **`[nit]`** — naming, minor docs gaps
