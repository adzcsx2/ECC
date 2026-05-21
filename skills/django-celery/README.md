# /ecc:django-celery

Django + Celery 异步任务模式，覆盖配置、重试、定时调度和测试。

---

## 功能

- 完整项目配置：Redis 代理、JSON 序列化、worker 预取、任务确认延迟
- 任务设计模式：可重试任务（指数退避+抖动）、幂等任务、软超时优雅处理
- Canvas 工作流编排：chain（顺序）、group（并行）、chord（并行+回调）
- 定时调度：celery beat 代码定义和数据库定义的两种方式
- 死信队列模式：最大重试后将失败任务持久化到数据库供人工审查
- 测试方案：单元测试（mock 服务）、集成测试（CELERY_TASK_ALWAYS_EAGER）、重试测试

## 用法

- `/ecc:django-celery` - 给 Django 应用添加后台任务或定时调度时获得模式指导

## 适用场景

- 将邮件发送、PDF 生成、API 调用等慢操作从请求周期中卸载
- 实现定期任务（清理会话、同步库存、周报摘要）
- 调试任务失败、重试或队列积压问题

> 源文件：[SKILL.md](SKILL.md)
