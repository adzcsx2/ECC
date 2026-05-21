# /ecc:terminal-ops

基于证据的仓库执行工作流：运行命令、排查 CI、精准修复并报告。

---

## 功能

- 四模式：inspect（检查）、fix（修复）、verify（验证）、push（推送）
- 窄修复原则：一次解决一个主导故障
- 精确状态报告：inspected/changed/verified/committed/pushed/blocked
- 修复前先读取失败表面，避免盲目变更

## 用法

- `/ecc:terminal-ops` - 仓库终端操作与修复工作流

## 适用场景

- 排查 CI 构建失败
- 精准修复后验证并推送
- 需要区分"本地已改"与"已推送"状态

> 源文件：[SKILL.md](SKILL.md)
