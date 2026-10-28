const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const modelSelect = document.getElementById("model-select");

let markdownHighlightEnabled = true;
let chatFontSize = 14;
let workspace = "chat";
let showThoughts = true;
let agentMode = false;
let currentProvider = "ollama";
let appSettings = {};
let backendState = "starting";
let activeRequestId = null;
let streamStopped = false;
let streamDiv = null;
let renderScheduled = false;
let pendingRender = null;
let settingsBound = false;
let persistChain = Promise.resolve();

// Система управления чатами
let chats = [];
let currentChatIndex = 0;

function createNewChat() {
  const newChat = {
    id: Date.now(),
    name: `Чат ${chats.length + 1}`,
    messages: [],
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
    if (workspace === "project") applyWorkspaceChrome();
  }
}

function updateChatDisplay() {
  // Очищаем чат
  chat.innerHTML = "";

  if (chats.length === 0) {
    if (workspace === "project") {
      updateTabsList();
      showProjectEmpty(true);
      return;
    }
    createNewChat();
    return;
  }
  showProjectEmpty(false);

  if (currentChatIndex < 0 || currentChatIndex >= chats.length)
    currentChatIndex = 0;
  const currentChat = chats[currentChatIndex];

  // Отображаем сообщения текущего чата
  currentChat.messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className = "message " + msg.sender;
    div.style.fontSize = chatFontSize + "px";

    if (msg.sender === "ai") {
      const raw = String(msg.text || "");
      const legacy = raw.match(/^\*\*Мысли:\*\*\n([\s\S]*?)\n\n([\s\S]*)$/);
      const parts = legacy
        ? { thinking: legacy[1].trim(), answer: legacy[2].trim() }
        : splitThoughts(raw, "");
      renderAiMessage(div, {
        thinking: parts.thinking,
        answer: parts.answer || (parts.thinking ? "" : raw),
        final: true,
      });
    } else if (msg.isMarkdown && markdownHighlightEnabled) {
      div.innerHTML = simpleMarkdown(msg.text);
      addCopyButtonsToCodeBlocks(div);
    } else if (msg.isMarkdown) {
      div.innerHTML = escapeHtml(msg.text).replace(/\n/g, "<br>");
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
  const tabsList = document.getElementById("tabs-list");
  tabsList.innerHTML = "";

  chats.forEach((chat, index) => {
    const tabItem = document.createElement("div");
    tabItem.className = `tab-item ${index === currentChatIndex ? "active" : ""}`;
    tabItem.innerHTML = `
      <span class="tab-name"></span>
      <button class="tab-close" type="button" title="${currentLang === "ru" ? "Закрыть" : "Close"}" data-tab-index="${index}">×</button>
    `;
    tabItem.querySelector(".tab-name").textContent = chat.name || "";

    tabItem.addEventListener("click", (e) => {
      if (!e.target.classList.contains("tab-close")) {
        switchToChat(index);
      }
    });

    const closeBtn = tabItem.querySelector(".tab-close");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(index);
    });

    tabsList.appendChild(tabItem);
  });
}

function deleteChat(index) {
  if (workspace === "chat" && chats.length <= 1) {
    alert(
      currentLang === "ru"
        ? "Нельзя удалить последний чат"
        : "Cannot delete the last chat",
    );
    return;
  }

  chats.splice(index, 1);

  if (chats.length === 0) {
    currentChatIndex = 0;
  } else if (currentChatIndex >= chats.length) {
    currentChatIndex = chats.length - 1;
  } else if (currentChatIndex > index) {
    currentChatIndex--;
  }

  updateChatDisplay();
  saveChats();
  if (workspace === "project") applyWorkspaceChrome();
}

function saveChats() {
  const key = workspace === "project" ? "fllama-projects" : "ollama-chats";
  const indexKey =
    workspace === "project" ? "fllama-project-index" : "ollama-current-chat";
  localStorage.setItem(key, JSON.stringify(chats));
  localStorage.setItem(indexKey, String(currentChatIndex));
  localStorage.setItem("fllama-workspace", workspace);
}

function readStore(mode) {
  const key = mode === "project" ? "fllama-projects" : "ollama-chats";
  const indexKey =
    mode === "project" ? "fllama-project-index" : "ollama-current-chat";
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    items = [];
  }
  if (!Array.isArray(items)) items = [];
  let index = parseInt(localStorage.getItem(indexKey) || "0", 10);
  if (!Number.isFinite(index)) index = 0;
  return { items, index };
}

function loadChats() {
  workspace =
    localStorage.getItem("fllama-workspace") === "project" ? "project" : "chat";
  const stored = readStore(workspace);
  chats = stored.items;
  currentChatIndex = stored.index;
  if (workspace === "chat" && chats.length === 0) createNewChat();
  else {
    if (currentChatIndex >= chats.length)
      currentChatIndex = Math.max(0, chats.length - 1);
    updateChatDisplay();
  }
  applyWorkspaceChrome();
}

function setWorkspace(next) {
  if (next === workspace) return;
  saveChats();
  workspace = next;
  const stored = readStore(next);
  chats = stored.items;
  currentChatIndex = stored.index;
  if (workspace === "chat" && chats.length === 0) createNewChat();
  else {
    if (currentChatIndex >= chats.length)
      currentChatIndex = Math.max(0, chats.length - 1);
    updateChatDisplay();
  }
  saveChats();
  applyWorkspaceChrome();
}

function showProjectEmpty(visible) {
  const empty = document.getElementById("project-empty");
  if (!empty) return;
  empty.style.display = visible ? "block" : "none";
  chat.style.display = visible ? "none" : "";
}

function applyWorkspaceChrome() {
  document
    .getElementById("mode-chat-btn")
    .classList.toggle("active", workspace === "chat");
  document
    .getElementById("mode-project-btn")
    .classList.toggle("active", workspace === "project");
  document
    .getElementById("project-panel")
    .classList.toggle("hidden", workspace !== "project");
  const project = workspace === "project" ? chats[currentChatIndex] : null;
  const pathEl = document.getElementById("project-path");
  pathEl.textContent =
    project && project.path ? "\u200E" + project.path + "\u200E" : "";
  pathEl.title = project && project.path ? project.path : "";
  if (workspace === "project" && project && project.path)
    loadProjectTree(project.path);
  else document.getElementById("project-tree").textContent = "";
  showProjectEmpty(workspace === "project" && chats.length === 0);
}

async function openProject() {
  const picked = await window.electronAPI.pickProject();
  if (!picked) return;
  if (workspace !== "project") setWorkspace("project");
  const existing = chats.findIndex((item) => item.path === picked);
  if (existing >= 0) {
    switchToChat(existing);
    return;
  }
  const name = picked.split(/[/\\]/).pop() || picked;
  chats.push({ id: Date.now(), name, path: picked, messages: [] });
  currentChatIndex = chats.length - 1;
  updateChatDisplay();
  saveChats();
  applyWorkspaceChrome();
}

