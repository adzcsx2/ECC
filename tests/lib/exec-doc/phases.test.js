/**
 * Tests for scripts/lib/exec-doc/phases.js
 *
 * Run with: node tests/lib/exec-doc/phases.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const phases = require('../../../scripts/lib/exec-doc/phases');

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

console.log('\n=== Testing phases.js ===\n');

console.log('parsePhases:');
T('解析 fixture 的 phase 与子项', () => {
  const r = phases.parsePhases(FIXTURE);
  assert.strictEqual(r.totalPhases, 2);
  assert.strictEqual(r.phases[0].phase, 1);
  assert.strictEqual(r.phases[0].items.length, 2);
  assert.strictEqual(r.phases[0].items[0].id, 'P1.1');
  assert.strictEqual(r.phases[0].items[0].checked, false);
  assert.strictEqual(r.phases[1].items[1].id, 'P2.2');
  assert.strictEqual(r.phases[1].items[1].checked, true);
});

T('phase 按编号排序', () => {
  const tmp = path.join(os.tmpdir(), 'edoc-order-' + Date.now() + '.md');
  fs.writeFileSync(
    tmp,
    '- [ ] P3.1: c\n- [ ] P1.1: a\n- [ ] P2.1: b\n',
    'utf8'
  );
  try {
    const r = phases.parsePhases(tmp);
    assert.strictEqual(r.phases[0].phase, 1);
    assert.strictEqual(r.phases[1].phase, 2);
    assert.strictEqual(r.phases[2].phase, 3);
  } finally {
    fs.unlinkSync(tmp);
  }
});

T('无 checklist 返回空', () => {
  const tmp = path.join(os.tmpdir(), 'edoc-empty-' + Date.now() + '.md');
  fs.writeFileSync(tmp, '# no phases here\nplain text\n', 'utf8');
  try {
    const r = phases.parsePhases(tmp);
    assert.strictEqual(r.totalPhases, 0);
    assert.deepStrictEqual(r.phases, []);
  } finally {
    fs.unlinkSync(tmp);
  }
});

console.log('\ndetectStack:');
T('flutter（pubspec.yaml + lib/main.dart）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-flutter-'));
  try {
    fs.writeFileSync(path.join(d, 'pubspec.yaml'), 'name: x');
    fs.mkdirSync(path.join(d, 'lib'));
    fs.writeFileSync(path.join(d, 'lib', 'main.dart'), '');
    assert.strictEqual(phases.detectStack(d), 'flutter');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('web（package.json + react）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-web-'));
  try {
    fs.writeFileSync(
      path.join(d, 'package.json'),
      JSON.stringify({ dependencies: { react: '1' } })
    );
    assert.strictEqual(phases.detectStack(d), 'web');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('python（requirements.txt）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-py-'));
  try {
    fs.writeFileSync(path.join(d, 'requirements.txt'), 'requests');
    assert.strictEqual(phases.detectStack(d), 'python');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('python（pyproject.toml）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-py2-'));
  try {
    fs.writeFileSync(path.join(d, 'pyproject.toml'), '[project]');
    assert.strictEqual(phases.detectStack(d), 'python');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('android（settings.gradle）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-android-'));
  try {
    fs.writeFileSync(path.join(d, 'settings.gradle'), '');
    assert.strictEqual(phases.detectStack(d), 'android');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('android（settings.gradle.kts）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-android-kts-'));
  try {
    fs.writeFileSync(path.join(d, 'settings.gradle.kts'), '');
    assert.strictEqual(phases.detectStack(d), 'android');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('java（pom.xml）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-java-'));
  try {
    fs.writeFileSync(path.join(d, 'pom.xml'), '<project></project>');
    assert.strictEqual(phases.detectStack(d), 'java');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('java（build.gradle）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-java-gradle-'));
  try {
    fs.writeFileSync(path.join(d, 'build.gradle'), '');
    assert.strictEqual(phases.detectStack(d), 'java');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('generic（空目录兜底）', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-generic-'));
  try {
    assert.strictEqual(phases.detectStack(d), 'generic');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

T('package.json 解析失败兜底为 web', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'edoc-badpj-'));
  try {
    fs.writeFileSync(path.join(d, 'package.json'), '{ not valid json');
    assert.strictEqual(phases.detectStack(d), 'web');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
