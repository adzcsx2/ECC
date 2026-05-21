# /ecc:plan-doc-tr

文档生成 → TDD → 代码审查，完整四阶段流水线。先建立文档基线，再严格实现并审查。

---

## 功能

- 需要文档、TDD 实现、代码审查三者齐备的重要功能
- 适合对外交付、长期维护、团队协作的功能模块
- 最完整的质量保证流程

## 用法

```
/ecc:plan-doc-tr <task-slug> [test]
```

示例：

```
/ecc:plan-doc-tr user-auth
/ecc:plan-doc-tr payment-refactor test
```

## 执行流程

1. **Phase 1 — 规划**：调用 `/ecc:plan` 生成计划，等待用户确认
2. **Phase 2 — 文档生成**：在 `docs/plan/<task-slug>-YYYY-MM-DD/` 下生成完整文档集（同 `/ecc:plan-doc`）
3. **Phase 3 — TDD 执行**：调用 `tdd-guide` 子代理执行严格 TDD，80% 最低覆盖率
4. **Phase 4 — 代码审查**：调用 `code-reviewer` 子代理审查所有变更，自动修复 CRITICAL 问题

## 约束

- 文档先于代码生成
- Phase 3 禁止在主对话直接写代码，必须委托 `tdd-guide`
- 所有 Phase 必须通过真实 Agent tool 调用

---

> 源文件：[commands/plan-doc-tr.md](../plan-doc-tr.md)
