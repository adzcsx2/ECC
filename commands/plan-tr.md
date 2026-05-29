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

**触发门前置检查**（进入触发门前必须完成，否则直接使用串行模式）：

```bash
# ⚠ Bash 工具每次调用是独立进程，变量不持久。此块的作用是 echo 字面值，
# 主对话从 stdout 中抽取 RECORDED_MAIN_REPO= 和 RECORDED_MAIN_BRANCH= 的值，
# 在后续所有含 <MAIN_REPO> / <MAIN_BRANCH> 的 Bash 调用中以字面量替换占位符再执行。
set -e
MAIN_REPO=$(git rev-parse --show-toplevel)
MAIN_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "RECORDED_MAIN_REPO=$MAIN_REPO"
echo "RECORDED_MAIN_BRANCH=$MAIN_BRANCH"

# 主仓不能有未提交的已跟踪文件改动（stash / cherry-pick 均不是合法绕过手段）
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠ [BLOCKED] 主仓库存在未提交的已跟踪文件改动。请先 commit 再启动并行模式。"
  echo "  禁止用 git stash 绕过此检查 —— stash 在后续合并时会产生静默冲突。"
  git status --porcelain --untracked-files=no
fi
# 主对话约定：若 stdout 包含 [BLOCKED]，将下方触发门第三条标为 ❌，Phase 2 使用串行模式
```

**触发门**（全部满足才执行本步骤，否则直接跳到 Phase 2 串行模式）：

- [ ] 计划项总数 ≥ 3
- [ ] 当前目录是 git 仓库（`git rev-parse --is-inside-work-tree` 返回 true）
- [ ] stdout 不含 `[BLOCKED]`（上方前置检查无未提交改动）

若任一条件不满足，跳过本步骤并在 Phase 2 使用串行模式，无需通知用户。

**独立性判定 rubric**（保守原则：不确定就归同 group 或串行）：

主对话根据 Phase 1 的计划文本，逐条检查：

| 信号                                                                    | 判定                                 |
| ----------------------------------------------------------------------- | ------------------------------------ |
| 两个任务描述中出现相同文件路径                                          | 归为同一 group                       |
| 一个任务"修改 X 类"，另一个"新增 X 类的方法/属性"                       | 归为同一 group                       |
| 任务描述中出现"依赖 / 复用 / 调用 P<N>.<M>"                             | 显式依赖，后者 depends_on 前者       |
| 任务描述中出现"初始化 / 迁移 / 修改 schema / 修改 config"而多个任务共用 | 归为同一 group                       |
| 无以上信号，模块/文件不同                                               | 可标为独立 group                     |
| 无法判断                                                                | 归为同一 group（保守降级，不标独立） |

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
  3. 等待所有独立 group agent 完成，并完成 worktree 立刻校验。
  4. 将这些已校验的 group 交给 Phase 3 的 review 队列。**只有返回 `[REVIEW_PASS]` 的 group 才能进入串行 merge 队列。**
  5. 串行 merge 队列一次只处理一个 review-pass group（执行下方 Worktree 合并 SOP），每次成功后刷新基线：
     ```bash
     git checkout <MAIN_BRANCH> && git pull --ff-only origin <MAIN_BRANCH>
     ```
  6. 然后为每个依赖 group **从最新主分支重新切出 worktree**，串行启动 `tdd-guide`，再经过同一条 Phase 3 review → merge gate；只有前一个 group merge 成功后才启动下一个。
  7. 全部已通过 review 的 group 完成合并后，统一运行覆盖率检查。

**Review-pass Worktree 合并 SOP**（仅并行模式；由 Phase 3 的 merge queue 调用）：

> 同步说明：review-before-merge 共享段落（本段 Worktree 合并 SOP、以及 Phase 3 的并行 review prompt）以 `docs/command-templates/plan-worktree-review-merge.zh-CN.md` 为中文模板、以 `docs/command-templates/plan-worktree-review-merge.en.md` 为英文模板。命令安装时会原样复制 `commands/*.md`，运行时不支持 include，因此正文必须保持内联；`tests/commands/plan-pipeline-order.test.js` 会校验同步。

> ⚠ 并发限制：同一主仓库同一时刻只允许一个 Claude 进程执行此 SOP。多个 Claude 并发运行时，请确保合并操作串行进行，否则 `git checkout` / `git merge` 会产生竞态，仍可能导致数据丢失。如需自动序列化，可在步骤 2 前用 `flock` 对主仓库目录加文件锁。

