# /ecc:dashboard-builder

构建面向运维人员的监控仪表盘（Grafana、SigNoz 等），以真实问题驱动设计。

---

## 功能

- 从运维问题出发（健康/延迟/吞吐/饱和度），而非从指标列表出发
- 按推荐结构组织面板：概览、性能、资源、服务特定
- Elasticsearch、Kafka、API 网关等常见场景的预定义面板集
- 质量检查清单：有效 JSON、明确分组、标题单位、阈值颜色、变量配置

## 用法

- `/ecc:dashboard-builder` - 将指标列表转化为实用运维仪表盘

## 适用场景

- 为 Kafka、Elasticsearch 或微服务创建监控仪表盘
- 将已有指标列表重构为能回答实际问题的运维面板
- 确保仪表盘包含有意义的阈值和状态颜色

> 源文件：[SKILL.md](SKILL.md)
