---
description: Plan + TDD + auto code review (full pipeline, user only confirms plan)
---

# Plan-TR: Plan + TDD + Code Review (Full Pipeline)

**🚨 关键约束**：本命令是三阶段强制管道。所有三个 Phase 都必须通过 Agent tool 真实执行对应子代理。在输出最终总结之前，绝不允许：
- 跳过 Phase 2 或 Phase 3
- 用口头声明（"我已经完成了 TDD/Review"）代替实际的 Agent tool 调用
- 在主对话上下文中直接编写代码（所有实现必须由 tdd-guide agent 完成）
- TDD 顺序错误（必须先写测试，再写实现）

任何违反上述约束的执行都视为**命令失败**，必须回头重做。

---

## Plan-TR 执行流程

任务: $ARGUMENTS

### === Phase 1 START: Planning ===

通过 Skill tool 调用 `/ecc:plan`：

```
Skill tool with skill: "ecc:plan", args: $ARGUMENTS
```

`ecc:plan` 技能会：
1. 重述需求
2. 识别风险
3. 生成分步计划
4. **等待用户确认**

**硬检查**: 用户确认文本必须包含以下任一关键词才能继续：
- "yes" / "确认" / "proceed" / "go ahead" / "可以" / "好的" / "同意"

如果未检测到确认，停止并要求用户明确说"确认"。

---

### === Phase 1.5: 并行分组分析（满足条件时执行）===

**触发门**（全部满足才执行本步骤，否则直接跳到 Phase 2 串行模式）：
- [ ] 计划项总数 ≥ 3
- [ ] 当前目录是 git 仓库（`git rev-parse --is-inside-work-tree` 返回 true）

若任一条件不满足，跳过本步骤并在 Phase 2 使用串行模式，无需通知用户。

**独立性判定 rubric**（保守原则：不确定就归同 group 或串行）：

主对话根据 Phase 1 的计划文本，逐条检查：

| 信号 | 判定 |
|------|------|
| 两个任务描述中出现相同文件路径 | 归为同一 group |
| 一个任务"修改 X 类"，另一个"新增 X 类的方法/属性" | 归为同一 group |
| 任务描述中出现"依赖 / 复用 / 调用 P<N>.<M>" | 显式依赖，后者 depends_on 前者 |
| 任务描述中出现"初始化 / 迁移 / 修改 schema / 修改 config"而多个任务共用 | 归为同一 group |
| 无以上信号，模块/文件不同 | 可标为独立 group |
| 无法判断 | 归为同一 group（保守降级，不标独立）|

**输出示例**（主对话实际输出时必须用真实任务替换下方占位文本，不得保留"描述"两字）：

```
## 并行分组建议
Group A（独立）: [P1.1 - <真实任务名>, P1.2 - <真实任务名>]  → 不共享文件/接口
Group B（独立）: [P1.3 - <真实任务名>, P1.4 - <真实任务名>]  → 不共享文件/接口
Group C（依赖 A）: [P1.5 - <真实任务名>]                     → 依赖 Group A 的输出

执行策略: 并行启动 Group A + Group B（共 2 个 worktree），Group A 合并后再启动 Group C。
最大并行数: 3 个 group（若超过，按任务量从大到小取前 3 组并行，其余串行追加）。

是否采用此分组？回复"是"继续，或指定修改（例："把 P1.3 移入 Group A"）。
```

**自动继续**：输出分组建议后，在同一轮次立即进入并行派发，无需等待用户回复。若用户在下一轮回复 "stop" / "串行" / "取消"，下次调用时降级串行（当前轮次已启动的 agent 不受影响）。

---

### === Phase 2 START: TDD Execution ===

**前置验证（必须完成）**:
- [ ] Phase 1 用户确认已收到？
- [ ] 确认文本包含以上任一关键词？
- [ ] 若计划项 ≥ 3 且是 git 仓库：Phase 1.5 分组建议已输出（自动继续，无需用户回复）？
- 如任一项为否，停止并返回对应 Phase 等待处理

**三无原则**（Phase 2 开始前）:
- 禁止在主对话中直接编写任何源代码
- 禁止做任何直接代码修改决定
- 禁止跳过测试而直接进入实现

**并行调度策略（计划项 ≥ 3 时启用）**：

在调用 tdd-guide 前，检查 Phase 1 计划中各任务项的依赖关系：

