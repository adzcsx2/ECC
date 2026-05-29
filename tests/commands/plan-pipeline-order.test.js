'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const commandFiles = {
  planT: path.join(repoRoot, 'commands', 'plan-t.md'),
  planTr: path.join(repoRoot, 'commands', 'plan-tr.md'),
  planDocTr: path.join(repoRoot, 'commands', 'plan-doc-tr.md')
};

const templateFiles = {
  zh: path.join(repoRoot, 'docs', 'command-templates', 'plan-worktree-review-merge.zh-CN.md'),
  en: path.join(repoRoot, 'docs', 'command-templates', 'plan-worktree-review-merge.en.md')
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

function normalizeBlock(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

function extractBetween(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);
  assert.notStrictEqual(startIndex, -1, `Expected to find start marker: ${startMarker}`);

  const endIndex = text.indexOf(endMarker, startIndex);
  assert.notStrictEqual(endIndex, -1, `Expected to find end marker: ${endMarker}`);

  return normalizeBlock(text.slice(startIndex, endIndex));
}

function extractTemplateSection(text, heading) {
  const startMarker = `## ${heading}\n`;
  const startIndex = text.indexOf(startMarker);
  assert.notStrictEqual(startIndex, -1, `Expected to find template heading: ${heading}`);

  const contentStart = startIndex + startMarker.length;
  const nextHeadingIndex = text.indexOf('\n## ', contentStart);
  const contentEnd = nextHeadingIndex === -1 ? text.length : nextHeadingIndex;

  return normalizeBlock(text.slice(contentStart, contentEnd));
}

console.log('\n=== Testing plan pipeline merge ordering ===\n');

test('plan-t and plan-tr require REVIEW_PASS before entering the merge queue', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);

  assert.ok(
    planT.includes('只有返回 `[REVIEW_PASS]` 的 group 才能进入串行 merge 队列。'),
    'Expected plan-t to gate merge on REVIEW_PASS',
  );
  assert.ok(
    planTr.includes('只有返回 `[REVIEW_PASS]` 的 group 才能进入串行 merge 队列。'),
    'Expected plan-tr to gate merge on REVIEW_PASS',
  );
});

test('plan-doc-tr requires REVIEW_PASS before entering the merge queue', () => {
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    planDocTr.includes('Only groups whose last review round outputs `[REVIEW_PASS]` may enter the serial merge queue.'),
    'Expected plan-doc-tr to gate merge on REVIEW_PASS',
  );
});

test('parallel review no longer depends on post-merge fallback diff review', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    !planT.includes('改用合并提交 diff'),
    'Expected plan-t to drop post-merge diff review fallback',
  );
  assert.ok(
    !planTr.includes('改用合并提交 diff'),
    'Expected plan-tr to drop post-merge diff review fallback',
  );
  assert.ok(
    !planDocTr.includes('falls back to the merge commit diff'),
    'Expected plan-doc-tr to drop post-merge diff review fallback',
  );
});

test('parallel mode no longer requires all worktrees merged before review starts', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    !planT.includes('所有 group worktree 都已合并到主分支？'),
    'Expected plan-t to stop requiring pre-review merges',
  );
  assert.ok(
    !planTr.includes('所有 group worktree 都已合并到主分支？'),
    'Expected plan-tr to stop requiring pre-review merges',
  );
  assert.ok(
    !planDocTr.includes('All group worktrees merged to main branch?'),
    'Expected plan-doc-tr to stop requiring pre-review merges',
  );
});

test('dispatch/setup failures are retried immediately without waiting for the whole batch', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    planT.includes('不得等待其他 group 全部完成后再处理'),
    'Expected plan-t to prioritize immediate retry for dispatch/setup failures',
  );
  assert.ok(
    planTr.includes('不得等待其他 group 全部完成后再处理'),
    'Expected plan-tr to prioritize immediate retry for dispatch/setup failures',
  );
  assert.ok(
    planDocTr.includes('do not wait for the other groups to finish first'),
    'Expected plan-doc-tr to prioritize immediate retry for dispatch/setup failures',
  );
});

test('dispatch/setup failures are distinct from test failures', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    planT.includes('则视为 **dispatch / setup failure**，不是“测试失败”'),
    'Expected plan-t to distinguish dispatch/setup failures from test failures',
  );
  assert.ok(
    planTr.includes('则视为 **dispatch / setup failure**，不是“测试失败”'),
    'Expected plan-tr to distinguish dispatch/setup failures from test failures',
  );
  assert.ok(
    planDocTr.includes('treat it as a **dispatch / setup failure**, not a "test failure"'),
    'Expected plan-doc-tr to distinguish dispatch/setup failures from test failures',
  );
});