> ⚠ 准入门：只有最后一轮 review 明确输出 `[REVIEW_PASS]` 的 group 才允许执行此 SOP。禁止合并任何尚未通过 review 的 worktree。

所有 tdd-guide agent 返回后，从每个 agent 的**最终消息末尾两行**严格抽取：

- `WORKTREE_PATH: <绝对路径>` — 隔离 worktree 的目录
- `BRANCH_NAME: <分支名>` — 该 worktree 内创建的分支名

> ⚠ 抽取规则：用正则 `^WORKTREE_PATH: (.+)$` 和 `^BRANCH_NAME: (.+)$` 匹配。若任一字段缺失，**视为 agent 异常**，立刻停止 SOP，报告"agent 未输出 worktree 信息，可能未 commit 导致 worktree 被自动清理"，等待人工处理。禁止猜测路径。

**agent 返回后立刻校验（每个 group，提取路径后立即执行）**：

```bash
# 将 <WORKTREE_PATH> 替换为 WORKTREE_PATH: 行抽取的绝对路径，
# 将 <BRANCH_NAME> 替换为 BRANCH_NAME: 行抽取的分支名
[ -d "<WORKTREE_PATH>" ] || { echo "⚠ [FATAL] worktree 目录不存在: <WORKTREE_PATH>。可能原因：agent 未 commit / agent 异常退出 / harness 主动清理。请检查 agent 完整返回内容。停止 SOP。"; exit 1; }
git -C "<WORKTREE_PATH>" rev-parse "<BRANCH_NAME>" >/dev/null 2>&1 || { echo "⚠ [FATAL] 分支不存在: <BRANCH_NAME>。停止 SOP。"; exit 1; }
git -C "<WORKTREE_PATH>" log --oneline -1
echo "✅ worktree 校验通过: <WORKTREE_PATH> @ <BRANCH_NAME>"
```

执行前在主对话中记录（Phase 1.5 前置检查 stdout 中已 echo）：

- `<MAIN_REPO>` — 从 `RECORDED_MAIN_REPO=` 行抽取的字面路径，替换进后续所有 bash 块
- `<MAIN_BRANCH>` — 从 `RECORDED_MAIN_BRANCH=` 行抽取的字面分支名，替换进后续所有 bash 块

对每个 group 分支，按依赖顺序依次执行下方步骤 1–3（每次迭代替换 `<WORKTREE_PATH>`、`<BRANCH_NAME>`、`<MAIN_REPO>`、`<MAIN_BRANCH>`、`<标签>`）：

```bash
# ⚠ 执行前先将所有 <占位符> 替换为实际值；整个代码块须在单次 Bash 调用中执行
set -e          # 任一命令失败立即中止，防止错误级联
set -o pipefail # 管道中任一命令失败也触发 set -e
# ── 步骤 1：合并前将 worktree 分支 rebase 到最新主分支 ──
# 防止 worktree 基于旧基线，导致合并后静默覆盖他人已合入的改动
cd "<WORKTREE_PATH>"
git fetch origin
if ! git rebase origin/<MAIN_BRANCH>; then
  echo "⚠ [BLOCKED] rebase 冲突，脚本已自动 abort。请到 <WORKTREE_PATH> 手动 rebase 解决冲突后重新触发 SOP。"
  git rebase --abort 2>/dev/null || true
  exit 1
fi

# ── 步骤 2：切回主仓库，检查已跟踪文件的未提交改动，拉取最新 ──
# 注意：仅检测已跟踪文件（untracked 文件不影响 checkout，不纳入检测以避免误报）
cd "<MAIN_REPO>"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠ [BLOCKED] 主仓库存在未提交的已跟踪文件改动，切换分支可能导致丢失。请先 commit。"
  echo "  禁止用 git stash 绕过此检查，禁止用 git cherry-pick 替代 merge。"
  git status --porcelain --untracked-files=no
  exit 1
fi
git checkout <MAIN_BRANCH>
git pull --ff-only origin <MAIN_BRANCH>

# ── 步骤 3：dry-run 检测 merge 冲突及删除型 lost update ──
if ! git merge --no-ff --no-commit "<BRANCH_NAME>"; then
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
MERGE_COMMIT=$(git rev-parse HEAD)
echo "RECORDED_MERGE_COMMIT_<标签>=$MERGE_COMMIT"
```

任何步骤失败（rebase 冲突、未提交改动检测、merge 冲突、删除型 lost update 检测）时，阻塞当前 group 的合并并停止 merge queue，向用户报告详情，等待人工处理后再继续。

