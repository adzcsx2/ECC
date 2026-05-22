# /ecc:vite-patterns

Vite 构建工具模式：配置、插件、HMR、环境变量与生产优化。

---

## 功能

- vite.config.ts 配置与条件构建
- 关键插件：TypeScript 类型检查、SVG 组件、PWA 等
- 环境变量安全：VITE_ 前缀不是安全边界
- 构建优化：manualChunks 分包、barrel file 避免
- 库模式与 SSR 外部化配置
- 常见陷阱：Docker 绑定、Monorepo 文件访问、过期 chunks

## 用法

- `/ecc:vite-patterns` - Vite 构建工具配置与优化参考

## 适用场景

- 配置 Vite 项目（React/Vue/Svelte）
- 排查 CJS/ESM 依赖预构建问题
- 生产构建性能优化与分包

> 源文件：[SKILL.md](SKILL.md)
