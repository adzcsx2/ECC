> **本项目是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的个人 fork。**
> 原项目文档请查看上游仓库。
> 本 fork 新增了流水线命令、默认覆盖安装，以及 Playwright CLI 优先的 E2E 测试模式。

**语言：** [English](README.md) | 简体中文

---

## 本 Fork 的改动

### 新增命令

所有命令安装在 `/ecc:` 命名空间下。

| 命令            | 说明                                          | README                                |
| --------------- | --------------------------------------------- | ------------------------------------- |
| `/ecc:plan-r`   | 规划 → 执行 → 代码审查 三阶段流水线           | [README](commands/plan-r/README.md)   |
| `/ecc:plan-t`   | 规划 → TDD → Code Review → CAS 原子合并流水线 | [README](commands/plan-t/README.md)   |
| `/ecc:plan-tr`  | 规划 → TDD → Code Review → CAS 原子合并流水线 | [README](commands/plan-tr/README.md)  |
| `/ecc:plan-doc` | 生成任务级完整文档集                          | [README](commands/plan-doc/README.md) |
| `/ecc:execute-doc` | 逐 phase 执行 plan-doc 执行文档（同模型子代理执行、主代理审计、自动推进；强化停车规则 + 可选脚本编排器实现零停车） | [README](commands/execute-doc/README.md) |
| `/ecc:brainstorming` | 动手前的设计探索，把已批准的设计交给 /ecc:plan | [README](commands/brainstorming/README.md) |

### GitHub Copilot Prompts

VS Code 的 GitHub Copilot Chat 通过 `.github/prompts/` 下的 prompt 文件提供同样的 ECC 工作流，文件统一命名为 `ecc-*.prompt.md`。VS Code 按文件名暴露调用名，因此用 `/ecc-` 前缀调用（Copilot 的 prompt 名称不支持 `:`）。使用 prompt 文件需在 `.vscode/settings.json` 中设置 `"chat.promptFiles": true`。

| Copilot Prompt         | 何时使用           | 用途                               |
| ---------------------- | ------------------ | ---------------------------------- |
| `/ecc-plan`            | 复杂功能           | 分阶段实现计划                     |
| `/ecc-plan-doc`        | 多会话、多阶段工作 | 在 `docs/plan/` 下生成任务级文档集 |
| `/ecc-tdd`             | 新功能或 bug 修复  | 测试驱动开发循环                   |
| `/ecc-code-review`     | 写完代码后         | 质量与安全审查                     |
| `/ecc-security-review` | 发布前             | 深度安全分析                       |
| `/ecc-build-fix`       | 构建/CI 失败       | 系统化错误排查                     |
| `/ecc-refactor`        | 代码维护           | 死代码清理与简化                   |

使用方式：打开 Copilot Chat，输入 `/` 并从候选列表中选择对应 prompt。

### Codex Prompt Aliases

检测到 Codex 后，`install.sh` 和 `install.ps1` 会自动把顶层 `commands/*.md` 同步到 `~/.codex/prompts/`，生成 `ecc-*.md`。Codex 中使用与 Claude 命令对应的 prompt alias：

| Claude 命令 | Codex Prompt |
| ----------- | ------------ |
| `/ecc:plan` | `/prompts:ecc-plan` |
| `/ecc:plan-doc` | `/prompts:ecc-plan-doc` |
| `/ecc:code-review` | `/prompts:ecc-code-review` |
| `/ecc:update-docs` | `/prompts:ecc-update-docs` |

每次安装都会刷新这些生成文件，并清理已废弃的生成型 `ecc-*` prompt；用户自己写的 prompt 不会被删除。

### 安装优化

- **默认覆盖安装**：直接执行 `./install.sh`（无参数）默认为 `--profile full --target claude`，一键完成完整覆盖安装。`./install.sh --help` 可查看全部选项。
- **自动清理旧版**：每次 `install.sh` 会自动清理旧版 `everything-claude-code` 插件缓存，避免新旧版本共存。
- **所有命令统一 `/ecc:` 命名空间**：`commands/` 目录安装到 `~/.claude/commands/ecc/`，所有命令以 `/ecc:` 前缀调用。
- **Codex 命令同步**：如果存在 `~/.codex` 或 `CODEX_HOME`，安装时也会刷新 `~/.codex/prompts/` 下的 Codex prompt alias。显式执行 `./install.sh --target codex` 会安装 Codex baseline 并同步同一批 alias。

### E2E 测试

- Playwright CLI（`npx playwright`）为所有可复现测试的默认执行方式。
- Playwright MCP 仅用于交互式调试。

### Fork 同步

拉取上游更新同时保留本地改动 ，请参考 [docs/FORK-SYNC.md](docs/FORK-SYNC.md)。

### Changelog

最近的上游同步记录。[查看全部 changelog →](docs/changelogs/)

| 日期       | 编号                                         | 说明                                                                                                                                                |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-29 | [1](docs/changelogs/changelog-2026-05-29-1/) | 同步上游：React 语言轨道、AURA 适配器、ECC 2.0 skill pack、social publisher、frontend a11y、Squish Memory MCP、hook 修复、德语本地化（+20 commits） |

---

## 原项目完整文档

本仓库是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的个人 fork，仅在上方列出了本 fork 的改动。原项目的完整 README、安装指南、架构说明等全部文档，请直接查看原仓库：

**[查看原项目 README](https://github.com/affaan-m/ECC)**
