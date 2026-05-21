# /ecc:postgres-patterns

PostgreSQL 数据库模式速查，涵盖查询优化、索引设计、数据类型选择和安全配置。

---

## 功能

- 索引类型选择指南（B-tree、GIN、BRIN、覆盖索引、部分索引）
- 数据类型最佳实践（bigint、text、timestamptz、numeric 等）
- 常用 SQL 模式：UPSERT、游标分页、队列处理、RLS 策略
- 反模式检测查询（未索引外键、慢查询、表膨胀）
- 连接池、超时和监控配置模板

## 用法

- `/ecc:postgres-patterns` - 在编写 SQL 查询、设计数据库 schema 或排查慢查询时参考
- 搭配 `database-reviewer` 代理进行完整数据库审查

## 适用场景

- 编写 SQL 查询或数据库迁移
- 设计数据库 schema
- 排查慢查询问题
- 实施行级安全策略（RLS）
- 设置连接池和数据库配置

> 源文件：[SKILL.md](SKILL.md)
