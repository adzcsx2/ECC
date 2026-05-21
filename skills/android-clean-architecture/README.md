# /ecc:android-clean-architecture

Android 和 KMP 项目的 Clean Architecture 模式指南。

---

## 功能

- 定义模块结构（app、core、domain、data、presentation、design-system）及其依赖规则
- 实现 UseCase 模式：每个业务操作一个 UseCase，使用 `operator fun invoke`
- 设计 Repository 和 DataSource 层次，遵循依赖反转原则
- 数据层设计支持 Room、SQLDelight、Ktor
- 使用 Koin 或 Hilt 进行依赖注入

## 用法

- `/ecc:android-clean-architecture` - 为 Android 或 KMP 项目应用 Clean Architecture 模式

## 适用场景

- 构建 Android 或 KMP 项目的模块结构
- 实现 UseCase、Repository 或 DataSource
- 设计领域层、数据层和展示层之间的数据流
- 在分层架构中使用 Room、SQLDelight 或 Ktor

> 源文件：[SKILL.md](SKILL.md)
