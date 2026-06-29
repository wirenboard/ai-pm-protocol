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

// Headers the router never forwards verbatim: the client's own auth (stripped so
// it can't leak to a backend / reach the wrong provider), and the hop-specific
// host/length the router recomputes for the upstream.
const STRIPPED_HEADERS = new Set(["x-api-key", "authorization", "host", "content-length"]);

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

// Resolve a route's backend auth header from the environment. Returns
// { name, value }; throws a 500 RouterError when the named env var is unset/empty
// — fail-closed: the router never forwards a request without the backend's own key.
// `scheme` (optional, e.g. "Bearer") is prepended: `Authorization: Bearer <key>`;
// absent ⇒ the raw key is the value (e.g. `x-api-key: <key>`).
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
    if (!route.auth || typeof route.auth !== "object") throw new Error(`${at}.auth: missing`);
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

// Copy the client's headers minus the stripped set, and point `host` at the backend.
function sanitizeHeaders(incoming, upstreamHost) {
  const out = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (STRIPPED_HEADERS.has(k.toLowerCase())) continue;
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
  res.writeHead(status, { "content-type": "application/json" });
  res.end(payload);
}

// Read the full request body into a buffer, bounded by maxBytes (over ⇒ 413).
function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new RouterError(413, "request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
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

  let auth;
  try {
    auth = resolveAuthHeader(route);
  } catch (err) {
    sendError(res, err.status || 500, err.message);
    return;
  }

  const upstream = new URL(route.base_url);
  log(`${model} -> ${upstream.host}`); // safe: model + hostname only, never key/body/header

  const headers = sanitizeHeaders(req.headers, upstream.host);
  headers[auth.name] = auth.value;
  if (body.length) headers["content-length"] = String(body.length);

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
