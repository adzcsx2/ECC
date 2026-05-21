# /ecc:quarkus-tdd

Quarkus 3.x TDD 测试驱动开发指南，覆盖 JUnit 5、Mockito、REST Assured、Camel 路由测试和 JaCoCo 覆盖率。

---

## 功能

- TDD 工作流：红-绿-重构，80%+ 覆盖率
- @Nested 类组织：按方法分组测试，@DisplayName 可读描述
- AAA 模式（Arrange-Act-Assert）：given_when_then 命名约定
- Camel 路由测试：AdviceWith + MockEndpoint 模式
- 事件服务测试：success/error 路径、null 输入、空白消息
- CompletableFuture 测试：同步执行模式、异常传播、LogContext 验证
- REST Assured 资源层测试：201/400 状态码、Location 头
- 集成测试：@QuarkusTest + 真实数据库
- JaCoCo 配置：80% 行覆盖、70% 分支覆盖

## 用法

- `/ecc:quarkus-tdd` - 添加功能、修复 bug 或重构事件驱动服务时遵循 TDD 流程

## 适用场景

- 新功能或 REST 端点开发
- Bug 修复或重构
- 测试 Apache Camel 路由和事件处理器
- 测试 CompletableFuture 异步操作
- 验证 LogContext 传播

> 源文件：[SKILL.md](SKILL.md)
