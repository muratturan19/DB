const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openGuidelines: () => ipcRenderer.invoke('guidelines:open'),
  resetGuidelines: () => ipcRenderer.invoke('guidelines:reset'),
  openPrompts: () => ipcRenderer.invoke('prompts:open'),
  resetPrompts: () => ipcRenderer.invoke('prompts:reset'),
  openConfig: () => ipcRenderer.invoke('config:open'),
});

