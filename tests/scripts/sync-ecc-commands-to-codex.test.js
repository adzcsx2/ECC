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
  loadCodexModelRoutes,
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

    assert.ok(prompt.includes('description: "Use /ecc:demo through Codex skill $ecc-demo. Demo command"'));
    assert.ok(prompt.includes('argument-hint: "[thing]"'));
    assert.ok(prompt.includes(GENERATED_MARKER));
    assert.ok(prompt.includes('Use $$ecc-demo for this request.'));
    assert.ok(prompt.includes('Original ECC command: `/ecc:demo`'));
    assert.ok(prompt.includes('Arguments: $ARGUMENTS'));
    assert.ok(!prompt.includes('Use $ARGUMENTS from "$$PWD".'));
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
    assert.ok(skill.includes('description: "Codex bridge for legacy Claude command /ecc:demo. Demo command"'));
    assert.ok(skill.includes(GENERATED_SKILL_MARKER));
    assert.ok(skill.includes('Legacy Claude Command Bridge'));
    assert.ok(skill.includes('read the source command completely before acting'));
    assert.ok(skill.includes('Original command: `/ecc:demo`'));
    assert.ok(skill.includes('Codex skill name: `$ecc-demo`'));
    assert.ok(skill.includes('Claude-style command text: `/ecc:demo`'));
    assert.ok(!skill.includes('Use $ARGUMENTS from "$$PWD".'));
  })) passed++; else failed++;

  if (test('injects Codex model route guidance into skill wrappers', () => {
    const skill = buildSkill({
      commandName: 'demo',
      sourcePath: path.join(REPO_ROOT, 'commands', 'demo.md'),
      source: [
        '---',
        'description: Demo command',
        '---',
        '',
        'Demo body.',
      ].join('\n'),
      modelRoute: {
        preferredModel: 'GPT-5.3-codex-spark',
        tier: 'spark',
        reason: 'Demo route',
        escalation: 'demo gets complex',
      },
    });

    assert.ok(skill.includes('## Codex Model Route'));
    assert.ok(skill.includes('- Preferred model: `GPT-5.3-codex-spark`'));
    assert.ok(skill.includes('- Route tier: `spark`'));
    assert.ok(skill.includes('- Reason: Demo route'));
    assert.ok(skill.includes('- Escalate when: demo gets complex'));
    assert.ok(!skill.match(/^model:/m), 'Model route must not be Codex skill frontmatter');
  })) passed++; else failed++;

  if (test('loads Codex model route manifest by skill name', () => {
    const routes = loadCodexModelRoutes(REPO_ROOT);

    assert.strictEqual(routes['ecc-auto-update'].preferredModel, 'GPT-5.3-codex-spark');
    assert.strictEqual(routes['ecc-auto-update'].tier, 'spark');
    assert.strictEqual(routes['ecc-plan'].preferredModel, 'high-reasoning');
  })) passed++; else failed++;

  if (test('syncs top-level ECC commands into Codex prompts and skills and writes manifests', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');

    try {
      const result = syncEccCommandsToCodex({
        repoRoot: REPO_ROOT,
        codexHome,
        skillsRoot,
        syncPrompts: true,
      });
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
      assert.ok(prompt.includes('Use $$ecc-plan for this request.'));
      assert.ok(prompt.includes('Original ECC command: `/ecc:plan`'));
      const skill = fs.readFileSync(skillPath, 'utf8');
      assert.ok(skill.includes(GENERATED_SKILL_MARKER));
      assert.ok(skill.includes('Original command: `/ecc:plan`'));
      assert.ok(skill.includes('Codex skill name: `$ecc-plan`'));
      assert.ok(skill.includes('## Codex Model Route'));
      assert.ok(skill.includes('- Preferred model: `high-reasoning`'));
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

  if (test('supports skills-only sync and removes generated prompt aliases', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');
    const promptsDir = path.join(codexHome, 'prompts');

    try {
      fs.mkdirSync(promptsDir, { recursive: true });
      fs.writeFileSync(path.join(promptsDir, 'ecc-plan.md'), `${GENERATED_MARKER}\nold plan\n`);
      fs.writeFileSync(path.join(promptsDir, 'ecc-user.md'), 'user prompt\n');
      fs.writeFileSync(path.join(promptsDir, 'ecc-command-prompts-manifest.txt'), 'ecc-plan.md\necc-user.md\n');

      const result = syncEccCommandsToCodex({
        repoRoot: REPO_ROOT,
        codexHome,
        skillsRoot,
        syncPrompts: false,
      });
      const skillPath = path.join(skillsRoot, 'ecc-plan', 'SKILL.md');
      const autoUpdateSkillPath = path.join(skillsRoot, 'ecc-auto-update', 'SKILL.md');
      const manifestPath = path.join(promptsDir, 'ecc-command-prompts-manifest.txt');

      assert.strictEqual(result.writtenCount, 0);
      assert.ok(result.writtenSkillCount > 0, 'Should still generate command skills');
      assert.ok(!fs.existsSync(path.join(promptsDir, 'ecc-plan.md')), 'Should remove generated prompt alias');
      assert.ok(fs.existsSync(path.join(promptsDir, 'ecc-user.md')), 'Should keep user prompt');
      assert.ok(!fs.existsSync(manifestPath), 'Should remove prompt manifest in skills-only mode');
      assert.ok(fs.existsSync(skillPath), 'Should keep generating ecc-plan skill');
      assert.ok(
        fs.readFileSync(autoUpdateSkillPath, 'utf8').includes('- Preferred model: `GPT-5.3-codex-spark`'),
        'Should inject Spark route for mechanical command skills'
      );
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
