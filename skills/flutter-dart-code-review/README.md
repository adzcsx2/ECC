# /ecc:flutter-dart-code-review

Flutter/Dart 全面代码审查清单：组件最佳实践、状态管理、性能、无障碍与安全。

---

## 功能

- Widget 最佳实践：组件拆分、const 使用、Key 策略、主题系统与 build 方法约束
- 状态管理通用原则：BLoC、Riverpod、Provider、GetX、MobX、Signals 全覆盖，不偏好单一方案
- 不可变状态 + 密封类型消除不可能状态 vs 响应式突变两种范式的各自审查要点
- 性能检查：避免不必要的重建、RepaintBoundary 使用、图片缓存与懒加载
- 全面安全审查：安全存储、API 密钥管理、输入验证、HTTPS 强制与证书固定
- Dart 语言陷阱：隐式 dynamic、late 滥用、print() 生产代码、字符串拼接等 16 项语言级检查
- 无障碍与国际化：语义组件、屏幕阅读器、对比度、RTL 支持、本地化检查清单

## 用法

- `/ecc:flutter-dart-code-review` - 在审查 Flutter/Dart 代码时激活，不绑定特定状态管理方案

## 适用场景

- 审查 Flutter 项目的代码质量
- 检查 Widget 树的性能与重建优化
- 验证状态管理方案的实现正确性
- 确保无障碍性和国际化覆盖
- 审计安全存储和 API 密钥处理

> 源文件：[SKILL.md](SKILL.md)
