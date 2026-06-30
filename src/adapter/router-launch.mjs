// Launcher for the per-seat cross-endpoint model router — one command to run the
// wired pipeline (rationale + the whole feature: docs/decisions/per-seat-model-routing.md).
//
// WHAT IT DOES
//   Reads .ai-dev/config.json (the seats' roles.*.model pins) + a routes config
//   (each route either fully specified, or { provider: <id> } resolved against the
//   built-in catalog src/adapter/model-providers.json), then decides:
//     • EXTERNAL — if the routes config sets a non-empty `proxyUrl` (an
//       already-running proxy — a self-hosted/shared modelpipe, or one under a
//       debugger), DON'T spawn a router: point claude straight at that URL. Auth/keys
//       live in the external proxy's OWN env, so the launcher's fail-closed key check
//       does not apply (it cannot see the proxy's credentials). Takes precedence over
//       the endpoint-count decision below.
//     • DIRECT BY DEFAULT — if the seats' models touch fewer than 2 distinct
//       endpoints (e.g. all Anthropic), exec `claude` straight through with NO
//       router. A project that never opts into cross-endpoint routing is unchanged.
//   In EVERY mode it also layers the config's launch-time env onto the child
//   (config.launch.sessionModel → ANTHROPIC_MODEL, guardModel → ANTHROPIC_SMALL_FAST_MODEL,
//   configDir → CLAUDE_CONFIG_DIR) BEFORE exec'ing `claude` — the RATIFIED source-of-truth:
//   the config is the one home, the launch path consumes it (docs/decisions/multi-model-setup-ux.md
//   `## The fork`; configDir: docs/decisions/launcher-ux.md). Absent/empty values export
//   nothing (a non-routing project stays byte-unchanged).
//     • ROUTER — if ≥2 distinct endpoints are in play, start model-router.mjs on a
//       free localhost port, point the child at it via ANTHROPIC_BASE_URL, ensure
//       CLAUDE_CODE_SUBAGENT_MODEL is UNSET in the child env (it would collapse every
//       seat to one model and defeat the route key — decision doc, fact 2), exec
//       `claude`, and tear the router down on exit.
//
// PERSONAL OVERRIDES: the gitignored .ai-dev/config.local.json carries the per-machine
//   `launch.*` values (a configDir, a personal launch model) — its `launch` section is
//   merged OVER the shared config's, so the shared file stays clean and nothing personal
//   is forced on a teammate.
//
// FOREGROUND PROXY (--proxy): start the router, print its URL on stdout, and stay up
//   WITHOUT exec'ing claude — for "don't touch my launch": point your own claude/wrapper
//   at the printed URL. Errors if there is no local router to start (external/direct plan).
//
// FAIL-CLOSED: if a route the launch would use names a key env var that is unset, the
//   launcher errors BEFORE starting anything — never a silent wrong-backend (a seat's
//   traffic reaching the wrong provider, or a request forwarded with no credential).
//
// TESTABILITY: the decisions are PURE exported functions (resolveRoutes,
//   distinctEndpoints, missingKeyEnvs, seatModels, mergeLocalLaunch, launchModelEnv,
//   buildChildEnv, planLaunch) unit-tested in router-launch.test.mjs. The real `claude`
//   exec is the one untestable rung (a live process) — offered as a real-layer check,
//   not run in the suite.
//
// Run:  node src/adapter/router-launch.mjs [--proxy] [claude args…]
//   --proxy             foreground-only: start the router, print its URL, do NOT exec claude
//   AI_DEV_CONFIG       override the config path   (default .ai-dev/config.json;
//                       its .local.json sibling is the gitignored personal override)
//   MODEL_ROUTER_ROUTES override the routes path   (default .ai-dev/model-routes.json)
//   The routes config may carry a top-level `proxyUrl` to opt into EXTERNAL mode above.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRouter, pickRoute } from "./model-router.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROVIDERS_PATH = path.join(HERE, "model-providers.json");

