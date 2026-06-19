# Decision: CI runs the registered quality suite wholesale, via the runner

**Rule:** a project's CI workflow invokes the quality runner (`node .ai-dev/quality/run.mjs build` and `… review`; in this repo `src/quality/run.mjs`) — never a hand-copied list of individual tool commands. The registry (`tools.json`) stays the single home of "what green means"; CI is a thin remote re-check of the same command the Builder runs locally.

## Question

The merge-gate is local. This repo's CI (`.github/workflows/checks.yml`) ran a hand-picked subset — parity + neutral-prose, 2 of 12 registered tools — while the local suite grew to 10 build + 2 review rows. How should CI mirror the local suite so a bypassed local run is caught remotely, and what is the protocol-level rule?

## Answer

1. **CI calls the runner, not the rows.** The drift happened exactly as the pattern predicts: tools were added as registry rows (no core edit needed — by design), and the workflow, which re-listed commands by hand, never learned. The workflow's own comment even claimed `tools.json` as the single home while contradicting it. A CI that invokes `run.mjs <beat>` picks up every future row for free; the registry remains the one home (invariant 6 applied to CI).
2. **CI runs both beats.** The build beat is the Builder's local gate; the review beat (neutral-prose + semgrep) is the Reviewer's. CI is the remote re-check of the whole registered suite — a bypassed local run of either beat is caught.
3. **Merge waits for CI green.** Trunk-based practice gates the commit landing in trunk on "machine agreement (CI verification)" plus human review; the forge-native floor is a required status check. Protocol-side: before executing an Operator-authorized merge, the Orchestrator confirms checks pass (`gh pr checks` — exit code 8 = still pending); red or pending ⇒ report, never merge over it. Recommending the Operator set the `quality` job as a required status check is the mechanical half (a forge setting, the Operator's to flip — not a repo file).

## Evidence

- Same build everywhere, one automated command: Fowler, *Continuous Integration* — a laptop plus the repository must suffice to build; manual command sequences are "a breeding ground for mistakes"; "only once this integration build is green can the developer consider the integration to be complete" (<https://martinfowler.com/articles/continuousIntegration.html>, verified 2026-06-13, high confidence).
- Gate the merge on machine + human agreement; post-merge CI re-run as the timing safety net: <https://trunkbaseddevelopment.com/continuous-integration/> (verified 2026-06-13, high confidence).
- Required status checks "must pass before you can merge your branch into the protected branch": GitHub docs (<https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks>, verified 2026-06-13). Caveat from the same page: a *skipped* job counts as successful — keep the quality job unconditional.
- `gh pr checks` shows/waits on a PR's checks; `--watch`, `--required`, exit code 8 = pending: <https://cli.github.com/manual/gh_pr_checks> (verified 2026-06-13).
- Semgrep's official GitHub Actions recipe uses the `semgrep/semgrep` container + `semgrep ci` with an app token (<https://docs.semgrep.dev/semgrep-ci/sample-ci-configs>, verified 2026-06-13). **Conscious deviation:** that container lacks Node (the rest of the suite needs it) and `semgrep ci` bypasses the registry row. We install semgrep onto the Node runner (`pipx install semgrep` — pipx ships on `ubuntu-latest`; bare `pip install` hits PEP 668 on Ubuntu 24) and let the runner execute the registry row's exact command, keeping one source of truth. Unpinned version mirrors the row's own init line ("pip install semgrep") — a conscious match of local behaviour, not an oversight.
- Verified locally before grounding the YAML (2026-06-13, Node v20): `node src/quality/run.mjs build` → 10/10 PASS; `node src/quality/run.mjs review` → 2/2 PASS. `package-lock.json` exists, so `npm ci` works in CI.

## Changes this grounds

| Change | Home |
| --- | --- |
| Workflow invokes the runner for both beats (YAML below) | `.github/workflows/checks.yml` |
| CI-wiring offer sharpened: the workflow runs the registered suite **via the runner, never a re-listed subset** — a hand-copied list drifts the moment a row is added | `src/agents/orchestrator.md` `## Setup` step 5 (the offer's single home) |
| Audit drift dimension gains CI-suite parity: the workflow still invokes the runner; a hand-picked subset is a finding | `src/agents/orchestrator.md` `## Audit` step 2 (the "no drift" item) |
| Merge execution confirms CI green first (`gh pr checks`); red/pending ⇒ report, never merge — and offer the Operator the required-status-check forge setting once | `src/agents/orchestrator.md` `## Your seat`, the merge-execution bullet |

No `PROTOCOL.md` edit: the core already delegates "what green means" to the quality layer and the CI offer to setup — the rule sharpens those homes, it does not add a core fact (thin-core manifesto).

### The workflow change for this repo

```yaml
name: Checks

# Remote re-check of the registered quality suite — BOTH beats, via the runner.
# The single home of "what green means" is src/quality/tools.json; this workflow
# never lists an individual tool, so a new registry row is picked up with no
# CI edit (docs/decisions/ci-suite-parity.md).

on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Install semgrep (review-beat row; pipx avoids PEP 668 on Ubuntu 24)
        run: pipx install semgrep
      - name: Quality suite — build beat
        run: node src/quality/run.mjs build
      - name: Quality suite — review beat
        run: node src/quality/run.mjs review
```

## Negative result

No standing tool was found that generically asserts "CI invokes the project's task runner" — drift-guard products exist but are platform-specific contract checkers. The cheap structural fix (CI calls the runner, so there is no list to drift) beats adding a guard tool; the audit dimension covers the residual risk (someone re-hand-picking the workflow later).
