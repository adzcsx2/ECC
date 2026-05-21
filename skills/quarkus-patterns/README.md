# /ecc:quarkus-patterns

Quarkus 3.x LTS 架构模式速查，涵盖 REST API、CDI 服务、Panache 数据访问、Apache Camel 消息路由和异步处理。

---

## 功能

- 服务层模式：构造器注入、事件服务、事务管理
- Apache Camel 集成：直接路由、RabbitMQ 消息发布、文件处理、Bean 调用
- REST API 结构：JAX-RS、DTO 验证、异常映射、分页
- Panache Repository 模式：Active Record 和 Repository 风格
- 异步操作：CompletableFuture、LogContext 传播
- YAML 配置：多环境 profile、缓存、健康检查
- 最佳实践：架构分层、事件驱动、日志、配置、事务

## 用法

- `/ecc:quarkus-patterns` - 构建 Quarkus REST API、实现事件驱动架构或配置 Camel 路由时参考

## 适用场景

- 使用 JAX-RS 构建 REST API
- 结构化 resource -> service -> repository 分层
- 使用 Apache Camel 实现事件驱动模式
- 配置 Hibernate Panache、缓存或响应式流
- 使用 CompletableFuture 进行异步操作
- 配置 dev/staging/production 多环境 profile

> 源文件：[SKILL.md](SKILL.md)
