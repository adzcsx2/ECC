# /ecc:kotlin-exposed-patterns

JetBrains Exposed ORM 完整模式：DSL 查询、DAO、事务、HikariCP 连接池和 Flyway 迁移。

---

## 功能

- DSL 风格和 DAO 风格两种查询方式，覆盖 CRUD、Join、聚合、分页
- 协程安全的事务管理（newSuspendedTransaction）
- HikariCP 连接池配置和 Flyway 数据库迁移
- JSONB 列支持（kotlinx.serialization 集成）
- Repository 模式封装，便于测试替换
- 使用 H2 内存数据库的完整测试方案

## 用法

- `/ecc:kotlin-exposed-patterns` - 设置 Exposed ORM 数据库访问、编写查询和配置连接池

## 适用场景

- 使用 Exposed ORM 设置数据库访问层
- 编写 SQL 查询（DSL 或 DAO 风格）
- 配置 HikariCP 连接池和 Flyway 迁移
- 实现 Repository 模式并编写测试

> 源文件：[SKILL.md](SKILL.md)
