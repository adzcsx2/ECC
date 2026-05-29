---
description: "Plan-Doc + TDD + auto code review (full pipeline): generate task-scoped documentation set, then execute with strict TDD, then auto code review."
argument-hint: "<task-slug> [test] e.g. /ecc:plan-doc-tr my-feature"
---

# Plan-Doc-TR: Plan-Doc + TDD + Code Review (Full Pipeline)

**Key constraint**: This command is a three-phase mandatory pipeline. All three Phases MUST be executed via real tool calls. Before outputting the final summary, it is NEVER allowed to:
- Skip Phase 2 or Phase 3
- Replace actual Agent/Skill tool calls with verbal declarations ("I've completed TDD/Review")
- Write code directly in the main conversation context (all implementation must be done by the tdd-guide agent)
- Reverse TDD order (tests MUST be written first, then implementation)
- Start Phase 2 without a verified documentation set under `docs/plan/<task-slug>-*/` — the documentation directory is a hard prerequisite gate

Any execution that violates the above constraints is considered a **command failure** and must be redone.

---

## Checkpoint Resume (断点恢复)

Before starting any Phase, check whether a documentation set already exists for this task:

```
Scan: docs/plan/<task-slug>-*/00-执行文档.md
```

**Case A — No docs found (first run)**:
- Proceed normally: Phase 1 generates docs, Phase 2 executes TDD from scratch, Phase 3 reviews.

**Case B — Docs found with a progress pointer**:
1. Read the `<!-- progress-pointer:start -->` YAML block from `00-执行文档.md`.
2. Print a resume summary:
   ```
   检测到实施文档断点：
     文档目录: docs/plan/<found-dir>/
     当前 Phase: <current_phase>
     状态: <current_phase_status>
     下一步: <next_action>
     阻塞项: <blockers or "无">
   ```
3. Skip Phase 1 entirely (docs already exist — do NOT regenerate or overwrite).
4. Jump directly to the phase indicated by `current_phase`:
   - `current_phase = 1` or status `not_started` / `planning` → run Phase 1 only to fill any missing docs, then continue.
   - `current_phase = 2` or status `coding` / `self_testing` → skip Phase 1, go to Phase 2 and continue TDD from the first **unchecked** checklist item in `00-执行文档.md`.
   - `current_phase = 3` or status `in_review` → skip Phases 1–2, go directly to Phase 3 review loop.
   - `current_phase_status = completed` → all phases done; print final summary from existing docs, do not re-execute.
5. When resuming Phase 2 from a checkpoint, scope tdd-guide to **only the unchecked items** — do NOT re-run already-checked items.
6. After each checkpoint-resume phase completes, update the progress pointer in `00-执行文档.md` (tick completed items, advance `current_phase`, set new `next_action`).

---

## Plan-Doc-TR Execution Flow

Task: $ARGUMENTS

### === Phase 1 START: Plan-Doc Generation ===

Call `/ecc:plan-doc` via Skill tool:

```
Skill tool with skill: "ecc:plan-doc", args: $ARGUMENTS
```

`ecc:plan-doc` will:
1. Restate requirements
2. Ask clarifying questions (only if critical info missing)
3. Emit a generation plan and **wait for user confirmation** ("yes"/"proceed")
4. After confirmation, output the model handoff and **proceed automatically** to file generation (no separate `继续` reply needed in default fast path)
5. Generate the full documentation set under `docs/plan/<task-slug>-YYYY-MM-DD/`

**Single confirmation gate**: User must reply "yes" / "proceed" / "confirm" / "可以" / "好的" / "同意" to approve the generation plan. After that, plan-doc → Phase 2 → Phase 3 proceed automatically with no further user input (unless errors or merge conflicts occur).

**Phase 1 completion marker**: All documentation files generated under `docs/plan/<task-slug>-YYYY-MM-DD/`. Main conversation then proceeds directly to Phase 2 in the same turn.

