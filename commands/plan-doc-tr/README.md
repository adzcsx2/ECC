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
4. **Phase 4 — 代码审查闭环 + 串行合并**：调用 `code-reviewer` 子代理先在各自 worktree 中完成审查；只有返回 `[REVIEW_PASS]` 的分组才允许进入单线程 merge 队列

## 新增特性

- **断点恢复**：检测已有 `docs/plan/<task-slug>-*/00-执行文档.md` 中的进度指针，自动从上次中断位置恢复，跳过已完成的 Phase
- **简化确认流程**：用户输入含 "确认"/"yes" 等关键词后直接进入下一 Phase，去除冗余交互
- **并行调度策略**：TDD 和 Code Review 阶段支持 worktree 隔离运行，不污染主工作区

## 约束

- 文档先于代码生成
- Phase 3 禁止在主对话直接写代码，必须委托 `tdd-guide`
- 所有 Phase 必须通过真实 Agent tool 调用
- Phase 2 启动前必须先验证文档目录存在（硬前置门）

---

> 源文件：[commands/plan-doc-tr.md](../plan-doc-tr.md)
