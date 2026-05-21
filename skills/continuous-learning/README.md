# /ecc:continuous-learning

[已废弃] 旧版 v1 会话学习系统，请使用 continuous-learning-v2。

---

## 功能

- 会话结束时通过 Stop hook 评估会话，提取可复用模式
- 支持五种模式检测：错误解决、用户纠正、变通方案、调试技巧、项目特定惯例
- 可配置的提取阈值和模式过滤规则
- 自学习技能存储至 `~/.claude/skills/learned/`

## 用法

- `/ecc:continuous-learning` - 配置旧版学习系统（不推荐，建议使用 v2）

## 适用场景

- 需要兼容已安装的旧版学习系统时
- 与 continuous-learning-v2 并行运行时提供回退
- 查阅 v1 与 v2 的架构对比

> 源文件：[SKILL.md](SKILL.md)