async function loadProjectTree(root, path, container) {
  const host = container || document.getElementById("project-tree");
  if (!container) host.textContent = "";
  const entries = await window.electronAPI.listProject(root, path || ".");
  if (!entries || entries.error) {
    host.textContent = entries && entries.error ? entries.error : "";
    return;
  }
  entries.forEach((entry) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "tree-item " + (entry.type === "dir" ? "is-dir" : "is-file");
    row.innerHTML =
      '<span class="tree-chevron"></span><span class="tree-icon"></span><span class="tree-name"></span>';
    row.querySelector(".tree-name").textContent = entry.name;
    row.title = entry.path;
    const child = document.createElement("div");
    child.className = "tree-children";
    child.style.display = "none";
    row.addEventListener("click", async () => {
      document
        .querySelectorAll("#project-tree .tree-item.selected")
        .forEach((item) => item.classList.remove("selected"));
      row.classList.add("selected");
      if (entry.type === "dir") {
        const open = child.style.display === "none";
        child.style.display = open ? "block" : "none";
        row.classList.toggle("open", open);
        if (open && !child.dataset.loaded) {
          child.dataset.loaded = "1";
          await loadProjectTree(root, entry.path, child);
        }
      } else {
        const prefix =
          input.value && !input.value.endsWith(" ")
            ? input.value + " "
            : input.value;
        input.value = prefix + entry.path;
        input.focus();
      }
    });
    host.appendChild(row);
    if (entry.type === "dir") host.appendChild(child);
  });
}

function bindStream() {
  window.electronAPI.onStreamUpdate((_event, data) => {
    if (
      !data ||
      data.requestId !== activeRequestId ||
      streamStopped ||
      !streamDiv
    )
      return;
    if (streamDiv.dataset.done === "1") return;
    scheduleStreamRender(streamDiv, {
      thinking: data.thinking || "",
      answer: data.answer || "",
      activity: data.activity || "",
      thinkingOpen: !!data.thinkingOpen,
      final: false,
    });
  });
}

function scheduleStreamRender(div, state) {
  pendingRender = { div, state };
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    const job = pendingRender;
    pendingRender = null;
    if (!job || !job.div.isConnected || job.div.dataset.done === "1") return;
    renderAiMessage(job.div, job.state);
    const nearBottom =
      chat.scrollHeight - chat.scrollTop - chat.clientHeight < 140;
    if (nearBottom) chat.scrollTop = chat.scrollHeight;
  });
}

function renderAiMessage(div, state) {
  const thinking = showThoughts ? state.thinking || "" : "";
  const useMarkdown = !!state.final && markdownHighlightEnabled;
  let thoughtsEl = div.querySelector(":scope > .thoughts");
  let answerEl = div.querySelector(":scope > .answer-text");
  if (!answerEl) {
    div.textContent = "";
    answerEl = document.createElement("div");
    answerEl.className = "answer-text";
    div.appendChild(answerEl);
  }
  if (thinking) {
    if (!thoughtsEl) {
      thoughtsEl = document.createElement("details");
      thoughtsEl.className = "thoughts";
      thoughtsEl.open = true;
      const summary = document.createElement("summary");
      const body = document.createElement("div");
      body.className = "thinking-text plain";
      thoughtsEl.appendChild(summary);
      thoughtsEl.appendChild(body);
      div.insertBefore(thoughtsEl, answerEl);
    }
    thoughtsEl.querySelector("summary").textContent =
      state.thinkingOpen && !state.final
        ? currentLang === "ru"
          ? "Мысли…"
          : "Thinking…"
        : currentLang === "ru"
          ? "Мысли"
          : "Thoughts";
    const body = thoughtsEl.querySelector(".thinking-text");
    if (useMarkdown) {
      body.classList.remove("plain");
      body.innerHTML = simpleMarkdown(thinking);
    } else {
      body.classList.add("plain");
      body.textContent = thinking;
    }
  } else if (thoughtsEl) {
    thoughtsEl.remove();
  }
  let toolLog = div.querySelector(":scope > .tool-log");
  if (state.activity) {
    if (!toolLog) {
      toolLog = document.createElement("div");
      toolLog.className = "tool-log";
      div.insertBefore(toolLog, answerEl);
    }
    toolLog.textContent = state.activity;
  } else if (toolLog) {
    toolLog.remove();
  }
  if (!state.answer && !state.final) {
    answerEl.innerHTML =
      '<span class="thinking"><span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span></span>';
    return;
  }
  if (useMarkdown && state.answer) {
    answerEl.innerHTML = simpleMarkdown(state.answer);
    addCopyButtonsToCodeBlocks(div);
  } else {
    answerEl.textContent = state.answer || "";
  }
}

// --- Markdown парсер без сторонних библиотек ---
function simpleMarkdown(text) {
  return renderMarkdown(text);
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[tag],
  );
}

function addCopyButtonsToCodeBlocks() {}

function addMessage(text, sender, isMarkdown = false, saveToChat = true) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.style.fontSize = chatFontSize + "px";
  if (isMarkdown && markdownHighlightEnabled) {
    let html = simpleMarkdown(text);
    div.innerHTML = html;
  } else if (isMarkdown) {
    div.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
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
      timestamp: Date.now(),
    });
    saveChats();
  }
}

async function loadModels() {
  let models = [];
  try {
    models = await window.electronAPI.getModels();
  } catch {
    models = [];
  }
  const previous =
    modelSelect.value ||
    appSettings.lastModel ||
    appSettings.codexModel ||
    appSettings.claudeModel ||
    "";
  modelSelect.innerHTML = "";
  (models || []).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    modelSelect.appendChild(opt);
  });
  if (
    previous &&
    [...modelSelect.options].some((opt) => opt.value === previous)
  ) {
    modelSelect.value = previous;
  }
  if (!modelSelect.options.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = currentLang === "ru" ? "Нет моделей" : "No models";
    modelSelect.appendChild(opt);
  }
}

function projectPrompt() {
  return currentLang === "ru"
    ? 'Ты агент Fllama внутри открытой папки проекта. Можно смотреть и менять только её файлы и открывать обычные http/https страницы. Инструменты: list_dir, read_file, write_file, delete_path, search, fetch_url. Если отдельные вызовы недоступны, напиши ровно один блок <tool>{"name":"read_file","arguments":{"path":"относительный/путь"}}</tool> и дождись результата. Итоговый ответ пиши обычным текстом, без этого блока.'
    : 'You are the Fllama agent inside the open project folder. You may change only files in that folder and open normal http/https pages. Tools: list_dir, read_file, write_file, delete_path, search, fetch_url. If native tool calls are unavailable, emit exactly one block <tool>{"name":"read_file","arguments":{"path":"relative/path"}}</tool> and wait for the result. Write the final answer as normal text, without that block.';
}

function agentPrompt() {
  return currentLang === "ru"
    ? "Ты Fllama, локальный ИИ-агент. Скрытые рассуждения оставляй в канале мыслей, а итоговый ответ пиши отдельно на языке пользователя. Давай конкретные шаги и код. Не прячь окончательный ответ внутри мыслей."
    : "You are Fllama, a local AI agent. Keep private reasoning in the thinking channel and write the final answer separately, in the user's language. Prefer concrete steps and code. Do not hide the final answer inside thoughts.";
}

