# /ecc:django-patterns

Django 架构模式、DRF API 设计、ORM 最佳实践和缓存策略。

---

## 功能

- 项目结构：拆分 settings（base/dev/prod/test）、apps 按功能组织
- 模型设计：自定义 User 模型、自定义 QuerySet、Manager 方法、数据库索引和约束
- DRF 模式：Serializer 验证、ViewSet + action、权限类和自定义过滤
- 服务层模式：将业务逻辑从 View 中分离到独立的 Service 类
- 缓存策略：视图级缓存、模板片段缓存、低级缓存、QuerySet 缓存
- 信号和中间件：post_save 自动创建 Profile、请求日志中间件

## 用法

- `/ecc:django-patterns` - 构建 Django 应用或设计 DRF API 时获得架构模式参考

## 适用场景

- 构建 Django Web 应用或 REST API
- 设计 Django ORM 模型和查询优化
- 设置 Django 项目结构和分环境配置

> 源文件：[SKILL.md](SKILL.md)
