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

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);