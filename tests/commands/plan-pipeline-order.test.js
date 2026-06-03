'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const commandFiles = {
  planT: path.join(repoRoot, 'commands', 'plan-t.md'),
  planTr: path.join(repoRoot, 'commands', 'plan-tr.md'),
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    failed++;
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

console.log('\n=== Testing plan-t / plan-tr simplified pipeline ===\n');

// ── File existence ────────────────────────────────────────────────────────────

test('plan-t.md exists', () => {
  assert.ok(fs.existsSync(commandFiles.planT), 'commands/plan-t.md must exist');
});

test('plan-tr.md exists', () => {
  assert.ok(fs.existsSync(commandFiles.planTr), 'commands/plan-tr.md must exist');
});

test('plan-doc-tr.md has been deleted', () => {
  const p = path.join(repoRoot, 'commands', 'plan-doc-tr.md');
  assert.ok(!fs.existsSync(p), 'commands/plan-doc-tr.md must be deleted');
});

test('parallel command-templates directory has been deleted', () => {
  const p = path.join(repoRoot, 'docs', 'command-templates');
  assert.ok(!fs.existsSync(p), 'docs/command-templates/ must be deleted');
});

// ── No legacy parallel machinery ─────────────────────────────────────────────

test('plan-t has no Phase 1.5 parallel group analysis', () => {
  const planT = read(commandFiles.planT);
  assert.ok(!planT.includes('Phase 1.5'), 'plan-t must not contain Phase 1.5');
  assert.ok(!planT.includes('并行分组分析'), 'plan-t must not mention parallel group analysis');
});

test('plan-tr has no Phase 1.5 parallel group analysis', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(!planTr.includes('Phase 1.5'), 'plan-tr must not contain Phase 1.5');
  assert.ok(!planTr.includes('并行分组分析'), 'plan-tr must not mention parallel group analysis');
});

test('plan-t has no ready queue machinery', () => {
  const planT = read(commandFiles.planT);
  assert.ok(!planT.includes('ready queue'), 'plan-t must not reference the ready queue');
  assert.ok(!planT.includes('dispatch_blocked'), 'plan-t must not reference dispatch_blocked state');
  assert.ok(!planT.includes('worktree_recovery_failed'), 'plan-t must not reference worktree_recovery_failed state');
});

test('plan-tr has no ready queue machinery', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(!planTr.includes('ready queue'), 'plan-tr must not reference the ready queue');
  assert.ok(!planTr.includes('dispatch_blocked'), 'plan-tr must not reference dispatch_blocked state');
  assert.ok(!planTr.includes('worktree_recovery_failed'), 'plan-tr must not reference worktree_recovery_failed state');
});

// ── Single worktree isolation ─────────────────────────────────────────────────

test('plan-t creates a single isolated worktree per invocation', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('git worktree add'), 'plan-t must create a worktree');
  assert.ok(planT.includes('WORKTREE_PATH'), 'plan-t must record the worktree path');
  assert.ok(planT.includes('BRANCH_NAME'), 'plan-t must record the branch name');
});

test('plan-tr creates a single isolated worktree per invocation', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('git worktree add'), 'plan-tr must create a worktree');
  assert.ok(planTr.includes('WORKTREE_PATH'), 'plan-tr must record the worktree path');
  assert.ok(planTr.includes('BRANCH_NAME'), 'plan-tr must record the branch name');
});

test('plan-t creates rollback tag inside the worktree (not in main repo)', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('git -C "<WORKTREE_PATH>" tag "ecc-premerge-'),
    'plan-t rollback tag must be created inside the worktree using git -C',
  );
});

test('plan-tr creates rollback tag inside the worktree (not in main repo)', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('git -C "<WORKTREE_PATH>" tag "ecc-premerge-'),
    'plan-tr rollback tag must be created inside the worktree using git -C',
  );
});

test('plan-t TASK_SLUG has a real generation rule', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes("tr '[:upper:]' '[:lower:]'") && planT.includes('cut -c1-40'),
    'plan-t must auto-generate TASK_SLUG from $ARGUMENTS via tr/sed/cut',
  );
});

test('plan-tr TASK_SLUG has a real generation rule', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes("tr '[:upper:]' '[:lower:]'") && planTr.includes('cut -c1-40'),
    'plan-tr must auto-generate TASK_SLUG from $ARGUMENTS via tr/sed/cut',
  );
});