**Hard gate before Phase 2**: Before executing any TDD, verify:
```
docs/plan/<task-slug>-*/00-执行文档.md  ← must exist and contain <!-- progress-pointer:start -->
```
If this file is absent or the progress pointer block is missing, Phase 2 is **blocked**. Do NOT proceed. Return to Phase 1 and complete doc generation first. Output:
```
[BLOCKED] 实施文档不存在或进度指针缺失。Phase 2 无法启动。
请先完成 Phase 1 文档生成，确认 docs/plan/<task-slug>-*/00-执行文档.md 存在且包含进度指针块。
```

---

### === Phase 2 START: TDD Execution ===

**Pre-flight verification (must complete)**:
- [ ] Does `docs/plan/<task-slug>-*/00-执行文档.md` exist on disk? (**hard gate** — Phase 2 is blocked until YES)
- [ ] Does it contain a `<!-- progress-pointer:start -->` block? (**hard gate** — Phase 2 is blocked until YES)
- [ ] Is the progress pointer `current_phase_status` not `completed`? (if `completed`, output final summary and stop — do not re-execute)
- [ ] Are all other plan-doc files present (at minimum `README.md`, `01-架构设计.md`, `02-开发规范.md`, `03-修复路线图.md`)?
- If any item above is NO, stop and return to Phase 1. No separate "user confirmation to start TDD" is required — Phase 1 confirmation is the single gate for the whole pipeline.

**Checkpoint resume in Phase 2**: After the pre-flight checks pass, read the progress pointer:
- Identify the first **unchecked** checklist item (`- [ ]`) across all Phase checklists in `00-执行文档.md`.
- Pass only the **remaining unchecked items** to the tdd-guide agent. Do NOT re-run items already marked `- [x]`.
- If all items in a phase are already checked, skip that phase and advance the pointer to the next phase.

**Three No's principle** (before Phase 2 starts):
- No writing any source code directly in the main conversation
- No making direct code modification decisions
- No skipping tests and jumping directly to implementation

**Parallel dispatch strategy (activate when plan items ≥ 3)**:

**Pre-dispatch checks** (run before reading parallelizable_groups):
1. Verify current directory is a git repository: `git rev-parse --is-inside-work-tree`. If not a git repo → fall back to serial mode silently.
2. Run the pre-check block below. The block echoes literal values that the main conversation must record and substitute into all subsequent bash commands as `<MAIN_REPO>` and `<MAIN_BRANCH>` placeholders (Bash tool calls are independent processes — shell variables do not persist between calls):
   ```bash
   # ⚠ This block's purpose is to echo literal values for the main conversation to record.
   # Extract RECORDED_MAIN_REPO= and RECORDED_MAIN_BRANCH= from stdout.
   # Replace <MAIN_REPO> and <MAIN_BRANCH> placeholders in all later bash blocks with these literals.
   set -e
   MAIN_REPO=$(git rev-parse --show-toplevel)
   MAIN_BRANCH=$(git rev-parse --abbrev-ref HEAD)
   echo "RECORDED_MAIN_REPO=$MAIN_REPO"
   echo "RECORDED_MAIN_BRANCH=$MAIN_BRANCH"

   # Check for uncommitted tracked-file changes (stash and cherry-pick are NOT valid bypasses)
   if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
     echo "⚠ [BLOCKED] Main repo has uncommitted tracked changes. Commit first. git stash is NOT a valid bypass."
     git status --porcelain --untracked-files=no
   fi
   # Main conversation contract: if stdout contains [BLOCKED], mark trigger gate item 3 as ❌ and use serial mode.
   ```
3. Read `parallelizable_groups` from the progress pointer in `00-执行文档.md`. If the field is absent (plan-doc generation skipped the YAML step on the older version) → fall back to serial mode and warn: "parallelizable_groups not found in progress pointer — running in serial mode. Re-generate plan-doc to enable parallel dispatch."

