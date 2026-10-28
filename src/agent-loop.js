const { TOOLS, executeTool, takeToolCall } = require('./project-tools');

const LABELS = {
  ru: {
    list_dir: 'Смотрю папку',
    read_file: 'Читаю',
    write_file: 'Записываю',
    delete_path: 'Удаляю',
    search: 'Ищу',
    fetch_url: 'Открываю страницу',
  },
  en: {
    list_dir: 'Listing',
    read_file: 'Reading',
    write_file: 'Writing',
    delete_path: 'Deleting',
    search: 'Searching',
    fetch_url: 'Opening',
  },
};

function toolLine(lang, call) {
  const labels = LABELS[lang] || LABELS.en;
  let args = {};
  try { args = JSON.parse(call.arguments || '{}'); } catch { args = {}; }
  const target = args.path || args.url || args.query || '';
  return `${labels[call.name] || call.name}${target ? ' ' + target : ''}`;
}

function sameCall(a, b) {
  return a.name === b.name && a.arguments === b.arguments;
}

async function runAgentLoop({ streamChat, provider, settings, model, messages, projectRoot, lang, showThoughts, signal, onDelta }) {
  const history = (messages || []).map((message) => ({ ...message }));
  const activity = [];
  const seen = [];
  let thinking = '';
  let answer = '';

  function publish(extra) {
    if (onDelta) {
      onDelta({
        thinking,
        answer,
        thinkingOpen: !answer && !!thinking,
        activity: activity.join('\n'),
        ...(extra || {}),
      });
    }
  }

  for (let step = 0; step < 6; step += 1) {
    if (signal?.aborted) {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }
    const result = await streamChat({
      provider,
      settings,
      model,
      messages: history,
      tools: TOOLS,
      showThoughts,
      signal,
      onDelta: (delta) => {
        thinking = delta.thinking || thinking;
        answer = delta.answer || '';
        publish();
      },
    });
    thinking = result.thinking || thinking;
    answer = result.answer || answer;
    let calls = (result.toolCalls || []).filter((call) => call && call.name);
    if (!calls.length) {
      const parsed = takeToolCall(answer);
      if (parsed) {
        calls = [parsed.call];
        answer = parsed.answer;
      }
    }
    if (!calls.length) {
      publish();
      return { answer, thinking, activity: activity.join('\n') };
    }
    const call = calls[0];
    if (seen.some((item) => sameCall(item, call))) {
      publish();
      return { answer, thinking, activity: activity.join('\n') };
    }
    seen.push(call);
    activity.push(toolLine(lang, call));
    publish();
    let output = '';
    try {
      output = String(await executeTool(projectRoot, call));
    } catch (error) {
      output = 'Ошибка: ' + (error.message || error);
      activity[activity.length - 1] += ' — ' + output;
    }
    if (output.length > 12000) output = output.slice(0, 12000) + '\n…';
    history.push({ role: 'assistant', content: answer || `[tool call: ${call.name}]`, tool_calls: [call] });
    history.push({ role: 'tool', content: output });
    answer = '';
  }
  publish();
  return { answer: answer || (lang === 'ru' ? 'Достигнут предел шагов агента.' : 'Agent step limit reached.'), thinking, activity: activity.join('\n') };
}

module.exports = { runAgentLoop };
