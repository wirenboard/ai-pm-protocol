---
pr: 6
branch: feature/template-ui-split
reviewer: general-purpose-agent
reviewed_at: 2026-05-24
trail_type: committed-review (AP-16)
---

# Review report — PR #6 (feature/template-ui-split)

**Verdict:** approve

Split выполнен качественно: композиционная matrix consistent в трёх местах (AP-15 / base.md / bootstrap-state tmpl), все 7 kinds покрыты, backend как foundation хорошего UX intellectually grounded, HeartVault leak grep clean. Out-of-scope items (database guide #42, specialized reviewers #43, HeartVault apply) properly deferred. PR готов к merge.

## 1. HeartVault leak grep (AP-17 enforcement)

`grep -rniE "heartvault|сейф|письм|HV-|wrap_key|обёртка #|content_key"` по `doc/`, `.claude/`, `README.md` — **0 matches**. AP-17 чисто.

## 2. Внутренняя consistency

- Все 7 `ui_kind` values имеют per-kind файл: `web / native-mobile / native-desktop / tui / cli / embedded / backend` — list complete.
- Старый монолит `doc/_templates/ui-style-guide.md.tmpl` удалён (rename → `-web.md.tmpl` в diff stat).
- Orphan refs к single-file name `ui-style-guide.md` в `doc/`, `.claude/`, `development-protocol.md` — **не найдены**.
- `bootstrap-state.md.tmpl` Stage A checklist: явные `ui-style-guide-base.md` + `ui-style-guide-<kind>.md per каждому ui_kind`, frontmatter `ui_kind: tbd | <comma-separated>` с пояснением.
- `project-bootstrap.md` секция «Stage A: определение `ui_kind`» — coherent, объясняет почему не на Init, multi-value, additive evolution.
- AP-15 composition matrix в `anti-patterns.md` и base.md.tmpl **совпадают** (full-stack web → base+web+backend; pure API → base+backend; CLI с server-side → base+cli+backend). Mode-aware mapping (Mode 1 обязательно / Mode 2-3 read existing / lite N/A) consistent.

## 3. Качество контента (sample-based)

- **base.md**: все 8 принципов перечислены (понятность / отзывчивость / реактивность / современный UX-паттерн / адаптивность / доступность / brand voice / эффективность пути). Vision section с PM-citation slot сохранена (§ 1.1-1.3 vision + touchstone + что не делаем). Mandatory checklist § 7 + cross-ref на per-kind — есть.
- **web.md**: «7 семантических ролей × 2 темы = 14 токенов» — explicit. Web Workers > 200ms. Tailwind + Radix primary, UnoCSS alt. CSS variables через `data-theme` / `prefers-color-scheme`.
- **backend.md**: 13 тем покрыты — SLO/p99, async 202, Idempotency-Key (Stripe convention, header ≤ 255 chars), RFC 7807 Problem Details (`application/problem+json`), bulk ops, WebSocket/SSE/webhook/polling matrix, cursor pagination, resource modeling, auth + rate limiting, ETag caching, deprecation/sunset headers, OpenAPI/AsyncAPI observability, TLS 1.3 baseline, frameworks (Echo/Axum/FastAPI). Тезис «foundation для UX» (§ intro) хорошо motivates inclusion для full-stack web.
- **cli.md**: exit codes таблица с sysexits.h fallback, 128+signal convention, NO_COLOR + isatty + `--no-color`, SIGINT/SIGTERM/SIGPIPE handling, clap/cobra/click/typer перечислены, POSIX getopt formats.
- **tui.md**: box-drawing chars (`┌─┬─┐ ╔═╦═╗`) с тонкими и double, ratatui+crossterm / Textual / Bubble Tea+Lipgloss. ASCII fallback (`--ascii` / `NO_UNICODE`) обязателен.
- **native-mobile.md**: HIG + Material 3 links, 44×44 pt / 48×48 dp touch targets, VoiceOver/TalkBack accessibility, SwiftUI/Compose frameworks.
- **embedded.md**: LVGL/Slint/watchOS/Compose Wear матрица platform groups (watch/ring/panel/MCU/e-ink/automotive), touch ≥ 9mm physical, OLED true black.
- **native-desktop.md**: keyboard shortcuts table с Cmd+Q / Alt+F4 / Ctrl+Q, traffic lights / CSD-SSD, system file dialogs (NSOpenPanel / IFileDialog / GTK), Mica/Acrylic, frameworks (WinUI / GTK / Qt / SwiftUI / Tauri).

## 4. Architectural soundness

- **Backend rules применимы к full-stack web** — backend.md frames себя как «foundation хорошего UX» через p99/idempotency/structured errors/live delivery. Aligns с PM requirement.
- **`ui_kind: tbd` default + Stage A determination flow** после vision artifact — coherent, объяснён в обоих местах (state tmpl frontmatter + project-bootstrap.md).
- **Multi-value composition** (`web, backend`) — explicitly supported в state file format и в bootstrap agent steps (loop «для **каждого** значения в ui_kind»).
- **AP-15 Mode-aware mapping** — разумен (Mode 1 mandatory; Mode 2/3 read existing + extract PR если нет; lite N/A).

## 5. Regression check (vs предыдущий монолит)

- **Vision § с PM-цитатой slot** — сохранён в base.md (§ 1).
- **Mandatory checklist** для UI-фич — есть в base.md (§ 7 general) **и** в каждом per-kind (web/cli/tui/backend checklist'ы видны через grep).
- **Theme switching mechanics** — web.md (CSS variables + prefers-color-scheme), native-desktop.md § 7.3 reactive switching, native-mobile.md (UITraitCollection/colorScheme). Покрыто для всех визуальных kinds.

## 6. Findings

### LOW-1 — AP-15 дублирует composition matrix из base.md

В `anti-patterns.md` секция AP-15 и в `database-design-base.md.tmpl` Composition examples — есть **дублирование** matrix (full-stack web → base+web+backend; pure API → base+backend; etc.). Не противоречат, но при будущих правках требует sync в двух местах.

**Не blocking** — текущая дублирующая структура помогает агенту найти info без перехода между файлами. PR-decision: оставить дубль, document с явным «source of truth» если в будущем будут расхождения.

### NIT-1 — bootstrap-state.md.tmpl long YAML comment

Строка 34 — комментарий-документация для `ui_kind` capability на одну длинную строку (~400 символов). Читаемо, но в YAML unusual.

**Не blocking** — readable, can be split в future если кажется некрасивым.

### NIT-2 — tui.md.tmpl Bubble Tea product name

Line 312 — `Bubble Tea` с пробелом. В других местах варианты написания могут быть.

**Не blocking** — это product name, не term.

## 7. Что НЕ потеряли vs предыдущей версии

- Реактивность как принцип (был в monolith добавлен в PR #4 до split'а) — теперь принцип 3 в base.md
- Эффективность пути 2-4 клика — принцип 8 в base.md
- Универсальность под тип UI — реализована через сам split (8 per-kind файлов вместо matrix внутри одного monolith'а)
- `ui-form` capability — переименована в `ui_kind` в bootstrap-state.md.tmpl

## 8. Out-of-scope (properly deferred в PR description)

- Database-design guide split (task #42, PR #7)
- Специализированные reviewer'ы (task #43)
- Применение в HeartVault (после merge'а)
- Split `ui-style-guide-web.md` на per-component sections (task возможно в будущем)

---

**Recommendation: PR #6 готов к merge.** 1 LOW + 2 NIT — non-blocking. Дубль composition matrix между AP-15 и base.md — intentional дубль для AI accessibility, не нарушение consistency.
