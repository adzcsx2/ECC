# /ecc:ai-regression-testing

AI 辅助开发的回归测试策略：发现模型盲区和路径不一致。

---

## 功能

- 使用沙盒/模拟模式进行无数据库依赖的 API 测试
- 构建自动化 bug 检查工作流，防止 AI 的自我审查盲区
- 捕获 AI 引入的 #1 回归模式：sandbox 与 production 路径不一致
- 提供 AI 生成代码的回归测试框架和模式

## 用法

- `/ecc:ai-regression-testing` - 为 AI 修改过的代码设置回归测试，防止模型盲区

## 适用场景

- AI agent 修改了 API 路由或后端逻辑后
- Bug 修复后需要防止再次引入
- 项目有可用的 sandbox/mock 模式
- 发现同一模型写代码和审查代码时存在系统盲区

> 源文件：[SKILL.md](SKILL.md)
