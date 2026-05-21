# /ecc:dmux-workflows

使用 dmux 的多代理编排工作流，在 tmux 窗格中并行运行多个 AI 代理会话。

---

## 功能

- 5 种并行模式：Research+Implement、Multi-File Feature、Test+Fix Loop、Cross-Harness、Code Review Pipeline
- Git worktree 集成：为重叠文件的任务创建独立工作树，完成后合并分支
- ECC 内置辅助工具：`scripts/orchestrate-worktrees.js` 自动化 tmux 窗格和工作树编排
- 互补工具对比：dmux vs Superset vs Claude Code Task vs Codex multi-agent

## 用法

- `/ecc:dmux-workflows` - 并行运行多个 AI 代理会话或协调多代理开发工作流

## 适用场景

- 需要同时运行多个代理会话并行处理任务
- 跨 Claude Code、Codex 等不同 harness 协调工作
- 用户提到"run in parallel""split this work""use dmux""multi-agent"

> 源文件：[SKILL.md](SKILL.md)
