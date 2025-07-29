const chat = document.getElementById('chat');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const modelSelect = document.getElementById('model-select');

let markdownHighlightEnabled = true;
let currentStreamHandler = null;
let chatFontSize = 16;

// Система управления чатами
let chats = [];
let currentChatIndex = 0;

function createNewChat() {
  const newChat = {
    id: Date.now(),
    name: `Чат ${chats.length + 1}`,
    messages: []
  };
  chats.push(newChat);
  currentChatIndex = chats.length - 1;
  updateChatDisplay();
  saveChats();
}

function switchToChat(index) {
  if (index >= 0 && index < chats.length) {
    currentChatIndex = index;
    updateChatDisplay();
  }
}

function updateChatDisplay() {
  // Очищаем чат
  chat.innerHTML = '';
  
  if (chats.length === 0) {
    createNewChat();
    return;
  }
  
  const currentChat = chats[currentChatIndex];
  
  // Отображаем сообщения текущего чата
  currentChat.messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message ' + msg.sender;
    div.style.fontSize = chatFontSize + 'px';
    
    if (msg.sender === 'ai' && msg.isMarkdown && markdownHighlightEnabled) {
      // Обрабатываем AI сообщения с тегами <think>
      const thinkMatch = msg.text.match(/<think>([\s\S]*?)<\/think>/i);
      if (thinkMatch) {
        const think = thinkMatch[1].trim();
        const answer = msg.text.replace(thinkMatch[0], '').trim();
        div.innerHTML = formatThinkingAndAnswer(think, answer);
        addCopyButtonsToCodeBlocks(div);
      } else {
        div.innerHTML = simpleMarkdown(msg.text);
        addCopyButtonsToCodeBlocks(div);
      }
    } else if (msg.isMarkdown && markdownHighlightEnabled) {
      div.innerHTML = simpleMarkdown(msg.text);
      addCopyButtonsToCodeBlocks(div);
    } else if (msg.isMarkdown) {
      div.innerHTML = escapeHtml(msg.text).replace(/\n/g, '<br>');
    } else {
      div.textContent = msg.text;
    }
    
    chat.appendChild(div);
  });
  
  chat.scrollTop = chat.scrollHeight;
  
  // Обновляем список вкладок
  updateTabsList();
}

function updateTabsList() {
  const tabsList = document.getElementById('tabs-list');
  tabsList.innerHTML = '';
  
  chats.forEach((chat, index) => {
    const tabItem = document.createElement('div');
    tabItem.className = `tab-item ${index === currentChatIndex ? 'active' : ''}`;
    tabItem.innerHTML = `
      <span class="tab-name">${chat.name}</span>
      <button class="tab-close" title="Закрыть чат" data-tab-index="${index}">✖</button>
    `;
    
    tabItem.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        switchToChat(index);
      }
    });
    
    const closeBtn = tabItem.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(index);
    });
    
    tabsList.appendChild(tabItem);
  });
}

function deleteChat(index) {
  if (chats.length <= 1) {
    alert('Нельзя удалить последний чат');
    return;
  }
  
  chats.splice(index, 1);
  
  if (currentChatIndex >= chats.length) {
    currentChatIndex = chats.length - 1;
  } else if (currentChatIndex > index) {
    currentChatIndex--;
  }
  
  updateChatDisplay();
  saveChats();
}

function saveChats() {
  localStorage.setItem('ollama-chats', JSON.stringify(chats));
  localStorage.setItem('ollama-current-chat', currentChatIndex);
}

function loadChats() {
  const savedChats = localStorage.getItem('ollama-chats');
  const savedCurrentChat = localStorage.getItem('ollama-current-chat');
  
  if (savedChats) {
    chats = JSON.parse(savedChats);
    currentChatIndex = parseInt(savedCurrentChat) || 0;
  } else {
    createNewChat();
  }
  
  updateChatDisplay();
}

