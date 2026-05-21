# /ecc:dotnet-patterns

C# 与 .NET 惯用模式、依赖注入、async/await 与生产级应用最佳实践。

---

## 功能

- 提供不可变数据模型（records、init-only 属性）与显式空值检查模式
- 依赖注入接口抽象 + 仓储模式与 EF Core 集成代码模板
- 正确的 async/await 使用模式（CancellationToken 传递、并行异步操作、避免阻塞异步）
- Options Pattern 强类型配置绑定、Result Pattern 显式成功/失败返回
- Minimal API 路由分组、自定义中间件管道、防护子句提前返回模式
- 常见反模式警示表：`async void`、`.Result` 阻塞、`catch` 空吞异常等

## 用法

- `/ecc:dotnet-patterns` - 在编写或审查 C# 代码、设计 ASP.NET Core 服务架构、重构 .NET 应用时激活

## 适用场景

- 编写新的 C# 类库或服务代码
- 审查 .NET 项目的代码规范性与健壮性
- 重构现有 .NET 应用到惯用模式
- 设计 ASP.NET Core 的依赖注入与中间件架构

> 源文件：[SKILL.md](SKILL.md)
