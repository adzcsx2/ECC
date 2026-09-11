#!/usr/bin/env node
/**
 * 锁定 ECC 全量代码审查修复循环的关键行为契约。
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'code-review-loop', 'SKILL.md');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`  PASS ${name}`);
    return true;
  } catch (error) {
    console.log(`  FAIL ${name}`);
    console.error(`    ${error.message}`);
    return false;
  }
}

function main() {
  console.log('\n=== Testing code-review-loop skill ===\n');

  const tests = [
    ['is discoverable and delegates every review pass to ecc-code-review', () => {
      const skill = fs.readFileSync(SKILL_PATH, 'utf8');
      assert.match(skill, /^---\nname: code-review-loop\ndescription: [^\n]+\n/);
      assert.match(skill, /\$ecc-code-review/);
      assert.match(skill, /fresh review pass/i);
    }],
    ['rebuilds the complete review scope from one immutable baseline', () => {
      const skill = fs.readFileSync(SKILL_PATH, 'utf8');
      assert.match(skill, /immutable baseline/i);
      assert.match(skill, /git diff --name-status/);
      assert.match(skill, /git ls-files --others --exclude-standard/);
      assert.match(skill, /read every changed file in full/i);
      assert.match(skill, /not only[^\n]*(?:fix|previous)/i);
      assert.match(skill, /PR branch[\s\S]*fixed merge base/i);
      assert.match(skill, /replace[^\n]*`git diff[^`]*HEAD`[^\n]*discovery/i);
    }],
    ['requires a clean fresh review and validation before success', () => {
      const skill = fs.readFileSync(SKILL_PATH, 'utf8');
      for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM']) {
        assert.match(skill, new RegExp('(?:zero|no)\\s+`' + severity + '`', 'i'));
      }
      assert.match(skill, /validation[^\n]*pass/i);
      assert.match(skill, /LOW[^\n]*non-blocking/i);
      assert.match(skill, /must not claim success/i);
      assert.match(skill, /validation[\s\S]*changes the reviewed scope[\s\S]*fresh complete review/i);
    }],
    ['prevents Goodhart fixes and has a finite failure fallback', () => {
      const skill = fs.readFileSync(SKILL_PATH, 'utf8');
      assert.match(skill, /must not weaken or delete tests/i);
      assert.match(skill, /must not change[^\n]*(?:rubric|severity)/i);
      assert.match(skill, /maximum[^\n]*review pass/i);
      assert.match(skill, /do not commit, push, publish, approve, or merge/i);
    }],
    ['ships through the workflow-quality module and npm package', () => {
      const modules = readJson('manifests/install-modules.json').modules;
      const workflowQuality = modules.find((candidate) => candidate.id === 'workflow-quality');
      assert.ok(workflowQuality, 'workflow-quality module is missing');
      assert.ok(
        workflowQuality.paths.includes('skills/code-review-loop'),
        'code-review-loop is missing from workflow-quality'
      );

      const packageFiles = readJson('package.json').files;
      assert.ok(
        packageFiles.includes('skills/code-review-loop/'),
        'code-review-loop is missing from package files'
      );
    }],
  ];

  let passed = 0;
  let failed = 0;
  for (const [name, fn] of tests) {
    if (runTest(name, fn)) passed += 1;
    else failed += 1;
  }

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
