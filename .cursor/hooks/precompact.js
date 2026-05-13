#!/usr/bin/env node
// adr-skill Cursor hook dispatcher.
//
// Cursor delivers hook events as a single JSON document on stdin. The
// expected response is a single JSON document on stdout. The dispatcher
// reads the `hook_event_name` (or `event` legacy alias) and routes to a
// handler. preCompact is observational only: this handler writes
// `briefing.md` to disk and returns a `user_message` that points the
// post-compact agent at the file. beforeShellExecution enforces a strict
// allowlist; anything else is denied.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = process.cwd();
const STATE_DIR = path.resolve(REPO_ROOT, '.adr-skill', 'state', 'runs');
const LOG_DIR = path.resolve(REPO_ROOT, '.adr-skill', 'logs');

const SHELL_ALLOWLIST = [
  /^npx adr-skill( |$)/,
  /^node \.cursor[\\/]hooks[\\/]precompact\.js$/,
];

main();

async function main() {
  let raw = '';
  try {
    raw = await readStdin();
  } catch (err) {
    return respond({ permission: 'allow', user_message: `adr-skill: hook stdin error ${err.message}` });
  }

  let payload = {};
  if (raw.trim().length > 0) {
    try {
      payload = JSON.parse(raw);
    } catch (_err) {
      return respond({ permission: 'allow', user_message: 'adr-skill: hook payload was not JSON; ignored.' });
    }
  }

  const eventName = payload.hook_event_name || payload.event || payload.type || 'unknown';

  try {
    switch (eventName) {
      case 'sessionStart':
        return respond(await handleSessionStart(payload));
      case 'preCompact':
        return respond(await handlePreCompact(payload));
      case 'beforeShellExecution':
        return respond(await handleBeforeShell(payload));
      default:
        return respond({ permission: 'allow', user_message: `adr-skill: unhandled event ${eventName}` });
    }
  } catch (err) {
    await safeLog({ event: eventName, error: err.message });
    return respond({ permission: 'allow', user_message: `adr-skill: hook error ${err.message}` });
  }
}

async function handleSessionStart(_payload) {
  await safeLog({ event: 'sessionStart' });
  return {
    permission: 'allow',
    user_message: 'adr-skill is installed. Invoke /adr-skill to start a new ADR workflow. The skill never auto-commits.',
  };
}

async function handlePreCompact(payload) {
  const runId = await detectActiveRunId();
  if (!runId) {
    await safeLog({ event: 'preCompact', skipped: true, reason: 'no active run' });
    return {
      permission: 'allow',
      user_message: 'adr-skill preCompact: no active run; nothing to write.',
    };
  }
  const runDir = path.join(STATE_DIR, runId);
  const briefingPath = path.join(runDir, 'briefing.md');

  let runJson = {};
  try {
    runJson = JSON.parse(await fs.readFile(path.join(runDir, 'run.json'), 'utf8'));
  } catch (_err) {
    runJson = {};
  }

  const drafts = await listDrafts(path.join(runDir, 'drafts'));
  const ts = new Date().toISOString();
  const briefing = renderBriefing({ runId, ts, runJson, drafts, payload });
  await atomicWrite(briefingPath, briefing);
  await safeLog({ event: 'preCompact', run_id: runId, drafts: drafts.length });

  return {
    permission: 'allow',
    user_message: `adr-skill preCompact: wrote ${path.relative(REPO_ROOT, briefingPath).split(path.sep).join('/')}. On the next turn, read that file first to resume the run.`,
  };
}

async function handleBeforeShell(payload) {
  const cmd = (payload.command || payload.shell_command || '').toString();
  if (!cmd) {
    return { permission: 'allow' };
  }
  const allowed = SHELL_ALLOWLIST.some((re) => re.test(cmd));
  if (!allowed) {
    await safeLog({ event: 'beforeShellExecution', cmd, decision: 'deny' });
    return {
      permission: 'deny',
      user_message: `adr-skill: command not on the adr-skill allowlist (${cmd}). Allowed prefixes: "npx adr-skill ...", "node .cursor/hooks/precompact.js".`,
    };
  }
  await safeLog({ event: 'beforeShellExecution', cmd, decision: 'allow' });
  return { permission: 'allow' };
}