// Глобальный обработчик стриминга
function setupStreamHandler() {
  currentStreamHandler = (event, data) => {
    if (!window.currentAiMessageDiv || window.stopped) return;
    
    window.fullMessage += data.content;
    
   
    const thinkMatch = window.fullMessage.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      window.think = thinkMatch[1].trim();
      window.answer = window.fullMessage.replace(thinkMatch[0], '').trim();
    } else {
      window.answer = window.fullMessage;
    }
    

    if (markdownHighlightEnabled) {
      window.currentAiMessageDiv.innerHTML = formatThinkingAndAnswer(window.think, window.answer);
      addCopyButtonsToCodeBlocks(window.currentAiMessageDiv);
    } else {
      let displayText = '';
      if (window.think) {
        displayText += '**Мысли:**\n' + window.think + '\n\n';
      }
      displayText += window.answer;
      window.currentAiMessageDiv.textContent = displayText;
    }
    
    chat.scrollTop = chat.scrollHeight;
  };
  
  window.electronAPI.onStreamUpdate(currentStreamHandler);
}

// --- Markdown парсер без сторонних библиотек ---
function simpleMarkdown(text) {
  // Экранируем HTML
  text = escapeHtml(text);
  // Блоки кода ```
  text = text.replace(/```([\s\S]*?)```/g, (m, code) => `\n<div class=\"md-code-outer\"><pre class=\"md-code-block\"><code>${code.trim()}</code></pre></div>\n`);
  // Инлайн-код
  text = text.replace(/`([^`]+)`/g, (m, code) => `<code class=\"md-inline-code\">${code}</code>`);
  // Заголовки #
  text = text.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
             .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
             .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
             .replace(/^### (.*)$/gm, '<h3>$1</h3>')
             .replace(/^## (.*)$/gm, '<h2>$1</h2>')
             .replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // Жирный ** ** и __ __
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
             .replace(/__(.*?)__/g, '<b>$1</b>');
  // Курсив * * и _ _
  text = text.replace(/\*(.*?)\*/g, '<i>$1</i>')
             .replace(/_(.*?)_/g, '<i>$1</i>');
  // Ссылки [текст](url)
  text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Маркированные списки
  text = text.replace(/(^|\n)[\*\-] (.*?)(?=\n|$)/g, '$1<li>$2</li>');
  text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  // Пронумерованные списки
  text = text.replace(/(^|\n)\d+\. (.*?)(?=\n|$)/g, '$1<ol><li>$2</li></ol>');
  // Переводы строк
  text = text.replace(/\n{2,}/g, '<br><br>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[tag]));
}

function formatThinkingAndAnswer(think, answer) {
  let html = '';
  if (think) {
    html += `<div class="thinking-text">${simpleMarkdown(think)}</div>`;
  }
  if (answer) {
    html += simpleMarkdown(answer);
  }
  return html;
}

function addCopyButtonsToCodeBlocks(container) {
  const codeBlocks = container.querySelectorAll('.md-code-outer');
  codeBlocks.forEach(block => {
    if (block.querySelector('.copy-code-btn')) return; // Не добавлять повторно
    const btn = document.createElement('button');
    btn.textContent = '📋';
    btn.className = 'copy-code-btn';
    btn.title = 'Скопировать код';
    btn.style.position = 'absolute';
    btn.style.top = '4px';
    btn.style.right = '4px';
    btn.style.zIndex = 2;
    btn.onclick = () => {
      const code = block.querySelector('code').innerText;
      navigator.clipboard.writeText(code);
      btn.textContent = '✅';
      setTimeout(() => { btn.textContent = '📋'; }, 1000);
    };
    block.style.position = 'relative';
    block.appendChild(btn);
  });
}

function addMessage(text, sender, isMarkdown = false, saveToChat = true) {
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  div.style.fontSize = chatFontSize + 'px';
  if (isMarkdown && markdownHighlightEnabled) {
    let html = simpleMarkdown(text);
    div.innerHTML = html;
  } else if (isMarkdown) {
    div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  } else {
    div.textContent = text;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  
  // Сохраняем сообщение в текущий чат
  if (saveToChat && chats.length > 0) {
    chats[currentChatIndex].messages.push({
      text: text,
      sender: sender,
      isMarkdown: isMarkdown,
      timestamp: Date.now()
    });
    saveChats();
  }
}

async function loadModels() {
  try {
    const models = await window.electronAPI.getModels();
    modelSelect.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
    
    // Если нет моделей, показываем сообщение о том, что Ollama не запущен
    if (models.length === 0) {
      addMessage('⚠️ Ollama не запущен или недоступен. Пожалуйста, убедитесь что Ollama установлен и запущен командой "ollama serve"', 'ai', false);
    }
  } catch (error) {
    addMessage('❌ Ошибка подключения к Ollama. Убедитесь что Ollama запущен командой "ollama serve"', 'ai', false);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMsg = input.value.trim();
  if (!userMsg) return;
  addMessage(userMsg, 'user');
  input.value = '';
  
  // Кнопка стоп
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.style.display = '';
  let stopped = false;
  let controller = new AbortController();
  stopBtn.onclick = () => {
    stopped = true;
    controller.abort();
    window.stopped = true;
    window.electronAPI.abortRequest();
    stopBtn.style.display = 'none';
  };

  const model = modelSelect.value;
  
  // Создаём сообщение AI для стриминга
  const aiMessageDiv = document.createElement('div');
  aiMessageDiv.className = 'message ai';
  aiMessageDiv.style.fontSize = chatFontSize + 'px';
  chat.appendChild(aiMessageDiv);
  chat.scrollTop = chat.scrollHeight;
  
  // Настраиваем глобальные переменные для стриминга
  window.currentAiMessageDiv = aiMessageDiv;
  window.fullMessage = '';
  window.think = '';
  window.answer = '';
  window.stopped = stopped;
  
  // Настраиваем обработчик стриминга
  setupStreamHandler();
  
  try {
    const result = await window.electronAPI.sendMessage(userMsg, model, controller.signal);
    
    // Финальная обработка
    if (!stopped) {
      if (typeof result === 'object' && result !== null) {
        if (result.think) {
          window.think = result.think;
          window.answer = result.answer;
        } else {
          window.answer = result.answer || result;
        }
      } else {
        window.answer = result;
      }
      
      // Финальное отображение
      if (markdownHighlightEnabled) {
        aiMessageDiv.innerHTML = formatThinkingAndAnswer(window.think, window.answer);
        addCopyButtonsToCodeBlocks(aiMessageDiv);
      } else {
        let displayText = '';
        if (window.think) {
          displayText += '**Мысли:**\n' + window.think + '\n\n';
        }
        displayText += window.answer;
        aiMessageDiv.textContent = displayText;
      }
      
      // Сохраняем AI сообщение в чат
      if (chats.length > 0) {
        let aiMessageText;
        if (markdownHighlightEnabled) {
          // Сохраняем оригинальный текст без HTML-разметки
          aiMessageText = window.answer;
          if (window.think) {
            aiMessageText = `<think>${window.think}</think>${aiMessageText}`;
          }
        } else {
          aiMessageText = window.answer;
          if (window.think) {
            aiMessageText = `**Мысли:**\n${window.think}\n\n${aiMessageText}`;
          }
        }
        
        chats[currentChatIndex].messages.push({
          text: aiMessageText,
          sender: 'ai',
          isMarkdown: markdownHighlightEnabled,
          timestamp: Date.now()
        });
        saveChats();
      }
    }
  } catch (err) {
    if (!stopped) {
      if (err.message === 'Request aborted') {
        aiMessageDiv.textContent = 'Ответ остановлен.';
      } else {
        aiMessageDiv.textContent = 'Ошибка: ' + err.message;
      }
    }
  }
  
  // Очищаем глобальные переменные
  window.currentAiMessageDiv = null;
  window.stopped = false;
  stopBtn.style.display = 'none';
});

const i18n = {
  en: {
    settings_title: 'Settings',
    settings_markdown: 'Markdown highlighting',
    settings_fontsize: 'Font size:',
    settings_lang: 'Language:',
    model_label: 'Model:',
    input_placeholder: 'Type a message...',
    send_btn: 'Send',
    stop_btn: 'Stop',
    about_title: 'About',
    about_text: 'Fllama 1.0 <br>Desktop chat on Electron for Ollama. <br>Version 1.0.0 <br> Author: ArduRadioKot(Alexander)',
    about_github: 'Project GitHub',
    about_ok: 'OK',
    download_model_btn: 'Download',
    models_title: 'Models',
    models_no_models: 'No models installed.',
    models_refresh: 'Refresh',
    models_download: 'Download',
    models_list: 'Installed models',
    models_available: 'Popular models for install',
    models_all_note: 'See all models on',
  },
  ru: {
    settings_title: 'Настройки',
    settings_markdown: 'Подсветка Markdown',
    settings_fontsize: 'Размер шрифта:',
    settings_lang: 'Язык:',
    model_label: 'Модель:',
    input_placeholder: 'Введите сообщение...',
    send_btn: 'Отправить',
    stop_btn: 'Стоп',
    about_title: 'О приложении',
    about_text: 'Fllama 1.0 <br>Десктоп-чат на Electron для Ollama. <br>Версия 1.0.0 <br> Автор: ArduRadioKot(Александр)',
    about_github: 'GitHub проекта',
    about_ok: 'ОК',
    download_model_btn: 'Скачать',
    models_title: 'Модели',
    models_no_models: 'Нет установленных моделей.',
    models_refresh: 'Обновить',
    models_download: 'Скачать',
    models_list: 'Установленные модели',
    models_available: 'Популярные модели для установки',
    models_all_note: 'Все модели доступны на',
  }
};
let currentLang = 'en';

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang][key]) el.innerHTML = i18n[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[currentLang][key]) el.setAttribute('placeholder', i18n[currentLang][key]);
  });
}

