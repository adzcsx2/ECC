# /ecc:swift-actor-persistence

使用 Swift Actor 构建线程安全的数据持久化层。

---

## 功能

- Actor 模式消除数据竞争（编译器强制保证）
- 内存缓存 + 文件持久化双存储
- 泛型设计适配任意 Codable & Identifiable 模型
- 与 @Observable ViewModel 无缝结合
- 原子文件写入防止崩溃数据损坏

## 用法

- `/ecc:swift-actor-persistence` - Swift Actor 数据持久化模式

## 适用场景

- iOS/macOS 应用本地数据存储
- 离线优先架构的本地缓存层
- 替换传统 DispatchQueue 的线程安全方案

> 源文件：[SKILL.md](SKILL.md)
