#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const GENERATED_MARKER = '<!-- ecc-codex-command-prompt-generated -->';
const GENERATED_SKILL_MARKER = '<!-- ecc-codex-command-skill-generated -->';
const MANIFEST_FILE = 'ecc-command-prompts-manifest.txt';
const SKILL_MANIFEST_FILE = 'ecc-command-skills-manifest.txt';
const MODEL_ROUTE_MANIFEST_FILE = path.join('manifests', 'codex-model-routes.json');
const MANIFEST_MARKER = '# ecc-codex-command-manifest-generated';

function lstatIfPresent(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}

function assertDirectoryPath(directoryPath, label) {
  const resolvedPath = path.resolve(directoryPath);
  const parsed = path.parse(resolvedPath);
  const segments = resolvedPath.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let currentPath = parsed.root;

  for (const segment of segments) {
    currentPath = path.join(currentPath, segment);
    const stat = lstatIfPresent(currentPath);
    if (!stat) continue;
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Refusing to manage ${label} through a non-directory path: ${currentPath}`);
    }
  }

  fs.mkdirSync(resolvedPath, { recursive: true });
  const finalStat = lstatIfPresent(resolvedPath);
  if (!finalStat || finalStat.isSymbolicLink() || !finalStat.isDirectory()) {
    throw new Error(`Refusing to manage ${label}: expected a regular directory at ${resolvedPath}`);
  }
  return resolvedPath;
}

function readRegularFile(filePath) {
  const stat = lstatIfPresent(filePath);
  if (!stat || stat.isSymbolicLink() || !stat.isFile()) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function getDefaultCodexHome() {
  return process.env.CODEX_HOME || path.join(process.env.HOME || os.homedir(), '.codex');
}

function getDefaultSkillRoot() {
  return path.join(process.env.HOME || os.homedir(), '.agents', 'skills');
}

function parseBooleanFlag(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return !['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

function normalizeSlashPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function jsonString(value) {
  return JSON.stringify(String(value || ''));
}

function sanitizeDescription(value) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function sanitizeRouteText(value) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function parseCommandFile(source) {
  const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
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
        metadata[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
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

function normalizeModelRoute(rawRoute) {
  if (!rawRoute || typeof rawRoute !== 'object' || Array.isArray(rawRoute)) {
    return null;
  }

  const route = {
    preferredModel: sanitizeRouteText(rawRoute.preferred_model || rawRoute.preferredModel),
    tier: sanitizeRouteText(rawRoute.tier),
    reason: sanitizeRouteText(rawRoute.reason),
    escalation: sanitizeRouteText(rawRoute.escalation),
  };

  return Object.values(route).some(Boolean) ? route : null;
}

function loadCodexModelRoutes(repoRoot, manifestPath = null) {
  const routePath = manifestPath || path.join(repoRoot, MODEL_ROUTE_MANIFEST_FILE);
  if (!fs.existsSync(routePath)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(routePath, 'utf8'));
  const rawRoutes = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed.routes || parsed)
    : {};
  const routes = {};

  for (const [skillName, rawRoute] of Object.entries(rawRoutes)) {
    const route = normalizeModelRoute(rawRoute);
    if (route) {
      routes[skillName] = route;
    }
  }

  return routes;
}

function buildModelRouteSection(modelRoute) {
  if (!modelRoute) {
    return [];
  }

  const lines = ['## Codex Model Route', ''];
  if (modelRoute.preferredModel) lines.push(`- Preferred model: \`${modelRoute.preferredModel}\``);
  if (modelRoute.tier) lines.push(`- Route tier: \`${modelRoute.tier}\``);
  if (modelRoute.reason) lines.push(`- Reason: ${modelRoute.reason}`);
  if (modelRoute.escalation) lines.push(`- Escalate when: ${modelRoute.escalation}`);
  lines.push(
    '',
    'Use this route when the runtime supports model selection. If model',
    'selection is not available, treat it as operator guidance for whether this',
    'workflow needs high-reasoning execution.',
  );
  return lines;
}

