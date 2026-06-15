/**
 * Tests for scripts/lib/exec-doc/pointer.js
 *
 * Run with: node tests/lib/exec-doc/pointer.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pointer = require('../../../scripts/lib/exec-doc/pointer');

const FIXTURE = path.join(__dirname, '..', '..', 'fixtures', 'exec-doc', '00-执行文档.md');

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

console.log('\n=== Testing pointer.js ===\n');

console.log('readPointer:');
T('解析 fixture 的标量字段', () => {
  const p = pointer.readPointer(FIXTURE);
  assert.strictEqual(p.ok, true);
  assert.strictEqual(p.current_phase, 1);
  assert.strictEqual(p.current_phase_status, 'not_started');
  assert.strictEqual(p.last_commit, null);
  assert.strictEqual(p.last_actor, 'main-agent');
  assert.strictEqual(p.next_action, '执行 Phase 1');
  assert.deepStrictEqual(p.blockers, []);
});

T('无 markers 返回 ok:false', () => {
  const tmp = path.join(os.tmpdir(), 'edoc-nomarker-' + Date.now() + '.md');
  fs.writeFileSync(tmp, 'no markers here', 'utf8');
  try {
    const p = pointer.readPointer(tmp);
    assert.strictEqual(p.ok, false);
    assert.strictEqual(p.reason, 'no-progress-pointer-markers');
  } finally {
    fs.unlinkSync(tmp);
  }
});

T('文件不存在返回 read-error', () => {
  const p = pointer.readPointer(path.join(os.tmpdir(), 'nonexistent-' + Date.now() + '.md'));
  assert.strictEqual(p.ok, false);
  assert.strictEqual(p.reason, 'read-error');
});

console.log('\nparseScalar:');
T('剥离双引号', () => {
  assert.strictEqual(pointer.parseScalar('x: "hello"', 'x'), 'hello');
});
T('剥离单引号', () => {
  assert.strictEqual(pointer.parseScalar("x: 'hi'", 'x'), 'hi');
});
T('识别 null / ~ / 空', () => {
  assert.strictEqual(pointer.parseScalar('x: null', 'x'), null);
  assert.strictEqual(pointer.parseScalar('x: ~', 'x'), null);
  assert.strictEqual(pointer.parseScalar('x:', 'x'), null);
});
T('字段缺失返回 undefined', () => {
  assert.strictEqual(pointer.parseScalar('y: 1', 'x'), undefined);
});

console.log('\nparseBlockers:');
T('内联空数组', () => {
  assert.deepStrictEqual(pointer.parseBlockers('blockers: []'), []);
});
T('内联非空数组', () => {
  assert.deepStrictEqual(pointer.parseBlockers('blockers: ["a", "b"]'), ['a', 'b']);
});
T('多行列表', () => {
  const block = 'blockers:\n  - foo\n  - bar\nnext: x';
  assert.deepStrictEqual(pointer.parseBlockers(block), ['foo', 'bar']);
});
T('无 blockers 字段返回空数组', () => {
  assert.deepStrictEqual(pointer.parseBlockers('other: 1'), []);
});

console.log('\nserializeScalar:');
T('null 序列化为 null', () => {
  assert.strictEqual(pointer.serializeScalar('x', null), 'x: null');
});
T('number 裸写', () => {
  assert.strictEqual(pointer.serializeScalar('x', 5), 'x: 5');
});
T('含特殊字符加双引号', () => {
  assert.strictEqual(pointer.serializeScalar('x', 'a:b'), 'x: "a:b"');
});
T('普通字符串裸写', () => {
  assert.strictEqual(pointer.serializeScalar('x', 'hello'), 'x: hello');
});

console.log('\nreplaceBlockers:');
T('已存在则替换', () => {
  assert.strictEqual(pointer.replaceBlockers('blockers: []', ['z']), 'blockers: ["z"]');
});
T('不存在保持原样', () => {
  assert.strictEqual(pointer.replaceBlockers('no blockers line', ['z']), 'no blockers line');
});

console.log('\nwritePointer（原子更新）:');
T('更新标量并读回验证', () => {
  const tmp = path.join(os.tmpdir(), 'edoc-write-' + Date.now() + '.md');
  fs.writeFileSync(tmp, fs.readFileSync(FIXTURE, 'utf8'), 'utf8');
  try {
    const r = pointer.writePointer(tmp, {
      current_phase: 2,
      current_phase_status: 'completed',
      last_actor: 'orchestrator',
    });
    assert.strictEqual(r.ok, true);
    const p = pointer.readPointer(tmp);
    assert.strictEqual(p.current_phase, 2);
    assert.strictEqual(p.current_phase_status, 'completed');
    assert.strictEqual(p.last_actor, 'orchestrator');
    // parallelizable_groups 块应原样保留（透传）
    const content = fs.readFileSync(tmp, 'utf8');
    assert.ok(content.includes('parallelizable_groups'));
    assert.ok(content.includes('group: A'));
    // 临时文件已清理
    assert.ok(!fs.existsSync(tmp + '.tmp-' + process.pid));
  } finally {
    fs.unlinkSync(tmp);
  }
});

T('无 markers 拒绝写入', () => {
  const tmp = path.join(os.tmpdir(), 'edoc-write2-' + Date.now() + '.md');
  fs.writeFileSync(tmp, 'no markers', 'utf8');
  try {
    const r = pointer.writePointer(tmp, { current_phase: 2 });
    assert.strictEqual(r.ok, false);
  } finally {
    fs.unlinkSync(tmp);
  }
});

T('不存在的字段跳过且不插入', () => {
  const tmp = path.join(os.tmpdir(), 'edoc-write3-' + Date.now() + '.md');
  fs.writeFileSync(tmp, fs.readFileSync(FIXTURE, 'utf8'), 'utf8');
  try {
    pointer.writePointer(tmp, { totally_nonexistent_field: 'x' });
    const content = fs.readFileSync(tmp, 'utf8');
    assert.ok(!content.includes('totally_nonexistent_field'), '不应插入不存在的字段');
    // 已有字段保持不变
    const p = pointer.readPointer(tmp);
    assert.strictEqual(p.current_phase, 1);
  } finally {
    fs.unlinkSync(tmp);
  }
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
