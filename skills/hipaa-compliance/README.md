# /ecc:hipaa-compliance

HIPAA 合规专项入口，面向美国医疗隐私与安全合规要求的任务。

---

## 功能

- 作为 HIPAA 决策覆盖层，叠加在 healthcare-phi-compliance 实现技能之上
- HIPAA 专项决策门禁：判断数据是否 PHI、是否需 BAA、最小必要访问原则
- 第三方服务的 HIPAA 合规边界：SaaS、可观测性、LLM 提供商默认阻止直至确认 BAA 状态
- 具体场景决策模板：AI 生成诊疗摘要、分析工具的数据发送风险评估
- 调度相关技能：healthcare-phi-compliance、healthcare-reviewer、security-review

## 用法

- `/ecc:hipaa-compliance` - 处理明确涉及 HIPAA 合规的任务，协调调用 PHI 保护和医疗审查相关技能

## 适用场景

- 请求明确提到 HIPAA、PHI、受保实体、业务伙伴协议
- 构建或审查存储/处理/传输 PHI 的美国医疗软件
- 评估日志、分析、LLM 提示词等是否产生 HIPAA 暴露风险
- 设计面向患者或临床医生的系统，涉及最小必要访问和可审计性

> 源文件：[SKILL.md](SKILL.md)
