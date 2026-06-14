---
description: Execute a plan-doc execution document (00-执行文档.md) phase by phase — dispatch a same-model subagent per phase, main-agent audits each result, auto-advance until all phases complete. No mid-run confirmations.
argument-hint: "<执行文档路径或目录>"
---

# Execute-Doc：执行 00-执行文档.md 的动态 Phase

读取 `/ecc:plan-doc` 生成的 `00-执行文档.md`，按其中定义的**动态 phase** 逐个执行：主代理派发子代理完成一个 phase → 子代理返回即视为通知 → 主代理主动审计 → 通过则推进下一 phase，直到所有 phase 完成。**全程自动，中途不停下询问用户。**

与 `plan-t` / `plan-tr` 的区别：那两者是**硬编码**的 4 阶段管道；本命令的 phase 数量与内容由 `00-执行文档.md` 的 progress pointer 和 per-phase checklist **动态决定**。

## 关键约束（CRITICAL）

本命令是动态多 phase 自动推进管道。绝不允许：

- 跳过任何 phase 或 phase 内的 checklist 子项（`P<N>.<M>`）
- 用口头声明代替实际的 Agent tool 调用
- 子代理执行时**降级模型**——派发子代理**必须省略 `model` 参数**，使其继承主代理当前模型
- 委托子代理更新 progress pointer 或决定 phase 切换（指针更新与切换决策由**主代理**独占）
- 在主对话中直接编写 phase 的实现代码（所有实现由子代理完成；主代理仅做轻量自审修复）
- 中途以任何理由停下询问用户「是否继续」（封闭清单的三种硬停除外）

任何违反上述约束的执行都视为**命令失败**，必须回头重做。

---

## 自动推进原则

**Stage 1 解析完成即开始执行，从执行开始到所有 phase 完成之间，绝不停下询问用户。**

### 必须连续执行（不得停顿）

- 每个 phase 从「派发子代理 → 子代理返回 → 主代理审计 →（修复）→ 更新指针 → 推进下一 phase」**全自动串行，绝不中途停下询问用户**
- **phase 内部的 checklist 子项（`P2.1` → `P2.2` → …）之间同样不得停顿**：子代理一次性完成该 phase 全部子项后返回，主代理不再逐项插话
- 每阶段审计发现问题立即修复，修复后重新验证，验证通过直接进入下一阶段

### "更新进度 ≠ 停顿点"（最常见的错误停车原因）

以下动作都只是**过程记录**，做完后必须**立即**继续下一步，**绝不允许**在此处停下来等待用户回复：

- 更新 `00-执行文档.md` 的 progress pointer、勾选 phase checklist 子项
- 追加 execution log、汇报阶段性进展
- 完成某个 phase 子项、跑完一轮测试

**判定规则**：如果你正准备输出一段「进度已更新 / 指针已指向下一 phase」的话术——这恰恰说明下一步已经明确，**必须直接去做下一步**，而不是把这段话当作交付物停下来。

### 唯一允许停止的封闭清单（除此之外一律继续）

仅在以下三种情况允许停止并报告用户，**其他任何情况都必须继续执行**：

1. **Stage 0 文档定位 / 校验失败**：路径不存在、`00-执行文档.md` 缺失、或不含 `<!-- progress-pointer:start -->` 锚点——命令启动即失败
2. **某 phase 连续 3 轮「子代理执行 + 审计」仍无法通过质量门**（测试失败、覆盖率不足、审计 CRITICAL / HIGH 未消）
3. **审计发现改动破坏了 `00-执行文档.md` 声明的「上游 sources of truth」**（如修改了 `.cursor/rules/*`、顶层使用规范），需人工决策

**禁止**在任何 phase 边界或审计边界说「是否继续」「请确认」或等待用户确认。除上面三条外，遇到任何需要决策的小问题，按本命令既定规则自行处理后继续。

---

## Execute-Doc 执行流程

