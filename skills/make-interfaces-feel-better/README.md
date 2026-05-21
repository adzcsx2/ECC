# /ecc:make-interfaces-feel-better

通过设计工程细节让界面更精致：间距、排版、边框、阴影、动效、点击区域和图标对齐。

---

## 功能

- 同心圆角（outer radius = inner radius + padding）
- 光学对齐（视觉居中优于几何居中）
- 文字排版优化（balance、pretty 换行、tabular-nums、字体平滑）
- 动效规范（过渡属性显式指定、入场/退场分离、禁用 transition:all）
- 点击区域保证（最小 40x40px）
- 图片轮廓（中性描边防止边缘融入背景）

## 用法

- `/ecc:make-interfaces-feel-better` - 审查和优化 UI 的视觉细节，让界面感觉更精致

## 适用场景

- UI 看起来平淡、呆板、拥挤、跳变或未完成
- 构建控件、卡片、列表、仪表板、导航、表单或工具栏
- 组件缺少 hover、active、focus、enter、exit 状态
- 前端审查需要具体的前后改进建议

> 源文件：[SKILL.md](SKILL.md)
