'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  GENERATED_MARKER,
  GENERATED_SKILL_MARKER,
  buildPrompt,
  buildSkill,
  removeEccCommandBridges,
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
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing Codex command compatibility sync ===\n');

  let passed = 0;
  let failed = 0;

  if (test('builds a safe prompt and skill bridge for code-review', () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, 'commands', 'code-review.md'), 'utf8');
    const sourcePath = path.join(REPO_ROOT, 'commands', 'code-review.md');
    const prompt = buildPrompt({ commandName: 'code-review', source });
    const skill = buildSkill({ commandName: 'code-review', sourcePath, source });

    assert.ok(prompt.includes(GENERATED_MARKER));
    assert.ok(prompt.includes('Use $$ecc-code-review for this request.'));
    assert.ok(skill.includes(GENERATED_SKILL_MARKER));
    assert.ok(skill.includes('Original command: `/ecc:code-review`'));
    assert.ok(skill.includes('Codex explicit skill mention: `$ecc-code-review`'));
    assert.ok(!/^model:/m.test(skill), 'Model routing must remain guidance, not skill frontmatter');
  })) passed++; else failed++;

  if (test('syncs every top-level Claude command into Codex prompts and skills', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');

    try {
      const commandCount = fs.readdirSync(path.join(REPO_ROOT, 'commands'))
        .filter(fileName => fileName.endsWith('.md')).length;
      const result = syncEccCommandsToCodex({
        repoRoot: REPO_ROOT,
        codexHome,
        skillsRoot,
        syncPrompts: true,
      });

      assert.strictEqual(commandCount, 96);
      assert.strictEqual(result.commandCount, commandCount);
      assert.strictEqual(result.writtenCount, commandCount);
      assert.strictEqual(result.writtenSkillCount, commandCount);
      assert.ok(fs.existsSync(path.join(codexHome, 'prompts', 'ecc-code-review.md')));
      assert.ok(fs.existsSync(path.join(skillsRoot, 'ecc-code-review', 'SKILL.md')));
      assert.ok(fs.existsSync(path.join(codexHome, 'prompts', 'ecc-command-prompts-manifest.txt')));
      assert.ok(fs.existsSync(path.join(skillsRoot, 'ecc-command-skills-manifest.txt')));
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
    }
  })) passed++; else failed++;

  if (test('preserves user files and refuses manifest path traversal during cleanup', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');
    const outsidePrompt = path.join(codexHome, 'outside.md');
    const outsideSkill = path.join(skillsRoot, '..', 'outside-skill');

    try {
      const promptsDir = path.join(codexHome, 'prompts');
      fs.mkdirSync(promptsDir, { recursive: true });
      fs.writeFileSync(path.join(promptsDir, 'ecc-code-review.md'), 'user-owned prompt\n');
      fs.writeFileSync(outsidePrompt, `${GENERATED_MARKER}\noutside\n`);
      fs.mkdirSync(outsideSkill, { recursive: true });
      fs.writeFileSync(path.join(outsideSkill, 'SKILL.md'), `${GENERATED_SKILL_MARKER}\noutside\n`);
      fs.writeFileSync(path.join(promptsDir, 'ecc-command-prompts-manifest.txt'), '../outside.md\n');
      fs.writeFileSync(path.join(skillsRoot, 'ecc-command-skills-manifest.txt'), '../outside-skill\n');

      const result = syncEccCommandsToCodex({
        repoRoot: REPO_ROOT,
        codexHome,
        skillsRoot,
        syncPrompts: true,
      });

      assert.strictEqual(fs.readFileSync(path.join(promptsDir, 'ecc-code-review.md'), 'utf8'), 'user-owned prompt\n');
      assert.ok(fs.existsSync(outsidePrompt), 'A traversal entry must not remove a file outside prompts/');
      assert.ok(fs.existsSync(path.join(outsideSkill, 'SKILL.md')), 'A traversal entry must not remove a directory outside skills/');
      assert.ok(result.skippedCount > 0, 'User-owned prompt should be reported as preserved');
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
      cleanup(outsideSkill);
      fs.rmSync(outsidePrompt, { force: true });
    }
  })) passed++; else failed++;

  if (test('supports skills-only sync while removing generated prompt aliases', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');

    try {
      syncEccCommandsToCodex({ repoRoot: REPO_ROOT, codexHome, skillsRoot, syncPrompts: true });
      const promptPath = path.join(codexHome, 'prompts', 'ecc-code-review.md');
      const userPromptPath = path.join(codexHome, 'prompts', 'ecc-user.md');
      fs.writeFileSync(userPromptPath, 'user prompt\n');

      const result = syncEccCommandsToCodex({
        repoRoot: REPO_ROOT,
        codexHome,
        skillsRoot,
        syncPrompts: false,
      });

      assert.ok(result.writtenSkillCount > 0);
      assert.ok(!fs.existsSync(promptPath), 'Generated prompt alias should be removed in skills-only mode');
      assert.ok(fs.existsSync(userPromptPath), 'User prompt should be preserved');
      assert.ok(!fs.existsSync(path.join(codexHome, 'prompts', 'ecc-command-prompts-manifest.txt')));
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
    }
  })) passed++; else failed++;

  if (test('removes only unmodified bridges and preserves skill directories with user files', () => {
    const codexHome = createTempDir('ecc-codex-home-');
    const skillsRoot = createTempDir('ecc-codex-skills-');

    try {
      syncEccCommandsToCodex({ repoRoot: REPO_ROOT, codexHome, skillsRoot, syncPrompts: true });
      const editedPrompt = path.join(codexHome, 'prompts', 'ecc-code-review.md');
      fs.appendFileSync(editedPrompt, '\nuser edit\n');
      const preservedSkillDir = path.join(skillsRoot, 'ecc-plan');
      fs.writeFileSync(path.join(preservedSkillDir, 'user-notes.md'), 'keep me\n');

      const dryRun = removeEccCommandBridges({
        repoRoot: REPO_ROOT,
        codexHome,
        skillsRoot,
        dryRun: true,
      });
      assert.ok(dryRun.removed.some(filePath => filePath.endsWith('ecc-plan.md')));
      assert.ok(dryRun.retained.some(filePath => filePath.endsWith('ecc-code-review.md')));
      assert.ok(dryRun.retained.some(filePath => filePath.endsWith('ecc-plan')));
      assert.ok(fs.existsSync(editedPrompt));

      const applied = removeEccCommandBridges({ repoRoot: REPO_ROOT, codexHome, skillsRoot });
      assert.ok(applied.retained.some(filePath => filePath.endsWith('ecc-code-review.md')));
      assert.ok(fs.existsSync(editedPrompt));
      assert.ok(fs.existsSync(path.join(preservedSkillDir, 'user-notes.md')));
      assert.ok(!fs.existsSync(path.join(skillsRoot, 'ecc-code-review')));
    } finally {
      cleanup(codexHome);
      cleanup(skillsRoot);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
