# /ecc:cost-tracking

查询和分析 Claude Code 的 token 用量、花费和预算情况。

---

## 功能

- 从本地 SQLite 数据库读取 Claude Code 的历史使用记录
- 按项目、工具、会话、模型、日期等维度拆分费用
- 提供今日花费、总花费、会话数等快速摘要
- 支持 CSV 导出和七日趋势分析

## 用法

- `/ecc:cost-tracking` - 分析 Claude Code 的 token 使用量和费用历史

## 适用场景

- 用户想知道花了多少钱、某个会话的成本或 token 使用情况
- 需要按项目或工具查看费用明细
- 需要设置预算限制或对比今日与昨日的花费趋势

> 源文件：[SKILL.md](SKILL.md)
