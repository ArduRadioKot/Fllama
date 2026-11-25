const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { openAICompatible } = require('./provider-catalog');

const DEFAULTS = {
  provider: 'ollama',
  ollamaUrl: 'http://127.0.0.1:11434',
  autoStartOllama: true,
  lmstudioUrl: 'http://127.0.0.1:1234/v1',
  codexBaseUrl: 'https://api.openai.com/v1',
  codexApiKey: '',
  codexModel: '',
  claudeBaseUrl: 'https://api.anthropic.com',
  claudeApiKey: '',
  claudeModel: '',
  opencodeUrl: 'http://127.0.0.1:4096',
  opencodeUsername: 'opencode',
  opencodePassword: '',
  autoStartOpenCode: true,
  showThoughts: true,
  agentMode: false,
  agentServerEnabled: false,
  agentServerPort: 11435,
  agentServerApiKey: '',
  agentModel: '',
  lastModel: '',
  compatible: {},
};

const KEYS = Object.keys(DEFAULTS);
const URL_KEYS = ['ollamaUrl', 'lmstudioUrl', 'codexBaseUrl', 'claudeBaseUrl', 'opencodeUrl'];
const PROVIDERS = ['ollama', 'lmstudio', 'codex', 'claude', 'opencode', ...Object.keys(openAICompatible)];

let cache = null;

function filePath() {
  return path.join(app.getPath('userData'), 'fllama-settings.json');
}

function getSettings() {
  if (!cache) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath(), 'utf8'));
      cache = { ...DEFAULTS, ...raw };
    } catch {
      cache = { ...DEFAULTS };
    }
  }
  return { ...cache, compatible: structuredClone(cache.compatible || {}) };
}

function saveSettings(patch) {
  const current = getSettings();
  const next = { ...current };
  const incoming = patch && typeof patch === 'object' ? patch : {};
  for (const key of KEYS) {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) next[key] = incoming[key];
  }

  next.autoStartOllama = !!next.autoStartOllama;
  next.autoStartOpenCode = next.autoStartOpenCode !== false;
  next.showThoughts = next.showThoughts !== false;
  next.agentMode = !!next.agentMode;
  next.agentServerEnabled = !!next.agentServerEnabled;

  let port = parseInt(next.agentServerPort, 10);
  if (!Number.isFinite(port) || port < 1024 || port > 65535) {
    port = current.agentServerPort || DEFAULTS.agentServerPort;
  }
  next.agentServerPort = port;

  if (!PROVIDERS.includes(next.provider)) next.provider = current.provider || 'ollama';

  for (const key of URL_KEYS) {
    const value = typeof next[key] === 'string' ? next[key].trim() : '';
    if (!/^https?:\/\//i.test(value)) next[key] = current[key];
    else next[key] = value.replace(/\/+$/, '');
  }

  for (const key of ['codexApiKey', 'claudeApiKey', 'agentServerApiKey', 'codexModel', 'claudeModel', 'agentModel', 'lastModel', 'opencodePassword', 'opencodeUsername']) {
    next[key] = typeof next[key] === 'string' ? next[key].trim() : '';
  }

  next.compatible = { ...current.compatible };
  for (const [id, config] of Object.entries(openAICompatible)) {
    const entry = incoming.compatible?.[id];
    if (!entry || typeof entry !== 'object') continue;
    const previous = current.compatible[id] || {};
    let endpoint = config.endpoint;
    if (!endpoint && typeof entry.endpoint === 'string') {
      const value = entry.endpoint.trim().replace(/\/+$/, '');
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
          throw new Error('Enter an HTTP(S) API base URL without credentials, query or fragment.');
        }
        endpoint = value;
      } catch {
        if (value) throw new Error('Invalid OpenAI-compatible API base URL.');
      }
    }
    next.compatible[id] = {
      endpoint,
      apiKey: typeof entry.apiKey === 'string' ? entry.apiKey.trim() : previous.apiKey || '',
      model: typeof entry.model === 'string' ? entry.model.trim() : previous.model || '',
    };
  }

  fs.mkdirSync(path.dirname(filePath()), { recursive: true });
  const pending = filePath() + ".tmp";
  fs.writeFileSync(pending, JSON.stringify(next, null, 2), { mode: 0o600 });
  fs.renameSync(pending, filePath());
  cache = next;
  return { ...cache, compatible: structuredClone(cache.compatible || {}) };
}

module.exports = { DEFAULTS, getSettings, saveSettings };
