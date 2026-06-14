> **This is a personal fork of [affaan-m/ECC](https://github.com/affaan-m/ECC).**
> For the original project documentation, see the upstream repository.
> This fork adds custom pipeline commands, clean install behavior, and Playwright CLI-first E2E testing.

**Language:** English | [简体中文](README.zh-CN.md)

---

## What's New in This Fork

### New Commands

All commands install under the `/ecc:` namespace.

| Command         | Description                                          | README                                |
| --------------- | ---------------------------------------------------- | ------------------------------------- |
| `/ecc:plan-r`   | Plan → Execute → Code Review pipeline                | [README](commands/plan-r/README.md)   |
| `/ecc:plan-t`   | Plan → TDD → Code Review → CAS atomic merge pipeline | [README](commands/plan-t/README.md)   |
| `/ecc:plan-tr`  | Plan → TDD → Code Review → CAS atomic merge pipeline | [README](commands/plan-tr/README.md)  |
| `/ecc:plan-doc` | Generate task-scoped documentation set               | [README](commands/plan-doc/README.md) |
| `/ecc:execute-doc` | Execute a plan-doc execution document phase by phase (same-model subagent per phase, main-agent audits, auto-advance) | [README](commands/execute-doc/README.md) |
| `/ecc:brainstorming` | Pre-implementation design exploration; hands the approved design to /ecc:plan | [README](commands/brainstorming/README.md) |

### GitHub Copilot Prompts

For VS Code GitHub Copilot Chat, the same ECC workflows ship as prompt files under `.github/prompts/`, each named `ecc-*.prompt.md`. VS Code exposes them by file name, so invoke them with the `/ecc-` prefix (Copilot does not support a `:` in prompt names). Prompt files require `"chat.promptFiles": true` in `.vscode/settings.json`.

| Copilot Prompt         | When to use                     | Purpose                                                    |
| ---------------------- | ------------------------------- | ---------------------------------------------------------- |
| `/ecc-plan`            | Complex feature                 | Phased implementation plan                                 |
| `/ecc-plan-doc`        | Multi-session, multi-phase work | Persist a task-scoped documentation set under `docs/plan/` |
| `/ecc-tdd`             | New feature or bug fix          | Test-driven development cycle                              |
| `/ecc-code-review`     | After writing code              | Quality and security review                                |
| `/ecc-security-review` | Before a release                | Deep security analysis                                     |
| `/ecc-build-fix`       | Build/CI failure                | Systematic error resolution                                |
| `/ecc-refactor`        | Code maintenance                | Dead code cleanup and simplification                       |

To use: open Copilot Chat, type `/` and select the prompt from the picker.

### Install Improvements

- **Default overwrite install**: Running `./install.sh` with no arguments now defaults to `--profile full --target claude`, performing a complete overwrite install. Use `./install.sh --help` to see all options.
- **Clean install by default**: `install.sh` automatically removes legacy `everything-claude-code` plugin cache before installing, preventing old and new versions from coexisting.
- **`/ecc:` namespace for all commands**: `commands/` now installs to `~/.claude/commands/ecc/`, giving every command the `/ecc:` prefix.

### E2E Testing

- Playwright CLI (`npx playwright`) is the default for all repeatable test flows.
- Playwright MCP is reserved for interactive debugging only.

### Fork Sync

See [docs/FORK-SYNC.md](docs/FORK-SYNC.md) for instructions on pulling upstream changes while keeping local modifications.

### Changelog

Recent upstream sync history. [View all changelogs →](docs/changelogs/)

| Date       | #                                            | Description                                                                                                                                          |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-29 | [1](docs/changelogs/changelog-2026-05-29-1/) | Sync upstream: React track, AURA adapter, ECC 2.0 skill pack, social publisher, frontend a11y, Squish Memory MCP, hook fixes, German i18n (+20 more) |

---

## 原项目完整文档

本仓库是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的个人 fork，仅在上方列出了本 fork 的改动。原项目的完整 README、安装指南、架构说明等全部文档，请直接查看原仓库：

**[查看原项目 README](https://github.com/affaan-m/ECC)**