// ── pure decision functions (unit-tested) ───────────────────────────────────

// Load + parse the built-in provider catalog. Returns the providers array.
export function loadProviders(providersPath = PROVIDERS_PATH) {
  const parsed = JSON.parse(fs.readFileSync(providersPath, "utf8"));
  if (!Array.isArray(parsed.providers)) throw new Error("model-providers.json: missing providers[]");
  return parsed.providers;
}

// Resolve ONE routes-config entry into one or more concrete router routes
// ({ match, base_url, auth }). A { provider: <id> } entry pulls base_url + auth from
// the catalog (each overridable inline); its match patterns default to the provider's
// `models` globs (so one provider entry can fan out to several routes). A fully
// specified entry (no `provider`) passes through unchanged.
export function resolveRoute(route, providers) {
  if (!route || typeof route !== "object") throw new Error("route: not an object");
  if (!route.provider) return [route];

  const provider = providers.find((p) => p.id === route.provider);
  if (!provider) throw new Error(`route references unknown provider "${route.provider}"`);

  const base_url = route.base_url ?? provider.base_url;
  const auth = route.auth ?? provider.auth;
  if (auth === "passthrough" && !provider.supports_passthrough) {
    throw new Error(`provider "${route.provider}" does not support auth:"passthrough"`);
  }
  const matches = route.match ? [route.match] : (provider.models ?? []);
  if (matches.length === 0) throw new Error(`route for provider "${route.provider}" has no match patterns`);
  return matches.map((match) => ({ match, base_url, auth }));
}

// Resolve a whole routes config (its `routes` array) into concrete router routes.
export function resolveRoutes(routesConfig, providers) {
  const routes = (routesConfig && Array.isArray(routesConfig.routes)) ? routesConfig.routes : [];
  return routes.flatMap((r) => resolveRoute(r, providers));
}

// The distinct backend endpoints (base_url values) among a set of resolved routes.
export function distinctEndpoints(routes) {
  return [...new Set(routes.map((r) => r.base_url))];
}

// The concrete model ids the seats pin: roles.*.model plus a top-level session model,
// dropping the non-concrete wishes ("auto"/"session"/empty) that resolve to the
// default endpoint anyway.
export function seatModels(config) {
  const wishes = [];
  if (config && config.roles && typeof config.roles === "object") {
    for (const seat of Object.values(config.roles)) {
      if (seat && typeof seat.model === "string") wishes.push(seat.model);
    }
  }
  if (config && typeof config.model === "string") wishes.push(config.model);
  return wishes.filter((m) => m && m !== "auto" && m !== "session");
}

// The env vars a set of routes needs but that are unset/empty (fail-closed input).
// Passthrough routes carry no backend key and are skipped.
export function missingKeyEnvs(routes, env) {
  const missing = [];
  for (const r of routes) {
    if (r.auth === "passthrough") continue;
    const keyEnv = r.auth && r.auth.keyEnv;
    if (keyEnv && !env[keyEnv]) missing.push(keyEnv);
  }
  return [...new Set(missing)];
}

// Merge the `launch` section of a LOCAL config override over the shared one. The
// gitignored `.ai-dev/config.local.json` holds the personal/per-machine `launch.*`
// values (a `configDir`, a personal launch model) so the shared `.ai-dev/config.json`
// stays clean and nothing personal is forced on a teammate. Per-field override: a
// non-undefined local field wins over the shared one; an absent local field keeps the
// shared value. Returns a NEW config object carrying the merged `launch` — the rest of
// the shared config is untouched (the local file only ever overrides `launch`). A null
// local config (file absent) ⇒ the shared config unchanged (byte-equivalent path).
export function mergeLocalLaunch(config, localConfig) {
  const base = config && typeof config === "object" ? config : {};
  if (!localConfig || typeof localConfig !== "object") return base;
  const sharedLaunch = base.launch && typeof base.launch === "object" ? base.launch : {};
  const localLaunch = localConfig.launch && typeof localConfig.launch === "object" ? localConfig.launch : {};
  return { ...base, launch: { ...sharedLaunch, ...localLaunch } };
}

