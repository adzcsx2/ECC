> **This is a personal fork of [affaan-m/ECC](https://github.com/affaan-m/ECC).**
> For the original project documentation, see the upstream repository.
> This fork adds custom pipeline commands, clean install behavior, and Playwright CLI-first E2E testing.

**Language:** English | [简体中文](README.zh-CN.md)

---

## What's New in This Fork

### New Commands

All commands install under the `/ecc:` namespace.

| Command | Description | README |
|---|---|---|
| `/ecc:plan-r` | Plan → Execute → Code Review pipeline | [README](commands/plan-r/README.md) |
| `/ecc:plan-t` | Plan → TDD auto-execution pipeline | [README](commands/plan-t/README.md) |
| `/ecc:plan-tr` | Plan → TDD → Code Review full pipeline | [README](commands/plan-tr/README.md) |
| `/ecc:plan-doc` | Generate task-scoped documentation set | [README](commands/plan-doc/README.md) |
| `/ecc:plan-doc-tr` | Plan-Doc → TDD → Code Review full pipeline | [README](commands/plan-doc-tr/README.md) |

### Install Improvements

- **Clean install by default**: `install.sh` automatically removes legacy `everything-claude-code` plugin cache before installing, preventing old and new versions from coexisting.
- **`/ecc:` namespace for all commands**: `commands/` now installs to `~/.claude/commands/ecc/`, giving every command the `/ecc:` prefix.

### E2E Testing

- Playwright CLI (`npx playwright`) is the default for all repeatable test flows.
- Playwright MCP is reserved for interactive debugging only.

### Fork Sync

See [docs/FORK-SYNC.md](docs/FORK-SYNC.md) for instructions on pulling upstream changes while keeping local modifications.

---

## 原项目完整文档

本仓库是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的个人 fork，仅在上方列出了本 fork 的改动。原项目的完整 README、安装指南、架构说明等全部文档，请直接查看原仓库：

**[查看原项目 README](https://github.com/affaan-m/ECC)**
