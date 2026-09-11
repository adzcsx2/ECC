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

function section(markdown, startHeading, endHeading) {
  const start = markdown.indexOf(startHeading);
  assert.notStrictEqual(start, -1, `missing section: ${startHeading}`);

  const end = markdown.indexOf(endHeading, start + startHeading.length);
  assert.notStrictEqual(end, -1, `missing section boundary: ${endHeading}`);
  return markdown.slice(start, end);
}

function assertOrdered(text, earlier, later, message) {
  const earlierIndex = text.indexOf(earlier);
  const laterIndex = text.indexOf(later);
  assert.notStrictEqual(earlierIndex, -1, `missing required text: ${earlier}`);
  assert.notStrictEqual(laterIndex, -1, `missing required text: ${later}`);
  assert.ok(earlierIndex < laterIndex, message);
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function assertDiscoverable(skill) {
  assert.match(skill, /^---\nname: code-review-loop\ndescription: [^\n]+\n/);
  assert.match(skill, /\$ecc-code-review/);
  assert.match(skill, /fresh review pass/i);
}

function assertBaselineRecipes(skill) {
  const scope = section(skill, '## Establish the Review Scope', '## Review-Fix-Review Cycle');
  const pr = section(skill, '## Pull Request Boundary', '## Final Report');

  assert.match(scope, /BASE_REV="\$\(git rev-parse HEAD\)"/);
  assertOrdered(
    scope,
    'BASE_REV="$(git rev-parse HEAD)"',
    'git diff --name-status "$BASE_REV"',
    'local BASE_REV must be assigned before the inventory uses it'
  );
  assert.match(
    normalizeWhitespace(scope),
    /shell sessions are not persistent.*literal commit ID/i
  );
  assert.match(pr, /git fetch "\$BASE_REMOTE" "\$BASE_REF"/);
  assert.match(pr, /BASE_REV="\$\(git merge-base HEAD FETCH_HEAD\)"/);
  assertOrdered(
    pr,
    'git fetch "$BASE_REMOTE" "$BASE_REF"',
    'BASE_REV="$(git merge-base HEAD FETCH_HEAD)"',
    'PR merge base must be computed from the fetched base ref'
  );
}

function assertCompleteRubric(skill) {
  const review = section(
    skill,
    '### 1. Run a Fresh Complete Review',
    '### 2. Evaluate the Gate'
  );
  assert.doesNotMatch(review, /in\s+Local Review Mode/i);
  for (const category of [
    'Correctness',
    'Type Safety',
    'Pattern Compliance',
    'Security',
    'Performance',
    'Completeness',
    'Maintainability',
  ]) {
    assert.match(review, new RegExp('`' + category + '`'));
  }
}

function assertValidationDispositions(skill) {
  const gate = section(
    skill,
    '### 2. Evaluate the Gate',
    '### 3. Repair the Current Findings'
  );
  const normalizedGate = normalizeWhitespace(gate);

  for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM']) {
    assert.match(normalizedGate, new RegExp('(?:zero|no)\\s+`' + severity + '`', 'i'));
  }
  assert.match(normalizedGate, /current review scope.*repair.*fresh complete review/i);
  assert.match(normalizedGate, /pre-existing or out-of-scope.*`BLOCKED`/i);
  assert.match(normalizedGate, /cannot determine causality.*`BLOCKED`/i);
  assert.match(
    normalizedGate,
    /do not start another review pass.*unless.*(?:file|scope).*changed/i
  );
  assert.match(
    normalizedGate,
    /validation.*changes the reviewed scope.*fresh complete review/i
  );
}

function assertGuardrails(skill) {
  assert.match(skill, /must not weaken or delete tests/i);
  assert.match(skill, /must not change[^\n]*(?:rubric|severity)/i);
  assert.match(skill, /maximum[^\n]*review pass/i);
  assert.match(skill, /do not commit, push, publish, approve, or merge/i);
}

function assertDistribution() {
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

  const skill = fs.readFileSync(SKILL_PATH, 'utf8');

  const tests = [
    [
      'is discoverable and delegates every review pass to ecc-code-review',
      () => assertDiscoverable(skill),
    ],
    [
      'defines executable local and PR baseline recipes before scope discovery',
      () => assertBaselineRecipes(skill),
    ],
    [
      'applies the complete seven-category review rubric on every pass',
      () => assertCompleteRubric(skill),
    ],
    [
      'requires deterministic validation dispositions before success',
      () => assertValidationDispositions(skill),
    ],
    [
      'prevents Goodhart fixes and has a finite failure fallback',
      () => assertGuardrails(skill),
    ],
    ['ships through the workflow-quality module and npm package', assertDistribution],
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
