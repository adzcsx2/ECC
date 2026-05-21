# /ecc:nextjs-turbopack

Next.js 16+ 和 Turbopack：增量打包、文件系统缓存、开发提速及 Turbopack vs webpack 选择。

---

## 功能

- Turbopack 增量打包原理：Rust 实现，文件系统缓存使重启速度提升 5-14 倍
- Next.js 16+ 开发默认即用 Turbopack，生产构建行为依版本而定
- webpack 仅作为回退方案：遇到 Turbopack bug 或依赖 webpack-only 插件时使用
- Bundle Analyzer（Next.js 16.1+）：实验性分析工具检查输出及优化代码拆分
- 最佳实践：使用 App Router 和 Server Components，避免不必要地清除缓存

## 用法

- `/ecc:nextjs-turbopack` - 开发或调试 Next.js 16+ 应用、排查开发启动慢或 HMR 问题

## 适用场景

- 升级到 Next.js 16+，利用 Turbopack 加速本地开发
- 诊断 dev 启动慢或热更新缓慢的问题
- 使用 Bundle Analyzer 优化生产包体积和大依赖
- 评估是否需要回退到 webpack

> 源文件：[SKILL.md](SKILL.md)
