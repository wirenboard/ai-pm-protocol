// Per-seat cross-endpoint model router — a first-party localhost reverse-proxy.
//
// WHY THIS EXISTS (the rationale, the options, the empirical routing probe):
//   docs/decisions/per-seat-model-routing.md — that doc is the contract; this
//   file is the realisation of its option C. Goal: let the loop's seats run on
//   models behind DIFFERENT endpoints (e.g. Anthropic for Opus/Sonnet, DeepSeek
//   for the Builder) under ONE Claude Code instance, which itself takes a single
//   ANTHROPIC_BASE_URL. Claude Code is pointed at this router; the router keys on
//   the request body's `model` (proven to arrive as a distinct id per subagent
//   `model:` pin) and forwards to the matching backend.
//
// WHAT IT IS: a reverse-proxy with model-based routing + a per-backend auth swap.
//   The request body is passthrough (never transformed) and both ends speak the
//   Messages API (decision doc, fact 1), so there is nothing to translate. The
//   response is mostly passthrough too — a 2xx / SSE streams straight back — with
//   ONE reactive hop: a specific "image not supported" 400 is buffered, classified,
//   and the same request is rerouted to the `forImages` vision target; any other
//   400 is relayed verbatim (added 5.36.0).
//
// SECURITY POSTURE (the threat surface this code owns):
//   • Backend keys come ONLY from env vars named by the route config — never
//     inline in the config, never logged.
//   • The incoming client auth header is STRIPPED before forwarding, so a seat's
//     front-key never reaches a backend and the wrong backend never sees a key
//     meant for another.
//   • FAIL-CLOSED: an unroutable request (no model, or a model no route matches,
//     or a route whose key env is unset) is a 4xx/5xx error — NEVER silently sent
//     to a default backend (sending a seat's traffic to the wrong provider, or
//     forwarding with no credential, is the worst failure).
//   • No secret / body / header logging. At most an opt-in (MODEL_ROUTER_LOG=1)
//     `model -> hostname` line to stderr — built from safe pieces only.
//   • Binds to localhost by default (config.listen.host).
//
// Run as a process:   node src/adapter/model-router.mjs <config.json>
//   (config shape + worked example: src/adapter/model-router.example.json)
// Importable:         createRouter / pickRoute / resolveAuthHeader / loadConfig …
//   are exported for the self-test (src/adapter/model-router.test.mjs).

import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_MAX_BODY_BYTES = 25 * 1024 * 1024; // 25 MB — bound the per-request buffer

// Hop-specific headers the router always recomputes for the upstream — never
// forwarded verbatim.
const HOP_HEADERS = new Set(["host", "content-length"]);

// The client's own auth headers. STRIPPED on a normal (key-swap) route so a seat's
// front-key can't leak to a backend or reach the wrong provider; KEPT verbatim on a
// passthrough route (auth: "passthrough"), where forwarding the client's auth
// unchanged is the whole point (a subscription/OAuth session with no backend key).
const CLIENT_AUTH_HEADERS = new Set(["x-api-key", "authorization"]);

