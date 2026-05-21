# /ecc:security-scan

使用 AgentShield 扫描 Claude Code 配置文件中的安全漏洞和注入风险。

---

## 功能

- 扫描 CLAUDE.md：硬编码密钥、自动运行指令、prompt 注入模式
- 扫描 settings.json：过于宽松的权限、缺失 deny 列表、危险绕过标志
- 扫描 MCP 配置：高风险 MCP 服务器、硬编码密钥、npx 供应链风险
- 扫描 hooks：命令注入、数据外泄、静默错误压制
- 扫描 agents：无限制工具访问、prompt 注入面、缺失模型规范
- 支持终端/JSON/Markdown/HTML 多种输出格式，可自动修复、CI 集成

## 用法

- `/ecc:security-scan` - 设置新项目、修改配置、或定期安全检查时使用
- `npx ecc-agentshield scan` - 运行基础扫描
- `npx ecc-agentshield scan --fix` - 自动修复可修复的安全问题
- `npx ecc-agentshield scan --opus --stream` - 运行深度对抗性三代理分析

## 适用场景

- 设置新的 Claude Code 项目时
- 修改 .claude/settings.json、CLAUDE.md 或 MCP 配置后
- 提交配置更改之前
- 进入包含已有 Claude Code 配置的仓库时
- 定期安全卫生检查

> 源文件：[SKILL.md](SKILL.md)
