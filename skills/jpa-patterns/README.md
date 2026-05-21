# /ecc:jpa-patterns

Spring Boot 中 JPA/Hibernate 的实体设计、查询优化、事务管理和性能调优模式。

---

## 功能

- 实体设计规范（索引、审计、枚举映射）和关系建模（OneToMany、ManyToMany）
- N+1 查询预防（JOIN FETCH、DTO 投影、懒加载策略）
- 事务管理（@Transactional、readOnly 优化、传播策略）
- 分页、游标分页、批量操作（batch insert/update）
- 连接池调优（HikariCP）、二级缓存、Flyway 迁移

## 用法

- `/ecc:jpa-patterns` - 设计 JPA 实体、优化查询、配置事务和连接池

## 适用场景

- 设计 JPA 实体和数据库表映射
- 定义实体关系（OneToMany、ManyToOne、ManyToMany）
- 优化查询性能（N+1 预防、fetch 策略、投影）
- 配置事务、审计、软删除、连接池

> 源文件：[SKILL.md](SKILL.md)
