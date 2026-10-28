const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const { findInPath, ollamaEnv } = require('./ollama-service');

let childProcess = null;
let ownedPid = null;
let starting = null;
const sessions = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(input) {
  return (input || 'http://127.0.0.1:4096').trim().replace(/\/+$/, '').replace('://localhost', '://127.0.0.1');
}

function portOf(input) {
  try {
    const port = Number(new URL(normalizeUrl(input)).port);
    return port || 4096;
  } catch {
    return 4096;
  }
}

function authHeader(settings) {
  const password = settings.opencodePassword || '';
  if (!password) return {};
  const username = settings.opencodeUsername || 'opencode';
  return { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') };
}

function request(urlStr, { method = 'GET', headers = {}, body = null, signal, timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const payload = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const reqHeaders = { Accept: 'application/json', ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = String(payload.length);
    }
    const req = lib.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if ((res.statusCode || 500) >= 400) {
          const error = new Error(text || ('HTTP ' + res.statusCode));
          error.statusCode = res.statusCode;
          reject(error);
          return;
        }
        let json = text;
        try { json = text ? JSON.parse(text) : {}; } catch { json = text; }
        resolve({ statusCode: res.statusCode, json });
      });
    });
    req.setTimeout(timeout, () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    if (signal) {
      if (signal.aborted) {
        req.destroy(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        return;
      }
      const onAbort = () => req.destroy(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      signal.addEventListener('abort', onAbort, { once: true });
    }
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function pingOpenCode(baseUrl, settings = {}, timeout = 800) {
  const root = normalizeUrl(baseUrl || settings.opencodeUrl);
  const headers = authHeader(settings);
  for (const path of ['/global/health', '/api/info']) {
    try {
      await request(root + path, { headers, timeout });
      return { running: true, style: path.startsWith('/api') ? 'v2' : 'v1' };
    } catch (error) {
      if (error.statusCode && error.statusCode !== 404) return { running: true, style: path.startsWith('/api') ? 'v2' : 'v1' };
    }
  }
  return { running: false };
}

function unwrap(payload) {
  if (payload && typeof payload === 'object' && payload.data && !Array.isArray(payload)) return payload.data;
  return payload;
}

function asArray(payload) {
  const value = unwrap(payload);
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  if (value && Array.isArray(value.messages)) return value.messages;
  return [];
}

function messageText(message) {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (typeof message.text === 'string' && message.text) return message.text;
  const parts = message.parts || message.content;
  if (typeof parts === 'string') return parts;
  if (Array.isArray(parts)) {
    return parts.map((part) => {
      if (typeof part === 'string') return part;
      return part?.text || part?.content || '';
    }).filter(Boolean).join('');
  }
  return '';
}

function messageKind(message) {
  return String(message?.type || message?.role || message?.info?.role || '');
}

async function listOpenCodeModels(settings) {
  const root = normalizeUrl(settings.opencodeUrl);
  const headers = authHeader(settings);
  try {
    const res = await request(root + '/api/model', { headers, timeout: 8000 });
    const models = asArray(res.json).map((model) => model.id || model.name || [model.providerID, model.modelID].filter(Boolean).join('/')).filter(Boolean);
    if (models.length) return [...new Set(models)].slice(0, 80);
  } catch {
    // older servers expose providers instead
  }
  try {
    const res = await request(root + '/config/providers', { headers, timeout: 8000 });
    const providers = unwrap(res.json);
    const list = Array.isArray(providers) ? providers : (providers?.providers || []);
    const models = [];
    for (const provider of list) {
      const items = provider.models || provider.modelsList || [];
      if (Array.isArray(items)) {
        for (const model of items) models.push(typeof model === 'string' ? model : (model.id || model.name));
      }
    }
    if (models.length) return [...new Set(models.filter(Boolean))].slice(0, 80);
  } catch {
    // no model list
  }
  return ['default'];
}

async function createSession(root, headers, directory, model) {
  const location = directory ? { directory } : undefined;
  try {
    const res = await request(root + '/api/session', {
      method: 'POST',
      headers: { ...headers, ...(directory ? { 'x-opencode-directory': directory } : {}) },
      body: { title: 'Fllama', location, model: model && model !== 'default' ? model : undefined },
      timeout: 20000,
    });
    const data = unwrap(res.json);
    const id = data?.id || data?.sessionID;
    if (id) return { id, style: 'v2' };
  } catch (error) {
    if (error.statusCode && error.statusCode !== 404) throw error;
  }
  const res = await request(root + '/session', {
    method: 'POST',
    headers: { ...headers, ...(directory ? { 'x-opencode-directory': directory } : {}) },
    body: {},
    timeout: 20000,
  });
  const data = unwrap(res.json);
  return { id: data?.id || data, style: 'v1' };
}

async function readMessages(root, headers, session) {
  const path = session.style === 'v2'
    ? `/api/session/${encodeURIComponent(session.id)}/message?order=asc&limit=40`
    : `/session/${encodeURIComponent(session.id)}/message`;
  const res = await request(root + path, { headers, timeout: 15000 });
  return asArray(res.json);
}

function latestAssistant(messages) {
  let text = '';
  let idle = false;
  for (const message of messages) {
    const kind = messageKind(message);
    if (kind === 'idle') idle = true;
    if (kind === 'assistant' || kind === 'ai' || (!kind && messageText(message))) {
      const next = messageText(message);
      if (next) text = next;
    }
  }
  return { text, idle };
}

async function streamOpenCode({ settings, model, messages, directory, signal, onDelta }) {
  const root = normalizeUrl(settings.opencodeUrl);
  const headers = authHeader(settings);
  const lastUser = [...(messages || [])].reverse().find((message) => message.role === 'user');
  const text = lastUser?.content || '';
  if (!text.trim()) throw new Error('Пустое сообщение');
  const key = root + '|' + (directory || '');
  let session = sessions.get(key);
  if (!session) {
    session = await createSession(root, headers, directory, model);
    sessions.set(key, session);
  }
  const dirHeaders = { ...headers, ...(directory ? { 'x-opencode-directory': directory } : {}) };
  if (session.style === 'v2') {
    await request(`${root}/api/session/${encodeURIComponent(session.id)}/prompt`, {
      method: 'POST',
      headers: dirHeaders,
      body: { text },
      timeout: 20000,
      signal,
    });
  } else {
    const posted = await request(`${root}/session/${encodeURIComponent(session.id)}/message`, {
      method: 'POST',
      headers: dirHeaders,
      body: { parts: [{ type: 'text', text }] },
      timeout: 120000,
      signal,
    });
    const immediate = messageText(unwrap(posted.json));
    if (immediate) {
      if (onDelta) onDelta({ thinking: '', answer: immediate, thinkingOpen: false, activity: 'OpenCode' });
      return { answer: immediate, thinking: '', activity: 'OpenCode' };
    }
  }

  const started = Date.now();
  let answer = '';
  let stable = 0;
  while (Date.now() - started < 120000) {
    if (signal?.aborted) {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }
    await sleep(450);
    let messagesNow = [];
    try {
      messagesNow = await readMessages(root, dirHeaders, session);
    } catch (error) {
      if (error.statusCode === 404) {
        sessions.delete(key);
        throw new Error('Сессия OpenCode не найдена');
      }
      continue;
    }
    const latest = latestAssistant(messagesNow);
    if (latest.text && latest.text !== answer) {
      answer = latest.text;
      stable = 0;
      if (onDelta) onDelta({ thinking: '', answer, thinkingOpen: false, activity: 'OpenCode' });
    } else if (answer) {
      stable += 1;
    }
    if (latest.idle && answer) break;
    if (stable >= 3 && answer) break;
  }
  if (!answer) throw new Error('OpenCode не прислал ответ');
  return { answer, thinking: '', activity: 'OpenCode' };
}

async function ensureOpenCodeInner(settings) {
  const baseUrl = normalizeUrl(settings.opencodeUrl);
  const healthy = await pingOpenCode(baseUrl, settings);
  if (healthy.running) {
    return { running: true, startedByUs: false, state: 'ready', provider: 'opencode', url: baseUrl };
  }
  if (settings.autoStartOpenCode === false) {
    return { running: false, state: 'stopped', provider: 'opencode', error: 'opencode-stopped' };
  }
  const bin = findInPath('opencode');
  if (!bin) {
    return { running: false, state: 'error', provider: 'opencode', error: 'OpenCode не найден. Установите CLI opencode.' };
  }
  const port = String(portOf(baseUrl));
  const env = ollamaEnv();
  if (settings.opencodePassword) {
    env.OPENCODE_SERVER_PASSWORD = settings.opencodePassword;
    env.OPENCODE_SERVER_USERNAME = settings.opencodeUsername || 'opencode';
  }
  let stderr = '';
  const child = spawn(bin, ['serve', '--hostname', '127.0.0.1', '--port', port], {
    env,
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });
  childProcess = child;
  ownedPid = child.pid;
  if (child.stderr) {
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-400); });
  }
  child.on('exit', () => {
    if (childProcess === child) {
      childProcess = null;
      ownedPid = null;
    }
  });
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20000) {
    if ((await pingOpenCode(baseUrl, settings, 700)).running) {
      return { running: true, startedByUs: true, state: 'ready', provider: 'opencode', url: baseUrl };
    }
    if (child.exitCode != null && Date.now() - startedAt > 1200) break;
    await sleep(350);
  }
  return { running: false, state: 'error', provider: 'opencode', error: stderr.trim() || 'OpenCode не ответил' };
}

function ensureOpenCode(settings) {
  if (!starting) {
    starting = ensureOpenCodeInner(settings).finally(() => { starting = null; });
  }
  return starting;
}

function stopOpenCodeIfWeStarted() {
  const child = childProcess;
  const pid = ownedPid;
  ownedPid = null;
  childProcess = null;
  if (!child || !pid || child.pid !== pid || child.killed) return;
  try { child.kill(); } catch { /* already gone */ }
}

module.exports = {
  normalizeUrl,
  pingOpenCode,
  listOpenCodeModels,
  streamOpenCode,
  ensureOpenCode,
  stopOpenCodeIfWeStarted,
};
