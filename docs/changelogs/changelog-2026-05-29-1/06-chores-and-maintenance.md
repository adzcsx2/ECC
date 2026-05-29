# 06 - 维护与杂项

## 包含的提交

| 提交 | 说明 | 作者 |
|------|------|------|
| `928076cc` | Chore: export marketing campaign command | Affaan Mustafa |
| `d7813494` | Chore: sync catalog counts after PR triage | Affaan Mustafa |
| `870c5eb2` | Chore: bump actions/stale to 10.3.0 (#2045) | dependabot |

---

## Marketing Campaign Command 导出 (`928076cc`)

### 变更前
- `agent.yaml` 中未包含 `marketing-campaign` command，CI 的 `agent-yaml-surface` 同步检测失败

### 变更后
- `agent.yaml` 中 commands 数组新增 `marketing-campaign`（+1 行）
- 与 `d29dad16`（marketing campaign 功能提交）配套

---

## Catalog 计数同步 (`d7813494`)

### 变更前
- PR triage 后 catalog 计数与实际文件系统不符
- 多语言 README 中的计数存在偏差

### 变更后
- 8 个文件更新（+39/-28 行）
- 同步了 `docs/zh-CN/README.md` 等多语言文档中的 agent/skill/command 计数
- 确保 CI `catalog.test.js` 通过

---

## actions/stale 升级 (`870c5eb2`)

### 变更前
- `.github/workflows/maintenance.yml` 使用旧版本 `actions/stale`

### 变更后
- 升级 `actions/stale` 至 `v10.3.0`（+1/-1 行）
- 获得最新版本的 stale issue/PR 管理功能和 bug 修复