test('plan-t TIMESTAMP includes PID to avoid same-second branch collisions', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('$$'),
    'plan-t TIMESTAMP must include $$ (PID) to prevent same-second branch name collisions',
  );
});

test('plan-tr TIMESTAMP includes PID to avoid same-second branch collisions', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('$$'),
    'plan-tr TIMESTAMP must include $$ (PID) to prevent same-second branch name collisions',
  );
});

test('plan-t cleans up the worktree after merge', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('worktree remove'), 'plan-t must remove the worktree after merge');
});

test('plan-tr cleans up the worktree after merge', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('worktree remove'), 'plan-tr must remove the worktree after merge');
});

test('plan-t cleanup has error handling for worktree remove', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.match(/worktree remove.*--force\s*\\\s*\n\s*\|\|/s),
    'plan-t worktree remove must have a || error handler',
  );
});

test('plan-tr cleanup has error handling for worktree remove', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.match(/worktree remove.*--force\s*\\\s*\n\s*\|\|/s),
    'plan-tr worktree remove must have a || error handler',
  );
});

// ── Serial tdd-guide agent ────────────────────────────────────────────────────

test('plan-t calls tdd-guide as a single serial agent inside the worktree', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('tdd-guide'), 'plan-t must call tdd-guide agent');
  assert.ok(planT.includes('RED→GREEN→IMPROVE'), 'plan-t must enforce RED→GREEN→IMPROVE');
  assert.ok(planT.includes('≥80%') || planT.includes('≥ 80%'), 'plan-t must require ≥80% coverage');
});

test('plan-tr calls tdd-guide as a single serial agent inside the worktree', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('tdd-guide'), 'plan-tr must call tdd-guide agent');
  assert.ok(planTr.includes('RED→GREEN→IMPROVE'), 'plan-tr must enforce RED→GREEN→IMPROVE');
  assert.ok(planTr.includes('≥80%') || planTr.includes('≥ 80%'), 'plan-tr must require ≥80% coverage');
});

// ── Code review loop ──────────────────────────────────────────────────────────

test('plan-t gates Phase 4 on [REVIEW_PASS]', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('[REVIEW_PASS]'), 'plan-t must require [REVIEW_PASS] before merge');
  assert.ok(planT.includes('code-reviewer'), 'plan-t must call code-reviewer agent');
});

test('plan-tr gates Phase 4 on [REVIEW_PASS]', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('[REVIEW_PASS]'), 'plan-tr must require [REVIEW_PASS] before merge');
  assert.ok(planTr.includes('code-reviewer'), 'plan-tr must call code-reviewer agent');
});

test('plan-t review loop runs at most 3 rounds', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('最多 3 轮'), 'plan-t must cap the review loop at 3 rounds');
});

test('plan-tr review loop runs at most 3 rounds', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('最多 3 轮'), 'plan-tr must cap the review loop at 3 rounds');
});

test('plan-t requires re-running tests after each review fix', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('每处修复完成后必须重新运行相关测试'),
    'plan-t must require re-running tests after each CRITICAL/HIGH fix in review',
  );
});

test('plan-tr requires re-running tests after each review fix', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('每处修复完成后必须重新运行相关测试'),
    'plan-tr must require re-running tests after each CRITICAL/HIGH fix in review',
  );
});

// ── Local-only CAS (no fetch/origin) ─────────────────────────────────────────

test('plan-t is local-only: does not fetch origin before CAS', () => {
  const planT = read(commandFiles.planT);
  // Phase 4 must NOT call fetch origin as part of CAS protocol
  // (push is only mentioned as a manual post-step)
  const phase4 = planT.split('=== Phase 4 START')[1] || '';
  assert.ok(
    !phase4.includes('fetch origin'),
    'plan-t Phase 4 must not fetch origin — this is a local-only protocol',
  );
});

test('plan-tr is local-only: does not fetch origin before CAS', () => {
  const planTr = read(commandFiles.planTr);
  const phase4 = planTr.split('=== Phase 4 START')[1] || '';
  assert.ok(
    !phase4.includes('fetch origin'),
    'plan-tr Phase 4 must not fetch origin — this is a local-only protocol',
  );
});

test('plan-t BASE reads from local branch using refs/heads/', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('rev-parse refs/heads/<MAIN_BRANCH>'),
    'plan-t BASE must use refs/heads/<MAIN_BRANCH> (local, unambiguous)',
  );
});