迭代规则：若某一 group 的步骤 1–3 有任一命令以非 0 退出，立即停止整个 SOP，不继续后续 group。已合并的 group 保留在主分支，未合并的 group worktree 保留待人工处理。

**并行 worktree 预提示**（输出后立即继续，不等待用户回复）：

> ⚠ 并行模式：每个 worktree 会独立运行依赖安装（`pub get` / `npm install` / `cargo build`），依赖较多时总耗时可能超过串行。

并行调度示例（单条消息，两个 tool call）：

```
Agent tool #1: subagent_type="tdd-guide", isolation="worktree"
  prompt: "执行 Group A 的严格 TDD: [P1.1, P1.2, P1.3]。
           RED→GREEN→IMPROVE→REPEAT。80% 最小覆盖率。
           完成所有工作后，必须执行 git add -A && git commit（至少一次），
           并在最终消息的最后两行**严格**输出（格式不能变，主对话依赖此格式）：
           WORKTREE_PATH: <当前 worktree 绝对路径>
           BRANCH_NAME: <当前分支名>"

Agent tool #2: subagent_type="tdd-guide", isolation="worktree"   ← 同一条消息
  prompt: "执行 Group B 的严格 TDD: [P1.4, P1.5]。
           RED→GREEN→IMPROVE→REPEAT。80% 最小覆盖率。
           完成所有工作后，必须执行 git add -A && git commit（至少一次），
           并在最终消息的最后两行**严格**输出（格式不能变，主对话依赖此格式）：
           WORKTREE_PATH: <当前 worktree 绝对路径>
           BRANCH_NAME: <当前分支名>"
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
- ✅ **集成测试无虚假 mock 通过**：先识别集成测试目录（候选：`tests/integration/`、`test/integration/`、`integration_test/`、`__tests__/integration/`、文件名匹配 `*_integration_test.*`、`*.integration.test.*`、`*IntegrationTest.*`），再在命中的目录或文件中执行 `grep -rEn "jest\.mock|vi\.mock|sinon\.(stub|mock)|Mockito\.(mock|when)|gomock|MagicMock|mock\.patch|monkeypatch|stub\(" <hits>`；如果目录全部不存在，必须要求 tdd-guide agent 在报告中**明示项目实际的集成测试位置**，禁止以"目录不存在 → 抽查通过"作为门禁结论
- ✅ **凭据缺失策略合规**：若存在 skip，每个 skip 必须有明确文字原因（如 "DEEPSEEK_API_KEY not set"），不得静默 skip 或以 mock 代替
- ✅ **RED 真实性**：Phase 2 报告必须列出每个测试初次失败的真实原因（业务逻辑 / 连接错误 / auth 错误），不允许"插入 mock 后变绿"作为 RED→GREEN 的过渡手段

并行模式 — 所有 group agent 返回且 worktree 完成立刻校验后：

- ✅ 每个 group agent 均报告测试全部通过（聚合要求：任何 group 有失败测试均不达标）
- ✅ 每个 group 的 worktree 已通过目录/分支存在性校验，准备进入 Phase 3 review
- ✅ 每个 group 的 worktree 内部 git log 显示该 group 的测试提交在其实现提交之前（合并后主分支的整体顺序不作要求）
- ✅ **集成测试无虚假 mock 通过**（每个 group 均须通过 grep 抽查，同串行模式标准）
- ✅ **凭据缺失策略合规**（每个 group 的 skip 均有明确原因，同串行模式标准）
- ✅ **RED 真实性**（每个 group 的 Phase 2 报告均须列出 RED 阶段真实失败原因，同串行模式标准）
- ✅ 任何 group 在最后一轮 review 输出 `[REVIEW_PASS]` 之前不得执行合并 SOP

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
- [ ] 每个 group 的 worktree 都已通过立刻校验且仍可用于 review？（若某 group 在 review 前被清理 → 回到 Phase 2 重跑该 group，禁止直接合并）

任一项为否，停止并回到 Phase 2 处理对应问题。

**Code Review 闭环机制**（必须按以下循环执行，直到退出条件满足）：

```
LOOP（每个 group 独立执行）:
  1. 调用 code-reviewer agent 在该 group 的 worktree 内执行审查
  2. 收集审查报告
  3. 如果存在 CRITICAL 或 HIGH 问题：
    → 调用 code-reviewer agent 在同一 worktree 内修复
    → 修复完成后回到步骤 1（再次审查）
  4. 如果该 group 返回 [REVIEW_PASS]：
    → 将该 group 放入串行 merge 队列
    → merge 队列获取独占锁后执行 Worktree 合并 SOP
  5. 仅当 merge 成功时，标记该 group 完成；merge 失败则停止队列并等待人工处理
