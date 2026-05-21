# /ecc:plan-orchestrate

读取计划文档，分解为步骤，自动匹配 ECC 代理链并生成 ready-to-paste 的编排命令。

---

## 功能

- 将 PRD、RFC 等计划文档自动分解为可执行步骤
- 基于步骤意图自动匹配 ECC 代理目录中的代理链
- 输出可直接粘贴的 `/orchestrate custom` 命令
- 支持按步骤范围、语言筛选生成
- 自动检测 ECC 安装模式（plugin/legacy）并使用对应命名空间

## 用法

- `/ecc:plan-orchestrate <计划文档路径>` - 分析计划文档并生成所有步骤的编排命令
- `--lang=python|typescript|go|...` - 指定语言版本用于 reviewer 选择
- `--scope=step:<n>` - 仅输出指定步骤
- `--dry-run` - 仅输出分解和链推荐，不输出最终命令

## 适用场景

- 当你有一个多步骤的计划文档，想通过 `/orchestrate` 驱动执行时
- 不想手动为每个步骤挑选代理时
- 需要为大型计划自动生成执行方案时

> 源文件：[SKILL.md](SKILL.md)
