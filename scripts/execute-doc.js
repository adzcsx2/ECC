#!/usr/bin/env node
/**
 * execute-doc 编排器：脚本驱动 00-执行文档.md 的 phase 循环。
 *
 * 推进控制权由本脚本独占——每个 phase 派发 headless 子代理（复用 claw.askClaude）
 * 执行编码，子代理返回后脚本亲自跑硬质量门，通过则脚本独占更新 progress pointer
 * 并推进下一 phase。LLM 在子会话里无法让主流程停下询问用户，根治 execute-doc
 * 纯 prompt 自动推进在长会话下违规停车的缺陷。
 *
 * 核心循环逻辑 runOrchestration 接受可注入的 dispatch/audit/onUpdate，
 * 使重试与封闭清单分支可在不调用真实 claude 的情况下单测。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { askClaude } = require('./claw');
const pointer = require('./lib/exec-doc/pointer');
const { parsePhases } = require('./lib/exec-doc/phases');
const gate = require('./lib/exec-doc/gate');

function usage() {
  console.log(
    [
      'Usage: node scripts/execute-doc.js <执行文档路径或目录> [options]',
      '',
      'Options:',
      '  --phase <N>        从指定 phase 开始（默认读 progress pointer）',
      '  --model <name>     覆盖模型（默认读 ~/.claude/settings.json 或 $CLAUDE_MODEL）',
      '  --test-cmd <cmd>   每个 phase 后运行的测试命令',
      '  --upstream <f1,f2> 上游 sources of truth（触碰即停，逗号分隔）',
      '  --max-retries <N>  单 phase 最大重试（默认 3）',
      '  --dry-run          仅解析打印计划，不执行',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('--'));
  const get = (name) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    docArg: positional[0],
    phase: get('phase') ? parseInt(get('phase'), 10) : undefined,
    model: get('model'),
    testCmd: get('test-cmd'),
    upstream: get('upstream'),
    maxRetries: get('max-retries') ? parseInt(get('max-retries'), 10) : 3,
    dryRun: args.includes('--dry-run'),
  };
}

// model 解析优先级：--model > $CLAUDE_MODEL > ~/.claude/settings.json 的 model 字段
// 读 settings 是为了不依赖 claude -p headless 是否自动读 settings 的假设
function resolveModel(cliModel) {
  if (cliModel) return cliModel;
  if (process.env.CLAUDE_MODEL) return process.env.CLAUDE_MODEL;
  try {
    const sp = path.join(os.homedir(), '.claude', 'settings.json');
    const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
    return s.model || undefined;
  } catch {
    return undefined;
  }
}

function resolveDocPath(docArg) {
  if (!docArg) return null;
  const resolved = path.resolve(docArg);
  try {
    if (fs.statSync(resolved).isDirectory()) {
      return path.join(resolved, '00-执行文档.md');
    }
  } catch {
    // 路径不存在，原样返回让后续存在性检查报错
  }
  return resolved;
}

function buildPhasePrompt(docPath, phaseNum, repoRoot) {
  return [
    '执行 ' + docPath + ' 中的 Phase ' + phaseNum + '。',
    '',
    '步骤（必须真正执行工具，禁止只口头描述）：',
    '1. 用 Read 工具读取 ' + docPath + '，找到 Phase ' + phaseNum + ' 的 checklist 子项（P' + phaseNum + '.1, P' + phaseNum + '.2, ...）。',
    '2. 逐个完成每个 checklist 子项——必须实际调用 Write / Edit / Bash 等工具产生文件改动或命令执行，禁止只描述你要做什么。',
    '3. 全部子项完成后，用 Bash 执行：cd ' + repoRoot + ' && git add -A && git commit -m "<中文 commit message>"。',
    '',
    '项目根目录：' + repoRoot + '，所有文件操作在此目录内进行。',
    '所有代码注释必须使用中文。',
    '完成后报告：已完成的 P' + phaseNum + '.<M> 清单、修改的文件列表。',
    '不要更新 progress pointer、不要决定 phase 切换——这些由编排器独占。',
  ].join('\n');
}

function auditPhase(repoRoot, baseline, upstreamSources, testCmd) {
  const touched = gate.gitDiffNameOnly(repoRoot, baseline);
  if (touched.files.length === 0) {
    return { pass: false, fatal: false, reason: 'no-changes' };
  }
  const guard = gate.checkUpstreamGuard(touched.files, upstreamSources || []);
  if (guard.violated) {
    return { pass: false, fatal: true, reason: 'upstream-guard-violated', files: guard.files };
  }
  if (testCmd) {
    const t = gate.runTestCommand(repoRoot, testCmd);
    if (!t.ok && !t.skipped) {
      return { pass: false, fatal: false, reason: 'test-failed', status: t.status };
    }
  }
  return { pass: true, touchedFiles: touched.files };
}

// 核心循环：dispatch/audit/onUpdate 可注入，便于单测
function runOrchestration(cfg) {
  const dispatch = cfg.dispatch;
  const audit = cfg.audit;
  const onUpdate = cfg.onUpdate;
  const onLog = cfg.onLog || (() => {});
  const startPhase = cfg.startPhase;
  const totalPhases = cfg.totalPhases;
  const maxRetries = cfg.maxRetries;
  const completed = [];

  for (let phase = startPhase; phase <= totalPhases; phase++) {
    onLog('=== Phase ' + phase + ' ===');
    let passed = false;
    let fatalHit = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      onLog('[execute-doc] 派发 Phase ' + phase + '（第 ' + attempt + ' 轮）');
      const disp = dispatch(phase);
      const ad = audit(disp);
      if (ad.pass) {
        passed = true;
        onLog('[execute-doc] Phase ' + phase + ' 审计通过');
        break;
      }
      if (ad.fatal) {
        fatalHit = ad;
        break;
      }
      onLog('[execute-doc] Phase ' + phase + ' 未通过（' + ad.reason + '），重试');
    }
    if (fatalHit) {
      onLog('[execute-doc] 触碰上游 sources of truth: ' + (fatalHit.files || []).join(', '));
      return { ok: false, reason: 'upstream-guard', phase, files: fatalHit.files };
    }
    if (!passed) {
      onLog('[execute-doc] Phase ' + phase + ' 连续 ' + maxRetries + ' 轮未通过');
      return { ok: false, reason: 'max-retries', phase };
    }
    const isLast = phase >= totalPhases;
    onUpdate({ phase, isLast });
    completed.push(phase);
  }
  return { ok: true, phases: completed };
}

function main() {
  const opts = parseArgs(process.argv);
  if (!opts.docArg) {
    usage();
    process.exit(1);
  }
  const docPath = resolveDocPath(opts.docArg);
  if (!fs.existsSync(docPath)) {
    console.error('[execute-doc] 执行文档不存在: ' + docPath);
    process.exit(1);
  }
  const repoRoot = process.cwd();
  const model = resolveModel(opts.model);
  const upstreamSources = opts.upstream
    ? opts.upstream.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const { totalPhases } = parsePhases(docPath);
  if (totalPhases === 0) {
    console.error('[execute-doc] 未检测到任何 P<N>.<M> checklist');
    process.exit(1);
  }
  const ptr = pointer.readPointer(docPath);
  if (!ptr.ok) {
    console.error('[execute-doc] 缺少 progress-pointer 锚点');
    process.exit(1);
  }
  const startPhase = opts.phase || ptr.current_phase || 1;

  console.log('[execute-doc] 文档: ' + docPath);
  console.log(
    '[execute-doc] 起点 Phase ' +
      startPhase +
      ' / 共 ' +
      totalPhases +
      '，模型: ' +
      (model || '(claude 默认)')
  );

  if (opts.dryRun) {
    console.log('[execute-doc] --dry-run，仅打印计划，不执行');
    return { startPhase, totalPhases, model };
  }

  const dispatch = (phase) => {
    const prompt = buildPhasePrompt(docPath, phase, repoRoot);
    const baseline = gate.gitHead(repoRoot);
    const response = askClaude('', '', prompt, model, { dangerouslySkipPermissions: true });
    return { response, baseline };
  };
  const audit = (disp) => auditPhase(repoRoot, disp.baseline, upstreamSources, opts.testCmd);
  const onUpdate = (u) =>
    pointer.writePointer(docPath, {
      current_phase: u.isLast ? u.phase : u.phase + 1,
      current_phase_status: u.isLast ? 'completed' : 'not_started',
      last_updated: new Date().toISOString(),
      last_actor: 'orchestrator',
      last_commit: gate.gitHead(repoRoot),
      next_action: u.isLast ? '任务完成' : '执行 Phase ' + (u.phase + 1),
    });

  const result = runOrchestration({
    startPhase,
    totalPhases,
    maxRetries: opts.maxRetries,
    dispatch,
    audit,
    onUpdate,
    onLog: (m) => console.log(m),
  });
  if (!result.ok) {
    process.exit(2);
  }
  console.log('\n[execute-doc] 全部 Phase 完成');
  return result;
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('[execute-doc] ' + e.message);
    process.exit(1);
  }
}

module.exports = {
  usage,
  parseArgs,
  resolveModel,
  resolveDocPath,
  buildPhasePrompt,
  auditPhase,
  runOrchestration,
  main,
};
