# /ecc:token-budget-advisor

在回答前让用户选择回复深度：精简/适中/详细/详尽。

---

## 功能

- 估算输入 token 数（prose: 词数 x1.3，code: 字符数/4）
- 按复杂度估算响应窗口（3x-40x 范围）
- 四级深度选项：Essential 25%、Moderate 50%、Detailed 75%、Exhaustive 100%
- 会话内深度记忆与快捷键支持
- 约 85-90% 准确率的启发式估算

## 用法

- `/ecc:token-budget-advisor` - 控制回复的 token 预算与深度

## 适用场景

- 需要简短版本或详尽深度时
- 控制长会话的 token 消耗
- 在探索性问题和深入分析间切换

> 源文件：[SKILL.md](SKILL.md)
