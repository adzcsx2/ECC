# /ecc:vite-patterns

Vite 构建工具配置模式——涵盖插件、HMR、环境变量、代理、SSR 和构建优化。

---

## 功能

- 基础与条件配置模板，使用 defineConfig 获得类型推断
- 核心插件选型指南（React SWC、Vue、vite-plugin-checker、SVGR 等）及反模式警告
- 环境变量安全规则：VITE_ 前缀非安全边界，loadEnv 陷阱，Source Map 泄露风险
- 性能优化：避免 barrel 文件、显式导入扩展名、预热热路径路由、构建分析
- 常见陷阱：开发与构建行为差异、过时 chunk、Docker 绑定、Monorepo 文件访问等

## 用法

- `/ecc:vite-patterns` - 获取 Vite 项目配置、优化和故障排除指导

## 适用场景

- 配置 vite.config.ts 或 vite.config.js
- 设置环境变量和 API 代理
- 优化构建输出（分块、压缩、资源）
- 调试 HMR、开发服务器或构建错误
- 使用 build.lib 发布 npm 包

> 源文件：[SKILL.md](SKILL.md)