- If `parallelizable_groups` is null or has only 1 group → **Serial mode**: single tdd-guide agent (default, see below).
- If `parallelizable_groups` has 2+ independent groups → **Parallel mode**:
  1. Identify all groups with empty `depends_on` (independent). Cap at **3 groups max** in a single parallel batch; queue the rest as serial.
  2. **Print the group preview, then dispatch immediately in the same turn** (no separate user confirmation; output below is informational only):
     ```
     Parallel groups detected — dispatching now:
       Group A: [P1.1, P1.2] (independent)
       Group B: [P1.3] (independent)
       Group C: [P1.4] — depends on A (will run after A merges)
     ```
     The preview is printed for transparency; the parallel tdd-guide tool calls follow in the same turn. If the user wants to abort, they must interrupt and reply "stop" / "串行" before the next turn — there is no timed wait.
  3. Launch one `tdd-guide` Agent tool call per independent group in a **single message** (parallel), each with `isolation: "worktree"` and a prompt scoped to that group's items only.
  4. Wait for all independent group agents to complete and finish immediate worktree verification.
  5. Hand those verified groups to the Phase 3 review queue. **Only groups whose last review round outputs `[REVIEW_PASS]` may enter the serial merge queue.**
  6. The serial merge queue processes one review-pass group at a time (Worktree Merge SOP, independent groups only), then refreshes the baseline:
     ```bash
     git checkout <MAIN_BRANCH> && git pull --ff-only origin <MAIN_BRANCH>
     ```
  7. For each dependent group, **cut a fresh worktree from the updated main branch**, run `tdd-guide`, then pass that group through the same Phase 3 review → merge gate before starting the next.
  8. Run a unified coverage check on the merged main branch after all review-pass groups are merged.

**Review-pass Worktree Merge SOP** (parallel mode only; invoked by the Phase 3 merge queue):

> Sync note: The following four paragraphs are kept identical across `plan-tr.md`, `plan-t.md`, and `plan-doc-tr.md`; update all three files when making changes: ① Phase 1.5 pre-dispatch checks, ② Worktree Merge SOP (this section), ③ immediate worktree verification after agent returns, ④ Phase 3 parallel review prompts.

> ⚠ Concurrency limit: Only one Claude process may execute this SOP against the same main repo at a time. When running multiple Claude instances in parallel, serialize the merge operations manually — concurrent `git checkout` / `git merge` calls race and can still cause data loss. To auto-serialize, wrap Step 2 onward with `flock` against the main repo directory.

> ⚠ Admission gate: only groups whose last review round explicitly outputs `[REVIEW_PASS]` may execute this SOP. Never merge an unreviewed worktree.

After all tdd-guide agents return, **strictly extract from the last two lines** of each agent's final message:
- `WORKTREE_PATH: <absolute-path>` — directory of the isolated worktree
- `BRANCH_NAME: <branch-name>` — branch created inside that worktree

> ⚠ Extraction rule: match with regex `^WORKTREE_PATH: (.+)$` and `^BRANCH_NAME: (.+)$`. If either field is missing, **treat as agent failure** — stop the SOP immediately and report: "agent did not output worktree info; likely no commit was made and harness auto-cleaned the worktree. Manual intervention required." Do NOT guess the path.

**Immediate worktree verification after each agent returns (run before SOP Steps 1–3)**:

```bash
# Replace <WORKTREE_PATH> with the literal path from WORKTREE_PATH: line,
# replace <BRANCH_NAME> with the literal branch from BRANCH_NAME: line.
[ -d "<WORKTREE_PATH>" ] || { echo "⚠ [FATAL] worktree directory missing: <WORKTREE_PATH>. Possible causes: agent made no commit / agent crashed / harness cleaned up. Check agent's full return content. Stop SOP."; exit 1; }
git -C "<WORKTREE_PATH>" rev-parse "<BRANCH_NAME>" >/dev/null 2>&1 || { echo "⚠ [FATAL] branch not found: <BRANCH_NAME>. Stop SOP."; exit 1; }
git -C "<WORKTREE_PATH>" log --oneline -1
echo "✅ worktree verified: <WORKTREE_PATH> @ <BRANCH_NAME>"
```

