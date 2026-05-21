# /ecc:rust-testing

Rust 测试完整指南：单元测试、集成测试、异步测试、属性测试与代码覆盖率。

---

## 功能

- TDD 工作流：RED-GREEN-REFACTOR 循环在 Rust 中的标准化实施
- 单元测试：使用 #[cfg(test)] 模块组织测试，涵盖断言宏和错误/panic 测试
- 集成测试：tests/ 目录下的端到端测试，支持共享测试工具模块
- 异步测试：使用 #[tokio::test] 测试 async 函数，处理超时场景
- 属性测试（proptest）：自动生成大量随机输入验证不变量
- 模拟（mockall）：trait 级别 mock 实现依赖隔离
- 覆盖率：cargo-llvm-cov 测量代码覆盖率，目标 80%+

## 用法

- `/ecc:rust-testing` - 编写 Rust 测试时激活，遵循 TDD 方法论

## 适用场景

- 为新 Rust 函数、方法、trait 编写测试
- 为现有代码补充测试覆盖率
- 为性能关键代码编写 benchmark
- 为输入验证实现属性测试
- 在 Rust 项目中遵循 TDD 工作流

> 源文件：[SKILL.md](SKILL.md)
