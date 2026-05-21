# /ecc:django-tdd

Django TDD 测试策略，使用 pytest-django、factory_boy 和覆盖率工具驱动开发。

---

## 功能

- pytest 配置：`--reuse-db`、`--nomigrations`、测试标记（slow/integration）
- Factory Boy：UserFactory、ProductFactory 等可组合工厂，支持 SubFactory 和 post_generation
- 模型测试：创建、验证、自定义 Manager 方法、边界条件
- DRF API 测试：Serializer 序列化/反序列化/验证、API ViewSet CRUD、过滤和搜索
- Mock 外部服务：Stripe 支付、邮件发送，使用 `unittest.mock.patch` 和 `mail.outbox`
- 集成测试：完整用户流程（注册 -> 登录 -> 浏览 -> 加购 -> 结账）
- 各组件覆盖率目标：Models 90%+、Serializers 85%+、Views 80%+

## 用法

- `/ecc:django-tdd` - 编写 Django 测试或实现 DRF API 时获得 TDD 模式指导

## 适用场景

- 编写新的 Django 应用或 DRF API
- 测试 Django 模型、视图和序列化器
- 为 Django 项目搭建测试基础设施

> 源文件：[SKILL.md](SKILL.md)
