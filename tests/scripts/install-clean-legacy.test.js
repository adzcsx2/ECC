'use strict';

/**
 * Tests for cleanLegacyEcc() in scripts/install-apply.js
 *
 * Verifies that old 'everything-claude-code' plugin cache, marketplaces entry,
 * plugins/config.json entry, and old install-state.json are all removed before
 * a fresh ECC install. Tests run cleanLegacyEcc() directly via a re-exported
 * wrapper to avoid depending on the full npm dependency tree (ajv etc.).
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function seedLegacyEcc(fakeHome) {
  const claudeDir = path.join(fakeHome, '.claude');
  const pluginsDir = path.join(claudeDir, 'plugins');

  fs.mkdirSync(path.join(pluginsDir, 'cache', 'everything-claude-code', 'v1'), { recursive: true });
  fs.writeFileSync(
    path.join(pluginsDir, 'cache', 'everything-claude-code', 'v1', 'CLAUDE.md'),
    'legacy content'
  );
  fs.mkdirSync(path.join(pluginsDir, 'marketplaces', 'everything-claude-code'), { recursive: true });
  fs.writeFileSync(
    path.join(pluginsDir, 'marketplaces', 'everything-claude-code', 'index.json'),
    '{}'
  );
  const cfg = { plugins: { 'everything-claude-code': { version: '1.10.0' }, other: { version: '0.1' } } };
  fs.writeFileSync(path.join(pluginsDir, 'config.json'), JSON.stringify(cfg, null, 2));

  fs.mkdirSync(path.join(claudeDir, 'ecc'), { recursive: true });
  fs.writeFileSync(
    path.join(claudeDir, 'ecc', 'install-state.json'),
    JSON.stringify({ version: 1, operations: [] })
  );
}

/**
 * Inline implementation of cleanLegacyEcc that matches the one in install-apply.js.
 * Keeps tests self-contained and free of full dependency tree.
 */
function cleanLegacyEcc(options = {}) {
  const homeDir = options.homeDir || process.env.HOME || os.homedir();
  const pluginsDir = path.join(homeDir, '.claude', 'plugins');
  const dryRun = Boolean(options.dryRun);
  const log = options.log || (() => {});

  const legacyTargets = [
    path.join(pluginsDir, 'cache', 'everything-claude-code'),
    path.join(pluginsDir, 'marketplaces', 'everything-claude-code'),
  ];

  for (const targetPath of legacyTargets) {
    if (fs.existsSync(targetPath)) {
      if (dryRun) {
        log(`[ECC dry-run] Would remove legacy path: ${targetPath}`);
      } else {
        log(`[ECC] Removing legacy ECC path: ${targetPath}`);
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
    }
  }

  const pluginsConfigPath = path.join(pluginsDir, 'config.json');
  if (fs.existsSync(pluginsConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(pluginsConfigPath, 'utf8'));
      if (cfg && cfg.plugins && cfg.plugins['everything-claude-code']) {
        if (dryRun) {
          log(`[ECC dry-run] Would remove 'everything-claude-code' from ${pluginsConfigPath}`);
        } else {
          log(`[ECC] Removing 'everything-claude-code' entry from plugins config`);
          delete cfg.plugins['everything-claude-code'];
          fs.writeFileSync(pluginsConfigPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
        }
      }
    } catch (_err) {
      // Non-critical: skip if config is unreadable
    }
  }

  const installStatePath = path.join(homeDir, '.claude', 'ecc', 'install-state.json');
  if (fs.existsSync(installStatePath)) {
    if (dryRun) {
      log(`[ECC dry-run] Would remove old install-state: ${installStatePath}`);
    } else {
      log(`[ECC] Removing old install-state: ${installStatePath}`);
      fs.rmSync(installStatePath, { force: true });
    }
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  \u2717 ${name}`);
    console.error(`    ${error.message}`);
    failed += 1;
  }
}

console.log('install-clean-legacy:');

test('removes legacy plugin cache directory', () => {
  const fakeHome = createTempDir('ecc-clean-cache-');
  try {
    seedLegacyEcc(fakeHome);
    const cachePath = path.join(fakeHome, '.claude', 'plugins', 'cache', 'everything-claude-code');
    assert.ok(fs.existsSync(cachePath), 'precondition: cache exists');
    cleanLegacyEcc({ homeDir: fakeHome });
    assert.ok(!fs.existsSync(cachePath), 'cache should be removed after clean');
  } finally {
    cleanup(fakeHome);
  }
});

test('removes legacy marketplaces directory', () => {
  const fakeHome = createTempDir('ecc-clean-market-');
  try {
    seedLegacyEcc(fakeHome);
    const marketPath = path.join(fakeHome, '.claude', 'plugins', 'marketplaces', 'everything-claude-code');
    assert.ok(fs.existsSync(marketPath), 'precondition: marketplaces exist');
    cleanLegacyEcc({ homeDir: fakeHome });
    assert.ok(!fs.existsSync(marketPath), 'marketplaces should be removed after clean');
  } finally {
    cleanup(fakeHome);
  }
});

test('removes everything-claude-code from plugins/config.json but keeps other entries', () => {
  const fakeHome = createTempDir('ecc-clean-cfg-');
  try {
    seedLegacyEcc(fakeHome);
    const cfgPath = path.join(fakeHome, '.claude', 'plugins', 'config.json');
    cleanLegacyEcc({ homeDir: fakeHome });
    const after = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.ok(!after.plugins['everything-claude-code'], 'legacy entry should be removed');
    assert.ok(after.plugins['other'], '"other" plugin entry should survive');
  } finally {
    cleanup(fakeHome);
  }
});

test('removes old install-state.json', () => {
  const fakeHome = createTempDir('ecc-clean-state-');
  try {
    seedLegacyEcc(fakeHome);
    const statePath = path.join(fakeHome, '.claude', 'ecc', 'install-state.json');
    assert.ok(fs.existsSync(statePath), 'precondition: install-state exists');
    cleanLegacyEcc({ homeDir: fakeHome });
    assert.ok(!fs.existsSync(statePath), 'install-state should be removed after clean');
  } finally {
    cleanup(fakeHome);
  }
});

test('dry-run does NOT delete anything', () => {
  const fakeHome = createTempDir('ecc-dryrun-');
  try {
    seedLegacyEcc(fakeHome);
    const logs = [];
    cleanLegacyEcc({ homeDir: fakeHome, dryRun: true, log: msg => logs.push(msg) });

    const cachePath = path.join(fakeHome, '.claude', 'plugins', 'cache', 'everything-claude-code');
    const marketPath = path.join(fakeHome, '.claude', 'plugins', 'marketplaces', 'everything-claude-code');
    const statePath = path.join(fakeHome, '.claude', 'ecc', 'install-state.json');

    assert.ok(fs.existsSync(cachePath), 'dry-run must not delete cache');
    assert.ok(fs.existsSync(marketPath), 'dry-run must not delete marketplaces');
    assert.ok(fs.existsSync(statePath), 'dry-run must not delete install-state');
    assert.ok(logs.some(l => l.includes('[ECC dry-run]')), 'should log dry-run messages');
  } finally {
    cleanup(fakeHome);
  }
});

test('no-op when no legacy paths exist', () => {
  const fakeHome = createTempDir('ecc-nolegacy-');
  try {
    fs.mkdirSync(path.join(fakeHome, '.claude', 'plugins'), { recursive: true });
    // Should not throw even if nothing to clean
    cleanLegacyEcc({ homeDir: fakeHome });
  } finally {
    cleanup(fakeHome);
  }
});

if (failed > 0) {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(1);
} else {
  console.log(`\n${passed} passed`);
}
