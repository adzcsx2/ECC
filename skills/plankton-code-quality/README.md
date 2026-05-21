# /ecc:plankton-code-quality

写时代码质量强制执行系统，通过 hooks 自动格式化、linting、Claude 子进程修复，确保每次文件编辑后代码质量合格。

---

## 功能

- 每次文件编辑自动运行格式化和 linting（三阶段架构）
- 根据违规复杂度分层路由到不同模型修复（Haiku/Sonnet/Opus）
- 保护 linter 配置文件不被 AI 修改
- 强制使用现代包管理器（uv、bun），阻止旧版 PM
- 支持多语言：Python、TypeScript、Shell、YAML、JSON、TOML、Markdown、Dockerfile

## 用法

- 安装 Plankton 后 hooks 自动激活，无需手动调用
- 可在 Claude Code 项目中复制 `.claude/hooks/` 和配置来集成
- 通过 `ECC_HOOK_PROFILE=strict` 等环境变量控制行为

## 适用场景

- 希望每次文件编辑都有自动化的代码质量检查
- 需要防止 AI 绕过 linter 配置来规避修复
- 需要在多种语言项目中统一代码质量标准
- 与 ECC 配合使用，互补代码质量与安全审计

> 源文件：[SKILL.md](SKILL.md)
