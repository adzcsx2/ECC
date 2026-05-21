# /ecc:fastapi-patterns

FastAPI 异步 API、依赖注入、Pydantic 模型、OpenAPI 文档与生产就绪最佳实践。

---

## 功能

- 应用工厂模式：`create_app()` 集中管理中间件、异常处理器与路由注册
- Pydantic 模式分离：Request/Update/Response schema 各司其职，敏感字段不出现在响应中
- 依赖注入链：数据库会话、用户认证、分页等通过 `Depends` 注入，避免在路由中内联创建
- 异步端点：使用 async DB 驱动和 `httpx.AsyncClient`，避免在 async 路由中调用同步库
- 集中式异常处理：`ApiError` 异常层次 + `register_exception_handlers` 统一响应格式
- 测试模式：通过 `dependency_overrides` 替换依赖，使用 `ASGITransport` + `AsyncClient` 集成测试

## 用法

- `/ecc:fastapi-patterns` - 在构建或审查 FastAPI 应用、拆分路由与依赖、编写异步端点时激活

## 适用场景

- 构建新的 FastAPI 服务
- 审查 FastAPI PR 中的架构规范性和生产风险
- 拆分路由、schema、依赖和数据访问层
- 添加认证、授权和 OpenAPI 文档自定义
- 编写 FastAPI 集成测试和依赖覆盖

> 源文件：[SKILL.md](SKILL.md)
