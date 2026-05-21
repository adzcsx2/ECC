# /ecc:database-migrations

数据库迁移最佳实践，覆盖 PostgreSQL、MySQL 及常见 ORM 的安全零停机变更。

---

## 功能

- 核心原则：每次变更都是迁移，生产环境只进不退，Schema 与数据迁移分离
- PostgreSQL 安全模式：CONCURRENTLY 建索引、expand-contract 重命名列、批量数据更新
- ORM 工具指南：Prisma、Drizzle、Kysely、Django ORM、golang-migrate 的工作流
- 零停机策略：三阶段 expand-contract 模式，逐步上线避免锁表
- 安全检查清单：NOT NULL 必须有默认值、不混合 DDL 和 DML、测试生产量级数据

## 用法

- `/ecc:database-migrations` - 创建或修改数据库表结构时获得安全迁移模式

## 适用场景

- 创建或修改数据库表、添加/删除列或索引
- 执行数据迁移（回填、转换）
- 计划零停机 Schema 变更

> 源文件：[SKILL.md](SKILL.md)
