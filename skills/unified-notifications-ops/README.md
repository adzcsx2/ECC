# /ecc:unified-notifications-ops

统一通知运维：将分散事件整合为一条带严重级别和行动路径的通道。

---

## 功能

- 通知来源盘点：GitHub、Linear、本地 hooks、桌面、邮件/聊天
- 严重级别模型：Critical/High/Medium/Low 四级分类
- 事件管道：Capture -> Classify -> Route -> Collapse -> Attach Action
- 去重策略：合并重复通道，保留一个规范摘要
- ECC 原生方案：skill/hook/agent/MCP 决定通知走向

## 用法

- `/ecc:unified-notifications-ops` - 统一通知通道设计与实现

## 适用场景

- CI 失败通知碎片化需要统一管理
- 多平台事件需要单一运维视图
- 减少噪音：将通知从"打断"优化为"行动提示"

> 源文件：[SKILL.md](SKILL.md)
