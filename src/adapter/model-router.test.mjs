// Self-test for the per-seat cross-endpoint model router (model-router.mjs).
//
// NO network, NO real keys. Two STUB upstream http servers on localhost stand in
// for the backends (an x-api-key one for "Anthropic", a Bearer one). The router
// is driven through its REAL http path (createRouter → a listening server → real
// http.request from a test client), so routing, the auth swap, body + streamed
// response passthrough, fail-closed behaviour, and log safety are all exercised
// on the real socket, not a mock.
//
// NOTE on the Bearer route: the official DeepSeek Anthropic-compatible endpoint
// authenticates with `x-api-key` (verified 2026-06-30; the example config uses
// that). The Bearer stub here exists purely to exercise the router's scheme-SWAP
// code path — proving the MECHANISM can emit `Authorization: Bearer <key>` for any
// backend that needs it, not a claim about DeepSeek.
//
// Run: node src/adapter/model-router.test.mjs

import http from "node:http";
import { createRouter, pickRoute, globToRegExp, modelFromBody, resolveAuthHeader } from "./model-router.mjs";

let pass = 0;
const fails = [];
function check(name, got, want) {
  if (got === want) { pass++; return; }
  fails.push(`  ✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

// A stub upstream: records every request it receives, then answers with a body
// streamed in three separate writes (proving chunked/streamed passthrough).
const STREAM_PARTS = ["chunk-A;", "chunk-B;", "chunk-C"];
const STREAM_BODY = STREAM_PARTS.join("");
function makeStub() {
  const received = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      received.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString("utf8") });
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write(STREAM_PARTS[0]);
      res.write(STREAM_PARTS[1]);
      res.end(STREAM_PARTS[2]);
    });
  });
  return { server, received };
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}
function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

// Send a request THROUGH the router. `raw` (string) sends arbitrary bytes; else a
// JS object is JSON-encoded. Always carries a bogus client front-key so we can
// prove the router strips it before forwarding.
function request(port, payload, { raw } = {}) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(raw !== undefined ? raw : JSON.stringify(payload));
    const req = http.request(
      {
        hostname: "127.0.0.1", port, path: "/v1/messages", method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": "CLIENT-FRONT-KEY",
          "anthropic-version": "2023-06-01",
          "content-length": data.length,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8"), headers: res.headers }));
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // ── pure-function units (no network) ──────────────────────────────────────
  check("glob claude-* matches", globToRegExp("claude-*").test("claude-opus-4-8"), true);
  check("glob claude-* rejects deepseek", globToRegExp("claude-*").test("deepseek-chat"), false);
  check("glob escapes the dot (no wildcard)", globToRegExp("claude-4.8").test("claude-4x8"), false);
  check("modelFromBody reads model", modelFromBody(Buffer.from('{"model":"m-1"}')), "m-1");
  check("modelFromBody bad json ⇒ null", modelFromBody(Buffer.from("not json")), null);
  check("modelFromBody no model ⇒ null", modelFromBody(Buffer.from("{}")), null);
  check("modelFromBody empty ⇒ null", modelFromBody(Buffer.from("")), null);

  const sampleRoutes = [
    { match: "claude-*", base_url: "https://api.anthropic.com", auth: { header: "x-api-key", keyEnv: "K" } },
    { match: "deepseek-*", base_url: "https://api.deepseek.com/anthropic", auth: { header: "x-api-key", keyEnv: "K" } },
  ];
  check("pickRoute first match wins", pickRoute("claude-x", sampleRoutes).match, "claude-*");
  check("pickRoute unknown ⇒ null", pickRoute("gpt-4", sampleRoutes), null);
  check("pickRoute empty model ⇒ null", pickRoute("", sampleRoutes), null);
  check("resolveAuthHeader raw value", resolveAuthHeader(sampleRoutes[0], { K: "secret" }).value, "secret");
  check("resolveAuthHeader scheme prepend",
    resolveAuthHeader({ auth: { header: "Authorization", keyEnv: "K", scheme: "Bearer" } }, { K: "secret" }).value,
    "Bearer secret");
  let unsetThrew = false;
  try { resolveAuthHeader(sampleRoutes[0], {}); } catch { unsetThrew = true; }
  check("resolveAuthHeader unset env throws (fail-closed)", unsetThrew, true);

  // ── e2e through the real socket ───────────────────────────────────────────
  const anthropicStub = makeStub();
  const bearerStub = makeStub();
  const aPort = await listen(anthropicStub.server);
  const dPort = await listen(bearerStub.server);

  process.env.TEST_ANTHROPIC_KEY = "ANT-SECRET-123";
  process.env.TEST_DEEPSEEK_KEY = "DS-SECRET-456";
  delete process.env.TEST_UNSET_KEY_XYZ;
  process.env.MODEL_ROUTER_LOG = "1";

  // Tee stderr so the routing line is captured AND still visible.
  const realStderrWrite = process.stderr.write.bind(process.stderr);
  const logCapture = [];
  process.stderr.write = (chunk, ...rest) => { logCapture.push(String(chunk)); return realStderrWrite(chunk, ...rest); };

  const config = {
    listen: { host: "127.0.0.1", port: 0 },
    routes: [
      { match: "claude-*", base_url: `http://127.0.0.1:${aPort}`, auth: { header: "x-api-key", keyEnv: "TEST_ANTHROPIC_KEY" } },
      { match: "deepseek-*", base_url: `http://127.0.0.1:${dPort}`, auth: { header: "Authorization", scheme: "Bearer", keyEnv: "TEST_DEEPSEEK_KEY" } },
      { match: "needkey-*", base_url: `http://127.0.0.1:${aPort}`, auth: { header: "x-api-key", keyEnv: "TEST_UNSET_KEY_XYZ" } },
    ],
  };
  const router = createRouter(config);
  const routerPort = await listen(router);

  try {
    // 1. claude-* → the x-api-key (Anthropic) backend; key value swapped; body intact.
    const r1 = await request(routerPort, { model: "claude-opus-4-8", messages: [{ role: "user", content: "BODY-SENTINEL-CLAUDE" }] });
    check("claude routed to anthropic stub", anthropicStub.received.length, 1);
    check("claude did not touch bearer stub", bearerStub.received.length, 0);
    check("claude status 200", r1.status, 200);
    check("claude streamed response intact", r1.body, STREAM_BODY);
    const aReq = anthropicStub.received[0];
    check("anthropic got backend key under x-api-key", aReq.headers["x-api-key"], "ANT-SECRET-123");
    check("anthropic did NOT get the client front-key", aReq.headers["x-api-key"] !== "CLIENT-FRONT-KEY", true);
    check("anthropic got no Authorization header", aReq.headers["authorization"], undefined);
    check("anthropic host rewritten to backend", aReq.headers["host"], `127.0.0.1:${aPort}`);
    check("anthropic request body passed through intact", JSON.parse(aReq.body).messages[0].content, "BODY-SENTINEL-CLAUDE");

    // 2. deepseek-* → the Bearer backend; auth scheme swapped; x-api-key stripped.
    const r2 = await request(routerPort, { model: "deepseek-chat", messages: [{ role: "user", content: "BODY-SENTINEL-DS" }] });
    check("deepseek routed to bearer stub", bearerStub.received.length, 1);
    check("deepseek did not re-touch anthropic stub", anthropicStub.received.length, 1);
    check("deepseek status 200", r2.status, 200);
    check("deepseek streamed response intact", r2.body, STREAM_BODY);
    const dReq = bearerStub.received[0];
    check("deepseek got Authorization: Bearer <backend key>", dReq.headers["authorization"], "Bearer DS-SECRET-456");
    check("deepseek had client x-api-key stripped", dReq.headers["x-api-key"], undefined);
    check("deepseek request body passed through intact", JSON.parse(dReq.body).messages[0].content, "BODY-SENTINEL-DS");

    // 3. unknown model fails closed (4xx) and reaches NO backend.
    const r3 = await request(routerPort, { model: "gpt-4-turbo", messages: [] });
    check("unknown model ⇒ 4xx", r3.status >= 400 && r3.status < 500, true);
    check("unknown model not forwarded to anthropic", anthropicStub.received.length, 1);
    check("unknown model not forwarded to bearer", bearerStub.received.length, 1);

    // 4. missing model + unparseable body fail closed.
    const r4 = await request(routerPort, { messages: [] });
    check("missing model ⇒ 4xx", r4.status >= 400 && r4.status < 500, true);
    const r5 = await request(routerPort, null, { raw: "this is not json" });
    check("unparseable body ⇒ 4xx", r5.status >= 400 && r5.status < 500, true);

    // 5. matched route but unset key env ⇒ fail closed, NOT forwarded.
    const r6 = await request(routerPort, { model: "needkey-1", messages: [] });
    check("unset key env ⇒ error status", r6.status >= 400, true);
    check("unset key env not forwarded", anthropicStub.received.length, 1);

    // 6. log safety: the model→host line is present; NO key/body/header anywhere.
    const logText = logCapture.join("");
    check("log names model -> host", logText.includes(`claude-opus-4-8 -> 127.0.0.1:${aPort}`), true);
    check("log leaks NO backend key", logText.includes("ANT-SECRET-123") || logText.includes("DS-SECRET-456"), false);
    check("log leaks NO client front-key", logText.includes("CLIENT-FRONT-KEY"), false);
    check("log leaks NO request body", logText.includes("BODY-SENTINEL"), false);
  } finally {
    process.stderr.write = realStderrWrite;
    delete process.env.TEST_ANTHROPIC_KEY;
    delete process.env.TEST_DEEPSEEK_KEY;
    delete process.env.MODEL_ROUTER_LOG;
    await close(router);
    await close(anthropicStub.server);
    await close(bearerStub.server);
  }

  if (fails.length) {
    console.log("MODEL-ROUTER SELF-TEST:");
    fails.forEach((f) => console.log(f));
    console.log(`\nFAIL — ${fails.length} case(s) failed`);
    process.exit(1);
  }
  console.log(`PASS — ${pass} passed`);
}

main().catch((err) => {
  console.log(`FAIL — unexpected error: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
