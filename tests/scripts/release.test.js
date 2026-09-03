/**
 * Source-level tests for scripts/release.sh
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'release.sh');
const source = fs.readFileSync(scriptPath, 'utf8');
const rootReadmePath = path.join(__dirname, '..', '..', 'README.md');
const rootReadmeSource = fs.readFileSync(rootReadmePath, 'utf8');

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
  console.log('\n=== Testing release.sh ===\n');

  let passed = 0;
  let failed = 0;

  if (test('release script rejects untracked files when checking cleanliness', () => {
    assert.ok(
      source.includes('git status --porcelain --untracked-files=all'),
      'release.sh should use git status --porcelain --untracked-files=all for cleanliness checks'
    );
  })) passed++; else failed++;

  if (test('release script reruns release metadata sync validation before commit/tag', () => {
    const syncCheckIndex = source.lastIndexOf('node tests/plugin-manifest.test.js');
    const commitIndex = source.indexOf('git commit -m "chore: bump plugin version to $VERSION"');

    assert.ok(syncCheckIndex >= 0, 'release.sh should run plugin-manifest.test.js');
    assert.ok(commitIndex >= 0, 'release.sh should create the release commit');
    assert.ok(
      syncCheckIndex < commitIndex,
      'plugin-manifest.test.js should run before the release commit is created'
    );
  })) passed++; else failed++;

  if (test('release script verifies npm pack payload after version updates and before commit/tag', () => {
    const updateIndex = source.indexOf('update_version "$ROOT_PACKAGE_JSON"');
    const packCheckIndex = source.indexOf('node tests/scripts/build-opencode.test.js');
    const commitIndex = source.indexOf('git commit -m "chore: bump plugin version to $VERSION"');

    assert.ok(updateIndex >= 0, 'release.sh should update package version fields');
    assert.ok(packCheckIndex >= 0, 'release.sh should run build-opencode.test.js');
    assert.ok(commitIndex >= 0, 'release.sh should create the release commit');
    assert.ok(
      updateIndex < packCheckIndex,
      'build-opencode.test.js should run after versioned files are updated'
    );
    assert.ok(
      packCheckIndex < commitIndex,
      'build-opencode.test.js should run before the release commit is created'
    );
  })) passed++; else failed++;

  if (test('release script supports prerelease semver and release heading sync', () => {
    assert.ok(
      source.includes('2.0.0-rc.1'),
      'release.sh should document an accepted prerelease semver example'
    );
    assert.ok(
      source.includes('(-[0-9A-Za-z.-]+)?'),
      'release.sh should allow prerelease semver suffixes'
    );
    assert.ok(
      source.includes('update_latest_release_heading "$ROOT_ZH_CN_README_FILE"'),
      'release.sh should update localized latest-release headings that plugin-manifest.test.js verifies'
    );
    assert.ok(
      source.includes('Error: could not update release heading for v${oldVersion} in ${file}'),
      'release.sh should fail loudly when a required release heading is absent'
    );
  })) passed++; else failed++;

  if (test('a 2.2 bump preserves historical root README release headings', () => {
    const historicalHeading = rootReadmeSource.match(/^### v2\.0\.0:.*$/m);
    assert.ok(historicalHeading, 'README fixture should contain the historical v2.0.0 heading');
    assert.ok(
      source.includes('const oldVersion = process.argv[3]'),
      'release heading sync should receive the version being replaced'
    );
    assert.ok(
      source.includes('escape(oldVersion)'),
      'release heading sync should target the current release version exactly'
    );
    assert.ok(
      !source.includes('/^### v[0-9]+\\.[0-9]+\\.[0-9]+'),
      'release heading sync must not relabel the first version-shaped heading as the new release'
    );

    const simulated = rootReadmeSource.replace(
      /^### v2\.1\.0( .*)$/m,
      '### v2.2.0$1'
    );
    assert.ok(
      simulated.includes(historicalHeading[0]),
      'syncing the current release must leave the historical v2.0.0 heading unchanged'
    );
  })) passed++; else failed++;

  if (test('release script rejects same-version reruns with direct tag guidance', () => {
    assert.ok(
      source.includes('if [[ "$OLD_VERSION" == "$VERSION" ]]'),
      'release.sh should detect metadata that already declares the requested version'
    );
    assert.ok(
      source.includes('echo "  git tag \\"v$VERSION\\""') &&
        source.includes('echo "  git push origin \\"v$VERSION\\""'),
      'same-version guidance should point maintainers to the tag-driven publish path'
    );
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