function buildPrompt({ commandName, sourcePath = null, source }) {
  const parsed = parseCommandFile(source);
  const description = parsed.metadata.description || `Run ECC /ecc:${commandName} workflow.`;
  const argumentHint = parsed.metadata['argument-hint'] || '[args]';
  const escapedBody = escapeCodexPromptDollars(parsed.body);

  return [
    '---',
    `description: ${jsonString(`Use /ecc:${commandName} through Codex skill $ecc-${commandName}. ${sanitizeDescription(description)}`)}`,
    `argument-hint: ${jsonString(argumentHint)}`,
    '---',
    '',
    GENERATED_MARKER,
    '',
    `# ECC Command Prompt: /ecc:${commandName}`,
    '',
    sourcePath ? `Source: \`${normalizeSlashPath(sourcePath)}\`` : null,
    sourcePath ? '' : null,
    `Original Claude command: \`/ecc:${commandName}\``,
    `Codex skill bridge: \`$ecc-${commandName}\``,
    '',
    `Use $$ecc-${commandName} for this request.`,
    '',
    'Arguments: $ARGUMENTS',
    '',
    escapedBody,
  ].filter(line => line !== null).join('\n').replace(/\n*$/, '\n');
}

function buildSkill({ commandName, sourcePath, source, modelRoute = null }) {
  const parsed = parseCommandFile(source);
  const description = parsed.metadata.description || `Run ECC /ecc:${commandName} workflow.`;
  const escapedBody = escapeCodexPromptDollars(parsed.body);
  const normalizedSourcePath = normalizeSlashPath(sourcePath);
  const sourceDir = normalizeSlashPath(path.dirname(sourcePath));

  return [
    '---',
    `name: ecc-${commandName}`,
    `description: ${jsonString(`Codex bridge for legacy Claude command /ecc:${commandName}. ${sanitizeDescription(description)}`)}`,
    '---',
    '',
    GENERATED_SKILL_MARKER,
    '',
    '# Legacy Claude Command Bridge',
    '',
    `This is a Codex-compatible wrapper for the legacy Claude command \`/ecc:${commandName}\`.`,
    '',
    'When this skill is invoked, read the source command completely before acting:',
    '',
    `- Source command: \`${normalizedSourcePath}\``,
    `- Source directory: \`${sourceDir}\``,
    `- Original command: \`/ecc:${commandName}\``,
    `- Codex skill name: \`$ecc-${commandName}\``,
    '',
    'Apply the source command\'s body instructions. Treat unsupported Claude/Copilot',
    'frontmatter fields such as `argument-hint`, `allowed-tools`, `model`,',
    'and `origin` as metadata rather than Codex skill frontmatter.',
    '',
    'Resolve all relative paths, references, scripts, and assets from the source',
    'directory above. If the source command mentions Claude-only tools or slash-command',
    'behavior, map the intent to available Codex capabilities and explain any',
    'material difference to the user.',
    '',
    ...buildModelRouteSection(modelRoute),
    ...(modelRoute ? [''] : []),
    'User invocation mapping:',
    '',
    `- Claude-style command text: \`/ecc:${commandName}\``,
    `- Codex explicit skill mention: \`$ecc-${commandName}\``,
    `- Codex skill picker: \`/skills\` then choose \`ecc-${commandName}\``,
    '',
    '## Command Instructions',
    '',
    escapedBody,
  ].join('\n').replace(/\n*$/, '\n');
}

function readManifest(manifestPath) {
  const content = readRegularFile(manifestPath);
  if (content === null) return [];
  if (!content.includes(MANIFEST_MARKER)) return [];
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => Boolean(line) && !line.startsWith('#'));
}

function isSafeEntryName(value) {
  return typeof value === 'string'
    && value.length > 0
    && value === path.basename(value)
    && !value.includes('/')
    && !value.includes('\\')
    && value !== '.'
    && value !== '..';
}

function removeStalePrompts(promptsDir, expectedFiles, previousFiles) {
  const expected = new Set(expectedFiles);
  const removed = [];

  for (const fileName of previousFiles) {
    if (expected.has(fileName) || !isSafeEntryName(fileName)) continue;
    const promptPath = path.join(promptsDir, fileName);
    const content = readRegularFile(promptPath);
    if (content === null || !content.includes(GENERATED_MARKER)) continue;
    fs.unlinkSync(promptPath);
    removed.push(promptPath);
  }
  return removed;
}

