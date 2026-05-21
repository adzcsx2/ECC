# /ecc:frontend-slides

创建零依赖、动画丰富的 HTML 演示文稿，支持从零开始或 PPT/PPTX 转换。

---

## 功能

- 零依赖单文件 HTML 演示文稿：内联 CSS 和 JS，浏览器直接打开即可使用
- 视觉探索式风格发现：生成 3 个单页预览供用户选择，而非抽象的风格问卷
- PPT/PPTX 转换：通过 python-pptx 提取文本、图片和备注，保留幻灯片顺序
- 视口适配铁律：每张幻灯片 `height: 100dvh; overflow: hidden`，无内部滚动条
- 内容密度限制：标题页、内容页、代码页、图片页的文本数量上限
- 键盘/触摸/滚轮导航、进度指示器、reveal-on-enter 动画、prefers-reduced-motion 支持

## 用法

- `/ecc:frontend-slides` - 在创建演讲文稿、转换 PPT/PPTX 为网页、或改进现有 HTML 幻灯片时激活

## 适用场景

- 创建技术演讲、产品发布、培训工作坊的演示文稿
- 将 PowerPoint 文件转换为可在浏览器中展示的 HTML 格式
- 改进现有 HTML 演示文稿的布局、动效或排版
- 与不确定设计偏好的用户一起探索演示文稿风格

> 源文件：[SKILL.md](SKILL.md)
