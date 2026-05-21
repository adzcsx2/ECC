# /ecc:prisma-patterns

Prisma ORM 最佳实践和常见陷阱速查，涵盖 schema 设计、查询优化、事务、分页和无服务器部署。

---

## 功能

- ID 策略选择（cuid、uuid、autoincrement）和 schema 默认值设置
- `include` 与 `select` 的使用场景对比及 N+1 问题避免
- 事务类型选择：数组形式 vs 交互式事务
- 游标分页、软删除、错误处理和 DTO 映射模式
- 关键陷阱提醒：`updateMany` 只返回 count、`migrate dev` 可能重置数据库、`@updatedAt` 在批量写入时失效、无服务器连接池配置

## 用法

- `/ecc:prisma-patterns` - 设计 Prisma schema、编写查询或部署到无服务器环境时参考
- 搭配 `database-reviewer` 代理进行数据库审查

## 适用场景

- 设计或修改 Prisma schema 模型和关系
- 编写查询、事务或分页逻辑
- 使用 `updateMany`/`deleteMany` 等批量操作
- 部署到无服务器环境（Vercel、Lambda、Cloudflare Workers）
- 实施软删除或多租户行过滤

> 源文件：[SKILL.md](SKILL.md)
