(function () {
  const local = { ollama: 'Ollama', lmstudio: 'LM Studio' };
  const api = { codex: 'OpenAI API', claude: 'Anthropic API' };
  const openAICompatible = {
    openrouter: { label: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1', models: ['openrouter/auto'] },
    gemini: { label: 'Google Gemini API', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-4-hydrogen'] },
    deepseek: { label: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1', models: ['deepseek-v4-pro', 'deepseek-flash'] },
    groq: { label: 'Groq', endpoint: 'https://api.groq.com/openai/v1', models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'] },
    xai: { label: 'xAI', endpoint: 'https://api.x.ai/v1', models: [] },
    mistral: { label: 'Mistral', endpoint: 'https://api.mistral.ai/v1', models: ['codestral-latest', 'mistral-medium-latest', 'mistral-small-latest'] },
    kilo: { label: 'Kilo Gateway', endpoint: 'https://ai-gateway.kilo.ai/api/v1', models: ['minimax/minimax-m2.1:free', 'z-ai/glm-5:free'], requiresKey: false, freeWithoutKey: true },
    custom: { label: 'OpenAI-compatible', endpoint: '', models: [], requiresKey: false },
  };
  const cli = {
    'codex-cli': { label: 'Codex CLI', binary: 'codex' },
    'claude-cli': { label: 'Claude Code CLI', binary: 'claude' },
    'kiro-cli': { label: 'Kiro CLI', binary: 'kiro-cli', project: true },
    'hermes-cli': { label: 'Hermes Agent', binary: 'hermes', project: true },
    'cline-cli': { label: 'Cline CLI', binary: 'cline', project: true },
    'roo-cli': { label: 'Roo Code CLI', binary: 'roo', project: true },
    'kilo-cli': { label: 'Kilo Code CLI', binary: 'kilo', project: true },
    'gemini-cli': { label: 'Gemini CLI', binary: 'gemini', project: true },
  };
  const labels = { ...local, ...api, opencode: 'OpenCode' };
  for (const [id, entry] of Object.entries({ ...cli, ...openAICompatible })) labels[id] = entry.label;
  const catalog = { local, api, cli, openAICompatible, labels };
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else globalThis.fllamaCatalog = catalog;
})();
