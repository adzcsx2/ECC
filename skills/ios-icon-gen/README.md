# /ecc:ios-icon-gen

为 iOS Xcode 项目自动生成图标资源（PNG imageset），支持 SF Symbols 和 Iconify API 双源。

---

## 功能

- 从 SF Symbols（5000+ Apple 原生图标）生成 Xcode 兼容的图标资源
- 从 Iconify API（200+ 图标集、275K+ 开源图标）搜索并生成图标
- 自动生成完整 imageset（包含 1x、2x、3x 及 Contents.json）
- 支持自定义颜色、尺寸、粗细等参数
- 支持预览模式，生成前可查看图标效果

## 用法

- `/ecc:ios-icon-gen` - 为 iOS/macOS 项目搜索、预览并生成图标资源

## 适用场景

- 为 Xcode 项目生成图标资源
- 搜索特定风格的开源图标（Material Design、Phosphor、Lucide 等）
- 替换项目中的占位图标为正式资源
- 保持与项目现有图标风格一致的新图标生成

> 源文件：[SKILL.md](SKILL.md)
