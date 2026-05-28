# Changelog

Формат — [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), versioning по [SemVer 2.0](https://semver.org/lang/ru/).

**SemVer для template:**
- **MAJOR** — breaking changes: несовместимые изменения структуры проекта, удалённые агенты/команды
- **MINOR** — новые агенты, команды, шаблонные документы
- **PATCH** — fixes, уточнения, нефункциональные изменения

---

## [Unreleased]

### Changed

- **Full template rewrite (v2).** Полный пересмотр архитектуры: убраны development-protocol.md, bootstrap state machine, AP-1..AP-33 checklist, domain-файлы, формальный spec.md. PM работает через натуральный язык — агенты оркестрируются автоматически. Тесты = поведенческий контракт (кодер не трогает существующие тесты). Планирование интерактивно в основной сессии. CLAUDE.md = единственный источник правды для агентов.
