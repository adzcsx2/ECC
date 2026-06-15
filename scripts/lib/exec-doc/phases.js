#!/usr/bin/env node
/**
 * phase checklist 解析与栈检测。
 *
 * 扫描 00-执行文档.md 中 P<N>.<M> 格式的有序子项，统计 phase 总数与每个 phase
 * 的子项清单。栈检测复用 plan-doc 的信号（pubspec/package.json 等）。
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 匹配形如 "- [ ] P2.1: 描述" 或 "P2.1 描述" 的 checklist 子项
// 捕获组：1=前缀(含勾选框)，2=勾选状态(x/X/空)，3=P<N>.<M>，4=N，5=M，6=描述
const ITEM_RE = /^(\s*[-*]\s*\[([ xX])\]\s*)?(P(\d+)\.(\d+))\s*[::]?\s*(.*)$/;

function parsePhases(docPath) {
  const content = fs.readFileSync(docPath, 'utf8');
  const phases = new Map();
  const lines = content.split('\n');
  for (const line of lines) {
    const m = line.match(ITEM_RE);
    if (!m || !m[3]) continue;
    const phaseN = parseInt(m[4], 10);
    if (!phases.has(phaseN)) phases.set(phaseN, { phase: phaseN, items: [] });
    phases.get(phaseN).items.push({
      id: m[3],
      checked: m[2] === 'x' || m[2] === 'X',
      text: (m[6] || '').trim(),
    });
  }
  const sorted = [...phases.values()].sort((a, b) => a.phase - b.phase);
  return { phases: sorted, totalPhases: sorted.length };
}

function detectStack(repoRoot) {
  const exists = (f) => fs.existsSync(path.join(repoRoot, f));
  if (exists('pubspec.yaml') && exists('lib/main.dart')) return 'flutter';
  if (exists('settings.gradle') || exists('settings.gradle.kts')) return 'android';
  if (exists('package.json')) {
    try {
      const pj = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
      const deps = Object.assign({}, pj.dependencies, pj.devDependencies);
      if (deps.next || deps.react || deps.vue || deps.vite) return 'web';
    } catch {
      // 解析失败按 generic 处理
    }
    return 'web';
  }
  if (exists('pyproject.toml') || exists('requirements.txt')) return 'python';
  if (exists('pom.xml') || exists('build.gradle') || exists('build.gradle.kts')) return 'java';
  return 'generic';
}

module.exports = { ITEM_RE, parsePhases, detectStack };
