#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const commandPath = path.join(repoRoot, 'commands', 'prp-prd.md');
const command = fs.readFileSync(commandPath, 'utf8');

const tests = [
  ['routes project PRDs into docs/product when docs exists', () => {
    assert.ok(command.includes('If a root-level `docs/` directory exists'));
    assert.ok(command.includes('`docs/product/`'));
  }],
  ['requires a Chinese product-document filename in docs/product', () => {
    assert.ok(command.includes('{中文产品或功能名称}需求文档.md'));
  }],
  ['keeps the legacy PRP directory only as a no-docs fallback', () => {
    assert.ok(command.includes('If the project has no root-level `docs/` directory'));
    assert.ok(command.includes('`.claude/PRPs/prds/`'));
    assert.ok(command.includes('Do not write a second copy'));
  }],
  ['reports and hands off using the resolved PRD path', () => {
    assert.ok(command.includes('{resolved-prd-path}'));
    assert.ok(command.includes('/prp-plan {resolved-prd-path}'));
  }],
];

let passed = 0;
let failed = 0;

console.log('\n=== Testing PRD output routing contract ===\n');
for (const [name, test] of tests) {
  try {
    test();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (error) {
    failed++;
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${error.message}`);
  }
}

console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
