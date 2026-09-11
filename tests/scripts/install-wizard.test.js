'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  buildInstallArgs,
  collectInteractiveOptions,
  listWizardTargets,
  main,
  parseArgs,
  validateExecutionMode,
} = require('../../scripts/install-wizard');

const repoRoot = path.join(__dirname, '..', '..');

function capture(isTTY = true) {
  let value = '';
  return {
    isTTY,
    write(chunk) {
      value += chunk;
    },
    read() {
      return value;
    },
  };
}

function fakeTerminal(answers) {
  const queue = [...answers];
  const prompts = [];
  return {
    async question(prompt = '') {
      prompts.push(prompt);
      if (queue.length === 0) throw new Error('No fake answer available');
      return queue.shift();
    },
    close() {},
    get prompts() {
      return [...prompts];
    },
  };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

(async () => {
  console.log('\n=== Interactive installer wizard tests ===\n');

  let passed = 0;
  let failed = 0;

  if (await test('lists every supported AI tool target once', () => {
    const targets = listWizardTargets();
    const ids = targets.map(target => target.target);
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.ok(ids.includes('codex'));
    assert.ok(ids.includes('claude'));
    assert.ok(ids.includes('cursor'));
    assert.ok(ids.includes('openclaw'));
    assert.ok(!ids.includes('claude-project'));
  })) passed++; else failed++;

  if (await test('parses explicit target, full profile, and hook choice', () => {
    assert.deepStrictEqual(
      parseArgs(['--target', 'codex', '--profile', 'full', '--no-hooks', '--yes']),
      {
        target: 'codex',
        profile: 'full',
        enableHooks: false,
        noHooks: true,
        yes: true,
        dryRun: false,
        json: false,
        help: false,
      }
    );
    assert.throws(
      () => validateExecutionMode(parseArgs([]), false),
      /--target/i
    );
  })) passed++; else failed++;

  if (await test('builds a full Codex install request', () => {
    assert.deepStrictEqual(
      buildInstallArgs({ target: 'codex', profile: 'full' }),
      ['--target', 'codex', '--profile', 'full']
    );
  })) passed++; else failed++;

  if (await test('interactive Codex selection confirms a full install and advertises code-review-loop', async () => {
    const output = capture();
    const terminal = fakeTerminal(['2', 'y']);
    let appliedArgs = null;
    const code = await main([], {
      interactive: true,
      output,
      terminal,
      runInstaller: args => {
        appliedArgs = args;
        return 0;
      },
    });

    assert.strictEqual(code, 0);
    assert.deepStrictEqual(appliedArgs, ['--target', 'codex', '--profile', 'full']);
    assert.match(output.read(), /code-review-loop/);
    assert.deepStrictEqual(terminal.prompts, [
      'Choose one option: ',
      'Apply ECC to Codex with the full profile? [y/N]: ',
    ]);
  })) passed++; else failed++;

  if (await test('Claude selection asks for hook consent and preserves a no-hooks choice', async () => {
    const output = capture();
    const terminal = fakeTerminal(['1', 'n', 'y']);
    let appliedArgs = null;
    const code = await main([], {
      interactive: true,
      output,
      terminal,
      runInstaller: args => {
        appliedArgs = args;
        return 0;
      },
    });

    assert.strictEqual(code, 0);
    assert.deepStrictEqual(appliedArgs, [
      '--target', 'claude', '--profile', 'full', '--no-hooks',
    ]);
  })) passed++; else failed++;

  if (await test('full Codex plan contains code-review-loop', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/install-apply.js', ...buildInstallArgs({ target: 'codex', profile: 'full' }), '--dry-run', '--json'],
      { cwd: repoRoot, encoding: 'utf8' }
    );
    assert.strictEqual(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.ok(
      payload.plan.operations.some(operation => operation.sourceRelativePath === 'skills\\code-review-loop\\SKILL.md'),
      'full Codex plan must include code-review-loop'
    );
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exitCode = failed > 0 ? 1 : 0;
})();
