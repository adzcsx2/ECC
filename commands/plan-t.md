---
description: Plan + TDD + Code Review (serial pipeline, single worktree isolation, mkdir-lock CAS merge)
---

# Plan-T: Plan + TDD + Code Review（全流水线）

**🚨 关键约束**：本命令是四阶段强制管道，全部串行执行。绝不允许：

- 跳过任何 Phase
- 用口头声明代替实际 Agent tool 调用
- 在主对话中直接编写代码（所有实现必须由 `tdd-guide` agent 在隔离 worktree 内完成）
- TDD 顺序错误（必须先写测试，再写实现）
- 未通过 Phase 3 `[REVIEW_PASS]` 就进入 Phase 4 合并

任何违反上述约束的执行都视为**命令失败**，必须回头重做。

---

## Plan-T 执行流程

任务: $ARGUMENTS

---

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

**硬检查**：用户确认文本必须包含以下任一关键词才能继续：

- "yes" / "确认" / "proceed" / "go ahead" / "可以" / "好的" / "同意"

如果未检测到确认，停止并要求用户明确说"确认"。

### === Phase 1 DONE ===

---

### === Phase 2 START: TDD 执行（隔离 worktree）===

**前置验证**：

- [ ] Phase 1 用户确认已收到？
- [ ] 确认文本包含以上任一关键词？

如任一项为否，停止并等待用户确认。

**三无原则**（Phase 2 开始前）：

- 禁止在主对话中直接编写任何源代码
- 禁止做任何直接代码修改决定
- 禁止跳过测试而直接进入实现

**Worktree 初始化**：

```bash
# 记录主仓信息（后续 bash 块替换占位符用）
set -e
MAIN_REPO=$(git rev-parse --show-toplevel)
MAIN_BRANCH=$(git rev-parse --abbrev-ref HEAD)
# TASK_SLUG: 从 $ARGUMENTS 自动生成——转小写、非字母数字替换为连字符、去首尾连字符、限40字符
TASK_SLUG=$(printf "%s" "$ARGUMENTS" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
  | cut -c1-40)
[ -n "$TASK_SLUG" ] || TASK_SLUG="task"
# 加入 PID 防止同秒并发时分支名冲突
TIMESTAMP=$(date +%Y%m%d-%H%M%S)-$$
BRANCH_NAME="ecc/${TASK_SLUG}-${TIMESTAMP}"
WORKTREE_PATH="${MAIN_REPO}/../$(basename ${MAIN_REPO})-ecc-worktrees/${TASK_SLUG}-${TIMESTAMP}"
echo "RECORDED_MAIN_REPO=$MAIN_REPO"
echo "RECORDED_MAIN_BRANCH=$MAIN_BRANCH"
echo "RECORDED_BRANCH_NAME=$BRANCH_NAME"
echo "RECORDED_WORKTREE_PATH=$WORKTREE_PATH"
```

主对话必须从 stdout 提取并记录这四个字面值，后续所有 bash 块中用实际值替换 `<MAIN_REPO>`、`<MAIN_BRANCH>`、`<BRANCH_NAME>`、`<WORKTREE_PATH>`。

```bash
# 建立隔离 worktree + 在 worktree 分支上打回滚锚点标签
set -e
mkdir -p "$(dirname "<WORKTREE_PATH>")"
git worktree add "<WORKTREE_PATH>" -b "<BRANCH_NAME>"
# ⚠ 标签必须在 worktree 内打，才能用于真实 reset 回滚
git -C "<WORKTREE_PATH>" tag "ecc-premerge-<TASK_SLUG>-<TIMESTAMP>"
echo "✅ worktree 创建成功: <WORKTREE_PATH> @ <BRANCH_NAME>"
```

**调用 tdd-guide 子代理（串行，单 agent，在 worktree 内执行）**：

```
Agent tool with subagent_type: "tdd-guide"
prompt: "在以下 worktree 目录中执行严格 TDD: <WORKTREE_PATH>
         必须先 cd 到该目录，所有文件操作均在该目录内进行。

         按照以下计划执行: [复制 Phase 1 最终计划]

         必须遵守 RED→GREEN→IMPROVE→REPEAT 循环：
         1. RED: 为每个计划项先写失败测试，运行确认失败（输出失败截图/日志）
         2. GREEN: 写最小实现使测试通过，运行确认通过
         3. IMPROVE: 重构，保持测试绿灯

         覆盖率要求: ≥80%（安全关键/金融逻辑: 100%）
         完成所有工作后执行 git add -A && git commit（至少一次）。
         报告中必须包含：失败测试列表（RED 阶段截图）、通过测试数量、覆盖率百分比。"
```

