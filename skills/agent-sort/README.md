# /ecc:agent-sort

为特定仓库构建基于证据的 ECC 安装方案，区分日常加载与按需参考。

---

## 功能

- 扫描仓库的实际技术栈（文件类型、包管理器、框架配置）作为分类依据
- 将 ECC 组件分为 DAILY（每会话加载）和 LIBRARY（保持可搜索但默认不加载）
- 通过并行审查分批处理 agents、skills、commands、rules、hooks、extras
- 产生可验证的安装计划和验证报告
- 可选生成 `skill-library` 路由器使 LIBRARY 技能保持可发现

## 用法

- `/ecc:agent-sort` - 扫描仓库并生成精简的项目级 ECC 安装方案

## 适用场景

- 项目只需要 ECC 的子集，全量安装太"嘈杂"
- 技术栈明确但不想手动逐个挑选技能
- 团队需要可重复的、基于 grep 证据的安装决策
- 仓库漂移到错误的语言/规则/钩子集，需要清理

> 源文件：[SKILL.md](SKILL.md)
