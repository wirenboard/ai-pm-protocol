# Project — Claude Code briefing (seed)

> Это **seed-версия** briefing'а, развёрнутая `init.sh` из ai-pm-protocol сразу после `git submodule add`.
> Bootstrap-агент заменит этот файл на полный project-specific CLAUDE.md на Stage D
> (см. `.ai-pm/tooling/doc/_templates/CLAUDE.md.tmpl`). До тех пор — действуют правила ниже.

---

## Что это за проект

Проект использует **ai-pm-protocol** — submodule в `.ai-pm/tooling/`. Полная спека протокола — `.ai-pm/tooling/doc/development-protocol.md`. Anti-patterns — `.ai-pm/tooling/doc/anti-patterns.md`.

ЦА протокола в v0 — **PM, не читает код**. До завершения bootstrap'а: не показывай оператору diff'ы, обсуждай на уровне behaviour / scenarios / decisions.

---

## Session start routine — ДО любого другого действия

**Шаг 1: Прочитай `.ai-pm/.bootstrap-state.md`.**

- **Файла нет** → invoke subagent `project-bootstrap`. Передай context: «new-product mode, state-файл отсутствует, начинаем Stage A». Дальше — слушай оператора, не работай над фичами.
- **Файл есть, но Stage A-D не closed** → invoke `project-bootstrap`, скажи оператору: «Bootstrap не завершён, продолжаем со stage X». Не работай над фичами.
- **Stage A-D closed** → bootstrap уже перезаписал этот файл на полную версию из template'а. Если ты это читаешь после завершённого bootstrap'а — что-то пошло не так, перечитай корневой `CLAUDE.md` ещё раз.

**Шаг 2: Не делай больше ничего.** Любые правки кода, новые файлы, эксперименты — после того как bootstrap провёл оператора через Stage A-D и заменил этот seed на полный briefing.

---

## Жёсткие правила (действуют уже сейчас, до bootstrap'а)

- **Никакого кода в `main`.** Только feature/<topic> + PR + squash & merge.
- **Никаких новых файлов в корне** без явного запроса оператора. Bootstrap создаст структуру сам.
- **Никаких догадок про стек / архитектуру** проекта. Спроси оператора либо дождись когда bootstrap соберёт Stage A-C.
- **Оператор-facing язык — plain.** Никаких Stage X / AP-NN / `[override]` маркеров в обращении к оператору (AP-32). Bootstrap-агент знает термины; main session — тоже, но при escalation к оператору говорит по-человечески.

---

## Как развернулся этот seed

`.ai-pm/tooling/init.sh` после `git submodule add` сделал три вещи:
1. Создал symlink `.claude/agents → .ai-pm/tooling/.claude/agents` — чтобы Claude Code увидел 9 subagents протокола.
2. Скопировал этот seed (`CLAUDE.seed.md` из submodule) в корневой `CLAUDE.md`.
3. Напечатал подсказку про restart сессии.

Если subagents не подтягиваются (`project-bootstrap` not found при invoke) — **перезапусти Claude Code сессию** (`/exit` + `claude` снова). Claude Code сканирует `.claude/agents/` только на старте сессии.
