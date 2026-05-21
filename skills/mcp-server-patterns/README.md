# /ecc:mcp-server-patterns

使用 Node/TypeScript SDK 构建 MCP 服务器，支持 tools、resources、prompts、Zod 验证及 stdio 与 HTTP 传输。

---

## 功能

- 使用 `@modelcontextprotocol/sdk` 和 Zod 构建类型安全的 MCP 服务器
- 注册 tools（可执行操作）、resources（只读数据）和 prompts（参数化提示模板）
- 支持 stdio（本地客户端）和 Streamable HTTP（远程客户端）两种传输模式
- 分离服务器逻辑与传输层，方便在 stdio 和 HTTP 之间切换
- 遵循错误安全、幂等性、速率限制等生产级最佳实践

## 用法

- `/ecc:mcp-server-patterns` - 构建新的 MCP 服务器、添加 tools/resources、选择传输协议或调试注册问题

## 适用场景

- 从头构建 MCP 服务器，为 AI 助手提供工具调用、数据读取和提示模板能力
- 为 Claude Desktop 添加本地工具（stdio）或为 Cursor/云端部署远程 MCP 服务（HTTP）
- 升级 MCP SDK 版本或排查注册与传输层问题

> 源文件：[SKILL.md](SKILL.md)
