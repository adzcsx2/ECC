# /ecc:kotlin-ktor-patterns

Ktor HTTP 服务器完整模式：路由 DSL、插件、认证、Koin DI、序列化、WebSockets 和测试。

---

## 功能

- 标准 Ktor 项目结构和应用入口配置
- 路由 DSL（含认证路由分组）和内容协商（kotlinx.serialization）
- JWT 认证、StatusPages 错误处理和 CORS 配置
- Koin 依赖注入集成（含测试场景的 test module）
- WebSocket 支持（聊天、广播模式）
- testApplication 集成测试（含认证路由测试）

## 用法

- `/ecc:kotlin-ktor-patterns` - 构建 Ktor 服务器、配置路由和插件、编写集成测试

## 适用场景

- 构建 Ktor HTTP 服务器
- 配置 Ktor 插件（Auth、CORS、ContentNegotiation、StatusPages）
- 实现 REST API
- 使用 Koin 设置依赖注入
- 编写 Ktor 集成测试

> 源文件：[SKILL.md](SKILL.md)
