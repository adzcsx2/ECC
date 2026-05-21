# /ecc:mysql-patterns

MySQL 和 MariaDB 生产级模式：Schema 设计、索引、查询优化、事务、复制和连接池管理。

---

## 功能

- Schema 设计默认值：BIGINT 主键、utf8mb4 字符集、DECIMAL 金额字段、软删除模式
- 复合索引设计原则：等值谓词在前，范围/排序列在后，使用 EXPLAIN 验证
- 查询模式：跨引擎兼容的 UPSERT、keyset 分页、JSON 生成列、全文搜索
- 事务与死锁防护：锁定行排序一致、短事务、SKIP LOCKED 队列模式
- 连接池配置：SQLAlchemy 和 mysql2 示例，回收时间低于 wait_timeout
- 安全加固：最小权限应用用户、TLS 强制、凭据分离

## 用法

- `/ecc:mysql-patterns` - 设计 MySQL/MariaDB 表结构、编写迁移、排查慢查询或配置生产数据库

## 适用场景

- 设计应用数据库表、索引和约束
- 审查即将在生产大表上执行的迁移
- 排查慢查询、锁等待、死锁或连接耗尽问题
- 配置连接池、读写分离、TLS 和慢查询日志

> 源文件：[SKILL.md](SKILL.md)