const POPULAR_MODELS = [
  'tinyllama', 'llama3.2', 'llama3.1', 'qwen3', 'gemma3', 'deepseek-r1', 'deepseek-coder', 'phi3', 'qwen2.5-coder'
];

const MODEL_INFOS = {
  'tinyllama': {
    en: {title: 'TinyLlama', desc: 'The TinyLlama project is an open endeavor to train a compact 1.1B Llama model on 3 trillion tokens.',
      readme: 'TinyLlama is a compact model with only 1.1B parameters. This compactness allows it to cater to a multitude of applications demanding a restricted computation and memory footprint.',
      variants: [
        {name: 'tinyllama:1.1b', size: '638MB', type: 'base'}
      ]},
    ru: {title: 'TinyLlama', desc: 'TinyLlama — открытый проект по обучению компактной модели Llama с 1,1 млрд параметров на 3 триллионах токенов.',
      readme: 'TinyLlama — компактная модель всего с 1,1 млрд параметров. Благодаря своей компактности она подходит для множества задач, где важны ограниченные вычислительные ресурсы и память.',
      variants: [
        {name: 'tinyllama:1.1b', size: '638MB', type: 'base'}
      ]}
  },
  'llama3.2': {
    en: {title: 'Llama 3.2', desc: 'Meta`s Llama 3.2 goes small with 1B and 3B models.',
      readme: 'The Meta Llama 3.2 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction-tuned generative models in 1B and 3B sizes (text in/text out). The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks. They outperform many of the available open source and closed chat models on common industry benchmarks.',
      variants: [
        {name: 'llama3.2:1b', size: '1.3GB', type: 'base'},
        {name: 'llama3.2:3b', size: '2GB', type: 'base'}
      ]},
    ru: {title: 'Llama 3.2', desc: 'Llama 3.2 от Meta — компактные модели на 1B и 3B параметров.',
      readme: 'Коллекция Meta Llama 3.2 — это многоязычные большие языковые модели (LLM), включающие предобученные и дообученные генеративные модели размером 1B и 3B параметров. Модели, дообученные для диалогов, оптимизированы для многоязычного общения, поиска и суммаризации. Они превосходят многие открытые и закрытые аналоги по отраслевым бенчмаркам.',
      variants: [
        {name: 'llama3.2:1b', size: '1.3GB', type: 'base'},
        {name: 'llama3.2:3b', size: '2GB', type: 'base'}
      ]}
  },
  'llama3.1': {
    en: {title: 'Llama 3.1', desc: 'Llama 3.1 is a new state-of-the-art model from Meta available in 8B, 70B and 405B parameter sizes.',
      readme: 'Llama 3.1 405B is the first openly available model that rivals the top AI models when it comes to state-of-the-art capabilities in general knowledge, steerability, math, tool use, and multilingual translation.',
      variants: [
        {name: 'llama3.1:8b', size: '4.9GB', type: 'base'},
      ]},
    ru: {title: 'Llama 3.1', desc: 'Llama 3.1 — новая передовая модель от Meta, доступная в версиях на 8B, 70B и 405B параметров.',
      readme: 'Llama 3.1 405B — первая открытая модель, сопоставимая с лучшими ИИ по возможностям в области знаний, управляемости, математики, работы с инструментами и многоязычного перевода.',
      variants: [
        {name: 'llama3.1:8b', size: '4.9GB', type: 'base'},
      ]}
  },
  'qwen3': {
    en: {title: 'Qwen3', desc: 'Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models.',
      readme: 'Qwen 3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. The flagship model, Qwen3-235B-A22B, achieves competitive results in benchmark evaluations of coding, math, general capabilities, etc., when compared to other top-tier models such as DeepSeek-R1, o1, o3-mini, Grok-3, and Gemini-2.5-Pro. Additionally, the small MoE model, Qwen3-30B-A3B, outcompetes QwQ-32B with 10 times of activated parameters, and even a tiny model like Qwen3-4B can rival the performance of Qwen2.5-72B-Instruct.',
      variants: [
        {name: 'qwen3:0.6b', size: '523MB', type: 'base'},
        {name: 'qwen3:1.7b', size: '1.4GB', type: 'base'},
        {name: 'qwen3:4b', size: '2.6GB', type: 'base'},
        {name: 'qwen3:14b', size: '5.2GB', type: 'base'}
      ]},
    ru: {title: 'Qwen3', desc: 'Qwen3 — последнее поколение больших языковых моделей серии Qwen, включающее плотные и Mixture-of-Experts (MoE) варианты.',
      readme: 'Qwen 3 — это новое поколение больших языковых моделей Qwen, включающее как плотные, так и MoE-модели. Флагман Qwen3-235B-A22B показывает конкурентные результаты в задачах программирования, математики и общего ИИ, соперничая с DeepSeek-R1, o1, o3-mini, Grok-3 и Gemini-2.5-Pro. Даже компактные модели серии Qwen3 могут конкурировать с более крупными аналогами.',
      variants: [
        {name: 'qwen3:0.6b', size: '523MB', type: 'base'},
        {name: 'qwen3:1.7b', size: '1.4GB', type: 'base'},
        {name: 'qwen3:4b', size: '2.6GB', type: 'base'},
        {name: 'qwen3:14b', size: '5.2GB', type: 'base'}
      ]}
  },
  'gemma3': {
    en: {title: 'Gemma 3', desc: 'The current, most capable model that runs on a single GPU.',
      readme: 'Gemma is a lightweight, family of models from Google built on Gemini technology. The Gemma 3 models are multimodal—processing text and images—and feature a 128K context window with support for over 140 languages. Available in 1B, 4B, 12B, and 27B parameter sizes, they excel in tasks like question answering, summarization, and reasoning, while their compact design allows deployment on resource-limited devices.',
      variants: [
        {name: 'gemma3:1b', size: '815MB', type: 'base'},
        {name: 'gemma3:4b', size: '3.3GB', type: 'base'},
        {name: 'gemma3:12b', size: '8.1GB', type: 'base'}
      ]},
    ru: {title: 'Gemma 3', desc: 'Gemma 3 — самая производительная модель, работающая на одной видеокарте.',
      readme: 'Gemma — семейство легковесных моделей от Google на базе технологий Gemini. Модели Gemma 3 являются мультимодальными (работают с текстом и изображениями), поддерживают контекст до 128К токенов и более 140 языков. Доступны варианты на 1B, 4B, 12B и 27B параметров. Отличаются высокой производительностью при компактных размерах, что позволяет запускать их даже на устройствах с ограниченными ресурсами.',
      variants: [
        {name: 'gemma3:1b', size: '815MB', type: 'base'},
        {name: 'gemma3:4b', size: '3.3GB', type: 'base'},
        {name: 'gemma3:12b', size: '8.1GB', type: 'base'}
      ]}
  },
  'deepseek-r1': {
    en: {title: 'DeepSeek R1', desc: 'DeepSeek-R1 is a family of open reasoning models with performance approaching that of leading models, such as O3 and Gemini 2.5 Pro.',
      readme: 'DeepSeek-R1 has received a minor version upgrade to DeepSeek-R1-0528 for the 8 billion parameter distilled model and the full 671 billion parameter model. In this update, DeepSeek R1 has significantly improved its reasoning and inference capabilities. The model has demonstrated outstanding performance across various benchmark evaluations, including mathematics, programming, and general logic. Its overall performance is now approaching that of leading models, such as O3 and Gemini 2.5 Pro.',
      variants: [
        {name: 'deepseek-r1:1.5b', size: '1.1GB', type: 'base'},
        {name: 'deepseek-r1:7b', size: '4.7GB', type: 'base'},
        {name: 'deepseek-r1:8b', size: '5.2GB', type: 'base'},
        {name: 'deepseek-r1:14b', size: '9.0GB', type: 'base'},
      ]},
    ru: {title: 'DeepSeek R1', desc: 'DeepSeek-R1 — семейство открытых моделей для рассуждений с производительностью, приближающейся к лидерам рынка.',
      readme: 'DeepSeek-R1 недавно обновилась до версии DeepSeek-R1-0528 для дистиллированной модели на 8B параметров и полной модели на 671B. В этом обновлении значительно улучшены способности к рассуждению и выводу. Модель показывает отличные результаты в бенчмарках по математике, программированию и логике, приближаясь к таким лидерам, как O3 и Gemini 2.5 Pro.',
      variants: [
        {name: 'deepseek-r1:1.5b', size: '1.1GB', type: 'base'},
        {name: 'deepseek-r1:7b', size: '4.7GB', type: 'base'},
        {name: 'deepseek-r1:8b', size: '5.2GB', type: 'base'},
        {name: 'deepseek-r1:14b', size: '9.0GB', type: 'base'},
      ]}
  },
  'deepseek-coder': {
    en: {title: 'DeepSeek Coder', desc: 'DeepSeek Coder is a capable coding model trained on two trillion code and natural language tokens.',
      readme: 'DeepSeek Coder is trained from scratch on both 87% code and 13% natural language in English and Chinese. Each of the models are pre-trained on 2 trillion tokens.',
      variants: [
        {name: 'deepseek-coder:1.3b', size: '776MB', type: 'base'},
        {name: 'deepseek-coder:6.7b', size: '3.8GB', type: 'base'},
      ]},
    ru: {title: 'DeepSeek Coder', desc: 'DeepSeek Coder — мощная модель для программирования, обученная на двух триллионах токенов кода и естественного языка.',
      readme: 'DeepSeek Coder обучена с нуля на 87% кода и 13% текстов на английском и китайском языках. Каждая из моделей предварительно обучена на 2 триллионах токенов.',
      variants: [
        {name: 'deepseek-coder:1.3b', size: '776MB', type: 'base'},
        {name: 'deepseek-coder:6.7b', size: '3.8GB', type: 'base'},
      ]}
  },
  'phi3': {
    en: {title: 'Phi-3', desc: 'Phi-3 is a family of lightweight 3B (Mini) and 14B (Medium) state-of-the-art open models by Microsoft.',
      readme: 'Phi-3 is a family of open AI models developed by Microsoft.',
      variants: [
        {name: 'phi3:mini', size: '2.2GB', type: 'base'},
        {name: 'phi3:medium', size: '7.9GB', type: 'base'}
      ]},
    ru: {title: 'Phi-3', desc: 'Phi-3 — семейство легковесных открытых моделей от Microsoft на 3B (Mini) и 14B (Medium) параметров.',
      readme: 'Phi-3 — семейство открытых ИИ-моделей, разработанных Microsoft.',
      variants: [
        {name: 'phi3:mini', size: '2.2GB', type: 'base'},
        {name: 'phi3:medium', size: '7.9GB', type: 'base'}
      ]}
  },
  'qwen2.5-coder': {
    en: {title: 'Qwen2.5 Coder', desc: 'The latest series of Code-Specific Qwen models, with significant improvements in code generation, code reasoning, and code fixing.',
      readme: 'Qwen 2.5 Coder series of models are now updated in 6 sizes: 0.5B, 1.5B, 3B, 7B, 14B and 32B. There are significant improvements in code generation, code reasoning and code fixing. The 32B model has competitive performance with OpenAI’s GPT-4o.',
      variants: [
        {name: 'qwen2.5-coder:0.5b', size: '398MB', type: 'base'},
        {name: 'qwen2.5-coder:1.5b', size: '986MB', type: 'base'},
        {name: 'qwen2.5-coder:3b', size: '1.9GB', type: 'base'},
        {name: 'qwen2.5-coder:7b', size: '4.7GB', type: 'base'},
        {name: 'qwen2.5-coder:14b', size: '9GB', type: 'base'},
      ]},
    ru: {title: 'Qwen2.5 Coder', desc: 'Qwen2.5 Coder — новейшая серия моделей Qwen, специализированных для кода, с заметными улучшениями генерации, рассуждений и исправления кода.',
      readme: 'Серия моделей Qwen 2.5 Coder теперь доступна в 6 размерах: 0.5B, 1.5B, 3B, 7B, 14B и 32B. Существенно улучшены генерация, рассуждения и исправление кода. Модель на 32B по качеству сопоставима с OpenAI GPT-4o.',
      variants: [
        {name: 'qwen2.5-coder:0.5b', size: '398MB', type: 'base'},
        {name: 'qwen2.5-coder:1.5b', size: '986MB', type: 'base'},
        {name: 'qwen2.5-coder:3b', size: '1.9GB', type: 'base'},
        {name: 'qwen2.5-coder:7b', size: '4.7GB', type: 'base'},
        {name: 'qwen2.5-coder:14b', size: '9GB', type: 'base'},
      ]}
  }
};

