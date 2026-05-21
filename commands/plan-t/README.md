# /ecc:plan-t

规划 → TDD 自动执行，两阶段强制流水线。用户只需确认计划，TDD 实现由 `tdd-guide` 子代理完成。

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
2. **Phase 2 — TDD 执行**：调用 `tdd-guide` 子代理按计划执行 RED→GREEN→IMPROVE 循环，80% 最低覆盖率

## 约束

- Phase 2 禁止在主对话中直接编写代码，必须委托给 `tdd-guide` 子代理
- 必须先写失败测试，再写最小实现代码
- 未达到覆盖率要求不得结束

---

> 源文件：[commands/plan-t.md](../plan-t.md)
