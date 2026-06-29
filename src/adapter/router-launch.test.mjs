// Unit test for the model-router launcher's PURE decision functions
// (router-launch.mjs). NO network, NO `claude` exec — the real exec is the one
// untestable rung (a live process), offered as a real-layer check, not run here.
//
// Covers: catalog resolution (provider id → base_url/auth, overrides, passthrough,
// unknown provider, fan-out by model patterns), distinct-endpoint counting, the
// fail-closed key-env check, seat-model extraction, child-env construction, and the
// whole planLaunch decision (direct-by-default vs router, fail-closed). Also loads
// the REAL src/adapter/model-providers.json and pins the four verified providers.
//
// Run: node src/adapter/router-launch.test.mjs

import {
  loadProviders,
  resolveRoute,
  resolveRoutes,
  distinctEndpoints,
  seatModels,
  missingKeyEnvs,
  buildChildEnv,
  planLaunch,
} from "./router-launch.mjs";

let pass = 0;
const fails = [];
function check(name, got, want) {
  if (got === want) { pass++; return; }
  fails.push(`  ✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

// A small fixture catalog (independent of the shipped one, so a catalog edit can't
// silently pass these MECHANISM tests).
const PROVIDERS = [
  { id: "anthropic", base_url: "https://api.anthropic.com", models: ["claude-*"], auth: { header: "x-api-key", keyEnv: "ANTHROPIC_API_KEY" }, supports_passthrough: true },
  { id: "deepseek", base_url: "https://api.deepseek.com/anthropic", models: ["deepseek-*"], auth: { header: "x-api-key", keyEnv: "DEEPSEEK_API_KEY" } },
  { id: "glm", base_url: "https://api.z.ai/api/anthropic", models: ["GLM-*"], auth: { header: "Authorization", scheme: "Bearer", keyEnv: "ZAI_API_KEY" } },
];

function main() {
  // ── resolveRoute / resolveRoutes ──────────────────────────────────────────
  const r1 = resolveRoute({ provider: "deepseek" }, PROVIDERS);
  check("provider ref pulls base_url from catalog", r1[0].base_url, "https://api.deepseek.com/anthropic");
  check("provider ref pulls auth from catalog", r1[0].auth.keyEnv, "DEEPSEEK_API_KEY");
  check("provider ref fans out to catalog model patterns", r1[0].match, "deepseek-*");

  const r2 = resolveRoute({ provider: "anthropic", match: "claude-opus-4-8" }, PROVIDERS);
  check("inline match overrides the catalog patterns", r2[0].match, "claude-opus-4-8");

  const r3 = resolveRoute({ provider: "anthropic", auth: "passthrough" }, PROVIDERS);
  check("passthrough override carried through (anthropic supports it)", r3[0].auth, "passthrough");
  check("passthrough route keeps the provider base_url", r3[0].base_url, "https://api.anthropic.com");

  const r4 = resolveRoute({ provider: "anthropic", base_url: "https://example.test" }, PROVIDERS);
  check("inline base_url override wins", r4[0].base_url, "https://example.test");

  const r5 = resolveRoute({ match: "x-*", base_url: "https://x.test", auth: { header: "x-api-key", keyEnv: "X" } }, PROVIDERS);
  check("fully-specified route passes through unchanged", r5[0].base_url, "https://x.test");

  let unknownThrew = false;
  try { resolveRoute({ provider: "nope" }, PROVIDERS); } catch { unknownThrew = true; }
  check("unknown provider throws", unknownThrew, true);

  let badPassthrough = false;
  try { resolveRoute({ provider: "deepseek", auth: "passthrough" }, PROVIDERS); } catch { badPassthrough = true; }
  check("passthrough rejected on a provider that can't (deepseek)", badPassthrough, true);

  const resolved = resolveRoutes({ routes: [{ provider: "anthropic" }, { provider: "deepseek" }] }, PROVIDERS);
  check("resolveRoutes flattens to all routes", resolved.length, 2);

  // ── distinctEndpoints ─────────────────────────────────────────────────────
  check("distinctEndpoints counts unique base_urls", distinctEndpoints(resolved).length, 2);
  check("same endpoint twice ⇒ 1",
    distinctEndpoints([{ base_url: "a" }, { base_url: "a" }]).length, 1);

  // ── seatModels ────────────────────────────────────────────────────────────
  const cfg = { model: "claude-opus-4-8", roles: { builder: { model: "deepseek-chat" }, reviewer: { model: "claude-sonnet-4-6" }, guard: { model: "auto" }, orchestrator: { model: "session" } } };
  const sm = seatModels(cfg);
  check("seatModels keeps concrete pins", sm.includes("deepseek-chat") && sm.includes("claude-sonnet-4-6"), true);
  check("seatModels drops auto/session wishes", sm.includes("auto") || sm.includes("session"), false);

  // ── missingKeyEnvs (fail-closed input) ────────────────────────────────────
  const mk = missingKeyEnvs(resolved, { ANTHROPIC_API_KEY: "x" }); // DEEPSEEK_API_KEY unset
  check("missingKeyEnvs flags the unset backend key", mk.includes("DEEPSEEK_API_KEY"), true);
  check("missingKeyEnvs does NOT flag the set key", mk.includes("ANTHROPIC_API_KEY"), false);
  check("missingKeyEnvs skips passthrough routes",
    missingKeyEnvs([{ auth: "passthrough" }], {}).length, 0);

  // ── buildChildEnv ─────────────────────────────────────────────────────────
  const childEnv = buildChildEnv({ FOO: "1", CLAUDE_CODE_SUBAGENT_MODEL: "haiku" }, "http://127.0.0.1:9999");
  check("buildChildEnv sets ANTHROPIC_BASE_URL", childEnv.ANTHROPIC_BASE_URL, "http://127.0.0.1:9999");
  check("buildChildEnv UNSETS CLAUDE_CODE_SUBAGENT_MODEL", "CLAUDE_CODE_SUBAGENT_MODEL" in childEnv, false);
  check("buildChildEnv preserves the rest of the env", childEnv.FOO, "1");

  // ── planLaunch ────────────────────────────────────────────────────────────
  // all-Anthropic seats ⇒ 1 endpoint ⇒ direct (proxy off by default).
  const planDirect = planLaunch({
    config: { roles: { builder: { model: "claude-opus-4-8" }, reviewer: { model: "claude-sonnet-4-6" } } },
    routesConfig: { routes: [{ provider: "anthropic" }, { provider: "deepseek" }] },
    providers: PROVIDERS, env: { ANTHROPIC_API_KEY: "x" },
  });
  check("all-Anthropic seats ⇒ direct (no router)", planDirect.mode, "direct");

  // cross-endpoint seats ⇒ ≥2 endpoints ⇒ router; with the key set, nothing missing.
  const planRouter = planLaunch({
    config: { roles: { builder: { model: "deepseek-chat" }, reviewer: { model: "claude-sonnet-4-6" } } },
    routesConfig: { routes: [{ provider: "anthropic" }, { provider: "deepseek" }] },
    providers: PROVIDERS, env: { ANTHROPIC_API_KEY: "x", DEEPSEEK_API_KEY: "y" },
  });
  check("cross-endpoint seats ⇒ router", planRouter.mode, "router");
  check("router plan: 2 endpoints in play", planRouter.endpoints.length, 2);
  check("router plan: keys present ⇒ none missing", planRouter.missingKeyEnvs.length, 0);

  // same seats but the deepseek key is unset ⇒ fail-closed (surfaced before launch).
  const planFailClosed = planLaunch({
    config: { roles: { builder: { model: "deepseek-chat" }, reviewer: { model: "claude-sonnet-4-6" } } },
    routesConfig: { routes: [{ provider: "anthropic" }, { provider: "deepseek" }] },
    providers: PROVIDERS, env: { ANTHROPIC_API_KEY: "x" },
  });
  check("router plan with unset key ⇒ flagged (fail-closed)", planFailClosed.missingKeyEnvs.includes("DEEPSEEK_API_KEY"), true);

  // anthropic passthrough (keyless) + deepseek ⇒ router, no anthropic key needed.
  const planPassthrough = planLaunch({
    config: { roles: { builder: { model: "deepseek-chat" }, reviewer: { model: "claude-sonnet-4-6" } } },
    routesConfig: { routes: [{ provider: "anthropic", auth: "passthrough" }, { provider: "deepseek" }] },
    providers: PROVIDERS, env: { DEEPSEEK_API_KEY: "y" }, // NO ANTHROPIC_API_KEY
  });
  check("passthrough anthropic + deepseek ⇒ router", planPassthrough.mode, "router");
  check("passthrough means no Anthropic key required", planPassthrough.missingKeyEnvs.length, 0);

  // no routes config ⇒ direct (byte-unchanged default).
  const planNoRoutes = planLaunch({ config: {}, routesConfig: null, providers: PROVIDERS, env: {} });
  check("no routes config ⇒ direct", planNoRoutes.mode, "direct");

  // malformed routes (unknown provider) ⇒ error, not a crash.
  const planErr = planLaunch({ config: {}, routesConfig: { routes: [{ provider: "ghost" }] }, providers: PROVIDERS, env: {} });
  check("unknown provider in routes ⇒ error surfaced", typeof planErr.error === "string" && planErr.error.includes("ghost"), true);

  // ── the REAL shipped catalog (pins the verified facts) ─────────────────────
  const real = loadProviders();
  const byId = Object.fromEntries(real.map((p) => [p.id, p]));
  check("catalog has the four verified providers",
    ["anthropic", "deepseek", "glm", "openrouter"].every((id) => byId[id]), true);
  check("catalog anthropic supports passthrough", byId.anthropic.supports_passthrough, true);
  check("catalog anthropic base_url", byId.anthropic.base_url, "https://api.anthropic.com");
  check("catalog deepseek is x-api-key", byId.deepseek.auth.header, "x-api-key");
  check("catalog deepseek base_url", byId.deepseek.base_url, "https://api.deepseek.com/anthropic");
  check("catalog glm is Authorization Bearer", `${byId.glm.auth.header} ${byId.glm.auth.scheme}`, "Authorization Bearer");
  check("catalog glm base_url (z.ai Coding Plan)", byId.glm.base_url, "https://api.z.ai/api/anthropic");
  check("catalog glm matches GLM-*", byId.glm.models.includes("GLM-*"), true);
  check("catalog openrouter is Authorization Bearer", `${byId.openrouter.auth.header} ${byId.openrouter.auth.scheme}`, "Authorization Bearer");
  check("catalog openrouter base_url (path-append → /api/v1/messages)", byId.openrouter.base_url, "https://openrouter.ai/api");
  // every real provider resolves cleanly through resolveRoute (no dead/invalid entry).
  check("every catalog provider resolves",
    real.every((p) => resolveRoute({ provider: p.id }, real)[0].base_url === p.base_url), true);

  if (fails.length) {
    console.log("ROUTER-LAUNCH SELF-TEST:");
    fails.forEach((f) => console.log(f));
    console.log(`\nFAIL — ${fails.length} case(s) failed`);
    process.exit(1);
  }
  console.log(`PASS — ${pass} passed`);
}

main();
