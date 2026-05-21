# /ecc:browser-qa

使用浏览器自动化进行功能部署后的视觉测试与 UI 交互验证。

---

## 功能

- 四阶段 QA 流程：冒烟测试、交互测试、视觉回归、无障碍检查
- 自动检测控制台错误、4xx/5xx 网络请求、布局溢出
- 在多个断点（375px、768px、1440px）截取关键页面截图
- 运行 axe-core 无障碍审计，标记 WCAG AA 违规项
- 支持 Playwright CLI（可重复运行）和 Playwright MCP（交互式探索）两种模式

## 用法

- `/ecc:browser-qa` - 指定目标 URL，自动执行完整的 QA 测试流程并生成报告

## 适用场景

- 功能部署到 staging/preview 后验证 UI 行为
- PR 审查前端代码变更时
- 发布前的布局、表单、交互最终确认
- 无障碍审计和响应式测试

> 源文件：[SKILL.md](SKILL.md)