function buildMessages() {
  const messages = [];
  if (workspace === "project" && currentProvider !== "opencode")
    messages.push({ role: "system", content: projectPrompt() });
  else if (agentMode && workspace === "chat")
    messages.push({ role: "system", content: agentPrompt() });
  const saved = (chats[currentChatIndex]?.messages || []).slice(-16);
  for (const msg of saved) {
    const raw = String(msg.text || "");
    const content = (
      msg.sender === "ai" ? splitThoughts(raw, "").answer : raw
    ).trim();
    if (!content) continue;
    messages.push({
      role: msg.sender === "user" ? "user" : "assistant",
      content: content.slice(-8000),
    });
  }
  return messages;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (activeRequestId) return;
  const userMsg = input.value.trim();
  if (!userMsg) return;
  const model = modelSelect.value;
  if (
    workspace === "project" &&
    !(chats[currentChatIndex] && chats[currentChatIndex].path)
  ) {
    openProject();
    return;
  }
  if (!model) {
    addMessage(
      currentLang === "ru" ? "Выберите модель." : "Choose a model.",
      "ai",
      false,
      false,
    );
    return;
  }
  addMessage(userMsg, "user");
  input.value = "";

  const stopBtn = document.getElementById("stop-btn");
  stopBtn.style.display = "";
  streamStopped = false;
  const requestId = Date.now() + "-" + Math.random().toString(16).slice(2);
  activeRequestId = requestId;

  const aiMessageDiv = document.createElement("div");
  aiMessageDiv.className = "message ai";
  aiMessageDiv.style.fontSize = chatFontSize + "px";
  chat.appendChild(aiMessageDiv);
  streamDiv = aiMessageDiv;
  renderAiMessage(aiMessageDiv, {
    thinking: "",
    answer: "",
    thinkingOpen: true,
    final: false,
  });
  chat.scrollTop = chat.scrollHeight;

  stopBtn.onclick = () => {
    streamStopped = true;
    window.electronAPI.abortRequest(requestId);
    stopBtn.style.display = "none";
  };

  try {
    const result = await window.electronAPI.sendMessage({
      requestId,
      provider: currentProvider,
      model,
      messages: buildMessages(),
      showThoughts,
      workspace,
      projectPath:
        workspace === "project" ? chats[currentChatIndex].path || "" : "",
      lang: currentLang,
    });
    let thinking = (result && result.thinking) || "";
    let answer = (result && result.answer) || "";
    const activity = (result && result.activity) || "";
    const stopped = !!(result && result.aborted) || streamStopped;
    const failed = !!(
      result &&
      result.error &&
      !result.answer &&
      !result.thinking
    );
    const placeholderOnly =
      stopped && !(result && (result.answer || result.thinking));
    if (failed) {
      answer = (currentLang === "ru" ? "Ошибка: " : "Error: ") + result.error;
    } else if (placeholderOnly) {
      answer = currentLang === "ru" ? "Ответ остановлен." : "Response stopped.";
    }
    aiMessageDiv.dataset.done = "1";
    pendingRender = null;
    renderAiMessage(aiMessageDiv, { thinking, answer, activity, final: true });
    if (workspace === "project") applyWorkspaceChrome();
    if (!failed && !placeholderOnly && (answer || thinking) && chats.length) {
      chats[currentChatIndex].messages.push({
        text: thinking ? `<think>${thinking}</think>\n${answer}` : answer,
        sender: "ai",
        isMarkdown: true,
        timestamp: Date.now(),
      });
      saveChats();
    }
  } catch (err) {
    aiMessageDiv.dataset.done = "1";
    pendingRender = null;
    aiMessageDiv.textContent =
      (currentLang === "ru" ? "Ошибка: " : "Error: ") + (err.message || err);
  } finally {
    if (activeRequestId === requestId) activeRequestId = null;
    streamDiv = null;
    streamStopped = false;
    stopBtn.style.display = "none";
  }
});

const i18n = {
  en: {
    settings_title: "Settings",
    settings_markdown: "Format Markdown",
    settings_fontsize: "Font size:",
    settings_lang: "Language:",
    model_label: "Model:",
    input_placeholder: "Type a message...",
    send_btn: "Send",
    stop_btn: "Stop",
    about_title: "About",
    about_desc: "Desktop chat for Ollama and other local agents.",
    about_author: "Author: ArduRadioKot (Alexander)",
    about_github: "Project GitHub",
    about_ok: "OK",
    download_model_btn: "Download",
    models_title: "Models",
    models_no_models: "No models installed.",
    models_refresh: "Refresh",
    models_download: "Download",
    models_list: "Installed models",
    models_available: "Popular models for install",
    models_all_note: "See all models on",
    provider_label: "Provider:",
    agent_badge: "Agent",
    settings_group_ui: "Interface",
    settings_group_thoughts: "Thoughts",
    settings_group_ollama: "Ollama",
    settings_group_agent: "Fllama as an agent",
    settings_thoughts: "Show model thoughts",
    settings_thoughts_hint:
      "Thoughts stay separate from the answer, including while the model is still writing.",
    settings_autostart: "Start with Fllama",
    settings_autostart_hint:
      "If Fllama starts Ollama, it stops that process on quit. An Ollama you started yourself is left running.",
    settings_start_ollama: "Start Ollama",
    settings_lmstudio_hint:
      "Local server in LM Studio. Start the server there, then pick LM Studio above.",
    settings_base_url: "Base URL",
    settings_api_key: "API key",
    settings_model: "Model",
    settings_claude_hint:
      "Uses the Anthropic API. Claude Code can also call Fllama when the agent server below is on.",
    settings_agent_mode: "Agent mode in chat",
    settings_agent_server: "Local agent server",
    settings_port: "Port",
    settings_agent_model: "Agent model",
    settings_agent_model_hint:
      "Used when Codex, Claude Code or another client calls Fllama. Leave empty to trust the model name they send.",
    copy_agent_url: "Copy URL",
    project_open: "Open folder",
    project_title: "Project",
    models_install_hint:
      "Pick a model below or type its name, for example <code>llama3:8b</code>",
    project_empty:
      "Open a project folder. The agent can read and change its files and open web pages.",
    settings_username: "Username",
    settings_password: "Password",
    settings_opencode_hint:
      "Local opencode serve. In a project, OpenCode edits that folder itself. Chat stays a plain conversation.",
    settings_start_opencode: "Start OpenCode",
  },
  ru: {
    settings_title: "Настройки",
    settings_markdown: "Форматировать Markdown",
    settings_fontsize: "Размер шрифта:",
    settings_lang: "Язык:",
    model_label: "Модель:",
    input_placeholder: "Введите сообщение...",
    send_btn: "Отправить",
    stop_btn: "Стоп",
    about_title: "О приложении",
    about_desc: "Десктопный чат для Ollama и других локальных агентов.",
    about_author: "Автор: ArduRadioKot (Александр)",
    about_github: "GitHub проекта",
    about_ok: "ОК",
    download_model_btn: "Скачать",
    models_title: "Модели",
    models_no_models: "Нет установленных моделей.",
    models_refresh: "Обновить",
    models_download: "Скачать",
    models_list: "Установленные модели",
    models_available: "Популярные модели для установки",
    models_all_note: "Все модели доступны на",
    provider_label: "Провайдер:",
    agent_badge: "Агент",
    settings_group_ui: "Интерфейс",
    settings_group_thoughts: "Мысли",
    settings_group_ollama: "Ollama",
    settings_group_agent: "Fllama как агент",
    settings_thoughts: "Показывать мысли модели",
    settings_thoughts_hint:
      "Мысли остаются отдельно от ответа, в том числе пока модель ещё пишет.",
    settings_autostart: "Запускать вместе с Fllama",
    settings_autostart_hint:
      "Если Ollama запустил Fllama, он остановит этот процесс при выходе. Уже запущенный Ollama не трогается.",
    settings_start_ollama: "Запустить Ollama",
    settings_lmstudio_hint:
      "Локальный сервер LM Studio. Запустите сервер там и выберите LM Studio сверху.",
    settings_base_url: "Базовый URL",
    settings_api_key: "API-ключ",
    settings_model: "Модель",
    settings_claude_hint:
      "Работает через API Anthropic. Claude Code тоже может вызывать Fllama, если включён сервер агента ниже.",
    settings_agent_mode: "Режим агента в чате",
    settings_agent_server: "Локальный сервер агента",
    settings_port: "Порт",
    settings_agent_model: "Модель агента",
    settings_agent_model_hint:
      "Эту модель получат Codex, Claude Code и другие клиенты. Пусто — брать имя модели из их запроса.",
    copy_agent_url: "Копировать URL",
    project_open: "Открыть папку",
    project_title: "Проект",
    models_install_hint:
      "Выберите модель ниже или введите название, например <code>llama3:8b</code>",
    project_empty:
      "Откройте папку проекта. Агент сможет читать и менять её файлы и открывать страницы в интернете.",
    settings_username: "Имя пользователя",
    settings_password: "Пароль",
    settings_opencode_hint:
      "Локальный opencode serve. В проекте OpenCode сам правит эту папку. Обычный чат остаётся просто разговором.",
    settings_start_opencode: "Запустить OpenCode",
  },
};
let currentLang = "en";

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[currentLang][key]) el.innerHTML = i18n[currentLang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (i18n[currentLang][key])
      el.setAttribute("placeholder", i18n[currentLang][key]);
  });
  renderAgentHelp();
  const activePane = document.querySelector(".settings-nav-item.active");
  const heading = document.getElementById("settings-pane-heading");
  if (activePane && heading) heading.textContent = activePane.textContent.trim();
}

