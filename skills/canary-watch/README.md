# /ecc:canary-watch

部署后持续监控 URL 的健康状况、性能指标和回归问题。

---

## 功能

- 多维度监控：HTTP 状态、控制台错误、网络失败、性能回归、内容完整性
- 扩展检查：静态资源、SSE 流端点连接与心跳检测
- 三种监控模式：快速检查、持续监控、staging vs 生产对比
- 三级告警阈值（critical/warning/info），支持桌面通知和 Webhook
- 自动记录到 `~/.claude/canary-watch.log`

## 用法

- `/ecc:canary-watch <URL>` - 快速单次检查
- `/ecc:canary-watch <URL> --interval 5m --duration 2h` - 持续监控
- `/ecc:canary-watch --compare <staging> <production>` - 环境对比

## 适用场景

- 部署到生产或 staging 环境后
- 合并高风险 PR 后验证
- 依赖升级后的回归检测
- 发布窗口期间的持续监控

> 源文件：[SKILL.md](SKILL.md)