window.addEventListener('DOMContentLoaded', () => {
  loadModels();
  applyI18n();
  loadChats(); 

  // Обработчик создания нового чата
  document.getElementById('new-chat-btn').addEventListener('click', () => {
    createNewChat();
  });

  // Обработчик создания нового чата через вкладки
  document.getElementById('new-tab-btn').addEventListener('click', () => {
    createNewChat();
  });

  // Модальное окно настроек
  const modal = document.getElementById('modal-settings');
  const closeBtn = document.getElementById('close-settings');
  document.getElementById('open-settings-btn').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Обработчик для кнопки OK в настройках
  document.getElementById('close-settings-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Модальное окно информации
  const infoModal = document.getElementById('modal-info');
  const closeInfoBtn = document.getElementById('close-info');
  document.getElementById('open-info-btn').addEventListener('click', () => {
    infoModal.style.display = 'flex';
  });
  closeInfoBtn.addEventListener('click', () => {
    infoModal.style.display = 'none';
  });
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.style.display = 'none';
  });

  // Обработчик для открытия GitHub в системном браузере
  document.querySelector('a[href="https://github.com/ArduRadioKot/Fllama"]').addEventListener('click', (e) => {
    e.preventDefault();
    window.electronAPI.openExternal('https://github.com/ArduRadioKot/Fllama');
  });

  // Настройки: markdown highlight
  const toggleMarkdown = document.getElementById('toggle-markdown');
  const toggleMarkdownCheckbox = document.getElementById('toggle-markdown-checkbox');
  toggleMarkdown.checked = markdownHighlightEnabled;
  toggleMarkdownCheckbox.classList.toggle('checked', markdownHighlightEnabled);
  
  toggleMarkdownCheckbox.addEventListener('click', () => {
    toggleMarkdown.checked = !toggleMarkdown.checked;
    markdownHighlightEnabled = toggleMarkdown.checked;
    toggleMarkdownCheckbox.classList.toggle('checked', markdownHighlightEnabled);
  });
  
  toggleMarkdown.addEventListener('change', () => {
    markdownHighlightEnabled = toggleMarkdown.checked;
    toggleMarkdownCheckbox.classList.toggle('checked', markdownHighlightEnabled);
  });

  // Настройки: font size
  const fontSizeSelect = document.getElementById('font-size-select');
  fontSizeSelect.value = chatFontSize;
  fontSizeSelect.addEventListener('change', () => {
    chatFontSize = parseInt(fontSizeSelect.value, 10);
    document.querySelectorAll('.message').forEach(div => {
      div.style.fontSize = chatFontSize + 'px';
    });
  });

  // Настройки: language
  const langSelect = document.getElementById('lang-select');
  langSelect.value = currentLang;
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    applyI18n();
    document.getElementById('download-model-modal-btn').querySelector('span').textContent = i18n[currentLang].models_download;
    loadModelsList();
    renderPopularModels();
  });

  // Модальное окно моделей
  const modelsModal = document.getElementById('modal-models');
  const openModelsBtn = document.getElementById('open-models-btn');
  const closeModelsBtn = document.getElementById('close-models');
  const modelsList = document.getElementById('models-list');
  const refreshModelsBtn = document.getElementById('refresh-models-btn');
  const downloadModelInput = document.getElementById('download-model-input');
  const downloadModelModalBtn = document.getElementById('download-model-modal-btn');
  const modelsAvailableList = document.getElementById('models-available-list');

  async function loadModelsList() {
    modelsList.innerHTML = (currentLang === 'ru' ? 'Загрузка...' : 'Loading...');
    const models = await window.electronAPI.getModels();
    if (!models || !models.length) {
      modelsList.innerHTML = currentLang === 'ru' ? 'Нет установленных моделей.' : 'No models installed.';
      return;
    }
    modelsList.innerHTML = models.map(m => `
      <div class="models-list-item">
        <span class="model-icon"></span>${m}
        <button class="delete-model-btn" title="${currentLang === 'ru' ? 'Удалить модель' : 'Delete model'}" data-model="${m}">✖</button>
      </div>
    `).join('');
    // Добавляем обработчики удаления
    modelsList.querySelectorAll('.delete-model-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const model = btn.getAttribute('data-model');
        btn.disabled = true;
        btn.textContent = '...';
        try {
          const result = await window.electronAPI.deleteModel(model);
          if (result && result.success) {
            loadModelsList();
          } else {
            alert((result && result.error) || (currentLang === 'ru' ? 'Ошибка удаления.' : 'Delete error.'));
            btn.disabled = false;
            btn.textContent = '✖';
          }
        } catch (e) {
          alert(currentLang === 'ru' ? 'Ошибка удаления.' : 'Delete error.');
          btn.disabled = false;
          btn.textContent = '✖';
        }
      };
    });
  }

  function renderPopularModels() {
    modelsAvailableList.innerHTML = POPULAR_MODELS.map(m => `<span class="models-available-item" title="${m}">${m}</span>`).join('');
    modelsAvailableList.querySelectorAll('.models-available-item').forEach(el => {
      el.onclick = () => {
        const model = el.textContent;
        let info = MODEL_INFOS[model];
        if (!info && model.includes(':')) info = MODEL_INFOS[model.split(':')[0]];
        // Очищаем все поля
        document.getElementById('model-info-title').textContent = '';
        document.getElementById('model-info-desc').textContent = '';
        document.getElementById('model-info-readme').textContent = '';
        document.getElementById('model-info-variants').innerHTML = '';
        // Заполняем
        const title = info ? info[currentLang].title : model;
        const desc = info ? info[currentLang].desc : (currentLang === 'ru' ? 'Нет описания.' : 'No info.');
        const readme = info ? info[currentLang].readme : '';
        const variants = info ? (info[currentLang].variants || []) : [];
        document.getElementById('model-info-title').textContent = title;
        document.getElementById('model-info-desc').textContent = desc;
        document.getElementById('model-info-readme').textContent = readme;
        if (variants.length) {
          let table = '<table id="model-info-variants-table"><tr><th>Name</th><th>Size</th><th>Type</th></tr>';
          for (const v of variants) {
            table += `<tr><td>${v.name}</td><td>${v.size}</td><td>${v.type}</td></tr>`;
          }
          table += '</table>';
          document.getElementById('model-info-variants').innerHTML = table;
        }
        document.getElementById('modal-model-info').style.display = 'flex';
      };
    });
  }

  openModelsBtn.addEventListener('click', () => {
    modelsModal.style.display = 'flex';
    loadModelsList();
    renderPopularModels();
  });
  closeModelsBtn.addEventListener('click', () => {
    modelsModal.style.display = 'none';
  });
  modelsModal.addEventListener('click', (e) => {
    if (e.target === modelsModal) modelsModal.style.display = 'none';
  });
  refreshModelsBtn.addEventListener('click', loadModelsList);
  downloadModelModalBtn.addEventListener('click', async () => {
    const model = downloadModelInput.value.trim();
    if (!model) return;
    downloadModelModalBtn.disabled = true;
    downloadModelModalBtn.textContent = currentLang === 'ru' ? 'Скачивание...' : 'Downloading...';
    try {
      const result = await window.electronAPI.downloadModel(model);
      alert(result && result.success ? (currentLang === 'ru' ? 'Модель успешно скачана!' : 'Model downloaded!') : (result && result.error ? result.error : (currentLang === 'ru' ? 'Ошибка скачивания.' : 'Download error.')));
      loadModelsList();
    } catch (e) {
      alert(currentLang === 'ru' ? 'Ошибка скачивания.' : 'Download error.');
    }
    downloadModelModalBtn.disabled = false;
    downloadModelModalBtn.textContent = currentLang === 'ru' ? 'Скачать' : 'Download';
  });

  document.getElementById('close-model-info').onclick = () => {
    document.getElementById('modal-model-info').style.display = 'none';
  };
  document.getElementById('modal-model-info').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-model-info')) document.getElementById('modal-model-info').style.display = 'none';
  });
  
  // Инициализируем обработчик стриминга
  setupStreamHandler();
}); 