# /ecc:swift-protocol-di-testing

协议驱动的依赖注入实现可测试的 Swift 代码。

---

## 功能

- 小粒度协议抽象文件系统、网络等外部依赖
- 默认参数注入：生产用真实现，测试注入 Mock
- Mock 实现支持可配置错误属性测试失败路径
- 与 Swift Testing 框架无缝集成
- Sendable 一致性确保跨 Actor 边界安全

## 用法

- `/ecc:swift-protocol-di-testing` - 协议注入测试模式指南

## 适用场景

- 编写需要文件/网络/API 访问的 Swift 代码
- 测试难以在真实环境触发的错误路径
- 构建跨 App/Test/SwiftUI Preview 运行的模块

> 源文件：[SKILL.md](SKILL.md)
