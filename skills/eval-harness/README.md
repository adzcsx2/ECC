# /ecc:eval-harness

评估驱动开发（EDD）框架：pass@k 指标、回归评估与产品级模型评估。

---

## 功能

- 能力评估（Capability Evals）：验证 Claude 是否具备新功能的实现能力，定义 pass/fail 标准
- 回归评估（Regression Evals）：确保变更不破坏已有功能，基于基线对比
- 多种评分器：代码评分器（确定性检查）、模型评分器（LLM 开放式评估）、人工评分器
- pass@k 与 pass^k 指标：测量 agent 在 k 次尝试中的可靠性
- 完整 EDD 工作流：定义评估 -> 实现 -> 评估 -> 报告，评估作为代码的一等工件
- 评估存储布局：`.claude/evals/` 下的定义文件、运行日志和基线配置

## 用法

- `/ecc:eval-harness` - 在建立 AI 辅助开发的 EDD 流程、定义任务通过标准、创建回归测试套件时激活

## 适用场景

- 为 AI 辅助开发建立评估驱动的开发流程
- 定义 Claude Code 任务完成的 pass/fail 标准
- 用 pass@k 指标测量 agent 可靠性
- 为 prompt 或 agent 变更创建回归评估套件
- 跨模型版本基准测试 agent 性能

> 源文件：[SKILL.md](SKILL.md)
