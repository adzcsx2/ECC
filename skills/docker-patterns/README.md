# /ecc:docker-patterns

Docker 与 Docker Compose 本地开发、容器安全、网络与数据卷模式指南。

---

## 功能

- 提供标准的 Docker Compose 本地开发栈配置模板（Web 应用、PostgreSQL、Redis、Mailpit）
- 多阶段 Dockerfile 开发与生产构建模式（dev/build/production 三阶段分离）
- 容器网络隔离策略与自定义网络配置，限制服务暴露面
- 数据卷策略：命名卷持久化、绑定挂载热重载、匿名卷保护容器依赖
- 容器安全加固：非 root 用户、能力裁剪、只读文件系统、密钥管理
- Docker Compose 多文件覆盖模式（override.yml 用于开发，prod.yml 用于生产）

## 用法

- `/ecc:docker-patterns` - 在设置 Docker Compose 开发环境、审查 Dockerfile 安全性、排查网络或数据卷问题时激活

## 适用场景

- 为新项目搭建多容器本地开发环境
- 审查现有 Dockerfile 的安全性与镜像体积
- 迁移本地开发流程到容器化工作流
- 排查容器间网络连接或数据卷挂载问题
- 设计多容器架构的服务边界与依赖关系

> 源文件：[SKILL.md](SKILL.md)
