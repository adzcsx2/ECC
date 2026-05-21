# /ecc:kotlin-patterns

惯用 Kotlin 模式与最佳实践：空安全、不可变性、密封类、协程、DSL 构建器和委托。

---

## 功能

- 空安全最佳实践（安全调用 ?.、Elvis ?:、禁止 !! 强制解包）
- 不可变性优先（val > var、data class + copy()）
- 密封类/接口的穷举类型层次（Result、ApiError）
- 结构化并发（coroutineScope、async/await、Flow）
- 类型安全 DSL 构建器（@DslMarker、lambda receiver）
- Gradle Kotlin DSL 构建配置模板

## 用法

- `/ecc:kotlin-patterns` - 编写、审查或重构 Kotlin 代码时应用惯用模式

## 适用场景

- 编写新的 Kotlin 代码
- 审查 Kotlin 代码质量
- 重构现有 Kotlin 代码
- 设计 Kotlin 模块或库

> 源文件：[SKILL.md](SKILL.md)
