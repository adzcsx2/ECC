# /ecc:context-budget

审计 Claude Code 上下文窗口的 token 消耗，识别膨胀组件并给出优化建议。

---

## 功能

- 四阶段审计：盘点（估算各组件 token）-> 分类（按必要性分桶）-> 问题检测 -> 优化报告
- 组件全覆盖：Agents、Skills、Rules、MCP Servers、CLAUDE.md 的逐项 token 统计
- 问题模式检测：代理描述臃肿、重复组件、MCP 过度订阅、CLAUDE.md 膨胀
- 排名优化建议：按可节省的 token 量排序，给出具体操作和节省预估
- 支持基本审计和 verbose 详细模式

## 用法

- `/ecc:context-budget` - 审计当前会话的上下文开销，输出优化报告

## 适用场景

- 会话响应变慢或输出质量下降时
- 最近添加了大量技能、代理或 MCP 服务器后
- 在添加更多组件前评估上下文余量
- 定期维护：发现并清理不再需要的组件

> 源文件：[SKILL.md](SKILL.md)
