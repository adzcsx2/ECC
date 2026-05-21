# /ecc:api-connector-builder

按仓库现有集成模式构建新的 API connector 或 provider。

---

## 功能

- 学习仓库现有的 connector/provider 规范：文件布局、抽象边界、配置模型
- 匹配仓库的认证模型、错误处理、重试/分页约定
- 按仓库原生层次构建：config/schema、client/transport、映射层、入口点、注册、测试
- 验证新 connector 与现有模式保持一致，不引入第二套架构

## 用法

- `/ecc:api-connector-builder` - 在现有仓库中按统一模式添加新的 API 集成

## 适用场景

- "为这个项目构建一个 Jira connector"
- "按现有模式添加 Slack provider"
- "为这个 API 创建新的集成"
- "构建匹配仓库 connector 风格的插件"

> 源文件：[SKILL.md](SKILL.md)