function listGeneratedPromptFiles(promptsDir) {
  const stat = lstatIfPresent(promptsDir);
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) return [];
  return fs.readdirSync(promptsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && isSafeEntryName(entry.name)
      && entry.name.startsWith('ecc-') && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .filter(fileName => {
      const content = readRegularFile(path.join(promptsDir, fileName));
      return content !== null && content.includes(GENERATED_MARKER);
    })
    .sort((left, right) => left.localeCompare(right));
}

function isGeneratedSkillDirectory(skillDir) {
  const dirStat = lstatIfPresent(skillDir);
  if (!dirStat || dirStat.isSymbolicLink() || !dirStat.isDirectory()) return false;
  const skillPath = path.join(skillDir, 'SKILL.md');
  const content = readRegularFile(skillPath);
  return content !== null && content.includes(GENERATED_SKILL_MARKER);
}

function canRemoveGeneratedSkillDirectory(skillDir) {
  if (!isGeneratedSkillDirectory(skillDir)) return false;
  const entries = fs.readdirSync(skillDir, { withFileTypes: true });
  return entries.length === 1 && entries[0].isFile() && entries[0].name === 'SKILL.md';
}

function removeStaleSkills(skillsRoot, expectedDirs, previousDirs) {
  const expected = new Set(expectedDirs);
  const removed = [];

  for (const dirName of previousDirs) {
    if (expected.has(dirName) || !isSafeEntryName(dirName)) continue;
    const skillDir = path.join(skillsRoot, dirName);
    if (!canRemoveGeneratedSkillDirectory(skillDir)) continue;
    fs.unlinkSync(path.join(skillDir, 'SKILL.md'));
    fs.rmdirSync(skillDir);
    removed.push(skillDir);
  }
  return removed;
}

function writeGeneratedFile(filePath, content, marker) {
  const existing = lstatIfPresent(filePath);
  if (existing) {
    if (existing.isSymbolicLink() || !existing.isFile()) return false;
    if (!fs.readFileSync(filePath, 'utf8').includes(marker)) return false;
  }
  assertDirectoryPath(path.dirname(filePath), 'generated Codex command file');
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function writeManifest(filePath, entries) {
  const existing = lstatIfPresent(filePath);
  if (existing && (existing.isSymbolicLink() || !existing.isFile())) {
    throw new Error(`Refusing to overwrite a non-regular Codex command manifest: ${filePath}`);
  }
  if (existing && !fs.readFileSync(filePath, 'utf8').includes(MANIFEST_MARKER)) return false;
  assertDirectoryPath(path.dirname(filePath), 'Codex command manifest');
  fs.writeFileSync(filePath, `${MANIFEST_MARKER}\n${entries.join('\n')}\n`, 'utf8');
  return true;
}

function listGeneratedSkillDirectories(skillsRoot) {
  const stat = lstatIfPresent(skillsRoot);
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && isSafeEntryName(entry.name)
      && entry.name.startsWith('ecc-'))
    .map(entry => entry.name)
    .filter(dirName => isGeneratedSkillDirectory(path.join(skillsRoot, dirName)))
    .sort((left, right) => left.localeCompare(right));
}

function removeGeneratedPrompt(promptPath, expectedContent = null, dryRun = false) {
  const content = readRegularFile(promptPath);
  if (content === null || !content.includes(GENERATED_MARKER)) return false;
  if (expectedContent !== null && content !== expectedContent) return false;
  if (!dryRun) fs.unlinkSync(promptPath);
  return true;
}

function removeGeneratedSkill(skillDir, expectedContent = null, dryRun = false) {
  if (!canRemoveGeneratedSkillDirectory(skillDir)) return false;
  if (expectedContent !== null
    && readRegularFile(path.join(skillDir, 'SKILL.md')) !== expectedContent) return false;
  if (!dryRun) {
    fs.unlinkSync(path.join(skillDir, 'SKILL.md'));
    fs.rmdirSync(skillDir);
  }
  return true;
}

