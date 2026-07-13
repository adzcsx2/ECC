'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const commandPath = path.join(repoRoot, 'commands', 'plan-doc.md');
const referencePaths = [
  path.join(repoRoot, 'commands', 'plan-doc', 'references', 'document-contract.md'),
  path.join(repoRoot, 'commands', 'plan-doc', 'references', 'subagent-routing.md'),
  path.join(repoRoot, 'commands', 'plan-doc', 'references', 'post-generation-quality-gate.md'),
];

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

function readCommand() {
  return fs.readFileSync(commandPath, 'utf8');
}

function readCommandBundle() {
  return [commandPath, ...referencePaths]
    .map((filePath) => fs.readFileSync(filePath, 'utf8'))
    .join('\n');
}

console.log('\n=== Testing /plan-doc post-generation quality gate ===\n');

test('keeps the main command lean and loads references at explicit checkpoints', () => {
  const source = readCommand();
  const lineCount = source.split(/\r?\n/).length;

  assert.ok(lineCount <= 350, `Expected main command <= 350 lines, got ${lineCount}`);
  for (const relativePath of [
    'plan-doc/references/document-contract.md',
    'plan-doc/references/subagent-routing.md',
    'plan-doc/references/post-generation-quality-gate.md',
  ]) {
    assert.ok(source.includes(relativePath), `Expected loading instruction for ${relativePath}`);
  }
  assert.ok(
    source.includes('Read them') &&
      source.includes('again immediately before Stage 5'),
    'Expected the document contract and final quality gate to be refreshed immediately before use',
  );
});

test('generates before re-reading the document contract for the final audit', () => {
  const command = readCommand();
  const bundle = readCommandBundle();

  assert.ok(
    !command.includes('Before Stage 4 writes any file, reread'),
    'Expected Stage 4 not to require a redundant pre-write contract reread',
  );
  assert.ok(
    command.includes('After every expected file is written or checkpoint-resolved, reread') &&
      command.includes('plan-doc/references/document-contract.md'),
    'Expected the document contract to be refreshed only after generation',
  );
  assert.ok(
    bundle.includes('Document-contract conformance audit'),
    'Expected Stage 5 to audit generated files against the freshly read contract',
  );
});

test('keeps every required reference present and non-empty', () => {
  for (const filePath of referencePaths) {
    assert.ok(fs.existsSync(filePath), `Missing required reference: ${filePath}`);
    assert.ok(fs.readFileSync(filePath, 'utf8').trim().length > 0, `Empty reference: ${filePath}`);
  }
});

test('re-reads product sources after every execution document is written', () => {
  const source = readCommandBundle();

  assert.ok(
    source.includes('Re-read every product source from disk'),
    'Expected a fresh product-document read after generation',
  );
  assert.ok(
    source.includes('Do NOT rely only on the Generation Handoff'),
    'Expected the final audit not to trust the handoff as the sole source',
  );
});

test('requires bidirectional requirement traceability', () => {
  const source = readCommandBundle();

  assert.ok(
    source.includes('Product → execution'),
    'Expected every product requirement to map to executable items',
  );
  assert.ok(
    source.includes('Execution → product'),
    'Expected every execution item to map back to product intent',
  );
  assert.ok(
    source.includes('REQ-001'),
    'Expected stable derived requirement IDs when product docs have none',
  );
});

test('audits execution-document robustness beyond happy paths', () => {
  const source = readCommandBundle();

  for (const required of [
    'failure paths',
    'timeouts and cancellation',
    'retry and idempotency',
    'concurrency and state consistency',
    'migration and backward compatibility',
    'observability and rollback',
  ]) {
    assert.ok(source.includes(required), `Expected robustness check: ${required}`);
  }
});

test('runs one audit and never enters a repair/re-audit loop', () => {
  const source = readCommandBundle();

  assert.ok(
    source.includes('complete audit exactly once per') &&
      source.includes('Single repair pass (mandatory; no re-audit)'),
    'Expected one complete audit followed by at most one repair pass',
  );
  assert.ok(
    source.includes('Do not rerun, restart, or recursively invoke'),
    'Expected an explicit prohibition on recursive or repeated audits',
  );
  assert.ok(
    !source.includes('Repair loop (mandatory)') &&
      !source.includes('Re-run the complete alignment and robustness audit') &&
      !source.includes('Continue until no confirmed defect remains'),
    'Expected all unbounded repair/re-audit loop instructions to be removed',
  );
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