Before starting, record the literal values echoed by the pre-dispatch check:
- `<MAIN_REPO>` — literal path from the `RECORDED_MAIN_REPO=` line; substitute this into all subsequent bash blocks
- `<MAIN_BRANCH>` — literal branch name from the `RECORDED_MAIN_BRANCH=` line; substitute this into all subsequent bash blocks

For each group branch, in dependency order, run Steps 1–3 below (substitute `<WORKTREE_PATH>`, `<BRANCH_NAME>`, `<MAIN_REPO>`, `<MAIN_BRANCH>`, and `<label>` per iteration):

```bash
# ⚠ Replace all <placeholders> with actual values before running; execute the entire block in a single Bash call
set -e          # Exit immediately on any command failure — prevents error cascades
set -o pipefail # Propagate pipe failures to set -e
# ── Step 1: rebase worktree branch onto latest main before merging ──
# Prevents worktree built on a stale baseline from silently overwriting
# changes already merged by other agents or Claude instances.
cd "<WORKTREE_PATH>"
git fetch origin
if ! git rebase origin/<MAIN_BRANCH>; then
  echo "⚠ [BLOCKED] Rebase conflict — aborted automatically. Fix the rebase in <WORKTREE_PATH> manually and re-trigger SOP."
  git rebase --abort 2>/dev/null || true
  exit 1
fi

# ── Step 2: return to main repo, check tracked-file changes, pull latest ──
# Only tracked files are checked (untracked files survive checkout safely; including them causes false positives).
cd "<MAIN_REPO>"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠ [BLOCKED] Main repo has uncommitted tracked-file changes — checkout may discard them. Commit first."
  echo "  git stash is NOT a valid bypass. git cherry-pick is NOT a valid substitute for merge."
  git status --porcelain --untracked-files=no
  exit 1
fi
git checkout <MAIN_BRANCH>
git pull --ff-only origin <MAIN_BRANCH>

# ── Step 3: dry-run merge — detect conflicts and deletion-type lost updates ──
if ! git merge --no-ff --no-commit "<BRANCH_NAME>"; then
  echo "⚠ [BLOCKED] Merge conflict — aborted. Conflicting files (resolve then re-trigger SOP):"
  git diff --name-only --diff-filter=U
  git merge --abort
  exit 1
fi
DELETED=$(git diff --cached --diff-filter=D --name-only)
if [ -n "$DELETED" ]; then
  echo "⚠ [BLOCKED] Files below would be deleted — possible lost update. Merge aborted:"
  echo "$DELETED"
  git merge --abort
  exit 1
fi
git commit -m "merge: TDD Group <label>"
MERGE_COMMIT=$(git rev-parse HEAD)
echo "RECORDED_MERGE_COMMIT_<label>=$MERGE_COMMIT"
```

If any step fails (rebase conflict, uncommitted-change check, merge conflict, or deletion guard), block the current group's merge, stop the merge queue, report details to the user, and wait for manual resolution before continuing.

Iteration rule: if any command in Steps 1–3 exits non-zero for a given group, stop the entire SOP immediately — do not proceed to subsequent groups. Groups already merged remain on the main branch; unmerged group worktrees are preserved for manual handling.

