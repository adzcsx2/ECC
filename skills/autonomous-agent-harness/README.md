# /ecc:autonomous-agent-harness

将 Claude Code 转变为完全自主的 agent 系统。

---

## 功能

- 使用 Claude Code 原生 crons 和 dispatch 实现定时任务调度
- 集成 MCP memory server 实现跨会话持久化记忆（短期/中期/长期）
- 支持 computer use 与定时执行结合
- 替代独立 agent 框架（Hermes、AutoGPT），用 Claude Code 原生能力实现自主循环
- 严格的安全边界：所有自主操作需用户显式授权

## 用法

- `/ecc:autonomous-agent-harness` - 设置持续运行的自主 agent，支持定时任务和持久记忆

## 适用场景

- 需要一个持续运行或按计划运行的 agent
- 设置周期性触发的自动化工作流
- 构建跨会话保持上下文的个人 AI 助手
- 需要替代 Hermes、AutoGPT 等独立 agent 框架
- 需要 computer use 与定时执行结合

> 源文件：[SKILL.md](SKILL.md)
