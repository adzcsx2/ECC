# /ecc:autonomous-loops

构建 Claude Code 自主循环的模式与架构参考。

---

## 功能

- 从简单到复杂提供六种循环模式：顺序管道、NanoClaw REPL、无限 agentic 循环、持续 PR 循环、De-Sloppify 清理模式、RFC 驱动的 DAG 编排
- 顺序管道模式：使用 `claude -p` 串联开发步骤（实现 → 清理 → 验证 → 提交）
- 支持并行 agent 与合并协调
- 在循环迭代间保持上下文持久化
- 添加质量门禁和清理 pass

## 用法

- `/ecc:autonomous-loops` - 选择和实现适合当前问题的自主循环架构

## 适用场景

- 设置无需人工干预的自主开发工作流
- 为问题选择合适复杂度的循环架构（简单 vs 复杂）
- 构建 CI/CD 风格的持续开发管道
- 运行并行 agent 并协调合并
- 为自主工作流添加质量门禁

> 源文件：[SKILL.md](SKILL.md)
