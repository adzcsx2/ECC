# /ecc:configure-ecc

Everything Claude Code 的交互式安装向导，引导用户选择和安装技能与规约。

---

## 功能

- 三步安装流程：选择安装级别 -> 选择技能 -> 选择规约
- 支持 user-level (~/.claude/) 和 project-level (.claude/) 安装目标
- 技能安装：核心/细分分类选择，45+ 技能的逐项确认
- 规约安装：通用规约 + 语言特定规约（TS/Python/Go）的组合安装
- 安装后自动验证：路径引用检查、跨文件依赖验证、问题报告
- 可选优化：按项目需求裁剪已安装的技能和规约内容

## 用法

- `/ecc:configure-ecc` - 启动交互式安装向导，选择并安装 ECC 组件

## 适用场景

- 首次安装 Everything Claude Code 时
- 需要选择性安装特定的技能或规约
- 验证或修复已有的 ECC 安装
- 为当前项目优化已安装的技能和规约

> 源文件：[SKILL.md](SKILL.md)
