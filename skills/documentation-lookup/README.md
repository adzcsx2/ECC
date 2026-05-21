# /ecc:documentation-lookup

通过 Context7 MCP 获取库和框架的最新文档，代替训练数据中的过时信息。

---

## 功能

- 使用 Context7 MCP 的 `resolve-library-id` 工具查找库的官方文档 ID
- 通过 `query-docs` 获取最新的 API 参考、代码示例和配置说明
- 支持版本感知查询，匹配用户指定的框架版本（如 React 19、Next.js 15）
- 自动选择基准评分高、来源信誉好的官方文档源

## 用法

- `/ecc:documentation-lookup` - 当需要查询框架或库的配置方式、API 用法、代码示例时，先调用此技能获取最新文档

## 适用场景

- 询问特定框架或库的配置问题（如 "如何配置 Next.js 中间件？"）
- 编写依赖特定库的代码（如 "写一个 Prisma 关联查询"）
- 需要 API 参考信息（如 "Supabase 有哪些认证方法？"）
- 依赖准确、最新的库行为而非训练数据回答问题

> 源文件：[SKILL.md](SKILL.md)