test('plan-tr BASE reads from local branch using refs/heads/', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('rev-parse refs/heads/<MAIN_BRANCH>'),
    'plan-tr BASE must use refs/heads/<MAIN_BRANCH> (local, unambiguous)',
  );
});

test('plan-t describes local-only protocol in design principles', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('local-only') || planT.includes('纯本地协议'),
    'plan-t must document that Phase 4 is a local-only protocol',
  );
});

test('plan-tr describes local-only protocol in design principles', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('local-only') || planTr.includes('纯本地协议'),
    'plan-tr must document that Phase 4 is a local-only protocol',
  );
});

// ── mkdir lockdir (cross-platform atomic lock) ───────────────────────────────

test('plan-t uses mkdir lockdir as the merge lock (no external dependencies)', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('ecc-merge.lockdir'),
    'plan-t must use mkdir lockdir for locking (POSIX atomic, no flock/lockf dependency)',
  );
  assert.ok(
    planT.includes('mkdir "$LOCK_DIR"') || planT.includes('mkdir "$LOCK_DIR" 2>/dev/null'),
    'plan-t must use mkdir to acquire the lock atomically',
  );
});

test('plan-tr uses mkdir lockdir as the merge lock (no external dependencies)', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('ecc-merge.lockdir'),
    'plan-tr must use mkdir lockdir for locking (POSIX atomic, no flock/lockf dependency)',
  );
});

test('plan-t mkdir lock uses trap to release on EXIT', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('trap') && planT.includes('rm -rf "$LOCK_DIR"'),
    'plan-t must release the mkdir lock via trap on EXIT/INT/TERM',
  );
});

test('plan-tr mkdir lock uses trap to release on EXIT', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('trap') && planTr.includes('rm -rf "$LOCK_DIR"'),
    'plan-tr must release the mkdir lock via trap on EXIT/INT/TERM',
  );
});

test('plan-t mkdir lock detects stale locks via PID check', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('LOCK_PID_FILE'),
    'plan-t must detect stale locks by checking the PID file',
  );
});

test('plan-tr mkdir lock detects stale locks via PID check', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('LOCK_PID_FILE'),
    'plan-tr must detect stale locks by checking the PID file',
  );
});

// ── CAS correctness ───────────────────────────────────────────────────────────

test('plan-t NOW reads from refs/heads (local branch, not origin)', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('rev-parse refs/heads/<MAIN_BRANCH>'),
    'plan-t CAS NOW must use refs/heads/<MAIN_BRANCH>',
  );
});

test('plan-tr NOW reads from refs/heads (local branch, not origin)', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('rev-parse refs/heads/<MAIN_BRANCH>'),
    'plan-tr CAS NOW must use refs/heads/<MAIN_BRANCH>',
  );
});

test('plan-t does not run rebase inside the lock', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('严禁在锁内执行 rebase'),
    'plan-t must explicitly forbid rebase inside the lock',
  );
  // flock block must not contain git rebase
  const flockBlock = planT.match(/flock -x 200;([\s\S]*?)\) 200>/);
  if (flockBlock) {
    assert.ok(!flockBlock[1].includes('git rebase'), 'plan-t flock block must not contain git rebase');
  }
});

test('plan-tr does not run rebase inside the lock', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('严禁在锁内执行 rebase'),
    'plan-tr must explicitly forbid rebase inside the lock',
  );
});

test('plan-t CHANGED_BY_OTHERS diffs between RECORDED_BASE and NOW', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('diff "<RECORDED_BASE>".."$NOW" --name-only') ||
    planT.includes('diff "$RECORDED_BASE".."$NOW" --name-only'),
    'plan-t CHANGED_BY_OTHERS must diff from RECORDED_BASE to NOW',
  );
});

test('plan-tr CHANGED_BY_OTHERS diffs between RECORDED_BASE and NOW', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('diff "<RECORDED_BASE>".."$NOW" --name-only') ||
    planTr.includes('diff "$RECORDED_BASE".."$NOW" --name-only'),
    'plan-tr CHANGED_BY_OTHERS must diff from RECORDED_BASE to NOW',
  );
});

test('plan-t printf for intersection uses quoted variables', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('printf "%s\\n" "$MY_FILES"') || planT.includes("printf \"%s\\n\" \"$MY_FILES\""),
    'plan-t must quote $MY_FILES in printf to handle filenames with spaces',
  );
});

