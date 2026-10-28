const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { getSettings, saveSettings } = require("./settings-store");
const {
  ensureOllama,
  stopOllamaIfWeStarted,
  ollamaEnv,
  findInPath,
  pingOllama,
  probeUrl,
} = require("./ollama-service");
const { streamChat, listModels, openAIBase, isAbort } = require("./providers");
const { createAgentServer } = require("./agent-server");
const { runAgentLoop } = require("./agent-loop");
const { listDirectory } = require("./project-tools");
const {
  ensureOpenCode,
  stopOpenCodeIfWeStarted,
  pingOpenCode,
} = require("./opencode-service");

const active = new Map();
let lastStatus = { state: "starting", provider: "ollama", running: false };

const agent = createAgentServer({
  getSettings,
  streamChat,
  listModels,
});

function publish(status) {
  lastStatus = status;
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send("backend-status", status);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 720,
    minHeight: 520,
    show: false,
    backgroundColor: "#1e1e1e",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.webContents.on("did-finish-load", () => {
    if (!win.isDestroyed()) win.webContents.send("backend-status", lastStatus);
  });
  win.loadFile(path.join(__dirname, "index.html"));
  return win;
}

async function refreshBackend(settings) {
  if (settings.provider === "ollama") {
    if (settings.autoStartOllama) return ensureOllama(settings);
    const running = await pingOllama(settings.ollamaUrl);
    return {
      running,
      state: running ? "ready" : "stopped",
      provider: "ollama",
      startedByUs: false,
    };
  }
  if (settings.provider === "lmstudio") {
    const running = await probeUrl(
      openAIBase(settings.lmstudioUrl) + "/models",
      900,
    );
    return {
      running,
      state: running ? "ready" : "stopped",
      provider: "lmstudio",
      error: running ? null : "lmstudio-stopped",
    };
  }
  if (settings.provider === "codex") {
    const ok = !!settings.codexApiKey;
    return {
      running: ok,
      state: ok ? "ready" : "error",
      provider: "codex",
      error: ok ? null : "no-key",
    };
  }
  if (settings.provider === "opencode") {
    if (settings.autoStartOpenCode) return ensureOpenCode(settings);
    const healthy = await pingOpenCode(settings.opencodeUrl, settings);
    return {
      running: healthy.running,
      state: healthy.running ? "ready" : "stopped",
      provider: "opencode",
      error: healthy.running ? null : "opencode-stopped",
    };
  }
  const ok = !!settings.claudeApiKey;
  return {
    running: ok,
    state: ok ? "ready" : "error",
    provider: "claude",
    error: ok ? null : "no-key",
  };
}

app.whenReady().then(() => {
  const settings = getSettings();
  lastStatus = {
    state: "starting",
    provider: settings.provider,
    running: false,
  };
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  (async () => {
    try {
      if (settings.provider === "ollama" && settings.autoStartOllama) {
        publish(await ensureOllama(settings));
      } else if (
        settings.provider === "opencode" &&
        settings.autoStartOpenCode
      ) {
        publish(await ensureOpenCode(settings));
      } else {
        publish(await refreshBackend(settings));
      }
      if (settings.agentServerEnabled) await agent.start();
    } catch (error) {
      publish({
        state: "error",
        provider: settings.provider,
        running: false,
        error: error.message,
      });
    }
  })();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  for (const controller of active.values()) controller.abort();
  agent.stop();
  stopOllamaIfWeStarted();
  stopOpenCodeIfWeStarted();
});

ipcMain.handle("get-settings", () => getSettings());
ipcMain.handle("get-backend-status", () => lastStatus);
ipcMain.handle("get-agent-info", () => agent.info());

ipcMain.handle("save-settings", async (_event, patch) => {
  const prev = getSettings();
  const next = saveSettings(patch || {});
  const backendChanged = [
    "provider",
    "ollamaUrl",
    "autoStartOllama",
    "lmstudioUrl",
    "codexApiKey",
    "claudeApiKey",
    "codexBaseUrl",
    "claudeBaseUrl",
    "opencodeUrl",
    "opencodePassword",
    "autoStartOpenCode",
  ].some((key) => prev[key] !== next[key]);
  if (backendChanged) {
    publish({ state: "starting", provider: next.provider, running: false });
    try {
      publish(await refreshBackend(next));
    } catch (error) {
      publish({
        state: "error",
        provider: next.provider,
        running: false,
        error: error.message,
      });
    }
  }
  const agentChanged = [
    "agentServerEnabled",
    "agentServerPort",
    "agentServerApiKey",
  ].some((key) => prev[key] !== next[key]);
  if (agentChanged) await agent.start();
  return { settings: getSettings(), backend: lastStatus, agent: agent.info() };
});

