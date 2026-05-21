# /ecc:project-flow-ops

协调 GitHub 与 Linear 之间的执行流，对 issue 和 PR 进行分类、链接和裁决。

---

## 功能

- 对 PR 进行分类：Merge、Port/Rebuild、Close、Park
- 判断哪些 GitHub issue 需要同步到 Linear
- 保持 GitHub（公共）与 Linear（内部执行）的一致性
- 审查评论、CI 失败和过期 issue 是否阻塞执行
- 输出公共状态、分类和下一步操作

## 用法

- `/ecc:project-flow-ops` - 当需要清理 PR 积压、协调 GitHub 与 Linear 时使用

## 适用场景

- 审核开放的 PR 或 issue 积压
- 决定哪些工作需要在 Linear 中跟踪
- 将活跃的 GitHub 工作链接到内部执行通道
- 区分哪些 PR 合并、重建、关闭还是搁置

> 源文件：[SKILL.md](SKILL.md)