执行文档: $ARGUMENTS

---

### === Stage 0 START：定位与校验 ===

**解析 `$ARGUMENTS`**：

- 若为目录路径（如 `docs/plan/xxx-2026-06-14/`）→ 拼接 `00-执行文档.md`
- 若为文件路径 → 直接使用
- 若为空 → 停止（封闭清单 #1），提示用户提供路径

**校验 + 记录主仓**（任一失败即停止，封闭清单 #1）：

```bash
set -e
DOC_PATH="<解析后的 00-执行文档.md 完整路径>"
MAIN_REPO=$(git rev-parse --show-toplevel)
[ -f "$DOC_PATH" ] || { echo "⚠ [FATAL] 执行文档不存在: $DOC_PATH"; exit 1; }
grep -q "<!-- progress-pointer:start -->" "$DOC_PATH" \
  || { echo "⚠ [FATAL] $DOC_PATH 不含 progress-pointer 锚点，非 plan-doc 生成文档"; exit 1; }
grep -q "<!-- progress-pointer:end -->" "$DOC_PATH" \
  || { echo "⚠ [FATAL] progress-pointer 锚点不闭合"; exit 1; }
echo "RECORDED_MAIN_REPO=$MAIN_REPO"
echo "RECORDED_DOC_PATH=$DOC_PATH"
echo "✅ 执行文档校验通过: $DOC_PATH"
```

主对话从 stdout 提取并记录 `RECORDED_MAIN_REPO`、`RECORDED_DOC_PATH` 的字面值，后续所有 bash 块与子代理 prompt 用实际值替换 `<MAIN_REPO>`、`<DOC_PATH>`。

### === Stage 0 DONE ===

---

### === Stage 1 START：解析执行文档 ===

读取 `<DOC_PATH>` 与同目录关联文档，提取以下结构：

1. **Progress pointer**（`<!-- progress-pointer:start -->` 与 `<!-- progress-pointer:end -->` 之间的 YAML）：
   - `current_phase`（int）——执行起点
   - `current_phase_status`（enum）——判断是否断点恢复
   - `parallelizable_groups`（数组或 null）——本命令版本默认串行 phase；此字段被解析并保留，供后续并行增强
   - `blockers`（数组）——非空则先报告并停止（封闭清单 #3 衍生）

2. **所有 phase checklist**：扫描 `00-执行文档.md` 中 `P<N>.<M>` 格式的有序子项，统计 phase 总数 `N`、每个 phase 的子项清单、验收标准、分支名。

3. **Subagent plan**：读取文档内的 subagent 角色表，确定：
   - **Coding agent**（按 stack 选择，缺省回退 `tdd-guide`；若文档未指定，按 `02-开发规范.md` 检测到的栈选对应编码 agent）
   - **Reviewer agent**（若文档为某 phase 配置，用于该 phase 的深度审计；否则仅主代理自审）

4. **开发规范**：读取同目录 `02-开发规范.md`（若存在）的「禁止 / 必须」、代码模板、反模式——作为约束传入每个子代理 prompt。若不存在，跳过规范注入并在日志注明。

5. **上游 sources of truth**：从 `00-执行文档.md` / README 识别不可修改的文件清单（供 2c 审计比对）。

打印断点快照：

```text
检测到进度快照：
  执行文档: <DOC_PATH>
  起点 phase: <current_phase> / 共 <N> 个 phase
  当前状态: <current_phase_status>
  blockers: <blockers 或 无>
  subagent plan: coding=<agent>, reviewer=<agent 或 仅主代理自审>
  parallelizable_groups: <数组摘要 或 串行>
从 Phase <current_phase> 开始执行。
```

**断点恢复**：若 `current_phase_status != not_started` 且该 phase 已有部分 checklist 勾选，从**第一个未勾选子项**继续，不重做已完成项。

### === Stage 1 DONE，自动进入 Stage 2，不等待用户 ===