// The launch-time env the config `launch` section sources (the RATIFIED option (c)
// source-of-truth: docs/decisions/multi-model-setup-ux.md `## The fork`).
//   config.launch.sessionModel → ANTHROPIC_MODEL (the orchestrator IS the session);
//   config.launch.guardModel   → ANTHROPIC_SMALL_FAST_MODEL (the background/small-fast model);
//   config.launch.configDir    → CLAUDE_CONFIG_DIR (a per-project claude profile dir —
//     the Operator's per-task-keys mechanism, pinned per project with no .bashrc edit;
//     useful even WITHOUT routing, so it is exported here, where every exec path —
//     proxy/direct/external — passes through, docs/decisions/launcher-ux.md).
// Returns ONLY the keys with a non-empty value — an absent/empty section exports
// nothing, so a non-routing project's launch env is byte-unchanged. These must be set
// BEFORE `claude` reads them at process launch, which is exactly what the launcher does
// by putting them in the child's env below.
export function launchModelEnv(config) {
  const out = {};
  const launch = config && typeof config.launch === "object" && config.launch ? config.launch : {};
  const session = typeof launch.sessionModel === "string" ? launch.sessionModel.trim() : "";
  const guard = typeof launch.guardModel === "string" ? launch.guardModel.trim() : "";
  const configDir = typeof launch.configDir === "string" ? launch.configDir.trim() : "";
  if (session) out.ANTHROPIC_MODEL = session;
  if (guard) out.ANTHROPIC_SMALL_FAST_MODEL = guard;
  if (configDir) out.CLAUDE_CONFIG_DIR = configDir;
  return out;
}

// The child env for `claude`: layer the config-sourced launch-time models (session +
// guard + configDir, when set) onto the base env, point it at the router when one is
// given, and guarantee CLAUDE_CODE_SUBAGENT_MODEL is UNSET (it overrides per-seat
// model: pins and would collapse every seat to one model — decision doc, fact 2).
// routerUrl may be null/omitted for the direct/external paths that only need the
// launch-model layer.
//
// env precedence (ratified, docs/decisions/launcher-ux.md): the launcher layers ONLY
// ANTHROPIC_BASE_URL (to the proxy, when routing is on) + unsets
// CLAUDE_CODE_SUBAGENT_MODEL + the launch-model env; everything else in baseEnv passes
// through untouched. When routing is ON and baseEnv ALREADY carries a different
// ANTHROPIC_BASE_URL (e.g. a personal wrapper pointed at another proxy), the LAUNCHER
// WINS — but loudly: a visible stderr WARNING names both URLs so a silent hijack of the
// user's own proxy can never happen. `warn` is injectable so the pure function stays
// side-effect-testable; it defaults to a stderr writer.
export function buildChildEnv(baseEnv, routerUrl, config, warn = (m) => process.stderr.write(m)) {
  const env = { ...baseEnv, ...launchModelEnv(config) };
  if (routerUrl) {
    const prior = baseEnv && typeof baseEnv.ANTHROPIC_BASE_URL === "string" ? baseEnv.ANTHROPIC_BASE_URL.trim() : "";
    if (prior && prior !== routerUrl) {
      warn(
        `[router-launch] WARNING: ANTHROPIC_BASE_URL was already set to ${prior}; ` +
          `the launcher is routing through ${routerUrl} and OVERRIDES it for this session.\n`,
      );
    }
    env.ANTHROPIC_BASE_URL = routerUrl;
  }
  delete env.CLAUDE_CODE_SUBAGENT_MODEL;
  return env;
}

