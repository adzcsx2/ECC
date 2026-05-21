# /ecc:django-security

Django 安全最佳实践，覆盖认证、授权、CSRF、XSS、SQL 注入防护和生产安全配置。

---

## 功能

- 生产安全配置：DEBUG=False、HTTPS 强制、HSTS、安全 Cookie、CSP 头部
- 认证体系：自定义 User 模型（邮箱登录）、Argon2 密码散列、会话管理
- 授权控制：Django 权限系统、DRF 自定义 Permission、RBAC 角色模型
- 注入防护：ORM 自动转义防 SQL 注入、模板自动转义防 XSS、文件上传验证
- API 安全：限流（匿名/用户/突发/持续）、Token/JWT/Session 多种认证方式
- 安全配置快速检查清单

## 用法

- `/ecc:django-security` - 配置 Django 安全设置或审查应用安全问题时获得指导

## 适用场景

- 设置 Django 认证和授权系统
- 配置生产环境安全设置
- 审查 Django 应用安全性
- 部署 Django 应用到生产环境

> 源文件：[SKILL.md](SKILL.md)