function removeEccCommandBridges(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..', '..'));
  const commandsDir = path.join(repoRoot, 'commands');
  const codexHome = path.resolve(options.codexHome || getDefaultCodexHome());
  const promptsDir = path.resolve(options.promptsDir || path.join(codexHome, 'prompts'));
  const skillsRoot = path.resolve(options.skillsRoot || getDefaultSkillRoot());
  const promptManifestPath = path.join(promptsDir, MANIFEST_FILE);
  const skillManifestPath = path.join(skillsRoot, SKILL_MANIFEST_FILE);
  const dryRun = options.dryRun === true;
  const modelRoutes = loadCodexModelRoutes(repoRoot, options.modelRoutesPath);
  const promptNames = new Set([
    ...readManifest(promptManifestPath),
    ...listGeneratedPromptFiles(promptsDir),
  ]);
  const skillNames = new Set([
    ...readManifest(skillManifestPath),
    ...listGeneratedSkillDirectories(skillsRoot),
  ]);
  const removed = [];
  const retained = [];

  for (const fileName of promptNames) {
    if (!isSafeEntryName(fileName)) continue;
    const promptPath = path.join(promptsDir, fileName);
    const commandName = fileName.startsWith('ecc-') && fileName.endsWith('.md')
      ? fileName.slice(4, -3)
      : null;
    const sourcePath = commandName ? path.join(commandsDir, `${commandName}.md`) : null;
    const source = sourcePath && readRegularFile(sourcePath);
    const expectedContent = source === null || commandName === null
      ? null
      : buildPrompt({ commandName, sourcePath, source });
    if (removeGeneratedPrompt(promptPath, expectedContent, dryRun)) removed.push(promptPath);
    else if (lstatIfPresent(promptPath)) retained.push(promptPath);
  }
  for (const dirName of skillNames) {
    if (!isSafeEntryName(dirName)) continue;
    const skillDir = path.join(skillsRoot, dirName);
    const commandName = dirName.startsWith('ecc-') ? dirName.slice(4) : null;
    const sourcePath = commandName ? path.join(commandsDir, `${commandName}.md`) : null;
    const source = sourcePath && readRegularFile(sourcePath);
    const expectedContent = source === null || commandName === null
      ? null
      : buildSkill({ commandName, sourcePath, source, modelRoute: modelRoutes[dirName] });
    if (removeGeneratedSkill(skillDir, expectedContent, dryRun)) removed.push(skillDir);
    else if (lstatIfPresent(skillDir)) retained.push(skillDir);
  }

  const promptManifest = lstatIfPresent(promptManifestPath);
  if (promptManifest && promptManifest.isFile() && !promptManifest.isSymbolicLink()
    && fs.readFileSync(promptManifestPath, 'utf8').includes(MANIFEST_MARKER)) {
    if (!dryRun) fs.unlinkSync(promptManifestPath);
    removed.push(promptManifestPath);
  }
  const skillManifest = lstatIfPresent(skillManifestPath);
  if (skillManifest && skillManifest.isFile() && !skillManifest.isSymbolicLink()
    && fs.readFileSync(skillManifestPath, 'utf8').includes(MANIFEST_MARKER)) {
    if (!dryRun) fs.unlinkSync(skillManifestPath);
    removed.push(skillManifestPath);
  }

  return {
    codexHome,
    promptsDir,
    skillsRoot,
    dryRun,
    removed: [...new Set(removed)].sort(),
    retained: [...new Set(retained)].sort(),
  };
}

