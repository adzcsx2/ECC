# /ecc:rust-patterns

惯用 Rust 编程模式：所有权、错误处理、trait、并发等最佳实践。

---

## 功能

- 所有权与借用规则：避免不必要的 clone，使用 Cow 实现灵活所有权
- 错误处理：使用 Result 和 ? 传播错误，库用 thiserror、应用用 anyhow
- 枚举与模式匹配：用枚举建模状态，避免 catch-all 隐藏新变体
- trait 与泛型：接受泛型输入、返回具体类型，使用 newtype 增强类型安全
- 并发编程：Arc<Mutex<T>>、channels、async/await（Tokio）的正确用法

## 用法

- `/ecc:rust-patterns` - 编写、审查或重构 Rust 代码时激活，涵盖的 six 大核心领域

## 适用场景

- 编写新的 Rust 代码或 crate
- 审查 Rust 代码的惯用性和安全性
- 设计 crate 结构和模块组织
- 重构不符合惯用写法的 Rust 代码

> 源文件：[SKILL.md](SKILL.md)