- 若所有项互相依赖或只有 1 组独立任务 → **串行模式**（默认，见下方）。
- 若存在 2+ 个无依赖的独立模块 / 文件组 → **并行模式**：
  1. 按独立性将计划项分组（不共享文件/接口的项归为同一 group）。
  2. 在**单条消息**中同时发出多个 Agent tool 调用，每组一个 `tdd-guide` agent，并设置 `isolation: "worktree"`，prompt 仅包含该组的计划项。
  3. 等待所有独立 group agent 完成。
  4. **先合并独立 group 到主分支**（执行 Worktree 合并 SOP 仅针对独立 group），再刷新基线：
     ```bash
     git checkout <main-branch> && git pull
     ```
  5. 然后为每个依赖 group **从最新主分支重新切出 worktree**，串行启动 tdd-guide agent，每个完成后立即合并到主分支再启动下一个。
  6. 全部 group 完成且合并后，统一运行覆盖率检查。

**Worktree 合并 SOP**（仅并行模式）：

> 同步说明：此段落逻辑在 `plan-tr.md`、`plan-t.md`、`plan-doc-tr.md` 中保持一致，修改时需同步三个文件（中文/中文/英文）。

> ⚠ 并发限制：同一主仓库同一时刻只允许一个 Claude 进程执行此 SOP。多个 Claude 并发运行时，请确保合并操作串行进行，否则 `git checkout` / `git merge` 会产生竞态，仍可能导致数据丢失。如需自动序列化，可在步骤 2 前用 `flock` 对主仓库目录加文件锁。

所有 tdd-guide agent 返回后，从每个 agent 的结果中提取：
- `worktree_path` — 隔离 worktree 的目录
- `branch_name` — 该 worktree 内创建的分支名

执行前在主对话中记录：
- `<main-repo>` — Phase 1.5 启动**前**所在的主仓库根目录（worktree 的父目录，可用 `pwd` 记录）

对每个 group 分支，按依赖顺序依次执行下方步骤 1–3（每次迭代替换 `worktree_path`、`branch_name`、`<标签>`）：

```bash
# ⚠ 执行前先将所有 <占位符> 替换为实际值；整个代码块须在单次 Bash 调用中执行
set -e          # 任一命令失败立即中止，防止错误级联
set -o pipefail # 管道中任一命令失败也触发 set -e
# ── 步骤 1：合并前将 worktree 分支 rebase 到最新主分支 ──
# 防止 worktree 基于旧基线，导致合并后静默覆盖他人已合入的改动
cd "<worktree_path>"
git fetch origin
if ! git rebase origin/<main-branch>; then
  echo "⚠ [BLOCKED] rebase 冲突，脚本已自动 abort。请到 <worktree_path> 手动 rebase 解决冲突后重新触发 SOP。"
  git rebase --abort 2>/dev/null || true
  exit 1
fi

# ── 步骤 2：切回主仓库，检查已跟踪文件的未提交改动，拉取最新 ──
# 注意：仅检测已跟踪文件（untracked 文件不影响 checkout，不纳入检测以避免误报）
cd "<main-repo>"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠ [BLOCKED] 主仓库存在未提交的已跟踪文件改动，切换分支可能导致丢失。请先 commit 或 stash。"
  git status --porcelain --untracked-files=no
  exit 1
fi
git checkout <main-branch>
git pull --ff-only origin <main-branch>

# ── 步骤 3：dry-run 检测 merge 冲突及删除型 lost update ──
if ! git merge --no-ff --no-commit "<branch_name>"; then
  echo "⚠ [BLOCKED] merge 冲突，已中止。冲突文件如下（解决后重新触发 SOP）："
  git diff --name-only --diff-filter=U
  git merge --abort
  exit 1
fi
DELETED=$(git diff --cached --diff-filter=D --name-only)
if [ -n "$DELETED" ]; then
  echo "⚠ [BLOCKED] 检测到以下文件将被删除，可能覆盖他人改动，已中止合并："
  echo "$DELETED"
  git merge --abort
  exit 1
fi
git commit -m "merge: TDD Group <标签>"
```

任何步骤失败（rebase 冲突、未提交改动检测、merge 冲突、删除型 lost update 检测）时，阻塞 Phase 2 完成，向用户报告详情，等待人工处理后再继续。

迭代规则：若某一 group 的步骤 1–3 有任一命令以非 0 退出，立即停止整个 SOP，不继续后续 group。已合并的 group 保留在主分支，未合并的 group worktree 保留待人工处理。

**并行 worktree 预提示**（输出后立即继续，不等待用户回复）：

> ⚠ 并行模式：每个 worktree 会独立运行依赖安装（`pub get` / `npm install` / `cargo build`），依赖较多时总耗时可能超过串行。

并行调度示例（单条消息，两个 tool call）：
```
Agent tool #1: subagent_type="tdd-guide", isolation="worktree"
  prompt: "执行 Group A 的严格 TDD: [P1.1, P1.2, P1.3]。
           RED→GREEN→IMPROVE→REPEAT。80% 最小覆盖率。"

Agent tool #2: subagent_type="tdd-guide", isolation="worktree"   ← 同一条消息
  prompt: "执行 Group B 的严格 TDD: [P1.4, P1.5]。
           RED→GREEN→IMPROVE→REPEAT。80% 最小覆盖率。"
```

