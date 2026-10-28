const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getModels: () => ipcRenderer.invoke('get-models'),
  sendMessage: (payload) => ipcRenderer.invoke('send-message', payload),
  downloadModel: (model) => ipcRenderer.invoke('download-model', model),
  onStreamUpdate: (callback) => ipcRenderer.on('stream-update', callback),
  abortRequest: (requestId) => ipcRenderer.send('abort-request', requestId),
  deleteModel: (model) => ipcRenderer.invoke('delete-model', model),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (patch) => ipcRenderer.invoke('save-settings', patch),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  onBackendStatus: (callback) => ipcRenderer.on('backend-status', callback),
  restartOllama: () => ipcRenderer.invoke('restart-ollama'),
  restartOpenCode: () => ipcRenderer.invoke('restart-opencode'),
  getIntegrationStatus: () => ipcRenderer.invoke('get-integration-status'),
  getAgentInfo: () => ipcRenderer.invoke('get-agent-info'),
  pickProject: () => ipcRenderer.invoke('pick-project'),
  listProject: (root, path) => ipcRenderer.invoke('list-project', { root, path }),
});
