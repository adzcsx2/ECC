#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const GENERATED_MARKER = '<!-- ecc-codex-command-prompt-generated -->';
const GENERATED_SKILL_MARKER = '<!-- ecc-codex-command-skill-generated -->';
const MANIFEST_FILE = 'ecc-command-prompts-manifest.txt';
const SKILL_MANIFEST_FILE = 'ecc-command-skills-manifest.txt';

function getDefaultCodexHome() {
  return process.env.CODEX_HOME || path.join(process.env.HOME || os.homedir(), '.codex');
}

function getDefaultSkillRoot() {
  return path.join(process.env.HOME || os.homedir(), '.agents', 'skills');
}

function normalizeSlashPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function jsonString(value) {
  return JSON.stringify(String(value || ''));
}

function parseCommandFile(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const metadata = {};
  let bodyStart = 0;

  if (lines[0] === '---') {
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index] === '---') {
        bodyStart = index + 1;
        break;
      }

      const match = lines[index].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (match) {
        metadata[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  return {
    metadata,
    body: lines.slice(bodyStart).join('\n').replace(/^\n+/, ''),
  };
}

function escapeCodexPromptDollars(body) {
  return String(body || '')
    .split('$')
    .join('$$')
    .split('$$ARGUMENTS')
    .join('$ARGUMENTS');
}

function listCommandFiles(commandsDir) {
  if (!fs.existsSync(commandsDir)) {
    throw new Error(`Missing ECC commands directory: ${commandsDir}`);
  }

  return fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function buildPrompt({ commandName, sourcePath, source }) {
  const parsed = parseCommandFile(source);
  const description = parsed.metadata.description || `Run ECC /ecc:${commandName} workflow.`;
  const argumentHint = parsed.metadata['argument-hint'] || '[args]';
  const escapedBody = escapeCodexPromptDollars(parsed.body);

  return [
    '---',
    `description: ${jsonString(`Run ECC /ecc:${commandName} workflow. ${description}`)}`,
    `argument-hint: ${jsonString(argumentHint)}`,
    '---',
    '',
    GENERATED_MARKER,
    '',
    `# ECC Command Prompt: /ecc:${commandName}`,
    '',
    `Source: \`${normalizeSlashPath(sourcePath)}\``,
    '',
    `Original Claude command: \`/ecc:${commandName}\``,
    `Codex prompt alias: \`/prompts:ecc-${commandName}\``,
    '',
    `Arguments: $ARGUMENTS`,
    '',
    escapedBody,
  ].join('\n').replace(/\n*$/, '\n');
}

function buildSkill({ commandName, sourcePath, source }) {
  const parsed = parseCommandFile(source);
  const description = parsed.metadata.description || `Run ECC /ecc:${commandName} workflow.`;
  const escapedBody = escapeCodexPromptDollars(parsed.body);

  return [
    '---',
    `name: ecc-${commandName}`,
    `description: ${jsonString(`Codex skill bridge for ECC command /ecc:${commandName}. ${description}`)}`,
    '---',
    '',
    GENERATED_SKILL_MARKER,
    '',
    `# ECC Command Skill: /ecc:${commandName}`,
    '',
    `This is a Codex-compatible skill wrapper for the ECC command \`/ecc:${commandName}\`.`,
    '',
    `- Source command: \`${normalizeSlashPath(sourcePath)}\``,
    `- Original Claude command: \`/ecc:${commandName}\``,
    `- Codex explicit skill mention: \`$ecc-${commandName}\``,
    `- Codex skill picker: \`/skills\` then choose \`ecc-${commandName}\``,
    '',
    'When invoked, treat the rest of the user message as this command\'s arguments.',
    'Apply the command instructions below. If they mention Claude-only slash-command',
    'or subagent behavior, map the intent to available Codex capabilities and explain',
    'any material difference to the user.',
    '',
    '## Command Instructions',
    '',
    escapedBody,
  ].join('\n').replace(/\n*$/, '\n');
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  return fs.readFileSync(manifestPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function removeStalePrompts(promptsDir, expectedFiles, previousFiles) {
  const expected = new Set(expectedFiles);
  const removed = [];

  for (const fileName of previousFiles) {
    if (expected.has(fileName)) {
      continue;
    }

    const promptPath = path.join(promptsDir, fileName);
    if (!fs.existsSync(promptPath) || !fs.statSync(promptPath).isFile()) {
      continue;
    }

    const source = fs.readFileSync(promptPath, 'utf8');
    if (!source.includes(GENERATED_MARKER)) {
      continue;
    }

    fs.rmSync(promptPath, { force: true });
    removed.push(promptPath);
  }

  return removed;
}

function removeStaleSkills(skillsRoot, expectedDirs, previousDirs) {
  const expected = new Set(expectedDirs);
  const removed = [];

  for (const dirName of previousDirs) {
    if (expected.has(dirName)) {
      continue;
    }

    const skillDir = path.join(skillsRoot, dirName);
    const skillPath = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillPath) || !fs.statSync(skillPath).isFile()) {
      continue;
    }

    const source = fs.readFileSync(skillPath, 'utf8');
    if (!source.includes(GENERATED_SKILL_MARKER)) {
      continue;
    }

    fs.rmSync(skillDir, { recursive: true, force: true });
    removed.push(skillDir);
  }

  return removed;
}

function syncEccCommandsToCodex(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..', '..'));
  const codexHome = path.resolve(options.codexHome || getDefaultCodexHome());
  const commandsDir = path.join(repoRoot, 'commands');
  const promptsDir = path.resolve(options.promptsDir || path.join(codexHome, 'prompts'));
  const skillsRoot = path.resolve(options.skillsRoot || getDefaultSkillRoot());
  const manifestPath = path.join(promptsDir, MANIFEST_FILE);
  const skillManifestPath = path.join(skillsRoot, SKILL_MANIFEST_FILE);

  fs.mkdirSync(promptsDir, { recursive: true });
  fs.mkdirSync(skillsRoot, { recursive: true });

  const commandFiles = listCommandFiles(commandsDir);
  const promptFiles = [];
  const skillDirs = [];
  const written = [];
  const writtenSkills = [];

  for (const fileName of commandFiles) {
    const commandName = fileName.replace(/\.md$/, '');
    const sourcePath = path.join(commandsDir, fileName);
    const promptFile = `ecc-${commandName}.md`;
    const promptPath = path.join(promptsDir, promptFile);
    const skillDirName = `ecc-${commandName}`;
    const skillDir = path.join(skillsRoot, skillDirName);
    const skillPath = path.join(skillDir, 'SKILL.md');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const prompt = buildPrompt({ commandName, sourcePath, source });
    const skill = buildSkill({ commandName, sourcePath, source });

    fs.writeFileSync(promptPath, prompt, 'utf8');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(skillPath, skill, 'utf8');
    promptFiles.push(promptFile);
    skillDirs.push(skillDirName);
    written.push(promptPath);
    writtenSkills.push(skillPath);
  }

  const previousFiles = readManifest(manifestPath);
  const removed = removeStalePrompts(promptsDir, promptFiles, previousFiles);
  fs.writeFileSync(manifestPath, `${promptFiles.join('\n')}\n`, 'utf8');
  const previousSkillDirs = readManifest(skillManifestPath);
  const removedSkills = removeStaleSkills(skillsRoot, skillDirs, previousSkillDirs);
  fs.writeFileSync(skillManifestPath, `${skillDirs.join('\n')}\n`, 'utf8');

  return {
    repoRoot,
    codexHome,
    promptsDir,
    skillsRoot,
    manifestPath,
    skillManifestPath,
    commandCount: commandFiles.length,
    writtenCount: written.length,
    writtenSkillCount: writtenSkills.length,
    removedCount: removed.length,
    removedSkillCount: removedSkills.length,
    written,
    writtenSkills,
    removed,
    removedSkills,
  };
}

function main() {
  const repoRoot = process.argv[2] || path.join(__dirname, '..', '..');
  const promptsDir = process.argv[3] || null;
  const result = syncEccCommandsToCodex({
    repoRoot,
    promptsDir,
  });

  process.stdout.write(
    `[ecc-codex] Synced ${result.writtenCount} command prompts to ${result.promptsDir}`
      + ` and ${result.writtenSkillCount} command skills to ${result.skillsRoot}`
      + (result.removedCount ? `; removed ${result.removedCount} stale prompts` : '')
      + (result.removedSkillCount ? `; removed ${result.removedSkillCount} stale skills` : '')
      + '\n'
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  GENERATED_MARKER,
  GENERATED_SKILL_MARKER,
  buildSkill,
  buildPrompt,
  escapeCodexPromptDollars,
  parseCommandFile,
  syncEccCommandsToCodex,
};