// THE decision. Given the loaded config, routes config, catalog, and env, decide
// whether to run direct or through the router, which routes the router would carry,
// and whether any needed key env is missing (fail-closed). Returns:
//   { mode: "direct"|"router"|"external", proxyUrl?, routes, exercisedRoutes, endpoints,
//     missingKeyEnvs, error }
// `mode: "external"` carries `proxyUrl` (an opt-in already-running proxy). `error` is set
// (and mode irrelevant) when the routes config is malformed OR proxyUrl is present but
// not a valid http(s) URL.
export function planLaunch({ config, routesConfig, providers, env }) {
  // Opt-in EXTERNAL proxy: a non-empty `proxyUrl` in the routes config short-circuits
  // the spawn — the launcher just points claude at the already-running proxy. Keys live
  // in that proxy's env, so the fail-closed key check below does not apply. A present-
  // but-malformed proxyUrl is a HARD ERROR (fail-closed) — never a silent fall-through
  // to spawning a local router the operator did not ask for.
  const rawProxy = routesConfig && typeof routesConfig.proxyUrl === "string" ? routesConfig.proxyUrl.trim() : "";
  if (rawProxy) {
    let valid;
    try {
      const u = new URL(rawProxy);
      valid = u.protocol === "http:" || u.protocol === "https:";
    } catch {
      valid = false;
    }
    if (!valid) {
      return { mode: "direct", proxyUrl: null, routes: [], exercisedRoutes: [], endpoints: [], missingKeyEnvs: [], error: `proxyUrl is not a valid http(s) URL: "${rawProxy}"` };
    }
    return { mode: "external", proxyUrl: rawProxy, routes: [], exercisedRoutes: [], endpoints: [], missingKeyEnvs: [], error: null };
  }

  let routes;
  try {
    routes = resolveRoutes(routesConfig, providers);
  } catch (err) {
    return { mode: "direct", routes: [], exercisedRoutes: [], endpoints: [], missingKeyEnvs: [], error: err.message };
  }

  // No routes at all ⇒ direct (nothing to route; the byte-unchanged default).
  if (routes.length === 0) {
    return { mode: "direct", routes, exercisedRoutes: [], endpoints: [], missingKeyEnvs: [], error: null };
  }

  // Which routes the seats actually exercise. When seat models are pinned, map each to
  // its route; otherwise fall back to every configured route (can't narrow).
  const models = seatModels(config);
  let exercisedRoutes;
  if (models.length) {
    const hit = new Set();
    for (const m of models) {
      const r = pickRoute(m, routes);
      if (r) hit.add(r);
    }
    exercisedRoutes = [...hit];
  } else {
    exercisedRoutes = routes;
  }

  const endpoints = distinctEndpoints(exercisedRoutes);
  const mode = endpoints.length >= 2 ? "router" : "direct";
  // In router mode the launcher carries the FULL routes table (any configured model
  // could be requested), so the key check covers all of it.
  const missing = mode === "router" ? missingKeyEnvs(routes, env) : [];
  return { mode, routes, exercisedRoutes, endpoints, missingKeyEnvs: missing, error: null };
}

// ── impure wiring (the untestable exec rung) ─────────────────────────────────

