# /ecc:motion-patterns

生产级 UI 动画模式：按钮、模态框、Toast、交错列表、页面过渡、滚动揭示和布局动画，基于 motion-foundations。

---

## 功能

- 标准 UI 动画：按钮悬停/点击反馈、模态框弹入弹出、Toast 通知进出
- 交错列表入场：staggerChildren 控制在 0.05s-0.10s 范围内
- 页面过渡：Next.js App Router 的 `AnimatePresence mode="wait"` 包装
- 滚动动画：`whileInView` 滚动揭示、`useScroll` + `useTransform` 进度条
- 布局动画：`layout` 属性就地变形、`layoutId` 跨元素共享过渡
- 手风琴展开收起、共享元素交叉淡入淡出

## 用法

- `/ecc:motion-patterns` - 为按钮、弹窗、列表、页面过渡等标准 UI 添加动画

## 适用场景

- 需要按钮反馈、模态框动画、Toast 堆叠、交错列表入场
- 实现 Next.js App Router 页面过渡效果
- 滚动驱动的揭示动画或滚动进度条
- 展开卡片、手风琴、共享元素过渡等布局动画（先决条件：已配置 `motion-foundations`）

> 源文件：[SKILL.md](SKILL.md)