**Phase 2 完成校验（tdd-guide 返回后立刻执行）**：

```bash
[ -d "<WORKTREE_PATH>" ] || { echo "⚠ [FATAL] worktree 目录不存在: <WORKTREE_PATH>"; exit 1; }
git -C "<WORKTREE_PATH>" rev-parse "<BRANCH_NAME>" >/dev/null 2>&1 \
  || { echo "⚠ [FATAL] 分支不存在: <BRANCH_NAME>"; exit 1; }
git -C "<WORKTREE_PATH>" log --oneline -3
echo "✅ worktree 校验通过"
```

质量门（全部满足才能进 Phase 3）：

- [ ] 所有测试通过，覆盖率 ≥ 80%
- [ ] tdd-guide 报告中包含 RED 阶段失败测试证据
- [ ] **集成测试无虚假 mock**：识别集成测试目录并运行
  `grep -rEn "jest\.mock|vi\.mock|sinon\.(stub|mock)|MagicMock|mock\.patch" <integration-test-dir>`；若无集成测试目录，tdd-guide 必须在报告中明示
- [ ] **凭据缺失策略合规**：所有 skip 必须有明确文字原因，禁止静默 skip

### === Phase 2 DONE ===

---

### === Phase 3 START: Code Review 闭环 ===

**前置验证**：

- [ ] tdd-guide agent 真实调用过？
- [ ] 所有测试通过且覆盖率达标？
- [ ] worktree 目录和分支仍存在？

任一项为否，停止并回到 Phase 2 处理对应问题。

**Code Review 闭环**（最多 3 轮，直到 `[REVIEW_PASS]`）：

每轮调用：

```
Agent tool with subagent_type: "code-reviewer"
prompt: "cd <WORKTREE_PATH>
         [ -d <WORKTREE_PATH> ] || exit 1

         运行 git diff <MAIN_BRANCH>...HEAD --name-only 获取变更文件。
         逐文件审查（严重等级从高到低）：
           CRITICAL: 安全漏洞、硬编码密钥/令牌、SQL 注入、XSS 风险
           HIGH: 函数超 50 行、嵌套超 4 层、缺失错误处理、未验证用户输入
           MEDIUM: 变异模式、缺失测试、可维护性问题
           LOW: 命名不一致、格式问题

         修复所有 CRITICAL 和 HIGH 问题。
         ⚠ 每处修复完成后必须重新运行相关测试；若修改影响公共接口或核心逻辑，运行完整测试套件。
         最终输出 [REVIEW_PASS] 或 [REVIEW_FAIL: <问题列表>]。"
```

循环记录（主对话维护）：

| 轮次 | CRITICAL | HIGH | MEDIUM | LOW | 结果 |
|------|----------|------|--------|-----|------|
| #1 | ? | ? | ? | ? | PASS/FAIL |
| #2（如有）| ? | ? | ? | ? | PASS/FAIL |
| #3（如有）| ? | ? | ? | ? | PASS/FAIL |

**退出条件**：

- 无 CRITICAL、无 HIGH → `[REVIEW_PASS]`，进入 Phase 4
- 3 轮后仍有 CRITICAL/HIGH → 停止，向用户报告遗留问题，由用户决策是否继续

### === Phase 3 DONE ===

---

### === Phase 4 START: 本地 CAS 原子合并 ===

**前置验证**：

- [ ] Phase 3 最后一轮返回了 `[REVIEW_PASS]`？

否则停止，回到 Phase 3。

**设计原则（local-only）**：

- **纯本地协议**：所有 Claude 进程在同一台机器操作同一仓库，远端（origin）不参与并发协调；push 由用户手动执行
- **CAS 版本号 = 本地 `<MAIN_BRANCH>` HEAD**：唯一的共享状态是本地 main，不需要 fetch
- **锁外做慢活**：rebase + 解冲突 + 跑测试，与其他 Claude 进程并发无害
- **锁内永远只做毫秒级操作**：读本地 HEAD、CAS 校验、`git merge --ff-only`，**严禁在锁内执行 rebase**
- **`mkdir` 原子锁**：`mkdir` 是 POSIX 原子操作，macOS/Linux 均可用，无任何外部依赖
- 无文件交集：锁外 rebase 后重新抢锁 + quick check，不重跑全量测试
- 有文件交集：回锁外 rebase + 全量测试（最多 5 次）

