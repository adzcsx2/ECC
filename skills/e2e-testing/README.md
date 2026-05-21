# /ecc:e2e-testing

Playwright 端到端测试模式：页面对象模型、配置优化、CI/CD 集成与脱壳测试策略。

---

## 功能

- Playwright CLI 与 MCP 两种执行方式的选择指南（CLI 优先用于重复性测试，MCP 用于交互调试）
- 页面对象模型（POM）设计模式，封装定位器和操作逻辑
- Playwright 配置最佳实践：多浏览器并行、失败重试、trace/video/screenshot 产出物管理
- 脱壳测试（flaky test）的诊断与修复策略（竞争条件、网络时序、动画时序）
- CI/CD 集成模板（GitHub Actions）与测试报告模板
- 钱包/Web3 测试与金融关键流程测试模式

## 用法

- `/ecc:e2e-testing` - 在搭建 E2E 测试套件、编写页面对象、修复脱壳测试或配置 CI 时激活

## 适用场景

- 搭建新的 Playwright E2E 测试项目
- 编写或优化页面对象模型
- 排查 CI 中不稳定的脱壳测试
- 配置多浏览器、多设备的测试环境
- 集成 E2E 测试到 GitHub Actions 等 CI 流水线

> 源文件：[SKILL.md](SKILL.md)