test('plan-tr printf for intersection uses quoted variables', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('printf "%s\\n" "$MY_FILES"') || planTr.includes("printf \"%s\\n\" \"$MY_FILES\""),
    'plan-tr must quote $MY_FILES in printf to handle filenames with spaces',
  );
});

test('plan-t handles need_rebase_no_retest path', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('need_rebase_no_retest'), 'plan-t must have need_rebase_no_retest path');
});

test('plan-tr handles need_rebase_no_retest path', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('need_rebase_no_retest'), 'plan-tr must have need_rebase_no_retest path');
});

test('plan-t need_rebase_no_retest path includes quick-check-command', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('quick-check-command'),
    'plan-t need_rebase_no_retest path must run a quick-check-command before re-locking',
  );
});

test('plan-tr need_rebase_no_retest path includes quick-check-command', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('quick-check-command'),
    'plan-tr need_rebase_no_retest path must run a quick-check-command before re-locking',
  );
});

test('plan-t uses ff-only merge inside the lock', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('--ff-only'), 'plan-t must use --ff-only merge inside the lock');
});

test('plan-tr uses ff-only merge inside the lock', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('--ff-only'), 'plan-tr must use --ff-only merge inside the lock');
});

test('plan-t rebase uses refs/heads to avoid ref ambiguity', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('rebase refs/heads/<MAIN_BRANCH>'),
    'plan-t rebase must use refs/heads/<MAIN_BRANCH> to avoid tag/remote name ambiguity',
  );
});

test('plan-tr rebase uses refs/heads to avoid ref ambiguity', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('rebase refs/heads/<MAIN_BRANCH>'),
    'plan-tr rebase must use refs/heads/<MAIN_BRANCH> to avoid tag/remote name ambiguity',
  );
});

test('plan-t rollback uses reset --hard on the premerge tag', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('reset --hard "ecc-premerge-'),
    'plan-t rollback must use git reset --hard to the premerge tag',
  );
});

test('plan-tr rollback uses reset --hard on the premerge tag', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('reset --hard "ecc-premerge-'),
    'plan-tr rollback must use git reset --hard to the premerge tag',
  );
});

// ── Retry limit ───────────────────────────────────────────────────────────────

test('plan-t caps the CAS retry loop at 5 attempts', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('5 次') || planT.includes('≤ 5'), 'plan-t must cap CAS retries at 5');
});

test('plan-tr caps the CAS retry loop at 5 attempts', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('5 次') || planTr.includes('≤ 5'), 'plan-tr must cap CAS retries at 5');
});

// ── No auto-push ──────────────────────────────────────────────────────────────

test('plan-t does not auto-push after merge', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('手动') && planT.includes('push'), 'plan-t must instruct user to push manually');
});

test('plan-tr does not auto-push after merge', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('手动') && planTr.includes('push'), 'plan-tr must instruct user to push manually');
});

// ── Conflict resolution ───────────────────────────────────────────────────────

test('plan-t stops auto-resolve on semantic conflicts', () => {
  const planT = read(commandFiles.planT);
  assert.ok(
    planT.includes('停止自动解') || planT.includes('由人工处理'),
    'plan-t must stop AI auto-resolve on semantic conflicts',
  );
});

test('plan-tr stops auto-resolve on semantic conflicts', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(
    planTr.includes('停止自动解') || planTr.includes('由人工处理'),
    'plan-tr must stop AI auto-resolve on semantic conflicts',
  );
});

// ── Self-check report ─────────────────────────────────────────────────────────

test('plan-t requires a mandatory self-check report', () => {
  const planT = read(commandFiles.planT);
  assert.ok(planT.includes('收尾自检报告'), 'plan-t must require a final self-check report');
  assert.ok(planT.includes('MERGE_RESULT'), 'plan-t self-check must include MERGE_RESULT evidence');
});

test('plan-tr requires a mandatory self-check report', () => {
  const planTr = read(commandFiles.planTr);
  assert.ok(planTr.includes('收尾自检报告'), 'plan-tr must require a final self-check report');
  assert.ok(planTr.includes('MERGE_RESULT'), 'plan-tr self-check must include MERGE_RESULT evidence');
});

// ── Result ────────────────────────────────────────────────────────────────────

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
