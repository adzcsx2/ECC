# /ecc:plan-tr

规划 → TDD → 代码审查，三阶段完整流水线。最严格的实现模式，同时保证 TDD 和代码质量审查。

---

## 功能

- 重要功能、安全敏感代码、需要高质量保证的实现
- 同时需要 TDD 和代码审查的场景
- 团队标准化开发流程

## 用法

```
/ecc:plan-tr <任务描述>
```

示例：

```
/ecc:plan-tr 实现 JWT 认证中间件
/ecc:plan-tr 重构支付流程核心逻辑
```

## 执行流程

1. **Phase 1 — 规划**：调用 `/ecc:plan` 技能生成分步计划，等待用户确认
2. **Phase 2 — TDD 执行**：调用 `tdd-guide` 子代理执行严格 TDD，80% 最低覆盖率
3. **Phase 3 — 代码审查闭环**：调用 `code-reviewer` 子代理审查所有 TDD 产出物，修复 CRITICAL/HIGH 问题后自动重跑审查，直到 `[REVIEW_PASS]`

## 约束

- 所有三个 Phase 都必须通过真实 Agent tool 调用
- Phase 2 所有测试通过且覆盖率达标后才能进入 Phase 3
- Phase 3 存在 CRITICAL 或 HIGH 问题时必须修复并重跑 Review，直到 `[REVIEW_PASS]`
- 任意 Phase 为 ❌ 时命令视为失败

---

> 源文件：[commands/plan-tr.md](../plan-tr.md)