function syncEccCommandsToCodex(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..', '..'));
  const codexHome = path.resolve(options.codexHome || getDefaultCodexHome());
  const commandsDir = path.join(repoRoot, 'commands');
  const promptsDir = path.resolve(options.promptsDir || path.join(codexHome, 'prompts'));
  const skillsRoot = path.resolve(options.skillsRoot || getDefaultSkillRoot());
  const manifestPath = path.join(promptsDir, MANIFEST_FILE);
  const skillManifestPath = path.join(skillsRoot, SKILL_MANIFEST_FILE);
  const syncPrompts = parseBooleanFlag(
    options.syncPrompts,
    parseBooleanFlag(process.env.ECC_SYNC_CODEX_PROMPTS, true),
  );

  if (syncPrompts) assertDirectoryPath(promptsDir, 'Codex command prompts');
  assertDirectoryPath(skillsRoot, 'Codex command skills');

  const commandFiles = listCommandFiles(commandsDir);
  const promptFiles = [];
  const skillDirs = [];
  const written = [];
  const writtenSkills = [];
  const skipped = [];
  const skippedSkills = [];
  const modelRoutes = loadCodexModelRoutes(repoRoot, options.modelRoutesPath);

  for (const fileName of commandFiles) {
    const commandName = fileName.replace(/\.md$/, '');
    const sourcePath = path.join(commandsDir, fileName);
    const promptFile = `ecc-${commandName}.md`;
    const promptPath = path.join(promptsDir, promptFile);
    const skillDirName = `ecc-${commandName}`;
    const skillDir = path.join(skillsRoot, skillDirName);
    const skillPath = path.join(skillDir, 'SKILL.md');
    const source = fs.readFileSync(sourcePath, 'utf8');

    if (syncPrompts) {
      promptFiles.push(promptFile);
      if (writeGeneratedFile(promptPath, buildPrompt({ commandName, sourcePath, source }), GENERATED_MARKER)) {
        written.push(promptPath);
      } else {
        skipped.push(promptPath);
      }
    }

    skillDirs.push(skillDirName);
    if (writeGeneratedFile(skillPath, buildSkill({
      commandName,
      sourcePath,
      source,
      modelRoute: modelRoutes[skillDirName],
    }), GENERATED_SKILL_MARKER)) {
      writtenSkills.push(skillPath);
    } else {
      skippedSkills.push(skillPath);
    }
  }

  const previousFiles = readManifest(manifestPath);
  const cleanupPromptFiles = syncPrompts
    ? previousFiles
    : Array.from(new Set([...previousFiles, ...listGeneratedPromptFiles(promptsDir)]));
  const removed = removeStalePrompts(promptsDir, promptFiles, cleanupPromptFiles);
  if (syncPrompts) {
    writeManifest(manifestPath, promptFiles);
  } else {
    const manifest = lstatIfPresent(manifestPath);
    if (manifest && manifest.isFile() && !manifest.isSymbolicLink()
      && fs.readFileSync(manifestPath, 'utf8').includes(MANIFEST_MARKER)) {
      fs.unlinkSync(manifestPath);
    }
  }

  const previousSkillDirs = readManifest(skillManifestPath);
  const removedSkills = removeStaleSkills(skillsRoot, skillDirs, previousSkillDirs);
  writeManifest(skillManifestPath, skillDirs);

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
    skippedCount: skipped.length,
    skippedSkillCount: skippedSkills.length,
    removedCount: removed.length,
    removedSkillCount: removedSkills.length,
    written,
    writtenSkills,
    skipped,
    skippedSkills,
    removed,
  removedSkills,
};
}

function main() {
  const repoRoot = process.argv[2] || path.join(__dirname, '..', '..');
  const promptsDir = process.argv[3] || null;
  const result = syncEccCommandsToCodex({ repoRoot, promptsDir });
  process.stdout.write(
    `[ecc-codex] Synced ${result.writtenCount} command prompts to ${result.promptsDir}`
      + ` and ${result.writtenSkillCount} command skills to ${result.skillsRoot}`
      + (result.removedCount ? `; removed ${result.removedCount} stale prompts` : '')
      + (result.removedSkillCount ? `; removed ${result.removedSkillCount} stale skills` : '')
      + '\n',
  );
}

if (require.main === module) main();

module.exports = {
  GENERATED_MARKER,
  GENERATED_SKILL_MARKER,
  buildSkill,
  buildPrompt,
  escapeCodexPromptDollars,
  loadCodexModelRoutes,
  parseCommandFile,
  removeEccCommandBridges,
  syncEccCommandsToCodex,
};
