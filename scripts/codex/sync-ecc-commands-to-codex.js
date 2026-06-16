#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const GENERATED_MARKER = '<!-- ecc-codex-command-prompt-generated -->';
const MANIFEST_FILE = 'ecc-command-prompts-manifest.txt';

function getDefaultCodexHome() {
  return process.env.CODEX_HOME || path.join(process.env.HOME || os.homedir(), '.codex');
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

function syncEccCommandsToCodex(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..', '..'));
  const codexHome = path.resolve(options.codexHome || getDefaultCodexHome());
  const commandsDir = path.join(repoRoot, 'commands');
  const promptsDir = path.resolve(options.promptsDir || path.join(codexHome, 'prompts'));
  const manifestPath = path.join(promptsDir, MANIFEST_FILE);

  fs.mkdirSync(promptsDir, { recursive: true });

  const commandFiles = listCommandFiles(commandsDir);
  const promptFiles = [];
  const written = [];

  for (const fileName of commandFiles) {
    const commandName = fileName.replace(/\.md$/, '');
    const sourcePath = path.join(commandsDir, fileName);
    const promptFile = `ecc-${commandName}.md`;
    const promptPath = path.join(promptsDir, promptFile);
    const source = fs.readFileSync(sourcePath, 'utf8');
    const prompt = buildPrompt({ commandName, sourcePath, source });

    fs.writeFileSync(promptPath, prompt, 'utf8');
    promptFiles.push(promptFile);
    written.push(promptPath);
  }

  const previousFiles = readManifest(manifestPath);
  const removed = removeStalePrompts(promptsDir, promptFiles, previousFiles);
  fs.writeFileSync(manifestPath, `${promptFiles.join('\n')}\n`, 'utf8');

  return {
    repoRoot,
    codexHome,
    promptsDir,
    manifestPath,
    commandCount: commandFiles.length,
    writtenCount: written.length,
    removedCount: removed.length,
    written,
    removed,
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
      + (result.removedCount ? `; removed ${result.removedCount} stale prompts` : '')
      + '\n'
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  GENERATED_MARKER,
  buildPrompt,
  escapeCodexPromptDollars,
  parseCommandFile,
  syncEccCommandsToCodex,
};
