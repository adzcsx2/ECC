# /ecc:compose-multiplatform-patterns

Compose Multiplatform 和 Jetpack Compose 跨平台 UI 构建模式。

---

## 功能

- 状态管理：ViewModel + 单一 StateFlow 数据类、事件槽（Event Sink）模式
- 类型安全导航：Compose Navigation 2.8+ 的可序列化路由定义
- Composable 设计：插槽 API、Modifier 顺序规则
- KMP 平台适配：expect/actual 模式处理平台特定 UI
- 性能优化：@Stable/@Immutable 标记、LazyColumn key 使用、derivedStateOf 延迟读取

## 用法

- `/ecc:compose-multiplatform-patterns` - 获取 Compose 跨平台 UI 开发的状态管理、导航和性能优化指导

## 适用场景

- 构建 Compose Multiplatform 或 Jetpack Compose UI 时
- 管理 ViewModel 和 Compose 状态时
- 在 KMP 项目中实现跨平台导航
- 优化重组和渲染性能

> 源文件：[SKILL.md](SKILL.md)
