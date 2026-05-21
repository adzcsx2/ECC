# /ecc:llm-trading-agent-security

自主交易 agent 的安全防护模式：Prompt 注入防御、支出限制、交易模拟、熔断机制和密钥管理。

---

## 功能

- Prompt 注入防御（识别并拦截注入模式的金融攻击）
- 硬性支出限制（单笔和每日上限，独立于模型输出强制执行）
- 交易前模拟（滑点保护、min_amount_out 必填）
- 熔断机制（连续亏损或小时损失超限自动停止）
- 钱包隔离（专用热钱包，远离主资金库）
- MEV 保护和 deadline 设置

## 用法

- `/ecc:llm-trading-agent-security` - 为具有交易权限的 LLM agent 构建多层安全防护

## 适用场景

- 构建可签名和发送交易的 AI agent
- 审计交易机器人或链上执行助手
- 设计 agent 的钱包密钥管理
- 为 LLM 赋予下单、兑换或资金操作权限

> 源文件：[SKILL.md](SKILL.md)