function loadUiPrefs() {
  try {
    const ui = JSON.parse(localStorage.getItem("fllama-ui") || "{}");
    if (typeof ui.markdown === "boolean")
      markdownHighlightEnabled = ui.markdown;
    if (ui.font) chatFontSize = parseInt(ui.font, 10) || chatFontSize;
    if (ui.lang === "ru" || ui.lang === "en") currentLang = ui.lang;
  } catch {
    // ignore broken local prefs
  }
}

function saveUiPrefs() {
  localStorage.setItem(
    "fllama-ui",
    JSON.stringify({
      markdown: markdownHighlightEnabled,
      font: chatFontSize,
      lang: currentLang,
    }),
  );
}

function renderAgentHelp() {
  const el = document.getElementById("agent-help");
  const portInput = document.getElementById("agent-port");
  if (!el || !portInput) return;
  const port = portInput.value || "11435";
  const origin = "http://127.0.0.1:" + port;
  const key = (document.getElementById("agent-api-key").value || "").trim();
  const keyText =
    key ||
    (currentLang === "ru" ? "любой (ключ не задан)" : "any value (no key set)");
  el.textContent =
    currentLang === "ru"
      ? `Codex, config.toml:\n  base_url = "${origin}/v1"\n  wire_api = "responses"\n\nClaude Code:\n  ANTHROPIC_BASE_URL=${origin}\n  ANTHROPIC_API_KEY=${keyText}\n\nLM Studio и другие OpenAI-клиенты:\n  ${origin}/v1`
      : `Codex, config.toml:\n  base_url = "${origin}/v1"\n  wire_api = "responses"\n\nClaude Code:\n  ANTHROPIC_BASE_URL=${origin}\n  ANTHROPIC_API_KEY=${keyText}\n\nLM Studio and other OpenAI clients:\n  ${origin}/v1`;
}

function renderStatus(status) {
  if (status && status.state) backendState = status.state;
  const el = document.getElementById("backend-status");
  if (!el) return;
  const provider = (status && status.provider) || currentProvider;
  const name =
    {
      ollama: "Ollama",
      lmstudio: "LM Studio",
      codex: "Codex",
      claude: "Claude Code",
      opencode: "OpenCode",
    }[provider] || provider;
  el.className =
    backendState === "ready"
      ? "ready"
      : backendState === "starting"
        ? "starting"
        : "error";
  if (backendState === "ready")
    el.textContent = name + (currentLang === "ru" ? " готов" : " ready");
  else if (backendState === "starting")
    el.textContent =
      (currentLang === "ru" ? "Запуск " : "Starting ") + name + "…";
  else if (status && status.error === "no-key")
    el.textContent =
      currentLang === "ru" ? "Нужен API-ключ" : "API key required";
  else if (status && status.error === "lmstudio-stopped")
    el.textContent =
      currentLang === "ru" ? "LM Studio не запущен" : "LM Studio is stopped";
  else if (status && status.error === "opencode-stopped")
    el.textContent =
      currentLang === "ru" ? "OpenCode не запущен" : "OpenCode is stopped";
  else if (
    backendState === "stopped" ||
    (status && status.error === "ollama-stopped")
  )
    el.textContent =
      name + (currentLang === "ru" ? " не запущен" : " is stopped");
  else {
    const text = String((status && status.error) || "")
      .replace(/\s+/g, " ")
      .trim();
    el.textContent = text
      ? text.slice(0, 90)
      : currentLang === "ru"
        ? "Нет соединения"
        : "Not connected";
  }
}

function renderAgentBadge() {
  const badge = document.getElementById("agent-badge");
  if (badge) badge.style.display = agentMode ? "" : "none";
}

function setToggle(inputId, boxId, value) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);
  if (!input || !box) return;
  input.checked = !!value;
  box.classList.toggle("checked", !!value);
}

function collectSettingsFromForm() {
  return {
    provider: document.getElementById("provider-select").value,
    ollamaUrl: document.getElementById("ollama-url").value.trim(),
    autoStartOllama: document.getElementById("toggle-autostart").checked,
    lmstudioUrl: document.getElementById("lmstudio-url").value.trim(),
    codexBaseUrl: document.getElementById("codex-base-url").value.trim(),
    codexApiKey: document.getElementById("codex-api-key").value.trim(),
    codexModel: document.getElementById("codex-model").value.trim(),
    claudeBaseUrl: document.getElementById("claude-base-url").value.trim(),
    claudeApiKey: document.getElementById("claude-api-key").value.trim(),
    claudeModel: document.getElementById("claude-model").value.trim(),
    opencodeUrl: document.getElementById("opencode-url").value.trim(),
    opencodeUsername: document.getElementById("opencode-username").value.trim(),
    opencodePassword: document.getElementById("opencode-password").value.trim(),
    autoStartOpenCode: document.getElementById("toggle-opencode-autostart")
      .checked,
    showThoughts: document.getElementById("toggle-thoughts").checked,
    agentMode: document.getElementById("toggle-agent-mode").checked,
    agentServerEnabled: document.getElementById("toggle-agent-server").checked,
    agentServerPort:
      parseInt(document.getElementById("agent-port").value, 10) || 11435,
    agentServerApiKey: document.getElementById("agent-api-key").value.trim(),
    agentModel: document.getElementById("agent-model").value.trim(),
    lastModel: modelSelect.value || appSettings.lastModel || "",
  };
}