---

#### 第一段：锁外准备（慢活，可与其他 Claude 并发）

```bash
# 本地 CAS：直接读本地 main HEAD（local-only，不依赖远端）
set -e
BASE=$(git -C "<MAIN_REPO>" rev-parse refs/heads/<MAIN_BRANCH>)
echo "RECORDED_BASE=$BASE"
```

主对话记录 `RECORDED_BASE` 的字面值。

```bash
# rebase 到本地最新 <MAIN_BRANCH>（用完整 ref，避免与 tag/remote 名歧义）
set -e
cd "<WORKTREE_PATH>"
git rebase refs/heads/<MAIN_BRANCH>
echo "✅ rebase 完成（无冲突）"
```

如果 rebase 报告冲突，执行 **AI 自动解冲突**：

对每个冲突文件：

1. 读取 `<<<<<<<`、`=======`、`>>>>>>>` 三段内容
2. 分析双方改动意图：
   - 改动不重叠（不同函数/行）→ 合并保留双方
   - 一边是格式/重命名，另一边是逻辑 → 保留逻辑并应用格式
   - 真正语义冲突（同一逻辑两边都改了）→ **停止自动解，立即 abort + reset，由人工处理**
3. 写回解决后的文件，执行 `git add <file>`
4. 全部文件解完后执行 `git rebase --continue`

```bash
# 解冲突后跑完整测试验证
set -e
cd "<WORKTREE_PATH>"
# 根据项目类型选择：npm test / pytest / go test ./... 等
<test-command>
echo "✅ 解冲突后测试通过"
```

若测试失败：

- 重新分析该文件冲突块，重解，重测
- 若仍失败，abort + 重置到锚点并停止：

```bash
git -C "<WORKTREE_PATH>" rebase --abort
git -C "<WORKTREE_PATH>" reset --hard "ecc-premerge-<TASK_SLUG>-<TIMESTAMP>"
echo "❌ 无法自动解冲突，已重置到锚点 ecc-premerge-<TASK_SLUG>-<TIMESTAMP>"
echo "请人工处理冲突后重试 Phase 4。"
```

---

#### 第二段：抢锁，锁内原子合并（毫秒级，禁止 rebase）

**锁机制**：`mkdir` 是 POSIX 原子操作，无外部依赖，macOS/Linux 均可用。
`mkdir` 成功即获得锁；失败则 1 秒后重试（低频等待，非忙轮询）。
进程退出时通过 `trap` 自动释放锁目录。若进程被强杀导致锁残留，可检测 PID 文件判断锁是否有效。

```bash
set -e
LOCK_DIR="<MAIN_REPO>/.git/ecc-merge.lockdir"
LOCK_PID_FILE="$LOCK_DIR/pid"
RECORDED_BASE="<RECORDED_BASE>"

# 抢锁（阻塞等待）
while ! mkdir "$LOCK_DIR" 2>/dev/null; do
  # 检查持锁进程是否仍存活；若已死，先原子改名再删除，避免误删其他进程刚创建的新锁
  if [ -f "$LOCK_PID_FILE" ] && ! kill -0 "$(cat "$LOCK_PID_FILE")" 2>/dev/null; then
    STALE_LOCK_DIR="${LOCK_DIR}.stale.$$"
    if mv "$LOCK_DIR" "$STALE_LOCK_DIR" 2>/dev/null; then
      echo "⚠ 发现陈旧锁（持锁进程已退出），清理: $STALE_LOCK_DIR"
      rm -rf "$STALE_LOCK_DIR"
      continue
    fi
  fi
  echo "等待合并锁: $LOCK_DIR"
  sleep 1
done
echo $$ > "$LOCK_PID_FILE"
trap 'rm -rf "$LOCK_DIR"' EXIT INT TERM
echo "✅ 已获得合并锁"

# CAS：读本地分支 HEAD（不是 origin，因为不自动 push）
NOW=$(git -C "<MAIN_REPO>" rev-parse refs/heads/<MAIN_BRANCH>)

if [ "$NOW" = "$RECORDED_BASE" ]; then
  # 基线未变，直接 ff-only 合并（毫秒级）
  git -C "<MAIN_REPO>" checkout <MAIN_BRANCH>
  git -C "<MAIN_REPO>" merge --ff-only "refs/heads/<BRANCH_NAME>"
  echo "MERGE_RESULT=success_no_change"

else
  # 等锁期间他人合入了新内容，计算文件交集
  CHANGED_BY_OTHERS=$(git -C "<MAIN_REPO>" diff "$RECORDED_BASE".."$NOW" --name-only)
  MY_FILES=$(git -C "<WORKTREE_PATH>" diff --name-only "$RECORDED_BASE" HEAD)
  INTERSECTION=$(comm -12 \
    <(printf "%s\n" "$MY_FILES" | sort) \
    <(printf "%s\n" "$CHANGED_BY_OTHERS" | sort))

  if [ -z "$INTERSECTION" ]; then
    # 无直接文件交集：锁内禁止 rebase，释放锁后锁外处理
    echo "MERGE_RESULT=need_rebase_no_retest"
    echo "NEW_BASE=$NOW"
  else
    # 有文件交集：回锁外 rebase + 全量重测
    echo "MERGE_RESULT=need_retest"
    echo "NEW_BASE=$NOW"
  fi
fi

# 释放锁（trap 会在 EXIT 时执行，这里提前释放以减少锁持有时间）
rm -rf "$LOCK_DIR"
trap - EXIT INT TERM
echo "✅ 合并锁已释放"
```

