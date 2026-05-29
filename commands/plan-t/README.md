# /ecc:plan-t

规划 → TDD 自动执行 → 代码审查闭环，三阶段强制流水线。用户只需确认计划，TDD 实现和 Code Review 均由子代理在隔离 worktree 中完成。

---

## 功能

- 新功能开发、Bug 修复需要严格遵守测试驱动开发时使用
- 确保测试先于实现代码编写（RED → GREEN → IMPROVE）
- 保证 80% 以上测试覆盖率

## 用法

```
/ecc:plan-t <任务描述>
```

示例：

```
/ecc:plan-t 实现用户注册邮件验证功能
/ecc:plan-t 添加商品搜索分页接口
```

## 执行流程

1. **Phase 1 — 规划**：调用 `/ecc:plan` 技能生成分步计划，等待用户确认
2. **Phase 1.5 — 并行分组分析**：任务数 ≥3 且在 git 仓库中时，按文件依赖关系分组，独立任务并行调度到 worktree 执行
3. **Phase 2 — TDD 执行**：调用 `tdd-guide` 子代理按分组执行 RED→GREEN→IMPROVE 循环，80% 最低覆盖率
4. **Phase 3 — 代码审查闭环 + 串行合并**：调用 `code-reviewer` 子代理先在各自 worktree 中完成审查；只有返回 `[REVIEW_PASS]` 的分组才允许进入单线程 merge 队列

## 新增特性

- **并行 Worktree 调度**：独立任务组在 git worktree 中并行执行，互不干扰，大幅缩短总耗时
- **分组分析机制**：Phase 1.5 根据文件路径和任务描述自动判定任务间依赖关系，生成并行执行计划
- **非阻塞模型切换**：各 worktree 中的子代理可独立选择模型等级，不阻塞主对话

## 约束

- Phase 2 禁止在主对话中直接编写代码，必须委托给 `tdd-guide` 子代理
- 必须先写失败测试，再写最小实现代码
- 未达到覆盖率要求不得进入 Phase 3
- Phase 3 存在 CRITICAL 或 HIGH 问题时必须修复并重跑 Review，直到 `[REVIEW_PASS]`

---

> 源文件：[commands/plan-t.md](../plan-t.md)
