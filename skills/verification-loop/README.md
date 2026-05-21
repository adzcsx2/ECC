# /ecc:verification-loop

Claude Code 会话的全面验证系统：构建、类型、Lint、测试、安全。

---

## 功能

- 六阶段验证：构建 -> 类型检查 -> Lint -> 测试+覆盖率 -> 安全 -> 差异审查
- 结构化验证报告：[PASS/FAIL] 带分类统计
- 持续模式：每 15 分钟或重大变更后自动运行
- 80% 覆盖率最低阈值
- PostToolUse hooks 互补的深度验证

## 用法

- `/ecc:verification-loop` - 运行完整质量门禁验证

## 适用场景

- 完成功能或重大代码变更后
- PR 创建前的质量自检
- 重构后的全面回归验证

> 源文件：[SKILL.md](SKILL.md)
