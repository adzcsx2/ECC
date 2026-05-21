# /ecc:architecture-decision-records

在开发过程中捕获架构决策，生成结构化的 ADR 文档。

---

## 功能

- 自动检测决策时刻并捕获上下文、备选方案和理由
- 使用轻量级 ADR 格式（Michael Nygard 风格），包含状态、决策者、后果
- 维护 ADR 索引和日志，使后来者理解代码库的演进历史
- 支持决策的 supersede/废弃生命周期管理

## 用法

- `/ecc:architecture-decision-records` - 记录架构决策，产出结构化的 ADR 文档

## 适用场景

- 用户明确说"记录这个决策"或"ADR 这个"
- 在重大备选方案（框架、库、模式、数据库、API 设计）之间做选择
- 用户说"我们决定用 X 而不是 Y 的原因是..."
- 在规划阶段讨论架构权衡时
- 查看"为什么选择了 X"的历史决策

> 源文件：[SKILL.md](SKILL.md)