**执行操作**（串行模式 / 单组降级）：

通过 Agent tool 调用 `tdd-guide` 子代理，让其按计划执行：

```
Agent tool with subagent_type: "tdd-guide"
prompt: "按照以下计划执行严格 TDD: [复制 Phase 1 最终计划]. 必须遵守 RED→GREEN→IMPROVE→REPEAT 循环。80% 最小覆盖率。"
```

**TDD 强制流程**（由 tdd-guide agent 执行）：

1. **RED**: 为每个计划项写**失败测试** FIRST
2. **GREEN**: 写最小代码使测试通过
3. **IMPROVE**: 重构并保持测试绿灯
4. **REPEAT**: 循环处理所有计划项

**覆盖率要求**：
- 通用代码：≥80%
- 安全关键 / 金融逻辑：100%

**Phase 2 完成标记**：

串行模式 — 单个 tdd-guide agent 返回后：
- ✅ 所有测试通过
- ✅ 覆盖率指标 ≥ 80%
- ✅ git log 显示测试文件先提交

并行模式 — 所有 group agent 返回且 worktree 合并完成后：
- ✅ 每个 group agent 均报告测试全部通过（聚合要求：任何 group 有失败测试均不达标）
- ✅ 合并后主分支上统一覆盖率 ≥ 80%（主对话直接用 Bash 工具运行 stack 对应命令：flutter test --coverage / jest --coverage / pytest --cov / go test -cover，运行一次，不按 group 单独算）
- ✅ 所有 group 合并无冲突
- ✅ 每个 group 的 worktree 内部 git log 显示该 group 的测试提交在其实现提交之前（合并后主分支的整体顺序不作要求）

若某 group 测试失败：
- **仅对该 group 重试**：丢弃该 group 的旧 worktree，从当前主分支重新切 worktree 后再次启动 tdd-guide agent（`isolation: "worktree"`）。其他已通过的 group 不重跑。
- **最大重试次数：3 轮**。超过 3 轮仍失败时，停止重试，向用户报告失败原因和建议（拆分任务 / 修改技术方案 / 降级串行后手动处理）。禁止在 3 轮失败后继续自动重试。
- 在该 group 通过（或人工处理）前，禁止进入 Phase 3。

---

### === Phase 3 START: Code Review Loop ===

**前置验证（必须完成）**:

串行模式：
- [ ] tdd-guide agent 是否真实被调用过？
- [ ] 所有测试通过？
- [ ] 覆盖率 ≥ 80%？

并行模式：
- [ ] 每个 group 的 tdd-guide agent 都真实被调用过？（逐 group 检查 Agent tool 调用记录）
- [ ] 每个 group 的测试全部通过？（任一 group 有失败 → 回到 Phase 2 对该 group 重试）
- [ ] 合并后主分支统一覆盖率 ≥ 80%？（Bash 运行结果）
- [ ] 所有 group worktree 都已合并到主分支？

任一项为否，停止并回到 Phase 2 处理对应问题。

**Code Review 闭环机制**（必须按以下循环执行，直到退出条件满足）：

```
LOOP:
  1. 调用 code-reviewer agent 执行审查
  2. 收集审查报告
  3. 如果存在 CRITICAL 或 HIGH 问题：
       → 调用 code-reviewer agent 执行修复
       → 修复完成后回到步骤 1（再次审查）
  4. 如果无 CRITICAL 且无 HIGH 问题：
       → 退出循环，Phase 3 完成
```

**退出条件**（必须同时满足）：
- 无任何 CRITICAL 问题（安全漏洞、硬编码密钥、注入风险）
- 无任何 HIGH 问题（大函数 >50行、深层嵌套 >4层、缺失错误处理）
- MEDIUM / LOW 问题已记录（无需阻塞退出）

**并行 Review（Phase 2 以并行模式运行时）**：

若 Phase 2 使用了并行模式，各 group 的 worktree 变更文件互相独立，可同时 review。在**单条消息**中并行启动多个 code-reviewer agent：

```
Agent tool #1: subagent_type="code-reviewer"
  prompt: "在 worktree-A 目录下运行 `git diff main...HEAD --name-only` 获取变更文件列表，
           审查这些文件。CRITICAL/HIGH/MEDIUM/LOW。
           修复 CRITICAL 和 HIGH。输出 [REVIEW_PASS] 或 [REVIEW_FAIL: ...]。"

Agent tool #2: subagent_type="code-reviewer"   ← 同一条消息
  prompt: "在 worktree-B 目录下运行 `git diff main...HEAD --name-only` 获取变更文件列表，
           审查这些文件。CRITICAL/HIGH/MEDIUM/LOW。
           修复 CRITICAL 和 HIGH。输出 [REVIEW_PASS] 或 [REVIEW_FAIL: ...]。"
```

