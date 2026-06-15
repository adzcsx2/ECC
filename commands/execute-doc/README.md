# /ecc:execute-doc

逐 phase 执行 `/ecc:plan-doc` 生成的执行文档（`00-执行文档.md`）：派发**同模型**子代理完成每个 phase，主代理审计每个 phase 的结果，通过则自动推进下一 phase，直到全部完成。全程自动，中途不停下询问用户。

---

## 功能

- 执行 `plan-doc` 产出的多 phase 执行文档，填补「文档已生成却无人执行」的缺口
- 从 progress pointer 断点恢复，跳过已完成的 phase 与子项，从第一个未勾选项继续
- 子代理**模型不降级**：派发时省略 `model` 参数，继承主代理当前模型，保证执行能力
- 主代理独占 progress pointer 更新与 phase 切换决策，子代理只负责实现
- 每个 phase 完成后主代理主动审计（改动范围、上游守卫、调试残留、注释语言、质量门）
- 审计通过自动进入下一 phase；未通过则自行修复或开修复子代理，最多 3 轮
- 仅在四种硬停情况停下：文档校验失败、单 phase 3 轮未过质量门、触及上游 sources of truth、context 接近上限（主代理自主完成当前 phase 并输出 Resume 续接指令，禁止疑问句）

## 用法

```
/ecc:execute-doc <执行文档路径或目录>
```

- 传目录：自动拼接 `00-执行文档.md`
- 传文件：直接使用该文件

示例：

```
/ecc:execute-doc docs/plan/ble-multi-device-fix-2026-06-14/
/ecc:execute-doc docs/plan/home-card-migration-2026-06-14/00-执行文档.md
```

## 执行流程

1. **Stage 0 定位与校验**：解析路径，校验 `00-执行文档.md` 存在且含 progress pointer 锚点，记录主仓根
2. **Stage 1 解析执行文档**：读取 progress pointer（`current_phase`、`parallelizable_groups`、`blockers`）、所有 phase checklist、subagent plan、`02-开发规范.md`、上游 sources of truth；打印断点快照
3. **Stage 2 主执行循环**（从 `current_phase` 到末 phase）：
   - 2a 前置验证（指针可解析、git 基线）
   - 2b 派发子代理执行当前 phase 全部 checklist 子项（省略 model = 不降级）
   - 2c 子代理返回 → 主代理主动审计（diff 范围、上游守卫、调试残留、注释语言、质量门；可选 reviewer 子代理深度审计）
   - 2d 审计决策（通过 → 主代理更新指针 + 日志；未通过 → 自行修复或开修复子代理，重验重审，最多 3 轮）
   - 2e 自动推进下一 phase，不停顿
4. **Stage 3 收尾**：指针置终态，追加完成日志，输出收尾自检报告表与最终总结

## 约束

- 派发子代理**必须省略 `model` 参数**（继承主代理模型，禁止降级到 haiku 等）
- 子代理一次性完成整个 phase 的全部 checklist 子项，不得做完一项就返回
- progress pointer 更新与 phase 切换由**主代理独占**，禁止委托子代理
- 主代理不直接写 phase 实现代码（仅做轻量自审修复），实现由子代理完成
- 「更新进度 / 追加日志」是过程记录，不是停顿交付物
- 所有代码注释与 commit message 必须使用中文
- 不做 worktree 隔离与 CAS 合并：直接在主仓执行，断点恢复由 progress pointer 保证；本地 commit 完成后，推送由用户手动决定
- 唯一允许停下（封闭清单 4 条）：文档校验失败、单 phase 3 轮未过质量门、触及上游 sources of truth、context 接近上限（主代理自主完成当前 phase 并输出 Resume 续接指令后停止，禁止任何疑问句）

## 脚本驱动模式（编排器）

除交互式 `/ecc:execute-doc` 命令外，本命令提供**脚本驱动编排器**，根治纯 prompt 自动推进在长会话下违规停车的缺陷：

```
node scripts/execute-doc.js <执行文档路径或目录> [options]
```

推进控制权由 node 脚本独占——每个 phase 派发 headless 子代理（复用 `scripts/claw.js` 的 `askClaude`）执行编码，子代理返回后脚本亲自跑硬质量门（git 干净 / diff 范围 / 上游守卫 / 测试退出码），通过则脚本独占更新 progress pointer 并推进下一 phase。LLM 在子会话里无法让主流程停下询问用户。

常用选项：

- `--phase <N>`：起点 phase（默认读 progress pointer）
- `--model <name>`：覆盖模型（默认读 `~/.claude/settings.json` 的 model 字段或 `$CLAUDE_MODEL`，继承主代理模型）
- `--test-cmd <cmd>`：每个 phase 后运行的测试命令
- `--upstream <f1,f2>`：上游 sources of truth（触碰即停，逗号分隔）
- `--max-retries <N>`：单 phase 最大重试（默认 3）
- `--dry-run`：仅解析打印计划，不执行

何时用脚本模式：任务 phase 多、单会话 context 撑不住、或要求零停车时。短任务用交互式 `/ecc:execute-doc` 即可。

## 与其他命令的关系

- **`/ecc:plan-doc`** —— 生成 `00-执行文档.md`，是本命令的输入；建议 plan-doc 的「execution companion」指向本命令
- **`/ecc:plan-t` / `/ecc:plan-tr`** —— 硬编码 4 阶段管道；本命令是其动态 phase 版
- **`/ecc:plan-r`** —— 主代理自己执行；本命令的执行由子代理完成，主代理专注审计与编排

---

> 源文件：[commands/execute-doc.md](../execute-doc.md)
