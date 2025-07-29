const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getModels: () => ipcRenderer.invoke('get-models'),
  sendMessage: (message, model, signal) => ipcRenderer.invoke('send-message', { message, model, signal }),
  downloadModel: (model) => ipcRenderer.invoke('download-model', model),
  onStreamUpdate: (callback) => ipcRenderer.on('stream-update', callback),
  abortRequest: () => ipcRenderer.send('abort-request'),
  deleteModel: (model) => ipcRenderer.invoke('delete-model', model),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
}); 