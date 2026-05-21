# /ecc:python-testing

Python 测试策略速查，涵盖 pytest、TDD、fixture、mock、参数化测试和覆盖率要求。

---

## 功能

- TDD 红绿重构循环和 80% 覆盖率要求
- pytest fixture 使用：作用域、参数化、setup/teardown、autouse、conftest.py
- 参数化测试：多组输入、IDs 标记、fixture 参数化
- Mock 和 patch：函数 mock、属性 mock、异常 mock、autospec
- 异步测试：pytest-asyncio、async fixture、async mock
- 测试组织：目录结构、测试类、最佳实践清单

## 用法

- `/ecc:python-testing` - 编写 Python 测试、设计测试套件或审查覆盖率时参考
- 遵循 TDD 工作流：先写失败测试 -> 实现 -> 重构

## 适用场景

- 编写新 Python 代码时遵循 TDD
- 设计 Python 项目的测试套件
- 审查 Python 测试覆盖率
- 搭建测试基础设施

> 源文件：[SKILL.md](SKILL.md)
