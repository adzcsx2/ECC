# /ecc:foundation-models-on-device

Apple FoundationModels 框架的设备端 LLM 集成：文本生成、结构化输出、工具调用与流式快照。

---

## 功能

- 设备端文本生成：单轮与多轮对话，支持 instructions 引导模型行为
- `@Generable` 宏结构化生成：将自然语言输出自动映射为 Swift 类型，支持 range/count 约束
- 自定义工具调用（Tool Calling）：定义 Tool 协议，让模型调用域特定的代码逻辑
- 快照流式传输（Snapshot Streaming）：流式接收 `PartiallyGenerated` 类型，适合实时 SwiftUI 更新
- 模型可用性检查：处理 `deviceNotEligible`、`appleIntelligenceNotEnabled`、`modelNotReady` 等状态
- 4096 token 限制、单会话单请求约束、始终使用 `.content` 而非 `.output`

## 用法

- `/ecc:foundation-models-on-device` - 在集成 Apple Intelligence 设备端 LLM 构建 AI 功能时激活

## 适用场景

- 构建隐私敏感的设备端 AI 功能
- 从自然语言输入提取结构化数据
- 实现离线可用的 AI 辅助特性
- 逐步展示生成内容的流式 UI
- 通过工具调用实现域特定的 AI 操作

> 源文件：[SKILL.md](SKILL.md)
