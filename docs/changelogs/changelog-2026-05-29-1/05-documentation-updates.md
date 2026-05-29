# 05 - 文档更新

## 包含的提交

| 提交 | 说明 | 影响范围 |
|------|------|----------|
| `7d6ca961` | Docs: neutralize public ECC metadata (#2083) | `package.json`：移除内部敏感 metadata |
| `7fef1ddb` | Docs: add German localization scout (#2029) | 17 个文件 +1,928 行：新增德语本地化 |
| `3add394c` | Fix: remove unicode verdict markers | `integrations/aura/README.md`：移除 unicode 标记符号 |
| `5b4c4bda` | Fix: wrap integration reference links | `skills/social-publisher/SKILL.md`、`skills/nextjs-turbopack/SKILL.md`：链接格式修复 |
| `228ceb89` | Fix: wrap Next.js proxy reference link | `skills/nextjs-turbopack/SKILL.md`：1 行链接修复 |
| `3ffab636` | Fix: document proxy.ts middleware filename (#2033) | `skills/nextjs-turbopack/SKILL.md`：+13 行补充 middleware 文件名文档 |
| `7485e41a` | Docs: add LLM Safe Haven reference (#2034) | `the-security-guide.md`：+1 行新增安全参考 |
| `dcee2231` | Fix: update Chinese marketplace URL (#2050) | `README.zh-CN.md`：修复中文 marketplace 链接 |
| `7d6ca961` | Docs: neutralize public ECC metadata (#2083) | `package.json` |

---

## Metadata 中和 (`7d6ca961`)

### 变更前
- `package.json` 中包含内部 metadata（如内部路径、组织信息等）
- 公网发布时有信息泄漏风险

### 变更后
- `package.json` 中的敏感 metadata 被中和（neutralize），+8/-9 行
- 公网发布版本不再包含内部信息

---

## 德语本地化 (`7fef1ddb`)

### 变更前
- ECC 在 README 语言栏中列出了德语（Deutsch），但没有实际内容
- 没有德语本地化文件

### 变更后
- 新增 `docs/de-DE/` 目录（17 个文件，+1,928 行）
- 包含 `README.md`、`GLOSSARY.md` 等德语翻译文件
- 同步更新了 `README.md` 中语言栏的德语链接（从空链接变为有效链接）
- 新增 `tests/lib/locale-install.test.js`（54 行）用于本地化测试

---

## Unicode 标记清理 (`3add394c`)

### 变更前
- `integrations/aura/README.md` 中使用 unicode 字符作为 verdict 标记（如 ✅、❌、⚠️）

### 变更后
- 移除 unicode verdict 标记（+5/-5 行）
- 符合 CLI 环境的可移植性要求（某些终端不支持 unicode）

---

## 链接格式修复 (`5b4c4bda`, `228ceb89`)

### 变更前
- `skills/social-publisher/SKILL.md` 中集成参考链接**未包裹**（裸 URL 或格式不正确）
- `skills/nextjs-turbopack/SKILL.md` 中 Next.js proxy 参考链接格式不正确

### 变更后
- 两个文件各修复 1 行链接（+1/-1）
- 链接被正确包裹为 `<>` 格式或 markdown 格式

---

## proxy.ts Middleware 文档补充 (`3ffab636`)

### 变更前
- `skills/nextjs-turbopack/SKILL.md` 中没有说明 `proxy.ts` middleware 的具体文件名
- 开发者配置 Next.js proxy 时需要自行推断文件名

### 变更后
- 文档中明确说明了 `proxy.ts` middleware 的文件名（+13 行）

---

## LLM Safe Haven 参考 (`7485e41a`)

### 变更前
- `the-security-guide.md` 没有提及 LLM Safe Haven 安全概念

### 变更后
- 新增 1 行 LLM Safe Haven 参考链接

---

## 中文 Marketplace URL (`dcee2231`)

### 变更前
- `README.zh-CN.md` 中中文 marketplace URL 可能指向旧地址

### 变更后
- 中文 marketplace URL 更新为当前正确的地址（+2/-2）
