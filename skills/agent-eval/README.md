# /ecc:agent-eval

对比评估多个编码 agent（Claude Code、Aider、Codex 等）的性能。

---

## 功能

- 在自定义任务上对编码 agent 进行头对头比较
- 收集多项指标：通过率、成本、耗时、一致性
- 使用 YAML 声明式定义任务和评判标准
- 通过 git worktree 隔离确保每次运行环境独立可复现
- 支持在同一任务上多次运行以获得统计一致性数据

## 用法

- `/ecc:agent-eval` - 定义任务并在多个编码 agent 上运行对比评测

## 适用场景

- 在自己的代码库上比较不同的编码 agent
- 在采纳新工具或模型前测量 agent 性能
- Agent 更新模型或工具后运行回归检查
- 为团队产出数据驱动的 agent 选型决策

> 源文件：[SKILL.md](SKILL.md)
