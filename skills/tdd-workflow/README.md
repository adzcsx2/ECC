# /ecc:tdd-workflow

强制执行测试驱动开发：先写测试、80%+ 覆盖率、RED-GREEN-REFACTOR。

---

## 功能

- 用户旅程 -> 测试用例 -> RED -> GREEN -> REFACTOR 完整流程
- Git checkpoint 在每个阶段后自动提交
- 三层测试：单元（Jest/Vitest）、集成（API）、E2E（Playwright）
- 外部服务 Mock 模式：Supabase、Redis、OpenAI
- 80% 行/分支/函数/语句覆盖率阈值

## 用法

- `/ecc:tdd-workflow` - 测试驱动开发强制工作流

## 适用场景

- 新增功能或 API 端点
- Bug 修复与回归保护
- 重构前的安全网构建

> 源文件：[SKILL.md](SKILL.md)
