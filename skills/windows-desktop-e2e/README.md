# /ecc:windows-desktop-e2e

Windows 原生桌面应用的 E2E 测试——覆盖 WPF、WinForms、Win32/MFC 和 Qt 框架。

---

## 功能

- 使用 pywinauto + Windows UI Automation (UIA) 编写跨框架的桌面自动化测试
- 提供 Page Object 模型的完整测试架构（base_page、login_page、conftest、config）
- 三级测试隔离：文件系统隔离（默认）、Windows Job Object、Windows Sandbox 全 OS 隔离
- Qt 专项支持：启用 UIA 辅助功能、ComboBox 下拉、QDialog、QTableWidget 的操作方法
- 备选截图模式用于 UIA 无法触及的自绘控件（OpenGL、游戏引擎等），含图像匹配和 DPI 规则

## 用法

- `/ecc:windows-desktop-e2e` - 为 Windows 桌面应用编写或运行 E2E 测试

## 适用场景

- 为 WPF/WinForms/Win32/MFC/Qt 桌面应用编写自动化测试
- 从零搭建桌面 GUI 测试套件
- 诊断不稳定的桌面自动化测试
- 为已有应用添加可测试性（AutomationId、辅助名称）
- 将桌面 E2E 集成到 CI/CD（GitHub Actions windows-latest）

> 源文件：[SKILL.md](SKILL.md)
