# /ecc:hookify-rules

编写 Hookify 规则文件：定义匹配模式和触发消息的 YAML frontmatter Markdown 规则。

---

## 功能

- 规则文件格式：YAML frontmatter（name、event、pattern） + Markdown 消息体
- 四种事件类型：bash（匹配危险命令）、file（匹配敏感文件操作）、stop（完成检查）、prompt（用户提示词匹配）
- 高级多条件规则：支持 file_path、new_text 等字段的 regex_match/contains/equals 等运算符
- 操作类型：warn（默认，显示警告消息）和 block（阻止操作执行）
- 便捷命令：/hookify 创建规则、/hookify-list 查看、/hookify-configure 开关切换

## 用法

- `/ecc:hookify-rules` - 创建和管理 Hookify 规则，定义触发条件和警告消息以约束编码行为

## 适用场景

- 创建自动检测危险 Bash 命令的规则
- 添加文件编辑前的安全提醒（如 .env 文件的 API 密钥）
- 设置工作流完成的检查提醒
- 根据用户提示词内容强制执行工作流规范
- 需要自定义编码行为门禁的任何场景

> 源文件：[SKILL.md](SKILL.md)