汇总所有 group 的结果。若某 group 返回 `[REVIEW_FAIL]`：
- **仅重试该 group**：在该 group 的 worktree 目录下重新启动 code-reviewer agent 修复问题后再审查。已通过的 group 不重跑。
- **最大重试次数：3 轮**。超过 3 轮仍有 CRITICAL/HIGH 时，停止循环，向用户报告遗留问题列表，由人工决策是否合并。
- 重试时 prompt 仍使用 `git diff main...HEAD --name-only` 确定文件范围，不使用 `git diff HEAD`。

**每轮审查执行操作**（串行模式 / 单组降级）：

通过 Agent tool 调用 `code-reviewer` 子代理：

```
Agent tool with subagent_type: "code-reviewer"
prompt: "审核 git diff HEAD 中的所有变更文件。检查安全性（CRITICAL）、结构（HIGH）、模式（MEDIUM）、风格（LOW）。
修复所有 CRITICAL 和 HIGH 问题。修复完成后输出：[REVIEW_PASS] 表示无 CRITICAL/HIGH，或 [REVIEW_FAIL: <问题列表>] 表示仍有问题需要下一轮修复。"
```

**代码审查覆盖范围**：
1. 运行 `git diff --name-only HEAD` 识别已修改文件
2. 逐文件审查：
   - **CRITICAL**: 安全漏洞、硬编码密钥、注入风险
   - **HIGH**: 大函数 (>50行)、深层嵌套 (>4层)、缺失错误处理
   - **MEDIUM**: 变异模式、缺失测试、复杂度问题
   - **LOW**: 命名不一致、格式问题
3. 输出结构化审查报告（含严重级别 + 文件:行号）
4. **修复** CRITICAL 和 HIGH 问题
5. 在报告末尾输出 `[REVIEW_PASS]` 或 `[REVIEW_FAIL: ...]`

**循环记录**（主对话必须维护）：

串行模式：
| 轮次 | CRITICAL | HIGH | MEDIUM | LOW | 结果 |
|------|----------|------|--------|-----|------|
| #1 | ? | ? | ? | ? | PASS/FAIL |
| #2（如有）| ? | ? | ? | ? | PASS/FAIL |

并行模式 — 每个 group 独立记录，哪个 group 失败就只重跑那个 group：
| Group | 轮次 | CRITICAL | HIGH | MEDIUM | LOW | 结果 |
|-------|------|----------|------|--------|-----|------|
| A | #1 | ? | ? | ? | ? | PASS/FAIL |
| A | #2（仅在失败时重试）| ? | ? | ? | ? | PASS/FAIL |
| B | #1 | ? | ? | ? | ? | PASS/FAIL |

**Phase 3 完成标记**：
- 串行：最后一轮返回 `[REVIEW_PASS]`，循环记录无遗留 CRITICAL/HIGH。
- 并行：循环记录中**每个 group** 的最后一轮均为 `[REVIEW_PASS]`。任何 group 仍有 `[REVIEW_FAIL]` 则 Phase 3 未完成。

---

## 收尾自检报告（强制输出）

在完全结束前，输出如下表格验证三个 Phase 都被正确执行：

| Phase | 状态 | 证据 |
|-------|------|------|
| **Phase 1: Plan** | ✅/❌ | 用户确认原文 + 任务计划内容 |
| **Phase 2: TDD** | ✅/❌ | tdd-guide agent 调用 ID + 最终测试通过数 + 覆盖率 % |
| **Phase 3: Review Loop** | ✅/❌ | 总轮次 + 每轮 CRITICAL/HIGH 问题数 + 最终 [REVIEW_PASS] 标记 |

**验收标准**：
- 表格中任何一项为 ❌，命令视为**失败**
- 所有项都必须为 ✅，才能输出最终总结
- 如有 ❌，补做相应 Phase 直到为 ✅

---

## 最终总结（仅在所有 Phase ✅ 后输出）

汇总：
- 实现了什么功能 / 解决了什么问题
- 最终测试结果（通过数 / 总数）+ 覆盖率 %
- Code Review 循环：共经历几轮、每轮修复了哪些 CRITICAL/HIGH 问题
- 最终状态：[REVIEW_PASS]，无遗留 CRITICAL 或 HIGH 问题
- 遗留的 MEDIUM/LOW 问题列表（供后续参考）
