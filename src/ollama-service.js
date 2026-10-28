const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { spawn } = require('child_process');

let ollamaProcess = null;
let ownedPid = null;
let starting = null;
let lastStderr = '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeOllamaUrl(input) {
  let value = (input || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '');
  value = value.replace(/\/api$/i, '');
  // localhost на macOS часто резолвится в ::1, а Ollama слушает только IPv4.
  value = value.replace('://localhost', '://127.0.0.1');
  return value;
}

function ollamaEnv() {
  const env = { ...process.env };
  const home = env.HOME || env.USERPROFILE || '';
  const extra = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    path.join(home, '.local', 'bin'),
  ];
  if (process.platform === 'win32' && env.LOCALAPPDATA) {
    extra.unshift(path.join(env.LOCALAPPDATA, 'Programs', 'Ollama'));
  }
  env.PATH = extra.join(path.delimiter) + path.delimiter + (env.PATH || '');
  return env;
}

function candidateBins() {
  const env = ollamaEnv();
  const home = env.HOME || env.USERPROFILE || '';
  const list = [];
  if (process.platform === 'darwin') {
    list.push('/opt/homebrew/bin/ollama', '/usr/local/bin/ollama', path.join(home, '.local', 'bin', 'ollama'));
  } else if (process.platform === 'win32') {
    const local = env.LOCALAPPDATA || '';
    const programFiles = env.ProgramFiles || 'C:\\Program Files';
    list.push(
      path.join(local, 'Programs', 'Ollama', 'ollama.exe'),
      path.join(programFiles, 'Ollama', 'ollama.exe')
    );
  } else {
    list.push('/usr/local/bin/ollama', '/usr/bin/ollama', path.join(home, '.local', 'bin', 'ollama'));
  }
  const dirs = (env.PATH || '').split(path.delimiter);
  const names = process.platform === 'win32' ? ['ollama.exe', 'ollama.cmd', 'ollama'] : ['ollama'];
  for (const dir of dirs) {
    for (const name of names) list.push(path.join(dir, name));
  }
  return list;
}

function resolveOllamaBin() {
  const seen = new Set();
  for (const candidate of candidateBins()) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore unreadable path entries
    }
  }
  return process.platform === 'win32' ? 'ollama.exe' : 'ollama';
}

function findInPath(command) {
  const env = ollamaEnv();
  const dirs = (env.PATH || '').split(path.delimiter);
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', ''] : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const full = path.join(dir, command + ext);
      try {
        if (fs.existsSync(full)) return full;
      } catch {
        // continue
      }
    }
  }
  return null;
}

function requestOnce(url, { method = 'GET', timeout = 800, headers = null, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      method,
      headers: headers || undefined,
      agent: false,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        const result = { statusCode: res.statusCode || 0, text };
        if ((res.statusCode || 500) >= 400) {
          const error = new Error(text || ('HTTP ' + res.statusCode));
          error.statusCode = res.statusCode;
          reject(error);
          return;
        }
        resolve(result);
      });
    });
    req.setTimeout(timeout, () => {
      req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function pingOllama(baseUrl, timeout = 800) {
  const root = normalizeOllamaUrl(baseUrl);
  try {
    await requestOnce(new URL(root + '/api/tags'), { timeout });
    return true;
  } catch {
    return false;
  }
}

async function probeUrl(rawUrl, timeout = 800) {
  try {
    const url = new URL(rawUrl);
    await requestOnce(url, { timeout });
    return true;
  } catch (error) {
    return !!error.statusCode;
  }
}

async function waitUntil(fn, timeoutMs, stepMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true;
    await sleep(stepMs);
  }
  return fn();
}

function stopOllamaIfWeStarted() {
  const child = ollamaProcess;
  const pid = ownedPid;
  ownedPid = null;
  ollamaProcess = null;
  if (!child || !pid || child.pid !== pid || child.killed) return;
  try {
    child.kill();
  } catch {
    // process already gone
  }
}

async function ensureOllamaInner(settings) {
  const baseUrl = normalizeOllamaUrl(settings.ollamaUrl);
  if (await pingOllama(baseUrl)) {
    return { running: true, startedByUs: false, state: 'ready', provider: 'ollama', url: baseUrl };
  }
  if (settings.autoStartOllama === false) {
    return {
      running: false,
      startedByUs: false,
      state: 'stopped',
      provider: 'ollama',
      url: baseUrl,
      error: 'ollama-stopped',
    };
  }

  lastStderr = '';
  const bin = resolveOllamaBin();
  let child;
  try {
    child = spawn(bin, ['serve'], {
      env: ollamaEnv(),
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
  } catch (error) {
    return { running: false, startedByUs: false, state: 'error', provider: 'ollama', url: baseUrl, error: error.message };
  }

  ollamaProcess = child;
  ownedPid = child.pid;
  child.stderr.on('data', (chunk) => {
    lastStderr = (lastStderr + chunk.toString()).slice(-600);
  });
  child.on('error', (error) => {
    lastStderr = (lastStderr + '\n' + error.message).slice(-600);
  });
  child.on('exit', () => {
    if (ollamaProcess === child) {
      ollamaProcess = null;
      ownedPid = null;
    }
  });

  let ok = false;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20000) {
    if (await pingOllama(baseUrl, 700)) {
      ok = true;
      break;
    }
    const dead = child.exitCode != null || child.signalCode != null || child.killed;
    if (dead && Date.now() - startedAt > 1200) break;
    await sleep(350);
  }
  if (!ok) ok = await pingOllama(baseUrl, 700);
  if (!ok && /address already in use|EADDRINUSE/i.test(lastStderr)) {
    ok = await waitUntil(() => pingOllama(baseUrl, 700), 8000, 400);
    if (ok) ownedPid = null;
  }

  const serveAlive = !!(child.exitCode == null && child.signalCode == null && !child.killed);
  const home = process.env.HOME || '';
  const hasMacApp = process.platform === 'darwin' && [
    '/Applications/Ollama.app',
    path.join(home, 'Applications', 'Ollama.app'),
  ].some((candidate) => {
    try { return fs.existsSync(candidate); } catch { return false; }
  });
  if (!ok && !serveAlive && hasMacApp) {
    try {
      spawn('open', ['-a', 'Ollama'], { stdio: 'ignore' });
    } catch {
      // app bundle may be missing
    }
    ok = await waitUntil(() => pingOllama(baseUrl, 700), 15000, 400);
    if (ok) ownedPid = null;
  }

  if (ok) {
    return {
      running: true,
      startedByUs: !!(ownedPid && ollamaProcess && ollamaProcess.pid === ownedPid),
      state: 'ready',
      provider: 'ollama',
      url: baseUrl,
    };
  }

  return {
    running: false,
    startedByUs: false,
    state: 'error',
    provider: 'ollama',
    url: baseUrl,
    error: lastStderr.trim() || 'Ollama не ответил. Проверьте, что он установлен.',
  };
}

function ensureOllama(settings) {
  if (starting) return starting;
  starting = ensureOllamaInner(settings).finally(() => {
    starting = null;
  });
  return starting;
}

module.exports = {
  normalizeOllamaUrl,
  ollamaEnv,
  resolveOllamaBin,
  findInPath,
  pingOllama,
  probeUrl,
  ensureOllama,
  stopOllamaIfWeStarted,
};
