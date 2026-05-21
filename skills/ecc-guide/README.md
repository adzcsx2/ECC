# /ecc:ecc-guide

引导用户了解、安装和选择 ECC 的 agents、skills、commands、hooks 与规则组件。

---

## 功能

- 帮助新用户理解 ECC 的组件关系（skills vs commands vs agents vs hooks vs rules）
- 根据用户需求推荐合适的 ECC skill 或 agent，并指出对应的规范文件
- 提供托管安装路径指导，避免重复安装或路径冲突
- 项目初始化引导（`/project-init`），检测项目技术栈并生成安装计划
- 故障排查：检查安装状态、harness 健康度审计

## 用法

- `/ecc:ecc-guide` - 当用户询问 ECC 有哪些功能、想找到某个 skill 或 command、需要安装指导时激活

## 适用场景

- 新用户首次了解 ECC 的组件体系
- 不确定用哪个 skill 或 command 完成特定任务
- 需要安装或重置 ECC
- 为具体项目配置 ECC 技能集
- 排查 ECC 安装或 harnees 配置问题

> 源文件：[SKILL.md](SKILL.md)
