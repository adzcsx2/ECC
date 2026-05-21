# /ecc:springboot-security

Spring Security 安全最佳实践：认证、授权、CSRF、密钥管理、请求头、速率限制。

---

## 功能

- 认证：JWT 无状态认证，Bearer token 验证，httpOnly cookie 管理
- 授权：@EnableMethodSecurity + @PreAuthorize 方法级权限控制
- 输入验证：Bean Validation + @Valid，DTO 约束注解
- SQL 注入防护：参数化查询，禁止字符串拼接
- 密码编码：BCrypt 哈希，PasswordEncoder bean
- CSRF 保护：API 模式禁用 CSRF + 无状态会话，浏览器模式保留 CSRF
- 密钥管理：环境变量占位符，Spring Cloud Vault 集成
- 安全头配置：CSP、X-Frame-Options、Referrer-Policy
- CORS 配置、速率限制、依赖安全检查、日志脱敏

## 用法

- `/ecc:springboot-security` - 添加认证、处理输入、创建端点或管理密钥时使用

## 适用场景

- 添加 JWT、OAuth2 或 session 认证
- 实现基于角色的方法级授权
- 配置 CORS、CSRF 或安全响应头
- 通过 Vault 或环境变量管理密钥
- 发布前的安全检查清单复核

> 源文件：[SKILL.md](SKILL.md)