---

### === Stage 2 START：主执行循环（从 current_phase 到 Phase N）===

对 `phase = current_phase` 到 `N`，逐个执行以下子步骤：

#### 2a. 前置验证

- [ ] progress pointer 仍可解析？
- [ ] git 工作区在可控状态（记录 `git status --porcelain` 作为审计基线）

#### 2b. 派发子代理执行当前 phase

```
Agent tool with subagent_type: "<phase 对应的 coding agent>"
prompt: "执行 <DOC_PATH> 中的 Phase <phase>。

         必须先 cd 到项目根 <MAIN_REPO>，所有文件操作在项目内进行。
         先读 <DOC_PATH> 中 Phase <phase> 的完整 checklist（P<phase>.1, P<phase>.2, ...），
         以及同目录 02-开发规范.md（若存在）的禁止 / 必须规则。

         ⚠ 一次性完成 Phase <phase> 的【全部】checklist 子项，不要做完一项就返回。
         在所有子项完成、相关测试全绿之前，禁止结束本次 agent 调用。
         更新执行文档 / 勾选子项只是过程记录，做完后立即继续下一项，绝不停下等待。

         [若该栈有 TDD 要求，补 RED→GREEN→IMPROVE 说明；否则按规范直接实现]

         所有代码注释（//、/* */、///、/** */ 等）必须使用中文，禁止英文注释。
         完成后执行 git add -A && git commit（至少一次），commit message 必须使用中文。
         报告中必须包含：已完成的 P<phase>.<M> 清单、修改的文件列表、测试结果、覆盖率（如适用）。

         ⚠ 不要更新 progress pointer、不要决定 phase 切换——这些由主代理独占。"
```

> **模型不降级（强制）**：上述 Agent tool 调用**省略 `model` 参数**，让子代理继承主代理当前模型。**绝不**显式指定 haiku 或其他更便宜的模型。这与 plan-doc Stage 3.5 的「降级模型生成文档」哲学相反——execute-doc 要的是与主代理同等能力的执行。

#### 2c. 子代理返回 → 主代理主动审计

子代理返回即视为「通知主代理」。主代理**立即亲自审计**（默认不开子代理）：

```bash
set -e
cd "<MAIN_REPO>"
# 审计基线：本 phase 相对前一 phase 的改动
git diff --stat                              # 改动范围是否合理
git diff --name-only                         # 是否触及「上游 sources of truth」
git status --porcelain                       # 是否有未提交残留
```

**审计清单**：

1. **改动范围**：`git diff --stat` 显示的文件是否都属于本 phase 预期范围（对照 03-修复路线图 / 00 checklist）
2. **上游守卫**：变更文件是否触及 `00-执行文档.md` 声明的「上游 sources of truth」→ 命中即停止（封闭清单 #3）
3. **调试残留**：是否遗留 `console.log` / `debugger` / `print(` / `System.out` 等
4. **注释语言**：新增 / 修改的代码注释是否为中文
5. **质量门**（若项目有测试）：运行 `00-执行文档.md` 指定的验证命令，确认通过、覆盖率达标
6. **（可选）深度审计**：若 subagent plan 为本 phase 配置了 reviewer agent，额外开一次 reviewer 子代理（同样**省略 model 参数**）：

   ```
   Agent tool with subagent_type: "<reviewer agent>"
   prompt: "审计 <MAIN_REPO> 中 Phase <phase> 的变更（git diff）。按 CRITICAL / HIGH / MEDIUM / LOW 分类，
            修复所有 CRITICAL 和 HIGH。每处修复后重新运行相关测试。
            输出 [REVIEW_PASS] 或 [REVIEW_FAIL: <问题列表>]。"
   ```

#### 2d. 审计决策

