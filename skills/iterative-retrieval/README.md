# /ecc:iterative-retrieval

解决多 agent 工作流中的上下文检索问题，通过渐进式查询循环获取精准上下文。

---

## 功能

- 四阶段循环（Dispatch -> Evaluate -> Refine -> Loop）渐进式检索上下文
- 自动学习代码库术语，修正搜索关键词
- 相关性评分机制（0-1 分）筛选高价值文件
- 最多 3 轮循环，在"足够好"的时候停止
- 解决子 agent 不知道需要什么上下文的固有问题

## 用法

- `/ecc:iterative-retrieval` - 在 multi-agent 工作流中启用渐进式上下文检索模式

## 适用场景

- 子 agent 需要代码库上下文但无法预先确定所需文件
- 构建多 agent 工作流时需要逐步优化上下文
- 遇到上下文过大或缺失时优化 token 使用
- 设计 RAG 式的代码检索管道

> 源文件：[SKILL.md](SKILL.md)
