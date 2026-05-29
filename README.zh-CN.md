> **本项目是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的个人 fork。**
> 原项目文档请查看上游仓库。
> 本 fork 新增了流水线命令、默认覆盖安装，以及 Playwright CLI 优先的 E2E 测试模式。

**语言：** [English](README.md) | 简体中文

---

## 本 Fork 的改动

### 新增命令

所有命令安装在 `/ecc:` 命名空间下。

| 命令 | 说明 | README |
|---|---|---|
| `/ecc:plan-r` | 规划 → 执行 → 代码审查 三阶段流水线 | [README](commands/plan-r/README.md) |
| `/ecc:plan-t` | 规划 → TDD → Review 通过后合并 的流水线 | [README](commands/plan-t/README.md) |
| `/ecc:plan-tr` | 规划 → TDD → Review 通过后合并 的流水线 | [README](commands/plan-tr/README.md) |
| `/ecc:plan-doc` | 生成任务级完整文档集 | [README](commands/plan-doc/README.md) |
| `/ecc:plan-doc-tr` | 文档生成 → TDD → Review 通过后合并 的流水线 | [README](commands/plan-doc-tr/README.md) |

### 安装优化

- **默认覆盖安装**：直接执行 `./install.sh`（无参数）默认为 `--profile full --target claude`，一键完成完整覆盖安装。`./install.sh --help` 可查看全部选项。
- **自动清理旧版**：每次 `install.sh` 会自动清理旧版 `everything-claude-code` 插件缓存，避免新旧版本共存。
- **所有命令统一 `/ecc:` 命名空间**：`commands/` 目录安装到 `~/.claude/commands/ecc/`，所有命令以 `/ecc:` 前缀调用。

### E2E 测试

- Playwright CLI（`npx playwright`）为所有可复现测试的默认执行方式。
- Playwright MCP 仅用于交互式调试。

### Fork 同步

拉取上游更新同时保留本地改动 ，请参考 [docs/FORK-SYNC.md](docs/FORK-SYNC.md)。

---

## 原项目完整文档

本仓库是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的个人 fork，仅在上方列出了本 fork 的改动。原项目的完整 README、安装指南、架构说明等全部文档，请直接查看原仓库：

**[查看原项目 README](https://github.com/affaan-m/ECC)**
