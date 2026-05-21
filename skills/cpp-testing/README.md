# /ecc:cpp-testing

使用 GoogleTest/GoogleMock 和 CMake/CTest 的现代 C++ 测试工作流。

---

## 功能

- TDD 循环（红-绿-重构）：先写测试，最小实现，再清理优化
- 提供单元测试、夹具（Fixture）、Mock 的完整示例
- CMake/CTest 集成：`gtest_discover_tests()` 确保测试发现稳定
- 覆盖率配置（GCC/gcov/lcov 和 Clang/llvm-cov）和 Sanitizer 集成
- Fuzzing 和属性测试可选附录

## 用法

- `/ecc:cpp-testing` - 编写、修复或诊断 C++ 测试时获得测试模式指导

## 适用场景

- 编写新的 C++ 单元测试或集成测试
- 配置 CMake/CTest 测试工作流
- 排查测试失败或 flaky 行为
- 启用 AddressSanitizer / UBSan / TSan 进行内存和竞态检测

> 源文件：[SKILL.md](SKILL.md)
