# /ecc:error-handling

跨 TypeScript、Python 和 Go 的健壮错误处理、重试与熔断器模式。

---

## 功能

- 类型化错误层次结构：TypeScript/JavaScript、Python 和 Go 三种语言的 AppError 基类与专用子类
- Result 模式：不抛异常的错误处理方式，适用于预期故障场景（解析、外部调用）
- API 错误处理：Next.js Express 风格的路由级错误拦截与标准化错误响应格式
- React Error Boundary：捕获渲染错误的边界组件，防止整页崩溃
- 指数退避重试：带抖动（jitter）的通用重试函数，可配置重试条件
- 用户友好错误消息：将内部错误码映射为可展示的用户文本

## 用法

- `/ecc:error-handling` - 在设计错误类型、添加重试逻辑、审查 API 错误处理或排查级联故障时激活

## 适用场景

- 为新模块设计错误类型层次和异常处理策略
- 为不可靠的外部依赖添加重试或熔断器逻辑
- 审查 API 端点的错误处理覆盖率
- 实现面向用户的错误消息和反馈
- 排查静默吞异常或级联故障问题

> 源文件：[SKILL.md](SKILL.md)
