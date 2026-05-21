# /ecc:rules-distill

从 skills 中提取跨领域原则并提炼为 rules 的自动化工作流。

---

## 功能

- 扫描所有已安装的 skills 和 rules，建立完整清单
- 通过 LLM 交叉阅读分析，提取在 2+ skills 中出现的可操作原则
- 判断每条候选原则的处理方式（追加、修订、新建章节、新建文件、已覆盖、过于具体）
- 生成审查报告，由用户逐条确认后才应用修改，不自动修改 rules

## 用法

- `/ecc:rules-distill` - 定期维护 rules 时使用，或在 skill-stocktake 发现可提升为规则的模式后触发

## 适用场景

- 每月或安装新 skills 后的定期 rules 维护
- 当 rules 相对已有 skills 感觉不够完整时
- 在 skill-stocktake 完成后发现跨 skills 的通用模式需要纳入 rules

> 源文件：[SKILL.md](SKILL.md)
