# Vision routing — reactive catch-400 reroute (content-aware routing)

**Question (2026-06-30).** Some non-vision backends (DeepSeek, GLM) reject an
image-bearing request with `400 … does not support image blocks`. A loop seat
pinned to such a model breaks the moment the Operator pastes a screenshot. How does
the per-seat router (`src/adapter/model-router.mjs`) keep an image request working
without the Operator re-pinning the seat by hand?

This doc records the design; the mechanism is the realisation, the feature plan
(`.ai-dev/plans/vision-routing.md`, transient) drove the build.

---

## The decision — reactive, not declared

**Reroute reactively on the upstream's own `400`-image signal; never declare a vision
capability flag per model.** A route may carry `forImages: true` to mark the **vision
fallback target**; everything else is discovered from the wire:

- A request forwards to its model's route **as normal**.
- On a `2xx` the response pipes straight through (streaming/SSE intact — a success is
  never buffered).
- On a `400` whose body matches the **specific** image-unsupported signal (status 400
  AND the JSON error message mentions `image` together with `support`/`block`), and the
  active route is **not** already the vision target:
  - a `forImages` route exists → the `400` is buffered (small JSON, not a stream) and
    the **same** request is re-forwarded to the vision route; the model is cached
    `model → non-vision` for the process. The client sees the vision route's response.
  - no `forImages` route → **fail loud**: a clear `4xx` naming that the active model
    can't process images and no vision fallback is configured — never the raw cryptic
    upstream `400`.
- Any other non-`2xx`, or an **ambiguous** `400` (e.g. `messages: roles must
  alternate`), relays as-is — a real bad request must surface, never reroute.

A multimodal active model simply returns `200`, so its capability is **discovered, not
declared** — there is no per-model `vision: true` to maintain, and no list to drift.

### Why reactive beats a declared flag

A declared `vision: true` per model is a second source of truth about backend
capability that the wire already knows. It rots (a provider adds image support; the
flag lags), it has to be filled in for every model a project pins, and it still can't
catch a model that regresses. The backend's own `400` is the authoritative,
always-current signal — keying on it means the router never holds a stale claim about
what a model can do. The cost is one known-failing first call per new model, retired by
the session cache below.

### Pre-route optimisation (the session cache)

Once a model has 400-image'd, a per-process `Map(model → true)` remembers it. The next
image-bearing request to that model (detected by an `image` content block in the
Messages-API body) **pre-routes straight to the vision target**, skipping the call the
router already knows will fail. The cache is ephemeral per-process state and holds only
model ids — never any payload.

### Loop guard

If the vision target **itself** returns a `400`-image, the router emits a clear error
and **never re-reroutes** — no infinite loop. This covers both the rerouted path
(A 400 → B 400) and a request whose model targets the vision route directly.

---

## Passthrough preserved (the security/threat posture)

The reroute changes **only the backend choice** — it is routing, not transformation.
The original request buffer (image bytes included) is re-forwarded byte-for-byte to the
vision route; nothing in the payload is read for content, rewritten, or described. This
keeps the router the pure passthrough proxy the per-seat design requires
(`docs/decisions/per-seat-model-routing.md`, fact 1 — Anthropic-format only, no
translator ever). Specifically:

- **Image bytes are never altered** — the same body buffer is sent to whichever backend
  answers.
- **The non-vision cache is per-process ephemeral state**, not the payload axis — it
  holds model ids only.
- **The logging discipline is unchanged** — at most the existing opt-in
  `model → host` line (`MODEL_ROUTER_LOG=1`); the buffered `400` body, the image
  content, the keys, and the headers are never logged.

A payload transform (image → text describe) was **rejected**: it breaks passthrough and
re-introduces the format-translation surface the whole design exists to avoid. Reroute
only.

---

## Value framing — the router directs ANY model-bearing call

The vision fallback is one instance of the router's general job: it inspects each
request's `model` and directs the call to a backend. The same machinery already routes
by tier (per-seat models across endpoints) and could carry other content-aware
decisions (a cost guard, a size guard). **Vision is one reroute among them** — not a
bespoke subsystem. That is why it lands as a few branches inside `forward()` rather than
a separate component: the router was always a content-aware director; this teaches it
one more signal.

---

## Out of scope

- **Setup-dialog generation of the `forImages` route** — hand-written in the routes
  config for now (a later PR adds the dialog).
- **OpenAI-format providers** — locked out permanently
  (`docs/decisions/per-seat-model-routing.md`).

---

## Verification

Stub-upstream e2e in `src/adapter/model-router.test.mjs` (no network, no keys): two
in-test stub servers — A (non-vision, mode-switchable) and B (the vision target) —
cover all six cases (reroute on 400-image, multimodal 200 no-reroute, no-fallback clear
error, ambiguous 400 relayed as-is, session-cache pre-route, loop guard), each
asserting relay correctness AND that no key/body/image bytes leak to the captured logs.

A real-layer exercise (a real image to a DeepSeek route rerouted to a Claude vision
route) needs the Operator's keys and is offered, not run by default.
