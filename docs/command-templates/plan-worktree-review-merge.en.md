# Review-Before-Merge Shared Template (en)

This file is the shared maintainer template for the worktree review-before-merge contract used by `plan-t`, `plan-tr`, and `plan-doc-tr`.

- Commands under `commands/*.md` are installed as raw markdown
- Runtime include syntax is not available, so command prompts must keep the text inline
- `tests/commands/plan-pipeline-order.test.js` enforces sync between these canonical sections and the command files

## Review-Pass Merge SOP

**Review-pass Worktree Merge SOP** (parallel mode only; invoked by the Phase 3 merge queue):

> Sync note: the shared review-before-merge sections (this Worktree Merge SOP plus the Phase 3 parallel review prompt) use `docs/command-templates/plan-worktree-review-merge.zh-CN.md` for Chinese and `docs/command-templates/plan-worktree-review-merge.en.md` for English as the canonical templates. Commands install as raw markdown, so runtime include syntax is not available; keep the prompt text inline and let `tests/commands/plan-pipeline-order.test.js` enforce sync. Plan-doc-specific resume and pre-dispatch logic stays local to this file.

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

## Parallel Review Prompt

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
