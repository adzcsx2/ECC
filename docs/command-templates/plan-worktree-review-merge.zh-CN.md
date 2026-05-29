# Review-Before-Merge Shared Template (zh-CN)

此文件是 `plan-t` / `plan-tr` / `plan-doc-tr` 在 worktree review-before-merge 语义上的共享维护模板。

- 命令安装时会原样复制 `commands/*.md`
- 运行时不支持 include，因此命令正文必须保持内联
- `tests/commands/plan-pipeline-order.test.js` 负责校验下面这些共享段落与命令正文同步

## Review-Pass Merge SOP

**Review-pass Worktree 合并 SOP**（仅并行模式；由 Phase 3 的 merge queue 调用）：

> 同步说明：review-before-merge 共享段落（Phase 2 的并发 dispatch/setup 重试规则、本段 Worktree 合并 SOP、以及 Phase 3 的并行 review prompt）以 `docs/command-templates/plan-worktree-review-merge.zh-CN.md` 为中文模板、以 `docs/command-templates/plan-worktree-review-merge.en.md` 为英文模板。命令安装时会原样复制 `commands/*.md`，运行时不支持 include，因此正文必须保持内联；`tests/commands/plan-pipeline-order.test.js` 会校验同步。

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

若上述立刻校验失败，且该 agent **已经输出过** `WORKTREE_PATH` / `BRANCH_NAME`，则**这不是 dispatch failure**，而是 `worktree_lost_after_dispatch`：不得进入 review 或 merge；必须从当前主分支重新切该 group 的 worktree，并回到 Phase 2 重跑该 group。其他已通过立刻校验的 group 不重跑。该类重试最多 3 轮（**每个 group 独立计数**）；超过后将该 group 标记为 `worktree_recovery_failed`，Phase 2 不得完成；已在运行的其他 group 可以继续，但禁止进入依赖该 group 的后续 group 和 Phase 3。向用户报告最后一次错误，并建议检查残留 worktree、锁文件（如 `.git/config.lock`）或降级为串行模式。

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

## Dispatch Failure Retry Policy

**并发 dispatch / setup 失败处理**（仅适用于该 group 尚未真正开始 TDD 时）：

- 若某 group 在 worktree 创建、branch 创建或 agent 启动阶段失败，且失败前**未输出** `WORKTREE_PATH` / `BRANCH_NAME`、也**没有任何 RED 阶段测试结果**，则视为 **dispatch / setup failure**，不是“测试失败”。
- 常见信号：`could not lock config file`、`failed to create worktree`、`unable to create branch`、`already exists` 等 git/worktree 初始化错误。
- 处理规则：
  1. **只重试该 group 的派发 / 创建**，不重跑其他已成功启动的 group。
  2. 若运行时支持，在初始尝试失败后，于**同一轮次**对该 group 最多再做 3 次短退避重试（总尝试次数 = 1 次初始 + 3 次重试，例如 1s / 2s / 4s）；若运行时不支持等待，则在下一个可用 turn **优先立即重试**，**不得等待其他 group 全部完成后再处理**。
  3. 已成功启动的 group 保持并发执行；不得因为某个 group 的 dispatch 失败就把整批降级成“等当前 group 跑完再说”。
  4. 若重试成功，该 group 视为**首次真正启动**，从 RED→GREEN→IMPROVE 开始；TDD 阶段失败计数从 0 开始，dispatch 重试次数不计入后续“测试失败”的 3 轮上限。
  5. 若 3 次派发重试后仍失败，将该 group 标记为 `dispatch_blocked`。此时 Phase 2 不得完成；已在运行的 group 可以继续，但禁止进入依赖该 group 的后续 group，也禁止进入 Phase 3。向用户报告最后一次错误，并建议检查 `.git/config.lock`、残留 worktree，或降级为串行模式。

## Parallel Review Prompt

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
