const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');

let ollamaProcess = null;

async function checkOllamaRunning() {
  try {
    await axios.get('http://localhost:11434/api/tags', { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(async () => {
  // Проверяем, запущен ли Ollama, но не запускаем его автоматически
  const ollamaRunning = await checkOllamaRunning();
  if (!ollamaRunning) {
    console.log('Ollama не запущен. Пользователь должен запустить его вручную.');
  }
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-models', async () => {
  try {
    const response = await axios.get('http://localhost:11434/api/tags');
    return response.data.models.map(m => m.name);
  } catch (err) {
    return [];
  }
});

ipcMain.handle('send-message', async (event, { message, model, signal }) => {
  try {
    // Создаём AbortController если signal передан
    let abortController = null;
    if (signal) {
      abortController = new AbortController();
      // Слушаем событие abort из renderer
      event.sender.on('abort-request', () => {
        abortController.abort();
      });
    }
    
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: model || 'llama3',
      messages: [
        { role: 'user', content: message }
      ],
      stream: true
    }, {
      responseType: 'stream',
      signal: abortController?.signal
    });
    
    let aiMsg = '';
    let think = '';
    let answer = '';
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              aiMsg += data.message.content;
              // Отправляем обновление в реальном времени
              event.sender.send('stream-update', { 
                content: data.message.content,
                fullMessage: aiMsg 
              });
            }
          } catch (e) {
            // Игнорируем невалидный JSON
          }
        }
      });
      
      response.data.on('end', () => {
        // Ищем мысли (<think>...</think>) и отделяем их
        const thinkMatch = aiMsg.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
          think = thinkMatch[1].trim();
          answer = aiMsg.replace(thinkMatch[0], '').trim();
        } else {
          answer = aiMsg;
        }
        resolve({ answer, think });
      });
      
      response.data.on('error', (err) => {
        if (err.name === 'AbortError') {
          reject(new Error('Request aborted'));
        } else {
          reject(err);
        }
      });
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return 'Request aborted';
    }
    return 'Ошибка: ' + (err.response?.data?.error || err.message);
  }
});

ipcMain.handle('download-model', async (event, model) => {
  return new Promise((resolve) => {
    const proc = spawn('ollama', ['pull', model]);
    let output = '';
    let error = '';
    proc.stdout.on('data', d => { output += d.toString(); });
    proc.stderr.on('data', d => { error += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve({ success: true, output });
      else resolve({ success: false, error: error || output });
    });
  });
});

ipcMain.handle('delete-model', async (event, model) => {
  return new Promise((resolve) => {
    const proc = spawn('ollama', ['rm', model]);
    let output = '';
    let error = '';
    proc.stdout.on('data', d => { output += d.toString(); });
    proc.stderr.on('data', d => { error += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve({ success: true, output });
      else resolve({ success: false, error: error || output });
    });
  });
}); 

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}); 