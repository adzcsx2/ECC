# /ecc:redis-patterns

Redis 数据结构和生产模式速查，涵盖缓存策略、分布式锁、速率限制、Pub/Sub、Streams 和连接管理。

---

## 功能

- 缓存模式：Cache-Aside（延迟加载）、Write-Through、标签式缓存失效
- 速率限制：固定窗口和滑动窗口（Lua 原子操作）
- 分布式锁：SET NX PX 单节点 + Redlock 多节点
- Pub/Sub（即发即忘）vs Streams（持久队列 + 消费者组）
- 键命名规范和 TTL 策略
- 连接管理：连接池、集群模式、Sentinel 高可用
- 淘汰策略选择和反模式（KEYS *、大 blob、无 TTL）
- 缓存击穿防护：锁机制防止惊群效应

## 用法

- `/ecc:redis-patterns` - 添加缓存、实施速率限制或构建分布式协调时参考

## 适用场景

- 为应用添加缓存层
- 实施 API 速率限制
- 构建分布式锁或协调机制
- 设置会话或令牌存储
- 使用 Pub/Sub 或 Streams 进行消息传递
- 生产环境中配置 Redis 连接池、淘汰策略

> 源文件：[SKILL.md](SKILL.md)