**根据 MERGE_RESULT 决策**（从 stdout 提取）：

- `success_no_change`：进入第三段清理
- `need_rebase_no_retest`：设置 `RECORDED_BASE=$NEW_BASE`，锁外执行：
  ```bash
  set -e
  cd "<WORKTREE_PATH>"
  git rebase refs/heads/<MAIN_BRANCH>
  # Quick check（不跑全量测试，仅验证基础可用性）
  # Node: npm run typecheck  |  Python: python -m compileall .
  # Go: go vet ./...         |  Rust: cargo check
  <quick-check-command>
  echo "✅ 无交集 rebase + quick check 完成"
  ```
  重新进入第二段抢锁（不重跑全量测试）
- `need_retest`：设置 `RECORDED_BASE=$NEW_BASE`，重试次数 +1；若已达 5 次：

  ```
  ❌ 文件并发争用过高（已重试 5 次），建议错峰执行或人工合并。
  停止。请手动将 <BRANCH_NAME> 合并到 <MAIN_BRANCH>。
  ```

  否则回到"第一段：锁外准备"重跑（rebase + 全量测试）

---

#### 第三段：清理 worktree

```bash
git -C "<MAIN_REPO>" worktree remove "<WORKTREE_PATH>" --force \
  || echo "⚠ worktree 目录清理失败，请手动删除: <WORKTREE_PATH>"
git -C "<MAIN_REPO>" branch -d "<BRANCH_NAME>" \
  || echo "⚠ 分支清理失败，请手动删除: <BRANCH_NAME>"
echo "✅ worktree 已清理"
echo "ℹ 合并已完成到本地 <MAIN_BRANCH>，如需推送请手动执行:"
echo "    git push origin <MAIN_BRANCH>"
```

### === Phase 4 DONE ===

---

## 收尾自检报告（强制输出）

无论成功或失败，命令结束前必须输出以下表格：

| Phase | 状态 | 证据 |
|-------|------|------|
| **Phase 1: Plan** | ✅/❌ | 用户确认原文 + 任务计划内容摘要 |
| **Phase 2: TDD** | ✅/❌ | tdd-guide agent 调用 + worktree 路径 + 测试通过数 + 覆盖率 % + RED 阶段证据 |
| **Phase 3: Review Loop** | ✅/❌ | 总轮次 + 每轮 CRITICAL/HIGH 数 + 最终 [REVIEW_PASS] |
| **Phase 4: CAS 合并** | ✅/❌ | BASE/NOW 值 + MERGE_RESULT + 是否重试（共几次）+ 合并 commit hash |

任何 ❌ → 命令失败，补做对应 Phase 直到 ✅。

---

## 最终总结（仅在所有 Phase ✅ 后输出）

- 实现了什么功能 / 解决了什么问题
- 最终测试结果：通过数/总数，覆盖率 %
- Code Review 循环：共几轮，每轮修复了哪些 CRITICAL/HIGH 问题
- 合并情况：是否发生过冲突、MERGE_RESULT 类型、是否重试（几次）、合并 commit hash
- 最终状态：[REVIEW_PASS]，已合并到本地 `<MAIN_BRANCH>`，等待用户 push
- 遗留 MEDIUM/LOW 问题列表（供后续参考）
