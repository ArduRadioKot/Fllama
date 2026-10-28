const http = require('http');
const crypto = require('crypto');

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

function authorized(req, settings) {
  const expected = (settings.agentServerApiKey || '').trim();
  if (!expected) return true;
  const header = req.headers.authorization || '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const apiKey = req.headers['x-api-key'] || '';
  return safeEqual(bearer, expected) || safeEqual(apiKey, expected);
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((part) => {
    if (typeof part === 'string') return part;
    if (!part || typeof part !== 'object') return '';
    if (typeof part.text === 'string') return part.text;
    if (typeof part.content === 'string') return part.content;
    if (part.type === 'tool_result') return textOf(part.content);
    return '';
  }).filter(Boolean).join('\n');
}

function fromOpenAIMessages(body) {
  const messages = [];
  for (const message of body.messages || []) {
    const content = textOf(message.content).trim();
    if (!content && !message.tool_calls) continue;
    messages.push({ role: message.role || 'user', content, tool_calls: message.tool_calls });
  }
  return messages;
}

function fromResponses(body) {
  const messages = [];
  if (typeof body.instructions === 'string' && body.instructions.trim()) {
    messages.push({ role: 'system', content: body.instructions.trim() });
  }
  const input = body.input;
  if (typeof input === 'string') {
    messages.push({ role: 'user', content: input });
    return messages;
  }
  if (!Array.isArray(input)) return messages;
  for (const item of input) {
    if (typeof item === 'string') {
      messages.push({ role: 'user', content: item });
      continue;
    }
    const role = item.role || (item.type === 'message' ? item.role : 'user') || 'user';
    const content = textOf(item.content != null ? item.content : item.text).trim();
    if (content) messages.push({ role, content });
  }
  return messages;
}

function fromAnthropic(body) {
  const messages = [];
  const system = textOf(body.system).trim();
  if (system) messages.push({ role: 'system', content: system });
  for (const message of body.messages || []) {
    const content = textOf(message.content).trim();
    if (content) messages.push({ role: message.role || 'user', content });
  }
  return messages;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 2_000_000) {
        const error = new Error('Слишком большой запрос');
        error.statusCode = 413;
        reject(error);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        const error = new Error('Некорректный JSON');
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body);
}

function openAITool(call, index) {
  return {
    id: call.id || `call_${index + 1}`,
    type: 'function',
    function: {
      name: call.name,
      arguments: call.arguments || '{}',
    },
  };
}

function createAgentServer({ getSettings, streamChat, listModels }) {
  let server = null;
  let info = { running: false, port: null, error: null };

  function stop() {
    const current = server;
    server = null;
    info = { running: false, port: null, error: null };
    if (!current) return Promise.resolve();
    return new Promise((resolve) => {
      current.close(() => resolve());
    });
  }

  async function start() {
    const settings = getSettings();
    await stop();
    if (!settings.agentServerEnabled) return info;

    server = http.createServer((req, res) => {
      handle(req, res).catch((error) => {
        if (res.headersSent || res.writableEnded) {
          res.end();
          return;
        }
        sendJson(res, error.statusCode || 500, { error: { message: error.message || 'Ошибка агента' } });
      });
    });

    await new Promise((resolve, reject) => {
      const onError = (error) => {
        info = { running: false, port: settings.agentServerPort, error: error.code === 'EADDRINUSE' ? 'Порт занят' : error.message };
        reject(error);
      };
      server.once('error', onError);
      server.listen(settings.agentServerPort, '127.0.0.1', () => {
        server.off('error', onError);
        info = { running: true, port: server.address().port, error: null };
        resolve();
      });
    });
    return info;
  }

  async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      });
      res.end();
      return;
    }

    const settings = getSettings();
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      sendJson(res, 200, { ok: true, provider: settings.provider, model: settings.agentModel || null });
      return;
    }

    if (!authorized(req, settings)) {
      sendJson(res, 401, { error: { message: 'Неверный API-ключ Fllama' } });
      return;
    }

    if (req.method === 'GET' && (url.pathname === '/v1/models' || url.pathname === '/models')) {
      const models = await listModels(settings);
      const now = Math.floor(Date.now() / 1000);
      sendJson(res, 200, {
        object: 'list',
        data: (models.length ? models : [settings.agentModel || 'fllama']).filter(Boolean).map((id) => ({
          id,
          object: 'model',
          created: now,
          owned_by: 'fllama',
        })),
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/v1/messages/count_tokens') {
      sendJson(res, 200, { input_tokens: 1 });
      return;
    }

    const isChat = req.method === 'POST' && (url.pathname === '/v1/chat/completions' || url.pathname === '/chat/completions');
    const isResponses = req.method === 'POST' && (url.pathname === '/v1/responses' || url.pathname === '/responses');
    const isAnthropic = req.method === 'POST' && (url.pathname === '/v1/messages' || url.pathname === '/messages');
    if (!isChat && !isResponses && !isAnthropic) {
      sendJson(res, 404, { error: { message: 'Маршрут не найден' } });
      return;
    }

    const body = await readBody(req);
    const messages = isAnthropic ? fromAnthropic(body) : (isResponses ? fromResponses(body) : fromOpenAIMessages(body));
    const requested = typeof body.model === 'string' ? body.model.trim() : '';
    const model = settings.agentModel || requested || settings.lastModel;
    if (!model) {
      sendJson(res, 400, { error: { message: 'Укажите модель агента в настройках Fllama' } });
      return;
    }

    const controller = new AbortController();
    let finished = false;
    res.on('close', () => {
      if (!finished) controller.abort();
    });

    const wantStream = body.stream === true;
    let thinking = '';
    let answer = '';
    let toolCalls = [];
    const result = await streamChat({
      provider: settings.provider,
      settings,
      model,
      messages,
      tools: body.tools,
      showThoughts: settings.showThoughts !== false,
      signal: controller.signal,
      onDelta: (delta) => {
        thinking = delta.thinking || '';
        answer = delta.answer || '';
        toolCalls = delta.toolCalls || [];
        if (wantStream && !res.headersSent) beginStream(res);
        if (wantStream) {
          // Дельты пишем ниже по накопленной разнице, чтобы не дублировать мысли.
        }
      },
    });
    finished = true;
    thinking = result.thinking || thinking;
    answer = result.answer || answer;
    toolCalls = result.toolCalls || toolCalls;

    if (!wantStream) {
      if (isAnthropic) sendJson(res, 200, anthropicMessage(model, answer, thinking, toolCalls));
      else if (isResponses) sendJson(res, 200, responsesMessage(model, answer, thinking));
      else sendJson(res, 200, openAIMessage(model, answer, thinking, toolCalls));
      return;
    }

    if (!res.headersSent) beginStream(res);
    if (isAnthropic) writeAnthropicStream(res, model, answer, thinking, toolCalls);
    else if (isResponses) writeResponsesStream(res, model, answer, thinking);
    else writeOpenAIStream(res, model, answer, thinking, toolCalls);
    res.end();
  }

  return {
    start,
    stop,
    info: () => ({ ...info }),
  };
}

