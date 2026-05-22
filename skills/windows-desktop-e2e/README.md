# /ecc:windows-desktop-e2e

Windows 原生桌面应用 E2E 测试：pywinauto + UIA，支持 WPF/WinForms/Qt。

---

## 功能

- pywinauto + Windows UI Automation 多框架支持
- Page Object Model：base_page、locator 优先级策略
- 三层测试隔离：文件系统 -> Job Object -> Windows Sandbox
- 截图模式 fallback：自绘控件使用图像匹配
- CI/CD 集成：GitHub Actions windows-latest
- Qt 专项：UIA 启用、QComboBox/QMessageBox 处理

## 用法

- `/ecc:windows-desktop-e2e` - Windows 桌面应用 E2E 测试

## 适用场景

- WPF/WinForms/Win32/Qt 应用的 GUI 自动化测试
- CI 流水线集成桌面 E2E
- 排查桌面自动化测试的不稳定性

> 源文件：[SKILL.md](SKILL.md)
