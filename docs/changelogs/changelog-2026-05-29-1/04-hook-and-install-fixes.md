# 04 - Hook 与 Install 修复

## 包含的提交

| 提交 | 说明 | 作者 |
|------|------|------|
| `64cd1ba2` | Fix: surface warn-only PreToolUse hooks (#2084) | Affaan Mustafa |
| `d243adbf` | Fix: prefer fresh harness cost cache (#2054) | Robert Egoyan |
| `ee9e5a19` | Fix: validate compiled OpenCode plugin before install (#2041) | Gaurav Dubey |

---

## Warn-Only PreToolUse Hooks (`64cd1ba2`)

### 变更前（Before）

PreToolUse hooks 的输出在 CLI 中**不可见**。Hook 执行了，但用户看不到 "warn only" 级别的 hook 输出内容。具体问题：
- `bash-hook-dispatcher.js`：warn 级别 hook 的 stdout 输出被丢弃
- `doc-file-warning.js`、`pre-bash-git-push-reminder.js`、`pre-bash-tmux-reminder.js`：这些 warn-only hook 的消息在 CLI 面板中无法展示
- `run-with-flags.js`：缺少对 additionalContext 的正确累积

### 变更后（After）

| 文件 | 变化 |
|------|------|
| `scripts/hooks/bash-hook-dispatcher.js` | +24/-3 行：增加 warn-only hook 的输出转发逻辑 |
| `scripts/hooks/doc-file-warning.js` | +14/-3 行：调整为可被 dispatcher 正确捕获的输出格式 |
| `scripts/hooks/pre-bash-git-push-reminder.js` | +12/-3 行：同上 |
| `scripts/hooks/pre-bash-tmux-reminder.js` | +12/-3 行：同上 |
| `scripts/hooks/pretooluse-visible-output.js` | **新增** 41 行：统一处理 `buildPreToolUseAdditionalContext`，将 hook 输出序列化为 JSON 并注入 `hookSpecificOutput.additionalContext` |
| `scripts/hooks/run-with-flags.js` | +5/-1 行：支持 additionalContext 累积 |
| `tests/hooks/bash-hook-dispatcher.test.js` | +11/-1 行 |
| `tests/hooks/doc-file-warning.test.js` | +24/-5 行 |
| `tests/hooks/pre-bash-reminders.test.js` | +35/-8 行 |

核心机制：新增 `pretooluse-visible-output.js` 的 `combineAdditionalContext()` 函数将多个 hook 的 additional context 合并后，通过 `buildPreToolUseAdditionalContext()` 序列化为 JSON 格式的 `hookSpecificOutput`，确保 CLI 面板可以渲染 warn-only hook 的消息。

---

## Cost Cache 优化 (`d243adbf`)

### 变更前（Before）

Harness cost cache 使用的是**可能过时**的缓存数据。当新数据可用时，旧数据仍被优先使用，导致成本报告不准确。

### 变更后（After）

| 文件 | 变化 |
|------|------|
| `scripts/hooks/cost-tracker.js` | +51/-1 行：优先使用**新鲜**的 harness cost cache，仅在新鲜缓存不可用时退回到 transcript 定价 |
| `tests/hooks/cost-tracker.test.js` | +87 行：针对新鲜缓存优先策略的测试 |

核心逻辑变化：`cost-tracker.js` 增加了缓存新鲜度检查。当 harness 返回的新鲜 cost cache 可用时，直接使用；旧的 transcript-based 估算仅作为 fallback。

---

## OpenCode 插件安装校验 (`ee9e5a19`)

### 变更前（Before）

从源码 checkout 安装 OpenCode 时，即使**没有**编译好的 `.opencode/dist` 目录（即安装不完整），安装流程也会继续，不会报错。用户事后才发现 OpenCode 插件实际不可用。

### 变更后（After）

| 文件 | 变化 |
|------|------|
| `.opencode/README.md` | +13 行：说明编译要求 |
| `scripts/lib/install-targets/opencode-home.js` | +82/-1 行：在安装前**快速失败**（fail fast）——检测 `.opencode/dist` 是否存在，若缺失则立即中止并报错 |
| `tests/lib/install-targets.test.js` | +128 行：校验逻辑的测试 |

核心机制：`opencode-home.js` 在安装开始时检查编译后的 payload 目录是否存在。如果从源码 checkout 执行安装但缺少编译产物，安装流程会在初期就失败退出，而不是静默安装一个不完整、不可用的插件。
