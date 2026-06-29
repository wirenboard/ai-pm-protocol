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
// WHAT IT IS: a pure reverse-proxy with model-based routing + a per-backend auth
//   swap + SSE/stream passthrough. NOT a format translator — both ends speak the
//   Messages API (decision doc, fact 1), so there is nothing to translate.
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
  for (const [i, route] of config.routes.entries()) {
    const at = `config.routes[${i}]`;
    if (typeof route.match !== "string" || route.match.length === 0) throw new Error(`${at}.match: missing`);
    if (typeof route.base_url !== "string") throw new Error(`${at}.base_url: missing`);
    try {
      new URL(route.base_url);
    } catch {
      throw new Error(`${at}.base_url: not a valid URL`);
    }
    // auth is EITHER the string "passthrough" (forward the client's auth unchanged)
    // OR a key-swap object { header, keyEnv, scheme? }.
    if (route.auth === "passthrough") continue;
    if (!route.auth || typeof route.auth !== "object") throw new Error(`${at}.auth: missing (object or "passthrough")`);
    if (typeof route.auth.header !== "string" || route.auth.header.length === 0) throw new Error(`${at}.auth.header: missing`);
    if (typeof route.auth.keyEnv !== "string" || route.auth.keyEnv.length === 0) throw new Error(`${at}.auth.keyEnv: missing`);
  }
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

// Route one buffered request to its backend and stream the response back.
function forward(config, req, res, body, log) {
  const model = modelFromBody(body);
  const route = pickRoute(model, config.routes);
  if (!route) {
    sendError(res, 400, model ? `no route for model "${model}"` : "request has no routable model");
    return;
  }

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
  log(`${model} -> ${upstream.host}`); // safe: model + hostname only, never key/body/header

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
    (upstreamRes) => {
      // Mid-stream upstream failure (the backend drops the socket after we began
      // streaming): the response headers are already sent, so sendError can only
      // tear the client connection down — never a write-after-headers crash.
      const onUpstreamFail = () => {
        if (res.headersSent) res.destroy();
        else sendError(res, 502, "upstream response error");
      };
      upstreamRes.on("error", onUpstreamFail);
      upstreamRes.on("aborted", onUpstreamFail);
      // Stream the upstream response straight back — SSE/chunked passthrough.
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstreamReq.on("error", () => sendError(res, 502, "upstream request failed"));
  if (body.length) upstreamReq.write(body);
  upstreamReq.end();
}

// Build the router as an http.Server. `options.log` overrides the stderr logger
// (used by the self-test to capture the routing line).
export function createRouter(config, options = {}) {
  validateConfig(config);
  const maxBytes = config.maxBodyBytes || DEFAULT_MAX_BODY_BYTES;
  const log = options.log || defaultLogger();
  return http.createServer((req, res) => {
    readBody(req, maxBytes)
      .then((body) => forward(config, req, res, body, log))
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
