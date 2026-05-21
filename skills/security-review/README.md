# /ecc:security-review

全面的安全审查清单：密钥管理、输入验证、SQL 注入、XSS、CSRF 等。

---

## 功能

- 密钥管理：禁止硬编码、强制环境变量、验证启动时密钥存在性
- 输入验证：使用 Zod schema 验证用户输入，文件上传限制大小/类型/扩展名
- SQL 注入防护：参数化查询，禁止字符串拼接 SQL
- 认证与授权：httpOnly cookie 存储 token，RLS 行级安全，角色访问控制
- XSS 防护：DOMPurify 净化 HTML，CSP 头配置
- CSRF 保护、速率限制、敏感数据保护、依赖安全检查
- 包含 Solana 区块链安全的钱包验证和交易验证

## 用法

- `/ecc:security-review` - 实现认证、处理用户输入、创建 API 端点时激活

## 适用场景

- 实现认证或授权功能时
- 处理用户输入或文件上传时
- 创建新的 API 端点
- 处理密钥或凭据
- 实现支付或敏感功能
- 生产部署前的安全检查

> 源文件：[SKILL.md](SKILL.md)
