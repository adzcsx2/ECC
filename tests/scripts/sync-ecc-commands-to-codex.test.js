/**
 * Tests for scripts/codex/sync-ecc-commands-to-codex.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  GENERATED_MARKER,
  GENERATED_SKILL_MARKER,
  buildSkill,
  buildPrompt,
  escapeCodexPromptDollars,
  syncEccCommandsToCodex,
} = require('../../scripts/codex/sync-ecc-commands-to-codex');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (error) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing Codex command prompt sync ===\n');

  let passed = 0;
  let failed = 0;

  if (test('escapes non-argument prompt variables while preserving $ARGUMENTS', () => {
    const escaped = escapeCodexPromptDollars('Task: $ARGUMENTS\nRoot: "$PWD"\nCount: ${COMMITS:-200}');
    assert.ok(escaped.includes('Task: $ARGUMENTS'));
    assert.ok(escaped.includes('Root: "$$PWD"'));
    assert.ok(escaped.includes('Count: $${COMMITS:-200}'));
  })) passed++; else failed++;

  if (test('builds Codex prompt frontmatter from command metadata', () => {
    const prompt = buildPrompt({
      commandName: 'demo',
      sourcePath: path.join(REPO_ROOT, 'commands', 'demo.md'),
      source: [
        '---',
        'description: Demo command',
        'argument-hint: "[thing]"',
        '---',
        '',
        'Use $ARGUMENTS from "$PWD".',
      ].join('\n'),
    });

    assert.ok(prompt.includes('description: "Run ECC /ecc:demo workflow. Demo command"'));
    assert.ok(prompt.includes('argument-hint: "[thing]"'));
    assert.ok(prompt.includes(GENERATED_MARKER));
    assert.ok(prompt.includes('Original Claude command: `/ecc:demo`'));
    assert.ok(prompt.includes('Codex prompt alias: `/prompts:ecc-demo`'));
    assert.ok(prompt.includes('Use $ARGUMENTS from "$$PWD".'));
  })) passed++; else failed++;

  if (test('builds Codex skill wrapper from command metadata', () => {
    const skill = buildSkill({
      commandName: 'demo',
      sourcePath: path.join(REPO_ROOT, 'commands', 'demo.md'),
      source: [
        '---',
        'description: Demo command',
        'argument-hint: "[thing]"',
        '---',
        '',
        'Use $ARGUMENTS from "$PWD".',
      ].join('\r\n'),
    });

    assert.ok(skill.includes('name: ecc-demo'));
    assert.ok(skill.includes('description: "Codex skill bridge for ECC command /ecc:demo. Demo command"'));
    assert.ok(skill.includes(GENERATED_SKILL_MARKER));
    assert.ok(skill.includes('Original Claude command: `/ecc:demo`'));
    assert.ok(skill.includes('Codex explicit skill mention: `$ecc-demo`'));
    assert.ok(skill.includes('Use $ARGUMENTS from "$$PWD".'));
  })) passed++; else failed++;

  if (test('syncs top-level ECC commands into Codex prompts and skills and writes manifests', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');

    try {
      const result = syncEccCommandsToCodex({ repoRoot: REPO_ROOT, codexHome, skillsRoot });
      const commandCount = fs.readdirSync(path.join(REPO_ROOT, 'commands'))
        .filter(fileName => fileName.endsWith('.md')).length;
      const promptPath = path.join(codexHome, 'prompts', 'ecc-plan.md');
      const skillPath = path.join(skillsRoot, 'ecc-plan', 'SKILL.md');
      const manifestPath = path.join(codexHome, 'prompts', 'ecc-command-prompts-manifest.txt');
      const skillManifestPath = path.join(skillsRoot, 'ecc-command-skills-manifest.txt');

      assert.strictEqual(result.writtenCount, commandCount);
      assert.strictEqual(result.writtenSkillCount, commandCount);
      assert.ok(fs.existsSync(promptPath), 'Should generate ecc-plan prompt');
      assert.ok(fs.existsSync(skillPath), 'Should generate ecc-plan skill');
      assert.ok(fs.existsSync(manifestPath), 'Should write generated prompt manifest');
      assert.ok(fs.existsSync(skillManifestPath), 'Should write generated skill manifest');

      const prompt = fs.readFileSync(promptPath, 'utf8');
      assert.ok(prompt.includes(GENERATED_MARKER));
      assert.ok(prompt.includes('Original Claude command: `/ecc:plan`'));
      assert.ok(prompt.includes('Codex prompt alias: `/prompts:ecc-plan`'));
      const skill = fs.readFileSync(skillPath, 'utf8');
      assert.ok(skill.includes(GENERATED_SKILL_MARKER));
      assert.ok(skill.includes('Original Claude command: `/ecc:plan`'));
      assert.ok(skill.includes('Codex explicit skill mention: `$ecc-plan`'));
      assert.ok(!fs.existsSync(path.join(codexHome, 'prompts', 'ecc-README.md')));
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
    }
  })) passed++; else failed++;

  if (test('removes stale generated prompts and skills without touching user files', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');
    const promptsDir = path.join(codexHome, 'prompts');

    try {
      fs.mkdirSync(promptsDir, { recursive: true });
      fs.writeFileSync(path.join(promptsDir, 'ecc-old.md'), `${GENERATED_MARKER}\nold\n`);
      fs.writeFileSync(path.join(promptsDir, 'ecc-user.md'), 'user prompt\n');
      fs.writeFileSync(path.join(promptsDir, 'ecc-command-prompts-manifest.txt'), 'ecc-old.md\necc-user.md\n');
      fs.mkdirSync(path.join(skillsRoot, 'ecc-old'), { recursive: true });
      fs.mkdirSync(path.join(skillsRoot, 'ecc-user'), { recursive: true });
      fs.writeFileSync(path.join(skillsRoot, 'ecc-old', 'SKILL.md'), `${GENERATED_SKILL_MARKER}\nold\n`);
      fs.writeFileSync(path.join(skillsRoot, 'ecc-user', 'SKILL.md'), 'user skill\n');
      fs.writeFileSync(path.join(skillsRoot, 'ecc-command-skills-manifest.txt'), 'ecc-old\necc-user\n');

      const result = syncEccCommandsToCodex({ repoRoot: REPO_ROOT, codexHome, skillsRoot });

      assert.strictEqual(result.removedCount, 1);
      assert.strictEqual(result.removedSkillCount, 1);
      assert.ok(!fs.existsSync(path.join(promptsDir, 'ecc-old.md')));
      assert.ok(fs.existsSync(path.join(promptsDir, 'ecc-user.md')));
      assert.ok(!fs.existsSync(path.join(skillsRoot, 'ecc-old')));
      assert.ok(fs.existsSync(path.join(skillsRoot, 'ecc-user', 'SKILL.md')));
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