Example parallel dispatch (single message, two tool calls):
```
Agent tool #1: subagent_type="tdd-guide", isolation="worktree"
  prompt: "Execute strict TDD for Group A items: [P1.1, P1.2, P1.3].
           RED→GREEN→IMPROVE→REPEAT. 80% min coverage.
           After completing all work, run git add -A && git commit (at least once).
           Output the following as the last two lines of your final message (format is fixed — the parent conversation parses it):
           WORKTREE_PATH: <absolute path of current worktree>
           BRANCH_NAME: <current branch name>"

Agent tool #2: subagent_type="tdd-guide", isolation="worktree"   ← same message
  prompt: "Execute strict TDD for Group B items: [P1.4, P1.5].
           RED→GREEN→IMPROVE→REPEAT. 80% min coverage.
           After completing all work, run git add -A && git commit (at least once).
           Output the following as the last two lines of your final message (format is fixed — the parent conversation parses it):
           WORKTREE_PATH: <absolute path of current worktree>
           BRANCH_NAME: <current branch name>"
```

**Execution** (serial mode / single group fallback):

Call the `tdd-guide` subagent via Agent tool to execute according to the plan:

```
Agent tool with subagent_type: "tdd-guide"
prompt: "Follow the plan in docs/plan/<task-slug>-*/00-执行文档.md and execute strict TDD.
         IMPORTANT: Before writing any code, read the progress pointer in 00-执行文档.md.
         Start from the first UNCHECKED item (- [ ]) in the phase checklists — do NOT
         re-run items already marked as done (- [x]).
         After completing each checklist item: tick its checkbox (- [ ] → - [x]) and
         append an entry to the execution log table in 00-执行文档.md.
         Must follow RED->GREEN->IMPROVE->REPEAT cycle. 80% minimum coverage."
```

**TDD mandatory flow** (executed by tdd-guide agent):

1. **RED**: Write **failing tests** FIRST for each plan item
2. **GREEN**: Write minimal code to make tests pass
3. **IMPROVE**: Refactor while keeping tests green
4. **REPEAT**: Loop through all plan items

**Coverage requirements**:
- General code: >=80%
- Security-critical / financial logic: 100%

**Phase 2 completion marker**:

Serial mode — after the single tdd-guide agent returns:
- [x] All tests passing
- [x] Coverage metric >= 80%
- [x] git log shows test files committed first
- [x] **No fake-mock pass in integration tests**: first identify the integration test locations (candidates: `tests/integration/`, `test/integration/`, `integration_test/`, `__tests__/integration/`, files matching `*_integration_test.*`, `*.integration.test.*`, `*IntegrationTest.*`); then run `grep -rEn "jest\.mock|vi\.mock|sinon\.(stub|mock)|Mockito\.(mock|when)|gomock|MagicMock|mock\.patch|monkeypatch|stub\(" <hits>` on the resolved paths. If none of the candidates exist, require the tdd-guide agent to **explicitly state the project's actual integration test location** in its report — never accept "directory missing → spot check passed" as a gate result
- [x] **Credential-absence policy compliant**: any skipped test must carry an explicit text reason (e.g. "DEEPSEEK_API_KEY not set") — silent skips and mock-and-pass substitutions are not allowed
- [x] **RED authenticity**: the Phase 2 report must list the real failure reason for each test's initial RED state (business logic / connection error / auth error) — inserting a mock to turn RED into GREEN is not a valid transition