ipcMain.handle("restart-opencode", async () => {
  const settings = getSettings();
  if (settings.provider === "opencode") {
    publish({ state: "starting", provider: "opencode", running: false });
  }
  const status = await ensureOpenCode({ ...settings, autoStartOpenCode: true });
  if (settings.provider === "opencode") publish(status);
  return status;
});

ipcMain.handle("restart-ollama", async () => {
  const settings = getSettings();
  if (settings.provider === "ollama") {
    publish({ state: "starting", provider: "ollama", running: false });
  }
  const status = await ensureOllama({ ...settings, autoStartOllama: true });
  if (settings.provider === "ollama") publish(status);
  return status;
});

ipcMain.handle("get-integration-status", async () => {
  const settings = getSettings();
  const [ollamaRunning, lmstudioRunning] = await Promise.all([
    pingOllama(settings.ollamaUrl, 700),
    probeUrl(openAIBase(settings.lmstudioUrl) + "/models", 700),
  ]);
  return {
    ollamaBin: findInPath("ollama"),
    ollamaRunning,
    lmstudioRunning,
    claudeBin: findInPath("claude"),
    codexBin: findInPath("codex"),
    opencodeBin: findInPath("opencode"),
    opencodeRunning: (await pingOpenCode(settings.opencodeUrl, settings))
      .running,
    agent: agent.info(),
  };
});

ipcMain.handle("get-models", async () => {
  try {
    return await listModels(getSettings());
  } catch {
    return [];
  }
});

ipcMain.handle("send-message", async (event, payload = {}) => {
  const requestId = payload.requestId
    ? String(payload.requestId)
    : String(Date.now());
  const controller = new AbortController();
  active.set(requestId, controller);
  const settings = getSettings();
  let thinking = "";
  let answer = "";
  let activity = "";
  const provider = payload.provider || settings.provider;
  const projectWork =
    payload.workspace === "project" &&
    payload.projectPath &&
    provider !== "opencode";
  try {
    const run = projectWork ? runAgentLoop : streamChat;
    const result = await run({
      streamChat,
      provider,
      settings,
      model: payload.model,
      messages: payload.messages || [],
      tools: payload.tools,
      showThoughts: payload.showThoughts !== false,
      signal: controller.signal,
      projectRoot: payload.projectPath,
      directory: payload.workspace === "project" ? payload.projectPath : "",
      lang: payload.lang || "ru",
      onDelta: (delta) => {
        thinking = delta.thinking || "";
        answer = delta.answer || "";
        activity = delta.activity || activity;
        if (!event.sender.isDestroyed()) {
          event.sender.send("stream-update", {
            requestId,
            thinking,
            answer,
            activity,
            thinkingOpen: !!delta.thinkingOpen,
          });
        }
      },
    });
    return {
      answer: result.answer || answer,
      thinking: result.thinking || thinking,
      activity: result.activity || activity,
    };
  } catch (error) {
    if (isAbort(error) || controller.signal.aborted) {
      return { answer, thinking, activity, aborted: true };
    }
    return {
      answer,
      thinking,
      activity,
      error: error.message || "Ошибка запроса",
    };
  } finally {
    active.delete(requestId);
  }
});

ipcMain.on("abort-request", (_event, requestId) => {
  const controller = active.get(String(requestId));
  if (controller) controller.abort();
});

function runOllama(args) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    let proc;
    try {
      proc = spawn(findInPath("ollama") || "ollama", args, {
        env: ollamaEnv(),
        windowsHide: true,
      });
    } catch (error) {
      done({ success: false, error: error.message });
      return;
    }
    let output = "";
    let error = "";
    proc.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      error += chunk.toString();
    });
    proc.on("error", (err) => done({ success: false, error: err.message }));
    proc.on("close", (code) => {
      if (code === 0) done({ success: true, output });
      else done({ success: false, error: error || output || "Код " + code });
    });
  });
}

ipcMain.handle("download-model", async (_event, model) => {
  const settings = getSettings();
  if (settings.autoStartOllama) await ensureOllama(settings);
  return runOllama(["pull", model]);
});

ipcMain.handle("delete-model", async (_event, model) => {
  const settings = getSettings();
  if (settings.autoStartOllama) await ensureOllama(settings);
  return runOllama(["rm", model]);
});

ipcMain.handle("pick-project", async () => {
  const win =
    BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle("list-project", async (_event, payload = {}) => {
  if (!payload.root) return [];
  try {
    return listDirectory(payload.root, payload.path || ".");
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("open-external", async (_event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
