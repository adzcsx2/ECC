# /ecc:plan-doc

为任务生成完整的文档集，包括 README、执行日志、架构设计、开发指南、路线图，可选测试文档。

---

## 功能

- 开始一个需要完整文档的功能或任务时使用
- 为长期维护的功能建立文档基线
- 多人协作项目中快速生成可交接的文档集

## 用法

```
/ecc:plan-doc <task-slug> [test]
```

- `<task-slug>`：任务名称（小写连字符格式）
- `[test]`：可选，加上后额外生成测试文档

示例：

```
/ecc:plan-doc user-auth
/ecc:plan-doc payment-refactor test
/ecc:plan-doc test add-search-api
```

## 生成内容

文档集生成到 `docs/plan/<task-slug>-YYYY-MM-DD/` 目录下：

| 文件 | 说明 |
|---|---|
| `README.md` | 任务概述和快速导航 |
| `execution-log.md` | 执行进度记录，含子代理计划和进度指针 |
| `architecture.md` | 架构设计文档 |
| `dev-guide.md` | 开发指南和约定说明 |
| `roadmap.md` | 里程碑和迭代计划 |
| `test-docs.md` | 测试策略文档（加 `test` 参数时生成） |

## 行为说明

- 优先调用 `/ecc:plan` 技能规划执行步骤
- 若用户拒绝安装相关依赖，降级为纯文本恢复提示

---

> 源文件：[commands/plan-doc.md](../plan-doc.md)
