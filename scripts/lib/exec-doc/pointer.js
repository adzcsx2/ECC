#!/usr/bin/env node
/**
 * progress pointer 解析与原子更新。
 *
 * 00-执行文档.md 的指针包裹在 HTML 注释锚点之间，字段为固定标量 + blockers 数组
 * + parallelizable_groups 嵌套块。本模块深度解析标量字段与 blockers，
 * parallelizable_groups 作为不透明块透传（编排器当前版本按串行 phase 执行）。
 *
 * 零外部依赖：pointer 字段固定，用行级正则处理即可，避免引入 YAML 解析器。
 */

'use strict';

const fs = require('fs');

const START_MARKER = '<!-- progress-pointer:start -->';
const END_MARKER = '<!-- progress-pointer:end -->';

// 深度解析的标量字段（其余字段如 parallelizable_groups 透传不解析）
const SCALAR_FIELDS = [
  'current_phase',
  'current_phase_status',
  'last_updated',
  'last_actor',
  'last_commit',
  'next_action',
];

function extractPointerBlock(content) {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start < 0 || end < 0 || end < start) return null;
  return {
    start,
    end,
    block: content.slice(start, end + END_MARKER.length),
  };
}

function parseScalar(block, field) {
  const re = new RegExp('^' + field + ':\\s*(.*)$', 'm');
  const m = block.match(re);
  if (!m) return undefined;
  let v = m[1].trim();
  if (v === '' || v === 'null' || v === '~') return null;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

function parseBlockers(block) {
  const idx = block.indexOf('blockers:');
  if (idx < 0) return [];
  const after = block.slice(idx);
  const inline = after.match(/^blockers:\s*(\[.*\])\s*$/m);
  if (inline) {
    const arr = inline[1].trim();
    if (arr === '[]') return [];
    return arr
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  const items = [];
  const lines = after.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (/^\s*-\s+/.test(ln)) {
      items.push(ln.replace(/^\s*-\s+/, '').trim().replace(/^["']|["']$/g, ''));
    } else if (/^\S/.test(ln)) {
      break;
    }
  }
  return items;
}

function readPointer(docPath) {
  let content;
  try {
    content = fs.readFileSync(docPath, 'utf8');
  } catch (e) {
    return { ok: false, reason: 'read-error', message: e.message };
  }
  const blockInfo = extractPointerBlock(content);
  if (!blockInfo) return { ok: false, reason: 'no-progress-pointer-markers' };
  const block = blockInfo.block;
  const cp = parseScalar(block, 'current_phase');
  return {
    ok: true,
    content,
    blockInfo,
    current_phase: cp !== undefined && cp !== null ? parseInt(cp, 10) : undefined,
    current_phase_status: parseScalar(block, 'current_phase_status'),
    last_updated: parseScalar(block, 'last_updated'),
    last_actor: parseScalar(block, 'last_actor'),
    last_commit: parseScalar(block, 'last_commit'),
    next_action: parseScalar(block, 'next_action'),
    blockers: parseBlockers(block),
  };
}

function serializeScalar(field, value) {
  if (value === null || value === undefined) return field + ': null';
  if (typeof value === 'number') return field + ': ' + value;
  const s = String(value);
  if (/[:#{}&*!|>'"%@`,\n[\]]/.test(s)) {
    return field + ': "' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return field + ': ' + s;
}

function replaceBlockers(content, items) {
  const serialized =
    'blockers: ' +
    (items.length === 0 ? '[]' : '[' + items.map((i) => JSON.stringify(i)).join(', ') + ']');
  const re = /^blockers:.*$/m;
  if (re.test(content)) return content.replace(re, serialized);
  return content;
}

// 原子写：读全文 → 替换标量行 → 写临时文件 → rename 覆盖（防崩溃半写）
function writePointer(docPath, updates) {
  let content = fs.readFileSync(docPath, 'utf8');
  if (!extractPointerBlock(content)) {
    return { ok: false, reason: 'no-progress-pointer-markers' };
  }
  for (const [field, value] of Object.entries(updates)) {
    if (field === 'blockers') {
      content = replaceBlockers(content, value);
      continue;
    }
    const serialized = serializeScalar(field, value);
    const re = new RegExp('^' + field + ':.*$', 'm');
    if (re.test(content)) {
      content = content.replace(re, serialized);
    }
  }
  const tmp = docPath + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, docPath);
  return { ok: true };
}

module.exports = {
  START_MARKER,
  END_MARKER,
  SCALAR_FIELDS,
  extractPointerBlock,
  parseScalar,
  parseBlockers,
  serializeScalar,
  replaceBlockers,
  readPointer,
  writePointer,
};
