# 02 - 新增 Skills 与 Integrations

## 包含的提交

| 提交 | 说明 | 作者 |
|------|------|------|
| `1d72dfb2` | AURA 信任适配器集成 (#2026) | luisllaver |
| `d29dad16` | Marketing campaign agent skill + command (#2031) | Chet |
| `61dd5690` | Social publisher skill (#2052) | ndesv21 |
| `8fb728d7` | Frontend accessibility skill (#2048) | HJ |
| `c2b38996` | Squish Memory MCP server 目录条目 (#2039) | michieh.eth |

---

## AURA 信任适配器 (`1d72dfb2`)

### 变更前
- ECC 没有信任检查机制，所有 MCP 调用和 agent 操作直接执行

### 变更后
- 新增 `integrations/aura/` 目录，提供**只读**、**opt-in** 的 AURA 信任检查适配器
- 7 个文件，+650 行

| 文件 | 说明 |
|------|------|
| `integrations/aura/README.md` | 集成文档（126 行） |
| `integrations/aura/THREAT_MODEL.md` | 威胁模型（55 行） |
| `integrations/aura/__init__.py` | Python 包初始化（36 行） |
| `integrations/aura/adapter.py` | 核心适配器实现（206 行） |
| `integrations/aura/tests/__init__.py` | 测试包 |
| `integrations/aura/tests/fixtures.py` | 测试夹具（94 行） |
| `integrations/aura/tests/test_adapter.py` | 适配器测试（133 行，22 个测试用例） |

---

## Marketing Campaign (`d29dad16`)

### 变更前
- ECC 没有营销活动相关的 agent/skill/command

### 变更后
- 新增 3 个文件，+401 行

| 文件 | 说明 |
|------|------|
| `agents/marketing-agent.md` | 营销 agent 定义（159 行） |
| `commands/marketing-campaign.md` | `/marketing-campaign` 命令（129 行） |
| `skills/marketing-campaign/SKILL.md` | 营销活动 skill（113 行） |

---

## Social Publisher (`61dd5690`)

### 变更前
- ECC 没有社交媒体发布相关的 skill

### 变更后
- 新增 `skills/social-publisher/SKILL.md`（115 行）
- 基于 SocialClaw 的社交媒体发布功能
- 支持跨多个社交平台的自动发布

---

## Frontend Accessibility (`8fb728d7`)

### 变更前
- ECC 没有专门的前端无障碍 skill
- 开发者在 accessibility 方面缺少可操作的指导

### 变更后
- 新增 `skills/frontend-a11y/SKILL.md`（446 行）
- 专注 React 和 Next.js 的无障碍模式
- 覆盖：ARIA 属性、键盘导航、屏幕阅读器支持、色彩对比度、焦点管理

---

## Squish Memory MCP (`c2b38996`)

### 变更前
- MCP server 目录中不包含 Squish Memory

### 变更后
- `mcp-configs/mcp-servers.json` 新增 5 行 Squish Memory 配置条目
- 用户可以通过 MCP 配置使用 Squish Memory 作为记忆后端
