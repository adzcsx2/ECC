# /ecc:motion-ui

生产级 React/Next.js UI 动效系统，聚焦性能、无障碍和可用性而非装饰。

---

## 功能

- 完整的 motion 系统架构：token 定义、性能规则、设备适配、可访问性支持
- 核心动画模式和决策树（whileHover、AnimatePresence、layoutId 等）
- 模态框最佳实践：焦点陷阱、Escape 关闭、滚动锁定、ARIA 角色
- 设备适配：根据 CPU 核心数和内存自动调整动画时长
- SSR 安全指南和调试检查清单
- 防反模式：禁止 layout 属性动画、限制 staggerChildren、强制减动支持

## 用法

- `/ecc:motion-ui` - 在 React/Next.js 中实现动画、过渡或动效模式时使用

## 适用场景

- 需要引导注意力、传达状态或保持空间连续性的交互场景
- 交互组件（按钮、模态框、菜单）、状态过渡和导航动画
- 不应在纯装饰、降低可用性或影响性能时使用动效

> 源文件：[SKILL.md](SKILL.md)