```

**退出条件**（必须同时满足）：

- 无任何 CRITICAL 问题（安全漏洞、硬编码密钥、注入风险）
- 无任何 HIGH 问题（大函数 >50行、深层嵌套 >4层、缺失错误处理）
- MEDIUM / LOW 问题已记录（无需阻塞退出）

**并行 Review（Phase 2 以并行模式运行时）**：

若 Phase 2 使用了并行模式，各 group 的 worktree 变更文件互相独立，可同时 review。**任何 merge 发生前必须先完成该 group 的 review。** 在**单条消息**中并行启动多个 code-reviewer agent：

```
Agent tool #1: subagent_type="code-reviewer"
  prompt: "cd <WORKTREE_PATH_A>（Group A 的 worktree 绝对路径）。
           先验证目录存在：[ -d <WORKTREE_PATH_A> ] || exit 1
           运行 `git diff <MAIN_BRANCH>...HEAD --name-only` 获取变更文件列表，
           审查这些文件。CRITICAL/HIGH/MEDIUM/LOW。
           修复 CRITICAL 和 HIGH。输出 [REVIEW_PASS] 或 [REVIEW_FAIL: ...]。"

Agent tool #2: subagent_type="code-reviewer"   ← 同一条消息
  prompt: "cd <WORKTREE_PATH_B>（Group B 的 worktree 绝对路径）。
           先验证目录存在：[ -d <WORKTREE_PATH_B> ] || exit 1
           运行 `git diff <MAIN_BRANCH>...HEAD --name-only` 获取变更文件列表，
           审查这些文件。CRITICAL/HIGH/MEDIUM/LOW。
           修复 CRITICAL 和 HIGH。输出 [REVIEW_PASS] 或 [REVIEW_FAIL: ...]。"
```

> 注：`<WORKTREE_PATH_A>` 等为 Phase 2 立刻校验通过的各 group `WORKTREE_PATH` 字面值；`<MAIN_BRANCH>` 为 Phase 1.5 前置检查记录的字面值。若 worktree 在 review 前被 harness 清理，视为该 group 未完成 review，必须从当前主分支重新切出 worktree 重跑该 group；**禁止**退化为“先 merge 再看 merge commit diff”。

汇总所有 group 的结果。若某 group 返回 `[REVIEW_FAIL]`：

- **仅重试该 group**：
  - 若 worktree 仍存在：在该 group 的 worktree 目录下重新启动 code-reviewer agent。
  - 若 worktree 已被 harness 清理：从当前主分支重新切该 group 的 worktree，并回到 Phase 2 重跑该 group；在完成 review 前不得合并。
  - 已通过的 group 不重跑。
- **最大重试次数：3 轮**。超过 3 轮仍有 CRITICAL/HIGH 时，停止循环，向用户报告遗留问题列表，由人工决策是否合并。
- 当某 group 返回 `[REVIEW_PASS]` 时，将其加入串行 merge 队列。merge 队列一次只处理一个 group，并在加锁后执行 Worktree 合并 SOP。
- 重试时文件范围：仅在 worktree 仍存在时使用 `git diff <MAIN_BRANCH>...HEAD --name-only`。不使用 merge-commit diff，也不使用 `git diff HEAD`。

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
- 并行：循环记录中**每个 group** 的最后一轮均为 `[REVIEW_PASS]`，且每个 review-pass group 都已通过串行 merge 队列成功合并。之后主对话在主分支统一运行一次覆盖率检查，结果需 ≥ 80%。任何 group 仍有 `[REVIEW_FAIL]` 或 merge 未完成，则 Phase 3 未完成。

---

## 收尾自检报告（强制输出）

在完全结束前，输出如下表格验证三个 Phase 都被正确执行：

| Phase                    | 状态  | 证据                                                         |
| ------------------------ | ----- | ------------------------------------------------------------ |
| **Phase 1: Plan**        | ✅/❌ | 用户确认原文 + 任务计划内容                                  |
| **Phase 2: TDD**         | ✅/❌ | tdd-guide agent 调用 ID + 最终测试通过数 + 覆盖率 %          |
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
