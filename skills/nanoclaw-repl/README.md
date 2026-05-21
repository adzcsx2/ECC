# /ecc:nanoclaw-repl

操作和扩展 NanoClaw v2，ECC 零依赖、会话感知的 REPL，基于 `claude -p` 构建。

---

## 功能

- 持久化 Markdown 会话管理，支持会话恢复
- 动态模型切换（`/model`）和技能加载（`/load`）
- 会话分支（`/branch`）：高风险操作前安全分支
- 跨会话搜索（`/search`）和历史压缩（`/compact`）
- 导出为 md/json/txt 格式（`/export`）和会话指标查看（`/metrics`）

## 用法

- `/ecc:nanoclaw-repl` - 运行或扩展 `scripts/claw.js` 时使用

## 适用场景

- 使用 NanoClaw REPL 进行长时间、任务聚焦的 AI 会话
- 需要对会话进行分支（高风险操作前）、压缩（重大里程碑后）或导出（分享/归档前）
- 扩展 NanoClaw 功能：保持零外部依赖、Markdown 兼容、命令处理器确定性

> 源文件：[SKILL.md](SKILL.md)
