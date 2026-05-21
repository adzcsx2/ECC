# /ecc:swift-concurrency-6-2

Swift 6.2 易用并发：默认单线程、@concurrent 显式后台派发、孤立一致性。

---

## 功能

- 默认单线程运行消除隐式数据竞争
- @concurrent 显式标记后台 CPU 密集型工作
- 孤立一致性（Isolated Conformance）安全跨 actor 协议
- MainActor 默认推断模式减少样板代码
- Swift 5.x/6.0 -> 6.2 迁移指南

## 用法

- `/ecc:swift-concurrency-6-2` - Swift 6.2 并发模式参考

## 适用场景

- Swift 6.2 项目新建或从旧版迁移
- 解决数据竞争安全编译错误
- 设计 MainActor 为中心的应用架构

> 源文件：[SKILL.md](SKILL.md)
