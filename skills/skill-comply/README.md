# /ecc:skill-comply

自动化合规性测量：验证 agent 是否真正遵循 skills、rules 和 agent 定义。

---

## 功能

- 从 .md 文件自动生成预期行为序列（规格说明）
- 自动生成三种 prompt 严格性级别的测试场景（支持 -> 中立 -> 对抗）
- 运行 claude -p 并通过 stream-json 捕获工具调用轨迹
- 使用 LLM（而非正则）对工具调用进行语义分类
- 生成自包含报告：包含规格、prompt 和完整调用时间线

## 用法

- `/ecc:skill-comply <路径>` - 测试某个 skill/rule 的合规性
- `uv run python -m scripts.run <路径>` - 完整运行
- `uv run python -m scripts.run --dry-run <路径>` - 仅生成规格和场景

## 适用场景

- 用户问"这个规则真的被遵守了吗？"
- 添加新的 rules 或 skills 后验证 agent 合规性
- 作为质量维护的定期检查

> 源文件：[SKILL.md](SKILL.md)