Parallel mode — after ALL group agents return AND worktrees pass immediate verification:
- [x] Every group agent reported all tests passing (aggregate: no group may have any failing test)
- [x] Every group worktree passed the immediate directory / branch verification and is ready for Phase 3 review
- [x] Each group's worktree-internal git log shows test commits before implementation commits (merged main branch overall order not required)
- [x] **No fake-mock pass in integration tests** (each group must pass the grep spot check; same standard as serial mode)
- [x] **Credential-absence policy compliant** (each group's skips must carry explicit reasons; same standard as serial mode)
- [x] **RED authenticity** (each group's Phase 2 report must list real RED failure reasons; same standard as serial mode)
- [x] No group may execute the merge SOP before its last review round returns `[REVIEW_PASS]`

If any group's tests failed:
- **Retry that group only**: discard the old worktree, cut a fresh one from current main branch, re-run tdd-guide (`isolation: "worktree"`). Other passing groups do not re-run.
- **Maximum 3 retry rounds**. After 3 failures, stop retrying, report failure reason and recommendations (split task / revise approach / fall back to manual). Do NOT continue auto-retrying after 3 rounds.
- Do NOT mark Phase 2 complete while any group has failing tests.

---

### === Phase 3 START: Code Review Loop ===

**Pre-flight verification (must complete)**:

Serial mode:
- [ ] Was the tdd-guide agent actually called?
- [ ] All tests passing?
- [ ] Coverage >= 80%?

Parallel mode:
- [ ] Was each group's tdd-guide agent actually called? (check per group in Agent tool call history)
- [ ] Every group's tests all passing? (any group with failures → back to Phase 2 to retry that group)
- [ ] Is each group's verified worktree still available for review? (if a worktree is cleaned before review, re-run that group from Phase 2; never merge it directly)

If any item is NO, stop and go back to Phase 2 for the relevant group/issue.

**Code Review closed-loop mechanism** (must follow this loop until exit condition is met):

```
LOOP (per group):
  1. Call code-reviewer inside that group's worktree
  2. Collect the review report
  3. If CRITICAL or HIGH issues exist:
    → Call code-reviewer again to fix them in the same worktree
    → After fixing, go back to step 1 (review again)
  4. If the group returns [REVIEW_PASS]:
    → Place that group into the serial merge queue
    → The merge queue acquires an exclusive lock and runs the Worktree Merge SOP for that group only
  5. Mark the group complete only after the merge succeeds; if merge fails, stop the queue and wait for manual handling
```

**Exit condition** (both must be met):
- No CRITICAL issues (security vulnerabilities, hardcoded secrets, injection risks)
- No HIGH issues (large functions >50 lines, deep nesting >4 levels, missing error handling)
- MEDIUM / LOW issues are recorded (do not block exit)

**Parallel review (when parallel mode was used in Phase 2)**:

If Phase 2 ran in parallel mode, each group has its own verified worktree with a distinct changed-file set. **Each group must finish review before any merge happens for that group.** Launch one `code-reviewer` agent per group in a single message (parallel):

```
Agent tool #1: subagent_type="code-reviewer"
  prompt: "cd <WORKTREE_PATH_A> (Group A worktree absolute path).
           First verify the directory exists: [ -d <WORKTREE_PATH_A> ] || exit 1
           Run `git diff <MAIN_BRANCH>...HEAD --name-only` to get changed files.
           Review those files. CRITICAL/HIGH/MEDIUM/LOW.
           Fix CRITICAL and HIGH. Output [REVIEW_PASS] or [REVIEW_FAIL: ...]."

Agent tool #2: subagent_type="code-reviewer"   ← same message
  prompt: "cd <WORKTREE_PATH_B> (Group B worktree absolute path).
           First verify the directory exists: [ -d <WORKTREE_PATH_B> ] || exit 1
           Run `git diff <MAIN_BRANCH>...HEAD --name-only` to get changed files.
           Review those files. CRITICAL/HIGH/MEDIUM/LOW.
           Fix CRITICAL and HIGH. Output [REVIEW_PASS] or [REVIEW_FAIL: ...]."
```

> Note: `<WORKTREE_PATH_A>` etc. are the literal `WORKTREE_PATH` values verified immediately after Phase 2; `<MAIN_BRANCH>` is the literal value recorded from the Phase 1.5 pre-dispatch check. If a worktree is cleaned before review, treat that group as not reviewed: cut a fresh worktree from current main and re-run that group from Phase 2. **Do not** fall back to a merge-commit diff review.

Collect all results. If any group returns `[REVIEW_FAIL]`:
- **Retry that group only**:
  - If the worktree still exists: re-launch code-reviewer in that group's worktree directory.
  - If the worktree was cleaned by the harness: cut a fresh worktree from current main and re-run that group from Phase 2; the group must not merge before review completes.
  - Groups that already returned `[REVIEW_PASS]` do NOT re-run.
- **Maximum 3 retry rounds per group**. After 3 failures, stop the loop, report remaining issues to user for manual decision.
- When a group returns `[REVIEW_PASS]`, add it to the serial merge queue. The queue merges one group at a time under a lock.
- File scope for retries: worktree exists → `git diff <MAIN_BRANCH>...HEAD --name-only`. Do NOT use merge-commit diffs or `git diff HEAD`.

**Each review round execution** (serial mode / single group):

Call the `code-reviewer` subagent via Agent tool:

```
Agent tool with subagent_type: "code-reviewer"
prompt: "Review all changed files in git diff HEAD. Check security (CRITICAL), structure (HIGH), patterns (MEDIUM), style (LOW).
Fix all CRITICAL and HIGH issues. After fixing, output: [REVIEW_PASS] if no CRITICAL/HIGH remain, or [REVIEW_FAIL: <issue list>] if issues still exist."
```

**Code review coverage**:
1. Run `git diff --name-only HEAD` to identify modified files
2. Review file by file:
   - **CRITICAL**: Security vulnerabilities, hardcoded secrets, injection risks
   - **HIGH**: Large functions (>50 lines), deep nesting (>4 levels), missing error handling
   - **MEDIUM**: Mutation patterns, missing tests, complexity issues
   - **LOW**: Naming inconsistencies, formatting issues
3. Output structured review report (with severity level + file:line)
4. **Fix** CRITICAL and HIGH issues
5. End report with `[REVIEW_PASS]` or `[REVIEW_FAIL: ...]`

**Loop record** (main conversation must maintain):

Serial mode:
| Round | CRITICAL | HIGH | MEDIUM | LOW | Result |
|-------|----------|------|--------|-----|--------|
| #1 | ? | ? | ? | ? | PASS/FAIL |
| #2 (if needed) | ? | ? | ? | ? | PASS/FAIL |

Parallel mode — one sub-table per group, independently tracked:
| Group | Round | CRITICAL | HIGH | MEDIUM | LOW | Result |
|-------|-------|----------|------|--------|-----|--------|
| A | #1 | ? | ? | ? | ? | PASS/FAIL |
| A | #2 (retry if needed) | ? | ? | ? | ? | PASS/FAIL |
| B | #1 | ? | ? | ? | ? | PASS/FAIL |

**Phase 3 completion marker**:
- Serial: last code-reviewer returns `[REVIEW_PASS]`, loop record shows no CRITICAL/HIGH.
- Parallel: **every group** in the loop record shows `[REVIEW_PASS]` in its last round, every review-pass group has merged successfully through the serial merge queue, and the post-merge unified coverage check on main is >= 80%. Phase 3 is NOT complete while any group still has an open `[REVIEW_FAIL]` or pending merge.

---

## Final Self-Check Report (mandatory output)

Before fully ending, output the following table to verify all three Phases were correctly executed:

| Phase | Status | Evidence |
|-------|--------|----------|
| **Phase 1: Plan-Doc** | ✅/❌ | User confirmation text + generated doc directory path |
| **Phase 2: TDD** | ✅/❌ | tdd-guide agent call ID + final test pass count + coverage % |
| **Phase 3: Review Loop** | ✅/❌ | Total rounds + CRITICAL/HIGH count per round + final [REVIEW_PASS] marker |

**Acceptance criteria**:
- If any item in the table is ❌, the command is considered **failed**
- All items must be ✅ before outputting the final summary
- If there is a ❌, redo the corresponding Phase until it becomes ✅

---

## Final Summary (output only after all Phases are ✅)

Summarize:
- What functionality was implemented / what problem was solved
- Final test results (passed / total) + coverage %
- Code Review loop: total rounds, which CRITICAL/HIGH issues were fixed per round
- Final status: [REVIEW_PASS], no remaining CRITICAL or HIGH issues
- Remaining MEDIUM/LOW issues list (for future reference)