- **通过**（无 CRITICAL / HIGH、质量门绿、无调试残留、注释中文、未触上游）：
  - 主代理**独占**更新 `<DOC_PATH>` 的 progress pointer：`current_phase_status: completed` → `current_phase: <phase+1>` → `current_phase_status: not_started`，刷新 `last_updated` / `last_actor: main-agent` / `last_commit`
  - 在 execution log 追加一行（phase、子项数、审计结论、commit hash）
  - **立即进入 2e**，不停顿

- **未通过**（有 CRITICAL / HIGH 或质量门红）：
  - 优先**主代理自行修复**（小问题：调试残留、英文注释、明显笔误）
  - 问题较大或属实现逻辑 → **开修复子代理**（同 coding agent，省略 model，prompt 指明具体问题）
  - 修复后**重新验证 + 重新审计**（回到 2c）
  - 本 phase 连续 **3 轮**仍未通过 → 停止并报告（封闭清单 #2）

#### 2e. 推进下一 phase

无需任何确认，`phase += 1`，回到 2a。直到 `phase > N`。

### === Stage 2 DONE（所有 phase 完成）===

---

### === Stage 3 START：收尾 ===

1. 主代理将 progress pointer 置为终态：`current_phase: <N>`，`current_phase_status: completed`，`next_action: 任务完成`，刷新时间戳与 `last_commit`
2. execution log 追加「任务完成」条目
3. 输出**收尾自检报告**（强制）

### === Stage 3 DONE ===

---

## 收尾自检报告（强制输出）

无论成功或失败，命令结束前必须输出以下表格：

| Phase            | 状态  | 子代理调用                          | 审计结论       | Commit        |
| ---------------- | ----- | ----------------------------------- | -------------- | ------------- |
| Phase `<start>`  | ✅/❌ | `<coding agent>` 调用 + 是否返工    | 通过 / 返工N轮 | `<hash>`      |
| Phase `<start+1>`| ✅/❌ | ...                                 | ...            | ...           |
| ...              | ...   | ...                                 | ...            | ...           |

任何 ❌ → 命令未完成，按封闭清单向用户报告遗留问题。

---

## 最终总结（仅在所有 phase ✅ 后输出）

- 执行文档：`<DOC_PATH>`
- 完成的 phase 范围：Phase `<start>` → Phase `<N>`
- 各 phase 修改的文件汇总、测试结果、覆盖率
- 审计过程中返工的 phase 及原因
- 终态 progress pointer：Phase `<N>` / completed
- 本地变更已 commit（如适用），推送由用户手动决定
- 遗留 MEDIUM / LOW 问题列表（供后续参考）

---

## 与其他命令的关系

- **`/ecc:plan-doc`** —— 生成 `00-执行文档.md`，是本命令的**输入**。plan-doc 描述「execution companion」时应指向本命令而非 `/ecc:plan`
- **`/ecc:plan`** —— in-conversation 轻量规划，无文件、无多 phase 自动推进
- **`/ecc:plan-t` / `/ecc:plan-tr`** —— 硬编码 4 阶段管道；本命令是其**动态 phase 版**，phase 结构来自文档而非命令本身
- **`/ecc:plan-r`** —— Plan → Execute → Review，主代理自己执行；本命令的执行由**子代理**完成，主代理专注审计与编排

## 反模式

- 派发子代理时显式指定 `model: haiku` 等（降级）—— 必须省略 model 参数
- 在主对话中直接写 phase 的实现代码（应派发子代理）
- 把 progress pointer 更新或 phase 切换委托给子代理
- 每个 phase 完成后停下问「是否继续下一个 phase」（违反自动推进）
- 把「更新进度 / 追加日志」当作停顿交付物
- 跳过 `02-开发规范.md` 的约束直接派发子代理
- 子代理只做一个 checklist 子项就返回（应一次性完成整个 phase）
- 忽略 progress pointer 的 `blockers` 字段直接开干
- 审计触及上游 sources of truth 仍继续推进（应触发封闭清单 #3 停止）
