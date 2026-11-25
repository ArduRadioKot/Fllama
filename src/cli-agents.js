const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { findInPath, ollamaEnv } = require('./ollama-service');

const { cli } = require('./provider-catalog');
const os = require('node:os');
const { stripVTControlCharacters } = require('node:util');

function invocation(provider, model, prompt, directory) {
  const args = {
    'codex-cli': ['--ask-for-approval', 'never', 'exec', '--json', '--skip-git-repo-check', '--sandbox', directory ? 'workspace-write' : 'read-only'],
    'claude-cli': ['--print', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--permission-mode', directory ? 'acceptEdits' : 'plan'],
    'kiro-cli': ['chat', '--no-interactive'],
    'hermes-cli': ['chat', '--quiet', '--query-file', '-'],
    'cline-cli': ['--json', '--auto-approve', 'false'],
    'roo-cli': ['--print', '--mode', 'ask', '--require-approval', '--oneshot', '--output-format', 'text'],
    'kilo-cli': ['run', '--format', 'json'],
    'gemini-cli': ['--output-format', 'stream-json', '--approval-mode', 'default'],
  }[provider];
  if (model && model !== 'default') {
    if (typeof model !== 'string' || model.startsWith('-')) throw new Error('Invalid CLI model ID.');
    args.push('--model', model);
  }
  if (provider === 'codex-cli') args.push('-');
  if (provider === 'gemini-cli') args.push('--prompt', prompt);
  else if (['kiro-cli', 'cline-cli', 'roo-cli', 'kilo-cli'].includes(provider)) args.push('--', prompt);
  const withStdin = ['codex-cli', 'claude-cli', 'hermes-cli'].includes(provider);
  return { args, stdin: withStdin ? prompt : undefined };
}

function cliCommand(provider) {
  const binary = Object.hasOwn(cli, provider) ? cli[provider].binary : '';
  const executable = binary && findInPath(binary);
  return executable && !/\.(cmd|bat)$/i.test(executable) ? executable : null;
}

function streamCli({ provider, model, messages, directory, signal, onDelta }) {
  const binary = Object.hasOwn(cli, provider) ? cli[provider].binary : '';
  const executable = cliCommand(provider);
  if (!executable) throw new Error(`Install the ${binary} CLI and make its executable available on PATH.`);
  signal?.throwIfAborted();

  if (cli[provider].project && !directory) throw new Error('Open a project folder to use ' + cli[provider].label + '.');
  const prompt = messages.length === 1 ? messages[0].content
    : messages.map(({ role, content }) => `[${role}]\n${content}`).join('\n\n');
  const { args, stdin } = invocation(provider, model, prompt, directory);
  const textOutput = ['kiro-cli', 'hermes-cli', 'roo-cli'].includes(provider);

  return new Promise((resolve, reject) => {
    const proc = spawn(executable, args, {
      cwd: directory || os.tmpdir(),
      env: ollamaEnv(), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
      detached: process.platform !== 'win32',
    });
    const lines = createInterface({ input: proc.stdout });
    let answer = '';
    let error = '';
    let stderr = '';
    const activities = [];
    let partial = '';
    let killTimer;
    let timedOut = false;

    function addActivity(label) {
      if (!label) return;
      activities.push(label);
      if (activities.length > 30) activities.shift();
    }

    function terminate(sig) {
      try {
        if (process.platform === 'win32') proc.kill(sig);
        else if (proc.pid) process.kill(-proc.pid, sig);
      } catch {}
    }

    function abort() {
      terminate('SIGTERM');
      killTimer = setTimeout(() => terminate('SIGKILL'), 1800);
      killTimer.unref();
    }

    const timeout = setTimeout(() => {
      timedOut = true;
      abort();
    }, 20 * 60 * 1000);
    timeout.unref();

    const publish = () => onDelta?.({ answer: [answer, partial].filter(Boolean).join('\n\n'), activity: activities.join('\n') });
    lines.on('line', (line) => {
      if (textOutput) {
        answer += stripVTControlCharacters(line) + '\n';
        publish();
        return;
      }
      let event;
      try { event = JSON.parse(line); } catch { return; }
      if (provider === 'codex-cli') {
        const item = event.item;
        if (event.type === 'item.completed' && item?.type === 'agent_message') {
          answer += (answer ? '\n\n' : '') + item.text;
        } else if (event.type === 'item.started' && item?.type !== 'reasoning') {
          addActivity(item?.type?.replaceAll('_', ' '));
        } else if (event.type === 'turn.failed') {
          error = event.error?.message || error;
        }
      } else if (provider === 'cline-cli') {
        const message = event.event;
        if (event.type === 'run_result' && event.text) answer = event.text;
        if (event.type === 'run_result' && event.finishReason === 'aborted') error = 'Cline stopped the run.';
        if (message?.type === 'done' && message.text) answer = message.text;
        if (message?.type === 'iteration_start') addActivity('Cline iteration');
        if (event.type === 'error' || message?.type === 'error') error = event.message || message?.message || 'Cline failed.';
      } else if (provider === 'kilo-cli') {
        if (event.type === 'text' && event.part?.text) answer += (answer ? '\n\n' : '') + event.part.text;
        if (event.type === 'tool_use') addActivity(event.part?.tool);
        if (event.type === 'error') {
          error = event.error?.data?.message || event.error?.message || event.error?.name || 'Kilo Code CLI failed.';
        }
      } else if (provider === 'gemini-cli') {
        if (event.type === 'message' && event.role === 'assistant') answer += event.content || '';
        if (event.type === 'tool_use') addActivity(event.tool_name);
        if (event.type === 'result' && event.status === 'error') error = event.error?.message || 'Gemini CLI failed.';
      } else if (event.type === 'stream_event' && event.event?.delta?.type === 'text_delta') {
        partial += event.event.delta.text || '';
      } else if (event.type === 'assistant') {
        const blocks = event.message?.content || [];
        const text = blocks.filter((block) => block.type === 'text').map((block) => block.text).join('\n');
        if (text) answer += (answer ? '\n\n' : '') + text;
        partial = '';
        addActivity(blocks.find((block) => block.type === 'tool_use')?.name);
      } else if (event.type === 'result') {
        if (event.is_error) error = event.errors?.join('\n') || event.result || 'Claude Code failed';
        else if (event.result) answer = event.result;
        partial = '';
      }
      publish();
    });

    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    proc.stdin.on('error', () => {});
    proc.stdin.end(stdin);
    proc.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-4000); });
    proc.once('error', reject);
    proc.once('close', (code) => {
      signal?.removeEventListener('abort', abort);
      clearTimeout(killTimer);
      clearTimeout(timeout);
      if (signal?.aborted) reject(signal.reason);
      else if (timedOut) reject(new Error(cli[provider].label + ' timed out. Check its login and pending approvals.'));
      else if (code !== 0 || error) reject(new Error(error || stderr.trim() || `${binary} exited with code ${code}`));
      else resolve({ answer: answer.trim() || partial, activity: activities.join('\n') });
    });
  });
}

module.exports = { cliCommand, streamCli };
