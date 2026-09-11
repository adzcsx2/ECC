#!/usr/bin/env node
'use strict';

const path = require('path');
const readline = require('readline/promises');
const { spawnSync } = require('child_process');

const { SUPPORTED_INSTALL_TARGETS, listInstallProfiles } = require('./lib/install-manifests');
const { listHarnessCapabilities } = require('./lib/harness-capabilities');

const DEFAULT_PROFILE = 'full';
const HOOK_TARGETS = new Set(['claude', 'claude-project', 'cursor', 'opencode', 'codebuddy']);
const PROFILE_IDS = new Set(listInstallProfiles().map(profile => profile.id));

function listWizardTargets() {
  return listHarnessCapabilities().map(harness => ({
    id: harness.id,
    label: harness.label,
    target: harness.targetIds[0],
    destination: harness.destination,
  }));
}

function getWizardTarget(targetId) {
  return listWizardTargets().find(target => target.target === targetId) || null;
}

function parseArgs(argv) {
  const options = {
    target: null,
    profile: DEFAULT_PROFILE,
    enableHooks: false,
    noHooks: false,
    yes: false,
    dryRun: false,
    json: false,
    help: false,
  };

  const values = new Map([
    ['--target', 'target'],
    ['--profile', 'profile'],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (values.has(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${argument}`);
      }
      options[values.get(argument)] = value;
      index += 1;
    } else if (argument === '--enable-hooks') {
      options.enableHooks = true;
    } else if (argument === '--no-hooks') {
      options.noHooks = true;
    } else if (argument === '--yes' || argument === '-y') {
      options.yes = true;
    } else if (argument === '--dry-run') {
      options.dryRun = true;
    } else if (argument === '--json') {
      options.json = true;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function showHelp(output = process.stdout) {
  output.write(`
ECC interactive AI-tool installer

Usage:
  install.sh
  install.ps1
  ecc install --interactive

The interactive installer selects one AI tool, then installs the full ECC
profile for that target. The full profile includes code-review-loop.

Options:
  --target <target>     Skip target selection and use a supported target
  --profile <profile>   Install profile (default: full)
  --enable-hooks        Enable supported automatic hooks
  --no-hooks            Install without supported automatic hooks
  --yes, -y             Skip confirmation
  --dry-run             Preview the selected installation without changes
  --json                Pass JSON output through to the installer
  --help, -h            Show this help
`);
}

function askTarget(terminal, output) {
  const targets = listWizardTargets();
  output.write('\nWhich AI tool should ECC install for?\n');
  targets.forEach((target, index) => {
    output.write(`  ${index + 1}. ${target.label} — ${target.destination}\n`);
  });

  return (async () => {
    while (true) {
      const answer = (await terminal.question('Choose one option: ')).trim().toLowerCase();
      const numeric = /^\d+$/.test(answer) ? targets[Number(answer) - 1] : null;
      const selected = numeric || targets.find(target => target.id === answer || target.target === answer);
      if (selected) return selected.target;
      output.write(`Please choose a number or one of: ${targets.map(target => target.target).join(', ')}.\n`);
    }
  })();
}

async function askHookConsent(terminal, output, target) {
  if (!HOOK_TARGETS.has(target)) return null;

  output.write(
    '\nThe selected target supports automatic hooks. Enable them? '
    + 'Hooks can run quality and safety automation during tool use.\n'
  );
  const answer = (await terminal.question('Enable automatic hooks? [y/N]: ')).trim().toLowerCase();
  if (/^y(es)?$/.test(answer)) return 'enable';
  return 'disable';
}

async function collectInteractiveOptions(options, dependencies = {}) {
  const terminal = dependencies.terminal;
  const output = dependencies.output || process.stdout;
  const target = options.target || await askTarget(terminal, output);
  let enableHooks = options.enableHooks;
  let noHooks = options.noHooks;

  if (enableHooks && noHooks) {
    throw new Error('--enable-hooks cannot be combined with --no-hooks');
  }

  if (HOOK_TARGETS.has(target) && !enableHooks && !noHooks) {
    const consent = await askHookConsent(terminal, output, target);
    enableHooks = consent === 'enable';
    noHooks = consent === 'disable';
  }

  return {
    ...options,
    target,
    enableHooks,
    noHooks,
  };
}

function validateExecutionMode(options, interactive) {
  if (options.target && !SUPPORTED_INSTALL_TARGETS.includes(options.target)) {
    throw new Error(`Unknown install target: ${options.target}`);
  }
  if (!PROFILE_IDS.has(options.profile)) {
    throw new Error(`Unknown install profile: ${options.profile}`);
  }
  if (options.enableHooks && options.noHooks) {
    throw new Error('--enable-hooks cannot be combined with --no-hooks');
  }
  if (!interactive && !options.target) {
    throw new Error('Non-interactive install requires --target.');
  }
  if (!interactive && !options.yes && !options.dryRun) {
    throw new Error('Non-interactive install requires --yes or --dry-run.');
  }
}

function buildInstallArgs(options) {
  const args = ['--target', options.target, '--profile', options.profile];
  if (options.enableHooks) args.push('--enable-hooks');
  if (options.noHooks) args.push('--no-hooks');
  if (options.dryRun) args.push('--dry-run');
  if (options.json) args.push('--json');
  return args;
}

function printSelection(options, output) {
  const target = getWizardTarget(options.target);
  output.write('\nECC interactive install selection\n\n');
  output.write(`AI tool: ${target?.label || options.target}\n`);
  output.write(`Profile: ${options.profile}\n`);
  output.write(`Destination: ${target?.destination || 'target-managed location'}\n`);
  output.write('Includes: all supported profile content, including code-review-loop\n');
  if (options.enableHooks) output.write('Hooks: enabled\n');
  if (options.noHooks) output.write('Hooks: disabled\n');
}

function runInstaller(args) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'install-apply.js'), ...args],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      encoding: 'utf8',
    }
  );

  if (result.error) throw result.error;
  return typeof result.status === 'number' ? result.status : 1;
}

async function main(argv = process.argv.slice(2), injected = {}) {
  const output = injected.output || process.stdout;
  const errorOutput = injected.errorOutput || process.stderr;
  const interactive = injected.interactive !== undefined
    ? injected.interactive
    : Boolean(process.stdin.isTTY && output.isTTY);
  let terminal = injected.terminal;
  let ownsTerminal = false;

  try {
    let options = parseArgs(argv);
    if (options.help) {
      showHelp(output);
      return 0;
    }
    validateExecutionMode(options, interactive);

    if (!options.target && interactive) {
      if (!terminal) {
        terminal = readline.createInterface({ input: process.stdin, output });
        ownsTerminal = true;
      }
      options = await collectInteractiveOptions(options, { output, terminal });
    }

    if (!options.target) {
      throw new Error('Choose an AI tool target before installing.');
    }

    if (options.json && !options.yes && !options.dryRun) {
      throw new Error('--json requires --yes or --dry-run.');
    }

    if (!options.json) printSelection(options, output);
    if (options.dryRun) {
      if (!options.json) output.write('\nDry run: no changes will be made.\n');
    } else if (!options.yes) {
      if (!terminal) {
        terminal = readline.createInterface({ input: process.stdin, output });
        ownsTerminal = true;
      }
      const answer = (await terminal.question(
        `Apply ECC to ${getWizardTarget(options.target)?.label || options.target} with the ${options.profile} profile? [y/N]: `
      )).trim();
      if (!/^y(es)?$/i.test(answer)) {
        output.write('\nECC install cancelled. No changes were made.\n');
        return 0;
      }
    }

    const installer = injected.runInstaller || runInstaller;
    return await installer(buildInstallArgs(options));
  } catch (error) {
    errorOutput.write(`Error: ${error.message}\n`);
    return 1;
  } finally {
    if (ownsTerminal) terminal?.close();
  }
}

if (require.main === module) {
  main().then(code => {
    process.exitCode = code;
  });
}

module.exports = {
  buildInstallArgs,
  collectInteractiveOptions,
  listWizardTargets,
  main,
  parseArgs,
  printSelection,
  showHelp,
  validateExecutionMode,
};