function readJsonIfPresent(p) {
  if (!p || !fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function execClaude(env, args) {
  const child = spawn("claude", args, { stdio: "inherit", env });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
  child.on("error", (err) => {
    process.stderr.write(`[router-launch] failed to exec claude: ${err.message}\n`);
    process.exit(127);
  });
  return child;
}

// The local-override config path that sits beside the shared one. Default
// .ai-dev/config.local.json (gitignored); follows AI_DEV_CONFIG when that overrides
// the shared path, so a test/alt config and its local sibling stay paired.
function localConfigPath(configPath) {
  const dir = path.dirname(configPath);
  const base = path.basename(configPath, ".json");
  return path.join(dir, `${base}.local.json`);
}

function main() {
  const args = process.argv.slice(2);
  // --proxy: foreground-only proxy mode. Start the router, print its URL, do NOT exec
  // claude — for "don't touch my launch": point your own claude/wrapper at the printed
  // URL (or wire it as the routes config `proxyUrl`). The flag is consumed here, never
  // forwarded to claude (claude is not started in this mode).
  const proxyOnly = args.includes("--proxy");
  const claudeArgs = args.filter((a) => a !== "--proxy");
  const configPath = process.env.AI_DEV_CONFIG || ".ai-dev/config.json";
  const routesPath = process.env.MODEL_ROUTER_ROUTES || ".ai-dev/model-routes.json";

  let config, routesConfig, providers;
  try {
    // Merge the gitignored local override's `launch` over the shared config's `launch`
    // (configDir + any personal launch model live there — never forced on a teammate).
    const shared = readJsonIfPresent(configPath);
    const local = readJsonIfPresent(localConfigPath(configPath));
    config = mergeLocalLaunch(shared, local);
    routesConfig = readJsonIfPresent(routesPath);
    providers = loadProviders();
  } catch (err) {
    process.stderr.write(`[router-launch] config error: ${err.message}\n`);
    process.exit(1);
    return;
  }

  const plan = planLaunch({ config, routesConfig, providers, env: process.env });
  if (plan.error) {
    process.stderr.write(`[router-launch] routes config error: ${plan.error}\n`);
    process.exit(1);
    return;
  }

  // --proxy foreground-only mode: there must be a LOCAL router to start. An external
  // proxyUrl (the proxy already runs elsewhere) or a direct plan (no proxy at all) has
  // nothing for this mode to start — fail-closed with a pointer, never a no-op claude.
  if (proxyOnly && plan.mode !== "router") {
    const why = plan.mode === "external"
      ? `a proxy is already running at ${plan.proxyUrl} (routes config proxyUrl) — point your launch at THAT URL`
      : "fewer than 2 distinct endpoints are in play (nothing to route) — pin a cross-endpoint seat first";
    process.stderr.write(`[router-launch] --proxy: nothing to start: ${why}\n`);
    process.exit(1);
    return;
  }

  if (plan.mode === "external") {
    process.stderr.write(`[router-launch] external proxy at ${plan.proxyUrl} — not spawning a router\n`);
    execClaude(buildChildEnv(process.env, plan.proxyUrl, config), claudeArgs);
    return;
  }

  if (plan.mode === "direct") {
    process.stderr.write("[router-launch] single endpoint — running claude directly (no router)\n");
    // No router URL and CLAUDE_CODE_SUBAGENT_MODEL untouched in direct mode (per-seat
    // baking still applies); only layer the config-sourced launch-time models + configDir.
    execClaude({ ...process.env, ...launchModelEnv(config) }, claudeArgs);
    return;
  }

  // Fail-closed BEFORE starting anything.
  if (plan.missingKeyEnvs.length) {
    process.stderr.write(
      `[router-launch] refusing to launch: unset backend key env var(s): ${plan.missingKeyEnvs.join(", ")}\n` +
        "  set them (or use a passthrough route) — never a silent wrong-backend.\n",
    );
    process.exit(1);
    return;
  }

  const server = createRouter({ listen: { host: "127.0.0.1", port: 0 }, routes: plan.routes });
  server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    const routerUrl = `http://127.0.0.1:${port}`;
    process.stderr.write(
      `[router-launch] router on ${routerUrl} — ${plan.endpoints.length} endpoints, ${plan.routes.length} routes\n`,
    );
    if (proxyOnly) {
      // Foreground-only: print the URL on STDOUT (scriptable — capture it to wire your
      // own launch) and stay up until interrupted; never exec claude. The server keeps
      // the event loop alive; Ctrl-C / SIGTERM ends it.
      process.stdout.write(`${routerUrl}\n`);
      process.stderr.write("[router-launch] --proxy: proxy running in the foreground; point your claude at the URL above (Ctrl-C to stop)\n");
      const stop = () => { server.close(); process.exit(0); };
      process.on("SIGINT", stop);
      process.on("SIGTERM", stop);
      return;
    }
    const child = execClaude(buildChildEnv(process.env, routerUrl, config), claudeArgs);
    const teardown = () => server.close();
    child.on("exit", teardown);
    child.on("error", teardown);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