function applySettingsToForm(settings) {
  appSettings = settings || {};
  currentProvider = appSettings.provider || "ollama";
  showThoughts = appSettings.showThoughts !== false;
  agentMode = !!appSettings.agentMode;
  document.getElementById("provider-select").value = currentProvider;
  document.getElementById("ollama-url").value =
    appSettings.ollamaUrl || "http://127.0.0.1:11434";
  document.getElementById("lmstudio-url").value =
    appSettings.lmstudioUrl || "http://127.0.0.1:1234/v1";
  document.getElementById("codex-base-url").value =
    appSettings.codexBaseUrl || "https://api.openai.com/v1";
  document.getElementById("codex-api-key").value =
    appSettings.codexApiKey || "";
  document.getElementById("codex-model").value = appSettings.codexModel || "";
  document.getElementById("claude-base-url").value =
    appSettings.claudeBaseUrl || "https://api.anthropic.com";
  document.getElementById("claude-api-key").value =
    appSettings.claudeApiKey || "";
  document.getElementById("claude-model").value = appSettings.claudeModel || "";
  document.getElementById("opencode-url").value =
    appSettings.opencodeUrl || "http://127.0.0.1:4096";
  document.getElementById("opencode-username").value =
    appSettings.opencodeUsername || "opencode";
  document.getElementById("opencode-password").value =
    appSettings.opencodePassword || "";
  document.getElementById("agent-port").value =
    appSettings.agentServerPort || 11435;
  document.getElementById("agent-api-key").value =
    appSettings.agentServerApiKey || "";
  document.getElementById("agent-model").value = appSettings.agentModel || "";
  setToggle("toggle-thoughts", "toggle-thoughts-checkbox", showThoughts);
  setToggle(
    "toggle-autostart",
    "toggle-autostart-checkbox",
    appSettings.autoStartOllama !== false,
  );
  setToggle("toggle-agent-mode", "toggle-agent-mode-checkbox", agentMode);
  setToggle(
    "toggle-agent-server",
    "toggle-agent-server-checkbox",
    !!appSettings.agentServerEnabled,
  );
  setToggle(
    "toggle-opencode-autostart",
    "toggle-opencode-autostart-checkbox",
    appSettings.autoStartOpenCode !== false,
  );
  renderAgentBadge();
  renderAgentHelp();
}

async function refreshIntegration() {
  const el = document.getElementById("integration-status");
  if (!el || !window.electronAPI.getIntegrationStatus) return;
  try {
    const info = await window.electronAPI.getIntegrationStatus();
    const yes = currentLang === "ru" ? "найден" : "found";
    const no = currentLang === "ru" ? "не найден" : "not found";
    const on = currentLang === "ru" ? "запущен" : "running";
    const off = currentLang === "ru" ? "не запущен" : "stopped";
    const agentLine =
      info.agent && info.agent.running
        ? (currentLang === "ru" ? "Агент: порт " : "Agent: port ") +
          info.agent.port
        : (currentLang === "ru" ? "Агент: выключен" : "Agent: off") +
          (info.agent && info.agent.error ? " · " + info.agent.error : "");
    el.textContent = [
      "Ollama: " +
        (info.ollamaRunning ? on : off) +
        (info.ollamaBin ? " · " + info.ollamaBin : ""),
      "LM Studio: " + (info.lmstudioRunning ? on : off),
      "Codex CLI: " + (info.codexBin ? yes : no),
      "Claude Code: " + (info.claudeBin ? yes : no),
      "OpenCode: " +
        (info.opencodeRunning ? on : off) +
        (info.opencodeBin ? " · " + info.opencodeBin : ""),
      agentLine,
    ].join("\n");
  } catch {
    el.textContent = "";
  }
}

function persistSettings() {
  const prevProvider = currentProvider;
  persistChain = persistChain
    .then(async () => {
      const patch = collectSettingsFromForm();
      if (patch.agentServerEnabled && !patch.agentModel && modelSelect.value) {
        patch.agentModel = modelSelect.value;
        document.getElementById("agent-model").value = patch.agentModel;
      }
      showThoughts = patch.showThoughts;
      agentMode = patch.agentMode;
      currentProvider = patch.provider;
      appSettings = { ...appSettings, ...patch };
      renderAgentBadge();
      renderAgentHelp();
      const result = await window.electronAPI.saveSettings(patch);
      if (result && result.settings) {
        appSettings = result.settings;
        [
          "ollama-url",
          "lmstudio-url",
          "codex-base-url",
          "claude-base-url",
          "opencode-url",
        ].forEach((id) => {
          const el = document.getElementById(id);
          const key = {
            "ollama-url": "ollamaUrl",
            "lmstudio-url": "lmstudioUrl",
            "codex-base-url": "codexBaseUrl",
            "claude-base-url": "claudeBaseUrl",
            "opencode-url": "opencodeUrl",
          }[id];
          if (el && document.activeElement !== el && appSettings[key])
            el.value = appSettings[key];
        });
      }
      if (result && result.backend) renderStatus(result.backend);
      if (patch.provider !== prevProvider) await loadModels();
      if (!activeRequestId) updateChatDisplay();
      refreshIntegration();
    })
    .catch(() => {});
  return persistChain;
}

function bindSettingsForm() {
  if (settingsBound) return;
  settingsBound = true;
  const save = () => persistSettings();
  document.getElementById("provider-select").addEventListener("change", save);
  document.getElementById("model-select").addEventListener("change", () => {
    const model = modelSelect.value;
    if (currentProvider === "codex")
      document.getElementById("codex-model").value = model;
    if (currentProvider === "claude")
      document.getElementById("claude-model").value = model;
    save();
  });
  [
    "ollama-url",
    "lmstudio-url",
    "codex-base-url",
    "codex-api-key",
    "codex-model",
    "claude-base-url",
    "claude-api-key",
    "claude-model",
    "opencode-url",
    "opencode-username",
    "opencode-password",
    "agent-port",
    "agent-api-key",
    "agent-model",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("change", save);
  });
  bindToggle("toggle-thoughts", "toggle-thoughts-checkbox", save);
  bindToggle("toggle-autostart", "toggle-autostart-checkbox", save);
  bindToggle("toggle-agent-mode", "toggle-agent-mode-checkbox", save);
  bindToggle("toggle-agent-server", "toggle-agent-server-checkbox", save);
  bindToggle(
    "toggle-opencode-autostart",
    "toggle-opencode-autostart-checkbox",
    save,
  );
  document
    .getElementById("restart-opencode-btn")
    .addEventListener("click", async () => {
      const btn = document.getElementById("restart-opencode-btn");
      btn.disabled = true;
      try {
        const status = await window.electronAPI.restartOpenCode();
        if (currentProvider === "opencode" && status) renderStatus(status);
        await loadModels();
        refreshIntegration();
      } finally {
        btn.disabled = false;
      }
    });
  document
    .getElementById("restart-ollama-btn")
    .addEventListener("click", async () => {
      const btn = document.getElementById("restart-ollama-btn");
      btn.disabled = true;
      try {
        const status = await window.electronAPI.restartOllama();
        if (currentProvider === "ollama" && status) renderStatus(status);
        await loadModels();
        refreshIntegration();
      } finally {
        btn.disabled = false;
      }
    });
  document
    .getElementById("copy-agent-url")
    .addEventListener("click", async () => {
      const port = document.getElementById("agent-port").value || "11435";
      try {
        await navigator.clipboard.writeText("http://127.0.0.1:" + port + "/v1");
      } catch {
        // clipboard can be unavailable until the window is focused
      }
    });
}

function bindToggle(inputId, boxId, onChange) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);
  const flip = () => {
    input.checked = !input.checked;
    box.classList.toggle("checked", input.checked);
    if (onChange) onChange();
  };
  box.addEventListener("click", flip);
  input.addEventListener("change", () => {
    box.classList.toggle("checked", input.checked);
    if (onChange) onChange();
  });
}

async function initBackend() {
  try {
    applySettingsToForm(await window.electronAPI.getSettings());
  } catch {
    applySettingsToForm({});
  }
  bindSettingsForm();
  try {
    renderStatus(await window.electronAPI.getBackendStatus());
  } catch {
    renderStatus({ state: "starting", provider: currentProvider });
  }
  window.electronAPI.onBackendStatus((_event, status) => {
    renderStatus(status);
    if (status && status.state === "ready") loadModels();
  });
  await loadModels();
  updateChatDisplay();
  refreshIntegration();
}

