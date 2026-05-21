# /ecc:agentic-os

构建基于 Claude Code 的持久化多 agent 操作系统。

---

## 功能

- 设计四层架构：内核（CLAUDE.md）、专家 agent、斜杠命令、守护脚本
- 内核负责身份定义、路由规则和 agent 注册表
- 专家 agent 分工处理开发、写作、研究、运维等不同任务
- 基于文件的持久化状态层，无需外部数据库
- 支持跨会话的上下文保持和定时自动化

## 用法

- `/ecc:agentic-os` - 构建以 Claude Code 为运行时的持久化多 agent 系统

## 适用场景

- 在 Claude Code 内构建多 agent 工作流
- 设置跨会话持久化的 Claude Code 自动化
- 创建管理周期性任务的"个人 OS"或"agentic OS"
- 构建需要跨会话保持上下文的长期项目

> 源文件：[SKILL.md](SKILL.md)
