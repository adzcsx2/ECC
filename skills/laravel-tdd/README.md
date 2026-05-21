# /ecc:laravel-tdd

Laravel 测试驱动开发：PHPUnit/Pest、Factory、数据库测试、Fakes 和 80% 覆盖率目标。

---

## 功能

- Red-Green-Refactor TDD 循环，支持 PHPUnit 和 Pest 两种框架
- 三层测试策略（Unit、Feature、Integration）
- 数据库测试（RefreshDatabase、DatabaseTransactions、assertDatabaseHas）
- 全面的 Fake 支持（Bus、Queue、Mail、Notification、Event、Http）
- Sanctum 认证测试、策略授权测试、Inertia 测试
- 80%+ 覆盖率目标和 CI 集成

## 用法

- `/ecc:laravel-tdd` - 遵循 TDD 方法测试 Laravel 模型、端点、策略和任务

## 适用场景

- 开发 Laravel 新功能或 API 端点
- Bug 修复和重构（先写测试）
- 测试 Eloquent 模型、策略、任务和通知
- 配置测试覆盖率报告

> 源文件：[SKILL.md](SKILL.md)
