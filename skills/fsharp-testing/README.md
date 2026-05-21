# /ecc:fsharp-testing

F# 测试模式：xUnit、FsUnit、Unquote、FsCheck 属性测试与集成测试最佳实践。

---

## 功能

- xUnit + FsUnit 单元测试：符合 F# 习惯的断言语法（`should equal`、`should be`）
- Unquote 诊断断言：利用 F# Quotations 输出完整表达式而非简单的 "expected X got Y"
- FsCheck 属性基测试：用随机生成的数据验证函数不变量，支持自定义生成器
- 函数桩优于框架 Mock：用记录字段替换依赖，比 NSubstitute 更 F# 原生
- ASP.NET Core 集成测试：WebApplicationFactory + InMemoryDatabase 端到端测试
- 测试组织：Unit/Integration/Properties/Helpers 四层目录结构

## 用法

- `/ecc:fsharp-testing` - 在编写 F# 测试、审查测试质量、搭建 F# 测试基础设施时激活

## 适用场景

- 为新 F# 代码编写单元测试
- 审查测试质量和覆盖率是否达标
- 搭建 F# 项目的测试基础设施
- 调试不稳定或运行缓慢的测试
- 用属性基测试发现边界条件 bug

> 源文件：[SKILL.md](SKILL.md)
