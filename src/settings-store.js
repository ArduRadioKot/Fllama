const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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
};

const KEYS = Object.keys(DEFAULTS);
const URL_KEYS = ['ollamaUrl', 'lmstudioUrl', 'codexBaseUrl', 'claudeBaseUrl', 'opencodeUrl'];
const PROVIDERS = ['ollama', 'lmstudio', 'codex', 'claude', 'opencode'];

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
  return { ...cache };
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

  for (const key of ['codexApiKey', 'claudeApiKey', 'agentServerApiKey', 'codexModel', 'claudeModel', 'agentModel', 'lastModel', 'opencodeUsername', 'opencodePassword']) {
    next[key] = typeof next[key] === 'string' ? next[key].trim() : '';
  }

  cache = next;
  fs.mkdirSync(path.dirname(filePath()), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(next, null, 2));
  return { ...cache };
}

module.exports = { DEFAULTS, getSettings, saveSettings };