const POPULAR_MODELS = [
  "tinyllama",
  "llama3.2",
  "llama3.1",
  "qwen3",
  "gemma3",
  "deepseek-r1",
  "deepseek-coder",
  "phi3",
  "qwen2.5-coder",
];

const MODEL_INFOS = {
  tinyllama: {
    en: {
      title: "TinyLlama",
      desc: "The TinyLlama project is an open endeavor to train a compact 1.1B Llama model on 3 trillion tokens.",
      readme:
        "TinyLlama is a compact model with only 1.1B parameters. This compactness allows it to cater to a multitude of applications demanding a restricted computation and memory footprint.",
      variants: [{ name: "tinyllama:1.1b", size: "638MB", type: "base" }],
    },
    ru: {
      title: "TinyLlama",
      desc: "TinyLlama — открытый проект по обучению компактной модели Llama с 1,1 млрд параметров на 3 триллионах токенов.",
      readme:
        "TinyLlama — компактная модель всего с 1,1 млрд параметров. Благодаря своей компактности она подходит для множества задач, где важны ограниченные вычислительные ресурсы и память.",
      variants: [{ name: "tinyllama:1.1b", size: "638MB", type: "base" }],
    },
  },
  "llama3.2": {
    en: {
      title: "Llama 3.2",
      desc: "Meta`s Llama 3.2 goes small with 1B and 3B models.",
      readme:
        "The Meta Llama 3.2 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction-tuned generative models in 1B and 3B sizes (text in/text out). The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks. They outperform many of the available open source and closed chat models on common industry benchmarks.",
      variants: [
        { name: "llama3.2:1b", size: "1.3GB", type: "base" },
        { name: "llama3.2:3b", size: "2GB", type: "base" },
      ],
    },
    ru: {
      title: "Llama 3.2",
      desc: "Llama 3.2 от Meta — компактные модели на 1B и 3B параметров.",
      readme:
        "Коллекция Meta Llama 3.2 — это многоязычные большие языковые модели (LLM), включающие предобученные и дообученные генеративные модели размером 1B и 3B параметров. Модели, дообученные для диалогов, оптимизированы для многоязычного общения, поиска и суммаризации. Они превосходят многие открытые и закрытые аналоги по отраслевым бенчмаркам.",
      variants: [
        { name: "llama3.2:1b", size: "1.3GB", type: "base" },
        { name: "llama3.2:3b", size: "2GB", type: "base" },
      ],
    },
  },
  "llama3.1": {
    en: {
      title: "Llama 3.1",
      desc: "Llama 3.1 is a new state-of-the-art model from Meta available in 8B, 70B and 405B parameter sizes.",
      readme:
        "Llama 3.1 405B is the first openly available model that rivals the top AI models when it comes to state-of-the-art capabilities in general knowledge, steerability, math, tool use, and multilingual translation.",
      variants: [{ name: "llama3.1:8b", size: "4.9GB", type: "base" }],
    },
    ru: {
      title: "Llama 3.1",
      desc: "Llama 3.1 — новая передовая модель от Meta, доступная в версиях на 8B, 70B и 405B параметров.",
      readme:
        "Llama 3.1 405B — первая открытая модель, сопоставимая с лучшими ИИ по возможностям в области знаний, управляемости, математики, работы с инструментами и многоязычного перевода.",
      variants: [{ name: "llama3.1:8b", size: "4.9GB", type: "base" }],
    },
  },
  qwen3: {
    en: {
      title: "Qwen3",
      desc: "Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models.",
      readme:
        "Qwen 3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. The flagship model, Qwen3-235B-A22B, achieves competitive results in benchmark evaluations of coding, math, general capabilities, etc., when compared to other top-tier models such as DeepSeek-R1, o1, o3-mini, Grok-3, and Gemini-2.5-Pro. Additionally, the small MoE model, Qwen3-30B-A3B, outcompetes QwQ-32B with 10 times of activated parameters, and even a tiny model like Qwen3-4B can rival the performance of Qwen2.5-72B-Instruct.",
      variants: [
        { name: "qwen3:0.6b", size: "523MB", type: "base" },
        { name: "qwen3:1.7b", size: "1.4GB", type: "base" },
        { name: "qwen3:4b", size: "2.6GB", type: "base" },
        { name: "qwen3:14b", size: "5.2GB", type: "base" },
      ],
    },
    ru: {
      title: "Qwen3",
      desc: "Qwen3 — последнее поколение больших языковых моделей серии Qwen, включающее плотные и Mixture-of-Experts (MoE) варианты.",
      readme:
        "Qwen 3 — это новое поколение больших языковых моделей Qwen, включающее как плотные, так и MoE-модели. Флагман Qwen3-235B-A22B показывает конкурентные результаты в задачах программирования, математики и общего ИИ, соперничая с DeepSeek-R1, o1, o3-mini, Grok-3 и Gemini-2.5-Pro. Даже компактные модели серии Qwen3 могут конкурировать с более крупными аналогами.",
      variants: [
        { name: "qwen3:0.6b", size: "523MB", type: "base" },
        { name: "qwen3:1.7b", size: "1.4GB", type: "base" },
        { name: "qwen3:4b", size: "2.6GB", type: "base" },
        { name: "qwen3:14b", size: "5.2GB", type: "base" },
      ],
    },
  },
  gemma3: {
    en: {
      title: "Gemma 3",
      desc: "The current, most capable model that runs on a single GPU.",
      readme:
        "Gemma is a lightweight, family of models from Google built on Gemini technology. The Gemma 3 models are multimodal—processing text and images—and feature a 128K context window with support for over 140 languages. Available in 1B, 4B, 12B, and 27B parameter sizes, they excel in tasks like question answering, summarization, and reasoning, while their compact design allows deployment on resource-limited devices.",
      variants: [
        { name: "gemma3:1b", size: "815MB", type: "base" },
        { name: "gemma3:4b", size: "3.3GB", type: "base" },
        { name: "gemma3:12b", size: "8.1GB", type: "base" },
      ],
    },
    ru: {
      title: "Gemma 3",
      desc: "Gemma 3 — самая производительная модель, работающая на одной видеокарте.",
      readme:
        "Gemma — семейство легковесных моделей от Google на базе технологий Gemini. Модели Gemma 3 являются мультимодальными (работают с текстом и изображениями), поддерживают контекст до 128К токенов и более 140 языков. Доступны варианты на 1B, 4B, 12B и 27B параметров. Отличаются высокой производительностью при компактных размерах, что позволяет запускать их даже на устройствах с ограниченными ресурсами.",
      variants: [
        { name: "gemma3:1b", size: "815MB", type: "base" },
        { name: "gemma3:4b", size: "3.3GB", type: "base" },
        { name: "gemma3:12b", size: "8.1GB", type: "base" },
      ],
    },
  },
  "deepseek-r1": {
    en: {
      title: "DeepSeek R1",
      desc: "DeepSeek-R1 is a family of open reasoning models with performance approaching that of leading models, such as O3 and Gemini 2.5 Pro.",
      readme:
        "DeepSeek-R1 has received a minor version upgrade to DeepSeek-R1-0528 for the 8 billion parameter distilled model and the full 671 billion parameter model. In this update, DeepSeek R1 has significantly improved its reasoning and inference capabilities. The model has demonstrated outstanding performance across various benchmark evaluations, including mathematics, programming, and general logic. Its overall performance is now approaching that of leading models, such as O3 and Gemini 2.5 Pro.",
      variants: [
        { name: "deepseek-r1:1.5b", size: "1.1GB", type: "base" },
        { name: "deepseek-r1:7b", size: "4.7GB", type: "base" },
        { name: "deepseek-r1:8b", size: "5.2GB", type: "base" },
        { name: "deepseek-r1:14b", size: "9.0GB", type: "base" },
      ],
    },
    ru: {
      title: "DeepSeek R1",
      desc: "DeepSeek-R1 — семейство открытых моделей для рассуждений с производительностью, приближающейся к лидерам рынка.",
      readme:
        "DeepSeek-R1 недавно обновилась до версии DeepSeek-R1-0528 для дистиллированной модели на 8B параметров и полной модели на 671B. В этом обновлении значительно улучшены способности к рассуждению и выводу. Модель показывает отличные результаты в бенчмарках по математике, программированию и логике, приближаясь к таким лидерам, как O3 и Gemini 2.5 Pro.",
      variants: [
        { name: "deepseek-r1:1.5b", size: "1.1GB", type: "base" },
        { name: "deepseek-r1:7b", size: "4.7GB", type: "base" },
        { name: "deepseek-r1:8b", size: "5.2GB", type: "base" },
        { name: "deepseek-r1:14b", size: "9.0GB", type: "base" },
      ],
    },
  },
  "deepseek-coder": {
    en: {
      title: "DeepSeek Coder",
      desc: "DeepSeek Coder is a capable coding model trained on two trillion code and natural language tokens.",
      readme:
        "DeepSeek Coder is trained from scratch on both 87% code and 13% natural language in English and Chinese. Each of the models are pre-trained on 2 trillion tokens.",
      variants: [
        { name: "deepseek-coder:1.3b", size: "776MB", type: "base" },
        { name: "deepseek-coder:6.7b", size: "3.8GB", type: "base" },
      ],
    },
    ru: {
      title: "DeepSeek Coder",
      desc: "DeepSeek Coder — мощная модель для программирования, обученная на двух триллионах токенов кода и естественного языка.",
      readme:
        "DeepSeek Coder обучена с нуля на 87% кода и 13% текстов на английском и китайском языках. Каждая из моделей предварительно обучена на 2 триллионах токенов.",
      variants: [
        { name: "deepseek-coder:1.3b", size: "776MB", type: "base" },
        { name: "deepseek-coder:6.7b", size: "3.8GB", type: "base" },
      ],
    },
  },
  phi3: {
    en: {
      title: "Phi-3",
      desc: "Phi-3 is a family of lightweight 3B (Mini) and 14B (Medium) state-of-the-art open models by Microsoft.",
      readme: "Phi-3 is a family of open AI models developed by Microsoft.",
      variants: [
        { name: "phi3:mini", size: "2.2GB", type: "base" },
        { name: "phi3:medium", size: "7.9GB", type: "base" },
      ],
    },
    ru: {
      title: "Phi-3",
      desc: "Phi-3 — семейство легковесных открытых моделей от Microsoft на 3B (Mini) и 14B (Medium) параметров.",
      readme: "Phi-3 — семейство открытых ИИ-моделей, разработанных Microsoft.",
      variants: [
        { name: "phi3:mini", size: "2.2GB", type: "base" },
        { name: "phi3:medium", size: "7.9GB", type: "base" },
      ],
    },
  },
  "qwen2.5-coder": {
    en: {
      title: "Qwen2.5 Coder",
      desc: "The latest series of Code-Specific Qwen models, with significant improvements in code generation, code reasoning, and code fixing.",
      readme:
        "Qwen 2.5 Coder series of models are now updated in 6 sizes: 0.5B, 1.5B, 3B, 7B, 14B and 32B. There are significant improvements in code generation, code reasoning and code fixing. The 32B model has competitive performance with OpenAI’s GPT-4o.",
      variants: [
        { name: "qwen2.5-coder:0.5b", size: "398MB", type: "base" },
        { name: "qwen2.5-coder:1.5b", size: "986MB", type: "base" },
        { name: "qwen2.5-coder:3b", size: "1.9GB", type: "base" },
        { name: "qwen2.5-coder:7b", size: "4.7GB", type: "base" },
        { name: "qwen2.5-coder:14b", size: "9GB", type: "base" },
      ],
    },
    ru: {
      title: "Qwen2.5 Coder",
      desc: "Qwen2.5 Coder — новейшая серия моделей Qwen, специализированных для кода, с заметными улучшениями генерации, рассуждений и исправления кода.",
      readme:
        "Серия моделей Qwen 2.5 Coder теперь доступна в 6 размерах: 0.5B, 1.5B, 3B, 7B, 14B и 32B. Существенно улучшены генерация, рассуждения и исправление кода. Модель на 32B по качеству сопоставима с OpenAI GPT-4o.",
      variants: [
        { name: "qwen2.5-coder:0.5b", size: "398MB", type: "base" },
        { name: "qwen2.5-coder:1.5b", size: "986MB", type: "base" },
        { name: "qwen2.5-coder:3b", size: "1.9GB", type: "base" },
        { name: "qwen2.5-coder:7b", size: "4.7GB", type: "base" },
        { name: "qwen2.5-coder:14b", size: "9GB", type: "base" },
      ],
    },
  },
};