function beginStream(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
}

function openAIMessage(model, answer, thinking, toolCalls) {
  const message = { role: 'assistant', content: answer || '' };
  if (thinking) message.reasoning_content = thinking;
  if (toolCalls.length) message.tool_calls = toolCalls.map(openAITool);
  return {
    id: 'chatcmpl-fllama',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message,
      finish_reason: toolCalls.length ? 'tool_calls' : 'stop',
    }],
  };
}

function writeOpenAIStream(res, model, answer, thinking, toolCalls) {
  const base = {
    id: 'chatcmpl-fllama',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
  };
  const send = (delta, finish) => {
    res.write(`data: ${JSON.stringify({
      ...base,
      choices: [{ index: 0, delta, finish_reason: finish || null }],
    })}\n\n`);
  };
  send({ role: 'assistant' });
  if (thinking) send({ reasoning_content: thinking });
  if (answer) send({ content: answer });
  if (toolCalls.length) {
    send({
      tool_calls: toolCalls.map((call, index) => ({ index, ...openAITool(call, index) })),
    });
  }
  send({}, toolCalls.length ? 'tool_calls' : 'stop');
  res.write('data: [DONE]\n\n');
}

function anthropicMessage(model, answer, thinking, toolCalls) {
  const content = [];
  if (thinking) content.push({ type: 'thinking', thinking });
  if (answer) content.push({ type: 'text', text: answer });
  toolCalls.forEach((call, index) => {
    let input = {};
    try {
      input = JSON.parse(call.arguments || '{}');
    } catch {
      input = { raw: call.arguments || '' };
    }
    content.push({ type: 'tool_use', id: call.id || `toolu_${index + 1}`, name: call.name, input });
  });
  if (!content.length) content.push({ type: 'text', text: '' });
  return {
    id: 'msg_fllama',
    type: 'message',
    role: 'assistant',
    model,
    content,
    stop_reason: toolCalls.length ? 'tool_use' : 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

function writeAnthropicStream(res, model, answer, thinking, toolCalls) {
  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  send('message_start', {
    type: 'message_start',
    message: {
      id: 'msg_fllama',
      type: 'message',
      role: 'assistant',
      content: [],
      model,
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  });
  let index = 0;
  if (thinking) {
    send('content_block_start', { type: 'content_block_start', index, content_block: { type: 'thinking', thinking: '' } });
    send('content_block_delta', { type: 'content_block_delta', index, delta: { type: 'thinking_delta', thinking } });
    send('content_block_stop', { type: 'content_block_stop', index });
    index += 1;
  }
  send('content_block_start', { type: 'content_block_start', index, content_block: { type: 'text', text: '' } });
  if (answer) send('content_block_delta', { type: 'content_block_delta', index, delta: { type: 'text_delta', text: answer } });
  send('content_block_stop', { type: 'content_block_stop', index });
  index += 1;
  toolCalls.forEach((call, toolIndex) => {
    send('content_block_start', {
      type: 'content_block_start',
      index,
      content_block: { type: 'tool_use', id: call.id || `toolu_${toolIndex + 1}`, name: call.name, input: {} },
    });
    send('content_block_delta', {
      type: 'content_block_delta',
      index,
      delta: { type: 'input_json_delta', partial_json: call.arguments || '{}' },
    });
    send('content_block_stop', { type: 'content_block_stop', index });
    index += 1;
  });
  send('message_delta', {
    type: 'message_delta',
    delta: { stop_reason: toolCalls.length ? 'tool_use' : 'end_turn', stop_sequence: null },
    usage: { output_tokens: 0 },
  });
  send('message_stop', { type: 'message_stop' });
}

function responsesMessage(model, answer, thinking) {
  const output = [];
  if (thinking) {
    output.push({ type: 'reasoning', summary: [{ type: 'summary_text', text: thinking }] });
  }
  output.push({
    type: 'message',
    role: 'assistant',
    content: [{ type: 'output_text', text: answer || '' }],
  });
  return {
    id: 'resp_fllama',
    object: 'response',
    status: 'completed',
    model,
    output,
    output_text: answer || '',
  };
}

function writeResponsesStream(res, model, answer, thinking) {
  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
  };
  if (thinking) send('response.reasoning_summary_text.delta', { delta: thinking });
  if (answer) send('response.output_text.delta', { delta: answer });
  send('response.completed', { response: responsesMessage(model, answer, thinking) });
}

module.exports = { createAgentServer };