// A routing failure carrying the HTTP status the client should see.
class RouterError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Convert a simple glob (only the `*` wildcard) to an anchored RegExp. Every other
// regex metacharacter is escaped, so `claude-*` matches `claude-opus-4-8` but a
// dotted id is matched literally — no accidental wildcard from a `.` in the model.
export function globToRegExp(glob) {
  const escaped = String(glob).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

// The first route whose `match` glob matches the model id; null when the model is
// absent/empty or no route matches (the fail-closed signal the caller turns into a 4xx).
export function pickRoute(model, routes) {
  if (typeof model !== "string" || model.length === 0) return null;
  for (const route of routes) {
    if (globToRegExp(route.match).test(model)) return route;
  }
  return null;
}

// The single route flagged `forImages: true` — the vision fallback target — or null
// when none is configured. validateConfig guarantees at most one.
export function pickVisionRoute(routes) {
  return routes.find((route) => route.forImages === true) || null;
}

// The `model` field of a JSON request body, or null when the body is empty, not
// JSON, or carries no string model — all fail-closed (the caller returns a 4xx).
export function modelFromBody(body) {
  if (!body || body.length === 0) return null;
  try {
    const parsed = JSON.parse(body.toString("utf8"));
    return typeof parsed.model === "string" ? parsed.model : null;
  } catch {
    return null;
  }
}

// True when the request body carries an image content block — the Messages API
// shape is a `messages[].content[]` block whose `type` is "image" (verified against
// the Anthropic Messages API, the only format this router speaks; the decision doc's
// "Anthropic-format only" constraint). Used ONLY by the pre-route optimisation to
// skip a known-failing first call — never to transform the payload. Fail-safe to
// false on any parse miss (a non-detected image just falls back to the reactive path).
export function bodyHasImageBlock(body) {
  if (!body || body.length === 0) return false;
  try {
    const parsed = JSON.parse(body.toString("utf8"));
    if (!Array.isArray(parsed.messages)) return false;
    for (const msg of parsed.messages) {
      const content = msg && msg.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (block && block.type === "image") return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// True only for the SPECIFIC image-unsupported 400 signal: status 400 AND the JSON
// error message mentions an image together with a support/block word (e.g. a backend's
// "does not support image blocks"). Deliberately narrow — an ambiguous 400 (e.g.
// "messages: roles must alternate") does NOT match, so a real bad request is relayed
// as-is and never rerouted. Fail-safe to false on any parse miss.
export function isImageUnsupported400(status, body) {
  if (status !== 400) return false;
  let message;
  try {
    const parsed = JSON.parse(body.toString("utf8"));
    message = parsed && parsed.error && parsed.error.message;
  } catch {
    return false;
  }
  if (typeof message !== "string") return false;
  return /image/i.test(message) && /(support|block)/i.test(message);
}

// True when a route forwards the client's incoming auth header unchanged instead of
// swapping in a backend key (auth: "passthrough"). Lets a subscription/OAuth Claude
// Code session use the Anthropic/default route with NO backend API key.
export function isPassthrough(route) {
  return route && route.auth === "passthrough";
}

// Resolve a route's backend auth header from the environment. Returns
// { name, value }; throws a 500 RouterError when the named env var is unset/empty
// — fail-closed: the router never forwards a request without the backend's own key.
// `scheme` (optional, e.g. "Bearer") is prepended: `Authorization: Bearer <key>`;
// absent ⇒ the raw key is the value (e.g. `x-api-key: <key>`).
// Not called for a passthrough route (which carries no backend key) — see isPassthrough.
export function resolveAuthHeader(route, env = process.env) {
  const { header, keyEnv, scheme } = route.auth;
  const key = env[keyEnv];
  if (typeof key !== "string" || key.length === 0) {
    throw new RouterError(500, `routing backend key env ${keyEnv} is not set`);
  }
  return { name: header, value: scheme ? `${scheme} ${key}` : key };
}

// Validate the config SHAPE at load/start time (fail-closed before serving). Does
// not touch env — keys are read per-request so the process can be started before
// the keys are exported.
export function validateConfig(config) {
  if (!config || typeof config !== "object") throw new Error("config: not an object");
  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new Error("config.routes: must be a non-empty array");
  }
  let visionCount = 0;
  for (const [i, route] of config.routes.entries()) {
    const at = `config.routes[${i}]`;
    if (typeof route.match !== "string" || route.match.length === 0) throw new Error(`${at}.match: missing`);
    if (typeof route.base_url !== "string") throw new Error(`${at}.base_url: missing`);
    try {
      new URL(route.base_url);
    } catch {
      throw new Error(`${at}.base_url: not a valid URL`);
    }
    // forImages flags the vision fallback target — the route a 400-image reroute
    // lands on. Optional; when present it must be exactly true, and at most one route
    // may carry it (a second is ambiguous about which backend is the vision target).
    if (route.forImages !== undefined) {
      if (route.forImages !== true) throw new Error(`${at}.forImages: must be true when present`);
      visionCount++;
    }
    // auth is EITHER the string "passthrough" (forward the client's auth unchanged)
    // OR a key-swap object { header, keyEnv, scheme? }.
    if (route.auth === "passthrough") continue;
    if (!route.auth || typeof route.auth !== "object") throw new Error(`${at}.auth: missing (object or "passthrough")`);
    if (typeof route.auth.header !== "string" || route.auth.header.length === 0) throw new Error(`${at}.auth.header: missing`);
    if (typeof route.auth.keyEnv !== "string" || route.auth.keyEnv.length === 0) throw new Error(`${at}.auth.keyEnv: missing`);
  }
  if (visionCount > 1) throw new Error("config.routes: at most one route may set forImages: true (the vision fallback target)");
  return config;
}

// Load + validate a config file.
export function loadConfig(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return validateConfig(config);
}

// The opt-in stderr logger: a no-op unless MODEL_ROUTER_LOG=1. Logs only the
// caller-supplied line (which is always model -> hostname) — never a key, body, or header.
function defaultLogger(env = process.env) {
  if (env.MODEL_ROUTER_LOG === "1") {
    return (line) => process.stderr.write(`[model-router] ${line}\n`);
  }
  return () => {};
}

// Join the backend base path with the client's request path. base "/" collapses
// (anthropic: https://api.anthropic.com → "/v1/messages"); a real base path is
// kept (deepseek: https://api.deepseek.com/anthropic → "/anthropic/v1/messages").
function joinPath(basePath, requestUrl) {
  return basePath.replace(/\/+$/, "") + requestUrl;
}

// Copy the client's headers minus the hop set, and point `host` at the backend.
// keepClientAuth=false (the key-swap default) also drops the client's auth headers;
// keepClientAuth=true (passthrough) forwards them unchanged.
function sanitizeHeaders(incoming, upstreamHost, { keepClientAuth = false } = {}) {
  const out = {};
  for (const [k, v] of Object.entries(incoming)) {
    const lower = k.toLowerCase();
    if (HOP_HEADERS.has(lower)) continue;
    if (!keepClientAuth && CLIENT_AUTH_HEADERS.has(lower)) continue;
    out[k] = v;
  }
  out.host = upstreamHost;
  return out;
}

// Send a JSON error in the Anthropic error shape, once (no-op if streaming began).
function sendError(res, status, message) {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  const type = status >= 500 ? "api_error" : "invalid_request_error";
  const payload = JSON.stringify({ type: "error", error: { type, message } });
  // `connection: close` so an error reply mid-upload (e.g. a 413 with the client
  // still sending body) is delivered cleanly and the socket is not reused with an
  // unconsumed request body.
  res.writeHead(status, { "content-type": "application/json", connection: "close" });
  res.end(payload);
}

// Read the full request body into a buffer, bounded by maxBytes (over ⇒ 413).
// On overflow it rejects but does NOT destroy the socket: the caller's catch sends
// a clean 413 (sendError closes the connection). Destroying here would tear down the
// response socket too, turning the 413 into a connection reset the client can't read.
// Further data after overflow is ignored (the `aborted` guard) so memory stays bounded.
function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let aborted = false;
    req.on("data", (chunk) => {
      if (aborted) return;
      size += chunk.length;
      if (size > maxBytes) {
        aborted = true;
        reject(new RouterError(413, "request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => { if (!aborted) resolve(Buffer.concat(chunks)); });
    req.on("error", (err) => { if (!aborted) reject(err); });
  });
}

// A 400 error body is small JSON — bound the buffer we read to classify it, so a
// pathological upstream can't make us hold an unbounded error response in memory.
const REROUTE_BUFFER_CAP = 64 * 1024;

// Stream an upstream response straight back to the client — SSE/chunked passthrough.
// A success (2xx) and every non-reroutable status take this path: nothing is buffered.
function pipeResponse(upstreamRes, res) {
  // Mid-stream upstream failure (the backend drops the socket after we began
  // streaming): the response headers are already sent, so sendError can only tear the
  // client connection down — never a write-after-headers crash.
  const onUpstreamFail = () => {
    if (res.headersSent) res.destroy();
    else sendError(res, 502, "upstream response error");
  };
  upstreamRes.on("error", onUpstreamFail);
  upstreamRes.on("aborted", onUpstreamFail);
  res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
  upstreamRes.pipe(res);
}

// Read a (small) upstream response fully into a buffer, bounded by `cap`. Only used
// for a 400, to classify it before deciding reroute-vs-relay. cb(err, buffer, headers).
function bufferResponse(upstreamRes, cap, cb) {
  const chunks = [];
  let size = 0;
  let done = false;
  const finish = (err) => { if (!done) { done = true; cb(err, Buffer.concat(chunks), upstreamRes.headers); } };
  upstreamRes.on("data", (c) => {
    if (done) return;
    size += c.length;
    if (size > cap) { finish(new Error("error response too large to buffer")); return; }
    chunks.push(c);
  });
  upstreamRes.on("end", () => finish(null));
  upstreamRes.on("error", () => finish(new Error("upstream error")));
  upstreamRes.on("aborted", () => finish(new Error("upstream aborted")));
}

// Relay a buffered (already-read) error response verbatim. Drops the upstream's
// content-length / transfer-encoding so Node recomputes them for the exact bytes we
// re-send; keeps content-type and the status.
function relayBuffered(res, status, upstreamHeaders, buffered) {
  const headers = {};
  for (const [k, v] of Object.entries(upstreamHeaders)) {
    const lower = k.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding") continue;
    headers[k] = v;
  }
  res.writeHead(status, headers);
  res.end(buffered);
}

// Send the buffered request to one backend route and hand its response to `onResponse`
// (or stream it straight back when none is given). Pure routing + per-backend auth
// swap — the body buffer is never transformed (passthrough; image bytes untouched).
function proxyToRoute(route, req, res, body, log, { onResponse } = {}) {
  const passthrough = isPassthrough(route);
  let auth = null;
  if (!passthrough) {
    try {
      auth = resolveAuthHeader(route);
    } catch (err) {
      sendError(res, err.status || 500, err.message);
      return;
    }
  }

  const upstream = new URL(route.base_url);
  log(`${modelFromBody(body)} -> ${upstream.host}`); // safe: model + hostname only, never key/body/header

  // Passthrough keeps the client's auth header; key-swap drops it and sets the backend's.
  const headers = sanitizeHeaders(req.headers, upstream.host, { keepClientAuth: passthrough });
  if (auth) headers[auth.name] = auth.value;
  if (body.length) headers["content-length"] = String(body.length);

  // A dropped/aborted client connection must not crash the process or leave the
  // upstream hanging.
  res.on("error", () => {});

  const client = upstream.protocol === "http:" ? http : https;
  const upstreamReq = client.request(
    {
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port || (upstream.protocol === "http:" ? 80 : 443),
      path: joinPath(upstream.pathname, req.url),
      method: req.method,
      headers,
    },
    onResponse || ((upstreamRes) => pipeResponse(upstreamRes, res)),
  );
  upstreamReq.on("error", () => sendError(res, 502, "upstream request failed"));
  if (body.length) upstreamReq.write(body);
  upstreamReq.end();
}

// Build the response handler that realises the reactive vision fallback. `ctx` carries
// the in-flight request; `isVisionTarget` is true when the route being answered IS the
// `forImages` route (so a 400-image from it is the loop-guard case, never a re-reroute).
function makeResponseHandler(ctx) {
  return (upstreamRes) => {
    const status = upstreamRes.statusCode || 502;
    // 2xx and every other non-400 stream straight back — a success / SSE is NEVER
    // buffered, so streaming stays intact.
    if (status !== 400) {
      pipeResponse(upstreamRes, ctx.res);
      return;
    }
    // A 400: buffer the small error body and classify it.
    bufferResponse(upstreamRes, REROUTE_BUFFER_CAP, (err, buffered, headers) => {
      if (err) {
        if (!ctx.res.headersSent) sendError(ctx.res, 502, "upstream error response could not be relayed");
        else ctx.res.destroy();
        return;
      }
      if (isImageUnsupported400(status, buffered)) {
        if (ctx.isVisionTarget) {
          // Loop guard: the vision target itself can't take the image — clear error,
          // never re-reroute (no infinite loop).
          sendError(ctx.res, 422, "vision route cannot process this image request; not rerouting (loop guard)");
          return;
        }
        if (ctx.visionRoute) {
          // Reroute the SAME buffered request to the vision target; remember the model
          // so the next image call pre-routes (per-process cache, never the payload).
          if (ctx.model) ctx.nonVisionCache.set(ctx.model, true);
          proxyToRoute(ctx.visionRoute, ctx.req, ctx.res, ctx.body, ctx.log, {
            onResponse: makeResponseHandler({ ...ctx, isVisionTarget: true }),
          });
          return;
        }
        // No vision fallback configured — fail LOUD with a clear error, never the raw
        // cryptic upstream 400.
        sendError(ctx.res, 422, `model "${ctx.model}" cannot process images and no vision fallback is configured`);
        return;
      }
      // An ambiguous 400 (a real bad request) — relay it as-is, never reroute.
      relayBuffered(ctx.res, status, headers, buffered);
    });
  };
}

// Route one buffered request to its backend, with the reactive vision fallback.
// `nonVisionCache` is a per-process Map(model → true) of models a backend has already
// rejected for images — ephemeral state, never the payload.
function forward(config, req, res, body, log, nonVisionCache) {
  const model = modelFromBody(body);
  const route = pickRoute(model, config.routes);
  if (!route) {
    sendError(res, 400, model ? `no route for model "${model}"` : "request has no routable model");
    return;
  }

  const visionRoute = pickVisionRoute(config.routes);

  // Pre-route optimisation: a known non-vision model carrying an image, with a vision
  // target configured, skips the first call we already know will 400-image.
  if (
    visionRoute &&
    route !== visionRoute &&
    model &&
    nonVisionCache.has(model) &&
    bodyHasImageBlock(body)
  ) {
    proxyToRoute(visionRoute, req, res, body, log, {
      onResponse: makeResponseHandler({ res, req, body, log, model, visionRoute, nonVisionCache, isVisionTarget: true }),
    });
    return;
  }

  proxyToRoute(route, req, res, body, log, {
    onResponse: makeResponseHandler({
      res, req, body, log, model, visionRoute, nonVisionCache, isVisionTarget: route === visionRoute,
    }),
  });
}

// Build the router as an http.Server. `options.log` overrides the stderr logger
// (used by the self-test to capture the routing line).
export function createRouter(config, options = {}) {
  validateConfig(config);
  const maxBytes = config.maxBodyBytes || DEFAULT_MAX_BODY_BYTES;
  const log = options.log || defaultLogger();
  // Per-process (per-router-instance) cache of models a backend rejected for images,
  // so a repeat image call pre-routes to the vision target without the failing first
  // hop. Ephemeral, holds only model ids — never any request payload.
  const nonVisionCache = new Map();
  return http.createServer((req, res) => {
    readBody(req, maxBytes)
      .then((body) => forward(config, req, res, body, log, nonVisionCache))
      .catch((err) => sendError(res, err.status || 400, err.message || "bad request"));
  });
}

// CLI entry: node model-router.mjs <config.json>  (or MODEL_ROUTER_CONFIG=<path>).
function main() {
  const configPath = process.argv[2] || process.env.MODEL_ROUTER_CONFIG;
  if (!configPath) {
    process.stderr.write("usage: node model-router.mjs <config.json>  (or set MODEL_ROUTER_CONFIG)\n");
    process.exit(2);
  }
  const config = loadConfig(configPath);
  const host = (config.listen && config.listen.host) || "127.0.0.1";
  const port = (config.listen && config.listen.port) || 8787;
  createRouter(config).listen(port, host, () => {
    process.stderr.write(`[model-router] listening on http://${host}:${port} (${config.routes.length} routes)\n`);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
