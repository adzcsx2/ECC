# /ecc:kotlin-testing

Kotlin 测试完整模式：Kotest、MockK、协程测试、属性测试和 Kover 覆盖率。

---

## 功能

- Kotest 四种测试风格（StringSpec、FunSpec、BehaviorSpec、DescribeSpec）
- MockK 模拟（协程支持 coEvery/coVerify、参数捕获、spy）
- 协程测试（runTest、TestDispatcher、advanceTimeBy、Flow 测试）
- 属性测试（forAll、checkAll、自定义生成器 Arb）
- Kover 代码覆盖率配置和 CI 集成

## 用法

- `/ecc:kotlin-testing` - 使用 Kotest + MockK 编写 Kotlin 测试，遵循 TDD 工作流

## 适用场景

- 为 Kotlin 函数或类编写测试
- 为已有代码补充测试覆盖
- 实现属性测试
- 在 Kotlin 项目中使用 TDD
- 配置 Kover 覆盖率

> 源文件：[SKILL.md](SKILL.md)
