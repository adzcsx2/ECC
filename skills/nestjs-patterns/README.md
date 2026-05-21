# /ecc:nestjs-patterns

NestJS 架构模式：模块组织、控制器、Provider、DTO 验证、守卫、拦截器、配置管理和测试。

---

## 功能

- 项目结构最佳实践：feature module 按域组织，cross-cutting 代码放 common/
- DTO 验证：`class-validator` + `ValidationPipe`（whitelist + forbidNonWhitelisted）
- 认证守卫与请求上下文：JWT 守卫、角色守卫、显式请求类型
- 全局异常过滤器：统一错误信封格式，区分预期客户端错误和未预期服务器错误
- 配置管理：启动时验证环境变量，通过 ConfigService 类型化访问
- 单元测试和 HTTP 请求级测试，复用全局 pipe/filter

## 用法

- `/ecc:nestjs-patterns` - 构建 NestJS API、添加守卫/拦截器/DTO 验证或编写测试

## 适用场景

- 构建模块化 TypeScript 后端服务
- 添加传入请求验证、认证守卫、异常过滤器和日志拦截器
- 配置多环境设置（dev/staging/prod）和数据库集成
- 隔离事务工作流到 Service 层，避免 Controller 直接协调多步写入

> 源文件：[SKILL.md](SKILL.md)
