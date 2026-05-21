# /ecc:recsys-pipeline-architect

设计可组合的推荐、排序和 feed 管线，采用 Source -> Hydrator -> Filter -> Scorer -> Selector -> SideEffect 六阶段框架。

---

## 功能

- 六阶段管线框架：Source（候选源）-> Hydrator（元数据补充）-> Filter（过滤）-> Scorer（打分）-> Selector（Top K 选择）-> SideEffect（异步副作用）
- 8 步工作流：澄清用例 -> 候选源 -> 水化需求 -> 过滤器 -> 打分链 -> 选择器 -> 副作用 -> 生成脚手架
- 关键权衡：单分数 vs 多动作预测、候选隔离 vs 联合评分、在线 vs 离线 vs 混合
- 反模式：打分前过滤、同步副作用、单分数替代多目标调优
- 输出可运行的 TypeScript/Go/Python 代码脚手架

## 用法

- `/ecc:recsys-pipeline-architect` - 构建任何为(user, context)挑选 Top K 项目的系统时使用
- 触发词：recommendation system、feed algorithm、ranking pipeline、for you feed

## 适用场景

- 构建社交 feed、内容 CMS、RAG 重排序器
- 任务优先级排序、通知分类、搜索重排、广告排序
- 从单一相关性分数迁移到多动作预测
- 为 LLM/ML 打分器构建过滤、水化和副作用管线

> 源文件：[SKILL.md](SKILL.md)
