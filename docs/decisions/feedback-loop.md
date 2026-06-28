# Decision — downstream feedback transport

**Question:** how does a downstream project's experience feed back into this repo's protocol?

**Answer:** a two-way channel (Operator decision, 2026-06-12 — supersedes the original Operator-paste-only design). The downstream session **emits** a self-report the moment the protocol fails it — `.ai-dev/feedback/<slug>.md`, the failure through its own eyes while the context is still in view — and, on the Operator's explicit OK, files it directly as a GitHub issue against the upstream repo. The upstream session **intakes** (a pasted report or a filed issue) and maps it to the protocol's structure: a compact entry in `.ai-dev/backlog.md` or an issue — the protocol finding, never raw downstream content. The procedure lives in `src/agents/procedures/downstream-feedback.md` (both halves).

## Design constraints resolved

- **Transport:** two paths. Direct `gh issue create` from the downstream session — made acceptable by two mandatory controls: a **leak-sweep** before any send (secrets, credentialed URLs, internal paths, project names, personal/business content — stripped to the protocol-level symptom) and **showing the Operator the exact title and body verbatim**, approval given on the shown text, never a paraphrase. Hand-carry (Operator paste) remains the fallback: no `gh`, no network, or a declined OK. The upstream session still never reads into a downstream repo (project-boundary deny — invariant 2).
- **Capture timing:** the report is written at failure time, not recalled later — a degraded or confused context describing itself NOW beats a reconstruction; it is honestly marked a symptom report by the model that just failed, never a diagnosis.
- **Privacy:** only the protocol-level mapping lands in the durable record (issue or backlog). Whatever the leak-sweep removed stays in the local transient file only; raw downstream content is not committed or published unless the Operator explicitly OKs it. An issue is public and effectively permanent — named in the procedure.
- **Opt-in:** the SEND is always the Operator's explicit call — emit-side (filing the issue) and intake-side (landing the entry) both; the session never publishes silently. Writing the local report file itself needs no permission — it is transient bookkeeping, deleted once carried or filed.
- **One home (invariant 6):** a duplicate finding merges into an existing backlog item rather than creating a parallel entry for the same root cause. The downstream signal is noted on the existing item.
- **GitHub issue vs backlog item:** a finding is a backlog item by default. It becomes a GitHub issue when it is actionable enough to track publicly — the Operator makes that call; the session drafts and the Operator authorizes.
