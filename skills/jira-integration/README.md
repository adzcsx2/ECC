# /ecc:jira-integration

在 AI 编码工作流中检索、分析和更新 Jira 工单，支持 MCP 和 REST API 两种方式。

---

## 功能

- 通过 MCP 或 REST API 获取和搜索 Jira 工单
- 从工单中提取可测试的需求和验收标准
- 自动更新工单状态（To Do -> In Progress -> Done）
- 添加进度评论并关联 PR/分支
- 提供工单分析的完整模板（需求、测试场景、边界用例）

## 用法

- `/ecc:jira-integration` - 连接 Jira，检索工单、分析需求、更新状态和评论

## 适用场景

- 从 Jira 工单获取需求并理解范围
- 在开发过程中同步更新 Jira 状态和进度
- 从工单中提取测试用例和验收标准
- 将 PR 和分支与 Jira 工单关联

> 源文件：[SKILL.md](SKILL.md)