function renderBriefing({ runId, ts, runJson, drafts, payload }) {
  const lines = [];
  lines.push(`# adr-skill briefing (run ${runId})`);
  lines.push('');
  lines.push(`Generated at ${ts} by the preCompact hook. This file is the post-compact resume point.`);
  lines.push('');
  lines.push('## Run state');
  lines.push('');
  lines.push(`- phase: ${runJson.phase ?? 'unknown'}`);
  lines.push(`- mode: ${runJson.mode ?? 'greenfield'}`);
  lines.push(`- started_at: ${runJson.started_at ?? 'unknown'}`);
  lines.push(`- skill_version: ${runJson.skill_version ?? 'unknown'}`);
  lines.push(`- awaiting_human: ${runJson.awaiting_human ? JSON.stringify(runJson.awaiting_human) : 'no'}`);
  lines.push('');
  lines.push('## Phase status');
  lines.push('');
  if (Array.isArray(runJson.phases) && runJson.phases.length > 0) {
    // Brownfield runs use the phases[] timing array; render it directly.
    for (const p of runJson.phases) {
      const dur = typeof p.duration_ms === 'number' ? ` (${p.duration_ms} ms)` : '';
      lines.push(`- ${p.name}: ${p.status}${dur}${p.notes ? ` - ${p.notes}` : ''}`);
    }
  } else if (runJson.phase_status && typeof runJson.phase_status === 'object') {
    for (const [name, status] of Object.entries(runJson.phase_status)) {
      lines.push(`- ${name}: ${status.state}${status.notes ? ` - ${status.notes}` : ''}`);
    }
  } else {
    lines.push('- _phase_status missing_');
  }
  // For brownfield resume: include the most recent evidence-ref so the
  // Reader can skip already-processed chunks.
  const lastEvidenceRef = (runJson.phases || []).reverse().find((p) => p.notes && /:\d+-\d+@[0-9a-f]{64}/.test(p.notes));
  if (lastEvidenceRef) {
    const m = /:\d+-\d+@[0-9a-f]{64}/.exec(lastEvidenceRef.notes);
    if (m) {
      lines.push('');
      lines.push(`## Last processed evidence-ref`);
      lines.push('');
      lines.push(`- ${m[0].replace(/^:/, '')}`);
    }
  }
  lines.push('');
  lines.push('## Drafts');
  lines.push('');
  if (drafts.length === 0) {
    lines.push('- _none yet_');
  } else {
    for (const d of drafts) {
      lines.push(`- ${d}`);
    }
  }
  lines.push('');
  lines.push('## Next action');
  lines.push('');
  lines.push(`- Resume the Orchestrator from phase \`${runJson.phase ?? 'unknown'}\`.`);
  lines.push('- Do not re-ask any Socratic question whose answer is already in `inputs.json`.');
  lines.push('- Continue routing drafts to the Reviewer; await user `proceed` before any move out of `.adr-skill/state/`.');
  if (payload && payload.reason) {
    lines.push('');
    lines.push(`## Cursor compaction reason`);
    lines.push('');
    lines.push(`- ${payload.reason}`);
  }
  return `${lines.join('\n')}\n`;
}

async function detectActiveRunId() {
  let entries;
  try {
    entries = await fs.readdir(STATE_DIR, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
  const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  if (dirs.length === 0) return null;
  return dirs.map((e) => e.name).sort().reverse()[0];
}

async function listDrafts(dir) {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((n) => /\.md$/.test(n)).sort();
  } catch (_err) {
    return [];
  }
}

async function atomicWrite(dest, contents) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, contents);
  await fs.rename(tmp, dest);
}

async function safeLog(entry) {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    const ts = new Date().toISOString();
    const file = path.join(LOG_DIR, `${ts.slice(0, 10)}.log`);
    await fs.appendFile(file, `${JSON.stringify({ ts, source: 'cursor-hook', ...entry })}\n`);
  } catch (_err) {
    // best-effort; never throw from a hook
  }
}

function respond(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
