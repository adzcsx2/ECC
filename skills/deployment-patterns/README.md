# /ecc:deployment-patterns

生产部署工作流与 CI/CD 最佳实践，覆盖 Docker、健康检查和回滚策略。

---

## 功能

- 三种部署策略：滚动部署（默认）、蓝绿部署、金丝雀部署的选择对比
- 多语言多阶段 Dockerfile：Node.js、Go、Python/Django 的生产镜像模板
- CI/CD 流水线：GitHub Actions 标准流程（test -> build -> deploy）
- 健康检查：简单端点、详细检查、Kubernetes liveness/readiness/startup 探针
- 环境配置：十二要素应用模式 + Zod schema 启动时验证
- 生产就绪检查清单：应用、基础设施、监控、安全、运维 5 维度逐项核对

## 用法

- `/ecc:deployment-patterns` - 设置 CI/CD 流水线或准备生产发布时获得最佳实践指导

## 适用场景

- Docker 化应用或设计部署策略
- 实现健康检查和就绪探针
- 准备生产发布前的全量检查

> 源文件：[SKILL.md](SKILL.md)
