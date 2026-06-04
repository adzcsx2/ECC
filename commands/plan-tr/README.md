# /ecc:plan-tr

规划 → TDD → Code Review → CAS 原子合并，四阶段串行流水线。每次调用在独立 git worktree 内执行，`flock` + 文件级 CAS 保证多 Claude 并发时合并安全。

---

## 功能

- 新功能开发、Bug 修复需要严格遵守测试驱动开发时使用
- 确保测试先于实现代码编写（RED → GREEN → IMPROVE）
- 保证 80% 以上测试覆盖率
- 支持多个 Claude 实例并发执行，合并阶段自动串行化，不产生冲突

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

1. **Phase 1 — 规划**：调用 `/ecc:plan` 技能生成分步计划，等待用户确认（**唯一手动交互点**）
2. **Phase 2 — TDD 执行**：在独立 git worktree 内调用 1 个 `tdd-guide` 子代理（串行），RED→GREEN→IMPROVE→REPEAT，覆盖率 ≥80%。完成后自检，通过后**自动进入 Phase 3**
3. **Phase 3 — Code Review 闭环**：在同一 worktree 内调用 `code-reviewer`，循环至 `[REVIEW_PASS]`（最多 3 轮），自动修复 CRITICAL 和 HIGH 问题。通过后**自动进入 Phase 4**
4. **Phase 4 — CAS 原子合并**：锁外 rebase + AI 自动解冲突 + 测试验证；锁内 `mkdir` 原子锁 + 文件级 CAS + `git merge --ff-only`；合并后清理 worktree

> **自动推进**：Phase 1 确认后，Phase 2/3/4 全自动执行，不会中途停下询问用户。

## 特性

- **单 worktree 隔离**：每次执行创建一个独立 worktree，TDD 和 Review 完全在隔离环境中进行
- **CAS 合并**：锁外检测他人合入的文件是否与本次变更相交；无交集直接合并，有交集才重跑测试（最多 5 次）
- **AI 自动解冲突**：rebase 冲突由 AI 分析双方意图后自动融合，测试验证通过后继续
- **不自动 push**：合并到本地 `<MAIN_BRANCH>` 后停止，由用户决定推送时机

## 约束

- 禁止在主对话中直接编写代码，必须委托给 `tdd-guide` 子代理在 worktree 内完成
- 必须先写失败测试，再写最小实现代码
- 未达到覆盖率要求不得进入 Phase 3
- Phase 3 存在 CRITICAL 或 HIGH 问题时必须修复并重跑 Review，直到 `[REVIEW_PASS]`
- Phase 4 合并失败（并发争用超 5 次）时停止，不强制合并

---

> 源文件：[commands/plan-tr.md](../plan-tr.md)
