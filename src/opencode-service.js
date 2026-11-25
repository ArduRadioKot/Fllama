const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const { setTimeout: wait } = require('node:timers/promises');
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
      signal,
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
      return !part?.type || part.type === 'text' ? (part?.text || part?.content || '') : '';
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
    const res = await request(root + '/config/providers', { headers, timeout: 5000 });
    const providers = unwrap(res.json);
    const list = Array.isArray(providers) ? providers : (providers?.providers || []);
    const models = [];
    for (const provider of list) {
      for (const [key, model] of Object.entries(provider.models || provider.modelsList || {})) {
        const id = typeof model === 'string' ? model : (model.id || key);
        if (provider.id && id) models.push(provider.id + '/' + id);
      }
    }
    if (models.length) return [...new Set(models)].slice(0, 80);
  } catch {
    // The experimental server surface lists models separately.
  }
  try {
    const res = await request(root + '/api/model', { headers, timeout: 5000 });
    return [...new Set(asArray(res.json).map((model) => {
      if (model.providerID && model.modelID) return model.providerID + '/' + model.modelID;
      return model.id || '';
    }).filter(Boolean))].slice(0, 80);
  } catch {
    return [];
  }
}

async function createSession(root, headers, directory, signal) {
  try {
    const response = await request(root + '/session', {
      method: 'POST', headers, body: { title: 'Fllama' }, signal,
    });
    const data = unwrap(response.json);
    const id = data?.id || data?.sessionID;
    if (id) return { id, prefix: '', experimental: false };
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
  const response = await request(root + '/api/session', {
    method: 'POST', headers, body: { title: 'Fllama', location: directory ? { directory } : undefined }, signal,
  });
  const data = unwrap(response.json);
  const id = data?.id || data?.sessionID;
  if (!id) throw new Error('OpenCode did not return a session ID.');
  return { id, prefix: '/api', experimental: true };
}

function assistantTurn(messages, priorIds) {
  const fresh = messages.filter((message) => !priorIds.has(message.id || message.info?.id));
  const assistants = fresh.filter((message) => ['assistant', 'ai'].includes(messageKind(message)));
  const latest = assistants.at(-1);
  const error = latest?.info?.error || latest?.error;
  return {
    text: assistants.map(messageText).filter(Boolean).join('\n\n'),
    done: !!(latest?.info?.time?.completed || latest?.time?.completed || fresh.at(-1)?.type === 'idle'),
    error: error && (error.data?.message || error.message || error.name),
  };
}

async function streamOpenCode({ settings, model, messages, directory, signal, onDelta, sessionKey }) {
  const root = normalizeUrl(settings.opencodeUrl);
  const dirHeaders = { ...authHeader(settings), ...(directory ? { 'x-opencode-directory': encodeURIComponent(directory) } : {}) };
  const key = JSON.stringify([root, settings.opencodeUsername, directory, sessionKey, model]);
  let session = sessions.get(key);
  const lastUser = messages.findLast((message) => message.role === 'user');
  // After an app restart, reconstruct context for a new server session.
  const text = session || messages.length === 1
    ? lastUser?.content
    : messages.map(({ role, content }) => '[' + role + ']\n' + content).join('\n\n');
  if (!text?.trim()) throw new Error('OpenCode requires a prompt.');
  if (!session) {
    session = await createSession(root, dirHeaders, directory, signal);
    sessions.set(key, session);
  }
  const url = root + session.prefix + '/session/' + encodeURIComponent(session.id);
  const modelSeparator = model.indexOf('/');
  const modelRef = modelSeparator > 0
    ? { providerID: model.slice(0, modelSeparator), modelID: model.slice(modelSeparator + 1) }
    : undefined;
  const cancel = async () => {
    try {
      await request(url + (session.experimental ? '/interrupt' : '/abort'), {
        method: 'POST', headers: dirHeaders, timeout: 5000,
      });
      return true;
    } catch { return false; }
  };
  const options = { headers: dirHeaders, signal };
  let submitted = false;
  let answer = '';
  const publish = () => onDelta?.({ answer, activity: 'OpenCode' });
  try {
    const before = await request(url + '/message', options);
    const priorIds = new Set(asArray(before.json).map((message) => message.id || message.info?.id).filter(Boolean));
    if (session.experimental && modelRef) {
      await request(url + '/model', { ...options, method: 'POST', body: modelRef });
    }

    const promptPath = session.experimental ? '/prompt' : '/message';
    const body = session.experimental ? { text } : { model: modelRef, parts: [{ type: 'text', text }] };
    submitted = true;
    let posted;
    let postError;
    let pending = true;
    const post = request(url + promptPath, { ...options, method: 'POST', body, timeout: 900000 });
    post.then((result) => { posted = result; pending = false; }, (error) => { postError = error; pending = false; });

    const deadline = Date.now() + 900000;
    while (Date.now() < deadline) {
      if (postError) throw postError;
      if (!pending && !session.experimental) {
        const message = unwrap(posted.json);
        const turn = assistantTurn([message], new Set());
        if (turn.error) throw new Error(turn.error);
        answer = turn.text || answer || messageText(message);
        if (!answer) throw new Error('OpenCode returned no answer.');
        publish();
        return { answer, activity: 'OpenCode' };
      }
      await wait(400, undefined, { signal });
      const response = await request(url + '/message', options);
      const turn = assistantTurn(asArray(response.json), priorIds);
      if (turn.error) throw new Error(turn.error);
      if (turn.text && turn.text !== answer) {
        answer = turn.text;
        publish();
      }
      if (session.experimental && !pending && turn.done && answer) return { answer, activity: 'OpenCode' };
    }
    throw new Error('OpenCode did not finish in time.');
  } catch (error) {
    if (error.statusCode === 404) sessions.delete(key);
    if (submitted && !await cancel()) {
      const failure = new Error('OpenCode did not confirm cancellation. Check the server session before retrying.');
      failure.cancellationUnconfirmed = true;
      throw failure;
    }
    throw error;
  }
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
  child.on('error', (error) => { stderr = error.message; });
  child.on('close', () => {
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
    if ((child.exitCode != null || !child.pid) && Date.now() - startedAt > 1200) break;
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
