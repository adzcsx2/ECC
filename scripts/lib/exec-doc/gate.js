#!/usr/bin/env node
/**
 * 硬质量门：编排器在每个 phase 子代理返回后亲自执行（不依赖 LLM 自觉）。
 *
 * - git 状态：工作区是否干净、本 phase 改动了哪些文件
 * - 上游守卫：改动是否触碰 00-执行文档.md 声明的 sources of truth（命中即硬停）
 * - 测试命令：跑文档指定的验证命令，按退出码判定
 *
 * 软质量（调试残留、注释语言、架构合理性）留给交互式 execute-doc 的主代理审计，
 * 编排器只做可机判的硬门。
 */

'use strict';

const { spawnSync } = require('child_process');

function gitStatusPorcelain(repoRoot) {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, stdout: '' };
  return { ok: true, stdout: (r.stdout || '').trim() };
}

function gitDiffNameOnly(repoRoot, baseline) {
  const args = baseline ? ['diff', '--name-only', baseline] : ['diff', '--name-only'];
  const r = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, files: [] };
  const files = (r.stdout || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return { ok: true, files };
}

function gitHead(repoRoot) {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  return r.status === 0 ? (r.stdout || '').trim() : null;
}

// 判断 touched 文件是否触碰 upstream sources of truth
// upstream 条目可以是文件（精确匹配）或目录（前缀匹配）
function checkUpstreamGuard(touchedFiles, upstreamSources) {
  const upstream = (upstreamSources || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (upstream.length === 0) return { violated: false, files: [] };
  const violated = touchedFiles.filter((f) =>
    upstream.some((u) => {
      if (f === u) return true;
      const dirPrefix = u.endsWith('/') ? u : u + '/';
      return f.startsWith(dirPrefix);
    })
  );
  return { violated: violated.length > 0, files: violated };
}

function runTestCommand(repoRoot, cmd) {
  if (!cmd) return { ok: true, skipped: true, status: 0, stdout: '', stderr: '', error: null };
  const r = spawnSync(cmd, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: true,
    timeout: 600000,
  });
  return {
    ok: r.status === 0,
    skipped: false,
    status: r.status,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    error: r.error ? r.error.message : null,
  };
}

module.exports = {
  gitStatusPorcelain,
  gitDiffNameOnly,
  gitHead,
  checkUpstreamGuard,
  runTestCommand,
};
