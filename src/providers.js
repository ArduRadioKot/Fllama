const http = require('http');
const https = require('https');
const { splitThoughts } = require('./thoughts');
const { normalizeOllamaUrl } = require('./ollama-service');
const { streamOpenCode, listOpenCodeModels } = require('./opencode-service');

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 4 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 4 });

const SUGGESTED = {
  codex: ['gpt-4.1', 'gpt-4o', 'o4-mini', 'gpt-5.1-codex'],
  claude: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-sonnet-4-5', 'claude-opus-4-1'],
};

function abortError() {
  const error = new Error('aborted');
  error.name = 'AbortError';
  return error;
}

function isAbort(error) {
  return !!error && (error.name === 'AbortError' || error.code === 'ABORT_ERR');
}

function openAIBase(input) {
  let value = (input || '').trim().replace(/\/+$/, '');
  value = value.replace('://localhost', '://127.0.0.1');
  if (!/\/v1$/i.test(value)) value += '/v1';
  return value;
}

function claudeRoot(input) {
  let value = (input || 'https://api.anthropic.com').trim().replace(/\/+$/, '');
  value = value.replace(/\/v1$/i, '');
  return value;
}

function friendlyError(error) {
  if (isAbort(error)) return error;
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'EHOSTUNREACH') {
    error.message = 'Сервер не запущен или адрес недоступен';
  } else if (error.code === 'ETIMEDOUT') {
    error.message = 'Нет ответа от сервера';
  }
  return error;
}

function requestStream(urlStr, { method, headers, body, signal, timeout = 120000 }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(friendlyError(error));
    };
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const payload = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const reqHeaders = { Accept: 'application/json', ...(headers || {}) };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = String(payload.length);
    }
    const req = lib.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      method: method || 'GET',
      headers: reqHeaders,
      agent: url.protocol === 'https:' ? httpsAgent : httpAgent,
    }, (res) => {
      if ((res.statusCode || 500) >= 400) {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          let message = Buffer.concat(chunks).toString('utf8');
          try {
            const parsed = JSON.parse(message);
            message = parsed.error?.message || parsed.error || message;
          } catch {
            // keep raw body
          }
          const error = new Error(message || ('HTTP ' + res.statusCode));
          error.statusCode = res.statusCode;
          fail(error);
        });
        return;
      }
      if (settled) return;
      settled = true;
      resolve(res);
    });

    const onAbort = () => {
      req.destroy(abortError());
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
        fail(abortError());
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
      req.on('close', () => signal.removeEventListener('abort', onAbort));
    }
    req.setTimeout(timeout, () => {
      req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }));
    });
    req.on('response', () => req.setTimeout(0));
    req.on('error', fail);
    if (payload) req.write(payload);
    req.end();
  });
}

async function requestJson(urlStr, options = {}) {
  const res = await requestStream(urlStr, { timeout: 8000, ...options });
  const chunks = [];
  for await (const chunk of res) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  return JSON.parse(text);
}

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return content == null ? '' : String(content);
  return content.map((part) => {
    if (typeof part === 'string') return part;
    if (!part || typeof part !== 'object') return '';
    if (typeof part.text === 'string') return part.text;
    if (part.type === 'tool_result') return textFromContent(part.content);
    return '';
  }).filter(Boolean).join('\n');
}

function normalizeMessages(messages) {
  const out = [];
  for (const message of messages || []) {
    if (!message) continue;
    let role = message.role === 'assistant' || message.role === 'system' ? message.role : 'user';
    if (message.role === 'tool' || message.type === 'tool_result') role = 'user';
    let content = textFromContent(message.content).trim();
    if (Array.isArray(message.tool_calls) && message.tool_calls.length) {
      const names = message.tool_calls.map((call) => call.function?.name || call.name).filter(Boolean).join(', ');
      content = (content ? content + '\n' : '') + (names ? `[tool call: ${names}]` : '[tool call]');
    }
    if (!content) continue;
    if (content.length > 24000) content = content.slice(-24000);
    const prev = out[out.length - 1];
    if (prev && prev.role === role) prev.content += '\n\n' + content;
    else out.push({ role, content });
  }
  return out.slice(-24);
}

function normalizeTools(tools) {
  if (!Array.isArray(tools)) return [];
  return tools.map((tool) => {
    const fn = tool.function || tool;
    if (!fn || !fn.name) return null;
    return {
      name: String(fn.name),
      description: typeof fn.description === 'string' ? fn.description : '',
      parameters: fn.parameters || fn.input_schema || { type: 'object', properties: {} },
    };
  }).filter(Boolean).slice(0, 32);
}

