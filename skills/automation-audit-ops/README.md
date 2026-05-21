# /ecc:automation-audit-ops

基于证据的自动化资产盘点与重叠审计。

---

## 功能

- 全面盘点实时自动化资产：本地 hooks、GitHub Actions、MCP 服务器、connector、集成
- 按状态分类每项资产：已配置、已认证、最近已验证、过期/损坏、完全缺失
- 识别重叠和冗余的自动化表面，按分组（本地运行时、CI/CD、外部系统、消息/通知等）
- 产出 keep/merge/cut/fix-next 的推荐行动计划
- 在修复前先提供只读审计，确保不盲目修改

## 用法

- `/ecc:automation-audit-ops` - 审计当前的所有自动化，产出操作建议

## 适用场景

- 想知道"我有哪些自动化在运行"
- 任务跨越 cron job、GitHub Actions、本地 hooks、MCP 等多个系统
- 想知道哪些是从其他 agent 系统移植来的，哪些还需要重建
- 工作空间积累了多种做同一件事的方式，需要统一

> 源文件：[SKILL.md](SKILL.md)