test('post-dispatch worktree loss falls back to rerunning that group from Phase 2', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    planT.includes('这不是 dispatch failure') && planT.includes('回到 Phase 2 重跑该 group'),
    'Expected plan-t to treat lost worktrees after dispatch as a Phase 2 rerun path',
  );
  assert.ok(
    planT.includes('该类重试最多 3 轮（**每个 group 独立计数**）') && planT.includes('`worktree_recovery_failed`'),
    'Expected plan-t to define per-group retry scope and blocking status for lost worktrees',
  );
  assert.ok(
    planTr.includes('这不是 dispatch failure') && planTr.includes('回到 Phase 2 重跑该 group'),
    'Expected plan-tr to treat lost worktrees after dispatch as a Phase 2 rerun path',
  );
  assert.ok(
    planTr.includes('该类重试最多 3 轮（**每个 group 独立计数**）') && planTr.includes('`worktree_recovery_failed`'),
    'Expected plan-tr to define per-group retry scope and blocking status for lost worktrees',
  );
  assert.ok(
    planDocTr.includes('that is **not a dispatch failure**') && planDocTr.includes('re-run that group from Phase 2'),
    'Expected plan-doc-tr to treat lost worktrees after dispatch as a Phase 2 rerun path',
  );
  assert.ok(
    planDocTr.includes('3 rounds **per group**') && planDocTr.includes('`worktree_recovery_failed`'),
    'Expected plan-doc-tr to define per-group retry scope and blocking status for lost worktrees',
  );
});

test('Phase 2 completion is blocked by both dispatch and worktree recovery failures', () => {
  const planT = read(commandFiles.planT);
  const planTr = read(commandFiles.planTr);
  const planDocTr = read(commandFiles.planDocTr);

  assert.ok(
    planT.includes('不存在 `dispatch_blocked` 或 `worktree_recovery_failed` 的 group'),
    'Expected plan-t Phase 2 completion marker to block on both dispatch and worktree recovery failures',
  );
  assert.ok(
    planTr.includes('不存在 `dispatch_blocked` 或 `worktree_recovery_failed` 的 group'),
    'Expected plan-tr Phase 2 completion marker to block on both dispatch and worktree recovery failures',
  );
  assert.ok(
    planDocTr.includes('No group remains `dispatch_blocked` or `worktree_recovery_failed`'),
    'Expected plan-doc-tr Phase 2 completion marker to block on both dispatch and worktree recovery failures',
  );
});

test('plan-t and plan-tr shared sections stay synced to the canonical Chinese template', () => {
  const template = read(templateFiles.zh);
  const expectedMergeSop = extractTemplateSection(template, 'Review-Pass Merge SOP');
  const expectedDispatchRetry = extractTemplateSection(template, 'Dispatch Failure Retry Policy');
  const expectedParallelReview = extractTemplateSection(template, 'Parallel Review Prompt');

  [commandFiles.planT, commandFiles.planTr].forEach((filePath) => {
    const source = read(filePath);

    assert.strictEqual(
      extractBetween(source, '**并发 dispatch / setup 失败处理**', '**执行操作**（串行模式 / 单组降级）：'),
      expectedDispatchRetry,
      `Expected ${path.basename(filePath)} dispatch/setup retry block to match the canonical Chinese template`,
    );

    assert.strictEqual(
      extractBetween(source, '**Review-pass Worktree 合并 SOP**', '**并行 worktree 预提示**'),
      expectedMergeSop,
      `Expected ${path.basename(filePath)} merge SOP to match the canonical Chinese template`,
    );

    assert.strictEqual(
      extractBetween(source, '**并行 Review（Phase 2 以并行模式运行时）**：', '**每轮审查执行操作**（串行模式 / 单组降级）：'),
      expectedParallelReview,
      `Expected ${path.basename(filePath)} parallel review prompt to match the canonical Chinese template`,
    );
  });
});

test('plan-doc-tr shared sections stay synced to the canonical English template', () => {
  const template = read(templateFiles.en);
  const expectedMergeSop = extractTemplateSection(template, 'Review-Pass Merge SOP');
  const expectedDispatchRetry = extractTemplateSection(template, 'Dispatch Failure Retry Policy');
  const expectedParallelReview = extractTemplateSection(template, 'Parallel Review Prompt');
  const source = read(commandFiles.planDocTr);

  assert.strictEqual(
    extractBetween(source, '**Dispatch / setup failure handling**', '**Execution** (serial mode / single group fallback):'),
    expectedDispatchRetry,
    'Expected plan-doc-tr dispatch/setup retry block to match the canonical English template',
  );

  assert.strictEqual(
    extractBetween(source, '**Review-pass Worktree Merge SOP**', 'Example parallel dispatch (single message, two tool calls):'),
    expectedMergeSop,
    'Expected plan-doc-tr merge SOP to match the canonical English template',
  );

  assert.strictEqual(
    extractBetween(source, '**Parallel review (when parallel mode was used in Phase 2)**:', '**Each review round execution** (serial mode / single group):'),
    expectedParallelReview,
    'Expected plan-doc-tr parallel review prompt to match the canonical English template',
  );
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);