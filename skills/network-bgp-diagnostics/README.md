# /ecc:network-bgp-diagnostics

只读 BGP 诊断：邻居状态分析、路由交换检查、前缀策略审查和 AS 路径校验。

---

## 功能

- 标准只读诊断流程：BGP summary、邻居详情、路由表、TCP 到达性、日志
- 状态解释矩阵：从 Idle 到 Established 各阶段的根因分析
- 传输层检查：ping/traceroute 源地址到达性、update-source 配置确认
- 路由策略审计：advertised-routes、prefix-list、route-map、AS 路径正则验证
- Python 解析器模式：从 BGP summary 输出提取结构化数据
- 变更窗口限定：软重置、硬重置、策略修改不能在诊断中自动执行

## 用法

- `/ecc:network-bgp-diagnostics` - BGP 会话异常、路由缺失或前缀策略故障排查

## 适用场景

- BGP 邻居处于非 Established 状态（Idle/Active/Connect/OpenSent）
- Established 但预期前缀缺失或收到意外路由
- 排查 route-map、prefix-list 或 max-prefix 过滤问题
- 在 BGP 变更前后采集证据，或审查解析 BGP 输出的自动化脚本

> 源文件：[SKILL.md](SKILL.md)