function asArgumentString(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '{}';
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

async function readNDJSON(stream, onObject, signal) {
  let buf = '';
  for await (const chunk of stream) {
    if (signal?.aborted) throw abortError();
    buf += chunk.toString();
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        onObject(JSON.parse(line));
      } catch {
        // неполная или служебная строка
      }
    }
  }
  if (buf.trim()) {
    try {
      onObject(JSON.parse(buf.trim()));
    } catch {
      // ignore trailing junk
    }
  }
}

async function readSSE(stream, onEvent, signal) {
  let buf = '';
  const consume = (block) => {
    let event = 'message';
    const dataLines = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    const data = dataLines.join('\n');
    if (data === '[DONE]') {
      onEvent({ event, done: true });
      return;
    }
    try {
      onEvent({ event, json: JSON.parse(data) });
    } catch {
      // ignore non-json keepalives
    }
  };
  for await (const chunk of stream) {
    if (signal?.aborted) throw abortError();
    buf += chunk.toString();
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      consume(buf.slice(0, idx));
      buf = buf.slice(idx + 2);
    }
  }
  if (buf.trim()) consume(buf);
}

function emitState(onDelta, state) {
  const parsed = splitThoughts(state.content, state.native);
  state.answer = parsed.answer;
  state.thinking = parsed.thinking;
  state.thinkingOpen = parsed.thinkingOpen || (!parsed.answer && !!parsed.thinking);
  if (onDelta) {
    onDelta({
      thinking: parsed.thinking,
      answer: parsed.answer,
      thinkingOpen: state.thinkingOpen,
      toolCalls: state.toolCalls,
    });
  }
}

