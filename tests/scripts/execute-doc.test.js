/**
 * Tests for scripts/execute-doc.js
 *
 * Run with: node tests/scripts/execute-doc.test.js
 *
 * 纯函数 + runOrchestration（注入 mock dispatch/audit/onUpdate）充分覆盖；
 * main() 的真实 claude 调用留给集成验证，不在单测范围。
 */

const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');
const ed = require('../../scripts/execute-doc');

const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'exec-doc');
const REPO = path.join(__dirname, '..', '..');

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

console.log('\n=== Testing execute-doc.js ===\n');

console.log('parseArgs:');
T('默认值', () => {
  const a = ed.parseArgs(['node', 'x', 'doc.md']);
  assert.strictEqual(a.docArg, 'doc.md');
  assert.strictEqual(a.maxRetries, 3);
  assert.strictEqual(a.dryRun, false);
  assert.strictEqual(a.upstream, undefined);
});

T('全选项解析', () => {
  const a = ed.parseArgs([
    'node', 'x', 'd.md',
    '--phase', '2',
    '--model', 'foo',
    '--test-cmd', 'npm test',
    '--upstream', 'a.md,b.md',
    '--max-retries', '5',
    '--dry-run',
  ]);
  assert.strictEqual(a.phase, 2);
  assert.strictEqual(a.model, 'foo');
  assert.strictEqual(a.testCmd, 'npm test');
  assert.strictEqual(a.upstream, 'a.md,b.md');
  assert.strictEqual(a.maxRetries, 5);
  assert.strictEqual(a.dryRun, true);
});

T('无 docArg', () => {
  const a = ed.parseArgs(['node', 'x', '--dry-run']);
  assert.strictEqual(a.docArg, undefined);
});

console.log('\nresolveModel:');
T('cliModel 最高优先', () => {
  assert.strictEqual(ed.resolveModel('foo'), 'foo');
});

T('$CLAUDE_MODEL 优先于 settings', () => {
  const orig = process.env.CLAUDE_MODEL;
  process.env.CLAUDE_MODEL = 'env-model';
  try {
    assert.strictEqual(ed.resolveModel(undefined), 'env-model');
  } finally {
    if (orig === undefined) delete process.env.CLAUDE_MODEL;
    else process.env.CLAUDE_MODEL = orig;
  }
});

T('回退到 settings 返回 string 或 undefined', () => {
  const orig = process.env.CLAUDE_MODEL;
  delete process.env.CLAUDE_MODEL;
  try {
    const m = ed.resolveModel(undefined);
    assert.ok(m === undefined || typeof m === 'string');
  } finally {
    if (orig !== undefined) process.env.CLAUDE_MODEL = orig;
  }
});

console.log('\nresolveDocPath:');
T('目录拼接 00-执行文档.md', () => {
  const p = ed.resolveDocPath(FIXTURE_DIR);
  assert.ok(p.endsWith('00-执行文档.md'));
});

T('文件路径原样返回', () => {
  const p = ed.resolveDocPath(path.join(FIXTURE_DIR, '00-执行文档.md'));
  assert.ok(p.endsWith('00-执行文档.md'));
});

T('无参数返回 null', () => {
  assert.strictEqual(ed.resolveDocPath(undefined), null);
  assert.strictEqual(ed.resolveDocPath(''), null);
});

T('不存在路径原样返回（交给存在性检查）', () => {
  const p = ed.resolveDocPath('/nonexistent/path/doc.md');
  assert.ok(p.endsWith('doc.md'));
});

console.log('\nbuildPhasePrompt:');
T('含 phase 号、repo、checklist、中文约束', () => {
  const p = ed.buildPhasePrompt('/d.md', 3, '/repo');
  assert.ok(p.includes('Phase 3'));
  assert.ok(p.includes('/repo'));
  assert.ok(p.includes('P3.1'));
  assert.ok(p.includes('中文'));
  assert.ok(p.includes('progress pointer'));
});

console.log('\nauditPhase:');
T('无改动 → no-changes fail', () => {
  const r = ed.auditPhase(REPO, 'HEAD', [], '');
  assert.strictEqual(r.pass, false);
  assert.strictEqual(r.reason, 'no-changes');
});

T('有改动且无违例 → pass', () => {
  const r = ed.auditPhase(REPO, 'HEAD~1', [], '');
  assert.strictEqual(r.pass, true);
});

console.log('\nrunOrchestration（注入 mock）:');
T('正常推进全部 phase', () => {
  const updates = [];
  const r = ed.runOrchestration({
    startPhase: 1,
    totalPhases: 2,
    maxRetries: 3,
    dispatch: () => ({ response: 'ok' }),
    audit: () => ({ pass: true }),
    onUpdate: (u) => updates.push(u),
  });
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.phases, [1, 2]);
  assert.strictEqual(updates.length, 2);
  assert.strictEqual(updates[0].isLast, false);
  assert.strictEqual(updates[1].isLast, true);
});

T('首轮失败、重试后通过', () => {
  let calls = 0;
  const r = ed.runOrchestration({
    startPhase: 1,
    totalPhases: 1,
    maxRetries: 3,
    dispatch: () => ({}),
    audit: () => {
      calls++;
      return calls >= 2 ? { pass: true } : { pass: false, reason: 'test-failed' };
    },
    onUpdate: () => {},
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(calls, 2);
});

T('maxRetries 用尽 → 封闭清单 #2', () => {
  const r = ed.runOrchestration({
    startPhase: 1,
    totalPhases: 1,
    maxRetries: 2,
    dispatch: () => ({}),
    audit: () => ({ pass: false, reason: 'test-failed' }),
    onUpdate: () => {},
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'max-retries');
  assert.strictEqual(r.phase, 1);
});

T('upstream 违例 → 封闭清单 #3 立即停', () => {
  const r = ed.runOrchestration({
    startPhase: 1,
    totalPhases: 3,
    maxRetries: 3,
    dispatch: () => ({}),
    audit: () => ({ pass: false, fatal: true, files: ['README.md'] }),
    onUpdate: () => {},
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'upstream-guard');
  assert.strictEqual(r.phase, 1);
  assert.deepStrictEqual(r.files, ['README.md']);
});

T('onLog 收到进度消息', () => {
  const logs = [];
  ed.runOrchestration({
    startPhase: 1,
    totalPhases: 1,
    maxRetries: 1,
    dispatch: () => ({}),
    audit: () => ({ pass: true }),
    onUpdate: () => {},
    onLog: (m) => logs.push(m),
  });
  assert.ok(logs.some((l) => l.includes('Phase 1')));
  assert.ok(logs.some((l) => l.includes('审计通过')));
});

console.log('\nmain --dry-run（子进程，不调 claude）:');
T('dry-run 打印计划且不执行', () => {
  const out = execFileSync(
    'node',
    [path.join(REPO, 'scripts', 'execute-doc.js'), FIXTURE_DIR, '--dry-run'],
    { encoding: 'utf8', cwd: REPO, timeout: 15000 }
  );
  assert.ok(out.includes('起点 Phase 1'), '应打印起点 phase');
  assert.ok(out.includes('共 2'), '应打印 phase 总数');
  assert.ok(out.includes('--dry-run'), '应标识 dry-run');
});

T('无参数打印 usage 并退出非零', () => {
  let exitCode = 0;
  try {
    execFileSync('node', [path.join(REPO, 'scripts', 'execute-doc.js')], {
      encoding: 'utf8',
      cwd: REPO,
      timeout: 15000,
    });
  } catch (e) {
    exitCode = e.status;
  }
  assert.notStrictEqual(exitCode, 0, '无参数应非零退出');
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
