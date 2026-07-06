# Decision: Auto-compact for non-Claude (proxied) Claude Code sessions

**Status:** reverted in 5.54.0 (2026-07-06) — the threshold-monitor approach shipped in 5.53.0 was superseded by a redesigned responsibility split. Summarization-by-threshold moves to the **proxy** (modelpipe); the protocol retains ONLY continuous crash-resume checkpoints (file + pointer), not a threshold monitor or a `PreCompact` block. Dogfood (the very session that shipped it) confirmed **LV1**: the proxied non-Claude session strips Anthropic-shaped `usage.*` fields, so the message-count fallback misread ~763–788% and fired every prompt (the threshold de-bounce also failed to suppress repeats). This doc is RETAINED as the path record (threshold → live-bug → redesigned split); the body below is the historical grounding of the abandoned approach, not current design.
**Date:** 2026-07-06

## Question

How can a Claude Code session running a **non-Claude model via a proxy** (`ANTHROPIC_BASE_URL`→modelpipe; sonnet→GLM, haiku→DeepSeek) read its context-window usage and clear+restart losslessly, so a launch-time plugin can — at a configurable threshold — write a deterministic **checkpoint** and restart fresh, instead of relying on the built-in model-summarization compact (which breaks on non-Claude models)? **Prefer in-harness mechanisms** (hooks/settings/slash-commands) over an external wrapper-script.

## Answer

**Q1 — usage read.** Hooks do **not** expose context-window usage today. The common hook input fields are `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `effort`, `hook_event_name` — no token/percent field. Exposing usage (env vars `CLAUDE_CONTEXT_PERCENT` / `_TOKENS_USED` / `_TOKENS_MAX`) is an **open feature request**, not shipped. The % is computed for the status bar but not piped to hooks. Usable proxies for the threshold today: (a) read the `transcript_path` JSONL tail and sum/estimate tokens; (b) a message-count heuristic (rough — a single big tool result can be 10× a simple turn).

**Q2 — clear + restart (in-harness).** `/clear` exists (SessionStart matcher `clear`; SessionEnd reason `clear`) but **no hook can trigger it programmatically**, and the model cannot emit slash-commands as tools. `claude --resume <SESSION_ID>`, `--continue`, and `--fork-session` restore full history — these are the restart mechanism. `PreCompact` fires for both `manual` and `auto` and **can block** (exit 2, or `decision:"block"`): blocking proactive auto-compact skips it and continues uncompacted; blocking a limit-error-recovery compact surfaces the error (too late). So the in-harness path is: a `UserPromptSubmit`/`Stop` command hook estimates usage → at threshold injects `additionalContext` instructing the model to write the structured checkpoint and ask the Operator to restart (`claude --continue`); a `PreCompact(auto)` hook blocks the harness's model-summarize so it never runs on the proxied model. No external kill/restart wrapper required.

**Q3 — proxy angle.** A proxy in front of Claude Code (modelpipe / claude-code-proxy / OpenAI-compatible) makes Claude Code "think it is talking to Anthropic." Usage counting works only if the proxy returns Anthropic-shaped `usage.*` fields; a proxy that omits them leaves the status-bar % wrong and our transcript-derived estimate as the only signal. The reported failure (compact breaks) is the model-summarization call itself — which the PreCompact-block sidesteps entirely (no summarize step runs).

## Evidence

- **Hooks reference (official)** — [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) — common input fields carry no usage; `PreCompact` "Exit with code 2 to block compaction"; `SessionStart` matcher `clear`; `UserPromptSubmit` plain-stdout / `additionalContext` injects context; `--resume`/`--continue`/`--fork-session` restore history ([code.claude.com/docs/en/sessions](https://code.claude.com/docs/en/sessions)).
- **Issue #27969 "Expose context window usage percentage to hooks"** — [github.com/anthropics/claude-code/issues/27969](https://github.com/anthropics/claude-code/issues/27969) (2026-02-23) — "There's currently no way for hooks to know how full the context window is"; proposes `CLAUDE_CONTEXT_PERCENT` etc.; notes the % is already shown in the UI status bar.
- **Custom-model/proxy docs** — [morphllm.com/use-different-llm-claude-code](https://www.morphllm.com/use-different-llm-claude-code), [code.claude.com/docs/en/env-vars](https://code.claude.com/docs/en/env-vars) — `ANTHROPIC_BASE_URL` redirects API calls; the proxy translates requests so Claude Code believes it is talking to Anthropic. **UNVERIFIED** for modelpipe specifically (whether it returns `usage` fields).
- **Compaction (platform)** — [platform.claude.com/docs/en/build-with-claude/compaction](https://platform.claude.com/docs/en/build-with-claude/compaction) — default summarization is a model call with a `<summary>` prompt; varies by model. Confirms the failure surface on non-Claude models.

## What it grounds for the design

- **Threshold monitor** = a `UserPromptSubmit` (and/or `Stop`) **command hook** that reads the `transcript_path` JSONL tail and estimates token usage; compares to the configurable threshold (**default 0.5** — Operator 2026-07-06: deterministic checkpoints make an early restart lossless, so a low threshold is safe and saves tokens by restarting on a smaller context; nudge up if it fires too eagerly) held in `launch` config (conversational adjust = the model reads/writes a mutable threshold value in a local state field). No usage env-var exists yet, so the transcript-estimate is the primary signal; message-count is a coarse fallback.
- **Compaction action** = at threshold the hook injects `additionalContext`: instruct the model to write the structured checkpoint (reconcile `.ai-dev/state/current.md` + write `.ai-dev/notes/<feature>.md`) and ask the Operator to restart with `claude --continue`. Deterministic, **no model-summarize** — model-agnostic.
- **PreCompact(auto) block** = a `PreCompact` hook matching `auto`, exit 2, so the harness's model-summarize never runs on the proxied model. The checkpoint-restart replaces it. (Block proactive auto-compact; a limit-error-recovery compact is already too late — the monitor must fire first.)
- **Toggle** = default ON; disabled via `launch` config / `safeguards`-class flag.
- **Wrapper-script** = fallback only, not needed for the in-harness path; `claude --resume <id>` is the resume primitive if an external restarter is ever wanted.

## Live-verify items (post-build, run on a real GLM-proxied session)

**Status:** LV1 CONFIRMED live (2026-07-06, on revert); LV2–LV4 moot under the redesigned split (no transcript-token threshold monitor in the protocol).

1. **LV1 — JSONL `usage` field path:** CONFIRMED ABSENT on a proxied modelpipe/GLM session — the transcript carries no Anthropic-shaped `usage.*` fields, so the message-count fallback was the active path and misread ~763–788% (a long tool-heavy session has far more than `messageCountMax` messages, so the ratio blew past 1.0). Lesson: message-count is a bad usage proxy on long sessions; the real signal must live where usage is knowable — the proxy.

2. **LV2 — Token count semantics:** Confirm the last entry's `input_tokens` is cumulative (not just that message's tokens). If not cumulative, the script must sum all entries — update accordingly and document performance bound.

3. **LV3 — `PreCompact(auto)` timing:** Confirm that `PreCompact` fires before the limit-error compact (proactively, while interactive), not only after the overflow. Deliberately approach 100% context and observe when `PreCompact` fires — still interactive or only when erroring.

4. **LV4 — `checkpointTriggered` reset across `claude --continue`:** After writing checkpoint and restarting with `--continue`, confirm the new session has a different `session_id` in its hook payload. If stable across restarts, the de-bounce will prevent re-injection on fresh context — implement reset on usage-drop signal instead.
