/**
 * Tests for scripts/lib/exec-doc/gate.js
 *
 * Run with: node tests/lib/exec-doc/gate.test.js
 */

const assert = require('assert');
const path = require('path');
const gate = require('../../../scripts/lib/exec-doc/gate');

// ECC repo 本身是 git 仓库，用于测试 git 类函数
const REPO = path.join(__dirname, '..', '..', '..');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;
const T = (n, f) => {
  if (test(n, f)) passed++;
  else failed++;
};

console.log('\n=== Testing gate.js ===\n');

console.log('checkUpstreamGuard:');
T('空 upstream 列表无违例', () => {
  const r = gate.checkUpstreamGuard(['a.js', 'b.js'], []);
  assert.strictEqual(r.violated, false);
  assert.deepStrictEqual(r.files, []);
});

T('null upstream 无违例', () => {
  const r = gate.checkUpstreamGuard(['a.js'], null);
  assert.strictEqual(r.violated, false);
});

T('精确文件名匹配', () => {
  const r = gate.checkUpstreamGuard(['src/a.js', 'README.md'], ['README.md']);
  assert.strictEqual(r.violated, true);
  assert.deepStrictEqual(r.files, ['README.md']);
});

T('目录前缀匹配（带尾斜杠）', () => {
  const r = gate.checkUpstreamGuard(['.cursor/rules/x.mdc', 'src/a.js'], ['.cursor/rules/']);
  assert.strictEqual(r.violated, true);
  assert.deepStrictEqual(r.files, ['.cursor/rules/x.mdc']);
});

T('目录前缀匹配（不带尾斜杠自动补）', () => {
  const r = gate.checkUpstreamGuard(['docs/guide/a.md'], ['docs/guide']);
  assert.strictEqual(r.violated, true);
});

T('无关文件不误报', () => {
  const r = gate.checkUpstreamGuard(['src/a.js', 'src/b.js'], ['README.md', 'docs/']);
  assert.strictEqual(r.violated, false);
});

console.log('\nrunTestCommand:');
T('空命令跳过且视为通过', () => {
  const r = gate.runTestCommand(REPO, '');
  assert.strictEqual(r.skipped, true);
  assert.strictEqual(r.ok, true);
});

T('成功命令（exit 0）', () => {
  const r = gate.runTestCommand(REPO, 'node --version');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.skipped, false);
});

T('失败命令（非零退出）', () => {
  const r = gate.runTestCommand(REPO, 'node --bad-flag-xyz-12345');
  assert.strictEqual(r.ok, false);
});

console.log('\ngit 类函数（在 ECC repo 内）:');
T('gitStatusPorcelain 返回字符串', () => {
  const r = gate.gitStatusPorcelain(REPO);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(typeof r.stdout, 'string');
});

T('gitHead 返回非空 hash', () => {
  const h = gate.gitHead(REPO);
  assert.ok(typeof h === 'string' && h.length > 0, '应返回 commit hash');
});

T('gitDiffNameOnly 无 baseline 返回数组', () => {
  const r = gate.gitDiffNameOnly(REPO);
  assert.strictEqual(r.ok, true);
  assert.ok(Array.isArray(r.files));
});

T('gitDiffNameOnly 无效 baseline 返回 ok:false', () => {
  const r = gate.gitDiffNameOnly(REPO, 'not-a-real-ref-xyz');
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.files, []);
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
