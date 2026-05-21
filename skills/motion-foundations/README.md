# /ecc:motion-foundations

动效系统基础层：定义 motion token、spring 预设、性能规则、设备适配、无障碍强制和 SSR 安全。

---

## 功能

- 定义共享的 `motionTokens`（duration、easing、distance、scale）和 `springs` 预设
- 实现 `shouldAnimate()` 门控：响应 prefers-reduced-motion 和低端设备
- 提供 `useSafeMotion` hook：自动削减弱视偏好下的 transform 动画
- SSR 安全规则：initial 状态必须与服务端渲染输出一致，杜绝 hydration 不匹配
- 仅使用 `motion/react`，禁止混用 `framer-motion`

## 用法

- `/ecc:motion-foundations` - 在任何动效工作开始前，先建立 token、spring 预设和可访问性基础

## 适用场景

- 项目初始化动效系统时，建立统一的 token 和预设
- 实现 `prefers-reduced-motion` 支持，确保无障碍合规
- 调试 SSR hydration mismatch 导致的动画错误
- 其他 motion 相关 skill（`motion-patterns`、`motion-advanced`）的前置依赖

> 源文件：[SKILL.md](SKILL.md)
