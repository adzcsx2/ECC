# /ecc:dart-flutter-patterns

Dart/Flutter 生产级模式大全，覆盖空安全、不可变状态、状态管理、导航、网络和测试。

---

## 功能

- 空安全最佳实践：避免 bang 操作符，优先使用模式匹配和 `?.`/`??`
- 不可变状态模式：sealed class + freezed 代码生成 + copyWith
- 状态管理覆盖：BLoC/Cubit、Riverpod（Notifier + Derived Provider）
- GoRouter 导航与响应式认证守卫（refreshListenable）
- Dio HTTP 客户端：拦截器、token 刷新（一次性重试守卫）、错误处理

## 用法

- `/ecc:dart-flutter-patterns` - 编写 Flutter 代码时，获取常用模式的即用代码模板

## 适用场景

- 开始新的 Flutter 功能，需要状态管理、导航或数据访问的惯用模式
- 审查 Dart 代码或选择 BLoC/Riverpod/Provider 框架
- 实现安全 HTTP 客户端或 WebView 集成

> 源文件：[SKILL.md](SKILL.md)
