#!/usr/bin/env bash
# ai-pm-protocol — one-shot onboarding для downstream проекта.
#
# Закрывает chicken-and-egg между `git submodule add` и первым `claude`:
#  (1) Claude Code сканит .claude/agents/ в КОРНЕ проекта, а submodule приносит
#      агентов в .ai-pm/tooling/.claude/agents/. Без симлинка subagents
#      protocol'а невидимы → invoke `project-bootstrap` фейлится.
#  (2) Без CLAUDE.md в корне Claude не знает про существование протокола и
#      не зовёт bootstrap-агента. Bootstrap сам пишет полный CLAUDE.md из
#      шаблона, но только когда его уже позвали.
#
# Скрипт идемпотентный:
#  - симлинк .claude/agents перезаписывается через ln -sfn
#  - корневой CLAUDE.md НЕ перезатирается если уже есть (bootstrap либо ручной)
#
# Запускается ОДИН раз сразу после `git submodule add`:
#     .ai-pm/tooling/init.sh
#
# Если потом всё-таки нужно re-seed CLAUDE.md (юзер случайно удалил, хочет
# вернуться к seed-варианту до bootstrap'а) — удали CLAUDE.md руками и
# прогони init.sh снова.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SUBMODULE_REL=".ai-pm/tooling"

cd "$PROJECT_ROOT"

# Sanity: убедиться что мы реально в downstream проекте, а не в самом submodule
if [ ! -d "$SUBMODULE_REL" ]; then
    echo "ERROR: '$SUBMODULE_REL' не найден в текущей директории."
    echo "       Скрипт запускается из корня твоего проекта, ПОСЛЕ"
    echo "       'git submodule add … $SUBMODULE_REL'."
    echo "       Текущая директория: $PROJECT_ROOT"
    exit 1
fi

# Sanity: agents/ в submodule должна существовать (иначе submodule повреждён)
if [ ! -d "$SUBMODULE_REL/.claude/agents" ]; then
    echo "ERROR: '$SUBMODULE_REL/.claude/agents/' не найден."
    echo "       Submodule повреждён или из не той ветки. Попробуй:"
    echo "         git submodule update --init --recursive"
    exit 1
fi

echo "==> ai-pm-protocol onboarding"
echo "    Project root: $PROJECT_ROOT"
echo ""

# (1) .claude/agents symlink
mkdir -p .claude

if [ -e .claude/agents ] && [ ! -L .claude/agents ]; then
    echo "ERROR: '.claude/agents' уже существует как обычная директория (не симлинк)."
    echo "       Не перезаписываю — там может быть твой кастом."
    echo "       Реши вручную: переместить файлы в .claude/agents-local/ или"
    echo "       удалить '.claude/agents' и прогнать init.sh снова."
    exit 1
fi

ln -sfn "../$SUBMODULE_REL/.claude/agents" .claude/agents
echo "[ok] .claude/agents → $SUBMODULE_REL/.claude/agents (9 subagents протокола доступны)"

# (2) CLAUDE.md seed
if [ -e CLAUDE.md ]; then
    echo "[skip] CLAUDE.md уже есть — не перезатираю (bootstrap либо ручной)."
else
    if [ ! -f "$SUBMODULE_REL/CLAUDE.seed.md" ]; then
        echo "ERROR: '$SUBMODULE_REL/CLAUDE.seed.md' не найден в submodule."
        echo "       Версия submodule, видимо, до v0.7.x. Обнови:"
        echo "         cd $SUBMODULE_REL && git fetch && git checkout <свежий тэг>"
        exit 1
    fi
    cp "$SUBMODULE_REL/CLAUDE.seed.md" CLAUDE.md
    echo "[ok] CLAUDE.md создан из seed (bootstrap-агент заменит его на полную версию)"
fi

echo ""
echo "==> Готово."
echo ""
echo "Дальше:"
echo "  1. Если Claude Code уже запущен — ВЫЙДИ и запусти снова (/exit + claude)."
echo "     Subagents сканятся только на старте сессии."
echo "  2. Если ещё не запускал — просто 'claude' в этой директории."
echo ""
echo "Bootstrap-агент стартует автоматически (CLAUDE.md скажет Claude'у, что делать)."
