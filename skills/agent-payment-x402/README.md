# /ecc:agent-payment-x402

为 AI agent 添加 x402 支付能力，支持预算控制和去中心化钱包。

---

## 功能

- 基于 x402 HTTP 支付协议让 agent 为外部 API 或服务付费
- 强制执行 SpendingPolicy：每任务预算、每会话预算、白名单收款方、速率限制
- 使用 ERC-4337 智能账户实现非托管钱包，无需池化资金
- 支持 Base 链（agentwallet-sdk）和 X Layer（OKX Agent Payments Protocol）
- 通过 MCP 工具暴露余额查询、付款发送、预算查询和交易审计

## 用法

- `/ecc:agent-payment-x402` - 为 agent 配置 x402 支付，设置开销策略和钱包集成

## 适用场景

- Agent 需要为 API 调用付费
- Agent 需要购买服务或与其他 agent 结算
- 需要强制执行每任务的开销限制
- 管理非托管 agent 钱包

> 源文件：[SKILL.md](SKILL.md)