async function streamOllama({ settings, model, messages, tools, showThoughts, signal, onDelta }) {
  const state = { content: '', native: '', thinking: '', answer: '', thinkingOpen: false, toolCalls: [] };
  const body = {
    model,
    messages,
    stream: true,
    keep_alive: '30m',
  };
  if (showThoughts) body.think = true;
  if (tools.length) {
    body.tools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  const run = async (payload) => {
    const res = await requestStream(normalizeOllamaUrl(settings.ollamaUrl) + '/api/chat', {
      method: 'POST',
      body: payload,
      signal,
    });
    let sawToken = false;
    await readNDJSON(res, (data) => {
      if (data.error) {
        const error = new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        if (!sawToken) throw error;
        return;
      }
      const message = data.message || {};
      if (message.thinking) {
        state.native += message.thinking;
        sawToken = true;
      }
      if (message.content) {
        state.content += message.content;
        sawToken = true;
      }
      if (Array.isArray(message.tool_calls)) {
        for (const call of message.tool_calls) {
          const fn = call.function || call;
          if (!fn?.name) continue;
          state.toolCalls.push({
            id: call.id || `call_${state.toolCalls.length + 1}`,
            name: fn.name,
            arguments: asArgumentString(fn.arguments),
          });
        }
        sawToken = true;
      }
      emitState(onDelta, state);
    }, signal);
    return sawToken;
  };

  try {
    await run(body);
  } catch (error) {
    if (isAbort(error)) throw error;
    if (showThoughts && !state.content && !state.native && /think/i.test(error.message || '')) {
      delete body.think;
      await run(body);
    } else {
      throw friendlyError(error);
    }
  }
  emitState(onDelta, state);
  return { answer: state.answer, thinking: state.thinking, toolCalls: state.toolCalls };
}

function pushToolDelta(state, delta) {
  if (!delta) return;
  const index = Number.isInteger(delta.index) ? delta.index : state.toolCalls.length;
  if (!state.toolCalls[index]) {
    state.toolCalls[index] = { id: delta.id || `call_${index + 1}`, name: '', arguments: '' };
  }
  const target = state.toolCalls[index];
  if (delta.id) target.id = delta.id;
  const fn = delta.function || {};
  if (fn.name) target.name += fn.name;
  if (typeof fn.arguments === 'string') target.arguments += fn.arguments;
}

async function streamChatCompletions({ url, apiKey, model, messages, tools, signal, onDelta, state }) {
  const headers = {};
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  const body = { model, messages, stream: true };
  if (tools.length) {
    body.tools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
  const res = await requestStream(url, { method: 'POST', headers, body, signal });
  await readSSE(res, ({ json, done }) => {
    if (done || !json) return;
    const choice = json.choices && json.choices[0];
    const delta = choice?.delta || {};
    if (typeof delta.reasoning_content === 'string') state.native += delta.reasoning_content;
    else if (typeof delta.reasoning === 'string') state.native += delta.reasoning;
    if (typeof delta.content === 'string') state.content += delta.content;
    if (Array.isArray(delta.tool_calls)) {
      for (const call of delta.tool_calls) pushToolDelta(state, call);
    }
    emitState(onDelta, state);
  }, signal);
}

async function streamResponses({ url, apiKey, model, messages, signal, onDelta, state }) {
  const headers = {};
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  const input = messages.filter((message) => message.role !== 'system').map((message) => ({
    role: message.role,
    content: [{ type: message.role === 'assistant' ? 'output_text' : 'input_text', text: message.content }],
  }));
  const instructions = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n');
  const body = { model, input, stream: true };
  if (instructions) body.instructions = instructions;
  const res = await requestStream(url, { method: 'POST', headers, body, signal });
  await readSSE(res, ({ json }) => {
    if (!json) return;
    const type = json.type || '';
    if (typeof json.delta === 'string') {
      if (type.includes('reasoning')) state.native += json.delta;
      else if (type.includes('output_text') || type.includes('text')) state.content += json.delta;
    }
    emitState(onDelta, state);
  }, signal);
}

async function streamOpenAI({ baseUrl, apiKey, model, messages, tools, signal, onDelta, allowResponsesFallback }) {
  const state = { content: '', native: '', thinking: '', answer: '', thinkingOpen: false, toolCalls: [] };
  const root = openAIBase(baseUrl);
  try {
    await streamChatCompletions({
      url: root + '/chat/completions',
      apiKey,
      model,
      messages,
      tools,
      signal,
      onDelta,
      state,
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    const noTokens = !state.content && !state.native && !state.toolCalls.length;
    const canRetry = allowResponsesFallback && noTokens && (error.statusCode === 404 || /responses|not supported|not found/i.test(error.message || ''));
    if (!canRetry) throw friendlyError(error);
    await streamResponses({
      url: root + '/responses',
      apiKey,
      model,
      messages,
      signal,
      onDelta,
      state,
    });
  }
  state.toolCalls = state.toolCalls.filter((call) => call && call.name);
  emitState(onDelta, state);
  return { answer: state.answer, thinking: state.thinking, toolCalls: state.toolCalls };
}

async function streamClaude({ settings, model, messages, tools, showThoughts, signal, onDelta }) {
  const state = { content: '', native: '', thinking: '', answer: '', thinkingOpen: false, toolCalls: [] };
  const system = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n');
  const chat = messages.filter((message) => message.role !== 'system').map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content,
  }));
  const body = {
    model,
    max_tokens: showThoughts ? 8192 : 4096,
    messages: chat.length ? chat : [{ role: 'user', content: '...' }],
    stream: true,
  };
  if (system) body.system = system;
  if (showThoughts) body.thinking = { type: 'enabled', budget_tokens: 2048 };
  if (tools.length) {
    body.tools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }
  const headers = {
    'x-api-key': settings.claudeApiKey,
    'anthropic-version': '2023-06-01',
  };

  const run = async (payload) => {
    const res = await requestStream(claudeRoot(settings.claudeBaseUrl) + '/v1/messages', {
      method: 'POST',
      headers,
      body: payload,
      signal,
    });
    const blocks = [];
    await readSSE(res, ({ json }) => {
      if (!json) return;
      if (json.type === 'content_block_start') {
        blocks[json.index] = json.content_block || { type: 'text' };
      } else if (json.type === 'content_block_delta') {
        const delta = json.delta || {};
        if (delta.type === 'thinking_delta') state.native += delta.thinking || '';
        else if (delta.type === 'text_delta') state.content += delta.text || '';
        else if (delta.type === 'input_json_delta') {
          const block = blocks[json.index] || { type: 'tool_use', name: '', id: '' };
          block.partial = (block.partial || '') + (delta.partial_json || '');
          blocks[json.index] = block;
        }
      }
      state.toolCalls = blocks.filter((block) => block && block.type === 'tool_use' && block.name).map((block, index) => ({
        id: block.id || `toolu_${index + 1}`,
        name: block.name,
        arguments: block.partial || '{}',
      }));
      emitState(onDelta, state);
    }, signal);
  };

  try {
    await run(body);
  } catch (error) {
    if (isAbort(error)) throw error;
    if (showThoughts && !state.content && !state.native && /think/i.test(error.message || '')) {
      delete body.thinking;
      body.max_tokens = 4096;
      await run(body);
    } else {
      throw friendlyError(error);
    }
  }
  emitState(onDelta, state);
  return { answer: state.answer, thinking: state.thinking, toolCalls: state.toolCalls };
}

async function streamChat({ provider, settings, model, messages, tools, showThoughts, signal, onDelta, directory }) {
  const normalized = normalizeMessages(messages);
  const normalizedTools = normalizeTools(tools);
  if (!normalized.length) {
    const error = new Error('Пустое сообщение');
    throw error;
  }
  if (provider === 'opencode') {
    return streamOpenCode({
      settings,
      model: model || 'default',
      messages: normalized,
      directory: directory || '',
      signal,
      onDelta,
    });
  }
  if (!model) {
    throw new Error('Модель не выбрана');
  }
  if (provider === 'ollama') {
    return streamOllama({
      settings,
      model,
      messages: normalized,
      tools: normalizedTools,
      showThoughts: !!showThoughts,
      signal,
      onDelta,
    });
  }
  if (provider === 'lmstudio') {
    return streamOpenAI({
      baseUrl: settings.lmstudioUrl,
      apiKey: '',
      model,
      messages: normalized,
      tools: normalizedTools,
      signal,
      onDelta,
      allowResponsesFallback: false,
    });
  }
  if (provider === 'codex') {
    if (!settings.codexApiKey) throw new Error('Укажите API-ключ Codex в настройках');
    return streamOpenAI({
      baseUrl: settings.codexBaseUrl,
      apiKey: settings.codexApiKey,
      model,
      messages: normalized,
      tools: normalizedTools,
      signal,
      onDelta,
      allowResponsesFallback: true,
    });
  }
  if (provider === 'claude') {
    if (!settings.claudeApiKey) throw new Error('Укажите API-ключ Claude в настройках');
    return streamClaude({
      settings,
      model,
      messages: normalized,
      tools: normalizedTools,
      showThoughts: !!showThoughts,
      signal,
      onDelta,
    });
  }
  throw new Error('Неизвестный провайдер');
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

async function listModels(settings) {
  const provider = settings.provider;
  try {
    if (provider === 'ollama') {
      const data = await requestJson(normalizeOllamaUrl(settings.ollamaUrl) + '/api/tags', { method: 'GET' });
      return unique((data.models || []).map((model) => model.name));
    }
    if (provider === 'lmstudio') {
      const data = await requestJson(openAIBase(settings.lmstudioUrl) + '/models', { method: 'GET' });
      const models = unique((data.data || []).map((model) => model.id));
      return models;
    }
    if (provider === 'codex') {
      const extras = [settings.codexModel, ...SUGGESTED.codex];
      if (!settings.codexApiKey) return unique(extras);
      try {
        const data = await requestJson(openAIBase(settings.codexBaseUrl) + '/models', {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + settings.codexApiKey },
        });
        const ids = unique((data.data || []).map((model) => model.id));
        return unique([...extras, ...ids]).slice(0, 80);
      } catch {
        return unique(extras);
      }
    }
    if (provider === 'opencode') return listOpenCodeModels(settings);
    if (provider === 'claude') {
      const extras = [settings.claudeModel, ...SUGGESTED.claude];
      if (!settings.claudeApiKey) return unique(extras);
      try {
        const data = await requestJson(claudeRoot(settings.claudeBaseUrl) + '/v1/models', {
          method: 'GET',
          headers: {
            'x-api-key': settings.claudeApiKey,
            'anthropic-version': '2023-06-01',
          },
        });
        const ids = unique((data.data || []).map((model) => model.id));
        return unique([...extras, ...ids]).slice(0, 80);
      } catch {
        return unique(extras);
      }
    }
  } catch {
    if (provider === 'codex') return unique([settings.codexModel, ...SUGGESTED.codex]);
    if (provider === 'opencode') return ['default'];
    if (provider === 'claude') return unique([settings.claudeModel, ...SUGGESTED.claude]);
    return [];
  }
  return [];
}

module.exports = {
  streamChat,
  listModels,
  normalizeMessages,
  openAIBase,
  isAbort,
};