window.addEventListener("DOMContentLoaded", async () => {
  loadUiPrefs();
  applyI18n();
  loadChats();
  bindStream();

  document
    .getElementById("mode-chat-btn")
    .addEventListener("click", () => setWorkspace("chat"));
  document
    .getElementById("mode-project-btn")
    .addEventListener("click", () => setWorkspace("project"));
  document
    .getElementById("open-project-btn")
    .addEventListener("click", openProject);
  document
    .getElementById("project-empty-open")
    .addEventListener("click", openProject);

  document.getElementById("new-chat-btn").addEventListener("click", () => {
    if (workspace === "project") openProject();
    else createNewChat();
  });

  document.getElementById("new-tab-btn").addEventListener("click", () => {
    if (workspace === "project") openProject();
    else createNewChat();
  });

  // Модальное окно настроек
  const modal = document.getElementById("modal-settings");
  const closeBtn = document.getElementById("close-settings");
  document.getElementById("open-settings-btn").addEventListener("click", () => {
    modal.style.display = "flex";
    refreshIntegration();
    renderAgentHelp();
  });
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Обработчик для кнопки OK в настройках
  document
    .getElementById("close-settings-btn")
    .addEventListener("click", () => {
      modal.style.display = "none";
    });

  // Модальное окно информации
  const infoModal = document.getElementById("modal-info");
  const closeInfoBtn = document.getElementById("close-info");
  document.getElementById("open-info-btn").addEventListener("click", () => {
    infoModal.style.display = "flex";
  });
  const hideInfo = () => {
    infoModal.style.display = "none";
  };
  closeInfoBtn.addEventListener("click", hideInfo);
  document.getElementById("close-info-x").addEventListener("click", hideInfo);
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) hideInfo();
  });

  document.getElementById("about-github").addEventListener("click", () => {
    window.electronAPI.openExternal("https://github.com/ArduRadioKot/Fllama");
  });

  document.getElementById("settings-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".settings-nav-item");
    if (!btn) return;
    document.querySelectorAll(".settings-nav-item").forEach((item) => {
      item.classList.toggle("active", item === btn);
    });
    document.querySelectorAll(".settings-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.dataset.pane === btn.dataset.pane);
    });
    const heading = document.getElementById("settings-pane-heading");
    if (heading) heading.textContent = btn.textContent.trim();
  });

  document.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest(".copy-code-btn");
    if (copyBtn) {
      const code = copyBtn.closest(".md-code-outer")?.querySelector("code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        copyBtn.classList.add("copied");
        setTimeout(() => copyBtn.classList.remove("copied"), 1200);
      } catch {
        // clipboard can be unavailable until the window is focused
      }
      return;
    }
    const link = e.target.closest("a.md-link");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (!/^https?:|^mailto:/i.test(href)) return;
    e.preventDefault();
    window.electronAPI.openExternal(href);
  });

  // Настройки: markdown highlight
  const toggleMarkdown = document.getElementById("toggle-markdown");
  const toggleMarkdownCheckbox = document.getElementById(
    "toggle-markdown-checkbox",
  );
  toggleMarkdown.checked = markdownHighlightEnabled;
  toggleMarkdownCheckbox.classList.toggle("checked", markdownHighlightEnabled);

  toggleMarkdownCheckbox.addEventListener("click", () => {
    toggleMarkdown.checked = !toggleMarkdown.checked;
    markdownHighlightEnabled = toggleMarkdown.checked;
    toggleMarkdownCheckbox.classList.toggle(
      "checked",
      markdownHighlightEnabled,
    );
    saveUiPrefs();
    if (!activeRequestId) updateChatDisplay();
  });

  toggleMarkdown.addEventListener("change", () => {
    markdownHighlightEnabled = toggleMarkdown.checked;
    toggleMarkdownCheckbox.classList.toggle(
      "checked",
      markdownHighlightEnabled,
    );
    saveUiPrefs();
    if (!activeRequestId) updateChatDisplay();
  });

  // Настройки: font size
  const fontSizeSelect = document.getElementById("font-size-select");
  fontSizeSelect.value = chatFontSize;
  fontSizeSelect.addEventListener("change", () => {
    chatFontSize = parseInt(fontSizeSelect.value, 10);
    document.querySelectorAll(".message").forEach((div) => {
      div.style.fontSize = chatFontSize + "px";
    });
    saveUiPrefs();
  });

  // Настройки: language
  const langSelect = document.getElementById("lang-select");
  langSelect.value = currentLang;
  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    applyI18n();
    saveUiPrefs();
    renderStatus({ state: backendState, provider: currentProvider });
    document
      .getElementById("download-model-modal-btn")
      .querySelector("span").textContent = i18n[currentLang].models_download;
    loadModelsList();
    renderPopularModels();
    if (!activeRequestId) updateChatDisplay();
  });

  // Модальное окно моделей
  const modelsModal = document.getElementById("modal-models");
  const openModelsBtn = document.getElementById("open-models-btn");
  const closeModelsBtn = document.getElementById("close-models");
  const modelsList = document.getElementById("models-list");
  const refreshModelsBtn = document.getElementById("refresh-models-btn");
  const downloadModelInput = document.getElementById("download-model-input");
  const downloadModelModalBtn = document.getElementById(
    "download-model-modal-btn",
  );
  const modelsAvailableList = document.getElementById("models-available-list");

  async function loadModelsList() {
    modelsList.innerHTML = currentLang === "ru" ? "Загрузка..." : "Loading...";
    const models = await window.electronAPI.getModels();
    if (!models || !models.length) {
      modelsList.innerHTML =
        currentLang === "ru"
          ? "Нет установленных моделей."
          : "No models installed.";
      return;
    }
    modelsList.innerHTML = models
      .map(
        (m) => `
      <div class="models-list-item">
        <span class="model-icon"></span><span class="model-name">${escapeHtml(m)}</span>
        <button class="delete-model-btn" type="button" title="${currentLang === "ru" ? "Удалить модель" : "Delete model"}" data-model="${escapeHtml(m)}">×</button>
      </div>
    `,
      )
      .join("");
    // Добавляем обработчики удаления
    modelsList.querySelectorAll(".delete-model-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const model = btn.getAttribute("data-model");
        btn.disabled = true;
        btn.textContent = "...";
        try {
          const result = await window.electronAPI.deleteModel(model);
          if (result && result.success) {
            loadModelsList();
          } else {
            alert(
              (result && result.error) ||
                (currentLang === "ru" ? "Ошибка удаления." : "Delete error."),
            );
            btn.disabled = false;
            btn.textContent = "×";
          }
        } catch (e) {
          alert(currentLang === "ru" ? "Ошибка удаления." : "Delete error.");
          btn.disabled = false;
          btn.textContent = "×";
        }
      };
    });
  }

  function renderPopularModels() {
    modelsAvailableList.innerHTML = POPULAR_MODELS.map(
      (m) => `<span class="models-available-item" title="${m}">${m}</span>`,
    ).join("");
    modelsAvailableList
      .querySelectorAll(".models-available-item")
      .forEach((el) => {
        el.onclick = () => {
          const model = el.textContent;
          let info = MODEL_INFOS[model];
          if (!info && model.includes(":"))
            info = MODEL_INFOS[model.split(":")[0]];
          // Очищаем все поля
          document.getElementById("model-info-title").textContent = "";
          document.getElementById("model-info-desc").textContent = "";
          document.getElementById("model-info-readme").textContent = "";
          document.getElementById("model-info-variants").innerHTML = "";
          // Заполняем
          const title = info ? info[currentLang].title : model;
          const desc = info
            ? info[currentLang].desc
            : currentLang === "ru"
              ? "Нет описания."
              : "No info.";
          const readme = info ? info[currentLang].readme : "";
          const variants = info ? info[currentLang].variants || [] : [];
          document.getElementById("model-info-title").textContent = title;
          document.getElementById("model-info-desc").textContent = desc;
          document.getElementById("model-info-readme").textContent = readme;
          if (variants.length) {
            let table =
              '<table id="model-info-variants-table"><tr><th>Name</th><th>Size</th><th>Type</th></tr>';
            for (const v of variants) {
              table += `<tr><td>${v.name}</td><td>${v.size}</td><td>${v.type}</td></tr>`;
            }
            table += "</table>";
            document.getElementById("model-info-variants").innerHTML = table;
          }
          document.getElementById("modal-model-info").style.display = "flex";
        };
      });
  }

  openModelsBtn.addEventListener("click", () => {
    modelsModal.style.display = "flex";
    loadModelsList();
    renderPopularModels();
  });
  closeModelsBtn.addEventListener("click", () => {
    modelsModal.style.display = "none";
  });
  modelsModal.addEventListener("click", (e) => {
    if (e.target === modelsModal) modelsModal.style.display = "none";
  });
  refreshModelsBtn.addEventListener("click", loadModelsList);
  downloadModelModalBtn.addEventListener("click", async () => {
    const model = downloadModelInput.value.trim();
    if (!model) return;
    downloadModelModalBtn.disabled = true;
    downloadModelModalBtn.textContent =
      currentLang === "ru" ? "Скачивание..." : "Downloading...";
    try {
      const result = await window.electronAPI.downloadModel(model);
      alert(
        result && result.success
          ? currentLang === "ru"
            ? "Модель успешно скачана!"
            : "Model downloaded!"
          : result && result.error
            ? result.error
            : currentLang === "ru"
              ? "Ошибка скачивания."
              : "Download error.",
      );
      loadModelsList();
    } catch (e) {
      alert(currentLang === "ru" ? "Ошибка скачивания." : "Download error.");
    }
    downloadModelModalBtn.disabled = false;
    downloadModelModalBtn.textContent =
      currentLang === "ru" ? "Скачать" : "Download";
  });

  document.getElementById("close-model-info").onclick = () => {
    document.getElementById("modal-model-info").style.display = "none";
  };
  document.getElementById("modal-model-info").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-model-info"))
      document.getElementById("modal-model-info").style.display = "none";
  });

  await initBackend();
});
