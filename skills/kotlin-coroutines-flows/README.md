# /ecc:kotlin-coroutines-flows

Kotlin 协程和 Flow 的 Android/KMP 模式：结构化并发、响应式数据流、错误处理与测试。

---

## 功能

- 结构化并发（coroutineScope、supervisorScope、并行分解）
- Flow 响应式模式（冷流、StateFlow、SharedFlow、combine）
- 流操作符使用（debounce、retryWhen、flatMapLatest）
- Dispatchers 正确使用和 KMP 平台兼容
- 协程取消和 cleanup（ensureActive、NonCancellable）
- Turbine + TestDispatcher 测试协程和 Flow

## 用法

- `/ecc:kotlin-coroutines-flows` - 编写 Kotlin 异步代码、使用 Flow 构建响应式数据流

## 适用场景

- 使用 Kotlin 协程编写异步代码
- 使用 Flow、StateFlow、SharedFlow 处理响应式数据
- 处理并发操作（并行加载、防抖、重试）
- 测试协程和 Flow

> 源文件：[SKILL.md](SKILL.md)
