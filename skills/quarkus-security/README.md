# /ecc:quarkus-security

Quarkus 安全最佳实践速查，涵盖认证授权、JWT/OIDC、RBAC、输入验证、CSRF、密钥管理和依赖安全。

---

## 功能

- 认证：JWT 认证、OIDC 集成、自定义认证过滤器
- 授权：`@RolesAllowed` 声明式 RBAC、SecurityIdentity 编程式检查
- 输入验证：Bean Validation、自定义验证器
- SQL 注入防护：Panache 参数化查询、禁止字符串拼接
- 密码哈希：BCrypt 加密和验证
- CORS 和安全头配置（X-Frame-Options、CSP、HSTS）
- 速率限制：使用真实远程地址（不使用 X-Forwarded-For）
- 密钥管理：环境变量、Vault 集成
- 审计日志和依赖 CVE 扫描

## 用法

- `/ecc:quarkus-security` - 添加认证、实施授权、验证输入或扫描依赖漏洞时参考

## 适用场景

- 添加 JWT 或 OIDC 认证
- 使用 @RolesAllowed 或 SecurityIdentity 实施授权
- 验证用户输入
- 配置 CORS 或安全头
- 管理密钥和扫描依赖漏洞

> 源文件：[SKILL.md](SKILL.md)
