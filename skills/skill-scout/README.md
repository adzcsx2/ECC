# /ecc:skill-scout

创建新 skill 前搜索已有 skill，避免重复造轮子，推荐使用/复刻/新建。

---

## 功能

- 搜索本地和 marketplace 已有 skills 以防重复创建
- 搜索 GitHub 和 web 远程来源，按匹配度排名（最多 10 条）
- 审查外部 skill 的安全性：检查 shell 命令、网络调用、凭据处理
- 提供决策选项：直接使用已有 skill、复刻并修改、确认无匹配后新建

## 用法

- `/ecc:skill-scout` - 在用户说"创建一个 skill"或"有没有 X 的 skill"时激活

## 适用场景

- 用户想创建、构建、复刻或查找某个工作流的 skill 时
- 用户描述了一个工作流，你准备建议创建新 skill 之前
- 在确认没有现成解决方案之前，不应直接创建新 skill

> 源文件：[SKILL.md](SKILL.md)
