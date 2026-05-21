# /ecc:perl-security

Perl 安全全指南：污点模式、SQL 注入防护、Web 安全与进程安全。

---

## 功能

- 污点模式（-T）与安全解污模式
- 安全文件操作：三参数 open、路径穿越防护
- SQL 注入防护：DBI 占位符、列名白名单
- Web 安全：XSS 编码、CSRF 令牌、安全响应头
- perlcritic 安全策略配置与 CI 集成

## 用法

- `/ecc:perl-security` - Perl 安全编码与审查指南

## 适用场景

- 构建 Perl Web 应用（Mojolicious、Dancer2、Catalyst）
- 审查 Perl 代码安全漏洞
- 配置 CI 安全扫描流水线

> 源文件：[SKILL.md](SKILL.md)
