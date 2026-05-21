# /ecc:skill-stocktake

审计所有 Claude skills 的质量：支持快速扫描和完整盘点两种模式。

---

## 功能

- 快速扫描：仅重新评估上次运行后有变更的 skills（5-10 分钟）
- 完整盘点：对所有 skills 进行质量评估（20-30 分钟）
- 质量评估维度：可操作性、范围匹配、独特性、时效性
- 判定类型：Keep（保持）、Improve（改进）、Update（更新）、Retire（淘汰）、Merge（合并）
- 分阶段输出：清单 -> 质量评估 -> 汇总表 -> 清理建议
- 结果缓存和断点续传支持

## 用法

- `/ecc:skill-stocktake` - 运行快速扫描（已有缓存时）
- `/ecc:skill-stocktake full` - 运行完整盘点

## 适用场景

- 定期审计已安装 skills 的质量和实用性
- 发现重复、过时或低质量的 skills 需要清理时
- 安装新一批 skills 后评估整体状态

> 源文件：[SKILL.md](SKILL.md)
