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

function normalizeModelRoute(rawRoute) {
  if (!rawRoute || typeof rawRoute !== 'object' || Array.isArray(rawRoute)) {
    return null;
  }

  const preferredModel = sanitizeRouteText(rawRoute.preferred_model || rawRoute.preferredModel);
  const tier = sanitizeRouteText(rawRoute.tier);
  const reason = sanitizeRouteText(rawRoute.reason);
  const escalation = sanitizeRouteText(rawRoute.escalation);

  if (!preferredModel && !tier && !reason && !escalation) {
    return null;
  }

  return {
    preferredModel,
    tier,
    reason,
    escalation,
  };
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

  const lines = [
    '## Codex Model Route',
    '',
  ];

  if (modelRoute.preferredModel) {
    lines.push(`- Preferred model: \`${modelRoute.preferredModel}\``);
  }
  if (modelRoute.tier) {
    lines.push(`- Route tier: \`${modelRoute.tier}\``);
  }
  if (modelRoute.reason) {
    lines.push(`- Reason: ${modelRoute.reason}`);
  }
  if (modelRoute.escalation) {
    lines.push(`- Escalate when: ${modelRoute.escalation}`);
  }

  lines.push(
    '',
    'Use this route when the runtime supports model selection. If model',
    'selection is not available, treat it as operator guidance for whether this',
    'workflow needs high-reasoning execution.',
  );

  return lines;
}

function buildPrompt({ commandName, source }) {
  const parsed = parseCommandFile(source);
  const description = parsed.metadata.description || `Run ECC /ecc:${commandName} workflow.`;
  const argumentHint = parsed.metadata['argument-hint'] || '[args]';
  const safeDescription = sanitizeDescription(description);

  return [
    '---',
    `description: ${jsonString(`Use /ecc:${commandName} through Codex skill $ecc-${commandName}. ${safeDescription}`)}`,
    `argument-hint: ${jsonString(argumentHint)}`,
    '---',
    '',
    GENERATED_MARKER,
    '',
    `Use $$ecc-${commandName} for this request.`,
    '',
    `Original ECC command: \`/ecc:${commandName}\``,
    `Arguments: $ARGUMENTS`,
  ].join('\n').replace(/\n*$/, '\n');
}

function buildSkill({ commandName, sourcePath, source, modelRoute = null }) {
  const parsed = parseCommandFile(source);
  const description = parsed.metadata.description || `Run ECC /ecc:${commandName} workflow.`;
  const safeDescription = sanitizeDescription(description);
  const normalizedSourcePath = normalizeSlashPath(sourcePath);
  const sourceDir = normalizeSlashPath(path.dirname(sourcePath));

  return [
    '---',
    `name: ecc-${commandName}`,
    `description: ${jsonString(`Codex bridge for legacy Claude command /ecc:${commandName}. ${safeDescription}`)}`,
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

function listGeneratedPromptFiles(promptsDir) {
  if (!fs.existsSync(promptsDir)) {
    return [];
  }

  return fs.readdirSync(promptsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.startsWith('ecc-') && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .filter(fileName => {
      const promptPath = path.join(promptsDir, fileName);
      return fs.readFileSync(promptPath, 'utf8').includes(GENERATED_MARKER);
    })
    .sort((left, right) => left.localeCompare(right));
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
  const syncPrompts = parseBooleanFlag(
    options.syncPrompts,
    parseBooleanFlag(process.env.ECC_SYNC_CODEX_PROMPTS, false)
  );

  if (syncPrompts) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  fs.mkdirSync(skillsRoot, { recursive: true });

  const commandFiles = listCommandFiles(commandsDir);
  const promptFiles = [];
  const skillDirs = [];
  const written = [];
  const writtenSkills = [];
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
    const prompt = buildPrompt({ commandName, sourcePath, source });
    const skill = buildSkill({
      commandName,
      sourcePath,
      source,
      modelRoute: modelRoutes[skillDirName],
    });

    if (syncPrompts) {
      fs.writeFileSync(promptPath, prompt, 'utf8');
      promptFiles.push(promptFile);
      written.push(promptPath);
    }
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(skillPath, skill, 'utf8');
    skillDirs.push(skillDirName);
    writtenSkills.push(skillPath);
  }

  const previousFiles = readManifest(manifestPath);
  const cleanupPromptFiles = syncPrompts
    ? previousFiles
    : Array.from(new Set([...previousFiles, ...listGeneratedPromptFiles(promptsDir)]));
  const removed = removeStalePrompts(promptsDir, promptFiles, cleanupPromptFiles);
  if (syncPrompts) {
    fs.writeFileSync(manifestPath, `${promptFiles.join('\n')}\n`, 'utf8');
  } else {
    fs.rmSync(manifestPath, { force: true });
  }
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
  loadCodexModelRoutes,
  parseCommandFile,
  syncEccCommandsToCodex,
};
